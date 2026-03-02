import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { sendWineryOrderEmail } from '@/lib/email';

interface OrderItem {
  product_id: string;
  winery_id: string;
  format_liters: number;
  qty: number;
  unit_price_eur: number;
}

interface ShippingAddress {
  name?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

interface CheckoutData {
  items: OrderItem[];
  shipping_address: ShippingAddress;
  shipping_method: 'ocean' | 'air_express' | 'sail_cargo';
  options: {
    wooden_case?: boolean;
    summer_protected?: boolean;
    free_storage?: boolean;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify user session
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CheckoutData = await request.json();
    const { items, shipping_address, shipping_method, options } = body;

    // Validate required fields
    if (!items || items.length === 0 || !shipping_address || !shipping_method) {
      return NextResponse.json(
        { error: 'Missing required fields: items, shipping_address, shipping_method' },
        { status: 400 }
      );
    }

    // Check for blocked states
    const blockedStates = ['MS', 'SD', 'UT'];
    const stateCode = shipping_address.state?.toUpperCase();
    if (stateCode && blockedStates.includes(stateCode)) {
      return NextResponse.json(
        { error: `Delivery not available in ${shipping_address.state}` },
        { status: 400 }
      );
    }

    // Get shipping quote
    const shippingResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/shipping/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destination: {
          country: shipping_address.country,
          state: shipping_address.state,
          postal_code: shipping_address.postal_code
        },
        items,
        shipping_method,
        options
      })
    });

    if (!shippingResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to calculate shipping' },
        { status: 500 }
      );
    }

    const shippingQuote = await shippingResponse.json();

    // Find or create group order
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (20 * 24 * 60 * 60 * 1000)); // 20 days
    
    // Check for existing active group order for same user + address
    const { data: existingGroupOrders } = await supabase
      .from('group_orders')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .lt('expires_at', now.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    let groupOrder;
    if (existingGroupOrders && existingGroupOrders.length > 0) {
      groupOrder = existingGroupOrders[0];
    } else {
      // Create new group order
      const { data: newGroupOrder, error: groupError } = await supabase
        .from('group_orders')
        .insert({
          user_id: user.id,
          shipping_address: shipping_address,
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (groupError) {
        console.error('Group order creation error:', groupError);
        return NextResponse.json(
          { error: 'Failed to create group order' },
          { status: 500 }
        );
      }
      groupOrder = newGroupOrder;
    }

    // Calculate total wine value
    const wineValue = items.reduce((sum, item) => sum + (item.unit_price_eur * item.qty), 0);

    // Create parent order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        group_order_id: groupOrder.id,
        shipping_method,
        shipping_quote: shippingQuote,
        wine_value_eur: wineValue,
        insurance_eur: shippingQuote.breakdown.insurance,
        tariff_eur: shippingQuote.breakdown.tariff,
        tariff_percent: 15.0,
        state_fees_eur: shippingQuote.breakdown.state_fees,
        total_eur: shippingQuote.total,
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Group items by winery for sub-orders
    const itemsByWinery: { [key: string]: OrderItem[] } = items.reduce((acc: { [key: string]: OrderItem[] }, item: OrderItem) => {
      if (!acc[item.winery_id]) acc[item.winery_id] = [];
      acc[item.winery_id].push(item);
      return acc;
    }, {});

    const suborders = [];
    const emailPromises = [];

    // Create sub-order for each winery
    for (const [winery_id, wineryItems] of Object.entries(itemsByWinery)) {
      const wineryValue = wineryItems.reduce((sum: number, item: OrderItem) => sum + (item.unit_price_eur * item.qty), 0);
      
      // Calculate small batch fee for this winery
      const totalQty = wineryItems.reduce((sum: number, item: OrderItem) => sum + item.qty, 0);
      const hasMagnums = wineryItems.some((item: OrderItem) => item.format_liters === 1.5);
      const smallBatchFee = ((totalQty < 6 && !hasMagnums) || (hasMagnums && totalQty < 3)) ? 23 : 0;

      // Get winery info
      const { data: winery } = await supabase
        .from('wineries')
        .select('name, order_email')
        .eq('id', winery_id)
        .single();

      if (!winery) {
        console.error('Winery not found:', winery_id);
        continue;
      }

      // Create sub-order
      const { data: suborder, error: suborderError } = await supabase
        .from('order_suborders')
        .insert({
          order_id: order.id,
          winery_id,
          items: wineryItems,
          wine_value_eur: wineryValue,
          small_batch_fee_eur: smallBatchFee,
          status: 'pending'
        })
        .select(`
          *,
          winery:wineries(name, order_email)
        `)
        .single();

      if (suborderError) {
        console.error('Suborder creation error:', suborderError);
        continue;
      }

      suborders.push(suborder);

      // Prepare and send email to winery
      const emailData = {
        suborder: {
          id: suborder.id,
          items: wineryItems.map((item: OrderItem) => ({
            ...item,
            name: `Product ${item.product_id}` // In real app, fetch product name
          })),
          wine_value_eur: wineryValue,
          small_batch_fee_eur: smallBatchFee
        },
        winery: {
          name: winery.name,
          order_email: winery.order_email
        },
        groupOrder: {
          id: groupOrder.id,
          expires_at: groupOrder.expires_at
        },
        customer: {
          name: shipping_address.name,
          email: user.email || '',
          phone: shipping_address.phone,
          address: shipping_address
        },
        shippingMethod: shipping_method,
        shippingOptions: options
      };

      // Send email (async, don't wait for completion)
      emailPromises.push(
        sendWineryOrderEmail(emailData).then(emailResult => {
          // Log email result
          supabase
            .from('email_log')
            .insert({
              suborder_id: suborder.id,
              to_email: winery.order_email,
              provider: 'resend',
              status: emailResult.success ? 'sent' : 'failed',
              error: emailResult.error
            });
        })
      );
    }

    // Wait for all emails to be processed
    await Promise.allSettled(emailPromises);

    return NextResponse.json({
      success: true,
      order_id: order.id,
      group_order_id: groupOrder.id,
      suborders: suborders.map(so => ({
        id: so.id,
        winery_id: so.winery_id,
        winery_name: so.winery?.name,
        wine_value_eur: so.wine_value_eur,
        small_batch_fee_eur: so.small_batch_fee_eur,
        status: so.status
      })),
      shipping_quote: shippingQuote,
      total: shippingQuote.total
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
