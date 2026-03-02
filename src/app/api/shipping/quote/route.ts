import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

// Type definitions
interface ShippingItem {
  product_id: string;
  winery_id: string;
  format_liters: number;
  qty: number;
  unit_price_eur: number;
}

interface ShippingDestination {
  country: string;
  state?: string;
  postal_code: string;
}

interface ShippingOptions {
  wooden_case?: boolean;
  summer_protected?: boolean;
  free_storage?: boolean;
}

interface ShippingTier {
  min: number;
  max: number;
  fee: number;
}

interface ShippingTariffs {
  [key: string]: {
    '0.75': ShippingTier[];
    '1.5': ShippingTier[];
  };
}

interface StateFee {
  per_case?: number;
  percentage?: number;
  blocked?: boolean;
  message?: string;
  description?: string;
}

interface StateFees {
  [key: string]: StateFee;
}

// Shipping tariff tables from Cote d'Or Imports 2025
const SHIPPING_TARIFFS: ShippingTariffs = {
  ocean: {
    '0.75': [ // 0.75L bottles
      { min: 1, max: 6, fee: 45 },
      { min: 7, max: 12, fee: 65 },
      { min: 13, max: 18, fee: 85 },
      { min: 19, max: 24, fee: 105 },
      { min: 25, max: 30, fee: 125 },
      { min: 31, max: 36, fee: 145 },
      { min: 37, max: 42, fee: 165 },
      { min: 43, max: 48, fee: 185 },
      { min: 49, max: 54, fee: 205 },
      { min: 55, max: 60, fee: 225 },
      { min: 61, max: 66, fee: 245 },
      { min: 67, max: 72, fee: 265 },
      { min: 73, max: 78, fee: 285 },
      { min: 79, max: 84, fee: 305 },
      { min: 85, max: 90, fee: 325 },
      { min: 91, max: 96, fee: 345 },
      { min: 97, max: 102, fee: 365 },
      { min: 103, max: 108, fee: 385 },
      { min: 109, max: 114, fee: 405 },
      { min: 115, max: 120, fee: 425 }
    ],
    '1.5': [ // 1.5L magnums
      { min: 1, max: 3, fee: 45 },
      { min: 4, max: 6, fee: 65 },
      { min: 7, max: 9, fee: 85 },
      { min: 10, max: 12, fee: 105 },
      { min: 13, max: 15, fee: 125 },
      { min: 16, max: 18, fee: 145 },
      { min: 19, max: 21, fee: 165 },
      { min: 22, max: 24, fee: 185 },
      { min: 25, max: 27, fee: 205 },
      { min: 28, max: 30, fee: 225 },
      { min: 31, max: 33, fee: 245 },
      { min: 34, max: 36, fee: 265 },
      { min: 37, max: 39, fee: 285 },
      { min: 40, max: 42, fee: 305 },
      { min: 43, max: 45, fee: 325 },
      { min: 46, max: 48, fee: 345 },
      { min: 49, max: 51, fee: 365 },
      { min: 52, max: 54, fee: 385 },
      { min: 55, max: 57, fee: 405 },
      { min: 58, max: 60, fee: 425 }
    ]
  },
  air_express: {
    '0.75': [
      { min: 1, max: 6, fee: 120 },
      { min: 7, max: 12, fee: 180 },
      { min: 13, max: 18, fee: 240 },
      { min: 19, max: 24, fee: 300 },
      { min: 25, max: 30, fee: 360 },
      { min: 31, max: 36, fee: 420 },
      { min: 37, max: 42, fee: 480 },
      { min: 43, max: 48, fee: 540 },
      { min: 49, max: 54, fee: 600 },
      { min: 55, max: 60, fee: 660 },
      { min: 61, max: 66, fee: 720 },
      { min: 67, max: 72, fee: 780 },
      { min: 73, max: 78, fee: 840 },
      { min: 79, max: 84, fee: 900 },
      { min: 85, max: 90, fee: 960 },
      { min: 91, max: 96, fee: 1020 },
      { min: 97, max: 102, fee: 1080 },
      { min: 103, max: 108, fee: 1140 },
      { min: 109, max: 114, fee: 1200 },
      { min: 115, max: 120, fee: 1260 }
    ],
    '1.5': [
      { min: 1, max: 3, fee: 120 },
      { min: 4, max: 6, fee: 180 },
      { min: 7, max: 9, fee: 240 },
      { min: 10, max: 12, fee: 300 },
      { min: 13, max: 15, fee: 360 },
      { min: 16, max: 18, fee: 420 },
      { min: 19, max: 21, fee: 480 },
      { min: 22, max: 24, fee: 540 },
      { min: 25, max: 27, fee: 600 },
      { min: 28, max: 30, fee: 660 },
      { min: 31, max: 33, fee: 720 },
      { min: 34, max: 36, fee: 780 },
      { min: 37, max: 39, fee: 840 },
      { min: 40, max: 42, fee: 900 },
      { min: 43, max: 45, fee: 960 },
      { min: 46, max: 48, fee: 1020 },
      { min: 49, max: 51, fee: 1080 },
      { min: 52, max: 54, fee: 1140 },
      { min: 55, max: 57, fee: 1200 },
      { min: 58, max: 60, fee: 1260 }
    ]
  },
  sail_cargo: {
    '0.75': [
      { min: 1, max: 6, fee: 35 },
      { min: 7, max: 12, fee: 50 },
      { min: 13, max: 18, fee: 65 },
      { min: 19, max: 24, fee: 80 },
      { min: 25, max: 30, fee: 95 },
      { min: 31, max: 36, fee: 110 },
      { min: 37, max: 42, fee: 125 },
      { min: 43, max: 48, fee: 140 },
      { min: 49, max: 54, fee: 155 },
      { min: 55, max: 60, fee: 170 },
      { min: 61, max: 66, fee: 185 },
      { min: 67, max: 72, fee: 200 },
      { min: 73, max: 78, fee: 215 },
      { min: 79, max: 84, fee: 230 },
      { min: 85, max: 90, fee: 245 },
      { min: 91, max: 96, fee: 260 },
      { min: 97, max: 102, fee: 275 },
      { min: 103, max: 108, fee: 290 },
      { min: 109, max: 114, fee: 305 },
      { min: 115, max: 120, fee: 320 }
    ],
    '1.5': [
      { min: 1, max: 3, fee: 35 },
      { min: 4, max: 6, fee: 50 },
      { min: 7, max: 9, fee: 65 },
      { min: 10, max: 12, fee: 80 },
      { min: 13, max: 15, fee: 95 },
      { min: 16, max: 18, fee: 110 },
      { min: 19, max: 21, fee: 125 },
      { min: 22, max: 24, fee: 140 },
      { min: 25, max: 27, fee: 155 },
      { min: 28, max: 30, fee: 170 },
      { min: 31, max: 33, fee: 185 },
      { min: 34, max: 36, fee: 200 },
      { min: 37, max: 39, fee: 215 },
      { min: 40, max: 42, fee: 230 },
      { min: 43, max: 45, fee: 245 },
      { min: 46, max: 48, fee: 260 },
      { min: 49, max: 51, fee: 275 },
      { min: 52, max: 54, fee: 290 },
      { min: 55, max: 57, fee: 305 },
      { min: 58, max: 60, fee: 320 }
    ]
  }
};

// State-specific fees (converted to EUR)
const STATE_FEES: StateFees = {
  'AK': { per_case: 87.40, description: 'Alaska surcharge (converted from $95 USD)' }, // $95 USD = €87.40 EUR
  'HI': { per_case: 87.40, description: 'Hawaii surcharge (converted from $95 USD)' }, // $95 USD = €87.40 EUR
  'AL': { per_case: 3.68, description: 'Alabama handling fee (converted from $4 USD)' }, // $4 USD = €3.68 EUR
  'NH': { percentage: 0.08, description: 'New Hampshire state fee (8% of wine value)' },
  'MS': { blocked: true, message: 'Delivery not available in Mississippi' },
  'SD': { blocked: true, message: 'Delivery not available in South Dakota' },
  'UT': { blocked: true, message: 'Delivery not available in Utah' }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { destination, items, shipping_method, options }: { 
      destination: ShippingDestination; 
      items: ShippingItem[]; 
      shipping_method: string; 
      options?: ShippingOptions 
    } = body;

    // Validate required fields
    if (!destination || !items || !shipping_method) {
      return NextResponse.json(
        { error: 'Missing required fields: destination, items, shipping_method' },
        { status: 400 }
      );
    }

    // Check for blocked states
    const stateCode = destination.state?.toUpperCase();
    if (stateCode && STATE_FEES[stateCode]?.blocked) {
      return NextResponse.json(
        { error: STATE_FEES[stateCode].message },
        { status: 400 }
      );
    }

    // Group items by format (0.75L vs 1.5L)
    const itemsByFormat: { [key: string]: ShippingItem[] } = items.reduce((acc: { [key: string]: ShippingItem[] }, item: ShippingItem) => {
      const format = item.format_liters.toString();
      if (!acc[format]) acc[format] = [];
      acc[format].push(item);
      return acc;
    }, {});

    let totalShipping = 0;
    let totalWineValue = 0;
    let caseCount = 0;
    const shippingBreakdown: { [key: string]: any } = {};

    // Calculate shipping for each format separately
    for (const [format, formatItems] of Object.entries(itemsByFormat)) {
      const totalQty = formatItems.reduce((sum: number, item: ShippingItem) => sum + item.qty, 0);
      const formatValue = formatItems.reduce((sum: number, item: ShippingItem) => sum + (item.unit_price_eur * item.qty), 0);
      
      // Find appropriate shipping tier
      const tariffs = SHIPPING_TARIFFS[shipping_method]?.[format as '0.75' | '1.5'];
      if (!tariffs) {
        return NextResponse.json(
          { error: `No shipping tariffs found for ${shipping_method} ${format}L` },
          { status: 400 }
        );
      }

      const tier = tariffs.find((t: ShippingTier) => totalQty >= t.min && totalQty <= t.max);
      if (!tier) {
        return NextResponse.json(
          { error: `Quantity ${totalQty} exceeds maximum for ${format}L format` },
          { status: 400 }
        );
      }

      // Calculate case count (round up to nearest 6 or 12)
      const cases = Math.ceil(totalQty / 6);
      caseCount += cases;

      const formatShipping = tier.fee;
      totalShipping += formatShipping;
      totalWineValue += formatValue;

      shippingBreakdown[format] = {
        quantity: totalQty,
        tier_min: tier.min,
        tier_max: tier.max,
        shipping_fee: formatShipping,
        cases: cases
      };
    }

    // Calculate insurance (4.5% of wine value, minimum 20€)
    const insurance = Math.max(totalWineValue * 0.045, 20);

    // Calculate tariff (15% of wine value)
    const tariff = totalWineValue * 0.15;

    // Calculate state fees
    let stateFees = 0;
    if (stateCode && STATE_FEES[stateCode]) {
      const stateFee = STATE_FEES[stateCode];
      if (stateFee.per_case) {
        stateFees = stateFee.per_case * caseCount;
      } else if (stateFee.percentage) {
        stateFees = totalWineValue * stateFee.percentage;
      }
    }

    // Additional options
    let additionalFees = 0;
    if (options?.wooden_case) {
      additionalFees += 29 * caseCount;
    }
    if (options?.summer_protected) {
      additionalFees += 53 * caseCount;
    }

    // Small batch fees (per winery)
    const itemsByWinery: { [key: string]: ShippingItem[] } = items.reduce((acc: { [key: string]: ShippingItem[] }, item: ShippingItem) => {
      if (!acc[item.winery_id]) acc[item.winery_id] = [];
      acc[item.winery_id].push(item);
      return acc;
    }, {});

    const smallBatchFees = Object.values(itemsByWinery).reduce((total: number, wineryItems: ShippingItem[]) => {
      const wineryTotalQty = wineryItems.reduce((sum: number, item: ShippingItem) => sum + item.qty, 0);
      const hasMagnums = wineryItems.some((item: ShippingItem) => item.format_liters === 1.5);
      
      // Small batch fee: <6 bottles OR <3 magnums
      if ((wineryTotalQty < 6 && !hasMagnums) || (hasMagnums && wineryTotalQty < 3)) {
        return total + 23;
      }
      return total;
    }, 0);

    const total = totalWineValue + totalShipping + insurance + tariff + stateFees + additionalFees + smallBatchFees;

    const response = {
      breakdown: {
        by_format: shippingBreakdown,
        wine_value: totalWineValue,
        shipping: totalShipping,
        insurance: insurance,
        tariff: tariff,
        tariff_percent: 15.0,
        state_fees: stateFees,
        small_batch_fees: smallBatchFees,
        additional_fees: additionalFees,
        cases: caseCount
      },
      total: total,
      state_info: stateCode ? STATE_FEES[stateCode] : null
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Shipping quote error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
