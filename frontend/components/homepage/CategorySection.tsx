'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useCategories } from '@/hooks/queries/useCategories'

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CategorySkeleton() {
  return (
    <div className="flex flex-col bg-surface border border-border-warm rounded overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-muted-bg" />
      <div className="p-3">
        <div className="h-4 bg-muted-bg rounded w-3/4" />
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CategorySection() {
  const { data, isLoading } = useCategories()
  const categories = data?.slice(0, 8) ?? []

  return (
    <section className="py-12 bg-bg">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">

        {/* Header — headline-lg: 32px / 500 */}
        <div className="flex items-baseline justify-between mb-10">
          <div>
            <p className="font-public-sans text-[12px] font-[600] text-accent uppercase tracking-[0.08em] mb-3">
              Browse by Category
            </p>
            <h2 className="font-playfair font-[500] text-primary leading-[1.2] text-[28px] lg:text-[32px]">
              Every Product Category, One Platform
            </h2>
          </div>
          <Link
            href="/catalogue"
            className="hidden sm:inline-flex items-center gap-1 font-public-sans text-[13px] font-[600] text-muted-text hover:text-primary transition-colors flex-shrink-0 ml-6"
          >
            View all <ArrowRight size={12} aria-hidden="true" />
          </Link>
        </div>

        {/* 2×3 grid — 4px radius cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <CategorySkeleton key={i} />)
            : categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/catalogue?category=${category.slug}`}
                  className="group flex flex-col bg-surface border border-border-warm rounded overflow-hidden hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(26,26,26,0.04)] transition-all duration-200"
                >
                  {/* Image */}
                  <div className="aspect-[4/3] overflow-hidden bg-muted-bg relative">
                    <Image
                      src={category.imageUrl ?? `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop`}
                      alt={category.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </div>
                  {/* Text */}
                  <div className="p-3">
                    <p className="font-playfair font-[500] text-primary text-[15px] sm:text-[16px] leading-snug">
                      {category.name}
                    </p>
                    {(category.productCount ?? 0) > 0 && (
                      <p className="font-public-sans text-[12px] text-muted-text mt-0.5">
                        {category.productCount} products
                      </p>
                    )}
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  )
}
