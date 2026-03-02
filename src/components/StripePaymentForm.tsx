'use client';

import { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CustomerDetails } from '@/lib/customer';
import { Basket } from '@/lib/basket';

interface StripePaymentFormProps {
  customerDetails: CustomerDetails;
  basket: Basket;
  shipping: number;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

export default function StripePaymentForm({
  customerDetails,
  basket,
  shipping,
  onPaymentSuccess,
  onPaymentError
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!stripe) return;

    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    if (clientSecret) {
      stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
        switch (paymentIntent?.status) {
          case 'succeeded':
            setMessage('Payment succeeded!');
            break;
          case 'processing':
            setMessage('Your payment is processing.');
            break;
          case 'requires_payment_method':
            setMessage('Your payment was not successful, please try again.');
            break;
          default:
            setMessage('Something went wrong.');
            break;
        }
      });
    }
  }, [stripe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage('');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
        receipt_email: customerDetails.email,
        shipping: {
          name: customerDetails.name,
          address: {
            line1: customerDetails.address,
            city: customerDetails.city,
            state: customerDetails.state,
            postal_code: customerDetails.zip,
            country: customerDetails.country,
          },
        },
        payment_method_data: {
          billing_details: {
            name: customerDetails.name,
            email: customerDetails.email,
            phone: customerDetails.phone,
            address: {
              line1: customerDetails.address,
              city: customerDetails.city,
              state: customerDetails.state,
              postal_code: customerDetails.zip,
              country: customerDetails.country,
            },
          },
        },
      },
    });

    if (error.type === 'card_error' || error.type === 'validation_error') {
      setMessage(error.message || 'An unexpected error occurred.');
      onPaymentError(error.message || 'Payment failed');
    } else {
      setMessage('An unexpected error occurred.');
      onPaymentError('An unexpected error occurred.');
    }

    setIsLoading(false);
  };

  const paymentElementOptions = {
    layout: 'tabs' as const,
    paymentMethodOrder: ['apple_pay', 'card'],
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement 
        id="payment-element" 
        options={paymentElementOptions}
        className="py-4"
      />
      
      <button
        disabled={isLoading || !stripe || !elements}
        id="submit"
        className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
      >
        <span id="button-text">
          {isLoading ? 'Processing...' : `Pay €${(basket.total + shipping).toFixed(2)}`}
        </span>
      </button>

      {message && (
        <div 
          id="payment-message" 
          className={`text-sm p-3 rounded-md ${
            message.includes('succeeded') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}
        >
          {message}
        </div>
      )}
    </form>
  );
}
