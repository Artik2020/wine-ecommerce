import { ShippingQuoteInput, ShippingQuoteResult, COUNTRY_CONFIGS, CountryConfig, ShippingBracket } from './shipping-config';

export type { ShippingQuoteInput, ShippingQuoteResult };

export class ShippingCalculator {
  /**
   * Calculate shipping quote for orders
   */
  computeShippingQuote(input: ShippingQuoteInput, method: string): ShippingQuoteResult {
    const currentDate = input.currentDate || new Date();
    
    // Get country configuration
    const countryConfig = COUNTRY_CONFIGS[input.destination.country];
    if (!countryConfig) {
      return this.createErrorResult(method, `Shipping to ${input.destination.country} is not supported`);
    }

    // Check validity windows for method
    const selectedMethod = countryConfig.methods.find(m => m.id === method);
    if (!selectedMethod) {
      return this.createErrorResult(method, `Shipping method ${method} is not available for ${input.destination.country}`);
    }

    if (selectedMethod.validityWindow && !this.isDateValid(currentDate, selectedMethod.validityWindow)) {
      return this.createErrorResult(method, `Shipping method ${method} is not valid for current date`);
    }

    // Check state/region restrictions
    const restrictions = this.checkRegionRestrictions(input.destination, countryConfig);
    if (restrictions.some(r => r.type === 'error')) {
      return this.createErrorResult(method, restrictions[0].message);
    }

    // Calculate base shipping fees
    const baseShippingFee = this.calculateBaseShippingFee(input.orderItems, method, countryConfig);
    
    // Calculate surcharges
    const surcharges = this.calculateSurcharges(input, method, currentDate, countryConfig);
    
    // Calculate final total
    const finalTotal = this.calculateFinalTotal(baseShippingFee, surcharges);

    return {
      selectedMethod: method,
      baseShippingFee,
      surcharges,
      restrictions,
      finalTotal,
      eta: selectedMethod.eta
    };
  }

  /**
   * Calculate base shipping fee using bracket tables
   */
  private calculateBaseShippingFee(orderItems: ShippingQuoteInput['orderItems'], method: string, countryConfig: CountryConfig) {
    const { totalBottles075L, totalMagnums15L } = orderItems;
    
    if (!countryConfig.brackets) {
      // For countries without brackets, use a simple flat rate or calculation
      return {
        bottles: { amount: 0, currency: countryConfig.currency, bracket: 'N/A' },
        magnums: { amount: 0, currency: countryConfig.currency, bracket: 'N/A' },
        total: { amount: 0, currency: countryConfig.currency }
      };
    }
    
    // Get bracket for bottles
    const bottleBracket = this.getBracketForQuantity(totalBottles075L, 'bottle', countryConfig.brackets);
    const bottleFee = bottleBracket ? this.getFeeForMethod(bottleBracket, method) : 0;
    
    // Get bracket for magnums
    const magnumBracket = this.getBracketForQuantity(totalMagnums15L, 'magnum', countryConfig.brackets);
    const magnumFee = magnumBracket ? this.getFeeForMethod(magnumBracket, method) : 0;
    
    return {
      bottles: { 
        amount: bottleFee, 
        currency: countryConfig.currency, 
        bracket: bottleBracket?.bottleRange || 'N/A' 
      },
      magnums: { 
        amount: magnumFee, 
        currency: countryConfig.currency, 
        bracket: magnumBracket?.magnumRange || 'N/A' 
      },
      total: { 
        amount: bottleFee + magnumFee, 
        currency: countryConfig.currency 
      }
    };
  }

  /**
   * Get appropriate bracket for quantity
   */
  private getBracketForQuantity(quantity: number, type: 'bottle' | 'magnum', brackets: ShippingBracket[]): ShippingBracket | null {
    if (quantity === 0) return null;
    
    return brackets.find(bracket => {
      const range = type === 'bottle' ? bracket.bottleRange : bracket.magnumRange;
      const [min, max] = range.split('-').map(Number);
      return quantity >= min && quantity <= max;
    }) || null;
  }

  /**
   * Get fee for specific shipping method from bracket
   */
  private getFeeForMethod(bracket: ShippingBracket, method: string): number {
    switch (method) {
      case 'ocean_freight': return bracket.oceanFee;
      case 'sailboat_cargo': return bracket.sailboatFee;
      case 'air_express': return bracket.airFee;
      case 'standard_eu':
      case 'standard_uk':
      case 'standard_ca':
      case 'standard_au': return bracket.oceanFee; // Use ocean fee as standard
      case 'express_eu':
      case 'express_uk':
      case 'express_ca':
      case 'express_au': return bracket.airFee; // Use air fee as express
      default: return 0;
    }
  }

  /**
   * Calculate all applicable surcharges
   */
  private calculateSurcharges(input: ShippingQuoteInput, method: string, currentDate: Date, countryConfig: CountryConfig) {
    const surcharges = [];
    const { orderItems, flags, destination } = input;
    const { fees } = countryConfig;

    // Insurance & Processing (mandatory)
    if (fees.insuranceProcessing) {
      const insuranceFee = Math.max(
        orderItems.wineValueTotal * fees.insuranceProcessing.percentage,
        fees.insuranceProcessing.minimum
      );
      surcharges.push({
        type: 'insurance_processing',
        amount: insuranceFee,
        currency: countryConfig.currency,
        description: `Insurance & Processing (${(fees.insuranceProcessing.percentage * 100).toFixed(1)}% of wine value, minimum ${fees.insuranceProcessing.minimum} ${countryConfig.currency})`
      });
    }

    // Wooden box fee
    if (fees.woodenBox && flags.woodenBoxUsed) {
      const totalCases = orderItems.casesCount6 + orderItems.casesCount12;
      surcharges.push({
        type: 'wooden_box',
        amount: totalCases * fees.woodenBox,
        currency: countryConfig.currency,
        description: `Wooden box fee (${totalCases} cases × ${fees.woodenBox} ${countryConfig.currency})`
      });
    }

    // Small batch fee
    if (fees.smallBatch) {
      const smallBatchFee = this.calculateSmallBatchFee(input, fees.smallBatch);
      if (smallBatchFee > 0) {
        surcharges.push({
          type: 'small_batch',
          amount: smallBatchFee,
          currency: countryConfig.currency,
          description: 'Small batch fee (orders less than threshold per retailer)'
        });
      }
    }

    // Summer delivery surcharge (USA specific)
    if (fees.summerSurcharge && flags.protectedSummerDeliveryRequested && !this.isTemperatureControlledEligible(destination, countryConfig)) {
      const totalCases = orderItems.casesCount6 + orderItems.casesCount12;
      surcharges.push({
        type: 'summer_surcharge',
        amount: totalCases * fees.summerSurcharge,
        currency: countryConfig.currency,
        description: `Summer delivery surcharge (${totalCases} cases × ${fees.summerSurcharge} ${countryConfig.currency})`
      });
    }

    // Region-specific fees
    if (fees.regionFees && destination.state) {
      const regionFee = this.calculateRegionFee(destination.state, orderItems.wineValueTotal, flags.directToConsumer, fees.regionFees);
      if (regionFee) {
        surcharges.push(regionFee);
      }
    }

    // Tariff (if applicable)
    if (fees.tariff) {
      const tariffFee = this.calculateTariff(orderItems.wineValueTotal, currentDate, fees.tariff);
      if (tariffFee > 0) {
        surcharges.push({
          type: 'tariff',
          amount: tariffFee,
          currency: countryConfig.currency,
          description: `Tariff (${(fees.tariff.percentage * 100).toFixed(0)}% of wine value)`
        });
      }
    }

    return surcharges;
  }

  /**
   * Calculate small batch fee based on retailer quantities
   */
  private calculateSmallBatchFee(input: ShippingQuoteInput, smallBatchConfig: { threshold: { bottles: number; magnums: number }; fee: number }): number {
    if (!input.retailerInfo) return 0;
    
    let totalFee = 0;
    const { perRetailerQuantities } = input.retailerInfo;
    
    if (perRetailerQuantities) {
      perRetailerQuantities.forEach(retailer => {
        const { bottles, magnums } = retailer;
        if (bottles < smallBatchConfig.threshold.bottles || magnums < smallBatchConfig.threshold.magnums) {
          totalFee += smallBatchConfig.fee;
        }
      });
    }
    
    return totalFee;
  }

  /**
   * Calculate region-specific fees
   */
  private calculateRegionFee(
    region: string,
    wineValueTotal: number,
    directToConsumer: boolean,
    regionFees: Record<
      string,
      | { amount: number; currency: string; description: string }
      | { percentage: number; currency: string; description: string }
    >
  ) {
    const regionFee = regionFees[region];
    if (!regionFee) return null;

    if ('amount' in regionFee) {
      return {
        type: 'region_fee',
        amount: regionFee.amount,
        currency: regionFee.currency,
        description: regionFee.description
      };
    } else if ('percentage' in regionFee && directToConsumer) {
      const amount = wineValueTotal * regionFee.percentage;
      return {
        type: 'region_fee',
        amount,
        currency: regionFee.currency,
        description: regionFee.description
      };
    }

    return null;
  }

  /**
   * Calculate tariff if applicable
   */
  private calculateTariff(wineValueTotal: number, currentDate: Date, tariffConfig: { startDate: string; percentage: number }): number {
    const tariffStartDate = new Date(tariffConfig.startDate);
    if (currentDate >= tariffStartDate) {
      return wineValueTotal * tariffConfig.percentage;
    }
    return 0;
  }

  /**
   * Check if destination is eligible for temperature-controlled delivery (USA specific)
   */
  private isTemperatureControlledEligible(destination: ShippingQuoteInput['destination'], countryConfig: CountryConfig): boolean {
    // Only USA has temperature-controlled delivery defined
    if (countryConfig.country !== 'US') return false;
    
    const { state, city } = destination;
    const tempControlled = {
      CA: ['Los Angeles', 'Napa', 'Orange County', 'Riverside', 'Sacramento', 'San Diego', 'San Jose', 'Santa Barbara', 'San Francisco'],
      FL: ['South of Gainesville'],
      NYC: ['New York City Metropolitan Area'],
      TX: ['Austin', 'Dallas', 'Houston', 'San Antonio']
    };
    
    for (const [eligibleState, cities] of Object.entries(tempControlled)) {
      if (eligibleState === 'CA' && state === 'CA') {
        return cities.some(eligibleCity => 
          city?.toLowerCase().includes(eligibleCity.toLowerCase())
        );
      }
      if (eligibleState === 'FL' && state === 'FL') {
        const cityLower = city?.toLowerCase() || '';
        return cityLower.includes('gainesville') && 
               cityLower.includes('south');
      }
      if (eligibleState === 'NYC' && state === 'NY') {
        const cityLower = city?.toLowerCase() || '';
        return cityLower.includes('new york');
      }
      if (eligibleState === 'TX' && state === 'TX') {
        return cities.some(eligibleCity => 
          city?.toLowerCase().includes(eligibleCity.toLowerCase())
        );
      }
    }
    
    return false;
  }

  /**
   * Check state/region restrictions
   */
  private checkRegionRestrictions(destination: ShippingQuoteInput['destination'], countryConfig: CountryConfig): Array<{ type: 'error' | 'warning'; message: string }> {
    const restrictions: Array<{ type: 'error' | 'warning'; message: string }> = [];
    
    if (countryConfig.blockedRegions && destination.state && countryConfig.blockedRegions.includes(destination.state)) {
      restrictions.push({
        type: 'error' as const,
        message: `Delivery to ${destination.state} is not available.`
      });
    }
    
    return restrictions;
  }

  /**
   * Check if shipping method is valid for current date
   */
  private isDateValid(currentDate: Date, validityWindow: { start: string; end: string }): boolean {
    const start = new Date(validityWindow.start);
    const end = new Date(validityWindow.end);
    return currentDate >= start && currentDate <= end;
  }

  /**
   * Calculate final total with breakdown
   */
  private calculateFinalTotal(
    baseShippingFee: ShippingQuoteResult['baseShippingFee'],
    surcharges: ShippingQuoteResult['surcharges']
  ): ShippingQuoteResult['finalTotal'] {
    const breakdown = [
      {
        description: 'Base shipping (bottles)',
        amount: baseShippingFee.bottles.amount,
        currency: baseShippingFee.bottles.currency
      },
      {
        description: 'Base shipping (magnums)',
        amount: baseShippingFee.magnums.amount,
        currency: baseShippingFee.magnums.currency
      },
      ...surcharges.map(surcharge => ({
        description: surcharge.description,
        amount: surcharge.amount,
        currency: surcharge.currency
      }))
    ];

    // Convert to primary currency for total calculation
    const primaryCurrency = baseShippingFee.total.currency;
    const total = breakdown
      .filter(item => item.currency === primaryCurrency)
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      amount: total,
      currency: primaryCurrency,
      breakdown
    };
  }

  /**
   * Create error result
   */
  private createErrorResult(method: string, message: string): ShippingQuoteResult {
    return {
      selectedMethod: method,
      baseShippingFee: {
        bottles: { amount: 0, currency: 'EUR', bracket: 'N/A' },
        magnums: { amount: 0, currency: 'EUR', bracket: 'N/A' },
        total: { amount: 0, currency: 'EUR' }
      },
      surcharges: [],
      restrictions: [{ type: 'error', message }],
      finalTotal: {
        amount: 0,
        currency: 'EUR',
        breakdown: []
      }
    };
  }

  /**
   * Get available countries
   */
  getAvailableCountries(): Array<{ code: string; name: string; currency: string }> {
    return Object.entries(COUNTRY_CONFIGS).map(([code, config]) => ({
      code,
      name: config.country,
      currency: config.currency
    }));
  }

  /**
   * Get available methods for a country
   */
  getAvailableMethods(countryCode: string): Array<{ id: string; name: string; eta: string; description: string }> {
    const config = COUNTRY_CONFIGS[countryCode];
    return config ? config.methods : [];
  }
}

// Export singleton instance
export const shippingCalculator = new ShippingCalculator();
