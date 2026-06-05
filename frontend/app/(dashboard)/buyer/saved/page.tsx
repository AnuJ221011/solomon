"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { ProductCard } from "@/components/product/ProductCard";

export default function BuyerSavedPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["buyer-saved"],
    queryFn: async () => {
      const { data } = await api.get("/buyer/saved");
      return data.data;
    },
  });

  const unsaveProductMutation = useMutation({
    mutationFn: (productId: string) => api.delete(`/buyer/saved/product/${productId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["buyer-saved"] }); toast.success("Removed from saved"); },
  });

  const unsaveBrandMutation = useMutation({
    mutationFn: (brandProfileId: string) => api.delete(`/buyer/saved/brand/${brandProfileId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["buyer-saved"] }); toast.success("Brand unsaved"); },
  });

  const products = data?.products ?? [];
  const brands = data?.brands ?? [];

  return (
    <div className="max-w-5xl space-y-8">
      <h1 className="font-heading text-2xl font-bold text-[#1A1A1A]">Saved Items</h1>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#C8956C]" /></div>
      ) : products.length === 0 && brands.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="h-10 w-10 text-[#E8E0D8] mx-auto mb-3" />
          <p className="font-heading text-lg text-[#1A1A1A] mb-1">Nothing saved yet</p>
          <p className="text-sm text-[#6B6056] mb-4">Save products and brands to find them quickly.</p>
          <Link href="/shop" className="text-sm text-[#C8956C] font-medium">Browse products →</Link>
        </div>
      ) : (
        <>
          {products.length > 0 && (
            <div>
              <h2 className="font-heading text-lg font-semibold text-[#1A1A1A] mb-4">Saved products ({products.length})</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p: any) => (
                  <ProductCard key={p.id} product={p} isSaved onSave={() => unsaveProductMutation.mutate(p.id)} />
                ))}
              </div>
            </div>
          )}

          {brands.length > 0 && (
            <div>
              <h2 className="font-heading text-lg font-semibold text-[#1A1A1A] mb-4">Saved brands ({brands.length})</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                {brands.map((brand: any) => (
                  <div key={brand.id} className="relative group bg-white rounded-xl border border-[#E8E0D8] p-4 flex flex-col items-center text-center hover:border-[#C8956C] transition-all">
                    <button onClick={() => unsaveBrandMutation.mutate(brand.id)}
                      className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white border border-[#E8E0D8] flex items-center justify-center text-[#6B6056] hover:text-[#C0392B] opacity-0 group-hover:opacity-100 transition-all">
                      <X className="h-3 w-3" />
                    </button>
                    <div className="h-12 w-12 rounded-full bg-[#F5EDE6] overflow-hidden flex items-center justify-center mb-2">
                      {brand.logoUrl ? (
                        <Image src={brand.logoUrl} alt={brand.brandName} width={48} height={48} className="object-cover" />
                      ) : (
                        <span className="font-heading text-xl font-bold text-[#C8956C]">{brand.brandName?.charAt(0)}</span>
                      )}
                    </div>
                    <Link href={`/brands/${brand.slug}`} className="text-xs font-semibold text-[#1A1A1A] hover:text-[#C8956C] transition-colors line-clamp-1">
                      {brand.brandName}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
