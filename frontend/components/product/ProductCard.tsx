"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useCurrencyStore } from "@/lib/stores/currencyStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { AchievementBadge } from "@/components/shared/AchievementBadge";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  product: Product;
  onSave?: (productId: string) => void;
  isSaved?: boolean;
  className?: string;
}

export function ProductCard({ product, onSave, isSaved, className }: Props) {
  const { format } = useCurrencyStore();
  const { isAuthenticated } = useAuthStore();

  const primaryPhoto = product.photos?.[0]?.url;
  const price = format(product.wholesalePriceInr);

  return (
    <article
      className={cn(
        "group relative bg-white rounded-lg border border-[#E5E1D8] overflow-hidden",
        "transition-all duration-200 hover:border-[#A68B67] hover:shadow-warm-md",
        className
      )}
    >
      {/* Product image */}
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square bg-[#F5F0E8] overflow-hidden">
          {primaryPhoto ? (
            <Image
              src={primaryPhoto}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl text-[#E5E1D8]">✦</span>
            </div>
          )}

          {/* Save button */}
          {isAuthenticated() && onSave && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onSave(product.id);
              }}
              className={cn(
                "absolute top-2 right-2 h-7 w-7 rounded-full flex items-center justify-center transition-all",
                "opacity-0 group-hover:opacity-100",
                isSaved
                  ? "bg-[#1A1A1A] text-white opacity-100"
                  : "bg-white/90 text-[#444748] hover:text-[#A68B67]"
              )}
              aria-label={isSaved ? "Unsave" : "Save"}
            >
              <Heart className="h-3.5 w-3.5" fill={isSaved ? "currentColor" : "none"} />
            </button>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-3">
        {/* Brand + badge */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs text-[#444748] truncate">{product.brandProfile.brandName}</span>
          <AchievementBadge level={product.brandProfile.achievementLevel} size="sm" />
        </div>

        {/* Product name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-sans text-sm font-medium text-[#1A1A1A] line-clamp-2 leading-snug group-hover:text-[#A68B67] transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Variant color dots (if product has color variants) */}
        {(() => {
          const variants = (product as any).variants ?? [];
          const colorAttrs = variants.flatMap((v: any) =>
            v.attributes?.filter((a: any) => a.name.toLowerCase() === "color" || a.name.toLowerCase() === "colour") ?? []
          );
          const uniqueColors = [...new Set(colorAttrs.map((a: any) => a.value))] as string[];
          if (uniqueColors.length > 1) {
            return (
              <div className="flex items-center gap-1 mt-1.5">
                {uniqueColors.slice(0, 5).map((c) => (
                  <span key={c} title={c}
                    className="h-3 w-3 rounded border border-[#E5E1D8] shrink-0"
                    style={{ background: c.toLowerCase() === "white" ? "#fff" : c.toLowerCase() === "black" ? "#1a1a1a" : c.toLowerCase() }}
                  />
                ))}
                {uniqueColors.length > 5 && (
                  <span className="text-[10px] text-[#444748]">+{uniqueColors.length - 5}</span>
                )}
              </div>
            );
          }
          if (variants.length > 1) {
            return <p className="text-[10px] text-[#444748] mt-1">{variants.length} variants</p>;
          }
          return null;
        })()}

        {/* Price + MOQ */}
        <div className="mt-2 flex items-baseline justify-between">
          <div>
            <span className="text-sm font-semibold text-[#1A1A1A]">{price}</span>
            <span className="text-xs text-[#444748] ml-1">/ unit</span>
          </div>
          <span className="text-xs text-[#444748] bg-[#F5F0E8] px-1.5 py-0.5 rounded">
            MOQ {product.moq}
          </span>
        </div>
      </div>
    </article>
  );
}