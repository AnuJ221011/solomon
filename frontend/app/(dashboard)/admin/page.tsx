"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Store, Users, ShoppingBag, Wallet,
  CheckCircle2, XCircle, Loader2, ChevronRight, Zap, ToggleRight, ToggleLeft,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { AchievementBadge } from "@/components/shared/AchievementBadge";
import { cn } from "@/lib/utils";

function useAdminData() {
  return useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [stats, pending, promotions] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/brands/pending"),
        api.get("/promoted/admin/active").catch(() => ({ data: { data: [] } })),
      ]);
      return { stats: stats.data.data, pending: pending.data.data, promotions: promotions.data.data };
    },
    refetchInterval: 30_000,
  });
}

export default function AdminPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useAdminData();
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId]  = useState<string | null>(null);

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/brands/${id}/approve`),
    onMutate: (id) => setApprovingId(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-overview"] }); toast.success("Brand approved"); },
    onError: () => toast.error("Failed to approve"),
    onSettled: () => setApprovingId(null),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/brands/${id}/reject`),
    onMutate: (id) => setRejectingId(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-overview"] }); toast.success("Brand rejected"); },
    onError: () => toast.error("Failed to reject"),
    onSettled: () => setRejectingId(null),
  });

  const activatePromotionMutation = useMutation({
    mutationFn: (id: string) => api.post(`/promoted/${id}/activate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-overview"] }); toast.success("Promotion activated"); },
    onError: () => toast.error("Failed to activate"),
  });

  const deactivatePromotionMutation = useMutation({
    mutationFn: (id: string) => api.post(`/promoted/${id}/deactivate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-overview"] }); toast.success("Promotion deactivated"); },
    onError: () => toast.error("Failed to deactivate"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#A68B67]" />
      </div>
    );
  }

  const s = data?.stats;
  const pending = data?.pending ?? [];
  const promotions = data?.promotions ?? [];

  const statCards = [
    { label: "Approved brands", value: s?.totalBrands ?? 0,                                                           icon: Store,      color: "text-[#A68B67]", bg: "bg-[#F5F0E8]" },
    { label: "Total buyers",    value: s?.totalBuyers ?? 0,                                                            icon: Users,      color: "text-[#2D6A4F]", bg: "bg-[#E8F5EE]" },
    { label: "Total orders",    value: s?.totalOrders ?? 0,                                                            icon: ShoppingBag,color: "text-[#1E3A5F]", bg: "bg-[#EFF6FF]" },
    { label: "Pending payouts", value: s?.pendingPayoutInr ? `₹${Number(s.pendingPayoutInr).toLocaleString("en-IN")}` : "₹0", icon: Wallet, color: "text-[#B45309]", bg: "bg-[#FEF3C7]" },
  ];

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#1A1A1A]">Admin Panel</h1>
        <p className="mt-1 text-sm text-[#444748]">Platform overview and brand management.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-[#E5E1D8] p-4 shadow-warm">
            <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center mb-3", s.bg)}>
              <s.icon className={cn("h-5 w-5", s.color)} />
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{s.value}</p>
            <p className="text-xs text-[#444748] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending approvals */}
      <div className="bg-white rounded-lg border border-[#E5E1D8] shadow-warm">
        <div className="flex items-center justify-between p-5 border-b border-[#E5E1D8]">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-base font-semibold text-[#1A1A1A]">Pending Brand Applications</h2>
            {pending.length > 0 && (
              <span className="h-5 min-w-5 px-1.5 rounded bg-[#1A1A1A] text-white text-[10px] font-semibold flex items-center justify-center">
                {pending.length}
              </span>
            )}
          </div>
        </div>

        {pending.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="h-8 w-8 text-[#2D6A4F] mx-auto mb-2" />
            <p className="text-sm text-[#444748]">All caught up! No pending applications.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E1D8]">
            {pending.map((brand: any) => (
              <div key={brand.id} className="flex items-center gap-4 px-5 py-4">
                {/* Logo placeholder */}
                <div className="h-10 w-10 rounded bg-[#F5F0E8] flex items-center justify-center shrink-0 font-heading font-bold text-[#A68B67]">
                  {brand.brandName.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#1A1A1A]">{brand.brandName}</p>
                    {brand.achievementLevel && (
                      <AchievementBadge level={brand.achievementLevel} size="sm" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-xs text-[#444748]">{brand.user?.email}</p>
                    {brand.category?.length > 0 && (
                      <span className="text-xs text-[#444748]">{brand.category.join(", ")}</span>
                    )}
                    <span className="text-xs text-[#444748]">
                      Applied {new Date(brand.user?.createdAt ?? brand.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {brand.instagramHandle && (
                    <p className="text-xs text-[#A68B67] mt-0.5">@{brand.instagramHandle}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => rejectMutation.mutate(brand.id)}
                    disabled={rejectingId === brand.id}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E1D8] text-xs font-medium text-[#C0392B] hover:bg-[#FEF2F2] hover:border-[#C0392B] transition-colors disabled:opacity-50"
                  >
                    {rejectingId === brand.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                    Reject
                  </button>
                  <button
                    onClick={() => approveMutation.mutate(brand.id)}
                    disabled={approvingId === brand.id}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#2D6A4F] hover:bg-[#245c42] text-white text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {approvingId === brand.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Promoted Listings */}
      <div className="bg-white rounded-lg border border-[#E5E1D8] shadow-warm">
        <div className="flex items-center justify-between p-5 border-b border-[#E5E1D8]">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#A68B67]" />
            <h2 className="font-heading text-base font-semibold text-[#1A1A1A]">Promoted Listings — Pending Activation</h2>
          </div>
        </div>

        {promotions.length === 0 ? (
          <div className="py-10 text-center">
            <Zap className="h-8 w-8 text-[#E5E1D8] mx-auto mb-2" />
            <p className="text-sm text-[#444748]">No pending promotions to review.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E1D8]">
            {promotions.map((promo: any) => (
              <div key={promo.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1A1A1A] truncate">{promo.product?.name ?? "Product"}</p>
                  <p className="text-xs text-[#444748] mt-0.5">{promo.brandProfile?.brandName}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[#444748]">
                    <span>Bid: <span className="font-semibold text-[#1A1A1A]">₹{Number(promo.bidAmountInr).toLocaleString("en-IN")}</span></span>
                    <span>Starts: {new Date(promo.startsAt).toLocaleDateString()}</span>
                    {promo.endsAt && <span>Ends: {new Date(promo.endsAt).toLocaleDateString()}</span>}
                    <span className={promo.isActive ? "text-[#2D6A4F] font-medium" : "text-[#B45309]"}>
                      {promo.isActive ? "● Active" : "● Pending"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!promo.isActive ? (
                    <button
                      onClick={() => activatePromotionMutation.mutate(promo.id)}
                      disabled={activatePromotionMutation.isPending}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#2D6A4F] hover:bg-[#245c42] text-white text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {activatePromotionMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ToggleRight className="h-3.5 w-3.5" />}
                      Activate
                    </button>
                  ) : (
                    <button
                      onClick={() => deactivatePromotionMutation.mutate(promo.id)}
                      disabled={deactivatePromotionMutation.isPending}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E1D8] text-xs font-medium text-[#C0392B] hover:bg-[#FEF2F2] hover:border-[#C0392B] transition-colors disabled:opacity-50"
                    >
                      {deactivatePromotionMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: "/admin/payouts", label: "Manage Payouts",  desc: "Review and process brand payouts" },
          { href: "/admin/brands",  label: "All Brands",      desc: "View and manage approved brands" },
          { href: "/admin/users",   label: "User Management", desc: "Suspend or reactivate accounts"  },
        ].map(({ href, label, desc }) => (
          <div key={href} className="flex items-center gap-3 p-4 bg-white rounded-lg border border-[#E5E1D8] hover:border-[#A68B67] hover:shadow-warm-md transition-all cursor-pointer group" onClick={() => {}}>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#1A1A1A] group-hover:text-[#A68B67] transition-colors">{label}</p>
              <p className="text-xs text-[#444748] mt-0.5">{desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#E5E1D8] group-hover:text-[#A68B67] transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
}