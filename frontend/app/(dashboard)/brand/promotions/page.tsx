"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Zap, Loader2, Trash2, Eye, MousePointerClick } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  active:  "bg-[#E8F5EE] text-[#2D6A4F] border-[#B7DFC7]",
  pending: "bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]",
  ended:   "bg-[#F5F5F5] text-[#9CA3AF] border-[#E5E7EB]",
};

export default function BrandPromotionsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["brand-promotions"],
    queryFn: async () => {
      const { data } = await api.get("/promoted");
      return data.data as any[];
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/promoted/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["brand-promotions"] }); toast.success("Promotion cancelled"); },
    onError: () => toast.error("Failed to cancel"),
  });

  const getStatus = (promo: any) => {
    const now = new Date();
    if (promo.isActive) return "active";
    if (promo.endsAt && new Date(promo.endsAt) < now) return "ended";
    return "pending";
  };

  const promotions = data ?? [];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1A1A1A]">Promotions</h1>
          <p className="mt-1 text-sm text-[#6B6056]">
            Promoted products appear higher in the discovery feed. Submit a bid → admin activates within 24h.
          </p>
        </div>
        <LinkButton href="/brand/products" variant="default" size="default">
          <Zap className="h-4 w-4" /> Promote a product
        </LinkButton>
      </div>

      {/* How it works */}
      <div className="bg-[#F5EDE6] border border-[#E8C4A2] rounded-xl p-5 text-sm text-[#6B6056] space-y-1">
        <p className="font-semibold text-[#1A1A1A] mb-2">How promoted listings work</p>
        <div className="grid sm:grid-cols-3 gap-3 text-xs">
          {[
            ["1. Submit bid", "Click ⚡ on any product in your listings, set a bid amount (min ₹100) and date range."],
            ["2. Admin reviews", "Our team reviews your bid within 24 hours and activates it."],
            ["3. Higher in feed", "Your product gets a +10–15 score boost in the ranked discovery feed. Higher bid = more boost."],
          ].map(([title, desc]) => (
            <div key={title as string} className="bg-white rounded-lg p-3 border border-[#E8C4A2]">
              <p className="font-semibold text-[#1A1A1A] mb-1">{title}</p>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#C8956C]" /></div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-[#E8E0D8]">
          <Zap className="h-10 w-10 text-[#E8E0D8] mx-auto mb-3" />
          <p className="font-heading text-lg text-[#1A1A1A] mb-1">No promotions yet</p>
          <p className="text-sm text-[#6B6056] mb-4">Click ⚡ on any product in your listings to create a promotion.</p>
          <LinkButton href="/brand/products" variant="default" size="default">Go to products</LinkButton>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E0D8] shadow-warm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FAFAF8] border-b border-[#E8E0D8] text-xs text-[#6B6056] uppercase tracking-wider">
                  {["Product", "Bid (₹)", "Period", "Impressions", "Clicks", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D8]">
                {promotions.map((promo: any) => {
                  const status = getStatus(promo);
                  return (
                    <tr key={promo.id} className="hover:bg-[#FAFAF8] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#1A1A1A] line-clamp-1">{promo.product?.name ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3 font-medium">₹{Number(promo.bidAmountInr).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-[#6B6056] text-xs">
                        <p>{new Date(promo.startsAt).toLocaleDateString()}</p>
                        {promo.endsAt && <p>→ {new Date(promo.endsAt).toLocaleDateString()}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-[#6B6056]">
                          <Eye className="h-3.5 w-3.5" />{promo.impressions ?? 0}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-[#6B6056]">
                          <MousePointerClick className="h-3.5 w-3.5" />{promo.clicks ?? 0}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold border", STATUS_STYLE[status])}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {status !== "active" && (
                          <button
                            onClick={() => { if (confirm("Cancel this promotion?")) cancelMutation.mutate(promo.id); }}
                            className="text-[#6B6056] hover:text-[#C0392B] transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
