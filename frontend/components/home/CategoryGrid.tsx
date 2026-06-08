"use client";

import Link from "next/link";
import { useCategories } from "@/lib/hooks/useCategories";
import { Loader2 } from "lucide-react";

export function CategoryGrid() {
  const { data: categories, isLoading } = useCategories();

  return (
    <section className="py-12 bg-[#FAFAF8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold text-[#1A1A1A]">Shop by category</h2>
          <Link href="/shop" className="text-sm font-medium text-[#C8956C] hover:text-[#B07D57] transition-colors">
            Browse all →
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[#C8956C]" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {(categories ?? []).map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop?category=${encodeURIComponent(cat.name)}`}
                className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-[#E8E0D8] hover:border-[#C8956C] hover:shadow-warm-md transition-all text-center"
              >
                <p className="text-xs font-semibold text-[#1A1A1A] group-hover:text-[#C8956C] transition-colors leading-tight">
                  {cat.name}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
