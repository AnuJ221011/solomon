"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/lib/types";

async function fetchFeaturedProducts(): Promise<Product[]> {
  const { data } = await api.get("/products?limit=8&sortBy=rank");
  return data.data.products ?? [];
}

export function FeaturedProducts() {
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: fetchFeaturedProducts,
  });

  return (
    <section className="py-14 bg-[#FAFAF8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-heading text-3xl font-bold text-[#1A1A1A]">
              New arrivals
            </h2>
            <p className="mt-1 text-sm text-[#6B6056]">
              Hand-picked from India's top artisan brands
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-[#C8956C] hover:text-[#B07D57] transition-colors"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-7 w-7 animate-spin text-[#C8956C]" />
          </div>
        ) : isError ? (
          <div className="text-center py-16 text-[#6B6056] text-sm">
            Unable to load products right now.
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#F5EDE6] rounded-2xl">
            <p className="text-[#6B6056] font-heading text-lg">
              Products launching soon
            </p>
            <p className="text-sm text-[#6B6056] mt-1">
              Be the first to browse when we open.
            </p>
          </div>
        )}

        {/* Mobile "View all" */}
        <div className="mt-8 flex justify-center sm:hidden">
          <Link
            href="/shop"
            className="flex items-center gap-1.5 text-sm font-medium text-[#C8956C]"
          >
            View all products <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
