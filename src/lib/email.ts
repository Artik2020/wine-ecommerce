import { Resend } from 'resend';

interface WineryOrderEmailData {
  suborder: {
    id: string;
    items: Array<{
      product_id: string;
      name: string;
      format_liters: number;
      qty: number;
      unit_price_eur: number;
    }>;
    wine_value_eur: number;
    small_batch_fee_eur: number;
  };
  winery: {
    name: string;
    order_email: string;
  };
  groupOrder: {
    id: string;
    expires_at: string;
  };
  customer: {
    name?: string;
    email: string;
    phone?: string;
    address: any;
  };
  shippingMethod: string;
  shippingOptions: {
    wooden_case?: boolean;
    summer_protected?: boolean;
    free_storage?: boolean;
  };
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWineryOrderEmail(data: WineryOrderEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    // Format items for email
    const itemsList = data.suborder.items.map(item => 
      `${item.name} (${item.format_liters}L) - Qty: ${item.qty} - €${item.unit_price_eur.toFixed(2)} each = €${(item.unit_price_eur * item.qty).toFixed(2)}`
    ).join('\n');

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d97706; margin-bottom: 20px;">New Order Received</h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #333;">Order Information</h3>
          <p><strong>Group Order ID:</strong> ${data.groupOrder.id}</p>
          <p><strong>Suborder ID:</strong> ${data.suborder.id}</p>
          <p><strong>Consolidation Window Ends:</strong> ${new Date(data.groupOrder.expires_at).toLocaleDateString()}</p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #333;">Customer Information</h3>
          <p><strong>Name:</strong> ${data.customer.name || 'Not provided'}</p>
          <p><strong>Email:</strong> ${data.customer.email}</p>
          ${data.customer.phone ? `<p><strong>Phone:</strong> ${data.customer.phone}</p>` : ''}
          <p><strong>Shipping Address:</strong></p>
          <div style="margin-left: 20px; color: #666;">
            ${data.customer.address ? Object.entries(data.customer.address).map(([key, value]) => 
              `<div>${key}: ${value}</div>`
            ).join('') : 'Address not provided'}
          </div>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #333;">Order Items</h3>
          <div style="background: white; padding: 15px; border-radius: 4px; border: 1px solid #dee2e6;">
            ${itemsList}
          </div>
          <p style="margin-top: 15px;"><strong>Wine Value:</strong> €${data.suborder.wine_value_eur.toFixed(2)}</p>
          ${data.suborder.small_batch_fee_eur > 0 ? `<p><strong>Small Batch Fee:</strong> €${data.suborder.small_batch_fee_eur.toFixed(2)}</p>` : ''}
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #333;">Shipping Information</h3>
          <p><strong>Shipping Method:</strong> ${data.shippingMethod}</p>
          <p><strong>Wooden Case:</strong> ${data.shippingOptions.wooden_case ? 'Yes (+€29/case)' : 'No'}</p>
          <p><strong>Summer Protected:</strong> ${data.shippingOptions.summer_protected ? 'Yes (+€53/case)' : 'No'}</p>
          <p><strong>Free Storage:</strong> ${data.shippingOptions.free_storage ? 'Yes (delayed shipping)' : 'No'}</p>
        </div>

        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin-top: 20px;">
          <p style="margin: 0; color: #856404;"><strong>Important:</strong> This is part of a grouped order. The consolidation window ends on ${new Date(data.groupOrder.expires_at).toLocaleDateString()}. Please prepare the items for consolidated shipping.</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #666; font-size: 12px;">
          <p>This is an automated order notification from Champagne House Platform.</p>
          <p>Please process this order within 2 business days.</p>
        </div>
      </div>
    `;

    const { data: emailData, error } = await resend.emails.send({
      from: 'orders@champagnehouse.com',
      to: [data.winery.order_email],
      subject: `New Order – GroupOrder ${data.groupOrder.id} – Suborder ${data.suborder.id}`,
      html: emailContent,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    console.log('Email sent successfully to:', data.winery.order_email);
    return { success: true };

  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
