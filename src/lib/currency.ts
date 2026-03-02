// Currency conversion utilities
// Current exchange rates as of 2025
const EXCHANGE_RATES = {
  USD_TO_EUR: 0.92, // 1 USD = 0.92 EUR (current rate)
  EUR_TO_USD: 1.09, // 1 EUR = 1.09 USD
  GBP_TO_EUR: 1.16, // 1 GBP = 1.16 EUR
  EUR_TO_GBP: 0.86, // 1 EUR = 0.86 GBP
};

export interface CurrencyInfo {
  code: string;
  symbol: string;
  rate: number;
}

export const SUPPORTED_CURRENCIES: { [key: string]: CurrencyInfo } = {
  EUR: { code: 'EUR', symbol: '€', rate: 1 },
  USD: { code: 'USD', symbol: '$', rate: EXCHANGE_RATES.EUR_TO_USD },
  GBP: { code: 'GBP', symbol: '£', rate: EXCHANGE_RATES.EUR_TO_GBP },
};

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = SUPPORTED_CURRENCIES[fromCurrency]?.rate || 1;
  const toRate = SUPPORTED_CURRENCIES[toCurrency]?.rate || 1;
  
  // Convert to EUR first, then to target currency
  const amountInEUR = fromCurrency === 'EUR' ? amount : amount / fromRate;
  const convertedAmount = toCurrency === 'EUR' ? amountInEUR : amountInEUR * toRate;
  
  return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
}

export function formatCurrency(
  amount: number,
  currency: string = 'EUR'
): string {
  const currencyInfo = SUPPORTED_CURRENCIES[currency];
  if (!currencyInfo) {
    return `€${amount.toFixed(2)}`;
  }
  
  return `${currencyInfo.symbol}${amount.toFixed(2)}`;
}

export function getExchangeRate(fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return 1;
  
  const fromRate = SUPPORTED_CURRENCIES[fromCurrency]?.rate || 1;
  const toRate = SUPPORTED_CURRENCIES[toCurrency]?.rate || 1;
  
  return fromCurrency === 'EUR' ? toRate : (1 / fromRate) * toRate;
}

// For displaying prices in different currencies
export function displayPriceInCurrency(
  priceEUR: number,
  targetCurrency: string = 'EUR'
): { amount: number; formatted: string } {
  const amount = convertCurrency(priceEUR, 'EUR', targetCurrency);
  const formatted = formatCurrency(amount, targetCurrency);
  
  return { amount, formatted };
}

// For updating prices in the database (if needed)
export function convertLegacyPricesToEUR(
  prices: { [key: string]: number },
  sourceCurrency: string = 'USD'
): { [key: string]: number } {
  const converted: { [key: string]: number } = {};
  
  Object.entries(prices).forEach(([key, price]) => {
    converted[key] = convertCurrency(price, sourceCurrency, 'EUR');
  });
  
  return converted;
}
