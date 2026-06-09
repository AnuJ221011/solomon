"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, Eye, ShoppingBag, Star, Globe } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

export default function BrandAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["brand-analytics"],
    queryFn: async () => {
      const [dashboard, products, shareLinks] = await Promise.all([
        api.get("/brands/me/dashboard"),
        api.get("/products/me/listings?limit=20&sortBy=orderCount&sortOrder=desc"),
        api.get("/share-links"),
      ]);
      return {
        dashboard: dashboard.data.data,
        products: products.data.data?.products ?? [],
        shareLinks: shareLinks.data.data ?? [],
      };
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#A68B67]" /></div>;
  }

  const d = data?.dashboard;
  const products = data?.products ?? [];
  const shareLinks = data?.shareLinks ?? [];

  const totalViews = products.reduce((s: number, p: any) => s + (p.viewCount ?? 0), 0);
  const totalOrders = products.reduce((s: number, p: any) => s + (p.orderCount ?? 0), 0);
  const convRate = totalViews > 0 ? ((totalOrders / totalViews) * 100).toFixed(1) : "0";
  const totalCommissionSaved = shareLinks.reduce((s: number, l: any) => s + Number(l.commissionSavedInr ?? 0), 0);

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#1A1A1A]">Analytics</h1>
        <p className="mt-1 text-sm text-[#444748]">Performance overview for your brand.</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total GMV",         value: `₹${Number(d?.totalGmvInr ?? 0).toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-[#2D6A4F]", bg: "bg-[#E8F5EE]" },
          { label: "Product views",     value: totalViews,    icon: Eye,         color: "text-[#A68B67]", bg: "bg-[#F5F0E8]" },
          { label: "Total orders",      value: d?.confirmedOrderCount ?? 0, icon: ShoppingBag, color: "text-[#1E3A5F]", bg: "bg-[#EFF6FF]" },
          { label: "Avg rating",        value: d?.avgRating ? d.avgRating.toFixed(1) : "–", icon: Star, color: "text-[#F59E0B]", bg: "bg-[#FEF3C7]" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-[#E5E1D8] p-4 shadow-warm">
            <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center mb-3", s.bg)}>
              <s.icon className={cn("h-5 w-5", s.color)} />
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{s.value}</p>
            <p className="text-xs text-[#444748] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-white rounded-lg border border-[#E5E1D8] shadow-warm">
          <div className="px-5 py-4 border-b border-[#E5E1D8]">
            <h2 className="font-heading text-sm font-semibold text-[#1A1A1A]">Top products by orders</h2>
          </div>
          {products.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#444748]">No products yet.</div>
          ) : (
            <div className="divide-y divide-[#E5E1D8]">
              {products.slice(0, 8).map((p: any) => {
                const rate = p.viewCount > 0 ? ((p.orderCount / p.viewCount) * 100).toFixed(1) : "0";
                return (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">{p.name}</p>
                      <p className="text-xs text-[#444748] mt-0.5">{p.viewCount ?? 0} views · {rate}% conversion</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm text-[#1A1A1A]">{p.orderCount} orders</p>
                      <p className="text-xs text-[#2D6A4F]">₹{Number(p.wholesalePriceInr).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Share link performance */}
        <div className="bg-white rounded-lg border border-[#E5E1D8] shadow-warm">
          <div className="px-5 py-4 border-b border-[#E5E1D8]">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-sm font-semibold text-[#1A1A1A]">Share link performance</h2>
              {totalCommissionSaved > 0 && (
                <span className="text-xs font-semibold text-[#2D6A4F]">
                  ₹{totalCommissionSaved.toLocaleString("en-IN")} saved
                </span>
              )}
            </div>
          </div>
          {shareLinks.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#444748]">No share links yet.</div>
          ) : (
            <div className="divide-y divide-[#E5E1D8]">
              {shareLinks.slice(0, 6).map((link: any) => (
                <div key={link.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A] truncate">{link.slug ?? link.token.slice(0, 10) + "…"}</p>
                    <p className="text-xs text-[#444748] mt-0.5">
                      {link.viewCount} views · {link.signupCount} signups · {link.orderCount} orders
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-[#2D6A4F]">₹{Number(link.commissionSavedInr ?? 0).toFixed(0)} saved</p>
                    <p className="text-xs text-[#444748]">₹{Number(link.revenueInr ?? 0).toLocaleString("en-IN")} rev</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Conversion summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Overall conversion", value: `${convRate}%`, sub: "views → orders" },
          { label: "Share link signups", value: shareLinks.reduce((s: number, l: any) => s + l.signupCount, 0), sub: "via share links" },
          { label: "Commission saved", value: `₹${totalCommissionSaved.toLocaleString("en-IN")}`, sub: "via 0% share links" },
          { label: "This month GMV", value: `₹${Number(d?.gmvThisMonthInr ?? 0).toLocaleString("en-IN")}`, sub: "vs last month" },
        ].map((s) => (
          <div key={s.label} className="bg-[#F9F7F2] rounded-lg border border-[#E5E1D8] p-4">
            <p className="text-2xl font-bold text-[#1A1A1A]">{s.value}</p>
            <p className="text-xs font-medium text-[#1A1A1A] mt-1">{s.label}</p>
            <p className="text-xs text-[#444748]">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}