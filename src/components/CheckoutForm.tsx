'use client';

import { useState, useEffect } from 'react';
import { CustomerDetails, customerUtils } from '@/lib/customer';
import { getShippingEstimate } from '@/lib/shipping';
import { shippingCalculator, ShippingQuoteResult } from '@/lib/shipping-calculator';
import ShippingCalculator from '@/components/ShippingCalculator';

interface CheckoutFormProps {
  subtotal: number;
  bottleCount: number;
  onShippingCalculated: (shipping: number) => void;
  onProceedToPayment?: () => void;
  basketItems?: Array<{
    wine: { id: string; name: string; priceEUR: number };
    quantity: number;
  }>;
}

export default function CheckoutForm({ 
  subtotal, 
  bottleCount, 
  onShippingCalculated,
  onProceedToPayment,
  basketItems = []
}: CheckoutFormProps) {
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>(
    customerUtils.getDefaultCustomerDetails()
  );
  const [shipping, setShipping] = useState(0);
  const [shippingQuote, setShippingQuote] = useState<ShippingQuoteResult | null>(null);

  useEffect(() => {
    const savedDetails = customerUtils.getCustomerDetails();
    if (savedDetails) {
      setCustomerDetails(savedDetails);
    }
  }, []);

  useEffect(() => {
    const destination = customerUtils.getShippingDestination(customerDetails);
    const oldShipping = getShippingEstimate(destination, bottleCount, subtotal);
    setShipping(oldShipping.cost);
    onShippingCalculated(oldShipping.cost);
  }, [customerDetails, bottleCount, subtotal, onShippingCalculated]);

  const handleInputChange = (field: keyof CustomerDetails, value: string) => {
    const updatedDetails = { ...customerDetails, [field]: value };
    setCustomerDetails(updatedDetails);
    customerUtils.saveCustomerDetails(updatedDetails);
  };

  const handleShippingQuoteCalculated = (quote: ShippingQuoteResult) => {
    setShippingQuote(quote);
    setShipping(quote.finalTotal.amount);
    onShippingCalculated(quote.finalTotal.amount);
  };

  // Calculate order items for shipping calculator
  const orderItems = basketItems.reduce((acc, item) => {
    // Assuming 0.75L bottles by default, you may need to adjust this logic
    // based on your actual wine data structure
    return {
      ...acc,
      totalBottles075L: acc.totalBottles075L + item.quantity,
      wineValueTotal: acc.wineValueTotal + (item.wine.priceEUR * item.quantity),
      casesCount6: Math.floor((acc.totalBottles075L + item.quantity) / 6),
      casesCount12: Math.floor((acc.totalBottles075L + item.quantity) / 12)
    };
  }, {
    totalBottles075L: 0,
    totalMagnums15L: 0,
    wineValueTotal: 0,
    wineValueCurrency: 'EUR',
    casesCount6: 0,
    casesCount12: 0
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Full Name *
          </label>
          <input
            type="text"
            value={customerDetails.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Email *
          </label>
          <input
            type="email"
            value={customerDetails.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Phone *
        </label>
        <input
          type="tel"
          value={customerDetails.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Street Address *
        </label>
        <input
          type="text"
          value={customerDetails.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            City *
          </label>
          <input
            type="text"
            value={customerDetails.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            State/Province *
          </label>
          <input
            type="text"
            value={customerDetails.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            ZIP/Postal Code *
          </label>
          <input
            type="text"
            value={customerDetails.zip}
            onChange={(e) => handleInputChange('zip', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Country *
          </label>
          <select
            value={customerDetails.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="UK">United Kingdom</option>
            <option value="AU">Australia</option>
            <option value="FR">France</option>
            <option value="DE">Germany</option>
            <option value="IT">Italy</option>
            <option value="ES">Spain</option>
          </select>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="font-medium text-black mb-2">Shipping Estimate</h4>
        <div className="text-sm text-black space-y-1">
          <p>Bottle Count: {orderItems.totalBottles075L}</p>
          <p>Destination: {customerDetails.country}</p>
          {shippingQuote ? (
            <div>
              <p className="text-green-600 font-medium">
                Total Shipping: {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(shipping)}
              </p>
              {shippingQuote.eta && <p>ETA: {shippingQuote.eta}</p>}
            </div>
          ) : (
            <p>Calculate shipping using the calculator below</p>
          )}
        </div>
      </div>

      {/* New Shipping Calculator */}
      <ShippingCalculator
        onShippingCalculated={handleShippingQuoteCalculated}
        orderItems={orderItems}
        retailerInfo={{
          retailerCount: 1, // Assuming single retailer, adjust as needed
          perRetailerQuantities: [{
            bottles: orderItems.totalBottles075L,
            magnums: orderItems.totalMagnums15L,
            value: orderItems.wineValueTotal
          }]
        }}
      />

      {onProceedToPayment && (
        <div className="mt-6">
          <button
            onClick={onProceedToPayment}
            className="w-full bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            Proceed to Payment
          </button>
        </div>
      )}
    </div>
  );
}
