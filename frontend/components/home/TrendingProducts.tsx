"use client";

import Link from "next/link";
import { ArrowRight, Loader2, Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/lib/types";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

async function fetchTrending(): Promise<Product[]> {
  // First try: products from last 7 days
  const { data } = await api.get("/products?limit=8&sortBy=createdAt&sortOrder=desc");
  const products: Product[] = data.data.products ?? [];

  // Flag which are "new" (< 7 days old)
  return products.map((p) => ({
    ...p,
    _isNew: Date.now() - new Date(p.createdAt).getTime() < SEVEN_DAYS_MS,
  } as any));
}

export function TrendingProducts() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "trending"],
    queryFn: fetchTrending,
  });

  if (!isLoading && (!products || products.length === 0)) return null;

  return (
    <section className="py-14 bg-white border-y border-[#E8E0D8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-5 w-5 text-[#C8956C]" />
              <span className="text-xs font-semibold text-[#C8956C] uppercase tracking-widest">
                New this week
              </span>
            </div>
            <h2 className="font-heading text-3xl font-bold text-[#1A1A1A]">
              Just arrived
            </h2>
            <p className="mt-1 text-sm text-[#6B6056]">
              Fresh wholesale products from verified Indian brands
            </p>
          </div>
          <Link href="/shop?sortBy=createdAt&sortOrder=desc"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-[#C8956C] hover:text-[#B07D57] transition-colors">
            View all new <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#C8956C]" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products?.map((product: any) => (
              <div key={product.id} className="relative">
                {product._isNew && (
                  <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2D6A4F] text-white uppercase tracking-wider">
                    New
                  </div>
                )}
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
