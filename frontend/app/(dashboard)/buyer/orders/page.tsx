"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Package, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { useCurrencyStore } from "@/lib/stores/currencyStore";
import { cn } from "@/lib/utils";

const STATUSES = ["", "PENDING", "CONFIRMED", "DISPATCHED", "DELIVERED"];
const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-[#FEF3C7] text-[#B45309]", CONFIRMED: "bg-[#EFF6FF] text-[#1E3A5F]",
  PROCESSING: "bg-[#F5F3FF] text-[#6D28D9]", DISPATCHED: "bg-[#F0FDF4] text-[#166534]",
  DELIVERED: "bg-[#E8F5EE] text-[#2D6A4F]", CANCELLED: "bg-[#FEF2F2] text-[#B91C1C]",
};

export default function BuyerOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { format } = useCurrencyStore();

  const { data, isLoading } = useQuery({
    queryKey: ["buyer-orders", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter) params.set("status", statusFilter);
      const { data } = await api.get(`/orders/my?${params}`);
      return data.data;
    },
  });

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-heading text-2xl font-bold text-[#1A1A1A]">My Orders</h1>

      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              statusFilter === s ? "bg-[#C8956C] border-[#C8956C] text-white" : "bg-white border-[#E8E0D8] text-[#6B6056] hover:border-[#C8956C]")}>
            {s || "All orders"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#C8956C]" /></div>
      ) : !data?.orders?.length ? (
        <div className="text-center py-20 bg-white rounded-xl border border-[#E8E0D8]">
          <Package className="h-10 w-10 text-[#E8E0D8] mx-auto mb-3" />
          <p className="font-heading text-lg text-[#1A1A1A] mb-1">No orders yet</p>
          <Link href="/shop" className="text-sm text-[#C8956C] font-medium">Start browsing →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {data.orders.map((order: any) => (
            <Link key={order.id} href={`/orders/${order.id}`}
              className="flex items-center gap-4 bg-white rounded-xl border border-[#E8E0D8] p-4 hover:border-[#C8956C] hover:shadow-warm-md transition-all group">
              <div className="h-12 w-12 rounded-xl bg-[#F5EDE6] flex items-center justify-center shrink-0">
                <Package className="h-6 w-6 text-[#C8956C]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-[#1A1A1A] group-hover:text-[#C8956C] transition-colors">
                    {order.brand?.brandName}
                  </p>
                  {order.isOpeningOrder && (
                    <span className="text-[10px] bg-[#E8F5EE] text-[#2D6A4F] border border-[#B7DFC7] px-1.5 py-0.5 rounded-full font-semibold">First order</span>
                  )}
                </div>
                <p className="text-xs text-[#6B6056] mt-0.5">
                  {order.items?.length ?? 0} items · {new Date(order.createdAt).toLocaleDateString()}
                </p>
                {order.trackingNumber && (
                  <p className="text-xs text-[#2D6A4F] mt-0.5 font-medium">📦 {order.trackingNumber}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-sm text-[#1A1A1A]">{format(Number(order.totalInr))}</p>
                <span className={cn("mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold", STATUS_STYLE[order.status] ?? "bg-[#FAFAF8] text-[#6B6056]")}>
                  {order.status}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#E8E0D8] group-hover:text-[#C8956C] transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
