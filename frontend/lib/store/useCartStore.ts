import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem } from '@/types'

interface CartState {
  items: CartItem[]
}

interface CartActions {
  addItem: (item: CartItem) => void
  removeItem: (productId: string, variantId?: string) => void
  removeItems: (productIds: string[]) => void
  updateQuantity: (productId: string, qty: number, variantId?: string) => void
  clearCart: () => void
  getItemsByBrand: () => Record<string, CartItem[]>
  getTotalItems: () => number
  getTotalValue: () => number
  // Transient — which product IDs are staged for the current checkout session.
  // null means "all items" (e.g. when coming from the main cart page).
  checkoutItemIds: string[] | null
  setCheckoutItems: (ids: string[]) => void
  clearCheckoutItems: () => void
}

type CartStore = CartState & CartActions

// Snaps a requested quantity to the moq + k*stepQty grid, clamped at moq.
function snapToStep(qty: number, moq: number, stepQty?: number): number {
  const floor = Math.max(qty, moq)
  const step = stepQty ?? 1
  if (step <= 1) return floor
  return moq + Math.round((floor - moq) / step) * step
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
  // ─── State ──────────────────────────────────────────────────────────────────
  items: [],
  checkoutItemIds: null,

  // ─── Actions ────────────────────────────────────────────────────────────────

  addItem: (item: CartItem) => {
    set((state) => {
      // A line is unique by product + variant — two different variants of the
      // same product must not collapse into one row with one blended price.
      const existing = state.items.find(
        (i) => i.productId === item.productId && i.variantId === item.variantId
      )

      if (existing) {
        // Increment quantity, but never below MOQ and always on the case-pack grid
        const newQty = snapToStep(existing.quantity + item.quantity, existing.moq, existing.stepQty)
        return {
          items: state.items.map((i) =>
            i === existing ? { ...i, quantity: newQty } : i
          ),
        }
      }

      // Ensure added quantity respects MOQ and the case-pack step
      const safeQty = snapToStep(item.quantity, item.moq, item.stepQty)
      return { items: [...state.items, { ...item, quantity: safeQty }] }
    })
  },

  removeItem: (productId: string, variantId?: string) => {
    set((state) => ({
      items: state.items.filter((i) => !(i.productId === productId && i.variantId === variantId)),
    }))
  },

  removeItems: (productIds: string[]) => {
    const ids = new Set(productIds)
    set((state) => ({
      items: state.items.filter((i) => !ids.has(i.productId)),
    }))
  },

  updateQuantity: (productId: string, qty: number, variantId?: string) => {
    set((state) => {
      const item = state.items.find((i) => i.productId === productId && i.variantId === variantId)
      if (!item) return state

      // Quantity must be at least the MOQ; if set to 0 or below, remove item
      if (qty <= 0) {
        return { items: state.items.filter((i) => i !== item) }
      }

      const safeQty = snapToStep(qty, item.moq, item.stepQty)
      return {
        items: state.items.map((i) => (i === item ? { ...i, quantity: safeQty } : i)),
      }
    })
  },

  clearCart: () => set({ items: [], checkoutItemIds: null }),

  setCheckoutItems: (ids: string[]) => set({ checkoutItemIds: ids }),

  clearCheckoutItems: () => set({ checkoutItemIds: null }),

  getItemsByBrand: (): Record<string, CartItem[]> => {
    const { items } = get()
    return items.reduce<Record<string, CartItem[]>>((acc, item) => {
      const key = item.brandId
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {})
  },

  getTotalItems: (): number => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0)
  },

  getTotalValue: (): number => {
    return get().items.reduce(
      (sum, item) => sum + item.wholesalePrice * item.quantity,
      0
    )
  },
}),
    {
      name: 'sb_cart',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : (null as never)
      ),
      partialize: (state) => ({ items: state.items }),
    }
  )
)
