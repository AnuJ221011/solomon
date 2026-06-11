'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useCategories } from '@/hooks/queries/useCategories'

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CategorySkeleton() {
  return <div className="rounded bg-muted-bg animate-pulse aspect-[4/3]" />
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CategorySection() {
  const { data, isLoading } = useCategories()
  const categories = data?.slice(0, 6) ?? []

  return (
    <section className="py-24 bg-bg">
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 lg:gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <CategorySkeleton key={i} />)
            : categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/catalogue?category=${category.slug}`}
                  className="group relative rounded overflow-hidden bg-muted-bg aspect-[4/3] flex flex-col justify-end"
                >
                  <Image
                    src={`https://picsum.photos/seed/${category.slug}-v2/800/600`}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(26,26,26,0.72) 0%, rgba(26,26,26,0.15) 50%, transparent 100%)',
                    }}
                    aria-hidden="true"
                  />
                  <div className="relative p-4 sm:p-5">
                    <p className="text-white font-playfair font-[500] text-[17px] sm:text-[19px] leading-snug">
                      {category.name}
                    </p>
                    {category.productCount > 0 && (
                      <p className="text-white/60 font-public-sans text-[12px] mt-0.5">
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
