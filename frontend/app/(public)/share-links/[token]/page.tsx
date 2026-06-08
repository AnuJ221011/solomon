"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Loader2, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/authStore";
import { ProductCard } from "@/components/product/ProductCard";
import { useAuthModal } from "@/lib/stores/authModalStore";

interface Props { params: Promise<{ token: string }> }

export default function ShareLinkPage({ params }: Props) {
  const { token } = use(params);
  const { isAuthenticated } = useAuthStore();
  const { openModal } = useAuthModal();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Store token in sessionStorage for attribution on signup
  useEffect(() => {
    if (token) sessionStorage.setItem("slt", token);
  }, [token]);

  const { data: link, isLoading, isError } = useQuery({
    queryKey: ["share-link", token],
    queryFn: async () => {
      // Record visit
      api.post("/share-links/visit", { token, isUnique: !sessionStorage.getItem(`visited-${token}`) })
        .then(() => sessionStorage.setItem(`visited-${token}`, "1"))
        .catch(() => {});
      const { data } = await api.get(`/share-links/${token}`);
      return data.data;
    },
  });

  if (isLoading) return (
    <div className="flex-1 flex justify-center items-center py-20">
      <Loader2 className="h-7 w-7 animate-spin text-[#C8956C]" />
    </div>
  );

  if (isError || !link) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="text-5xl mb-4">🔗</span>
      <h2 className="font-heading text-2xl font-semibold text-[#1A1A1A] mb-2">Link not found</h2>
      <p className="text-[#6B6056]">This link may have expired or been deactivated.</p>
      <Link href="/shop" className="mt-4 text-sm text-[#C8956C] font-medium">Browse shop →</Link>
    </div>
  );

  const brandName = link.brandProfile?.brandName;

  return (
    <div>

      {/* Sticky attribution banner */}
      {!isAuthenticated() && !bannerDismissed && (
        <div className="sticky top-14 z-30 bg-[#F5EDE6] border-b border-[#E8C4A2]">
          <div className="mx-auto max-w-7xl px-4 py-2.5 flex items-center justify-between gap-4">
            <p className="text-sm text-[#92400E]">
              <span className="font-semibold">{brandName}</span> invited you to their wholesale catalogue —{" "}
              <button onClick={() => openModal("signup", `Sign up to order from ${brandName}`)} className="font-semibold underline underline-offset-2 hover:text-[#C8956C]">
                create a free account to place orders
              </button>
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => openModal("signup", `Sign up to order from ${brandName}`)}
                className="h-7 px-3 rounded-lg bg-[#C8956C] text-white text-xs font-medium hover:bg-[#B07D57] transition-colors"
              >
                Sign up free
              </button>
              <button onClick={() => setBannerDismissed(true)} className="text-[#6B6056] hover:text-[#1A1A1A]">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        {/* Brand header */}
        <div className="border-b border-[#E8E0D8] bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[#F5EDE6] overflow-hidden flex items-center justify-center border border-[#E8E0D8]">
              {link.brandProfile?.logoUrl ? (
                <Image src={link.brandProfile.logoUrl} alt={brandName} width={48} height={48} className="object-cover" />
              ) : (
                <span className="font-heading text-xl font-bold text-[#C8956C]">{brandName?.charAt(0)}</span>
              )}
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold text-[#1A1A1A]">{brandName}</h1>
              {link.customMessage && (
                <p className="text-sm text-[#6B6056] mt-0.5">{link.customMessage}</p>
              )}
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <BrandProducts brandId={link.brandProfile?.id} onAddToCart={() => openModal("signup", `Sign up to order from ${brandName}`)} isAuthed={isAuthenticated()} />
        </div>
      </main>
    </div>
  );
}

function BrandProducts({ brandId, onAddToCart, isAuthed }: { brandId?: string; onAddToCart: () => void; isAuthed: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["brand-products-share", brandId],
    queryFn: async () => {
      const { data } = await api.get(`/products?brandId=${brandId}&limit=24`);
      return data.data.products ?? [];
    },
    enabled: !!brandId,
  });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#C8956C]" /></div>;
  if (!data?.length) return <p className="text-center text-[#6B6056] py-16">No products listed yet.</p>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {data.map((p: any) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
