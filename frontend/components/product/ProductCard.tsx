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
  const margin = product.msrpInr
    ? Math.round(((product.msrpInr - product.wholesalePriceInr) / product.msrpInr) * 100)
    : null;

  return (
    <article
      className={cn(
        "group relative bg-white rounded-xl border border-[#E8E0D8] overflow-hidden",
        "transition-all duration-200 hover:border-[#C8956C] hover:shadow-warm-md",
        className
      )}
    >
      {/* Product image */}
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square bg-[#F5EDE6] overflow-hidden">
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
              <span className="text-4xl text-[#E8E0D8]">✦</span>
            </div>
          )}

          {/* Margin badge */}
          {margin && margin > 0 && (
            <div className="absolute top-2 left-2 bg-[#2D6A4F] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
              {margin}% margin
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
                  ? "bg-[#C8956C] text-white opacity-100"
                  : "bg-white/90 text-[#6B6056] hover:text-[#C8956C]"
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
          <span className="text-xs text-[#6B6056] truncate">{product.brandProfile.brandName}</span>
          <AchievementBadge level={product.brandProfile.achievementLevel} size="sm" />
        </div>

        {/* Product name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-sans text-sm font-medium text-[#1A1A1A] line-clamp-2 leading-snug group-hover:text-[#C8956C] transition-colors">
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
                    className="h-3 w-3 rounded-full border border-[#E8E0D8] shrink-0"
                    style={{ background: c.toLowerCase() === "white" ? "#fff" : c.toLowerCase() === "black" ? "#1a1a1a" : c.toLowerCase() }}
                  />
                ))}
                {uniqueColors.length > 5 && (
                  <span className="text-[10px] text-[#6B6056]">+{uniqueColors.length - 5}</span>
                )}
              </div>
            );
          }
          if (variants.length > 1) {
            return <p className="text-[10px] text-[#6B6056] mt-1">{variants.length} variants</p>;
          }
          return null;
        })()}

        {/* Price + MOQ */}
        <div className="mt-2 flex items-baseline justify-between">
          <div>
            <span className="text-sm font-semibold text-[#1A1A1A]">{price}</span>
            <span className="text-xs text-[#6B6056] ml-1">/ unit</span>
          </div>
          <span className="text-xs text-[#6B6056] bg-[#F5EDE6] px-1.5 py-0.5 rounded">
            MOQ {product.moq}
          </span>
        </div>
      </div>
    </article>
  );
}
