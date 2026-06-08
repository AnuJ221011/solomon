"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Loader2, ShoppingBag, ArrowRight, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useCurrencyStore } from "@/lib/stores/currencyStore";
import { useCartStore } from "@/lib/stores/cartStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { LinkButton } from "@/components/ui/link-button";

function useCart() {
  return useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const { data } = await api.get("/buyer/cart");
      return data.data;
    },
    enabled: false, // loaded by AppInitialiser; manually enabled here
  });
}

export default function CartPage() {
  const qc = useQueryClient();
  const { format } = useCurrencyStore();
  const { setItemCount } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const { data: cart, isLoading, refetch } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const { data } = await api.get("/buyer/cart");
      return data.data;
    },
    enabled: isAuthenticated(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      api.put("/buyer/cart/item", { productId, quantity }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cart"] }); },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Update failed"),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => api.delete(`/buyer/cart/item/${productId}`),
    onSuccess: (_, productId) => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      setItemCount(Math.max(0, (cart?.items?.length ?? 1) - 1));
      toast.success("Item removed");
    },
    onError: () => toast.error("Could not remove item"),
  });

  const items = cart?.items ?? [];
  // Group by brand
  const grouped = items.reduce((acc: Record<string, any[]>, item: any) => {
    const brandId = item.product.brandProfile?.id ?? "unknown";
    if (!acc[brandId]) acc[brandId] = [];
    acc[brandId].push(item);
    return acc;
  }, {});

  const subtotal = items.reduce(
    (sum: number, item: any) => sum + Number(item.product.wholesalePriceInr) * item.quantity,
    0
  );

  return (
    <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-heading text-3xl font-bold text-[#1A1A1A] mb-8">Your cart</h1>

        {!isAuthenticated() ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-12 w-12 text-[#E8E0D8] mx-auto mb-4" />
            <h2 className="font-heading text-xl font-semibold text-[#1A1A1A] mb-2">Sign in to view your cart</h2>
            <LinkButton href="/login" variant="default" size="lg" className="mt-4">Log in</LinkButton>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-[#C8956C]" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-12 w-12 text-[#E8E0D8] mx-auto mb-4" />
            <h2 className="font-heading text-xl font-semibold text-[#1A1A1A] mb-2">Your cart is empty</h2>
            <p className="text-[#6B6056] mb-6">Discover unique Indian wholesale products.</p>
            <LinkButton href="/shop" variant="default" size="lg">Browse products</LinkButton>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-6">
              {Object.entries(grouped).map(([brandId, brandItems]: [string, any[]]) => {
                const brandName = brandItems[0].product.brandProfile?.brandName ?? "Brand";
                const brandSlug = brandItems[0].product.brandProfile?.slug;
                return (
                  <div key={brandId} className="bg-white rounded-xl border border-[#E8E0D8] overflow-hidden shadow-warm">
                    <div className="px-5 py-3 border-b border-[#E8E0D8] bg-[#FAFAF8]">
                      <Link href={`/brands/${brandSlug}`} className="text-sm font-semibold text-[#1A1A1A] hover:text-[#C8956C] transition-colors">
                        {brandName}
                      </Link>
                    </div>
                    <div className="divide-y divide-[#E8E0D8]">
                      {brandItems.map((item: any) => {
                        const photo = item.product.photos?.[0]?.url;
                        const unitPrice = Number(item.product.wholesalePriceInr);
                        return (
                          <div key={item.id} className="flex gap-4 p-4">
                            <div className="h-20 w-20 rounded-lg bg-[#F5EDE6] overflow-hidden shrink-0 relative">
                              {photo ? (
                                <Image src={photo} alt={item.product.name} fill className="object-cover" sizes="80px" />
                              ) : (
                                <div className="h-full flex items-center justify-center text-2xl text-[#E8E0D8]">✦</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link href={`/products/${item.product.slug}`} className="text-sm font-semibold text-[#1A1A1A] hover:text-[#C8956C] line-clamp-2">
                                {item.product.name}
                              </Link>
                              <p className="text-xs text-[#6B6056] mt-0.5">
                                {format(unitPrice)} / unit · MOQ {item.product.moq}
                              </p>
                              <div className="flex items-center gap-3 mt-3">
                                {/* Quantity */}
                                <div className="flex items-center gap-1 border border-[#E8E0D8] rounded-lg overflow-hidden">
                                  <button
                                    onClick={() => updateMutation.mutate({ productId: item.productId, quantity: Math.max(item.product.moq, item.quantity - 1) })}
                                    className="h-8 w-8 flex items-center justify-center text-[#6B6056] hover:bg-[#F5EDE6] transition-colors"
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                  <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                                  <button
                                    onClick={() => updateMutation.mutate({ productId: item.productId, quantity: item.quantity + 1 })}
                                    className="h-8 w-8 flex items-center justify-center text-[#6B6056] hover:bg-[#F5EDE6] transition-colors"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => removeMutation.mutate(item.productId)}
                                  className="h-8 w-8 flex items-center justify-center text-[#6B6056] hover:text-[#C0392B] transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-semibold text-[#1A1A1A]">{format(unitPrice * item.quantity)}</p>
                              <p className="text-xs text-[#6B6056] mt-0.5">{item.quantity} units</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl border border-[#E8E0D8] shadow-warm h-fit sticky top-20">
              <div className="p-5 border-b border-[#E8E0D8]">
                <h2 className="font-heading text-base font-semibold text-[#1A1A1A]">Order summary</h2>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6056]">Subtotal ({items.length} items)</span>
                  <span className="font-medium text-[#1A1A1A]">{format(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6056]">Shipping</span>
                  <span className="text-[#6B6056]">Calculated at checkout</span>
                </div>
                <div className="pt-3 border-t border-[#E8E0D8] flex justify-between">
                  <span className="font-semibold text-[#1A1A1A]">Estimated total</span>
                  <span className="font-bold text-[#1A1A1A]">{format(subtotal)}</span>
                </div>
              </div>
              <div className="px-5 pb-5">
                <LinkButton href="/checkout" variant="default" size="lg" className="w-full justify-center">
                  Proceed to checkout
                  <ArrowRight className="h-4 w-4" />
                </LinkButton>
                <p className="text-xs text-[#6B6056] text-center mt-3">
                  Opening order? 30-day free returns on your first order from each brand.
                </p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
