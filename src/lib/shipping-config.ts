// International Shipping Configuration
export interface ShippingQuoteInput {
  destination: {
    country: string;
    state?: string;
    city?: string;
    postalCode?: string;
  };
  orderItems: {
    totalBottles075L: number;
    totalMagnums15L: number;
    wineValueTotal: number;
    wineValueCurrency: string;
    casesCount6: number;
    casesCount12: number;
  };
  flags: {
    woodenBoxUsed: boolean;
    protectedSummerDeliveryRequested: boolean;
    directToConsumer: boolean;
  };
  retailerInfo?: {
    retailerCount: number;
    perRetailerQuantities?: Array<{
      bottles: number;
      magnums: number;
      value: number;
    }>;
  };
  currentDate?: Date;
}

export interface ShippingQuoteResult {
  selectedMethod: string;
  baseShippingFee: {
    bottles: { amount: number; currency: string; bracket: string };
    magnums: { amount: number; currency: string; bracket: string };
    total: { amount: number; currency: string };
  };
  surcharges: Array<{
    type: string;
    amount: number;
    currency: string;
    description: string;
  }>;
  restrictions: Array<{
    type: 'error' | 'warning';
    message: string;
  }>;
  finalTotal: {
    amount: number;
    currency: string;
    breakdown: Array<{
      description: string;
      amount: number;
      currency: string;
    }>;
  };
  eta?: string;
}

export interface ShippingBracket {
  bottleRange: string;
  magnumRange: string;
  oceanFee: number;
  sailboatFee: number;
  airFee: number;
}

export interface CountryConfig {
  country: string;
  currency: string;
  methods: Array<{
    id: string;
    name: string;
    eta: string;
    description: string;
    validityWindow?: { start: string; end: string };
  }>;
  brackets?: ShippingBracket[];
  blockedRegions?: string[];
  fees: {
    insuranceProcessing: { percentage: number; minimum: number };
    woodenBox?: number;
    smallBatch?: { threshold: { bottles: number; magnums: number }; fee: number };
    summerSurcharge?: number;
    regionFees?: Record<string, { amount: number; currency: string; description: string }>;
    tariff?: { startDate: string; percentage: number };
  };
}

// USA Configuration (exact as provided)
export const USA_CONFIG: CountryConfig = {
  country: 'US',
  currency: 'USD',
  methods: [
    {
      id: 'ocean_freight',
      name: 'Ocean Freight',
      eta: '8–12 weeks',
      description: 'Cost-effective maritime shipping',
      validityWindow: { start: '2025-02-01', end: '2026-12-31' }
    },
    {
      id: 'sailboat_cargo',
      name: 'Cargo Sailboat',
      eta: 'Seasonal schedule',
      description: 'Premium eco-friendly shipping',
      validityWindow: { start: '2025-05-15', end: '2026-12-31' }
    },
    {
      id: 'air_express',
      name: 'Air Express',
      eta: '2–4 weeks',
      description: 'Fastest delivery option',
      validityWindow: { start: '2025-02-01', end: '2026-12-31' }
    }
  ],
  brackets: [
    { bottleRange: '1-6', magnumRange: '1-3', oceanFee: 129, sailboatFee: 185, airFee: 209 },
    { bottleRange: '7-12', magnumRange: '4-6', oceanFee: 214, sailboatFee: 280, airFee: 305 },
    { bottleRange: '13-18', magnumRange: '7-9', oceanFee: 286, sailboatFee: 371, airFee: 404 },
    { bottleRange: '19-24', magnumRange: '10-12', oceanFee: 360, sailboatFee: 465, airFee: 506 },
    { bottleRange: '25-30', magnumRange: '13-15', oceanFee: 437, sailboatFee: 565, airFee: 615 },
    { bottleRange: '31-36', magnumRange: '16-18', oceanFee: 508, sailboatFee: 658, airFee: 717 },
    { bottleRange: '37-42', magnumRange: '19-21', oceanFee: 582, sailboatFee: 756, airFee: 823 },
    { bottleRange: '43-48', magnumRange: '22-24', oceanFee: 655, sailboatFee: 853, airFee: 929 },
    { bottleRange: '49-54', magnumRange: '25-27', oceanFee: 727, sailboatFee: 948, airFee: 1033 },
    { bottleRange: '55-60', magnumRange: '28-30', oceanFee: 802, sailboatFee: 1044, airFee: 1137 },
    { bottleRange: '61-66', magnumRange: '31-33', oceanFee: 876, sailboatFee: 1141, airFee: 1243 },
    { bottleRange: '67-72', magnumRange: '34-36', oceanFee: 948, sailboatFee: 1247, airFee: 1358 },
    { bottleRange: '73-78', magnumRange: '37-39', oceanFee: 1023, sailboatFee: 1330, airFee: 1449 },
    { bottleRange: '79-84', magnumRange: '40-42', oceanFee: 1098, sailboatFee: 1428, airFee: 1556 },
    { bottleRange: '85-90', magnumRange: '43-45', oceanFee: 1170, sailboatFee: 1522, airFee: 1658 },
    { bottleRange: '91-96', magnumRange: '46-48', oceanFee: 1244, sailboatFee: 1617, airFee: 1761 },
    { bottleRange: '97-102', magnumRange: '49-51', oceanFee: 1316, sailboatFee: 1711, airFee: 1864 },
    { bottleRange: '103-108', magnumRange: '52-54', oceanFee: 1392, sailboatFee: 1809, airFee: 1971 },
    { bottleRange: '109-114', magnumRange: '55-57', oceanFee: 1464, sailboatFee: 1903, airFee: 2073 },
    { bottleRange: '115-120', magnumRange: '58-60', oceanFee: 1540, sailboatFee: 1992, airFee: 2170 }
  ] as ShippingBracket[],
  blockedRegions: ['MS', 'SD', 'UT'],
  fees: {
    insuranceProcessing: { percentage: 0.045, minimum: 20 },
    woodenBox: 29,
    smallBatch: { threshold: { bottles: 6, magnums: 3 }, fee: 23 },
    summerSurcharge: 53,
    regionFees: {
      'AL': { amount: 3.68, currency: 'EUR', description: 'Alabama state fee - converted from USD' }, // $4 USD = €3.68 EUR
      'AK': { amount: 87.40, currency: 'EUR', description: 'Alaska delivery surcharge - converted from USD' }, // $95 USD = €87.40 EUR
      'HI': { amount: 87.40, currency: 'EUR', description: 'Hawaii delivery surcharge - converted from USD' }, // $95 USD = €87.40 EUR
      'NH': { amount: 0.08, currency: 'EUR', description: 'New Hampshire 8% direct-to-consumer tax (percentage based)' }
    },
    tariff: { startDate: '2025-08-07', percentage: 0.15 }
  }
};

// European Union Configuration (example pricing)
export const EU_CONFIG: CountryConfig = {
  country: 'EU',
  currency: 'EUR',
  methods: [
    {
      id: 'standard_eu',
      name: 'EU Standard Shipping',
      eta: '5–7 business days',
      description: 'Standard delivery within European Union'
    },
    {
      id: 'express_eu',
      name: 'EU Express',
      eta: '2–3 business days',
      description: 'Express delivery within European Union'
    }
  ],
  brackets: [
    { bottleRange: '1-6', magnumRange: '1-3', oceanFee: 45, sailboatFee: 0, airFee: 65 },
    { bottleRange: '7-12', magnumRange: '4-6', oceanFee: 75, sailboatFee: 0, airFee: 95 },
    { bottleRange: '13-18', magnumRange: '7-9', oceanFee: 105, sailboatFee: 0, airFee: 125 },
    { bottleRange: '19-24', magnumRange: '10-12', oceanFee: 135, sailboatFee: 0, airFee: 155 },
    { bottleRange: '25-36', magnumRange: '13-18', oceanFee: 185, sailboatFee: 0, airFee: 205 }
  ],
  fees: {
    insuranceProcessing: { percentage: 0.03, minimum: 15 },
    woodenBox: 25,
    smallBatch: { threshold: { bottles: 12, magnums: 6 }, fee: 15 }
  }
};

// United Kingdom Configuration (example pricing)
export const UK_CONFIG: CountryConfig = {
  country: 'UK',
  currency: 'GBP',
  methods: [
    {
      id: 'standard_uk',
      name: 'UK Standard Shipping',
      eta: '3–5 business days',
      description: 'Standard delivery within United Kingdom'
    },
    {
      id: 'express_uk',
      name: 'UK Express',
      eta: '1–2 business days',
      description: 'Next day delivery within United Kingdom'
    }
  ],
  brackets: [
    { bottleRange: '1-6', magnumRange: '1-3', oceanFee: 35, sailboatFee: 0, airFee: 55 },
    { bottleRange: '7-12', magnumRange: '4-6', oceanFee: 60, sailboatFee: 0, airFee: 80 },
    { bottleRange: '13-18', magnumRange: '7-9', oceanFee: 85, sailboatFee: 0, airFee: 105 },
    { bottleRange: '19-24', magnumRange: '10-12', oceanFee: 110, sailboatFee: 0, airFee: 130 },
    { bottleRange: '25-36', magnumRange: '13-18', oceanFee: 150, sailboatFee: 0, airFee: 170 }
  ],
  fees: {
    insuranceProcessing: { percentage: 0.04, minimum: 12 },
    woodenBox: 20,
    smallBatch: { threshold: { bottles: 12, magnums: 6 }, fee: 18 }
  }
};

// Canada Configuration (example pricing)
export const CA_CONFIG: CountryConfig = {
  country: 'CA',
  currency: 'CAD',
  methods: [
    {
      id: 'standard_ca',
      name: 'Canada Standard',
      eta: '7–10 business days',
      description: 'Standard delivery within Canada'
    },
    {
      id: 'express_ca',
      name: 'Canada Express',
      eta: '3–5 business days',
      description: 'Express delivery within Canada'
    }
  ],
  brackets: [
    { bottleRange: '1-6', magnumRange: '1-3', oceanFee: 40, sailboatFee: 0, airFee: 60 },
    { bottleRange: '7-12', magnumRange: '4-6', oceanFee: 70, sailboatFee: 0, airFee: 90 },
    { bottleRange: '13-18', magnumRange: '7-9', oceanFee: 100, sailboatFee: 0, airFee: 120 },
    { bottleRange: '19-24', magnumRange: '10-12', oceanFee: 130, sailboatFee: 0, airFee: 150 },
    { bottleRange: '25-36', magnumRange: '13-18', oceanFee: 175, sailboatFee: 0, airFee: 195 }
  ],
  fees: {
    insuranceProcessing: { percentage: 0.035, minimum: 18 },
    woodenBox: 28,
    smallBatch: { threshold: { bottles: 12, magnums: 6 }, fee: 20 }
  }
};

// Australia Configuration (example pricing)
export const AU_CONFIG: CountryConfig = {
  country: 'AU',
  currency: 'AUD',
  methods: [
    {
      id: 'standard_au',
      name: 'Australia Standard',
      eta: '10–14 business days',
      description: 'Standard delivery within Australia'
    },
    {
      id: 'express_au',
      name: 'Australia Express',
      eta: '5–7 business days',
      description: 'Express delivery within Australia'
    }
  ],
  brackets: [
    { bottleRange: '1-6', magnumRange: '1-3', oceanFee: 55, sailboatFee: 0, airFee: 85 },
    { bottleRange: '7-12', magnumRange: '4-6', oceanFee: 95, sailboatFee: 0, airFee: 125 },
    { bottleRange: '13-18', magnumRange: '7-9', oceanFee: 135, sailboatFee: 0, airFee: 165 },
    { bottleRange: '19-24', magnumRange: '10-12', oceanFee: 175, sailboatFee: 0, airFee: 205 },
    { bottleRange: '25-36', magnumRange: '13-18', oceanFee: 225, sailboatFee: 0, airFee: 255 }
  ],
  fees: {
    insuranceProcessing: { percentage: 0.04, minimum: 20 },
    woodenBox: 32,
    smallBatch: { threshold: { bottles: 12, magnums: 6 }, fee: 25 }
  }
};

// All country configurations
export const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  'US': USA_CONFIG,
  'EU': EU_CONFIG,
  'UK': UK_CONFIG,
  'CA': CA_CONFIG,
  'AU': AU_CONFIG
};

// Legacy export for backward compatibility
export const USA_SHIPPING_CONFIG = USA_CONFIG;
