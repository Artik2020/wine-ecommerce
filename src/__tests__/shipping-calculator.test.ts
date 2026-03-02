// Simple test cases for USA shipping calculator
// These can be run with a test runner like Jest or Mocha

import { shippingCalculator } from '../../lib/shipping-calculator';

// Test function to verify shipping calculations
export function runShippingTests() {
  console.log('Running shipping calculator tests...');
  
  // Test 1: Bottles only
  const input1 = {
    destination: { country: 'US' as const, state: 'CA', city: 'Los Angeles' },
    orderItems: {
      totalBottles075L: 6,
      totalMagnums15L: 0,
      wineValueTotal: 300,
      wineValueCurrency: 'EUR',
      casesCount6: 1,
      casesCount12: 0
    },
    flags: {
      woodenBoxUsed: false,
      protectedSummerDeliveryRequested: false,
      directToConsumer: false
    }
  };

  const result1 = shippingCalculator.computeShippingQuote(input1, 'ocean_freight');
  console.log('Test 1 - Bottles only:', {
    baseShipping: result1.baseShippingFee.bottles.amount,
    expected: 129,
    passed: result1.baseShippingFee.bottles.amount === 129
  });

  // Test 2: Restricted states
  const input2 = {
    destination: { country: 'US' as const, state: 'MS' },
    orderItems: {
      totalBottles075L: 6,
      totalMagnums15L: 0,
      wineValueTotal: 300,
      wineValueCurrency: 'EUR',
      casesCount6: 1,
      casesCount12: 0
    },
    flags: {
      woodenBoxUsed: false,
      protectedSummerDeliveryRequested: false,
      directToConsumer: false
    }
  };

  const result2 = shippingCalculator.computeShippingQuote(input2, 'ocean_freight');
  console.log('Test 2 - Restricted states:', {
    hasRestrictions: result2.restrictions.length > 0,
    isBlocked: result2.restrictions.some(r => r.type === 'error'),
    passed: result2.restrictions.some(r => r.message.includes('Mississippi'))
  });

  // Test 3: Alaska surcharge
  const input3 = {
    destination: { country: 'US' as const, state: 'AK' },
    orderItems: {
      totalBottles075L: 12,
      totalMagnums15L: 0,
      wineValueTotal: 600,
      wineValueCurrency: 'EUR',
      casesCount6: 2,
      casesCount12: 0
    },
    flags: {
      woodenBoxUsed: false,
      protectedSummerDeliveryRequested: false,
      directToConsumer: false
    }
  };

  const result3 = shippingCalculator.computeShippingQuote(input3, 'ocean_freight');
  const akFee = result3.surcharges.find((s: any) => s.type === 'state_fee');
  console.log('Test 3 - Alaska surcharge:', {
    hasAkFee: !!akFee,
    akFeeAmount: akFee?.amount,
    expected: 95,
    passed: akFee?.amount === 95
  });

  console.log('All tests completed!');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runShippingTests();
}
