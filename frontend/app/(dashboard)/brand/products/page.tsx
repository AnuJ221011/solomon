"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Edit2, Trash2, ToggleLeft, ToggleRight, Zap } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/utils";

export default function BrandProductsPage() {
  const qc = useQueryClient();
  const [promoteModal, setPromoteModal] = useState<{ productId: string; productName: string } | null>(null);
  const [promoteBid, setPromoteBid] = useState({ amount: "500", startsAt: "", endsAt: "" });

  const promoteMutation = useMutation({
    mutationFn: () => api.post("/promoted", {
      productId: promoteModal!.productId,
      bidAmountInr: Number(promoteBid.amount),
      startsAt: new Date(promoteBid.startsAt).toISOString(),
      endsAt: promoteBid.endsAt ? new Date(promoteBid.endsAt).toISOString() : undefined,
    }),
    onSuccess: () => {
      toast.success("Promotion submitted — pending admin activation");
      setPromoteModal(null);
      setPromoteBid({ amount: "500", startsAt: "", endsAt: "" });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Failed to submit"),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["brand-products"],
    queryFn: async () => {
      const { data } = await api.get("/products/me/listings?limit=50");
      return data.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, availability }: { id: string; availability: string }) =>
      api.patch(`/products/${id}`, { availability }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["brand-products"] }); toast.success("Updated"); },
    onError: () => toast.error("Update failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["brand-products"] }); toast.success("Product deleted"); },
    onError: () => toast.error("Delete failed"),
  });

  const products = data?.products ?? [];

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1A1A1A]">Products</h1>
          <p className="text-sm text-[#444748] mt-0.5">{products.length} listings</p>
        </div>
        <div className="flex gap-3">
          <LinkButton href="/brand/products/import" variant="outline" size="default">Bulk import CSV</LinkButton>
          <LinkButton href="/brand/products/new" variant="default" size="default">
            <Plus className="h-4 w-4" /> Add product
          </LinkButton>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#A68B67]" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-[#E5E1D8]">
          <p className="font-heading text-xl text-[#1A1A1A] mb-2">No products yet</p>
          <p className="text-[#444748] mb-6">Add your first wholesale product to start selling.</p>
          <LinkButton href="/brand/products/new" variant="default" size="lg">
            <Plus className="h-4 w-4" /> Add first product
          </LinkButton>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#E5E1D8] shadow-warm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F7F2] border-b border-[#E5E1D8] text-xs text-[#444748] uppercase tracking-wider">
                  {["Product", "Price (₹)", "MOQ", "Orders", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E1D8]">
                {products.map((p: any) => {
                  const photo = p.photos?.[0]?.url;
                  const isActive = p.availability === "ACTIVE";
                  return (
                    <tr key={p.id} className="hover:bg-[#F9F7F2] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-[#F5F0E8] overflow-hidden shrink-0 relative">
                            {photo ? <Image src={photo} alt={p.name} fill className="object-cover" sizes="40px" /> :
                              <div className="h-full flex items-center justify-center text-lg text-[#E5E1D8]">✦</div>}
                          </div>
                          <div>
                            <Link href={`/products/${p.slug}`} className="font-medium text-[#1A1A1A] hover:text-[#A68B67] line-clamp-1">
                              {p.name}
                            </Link>
                            <p className="text-xs text-[#444748]">{p.categories?.[0]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">₹{Number(p.wholesalePriceInr).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-[#444748]">{p.moq}</td>
                      <td className="px-4 py-3 text-[#444748]">{p.orderCount}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold",
                          isActive ? "bg-[#E8F5EE] text-[#2D6A4F]" : "bg-[#F5F0E8] text-[#444748]")}>
                          {p.availability}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleMutation.mutate({ id: p.id, availability: isActive ? "INACTIVE" : "ACTIVE" })}
                            className="text-[#444748] hover:text-[#A68B67] transition-colors"
                            title={isActive ? "Deactivate" : "Activate"}
                          >
                            {isActive ? <ToggleRight className="h-5 w-5 text-[#2D6A4F]" /> : <ToggleLeft className="h-5 w-5" />}
                          </button>
                          <button
                            onClick={() => { setPromoteBid({ amount: "500", startsAt: new Date().toISOString().slice(0,16), endsAt: "" }); setPromoteModal({ productId: p.id, productName: p.name }); }}
                            className="text-[#444748] hover:text-[#A68B67] transition-colors"
                            title="Promote"
                          >
                            <Zap className="h-4 w-4" />
                          </button>
                          <Link href={`/brand/products/${p.id}/edit`} className="text-[#444748] hover:text-[#A68B67] transition-colors">
                            <Edit2 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => { if (confirm("Delete this product?")) deleteMutation.mutate(p.id); }}
                            className="text-[#444748] hover:text-[#C0392B] transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Promote modal */}
      {promoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPromoteModal(null)} />
          <div className="relative bg-white rounded-lg border border-[#E5E1D8] shadow-warm-lg p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-5 w-5 text-[#A68B67]" />
              <h2 className="font-heading text-lg font-semibold text-[#1A1A1A]">Promote product</h2>
            </div>
            <p className="text-sm text-[#444748] line-clamp-1">{promoteModal.productName}</p>

            <div className="p-3 rounded-lg bg-[#F5F0E8] border border-[#DDD0BA] text-xs text-[#444748]">
              Higher bid = stronger boost in the discovery feed. Minimum ₹100. Admin will activate your promotion within 24 hours.
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1A1A1A]">Bid amount (₹)</label>
                <input type="number" min={100} value={promoteBid.amount}
                  onChange={(e) => setPromoteBid({ ...promoteBid, amount: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-[#E5E1D8] text-sm focus:outline-none focus:border-[#A68B67]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#1A1A1A]">Start date</label>
                  <input type="datetime-local" value={promoteBid.startsAt}
                    onChange={(e) => setPromoteBid({ ...promoteBid, startsAt: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-[#E5E1D8] text-sm focus:outline-none focus:border-[#A68B67]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#1A1A1A]">End date (optional)</label>
                  <input type="datetime-local" value={promoteBid.endsAt}
                    onChange={(e) => setPromoteBid({ ...promoteBid, endsAt: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-[#E5E1D8] text-sm focus:outline-none focus:border-[#A68B67]" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setPromoteModal(null)} className="flex-1 h-10 rounded-lg border border-[#E5E1D8] text-sm font-medium hover:bg-[#F9F7F2]">Cancel</button>
              <button
                onClick={() => promoteMutation.mutate()}
                disabled={!promoteBid.amount || Number(promoteBid.amount) < 100 || !promoteBid.startsAt || promoteMutation.isPending}
                className="flex-1 h-10 rounded-lg bg-[#1A1A1A] hover:bg-[#8B7055] text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {promoteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit promotion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}