export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface ShippingDestination {
  country: string;
  state?: string;
}

const CUSTOMER_STORAGE_KEY = 'wine-ecommerce-customer';

export const customerUtils = {
  getCustomerDetails: (): CustomerDetails | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(CUSTOMER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  saveCustomerDetails: (details: CustomerDetails): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(details));
    } catch {
      console.error('Failed to save customer details to localStorage');
    }
  },

  clearCustomerDetails: (): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(CUSTOMER_STORAGE_KEY);
    } catch {
      console.error('Failed to clear customer details from localStorage');
    }
  },

  getShippingDestination: (details: CustomerDetails): ShippingDestination => {
    return {
      country: details.country,
      state: details.state
    };
  },

  getDefaultCustomerDetails: (): CustomerDetails => ({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  })
};
