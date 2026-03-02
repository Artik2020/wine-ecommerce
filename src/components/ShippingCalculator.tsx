'use client';

import { useState, useEffect } from 'react';
import { shippingCalculator, ShippingQuoteResult, ShippingQuoteInput } from '@/lib/shipping-calculator';

interface ShippingCalculatorProps {
  onShippingCalculated: (quote: ShippingQuoteResult) => void;
  orderItems: {
    totalBottles075L: number;
    totalMagnums15L: number;
    wineValueTotal: number;
    wineValueCurrency: string;
    casesCount6: number;
    casesCount12: number;
  };
  retailerInfo?: {
    retailerCount: number;
    perRetailerQuantities?: Array<{
      bottles: number;
      magnums: number;
      value: number;
    }>;
  };
}

export default function ShippingCalculator({ onShippingCalculated, orderItems, retailerInfo }: ShippingCalculatorProps) {
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [selectedMethod, setSelectedMethod] = useState('ocean_freight');
  const [destination, setDestination] = useState({
    country: 'US',
    state: '',
    city: '',
    postalCode: ''
  });
  const [flags, setFlags] = useState({
    woodenBoxUsed: false,
    protectedSummerDeliveryRequested: false,
    directToConsumer: false
  });
  const [quote, setQuote] = useState<ShippingQuoteResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Get available countries and methods
  const availableCountries = shippingCalculator.getAvailableCountries();
  const availableMethods = shippingCalculator.getAvailableMethods(selectedCountry);

  useEffect(() => {
    setDestination(prev => ({ ...prev, country: selectedCountry }));
  }, [selectedCountry]);

  const calculateQuote = async () => {
    if (!destination.country) return;

    setIsCalculating(true);
    
    try {
      const input: ShippingQuoteInput = {
        destination: {
          country: selectedCountry,
          state: destination.state,
          city: destination.city,
          postalCode: destination.postalCode
        },
        orderItems,
        flags,
        retailerInfo,
        currentDate: new Date()
      };

      const result = shippingCalculator.computeShippingQuote(input, selectedMethod);
      setQuote(result);
      
      if (result.restrictions.some(r => r.type === 'error')) {
        // Show error, don't call onShippingCalculated
        return;
      }
      
      onShippingCalculated(result);
    } catch (error) {
      console.error('Error calculating shipping:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const locale = currency === 'USD' ? 'en-US' : 
                  currency === 'GBP' ? 'en-GB' :
                  currency === 'CAD' ? 'en-CA' :
                  currency === 'AUD' ? 'en-AU' : 'de-DE';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <h3 className="text-xl font-bold text-black mb-4">International Shipping Calculator</h3>
      
      {/* Country Selection */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">Destination Country</label>
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {availableCountries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name} ({country.currency})
            </option>
          ))}
        </select>
      </div>

      {/* Shipping Method Selection */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">Shipping Method</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableMethods.map((method) => (
            <div
              key={method.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedMethod === method.id
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => setSelectedMethod(method.id)}
            >
              <div className="font-medium text-black">{method.name}</div>
              <div className="text-sm text-black">{method.eta}</div>
              <div className="text-xs text-black mt-1">{method.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* State/Region Input (USA specific) */}
      {selectedCountry === 'US' && (
        <div>
          <label className="block text-sm font-medium text-black mb-2">State</label>
          <select
            value={destination.state}
            onChange={(e) => setDestination({ ...destination, state: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Select State</option>
            <option value="AL">Alabama</option>
            <option value="AK">Alaska</option>
            <option value="AZ">Arizona</option>
            <option value="AR">Arkansas</option>
            <option value="CA">California</option>
            <option value="CO">Colorado</option>
            <option value="CT">Connecticut</option>
            <option value="DE">Delaware</option>
            <option value="FL">Florida</option>
            <option value="GA">Georgia</option>
            <option value="HI">Hawaii</option>
            <option value="IA">Iowa</option>
            <option value="ID">Idaho</option>
            <option value="IL">Illinois</option>
            <option value="IN">Indiana</option>
            <option value="KS">Kansas</option>
            <option value="KY">Kentucky</option>
            <option value="LA">Louisiana</option>
            <option value="ME">Maine</option>
            <option value="MD">Maryland</option>
            <option value="MA">Massachusetts</option>
            <option value="MI">Michigan</option>
            <option value="MN">Minnesota</option>
            <option value="MS">Mississippi</option>
            <option value="MO">Missouri</option>
            <option value="MT">Montana</option>
            <option value="NE">Nebraska</option>
            <option value="NV">Nevada</option>
            <option value="NH">New Hampshire</option>
            <option value="NJ">New Jersey</option>
            <option value="NM">New Mexico</option>
            <option value="NY">New York</option>
            <option value="NC">North Carolina</option>
            <option value="ND">North Dakota</option>
            <option value="OH">Ohio</option>
            <option value="OK">Oklahoma</option>
            <option value="OR">Oregon</option>
            <option value="PA">Pennsylvania</option>
            <option value="RI">Rhode Island</option>
            <option value="SC">South Carolina</option>
            <option value="SD">South Dakota</option>
            <option value="TN">Tennessee</option>
            <option value="TX">Texas</option>
            <option value="UT">Utah</option>
            <option value="VT">Vermont</option>
            <option value="VA">Virginia</option>
            <option value="WA">Washington</option>
            <option value="WV">West Virginia</option>
            <option value="WI">Wisconsin</option>
            <option value="WY">Wyoming</option>
          </select>
        </div>
      )}

      {/* City Input (for all countries) */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">City</label>
        <input
          type="text"
          value={destination.city}
          onChange={(e) => setDestination({ ...destination, city: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="Enter city"
        />
      </div>

      {/* Postal Code Input */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">Postal Code</label>
        <input
          type="text"
          value={destination.postalCode}
          onChange={(e) => setDestination({ ...destination, postalCode: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          placeholder="Enter postal code"
        />
      </div>

      {/* Options */}
      <div>
        <label className="block text-sm font-medium text-black mb-2">Shipping Options</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={flags.woodenBoxUsed}
              onChange={(e) => setFlags({ ...flags, woodenBoxUsed: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-black">Use wooden boxes</span>
          </label>
          {selectedCountry === 'US' && (
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={flags.protectedSummerDeliveryRequested}
                onChange={(e) => setFlags({ ...flags, protectedSummerDeliveryRequested: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-black">Protected summer delivery</span>
            </label>
          )}
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={flags.directToConsumer}
              onChange={(e) => setFlags({ ...flags, directToConsumer: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-black">Direct to consumer shipment</span>
          </label>
        </div>
      </div>

      {/* Calculate Button */}
      <button
        onClick={calculateQuote}
        disabled={!destination.country || isCalculating}
        className="w-full bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {isCalculating ? 'Calculating...' : 'Calculate Shipping'}
      </button>

      {/* Results */}
      {quote && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          {quote.restrictions.some(r => r.type === 'error') ? (
            <div className="text-red-600">
              {quote.restrictions.filter((r: any) => r.type === 'error').map((r: any, i: number) => (
                <div key={i} className="mb-2">{r.message}</div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-black mb-2">
                  Shipping Method: {quote.selectedMethod.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </h4>
                <p className="text-sm text-black">ETA: {quote.eta}</p>
              </div>

              <div>
                <h5 className="font-medium text-black mb-2">Base Shipping</h5>
                <div className="text-sm space-y-1">
                  <div className="text-black">Bottles ({quote.baseShippingFee.bottles.bracket}): {formatCurrency(quote.baseShippingFee.bottles.amount, quote.baseShippingFee.bottles.currency)}</div>
                  <div className="text-black">Magnums ({quote.baseShippingFee.magnums.bracket}): {formatCurrency(quote.baseShippingFee.magnums.amount, quote.baseShippingFee.magnums.currency)}</div>
                  <div className="font-medium text-black">Total Base: {formatCurrency(quote.baseShippingFee.total.amount, quote.baseShippingFee.total.currency)}</div>
                </div>
              </div>

              {quote.surcharges.length > 0 && (
                <div>
                  <h5 className="font-medium text-black mb-2">Additional Fees</h5>
                  <div className="text-sm space-y-1">
                    {quote.surcharges.map((surcharge: any, i: number) => (
                      <div key={i} className="text-black">
                        {surcharge.description}: {formatCurrency(surcharge.amount, surcharge.currency)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-2">
                <div className="text-lg font-bold text-black">
                  Final Total: {formatCurrency(quote.finalTotal.amount, quote.finalTotal.currency)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
