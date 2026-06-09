"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { AchievementBadge } from "@/components/shared/AchievementBadge";
import type { BrandProfile } from "@/lib/types";

async function fetchBrands(): Promise<BrandProfile[]> {
  const { data } = await api.get("/brands?limit=6");
  return data.data.brands ?? [];
}

export function BrandsSection() {
  const { data: brands, isLoading } = useQuery({
    queryKey: ["brands", "homepage"],
    queryFn: fetchBrands,
  });

  return (
    <section className="py-14 bg-[#F9F7F2]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-heading text-3xl font-bold text-[#1A1A1A]">
              Featured brands
            </h2>
            <p className="mt-1 text-sm text-[#444748]">
              Verified Indian artisan sellers
            </p>
          </div>
          <Link
            href="/brands"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-[#A68B67] hover:text-[#8B7055] transition-colors"
          >
            All brands <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#A68B67]" />
          </div>
        ) : brands && brands.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/brands/${brand.slug}`}
                className="group flex flex-col items-center p-4 bg-white rounded-lg border border-[#E5E1D8] hover:border-[#A68B67] hover:shadow-warm-md transition-all text-center"
              >
                {/* Logo */}
                <div className="h-14 w-14 rounded bg-[#F5F0E8] border border-[#E5E1D8] overflow-hidden flex items-center justify-center mb-3">
                  {brand.logoUrl ? (
                    <Image
                      src={brand.logoUrl}
                      alt={brand.brandName}
                      width={56}
                      height={56}
                      className="object-cover"
                    />
                  ) : (
                    <span className="font-heading text-lg font-bold text-[#A68B67]">
                      {brand.brandName.charAt(0)}
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold text-[#1A1A1A] line-clamp-1 group-hover:text-[#A68B67] transition-colors">
                  {brand.brandName}
                </p>

                <div className="mt-1.5">
                  <AchievementBadge level={brand.achievementLevel} size="sm" />
                </div>

                {brand.category?.[0] && (
                  <p className="mt-1 text-[10px] text-[#444748]">{brand.category[0]}</p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-[#444748] text-sm">
            Brands launching soon.
          </div>
        )}
      </div>
    </section>
  );
}