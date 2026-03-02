'use client';

import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { basketUtils, Basket, BasketItem } from '@/lib/basket';
import { customerUtils, CustomerDetails } from '@/lib/customer';
import { stripePromise, createPaymentIntent, formatAmountForStripe } from '@/lib/stripe';
import CheckoutForm from '@/components/CheckoutForm';
import StripePaymentForm from '@/components/StripePaymentForm';
import { X, Plus, Minus, Trash2, ShoppingCart, CreditCard } from 'lucide-react';

interface BasketDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BasketDrawer({ isOpen, onClose }: BasketDrawerProps) {
  const [basket, setBasket] = useState<Basket>({ items: [], total: 0 });
  const [shipping, setShipping] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setBasket(basketUtils.getBasket());
      const savedCustomer = customerUtils.getCustomerDetails();
      if (savedCustomer) {
        setCustomerDetails(savedCustomer);
      }
    }
  }, [isOpen]);

  const bottleCount = basket.items.reduce((count, item) => count + item.quantity, 0);
  const finalTotal = basket.total + shipping;

  const updateQuantity = (wineId: string, quantity: number) => {
    const updatedBasket = basketUtils.updateQuantity(wineId, quantity);
    setBasket(updatedBasket);
  };

  const removeItem = (wineId: string) => {
    const updatedBasket = basketUtils.removeItem(wineId);
    setBasket(updatedBasket);
  };

  const clearBasket = () => {
    const updatedBasket = basketUtils.clearBasket();
    setBasket(updatedBasket);
    setShowCheckout(false);
    setShowPayment(false);
    setClientSecret('');
    setPaymentError('');
  };

  const handleCheckout = async () => {
    if (!customerDetails) {
      setPaymentError('Please fill in your shipping information first.');
      return;
    }

    try {
      const amount = formatAmountForStripe(finalTotal);
      const { clientSecret: secret } = await createPaymentIntent({
        amount,
        currency: 'eur',
        customer_email: customerDetails.email,
        metadata: {
          customer_name: customerDetails.name,
          bottle_count: bottleCount.toString(),
          subtotal: basket.total.toString(),
          shipping: shipping.toString(),
        },
      });
      
      setClientSecret(secret);
      setShowPayment(true);
      setPaymentError('');
    } catch (error) {
      setPaymentError('Failed to initialize payment. Please try again.');
      console.error('Payment initialization error:', error);
    }
  };

  const handleBackToBasket = () => {
    setShowCheckout(false);
    setShowPayment(false);
    setPaymentError('');
  };

  const handleBackToCheckout = () => {
    setShowPayment(false);
    setClientSecret('');
    setPaymentError('');
  };

  const handlePaymentSuccess = () => {
    clearBasket();
    onClose();
    window.location.href = '/success';
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
  };

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#0570de',
      colorBackground: '#ffffff',
      colorText: '#000000',
      colorDanger: '#df1b41',
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '6px',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-700 to-amber-800 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <ShoppingCart size={28} />
                Your Selection
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-amber-100">
              {basket.items.length} {basket.items.length === 1 ? 'bottle' : 'bottles'} selected
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {!showCheckout && !showPayment ? (
              <>
                {basket.items.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-black font-medium">Your basket is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {basket.items.map((item: BasketItem) => (
                      <div key={item.wine.id} className="bg-gradient-to-r from-amber-50 to-white border border-amber-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-lg mb-1">{item.wine.name}</h4>
                            {item.wine.vintage && <p className="text-sm text-black mb-1">{item.wine.vintage}</p>}
                            {item.wine.meta && <p className="text-sm text-amber-600 font-medium">{item.wine.meta}</p>}
                          </div>
                          <button
                            onClick={() => removeItem(item.wine.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => updateQuantity(item.wine.id, item.quantity - 1)}
                              className="p-2 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="w-12 text-center font-bold text-lg">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.wine.id, item.quantity + 1)}
                              className="p-2 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold text-lg text-black">€{(item.wine.priceEUR * item.quantity).toFixed(2)}</p>
                            <p className="text-sm text-black">€{item.wine.priceEUR.toFixed(2)} each</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : showCheckout ? (
              <CheckoutForm
                subtotal={basket.total}
                bottleCount={bottleCount}
                onShippingCalculated={setShipping}
                onProceedToPayment={handleCheckout}
                basketItems={basket.items}
              />
            ) : (
              clientSecret &&
              (stripePromise ? (
                <Elements options={options} stripe={stripePromise}>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-medium text-black mb-2">Order Summary</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>€{basket.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shipping:</span>
                          <span>€{shipping.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-medium text-black border-t pt-1">
                          <span>Total:</span>
                          <span>€{finalTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <StripePaymentForm 
                      customerDetails={customerDetails!}
                      basket={basket}
                      shipping={shipping}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                    />
                  </div>
                </Elements>
              ) : (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  Payments are not configured. Please set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in Vercel Environment Variables and redeploy.
                </div>
              ))
            )}
          </div>

          
          {basket.items.length > 0 && !showPayment && (
            <div className="border-t p-4 space-y-3">
              {paymentError && (
                <div className="bg-red-100 text-red-800 p-3 rounded-md text-sm">
                  {paymentError}
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-black">Subtotal:</span>
                  <span className="text-black">€{basket.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-black">Shipping:</span>
                  <span className="text-black">{shipping === 0 ? 'FREE' : `€${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-lg font-semibold text-black">Total:</span>
                  <span className="text-xl font-bold text-black">€{finalTotal.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                {showCheckout ? (
                  <>
                    <button
                      onClick={handleBackToBasket}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Back to Basket
                    </button>
                  </>
                ) : showPayment ? (
                  <>
                    <button
                      onClick={handleBackToCheckout}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Back to Checkout
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setShowCheckout(true)}
                      className="flex-1 bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors font-medium"
                    >
                      Proceed to Checkout
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
