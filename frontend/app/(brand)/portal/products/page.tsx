'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Upload, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useMyProducts } from '@/hooks/queries/useProducts'
import type { Product } from '@/hooks/queries/useProducts'

// ─── Availability badge ───────────────────────────────────────────────────────

function AvailabilityBadge({ status }: { status: string }) {
  const variantMap: Record<string, 'success' | 'error' | 'default'> = {
    ACTIVE: 'success',
    INACTIVE: 'error',
    COMING_SOON: 'default',
  }
  const labelMap: Record<string, string> = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    COMING_SOON: 'Coming Soon',
  }
  return (
    <Badge variant={variantMap[status] ?? 'default'}>
      {labelMap[status] ?? status}
    </Badge>
  )
}

// ─── Loading skeleton rows ────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <div className="bg-surface border border-border-warm rounded overflow-hidden animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border-warm last:border-0">
          <div className="w-10 h-10 rounded bg-muted-bg shrink-0" />
          <div className="flex-1">
            <div className="h-4 bg-muted-bg rounded w-1/3 mb-1" />
            <div className="h-3 bg-muted-bg rounded w-1/5" />
          </div>
          <div className="h-4 bg-muted-bg rounded w-1/6" />
          <div className="h-4 bg-muted-bg rounded w-1/8" />
          <div className="h-5 bg-muted-bg rounded w-14" />
          <div className="h-4 bg-muted-bg rounded w-16" />
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { data: products = [], isLoading, error } = useMyProducts()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState<'All' | 'ACTIVE' | 'INACTIVE' | 'COMING_SOON'>('All')

  // Derive category list from live data
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))]

  const filtered = products.filter((p) => {
    const matchSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'All' || p.category === categoryFilter
    const matchStatus = statusFilter === 'All' || p.availability === statusFilter
    return matchSearch && matchCat && matchStatus
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] leading-[1.3] font-[500] font-playfair text-primary">
          Products
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5" asChild>
            <Link href="/portal/products/import">
              <Upload size={14} aria-hidden="true" />
              Import from Shopify
            </Link>
          </Button>
          <Button size="sm" className="gap-1.5" asChild>
            <Link href="/portal/products/new">
              <Plus size={14} aria-hidden="true" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full h-9 pl-9 pr-4 rounded border border-border-warm bg-transparent text-[14px] font-public-sans text-primary placeholder:text-muted-text focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 px-3 rounded border border-border-warm bg-transparent text-[14px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as 'All' | 'ACTIVE' | 'INACTIVE' | 'COMING_SOON')
          }
          className="h-9 px-3 rounded border border-border-warm bg-transparent text-[14px] font-public-sans text-primary focus:outline-none focus:border-accent transition-colors"
        >
          <option value="All">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="COMING_SOON">Coming Soon</option>
        </select>

        {!isLoading && (
          <p className="text-[13px] font-public-sans text-muted-text ml-auto">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <SkeletonRows />
      ) : error ? (
        <div className="py-8 text-center">
          <p className="text-[14px] font-public-sans text-error">Failed to load products.</p>
        </div>
      ) : filtered.length === 0 && products.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-[16px] font-[500] font-public-sans text-primary mb-1">
            No products yet
          </p>
          <p className="text-[14px] font-public-sans text-muted-text mb-6">
            Add your first product to start selling on Solomon Bharat.
          </p>
          <Button size="sm" className="gap-1.5" asChild>
            <Link href="/portal/products/new">
              <Plus size={14} aria-hidden="true" />
              Add your first product
            </Link>
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[14px] font-public-sans text-muted-text">
            No products match your filters.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border-warm rounded overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-warm">
                {['', 'Product Name', 'Category', 'Price (INR)', 'Status', 'Actions'].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-[12px] font-[600] font-public-sans text-muted-text uppercase tracking-[0.04em]"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((product: Product) => {
                const imageUrl = product.photos?.[0]?.url ?? null

                return (
                  <tr
                    key={product.id}
                    className="border-b border-border-warm last:border-0 hover:bg-muted-bg/30 transition-colors"
                  >
                    {/* Image */}
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded border border-border-warm overflow-hidden bg-muted-bg relative shrink-0">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt=""
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full bg-muted-bg" />
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3">
                      <p className="text-[14px] font-[500] font-public-sans text-primary">
                        {product.name}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className="text-[14px] font-public-sans text-muted-text">
                        {product.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3">
                      <span className="tabular-nums text-[14px] font-public-sans">
                        ₹{product.wholesalePrice.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <AvailabilityBadge status={product.availability} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/portal/products/${product.slug}/edit`}
                          className="text-[12px] font-[600] font-public-sans text-accent hover:text-accent-hover underline underline-offset-2 transition-colors"
                        >
                          Edit
                        </Link>
                        <ToggleAvailabilityButton product={product} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Toggle availability button ───────────────────────────────────────────────
// Isolated so it can call the update mutation independently per row.

import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { toast } from 'sonner'
import { getApiError } from '@/lib/getApiError'

function ToggleAvailabilityButton({ product }: { product: Product }) {
  const queryClient = useQueryClient()

  const toggle = useMutation({
    mutationFn: () =>
      api.patch(`/products/${product.id}`, {
        availability: product.availability === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] })
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const isActive = product.availability === 'ACTIVE'

  return (
    <button
      type="button"
      onClick={() => toggle.mutate()}
      disabled={toggle.isPending}
      className={cn(
        'text-[12px] font-[600] font-public-sans transition-colors',
        toggle.isPending
          ? 'text-muted-text opacity-50 cursor-not-allowed'
          : 'text-muted-text hover:text-primary',
      )}
    >
      {isActive ? 'Deactivate' : 'Activate'}
    </button>
  )
}
