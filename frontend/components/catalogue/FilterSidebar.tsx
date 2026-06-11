'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CatalogueFilters {
  categories: string[]
  shipsTo: string
  priceMin: string
  priceMax: string
}

interface FilterSidebarProps {
  onFilterChange: (filters: CatalogueFilters) => void
  categories: string[]
  initialCategories?: string[]
}

// ─── Ships To options ─────────────────────────────────────────────────────────

const SHIPS_TO_OPTIONS = [
  { value: 'all', label: 'All regions' },
  { value: 'india', label: 'India' },
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'eu', label: 'European Union' },
  { value: 'uae', label: 'UAE & Middle East' },
  { value: 'sea', label: 'Southeast Asia' },
]

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] font-[500] font-public-sans text-muted-text uppercase tracking-[0.05em] mb-3">
      {children}
    </p>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FilterSidebar({ onFilterChange, categories, initialCategories = [] }: FilterSidebarProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories)
  const [shipsTo, setShipsTo] = useState('all')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

  const notify = useCallback(
    (overrides: Partial<CatalogueFilters> = {}) => {
      onFilterChange({
        categories: selectedCategories,
        shipsTo,
        priceMin,
        priceMax,
        ...overrides,
      })
    },
    [onFilterChange, selectedCategories, shipsTo, priceMin, priceMax]
  )

  function toggleCategory(cat: string) {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat]
    setSelectedCategories(next)
    notify({ categories: next })
  }

  function handleShipsTo(value: string) {
    setShipsTo(value)
    notify({ shipsTo: value })
  }

  function handlePriceCommit() {
    notify()
  }

  function handleClearAll() {
    setSelectedCategories([])
    setShipsTo('all')
    setPriceMin('')
    setPriceMax('')
    onFilterChange({ categories: [], shipsTo: 'all', priceMin: '', priceMax: '' })
  }

  const hasActiveFilters =
    selectedCategories.length > 0 || shipsTo !== 'all' || priceMin !== '' || priceMax !== ''

  return (
    <aside
      className={cn(
        'w-60 flex-shrink-0 sticky top-20 self-start',
        'bg-surface border-r border-border-warm',
        'p-6 overflow-y-auto max-h-[calc(100vh-5rem)]',
        // Mobile hidden — parent renders a sheet trigger instead
        'hidden lg:block'
      )}
      aria-label="Catalogue filters"
    >
      {/* ── Category ─────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <SectionHeading>Category</SectionHeading>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const active = selectedCategories.includes(cat)
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={cn(
                  'rounded text-[12px] font-[500] font-public-sans px-3 py-1 cursor-pointer border border-border-warm transition-colors',
                  active
                    ? 'bg-accent text-white border-accent'
                    : 'bg-muted-bg text-muted-text hover:border-primary/30'
                )}
                aria-pressed={active}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Divider ───────────────────────────────────────────────────────────── */}
      <div className="border-t border-border-warm mb-6" />

      {/* ── Ships To ──────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <SectionHeading>Ships To</SectionHeading>
        <div className="flex flex-col gap-2">
          {SHIPS_TO_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <input
                type="radio"
                name="ships-to"
                value={opt.value}
                checked={shipsTo === opt.value}
                onChange={() => handleShipsTo(opt.value)}
                className="accent-accent w-3.5 h-3.5 flex-shrink-0"
              />
              <span
                className={cn(
                  'text-[14px] font-[500] font-public-sans leading-[1.4] transition-colors',
                  shipsTo === opt.value ? 'text-primary' : 'text-muted-text group-hover:text-primary'
                )}
              >
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Divider ───────────────────────────────────────────────────────────── */}
      <div className="border-t border-border-warm mb-6" />

      {/* ── Price Range ───────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <SectionHeading>Wholesale Price (INR)</SectionHeading>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            onBlur={handlePriceCommit}
            onKeyDown={(e) => e.key === 'Enter' && handlePriceCommit()}
            min={0}
            className="text-[14px] h-9"
            aria-label="Minimum price in INR"
          />
          <span className="text-[12px] text-muted-text font-public-sans flex-shrink-0">–</span>
          <Input
            type="number"
            placeholder="Max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            onBlur={handlePriceCommit}
            onKeyDown={(e) => e.key === 'Enter' && handlePriceCommit()}
            min={0}
            className="text-[14px] h-9"
            aria-label="Maximum price in INR"
          />
        </div>
        <p className="text-[11px] text-muted-text font-public-sans mt-1.5">
          Press Enter or click outside to apply
        </p>
      </div>

      {/* ── Clear All ─────────────────────────────────────────────────────────── */}
      {hasActiveFilters && (
        <>
          <div className="border-t border-border-warm mb-4" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="w-full text-[13px]"
          >
            Clear all filters
          </Button>
        </>
      )}
    </aside>
  )
}
