'use client';

export interface Wine {
  id: string;
  name: string;
  meta?: string;
  priceEUR: number;
  priceNote?: string;
  vintage?: string;
  description?: string;
  grapeVariety?: string;
  region?: string;
  abv?: number;
  bottleSize?: string;
  image?: string;
  inStock?: boolean;
}

export interface BasketItem {
  wine: Wine;
  quantity: number;
}

export interface Basket {
  items: BasketItem[];
  total: number;
}

const BASKET_STORAGE_KEY = 'wine-ecommerce-basket';

export const basketUtils = {
  getBasket: (): Basket => {
    if (typeof window === 'undefined') return { items: [], total: 0 };
    
    try {
      const stored = localStorage.getItem(BASKET_STORAGE_KEY);
      return stored ? JSON.parse(stored) : { items: [], total: 0 };
    } catch {
      return { items: [], total: 0 };
    }
  },

  saveBasket: (basket: Basket): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(basket));
    } catch {
      console.error('Failed to save basket to localStorage');
    }
  },

  addItem: (wine: Wine, quantity: number = 1): Basket => {
    const basket = basketUtils.getBasket();
    const existingItemIndex = basket.items.findIndex(item => item.wine.id === wine.id);

    if (existingItemIndex >= 0) {
      basket.items[existingItemIndex].quantity += quantity;
    } else {
      basket.items.push({ wine, quantity });
    }

    basket.total = basket.items.reduce((sum, item) => sum + (item.wine.priceEUR * item.quantity), 0);
    basketUtils.saveBasket(basket);
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('basket-updated'));
    }
    
    return basket;
  },

  removeItem: (wineId: string): Basket => {
    const basket = basketUtils.getBasket();
    basket.items = basket.items.filter(item => item.wine.id !== wineId);
    
    basket.total = basket.items.reduce((sum, item) => sum + (item.wine.priceEUR * item.quantity), 0);
    basketUtils.saveBasket(basket);
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('basket-updated'));
    }
    
    return basket;
  },

  updateQuantity: (wineId: string, quantity: number): Basket => {
    const basket = basketUtils.getBasket();
    const itemIndex = basket.items.findIndex(item => item.wine.id === wineId);

    if (itemIndex >= 0) {
      if (quantity <= 0) {
        basket.items.splice(itemIndex, 1);
      } else {
        basket.items[itemIndex].quantity = quantity;
      }
    }

    basket.total = basket.items.reduce((sum, item) => sum + (item.wine.priceEUR * item.quantity), 0);
    basketUtils.saveBasket(basket);
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('basket-updated'));
    }
    
    return basket;
  },

  clearBasket: (): Basket => {
    const emptyBasket = { items: [], total: 0 };
    basketUtils.saveBasket(emptyBasket);
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('basket-updated'));
    }
    
    return emptyBasket;
  },

  getItemCount: (): number => {
    const basket = basketUtils.getBasket();
    return basket.items.reduce((count, item) => count + item.quantity, 0);
  }
};
