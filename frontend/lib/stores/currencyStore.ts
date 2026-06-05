import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CurrencyStore {
  currency: string;
  rates: Record<string, number>;
  setCurrency: (currency: string) => void;
  setRates: (rates: Record<string, number>) => void;
  convert: (amountInr: number) => number;
  format: (amountInr: number) => string;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      currency: "USD",
      rates: {},

      setCurrency: (currency) => set({ currency }),
      setRates: (rates) => set({ rates }),

      convert: (amountInr) => {
        const { currency, rates } = get();
        if (currency === "INR") return amountInr;
        const rate = rates[currency];
        if (!rate) return amountInr;
        return parseFloat((amountInr * rate).toFixed(2));
      },

      format: (amountInr) => {
        const { currency, convert } = get();
        const amount = convert(amountInr);
        try {
          return new Intl.NumberFormat("en", {
            style: "currency",
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }).format(amount);
        } catch {
          return `${currency} ${amount}`;
        }
      },
    }),
    {
      name: "sb-currency",
      partialize: (state) => ({ currency: state.currency }),
    }
  )
);
