"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  TrendingUp, ShoppingBag, Star, Link2,
  ArrowUpRight, Package, Wallet, ChevronRight, Loader2,
} from "lucide-react";
import api from "@/lib/api";
import { AchievementBadge } from "@/components/shared/AchievementBadge";
import { useAuthStore } from "@/lib/stores/authStore";
import { cn } from "@/lib/utils";

function useBrandDashboard() {
  return useQuery({
    queryKey: ["brand-dashboard"],
    queryFn: async () => {
      const [dashboard, progress] = await Promise.all([
        api.get("/brands/me/dashboard"),
        api.get("/achievements/progress"),
      ]);
      return { dashboard: dashboard.data.data, progress: progress.data.data };
    },
  });
}

export default function BrandDashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useBrandDashboard();

  if (isLoading) return <DashboardSkeleton />;

  const d = data?.dashboard;
  const p = data?.progress;

  const stats = [
    { label: "GMV this month",   value: d?.gmvThisMonthInr ? `₹${Number(d.gmvThisMonthInr).toLocaleString("en-IN")}` : "₹0",  icon: TrendingUp,   color: "text-[#2D6A4F]", bg: "bg-[#E8F5EE]" },
    { label: "Orders this month", value: d?.ordersThisMonth ?? 0,                                                                icon: ShoppingBag,  color: "text-[#A68B67]", bg: "bg-[#F5F0E8]" },
    { label: "Avg rating",        value: d?.avgRating ? d.avgRating.toFixed(1) : "–",                                           icon: Star,         color: "text-[#F59E0B]", bg: "bg-[#FEF3C7]" },
    { label: "Pending payout",   value: d?.pendingPayoutInr ? `₹${Number(d.pendingPayoutInr).toLocaleString("en-IN")}` : "₹0", icon: Wallet,       color: "text-[#1E3A5F]", bg: "bg-[#EFF6FF]" },
  ];

  return (
    <div className="max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1A1A1A]">
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-[#444748]">Here's what's happening with your brand today.</p>
        </div>
        <Link
          href="/brand/products/new"
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#1A1A1A] hover:bg-[#8B7055] text-white text-sm font-medium transition-colors"
        >
          <Package className="h-4 w-4" />
          Add product
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-[#E5E1D8] p-4 shadow-warm">
            <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center mb-3", s.bg)}>
              <s.icon className={cn("h-5 w-5", s.color)} />
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{s.value}</p>
            <p className="text-xs text-[#444748] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Achievement progress */}
        {p && (
          <div className="lg:col-span-2 bg-white rounded-lg border border-[#E5E1D8] p-6 shadow-warm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-base font-semibold text-[#1A1A1A]">Achievement level</h2>
              <AchievementBadge level={p.currentLevel} size="md" />
            </div>

            {p.nextLevel && (
              <div className="space-y-3">
                <p className="text-sm text-[#444748]">
                  Progress to <span className="font-medium text-[#1A1A1A]">{p.nextLevel.name}</span>
                </p>
                {Object.entries(p.nextLevel.criteria ?? {}).map(([key, target]: any) => {
                  const current = p.stats?.[key] ?? 0;
                  const pct = Math.min((current / target) * 100, 100);
                  const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s: string) => s.toUpperCase());
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#444748]">{label}</span>
                        <span className="font-medium text-[#1A1A1A]">{current} / {target}</span>
                      </div>
                      <div className="h-1.5 bg-[#F5F0E8] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1A1A1A] rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!p.nextLevel && (
              <p className="text-sm text-[#2D6A4F] font-medium">🏆 Maximum level reached!</p>
            )}
          </div>
        )}

        {/* Share links */}
        <div className="bg-white rounded-lg border border-[#E5E1D8] p-6 shadow-warm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-base font-semibold text-[#1A1A1A]">Share Links</h2>
            <Link href="/brand/share-links" className="text-xs text-[#A68B67] hover:text-[#8B7055] flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {d?.shareLinks?.length > 0 ? (
            <div className="space-y-3">
              {d.shareLinks.slice(0, 3).map((link: any) => (
                <div key={link.id} className="flex items-center justify-between py-2 border-b border-[#E5E1D8] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A] truncate max-w-[140px]">
                      {link.slug ?? link.token.slice(0, 8) + "…"}
                    </p>
                    <p className="text-xs text-[#444748]">{link.viewCount} views · {link.signupCount} signups</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-[#2D6A4F]">₹{Number(link.commissionSavedInr).toFixed(0)} saved</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Link2 className="h-8 w-8 text-[#E5E1D8] mx-auto mb-2" />
              <p className="text-sm text-[#444748]">No share links yet</p>
              <Link href="/brand/share-links" className="mt-2 text-xs text-[#A68B67] font-medium">Create one →</Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: "/brand/orders",     icon: ShoppingBag, label: "Manage orders",  badge: null },
          { href: "/brand/products",   icon: Package,     label: "View products",  badge: null },
          { href: "/brand/share-links",icon: Link2,       label: "Share catalogue", badge: "0% commission" },
          { href: "/brand/analytics",  icon: TrendingUp,  label: "View analytics", badge: null },
        ].map(({ href, icon: Icon, label, badge }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-[#E5E1D8] hover:border-[#A68B67] hover:shadow-warm-md transition-all group"
          >
            <div className="h-9 w-9 rounded-lg bg-[#F5F0E8] flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-[#A68B67]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1A1A1A] group-hover:text-[#A68B67] transition-colors">{label}</p>
              {badge && <span className="text-[10px] text-[#2D6A4F] font-semibold">{badge}</span>}
            </div>
            <ChevronRight className="h-4 w-4 text-[#E5E1D8] ml-auto group-hover:text-[#A68B67] transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="max-w-6xl space-y-8">
      <div className="h-8 w-64 bg-[#F5F0E8] rounded animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-[#E5E1D8] p-4 h-28 animate-pulse" />
        ))}
      </div>
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#A68B67]" />
      </div>
    </div>
  );
}