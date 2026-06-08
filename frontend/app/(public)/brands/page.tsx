"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useBrands } from "@/lib/hooks/useBrands";
import { useCategoriesFlat } from "@/lib/hooks/useCategories";
import { AchievementBadge } from "@/components/shared/AchievementBadge";
import type { AchievementLevel } from "@/lib/types";

const LEVELS = [
  { value: "", label: "All levels" },
  { value: "L5_LEGEND",  label: "Legend"  },
  { value: "L4_ELITE",   label: "Elite"   },
  { value: "L3_TRUSTED", label: "Trusted" },
  { value: "L2_RISING",  label: "Rising"  },
  { value: "L1_SPROUT",  label: "Sprout"  },
];


export default function BrandsPage() {
  const { data: categories = [] } = useCategoriesFlat();
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [category, setCategory] = useState("");

  const { data, isLoading } = useBrands({
    search: search || undefined,
    level: level || undefined,
    category: category || undefined,
    limit: 24,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold text-[#1A1A1A]">Browse brands</h1>
        <p className="mt-2 text-[#6B6056]">Verified Indian artisan brands ready to ship wholesale worldwide.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6056]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brands…"
            className="w-full pl-9 pr-4 h-10 rounded-lg border border-[#E8E0D8] bg-white text-sm text-[#1A1A1A] placeholder:text-[#6B6056] focus:outline-none focus:border-[#C8956C]" />
        </div>
        <select value={level} onChange={(e) => setLevel(e.target.value)}
          className="h-10 pl-3 pr-8 rounded-lg border border-[#E8E0D8] bg-white text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C8956C] cursor-pointer">
          {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="h-10 pl-3 pr-8 rounded-lg border border-[#E8E0D8] bg-white text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C8956C] cursor-pointer">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-[#C8956C]" /></div>
      ) : (
        <>
          <p className="text-sm text-[#6B6056] mb-5">{data?.total ?? 0} brands</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {data?.brands.map((brand) => (
              <Link key={brand.id} href={`/brands/${brand.slug}`}
                className="group bg-white rounded-xl border border-[#E8E0D8] p-5 flex flex-col items-center text-center hover:border-[#C8956C] hover:shadow-warm-md transition-all">
                <div className="h-16 w-16 rounded-full bg-[#F5EDE6] border border-[#E8E0D8] overflow-hidden flex items-center justify-center mb-4">
                  {brand.logoUrl ? (
                    <Image src={brand.logoUrl} alt={brand.brandName} width={64} height={64} className="object-cover" />
                  ) : (
                    <span className="font-heading text-2xl font-bold text-[#C8956C]">{brand.brandName.charAt(0)}</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-[#1A1A1A] group-hover:text-[#C8956C] transition-colors line-clamp-1 mb-1.5">{brand.brandName}</p>
                <AchievementBadge level={brand.achievementLevel as AchievementLevel} size="sm" />
                {brand.category?.[0] && (
                  <p className="mt-1.5 text-[11px] text-[#6B6056]">{brand.category[0]}</p>
                )}
                <div className="mt-2 flex items-center gap-1 text-[11px] text-[#6B6056]">
                  <span>⭐ {brand.avgRating > 0 ? brand.avgRating.toFixed(1) : "New"}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
