"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  MapPin, Calendar, Globe, ExternalLink,
  Star, Package, ShoppingBag, ArrowLeft,
} from "lucide-react";
import { useBrand } from "@/lib/hooks/useBrands";
import { AchievementBadge } from "@/components/shared/AchievementBadge";
import { ProductCard } from "@/components/product/ProductCard";
import { cn } from "@/lib/utils";

interface Props { slug: string; }

export function BrandStorefront({ slug }: Props) {
  const { data: brand, isLoading, isError } = useBrand(slug);
  const [activeTab, setActiveTab] = useState<"products" | "about">("products");

  if (isLoading) return <BrandSkeleton />;
  if (isError || !brand) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="text-5xl mb-4">🏪</span>
        <h2 className="font-heading text-2xl font-semibold text-[#1A1A1A] mb-2">Brand not found</h2>
        <Link href="/brands" className="text-sm text-[#A68B67] font-medium">← All brands</Link>
      </div>
    );
  }

  const products = (brand as any).products ?? [];
  const activeProducts = products.filter((p: any) => p.availability === "ACTIVE");

  return (
    <div>
      {/* Banner */}
      <div className="relative h-48 sm:h-64 lg:h-80 bg-[#F5F0E8] overflow-hidden">
        {brand.bannerUrl ? (
          <Image src={brand.bannerUrl} alt={brand.brandName} fill className="object-cover" priority />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, #F5F0E8 0%, #E8D5C4 50%, #D4B8A0 100%)",
            }}
          />
        )}
        {/* Back */}
        <Link
          href="/brands"
          className="absolute top-4 left-4 flex items-center gap-1.5 text-sm font-medium bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full hover:bg-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All brands
        </Link>
      </div>

      {/* Brand header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end gap-5 -mt-10 mb-6 relative">
          {/* Logo */}
          <div className="h-20 w-20 rounded-lg border-4 border-white bg-[#F5F0E8] overflow-hidden shrink-0 shadow-warm-md">
            {brand.logoUrl ? (
              <Image src={brand.logoUrl} alt={brand.brandName} width={80} height={80} className="object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <span className="font-heading text-3xl font-bold text-[#A68B67]">
                  {brand.brandName.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Name + badge */}
          <div className="pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading text-2xl lg:text-3xl font-bold text-[#1A1A1A]">
                {brand.brandName}
              </h1>
              <AchievementBadge level={brand.achievementLevel} size="md" />
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {brand.category.map((c: string) => (
                <span key={c} className="text-sm text-[#444748]">{c}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex flex-wrap gap-6 mb-8 pb-6 border-b border-[#E5E1D8]">
          <StatItem icon={<Package className="h-4 w-4" />} value={activeProducts.length} label="products" />
          <StatItem icon={<ShoppingBag className="h-4 w-4" />} value={brand.confirmedOrderCount} label="orders" />
          {brand.avgRating > 0 && (
            <StatItem
              icon={<Star className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />}
              value={brand.avgRating.toFixed(1)}
              label="rating"
            />
          )}
          {brand.yearFounded && (
            <StatItem icon={<Calendar className="h-4 w-4" />} value={brand.yearFounded} label="founded" />
          )}
          <StatItem icon={<MapPin className="h-4 w-4" />} value={brand.countryOfOrigin} label="origin" />
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-[#E5E1D8] mb-8">
          {(["products", "about"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-3 text-sm font-medium capitalize border-b-2 -mb-px transition-colors",
                activeTab === tab
                  ? "border-[#A68B67] text-[#A68B67]"
                  : "border-transparent text-[#444748] hover:text-[#1A1A1A]"
              )}
            >
              {tab === "products" ? `Products (${activeProducts.length})` : "About"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "products" ? (
          activeProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-12">
              {activeProducts.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="text-[#444748]">No products listed yet.</p>
            </div>
          )
        ) : (
          <div className="max-w-2xl pb-12 space-y-6">
            {brand.brandStory && (
              <div>
                <h2 className="font-heading text-xl font-semibold text-[#1A1A1A] mb-3">Our story</h2>
                <p className="text-[#444748] leading-relaxed">{brand.brandStory}</p>
              </div>
            )}
            {brand.description && (
              <div>
                <h2 className="font-heading text-xl font-semibold text-[#1A1A1A] mb-3">About</h2>
                <p className="text-[#444748] leading-relaxed">{brand.description}</p>
              </div>
            )}
            <div className="flex gap-4">
              {brand.instagramHandle && (
                <a
                  href={`https://instagram.com/${brand.instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-[#A68B67] hover:text-[#8B7055] transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  @{brand.instagramHandle}
                </a>
              )}
              {brand.websiteUrl && (
                <a
                  href={brand.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-[#A68B67] hover:text-[#8B7055] transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatItem({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-[#444748]">
      <span className="text-[#A68B67]">{icon}</span>
      <span className="font-semibold text-[#1A1A1A]">{value}</span>
      <span>{label}</span>
    </div>
  );
}

function BrandSkeleton() {
  return (
    <div>
      <div className="h-64 bg-[#F5F0E8] animate-pulse" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-lg bg-[#F5F0E8] animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 w-48 bg-[#F5F0E8] rounded animate-pulse" />
            <div className="h-4 w-32 bg-[#F5F0E8] rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-[#F5F0E8] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
