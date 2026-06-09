"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag, Heart, Wallet, Users, ArrowRight,
  Package, Clock, CheckCircle2, Loader2,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/authStore";
import { useCurrencyStore } from "@/lib/stores/currencyStore";
import { cn } from "@/lib/utils";

const ORDER_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  PENDING:     { label: "Pending",    className: "bg-[#FEF3C7] text-[#B45309]"  },
  CONFIRMED:   { label: "Confirmed",  className: "bg-[#EFF6FF] text-[#1E3A5F]"  },
  PROCESSING:  { label: "Processing", className: "bg-[#F5F3FF] text-[#6D28D9]"  },
  DISPATCHED:  { label: "Dispatched", className: "bg-[#F0FDF4] text-[#166534]"  },
  DELIVERED:   { label: "Delivered",  className: "bg-[#E8F5EE] text-[#2D6A4F]"  },
  CANCELLED:   { label: "Cancelled",  className: "bg-[#FEF2F2] text-[#B91C1C]"  },
  DISPUTED:    { label: "Disputed",   className: "bg-[#FFF7ED] text-[#C2410C]"  },
};

function useBuyerDashboard() {
  return useQuery({
    queryKey: ["buyer-dashboard"],
    queryFn: async () => {
      const [dash, wallet] = await Promise.all([
        api.get("/buyer/dashboard"),
        api.get("/referrals/wallet"),
      ]);
      return { dash: dash.data.data, wallet: wallet.data.data };
    },
  });
}

export default function BuyerDashboardPage() {
  const { user } = useAuthStore();
  const { format } = useCurrencyStore();
  const { data, isLoading } = useBuyerDashboard();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#A68B67]" />
      </div>
    );
  }

  const orders = data?.dash?.recentOrders ?? [];
  const referralStats = data?.dash?.referralStats ?? {};
  const walletBalance = data?.wallet?.balanceInr ?? 0;
  const activeCredits = data?.wallet?.credits ?? [];

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#1A1A1A]">
          Hi, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-[#444748]">
          Your wholesale orders and account overview.
        </p>
      </div>

      {/* Quick stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total orders",   value: orders.length,                          icon: ShoppingBag, color: "text-[#A68B67]", bg: "bg-[#F5F0E8]" },
          { label: "Wallet credits", value: `₹${Number(walletBalance).toFixed(0)}`, icon: Wallet,      color: "text-[#2D6A4F]", bg: "bg-[#E8F5EE]" },
          { label: "Brands referred",value: referralStats.totalReferrals ?? 0,       icon: Users,       color: "text-[#1E3A5F]", bg: "bg-[#EFF6FF]" },
          { label: "Saved items",    value: "–",                                     icon: Heart,       color: "text-[#F59E0B]", bg: "bg-[#FEF3C7]" },
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-[#E5E1D8] shadow-warm">
          <div className="flex items-center justify-between p-5 border-b border-[#E5E1D8]">
            <h2 className="font-heading text-base font-semibold text-[#1A1A1A]">Recent orders</h2>
            <Link href="/buyer/orders" className="text-xs text-[#A68B67] hover:text-[#8B7055] flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {orders.length > 0 ? (
            <div className="divide-y divide-[#E5E1D8]">
              {orders.slice(0, 5).map((order: any) => {
                const status = ORDER_STATUS_STYLES[order.status] ?? { label: order.status, className: "" };
                return (
                  <Link
                    key={order.id}
                    href={`/buyer/orders/${order.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#F9F7F2] transition-colors group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-[#F5F0E8] flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-[#A68B67]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] truncate group-hover:text-[#A68B67] transition-colors">
                        {order.brand?.brandName ?? "Brand"}
                      </p>
                      <p className="text-xs text-[#444748]">
                        {new Date(order.createdAt).toLocaleDateString()} · ₹{Number(order.totalInr).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", status.className)}>
                      {status.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <ShoppingBag className="h-8 w-8 text-[#E5E1D8] mx-auto mb-2" />
              <p className="text-sm text-[#444748]">No orders yet</p>
              <Link href="/shop" className="mt-2 text-xs text-[#A68B67] font-medium">Start browsing →</Link>
            </div>
          )}
        </div>

        {/* Wallet + referrals */}
        <div className="space-y-4">
          {/* Wallet */}
          <div className="bg-white rounded-lg border border-[#E5E1D8] p-5 shadow-warm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-sm font-semibold text-[#1A1A1A]">Wallet</h2>
              <Link href="/buyer/wallet" className="text-xs text-[#A68B67]">Details</Link>
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">₹{Number(walletBalance).toFixed(0)}</p>
            <p className="text-xs text-[#444748] mt-0.5">Available store credit</p>
            {activeCredits.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#E5E1D8] space-y-1.5">
                {activeCredits.slice(0, 2).map((c: any) => (
                  <div key={c.id} className="flex justify-between text-xs">
                    <span className="text-[#444748] truncate">{c.reason}</span>
                    <span className="font-medium text-[#2D6A4F]">₹{Number(c.amountInr).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Referrals */}
          <div className="bg-white rounded-lg border border-[#E5E1D8] p-5 shadow-warm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-sm font-semibold text-[#1A1A1A]">Referrals</h2>
              <Link href="/buyer/referrals" className="text-xs text-[#A68B67]">Details</Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-[#F5F0E8]">
                <p className="text-lg font-bold text-[#1A1A1A]">{referralStats.totalReferrals ?? 0}</p>
                <p className="text-[10px] text-[#444748]">brands referred</p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#E8F5EE]">
                <p className="text-lg font-bold text-[#1A1A1A]">{referralStats.rewardsEarned ?? 0}</p>
                <p className="text-[10px] text-[#444748]">rewards earned</p>
              </div>
            </div>
            <Link href="/buyer/referrals" className="mt-3 block text-xs text-[#A68B67] font-medium">
              Get ₹500 per brand referral →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}