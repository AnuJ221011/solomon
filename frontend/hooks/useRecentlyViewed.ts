'use client'

import { useState, useEffect, useCallback } from 'react'

const KEY = 'sb_recently_viewed'
const MAX = 20

export interface RecentProduct {
  id: string
  slug: string
  name: string
  imageUrl: string
  price: number
  brandName: string
  brandSlug: string
}

function read(): RecentProduct[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

function write(items: RecentProduct[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {}
}

export function useRecentlyViewed() {
  const [products, setProducts] = useState<RecentProduct[]>([])

  useEffect(() => {
    setProducts(read())
  }, [])

  const track = useCallback((product: RecentProduct) => {
    setProducts((prev) => {
      const deduped = prev.filter((p) => p.id !== product.id)
      const next = [product, ...deduped].slice(0, MAX)
      write(next)
      return next
    })
  }, [])

  return { products, track }
}
