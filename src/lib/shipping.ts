export interface ShippingDestination {
  country: string;
  state?: string;
}

export interface ShippingRate {
  baseCost: number;
  perBottleCost: number;
  freeShippingThreshold: number;
}

export const shippingRates: Record<string, ShippingRate> = {
  'US': {
    baseCost: 15.00,
    perBottleCost: 2.50,
    freeShippingThreshold: 500
  },
  'CA': {
    baseCost: 25.00,
    perBottleCost: 4.00,
    freeShippingThreshold: 600
  },
  'UK': {
    baseCost: 30.00,
    perBottleCost: 5.00,
    freeShippingThreshold: 700
  },
  'AU': {
    baseCost: 35.00,
    perBottleCost: 6.00,
    freeShippingThreshold: 800
  },
  'FR': {
    baseCost: 20.00,
    perBottleCost: 3.50,
    freeShippingThreshold: 550
  },
  'DE': {
    baseCost: 20.00,
    perBottleCost: 3.50,
    freeShippingThreshold: 550
  },
  'IT': {
    baseCost: 22.00,
    perBottleCost: 4.00,
    freeShippingThreshold: 600
  },
  'ES': {
    baseCost: 22.00,
    perBottleCost: 4.00,
    freeShippingThreshold: 600
  },
  'default': {
    baseCost: 40.00,
    perBottleCost: 8.00,
    freeShippingThreshold: 1000
  }
};

export const calculateShipping = (
  destination: ShippingDestination,
  bottleCount: number,
  subtotal: number
): number => {
  const rate = shippingRates[destination.country] || shippingRates['default'];
  
  if (subtotal >= rate.freeShippingThreshold) {
    return 0;
  }
  
  return rate.baseCost + (rate.perBottleCost * bottleCount);
};

export const getShippingEstimate = (
  destination: ShippingDestination,
  bottleCount: number,
  subtotal: number
): { cost: number; isFree: boolean; threshold: number } => {
  const rate = shippingRates[destination.country] || shippingRates['default'];
  const cost = calculateShipping(destination, bottleCount, subtotal);
  
  return {
    cost,
    isFree: cost === 0,
    threshold: rate.freeShippingThreshold
  };
};
