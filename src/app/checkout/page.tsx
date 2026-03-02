'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getSupabaseBrowserClient } from '@/lib/supabaseClient';
import { basketUtils, Basket, BasketItem } from '@/lib/basket';
import { X, ShoppingCart, Truck, Plane, Ship } from 'lucide-react';

interface ShippingAddress {
  name?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

interface ShippingQuote {
  breakdown: {
    by_format: any;
    wine_value: number;
    shipping: number;
    insurance: number;
    tariff: number;
    tariff_percent: number;
    state_fees: number;
    small_batch_fees: number;
    additional_fees: number;
    cases: number;
  };
  total: number;
  state_info?: any;
}

export default function CheckoutPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [basket, setBasket] = useState<Basket>({ items: [], total: 0 });
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({});
  const [shippingMethod, setShippingMethod] = useState<'ocean' | 'air_express' | 'sail_cargo'>('ocean');
  const [shippingOptions, setShippingOptions] = useState({
    wooden_case: false,
    summer_protected: false,
    free_storage: false
  });
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      setBasket(basketUtils.getBasket());
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const calculateShipping = async () => {
    if (!shippingAddress.country || !shippingAddress.postal_code || basket.items.length === 0) {
      setShippingQuote(null);
      return;
    }

    // Validate postal code format (basic check)
    const postalCodeRegex = /^[a-zA-Z0-9\s\-]{3,10}$/;
    if (!postalCodeRegex.test(shippingAddress.postal_code.trim())) {
      setError('Please enter a valid postal code');
      setShippingQuote(null);
      return;
    }

    setCalculatingShipping(true);
    setError('');

    try {
      const response = await fetch('/api/shipping/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: {
            country: shippingAddress.country.trim(),
            state: shippingAddress.state?.trim(),
            postal_code: shippingAddress.postal_code.trim()
          },
          items: basket.items.map(item => ({
            product_id: item.wine.id,
            winery_id: (item.wine as any).winery_id || '550e8400-e29b-41d4-a716-446655440000',
            format_liters: 0.75,
            qty: item.quantity,
            unit_price_eur: item.wine.priceEUR
          })),
          shipping_method: shippingMethod,
          options: shippingOptions
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to calculate shipping');
        setShippingQuote(null);
        return;
      }

      const quote = await response.json();
      setShippingQuote(quote);

      // Check for blocked states
      if (quote.state_info?.blocked) {
        setError(quote.state_info.message);
        setShippingQuote(null);
      }

    } catch (err) {
      console.error('Shipping calculation error:', err);
      setError('Unable to calculate shipping. Please check your information and try again.');
      setShippingQuote(null);
    } finally {
      setCalculatingShipping(false);
    }
  };

  // Auto-calculate shipping when data changes (with debouncing)
  useEffect(() => {
    if (shippingAddress.country && shippingAddress.postal_code && basket.items.length > 0) {
      const timer = setTimeout(() => {
        calculateShipping();
      }, 500); // 500ms debounce
      
      return () => clearTimeout(timer);
    } else {
      setShippingQuote(null);
    }
  }, [shippingAddress, shippingMethod, shippingOptions, basket.items]);

  const handleSubmit = async () => {
    if (!shippingQuote || !user) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/orders/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: basket.items.map(item => ({
            product_id: item.wine.id,
            winery_id: (item.wine as any).winery_id || '550e8400-e29b-41d4-a716-446655440000',
            format_liters: 0.75,
            qty: item.quantity,
            unit_price_eur: item.wine.priceEUR
          })),
          shipping_address: shippingAddress,
          shipping_method: shippingMethod,
          options: shippingOptions
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit order');
        return;
      }

      const result = await response.json();
      
      // Clear basket and redirect to success
      basketUtils.clearBasket();
      router.push(`/success?order_id=${result.order_id}`);

    } catch (err) {
      setError('Failed to submit order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  // Group items by winery for display
  const itemsByWinery = basket.items.reduce((acc, item) => {
    const wineryId = (item.wine as any).winery_id || 'default';
    if (!acc[wineryId]) acc[wineryId] = [];
    acc[wineryId].push(item);
    return acc;
  }, {} as { [key: string]: BasketItem[] });

  const blockedStates = ['MS', 'SD', 'UT'];
  const isBlockedState = shippingAddress.state && blockedStates.includes(shippingAddress.state.toUpperCase());

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {/* Basket Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <ShoppingCart size={24} />
            Order Summary ({basket.items.length} items)
          </h2>
          
          {Object.entries(itemsByWinery).map(([wineryId, items]) => (
            <div key={wineryId} className="mb-4 p-4 bg-amber-50 rounded-lg">
              <h3 className="font-semibold text-amber-800 mb-2">
                {(items[0]?.wine as any)?.winery || 'Champagne House'} ({items.length} items)
              </h3>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.quantity} × {item.wine.name}</span>
                    <span>€{(item.wine.priceEUR * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between font-semibold text-lg">
              <span>Subtotal:</span>
              <span>€{basket.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={shippingAddress.name || ''}
                onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                placeholder="John Doe"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={shippingAddress.phone || ''}
                onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
              <input
                type="text"
                value={shippingAddress.street || ''}
                onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                placeholder="123 Main Street"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                type="text"
                value={shippingAddress.city || ''}
                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                placeholder="New York"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
              <input
                type="text"
                value={shippingAddress.state || ''}
                onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                placeholder="NY"
                maxLength={50}
              />
              {isBlockedState && (
                <p className="text-red-600 text-sm mt-1">
                  ⚠️ Delivery not available in this state
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
              <input
                type="text"
                value={shippingAddress.postal_code || ''}
                onChange={(e) => setShippingAddress({ ...shippingAddress, postal_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                placeholder="10001"
                required
                maxLength={10}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
              <input
                type="text"
                value={shippingAddress.country || ''}
                onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                placeholder="United States"
                required
              />
            </div>
          </div>
        </div>

        {/* Shipping Method */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Shipping Method</h2>
          
          <div className="space-y-3">
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="shipping_method"
                value="ocean"
                checked={shippingMethod === 'ocean'}
                onChange={(e) => setShippingMethod(e.target.value as any)}
                className="mr-4"
              />
              <div className="flex items-center gap-3">
                <Ship size={24} className="text-blue-600" />
                <div>
                  <div className="font-medium">Ocean Freight</div>
                  <div className="text-sm text-gray-600">8-12 weeks delivery • Most economical</div>
                </div>
              </div>
            </label>
            
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="shipping_method"
                value="air_express"
                checked={shippingMethod === 'air_express'}
                onChange={(e) => setShippingMethod(e.target.value as any)}
                className="mr-4"
              />
              <div className="flex items-center gap-3">
                <Plane size={24} className="text-purple-600" />
                <div>
                  <div className="font-medium">Air Express</div>
                  <div className="text-sm text-gray-600">2-4 weeks delivery • Fastest option</div>
                </div>
              </div>
            </label>
            
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="shipping_method"
                value="sail_cargo"
                checked={shippingMethod === 'sail_cargo'}
                onChange={(e) => setShippingMethod(e.target.value as any)}
                className="mr-4"
              />
              <div className="flex items-center gap-3">
                <Truck size={24} className="text-green-600" />
                <div>
                  <div className="font-medium">Sail Cargo</div>
                  <div className="text-sm text-gray-600">Limited sailings • Eco-friendly</div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Shipping Options */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Shipping Options</h2>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={shippingOptions.wooden_case}
                onChange={(e) => setShippingOptions({ ...shippingOptions, wooden_case: e.target.checked })}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Wooden Case</div>
                <div className="text-sm text-gray-600">+€29 per case</div>
              </div>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={shippingOptions.summer_protected}
                onChange={(e) => setShippingOptions({ ...shippingOptions, summer_protected: e.target.checked })}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Summer Protected Delivery</div>
                <div className="text-sm text-gray-600">+€53 per case (temperature controlled)</div>
              </div>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={shippingOptions.free_storage}
                onChange={(e) => setShippingOptions({ ...shippingOptions, free_storage: e.target.checked })}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Free Storage</div>
                <div className="text-sm text-gray-600">No fee but delayed shipping</div>
              </div>
            </label>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Shipping Quote Display */}
        {shippingQuote && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Truck size={24} />
              Shipping Quote
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Wine Value:</span>
                <span className="font-medium">€{shippingQuote.breakdown.wine_value.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Shipping ({shippingMethod}):</span>
                <span className="font-medium">€{shippingQuote.breakdown.shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Insurance (4.5%):</span>
                <span className="font-medium">€{shippingQuote.breakdown.insurance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Tariff (15%):</span>
                <span className="font-medium">€{shippingQuote.breakdown.tariff.toFixed(2)}</span>
              </div>
              {shippingQuote.breakdown.state_fees > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">State Fees:</span>
                  <span className="font-medium">€{shippingQuote.breakdown.state_fees.toFixed(2)}</span>
                </div>
              )}
              {shippingQuote.breakdown.small_batch_fees > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Small Batch Fees:</span>
                  <span className="font-medium">€{shippingQuote.breakdown.small_batch_fees.toFixed(2)}</span>
                </div>
              )}
              {shippingQuote.breakdown.additional_fees > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Additional Fees:</span>
                  <span className="font-medium">€{shippingQuote.breakdown.additional_fees.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-green-600">€{shippingQuote.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {calculatingShipping && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg mb-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span>Calculating shipping...</span>
          </div>
        )}

        {/* Missing Information */}
        {!shippingQuote && !calculatingShipping && basket.items.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg mb-6">
            <p className="font-medium mb-2">Complete shipping information to see quote</p>
            <ul className="text-sm space-y-1">
              {!shippingAddress.country && <li>• Country required</li>}
              {!shippingAddress.postal_code && <li>• Postal code required</li>}
              {isBlockedState && <li>• Delivery not available in this state</li>}
            </ul>
          </div>
        )}

        {/* Submit Order Button */}
        <div className="mb-6">
          <button
            onClick={handleSubmit}
            disabled={!shippingQuote || submitting || !!isBlockedState}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {submitting ? 'Submitting Order...' : 'Submit Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
