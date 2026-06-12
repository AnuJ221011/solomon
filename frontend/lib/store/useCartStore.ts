import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem } from '@/types'

interface CartState {
  items: CartItem[]
}

interface CartActions {
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, qty: number) => void
  clearCart: () => void
  getItemsByBrand: () => Record<string, CartItem[]>
  getTotalItems: () => number
  getTotalValue: () => number
}

type CartStore = CartState & CartActions

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
  // ─── State ──────────────────────────────────────────────────────────────────
  items: [],

  // ─── Actions ────────────────────────────────────────────────────────────────

  addItem: (item: CartItem) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId)

      if (existing) {
        // Increment quantity, but never below MOQ
        const newQty = existing.quantity + item.quantity
        return {
          items: state.items.map((i) =>
            i.productId === item.productId ? { ...i, quantity: newQty } : i
          ),
        }
      }

      // Ensure added quantity respects MOQ
      const safeQty = Math.max(item.quantity, item.moq)
      return { items: [...state.items, { ...item, quantity: safeQty }] }
    })
  },

  removeItem: (productId: string) => {
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    }))
  },

  updateQuantity: (productId: string, qty: number) => {
    set((state) => {
      const item = state.items.find((i) => i.productId === productId)
      if (!item) return state

      // Quantity must be at least the MOQ; if set to 0 or below, remove item
      if (qty <= 0) {
        return { items: state.items.filter((i) => i.productId !== productId) }
      }

      const safeQty = Math.max(qty, item.moq)
      return {
        items: state.items.map((i) =>
          i.productId === productId ? { ...i, quantity: safeQty } : i
        ),
      }
    })
  },

  clearCart: () => set({ items: [] }),

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
    }
  )
)
