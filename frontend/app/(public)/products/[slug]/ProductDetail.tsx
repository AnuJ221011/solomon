"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft, Heart, Share2, ShoppingBag, Star, Truck,
  ChevronLeft, ChevronRight, Loader2, RotateCcw,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useProduct } from "@/lib/hooks/useProducts";
import { AchievementBadge } from "@/components/shared/AchievementBadge";
import { AuthGateModal } from "@/components/auth/AuthGateModal";
import { useCurrencyStore } from "@/lib/stores/currencyStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { useCartStore } from "@/lib/stores/cartStore";
import { cn } from "@/lib/utils";

const LEAD_TIME_LABELS: Record<string, string> = {
  ONE_TO_THREE_DAYS: "1–3 days",
  ONE_TO_TWO_WEEKS:  "1–2 weeks",
  TWO_TO_FOUR_WEEKS: "2–4 weeks",
};

interface Props { slug: string; }

export function ProductDetail({ slug }: Props) {
  const { data: product, isLoading, isError } = useProduct(slug);
  const { format } = useCurrencyStore();
  const { isAuthenticated } = useAuthStore();
  const { increment } = useCartStore();
  const [activePhoto, setActivePhoto] = useState(0);
  const [authGateOpen, setAuthGateOpen] = useState(false);

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await api.put("/buyer/cart/item", { productId: product!.id, quantity: product!.moq });
    },
    onSuccess: () => {
      increment();
      toast.success(`${product!.name} added to cart`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Could not add to cart"),
  });

  const handleAddToCart = () => {
    if (!isAuthenticated()) { setAuthGateOpen(true); return; }
    addToCartMutation.mutate();
  };

  if (isLoading) return <DetailSkeleton />;
  if (isError || !product) return <NotFound />;

  const photos = product.photos ?? [];
  const price = format(product.wholesalePriceInr);
  const msrp = product.msrpInr ? format(product.msrpInr) : null;
  const margin = product.msrpInr
    ? Math.round(((product.msrpInr - product.wholesalePriceInr) / product.msrpInr) * 100)
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#6B6056] mb-6">
        <Link href="/shop" className="flex items-center gap-1 hover:text-[#C8956C] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to shop
        </Link>
        <span className="text-[#E8E0D8]">/</span>
        {product.categories[0] && (
          <>
            <Link href={`/shop?category=${product.categories[0]}`} className="hover:text-[#C8956C] transition-colors">
              {product.categories[0]}
            </Link>
            <span className="text-[#E8E0D8]">/</span>
          </>
        )}
        <span className="text-[#1A1A1A] truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-14">
        {/* ── Photos ─────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Main image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F5EDE6] border border-[#E8E0D8]">
            {photos.length > 0 ? (
              <Image
                src={photos[activePhoto].url}
                alt={`${product.name} – photo ${activePhoto + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-6xl text-[#E8E0D8]">✦</div>
            )}
            {/* Nav arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setActivePhoto((p) => (p - 1 + photos.length) % photos.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setActivePhoto((p) => (p + 1) % photos.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
            {/* Photo count */}
            {photos.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
                {activePhoto + 1} / {photos.length}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {photos.map((photo, i) => (
                <button
                  key={photo.id}
                  onClick={() => setActivePhoto(i)}
                  className={cn(
                    "relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                    i === activePhoto ? "border-[#C8956C]" : "border-transparent hover:border-[#E8E0D8]"
                  )}
                >
                  <Image src={photo.url} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Info ───────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <Link
              href={`/brands/${product.brandProfile.slug}`}
              className="text-sm font-medium text-[#6B6056] hover:text-[#C8956C] transition-colors"
            >
              {product.brandProfile.brandName}
            </Link>
            <AchievementBadge level={product.brandProfile.achievementLevel} />
          </div>

          {/* Name */}
          <h1 className="font-heading text-3xl lg:text-4xl font-bold text-[#1A1A1A] leading-tight">
            {product.name}
          </h1>

          {/* Rating placeholder */}
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className="h-4 w-4 text-[#F59E0B] fill-current" />
              ))}
            </div>
            <span className="text-sm text-[#6B6056]">({product.orderCount} orders)</span>
          </div>

          {/* Price block */}
          <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E0D8]">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-[#1A1A1A]">{price}</span>
              <span className="text-sm text-[#6B6056]">per unit</span>
              {msrp && (
                <span className="text-sm text-[#6B6056] line-through">{msrp} MSRP</span>
              )}
            </div>
            {margin && margin > 0 && (
              <p className="mt-1 text-sm text-[#2D6A4F] font-medium">
                ~{margin}% margin potential for your store
              </p>
            )}
            <div className="mt-3 flex items-center gap-4 text-sm text-[#6B6056]">
              <span>
                <span className="font-semibold text-[#1A1A1A]">MOQ:</span> {product.moq} units
              </span>
              <span>
                <span className="font-semibold text-[#1A1A1A]">Lead time:</span>{" "}
                {LEAD_TIME_LABELS[product.leadTime] ?? product.leadTime}
              </span>
            </div>
          </div>

          {/* Short description */}
          {product.shortDescription && (
            <p className="text-[#6B6056] leading-relaxed">{product.shortDescription}</p>
          )}

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/shop?search=${tag}`}
                  className="px-2.5 py-1 rounded-full bg-[#F5EDE6] text-xs text-[#6B6056] hover:text-[#C8956C] transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending}
            className="w-full h-12 rounded-lg bg-[#C8956C] hover:bg-[#B07D57] text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {addToCartMutation.isPending
              ? <Loader2 className="h-5 w-5 animate-spin" />
              : <ShoppingBag className="h-5 w-5" />}
            {isAuthenticated() ? "Add to cart" : "Sign up to order"}
          </button>

          <AuthGateModal
            open={authGateOpen}
            onClose={() => setAuthGateOpen(false)}
            reason="Sign up to place wholesale orders"
            pendingAction={async () => { addToCartMutation.mutate(); }}
          />

          <div className="flex gap-3">
            <button className="flex-1 h-10 rounded-lg border border-[#E8E0D8] text-sm text-[#6B6056] flex items-center justify-center gap-2 hover:border-[#C8956C] hover:text-[#C8956C] transition-colors">
              <Heart className="h-4 w-4" />
              Save
            </button>
            <button className="flex-1 h-10 rounded-lg border border-[#E8E0D8] text-sm text-[#6B6056] flex items-center justify-center gap-2 hover:border-[#C8956C] hover:text-[#C8956C] transition-colors">
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>

          {/* Shipping info */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F5EDE6] border border-[#E8C4A2]">
            <Truck className="h-4 w-4 text-[#C8956C] mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-[#1A1A1A]">Ships from India</p>
              <p className="text-[#6B6056] mt-0.5">
                Weight: {product.weightGrams}g per unit
                {product.hsTariffCode && ` · HS code: ${product.hsTariffCode}`}
              </p>
            </div>
          </div>

          {/* Returns */}
          <div className="flex items-center gap-3 text-sm text-[#6B6056]">
            <RotateCcw className="h-4 w-4 text-[#2D6A4F] shrink-0" />
            <span>
              <span className="font-medium text-[#2D6A4F]">Opening order protection</span>
              {" "}— 30-day returns on your first order from this brand.
            </span>
          </div>
        </div>
      </div>

      {/* Full description */}
      {product.fullDescription && (
        <div className="mt-12 pt-8 border-t border-[#E8E0D8]">
          <h2 className="font-heading text-2xl font-semibold text-[#1A1A1A] mb-4">
            About this product
          </h2>
          <div
            className="prose prose-sm max-w-3xl text-[#6B6056]"
            dangerouslySetInnerHTML={{ __html: product.fullDescription }}
          />
        </div>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="aspect-square rounded-2xl bg-[#F5EDE6] animate-pulse" />
        <div className="space-y-4">
          {[80, 60, 40, 100, 60, 40, 40].map((w, i) => (
            <div key={i} className={`h-5 bg-[#F5EDE6] rounded animate-pulse w-${w}/100`} style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="text-5xl mb-4">🔍</span>
      <h2 className="font-heading text-2xl font-semibold text-[#1A1A1A] mb-2">Product not found</h2>
      <Link href="/shop" className="text-sm text-[#C8956C] hover:text-[#B07D57] font-medium">
        ← Back to shop
      </Link>
    </div>
  );
}
