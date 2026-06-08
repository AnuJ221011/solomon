"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Heart, Share2, ChevronDown, ChevronUp, Star,
  MapPin, Truck, RotateCcw, ShieldCheck, Loader2,
  X, ChevronLeft, ChevronRight, Plus, Minus,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useProduct } from "@/lib/hooks/useProducts";
import { AchievementBadge } from "@/components/shared/AchievementBadge";
import { ProductCard } from "@/components/product/ProductCard";
import { VariantSelector, type ProductVariantData } from "@/components/product/VariantSelector";
import { useCurrencyStore } from "@/lib/stores/currencyStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { useCartStore } from "@/lib/stores/cartStore";
import { useAuthModal } from "@/lib/stores/authModalStore";
import { cn } from "@/lib/utils";

const LEAD_TIME_LABELS: Record<string, string> = {
  ONE_TO_THREE_DAYS: "1–3 business days",
  ONE_TO_TWO_WEEKS:  "1–2 weeks",
  TWO_TO_FOUR_WEEKS: "2–4 weeks",
};

interface Props { slug: string; }

export function ProductDetail({ slug }: Props) {
  const { data: product, isLoading, isError } = useProduct(slug);
  const { format } = useCurrencyStore();
  const { isAuthenticated } = useAuthStore();
  const { increment } = useCartStore();
  const { openModal } = useAuthModal();

  const [lightbox, setLightbox] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [descOpen, setDescOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantData | null>(null);

  // Auto-select first active variant when product loads
  const variants: ProductVariantData[] = (product as any)?.variants ?? [];
  const hasVariants = variants.length > 0;

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      const qty = quantity ?? product!.moq;
      // If product has variants, a variant must be selected
      if (hasVariants && !selectedVariant) {
        throw new Error("Please select a variant before adding to cart");
      }
      if (selectedVariant && (selectedVariant.status === "OUT_OF_STOCK" || selectedVariant.stock < qty)) {
        throw new Error(`Only ${selectedVariant.stock} units available`);
      }
      await api.put("/buyer/cart/item", {
        productId: product!.id,
        variantId: selectedVariant?.id,
        quantity: qty,
      });
    },
    onSuccess: () => {
      increment();
      toast.success(`${product!.name} added to cart`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Could not add to cart"),
  });

  const handleAddToCart = () => {
    if (!isAuthenticated()) {
      openModal("signup", "Sign up to place wholesale orders", async () => { addToCartMutation.mutate(); });
      return;
    }
    addToCartMutation.mutate();
  };

  // Reviews
  const { data: reviewsData } = useQuery({
    queryKey: ["reviews", product?.id],
    queryFn: async () => {
      const { data } = await api.get(`/reviews/product/${product!.id}?limit=6`);
      return data.data;
    },
    enabled: !!product?.id,
  });

  // More from brand
  const { data: brandProducts } = useQuery({
    queryKey: ["brand-products-pdp", product?.brandProfile?.id],
    queryFn: async () => {
      const { data } = await api.get(`/products?brandId=${product!.brandProfile.id}&limit=6`);
      return (data.data.products ?? []).filter((p: any) => p.id !== product!.id);
    },
    enabled: !!product?.brandProfile?.id,
  });

  // Similar products
  const { data: similar } = useQuery({
    queryKey: ["similar", product?.categories?.[0]],
    queryFn: async () => {
      const cat = product!.categories?.[0];
      const { data } = await api.get(`/products?category=${encodeURIComponent(cat)}&limit=10`);
      return (data.data.products ?? []).filter((p: any) => p.id !== product!.id).slice(0, 5);
    },
    enabled: !!product?.categories?.[0],
  });

  if (isLoading) return <DetailSkeleton />;
  if (isError || !product) return (
    <div className="text-center py-20">
      <p className="text-[#6B6056] mb-4">Product not found.</p>
      <Link href="/shop" className="text-sm text-[#C8956C] font-medium">← Back to shop</Link>
    </div>
  );

  const photos = product.photos ?? [];
  const qty = quantity ?? product.moq;

  // Use variant price when a variant is selected; fall back to product base price
  const activePriceInr = selectedVariant ? Number(selectedVariant.priceInr) : Number(product.wholesalePriceInr);
  const activeCompareAtInr = selectedVariant?.compareAtPriceInr
    ? Number(selectedVariant.compareAtPriceInr)
    : product.msrpInr ? Number(product.msrpInr) : null;

  const price = format(activePriceInr);
  const msrp = activeCompareAtInr ? format(activeCompareAtInr) : null;
  const margin = activeCompareAtInr && activeCompareAtInr > activePriceInr
    ? Math.round(((activeCompareAtInr - activePriceInr) / activeCompareAtInr) * 100)
    : null;
  const totalPrice = format(activePriceInr * qty);
  const avgRating = reviewsData?.reviews?.length
    ? (reviewsData.reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviewsData.reviews.length).toFixed(1)
    : null;

  return (
    <div className="bg-white">
      {/* ── Brand header bar ──────────────────────────────────────── */}
      <div className="border-b border-[#E8E0D8] bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <Link href={`/brands/${product.brandProfile.slug}`} className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-full bg-[#F5EDE6] border border-[#E8E0D8] flex items-center justify-center overflow-hidden shrink-0">
              {(product.brandProfile as any).logoUrl ? (
                <Image src={(product.brandProfile as any).logoUrl} alt={product.brandProfile.brandName} width={40} height={40} className="object-cover" />
              ) : (
                <span className="font-heading font-bold text-[#C8956C]">{product.brandProfile.brandName.charAt(0)}</span>
              )}
            </div>
            <div>
              <p className="font-semibold text-sm text-[#1A1A1A] group-hover:text-[#C8956C] transition-colors">
                {product.brandProfile.brandName}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <AchievementBadge level={product.brandProfile.achievementLevel} size="sm" />
                {avgRating && (
                  <span className="flex items-center gap-1 text-xs text-[#6B6056]">
                    <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
                    {avgRating}
                    {reviewsData?.total ? ` (${reviewsData.total})` : ""}
                  </span>
                )}
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            {product.moq && (
              <span className="px-3 py-1.5 rounded-full border border-[#E8E0D8] text-xs font-medium text-[#6B6056]">
                {price} minimum
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Main product section ───────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-14">

          {/* ── Photo grid — sticky, self-start so images keep their natural size ── */}
          <div className="lg:sticky lg:top-20 lg:self-start lg:px-6">
            {photos.length === 0 ? (
              <div className="aspect-square rounded-2xl bg-[#F5EDE6] flex items-center justify-center text-6xl text-[#E8E0D8]">✦</div>
            ) : photos.length === 1 ? (
              <button onClick={() => setLightbox(0)} className="block w-full aspect-square rounded-2xl overflow-hidden bg-[#F5EDE6] relative group">
                <Image src={photos[0].url} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="50vw" priority />
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {photos.slice(0, 4).map((photo, i) => (
                  <button
                    key={photo.id}
                    onClick={() => setLightbox(i)}
                    className={cn(
                      "relative bg-[#F5EDE6] overflow-hidden group",
                      photos.length === 3 && i === 0 ? "col-span-2 aspect-[2/1]" : "aspect-square",
                      "rounded-xl"
                    )}
                  >
                    <Image
                      src={photo.url}
                      alt={`${product.name} ${i + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 1024px) 45vw, 25vw"
                      priority={i === 0}
                    />
                    {/* "Show all X photos" overlay on last visible cell */}
                    {i === 3 && photos.length > 4 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">Show all {photos.length} photos</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product info ────────────────────────────────────────── */}
          <div className="flex flex-col gap-5">
            {/* Top badge */}
            {margin && margin >= 15 && (
              <p className="text-xs font-semibold text-[#C8956C]">
                Top reordered in {product.categories?.[0] ?? "category"}
              </p>
            )}

            {/* Name + actions */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-heading text-2xl lg:text-3xl font-bold text-[#1A1A1A] leading-tight">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 shrink-0">
                <button className="h-9 w-9 rounded-full border border-[#E8E0D8] flex items-center justify-center text-[#6B6056] hover:border-[#C8956C] hover:text-[#C8956C] transition-colors">
                  <Heart className="h-4 w-4" />
                </button>
                <button className="h-9 w-9 rounded-full border border-[#E8E0D8] flex items-center justify-center text-[#6B6056] hover:border-[#C8956C] hover:text-[#C8956C] transition-colors">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-[#1A1A1A]">{price}</span>
              {msrp && <span className="text-sm text-[#6B6056] line-through">MSRP {msrp}</span>}
              {margin && margin > 0 && (
                <span className="text-xs font-semibold text-[#2D6A4F] bg-[#E8F5EE] px-2 py-0.5 rounded-full">
                  {margin}% margin
                </span>
              )}
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-full bg-[#F5EDE6] text-xs text-[#6B6056]">{tag}</span>
                ))}
              </div>
            )}

            {/* Variant selector */}
            {hasVariants && (
              <div className="space-y-1">
                <VariantSelector
                  variants={variants}
                  selected={selectedVariant}
                  onSelect={setSelectedVariant}
                />
                {hasVariants && !selectedVariant && (
                  <p className="text-xs text-[#C8956C]">Select options to continue</p>
                )}
              </div>
            )}

            {/* Quantity selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#1A1A1A]">
                  Item Quantity <span className="font-normal text-[#6B6056]">(Minimum {product.moq})</span>
                </label>
                <span className="text-xs text-[#6B6056]">Case of {product.moq}</span>
              </div>
              <div
                className="inline-flex items-center border border-[#E8E0D8] rounded-lg bg-white"
                style={{ width: "9rem" }}
              >
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(product.moq, qty - 1))}
                  disabled={qty <= product.moq}
                  style={{ width: "2.5rem", height: "2.5rem", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                  className="text-[#6B6056] hover:bg-[#F5EDE6] transition-colors disabled:opacity-40 rounded-l-lg border-r border-[#E8E0D8]"
                >
                  <Minus style={{ width: "1rem", height: "1rem" }} />
                </button>
                <span
                  className="font-semibold text-sm text-[#1A1A1A] text-center"
                  style={{ flex: 1 }}
                >
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(qty + 1)}
                  style={{ width: "2.5rem", height: "2.5rem", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                  className="text-[#6B6056] hover:bg-[#F5EDE6] transition-colors rounded-r-lg border-l border-[#E8E0D8]"
                >
                  <Plus style={{ width: "1rem", height: "1rem" }} />
                </button>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleAddToCart}
              disabled={
                addToCartMutation.isPending ||
                (hasVariants && !selectedVariant) ||
                (selectedVariant?.status === "OUT_OF_STOCK") ||
                (selectedVariant !== null && selectedVariant.stock === 0)
              }
              className="w-full rounded-lg bg-[#1A1A1A] hover:bg-[#2D2D2D] text-white font-semibold text-base flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ height: "3.25rem" }}
            >
              {addToCartMutation.isPending && <Loader2 className="h-5 w-5 animate-spin" />}
              {hasVariants && !selectedVariant
                ? "Select options above"
                : selectedVariant?.status === "OUT_OF_STOCK" || (selectedVariant && selectedVariant.stock === 0)
                ? "Out of stock"
                : isAuthenticated()
                ? `Add to cart · ${totalPrice}`
                : `Sign up to order · ${totalPrice}`
              }
            </button>

            {/* Free shipping info */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F5EDE6] border border-[#E8C4A2]">
              <Truck className="h-4 w-4 text-[#C8956C] mt-0.5 shrink-0" />
              <p className="text-sm text-[#6B6056]">
                Shipping costs calculated at checkout based on your zone and order weight.
              </p>
            </div>

            {/* Shipping & policies */}
            <div className="border border-[#E8E0D8] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E8E0D8]">
                <h3 className="text-sm font-semibold text-[#1A1A1A]">Shipping & policies</h3>
              </div>
              <div className="px-4 py-3 space-y-3">
                <div className="flex items-center gap-3">
                  <Truck className="h-4 w-4 text-[#6B6056] shrink-0" />
                  <span className="text-sm text-[#6B6056]">
                    Lead time: <span className="font-medium text-[#1A1A1A]">{LEAD_TIME_LABELS[product.leadTime] ?? product.leadTime}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-[#6B6056] shrink-0" />
                  <span className="text-sm text-[#6B6056]">
                    Ships from <span className="font-medium text-[#1A1A1A]">India ({product.countryOfOrigin})</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <RotateCcw className="h-4 w-4 text-[#2D6A4F] shrink-0" />
                  <span className="text-sm text-[#6B6056]">
                    <span className="font-medium text-[#2D6A4F]">Opening order protection</span> — 30-day free returns on your first order from this brand
                  </span>
                </div>
                {product.hsTariffCode && (
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-[#6B6056] shrink-0" />
                    <span className="text-sm text-[#6B6056]">HS Code: {product.hsTariffCode}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description accordion */}
            <Accordion title="Description" open={descOpen} onToggle={() => setDescOpen((v) => !v)}>
              <p className="text-sm text-[#6B6056] leading-relaxed whitespace-pre-line">
                {product.fullDescription
                  ? <span dangerouslySetInnerHTML={{ __html: product.fullDescription }} />
                  : product.shortDescription}
              </p>
            </Accordion>

            {/* Details accordion */}
            <Accordion title="Details" open={detailsOpen} onToggle={() => setDetailsOpen((v) => !v)}>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Weight", `${product.weightGrams}g per unit`],
                  ["MOQ", `${product.moq} units`],
                  ["Country of origin", product.countryOfOrigin],
                  ["Categories", product.categories.join(", ")],
                  ...(product.hsTariffCode ? [["HS Code", product.hsTariffCode]] : []),
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[#6B6056] text-xs">{k}</p>
                    <p className="font-medium text-[#1A1A1A] mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </Accordion>
          </div>
        </div>

        {/* ── Shop more from brand ───────────────────────────────── */}
        <div className="mt-16 pt-10 border-t border-[#E8E0D8]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-[#6B6056] mb-1">More from this brand</p>
              <h2 className="font-heading text-xl font-bold text-[#1A1A1A]">
                Shop more from {product.brandProfile.brandName}
              </h2>
              <p className="text-xs text-[#6B6056] mt-0.5 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> India
                {product.brandProfile.achievementLevel && (
                  <AchievementBadge level={product.brandProfile.achievementLevel} size="sm" className="ml-1" />
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/brands/${product.brandProfile.slug}`}
                className="h-9 px-4 rounded-lg border border-[#1A1A1A] text-sm font-medium text-[#1A1A1A] flex items-center hover:bg-[#1A1A1A] hover:text-white transition-colors"
              >
                Shop all products
              </Link>
            </div>
          </div>
          {brandProducts && brandProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {brandProducts.slice(0, 6).map((p: any) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="py-10 text-center bg-[#FAFAF8] rounded-xl border border-[#E8E0D8]">
              <p className="text-sm text-[#6B6056]">No other products from this brand yet.</p>
              <Link href={`/brands/${product.brandProfile.slug}`} className="mt-2 text-xs text-[#C8956C] font-medium">
                View brand page →
              </Link>
            </div>
          )}
        </div>

        {/* ── Ratings & Reviews ─────────────────────────────────── */}
        <div className="mt-14 pt-10 border-t border-[#E8E0D8]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-xl font-bold text-[#1A1A1A]">Ratings & Reviews</h2>
            {reviewsData && reviewsData.total > 0 && (
              <Link href="#" className="text-sm text-[#C8956C] font-medium hover:text-[#B07D57]">
                See all reviews
              </Link>
            )}
          </div>

          {reviewsData && reviewsData.total > 0 ? (
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Rating summary */}
              <div>
                <div className="flex items-end gap-2 mb-3">
                  <span className="font-heading text-5xl font-bold text-[#1A1A1A]">{avgRating}</span>
                  <div className="flex mb-1">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={cn("h-5 w-5", Number(avgRating) >= s ? "fill-[#F59E0B] text-[#F59E0B]" : "text-[#E8E0D8]")} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-[#6B6056]">Rating ({reviewsData.total} brand reviews)</p>
                <div className="mt-4 space-y-1.5">
                  {[5,4,3,2,1].map((star) => {
                    const count = reviewsData.reviews?.filter((r: any) => r.rating === star).length ?? 0;
                    const pct = reviewsData.total > 0 ? (count / reviewsData.total) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs text-[#6B6056] w-3">{star}</span>
                        <div className="flex-1 h-1.5 bg-[#F5EDE6] rounded-full overflow-hidden">
                          <div className="h-full bg-[#C8956C] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-[#6B6056] w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Review cards */}
              <div className="lg:col-span-3 grid sm:grid-cols-3 gap-4">
                {reviewsData.reviews?.slice(0, 3).map((review: any) => (
                  <div key={review.id} className="p-4 rounded-xl border border-[#E8E0D8] bg-[#FAFAF8] space-y-2">
                    <div className="flex">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={cn("h-3.5 w-3.5", review.rating >= s ? "fill-[#F59E0B] text-[#F59E0B]" : "text-[#E8E0D8]")} />
                      ))}
                    </div>
                    {review.comment && <p className="text-sm text-[#1A1A1A] font-medium line-clamp-2">{review.comment}</p>}
                    <div>
                      <p className="text-xs font-medium text-[#1A1A1A]">{review.reviewer?.buyerProfile?.businessName ?? review.reviewer?.name}</p>
                      <p className="text-xs text-[#6B6056]">{new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center bg-[#FAFAF8] rounded-xl border border-[#E8E0D8]">
              <div className="flex justify-center mb-3">
                {[1,2,3,4,5].map((s) => <Star key={s} className="h-5 w-5 text-[#E8E0D8]" />)}
              </div>
              <p className="text-sm font-medium text-[#1A1A1A]">No reviews yet</p>
              <p className="text-xs text-[#6B6056] mt-1">Be the first to review this product after ordering.</p>
            </div>
          )}
        </div>

        {/* ── Similar products ──────────────────────────────────── */}
        <div className="mt-14 pt-10 border-t border-[#E8E0D8]">
          <h2 className="font-heading text-xl font-bold text-[#1A1A1A] mb-6">Similar products</h2>
          {similar && similar.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {similar.map((p: any) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="py-10 text-center bg-[#FAFAF8] rounded-xl border border-[#E8E0D8]">
              <p className="text-sm text-[#6B6056]">No similar products found yet.</p>
              <Link href="/shop" className="mt-2 text-xs text-[#C8956C] font-medium">Browse all products →</Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────── */}
      {lightbox !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
          {lightbox > 0 && (
            <button onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {lightbox < photos.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
          <div className="relative w-full max-w-3xl max-h-[85vh] aspect-square mx-8" onClick={(e) => e.stopPropagation()}>
            <Image src={photos[lightbox].url} alt={product.name} fill className="object-contain" sizes="85vw" />
          </div>
          <div className="absolute bottom-4 flex gap-2">
            {photos.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setLightbox(i); }}
                className={cn("h-2 w-2 rounded-full transition-all", i === lightbox ? "bg-white w-5" : "bg-white/40")} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Helper components ──────────────────────────────────────────── */

function Accordion({ title, open, onToggle, children }: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border border-[#E8E0D8] rounded-xl overflow-hidden">
      {/* Always-visible preview strip */}
      <div className="px-4 pt-3.5 pb-0">
        {/* Clamp to 2 lines when collapsed */}
        <div className={cn("text-sm text-[#6B6056] leading-relaxed", !open && "line-clamp-2")}>
          {children}
        </div>
        {/* Fade-out gradient when collapsed */}
        {!open && (
          <div className="h-4 -mt-4 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, transparent, white)" }} />
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-[#1A1A1A] hover:bg-[#FAFAF8] transition-colors border-t border-[#E8E0D8] mt-2"
      >
        <span>{title}</span>
        {open
          ? <span className="flex items-center gap-1 text-xs font-medium text-[#C8956C]"><ChevronUp className="h-4 w-4" /> Show less</span>
          : <span className="flex items-center gap-1 text-xs font-medium text-[#C8956C]"><ChevronDown className="h-4 w-4" /> Show more</span>
        }
      </button>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="grid grid-cols-2 gap-2">
          {[1,2,3,4].map((i) => <div key={i} className="aspect-square rounded-xl bg-[#F5EDE6] animate-pulse" />)}
        </div>
        <div className="space-y-4">
          {[100,60,80,40,100,40,60].map((w, i) => (
            <div key={i} className="h-5 bg-[#F5EDE6] rounded animate-pulse" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
