"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ChevronDown, Truck, Search } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const STATUSES = ["", "PENDING", "CONFIRMED", "PROCESSING", "DISPATCHED", "DELIVERED", "DISPUTED"];
const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending", CONFIRMED: "Confirmed", PROCESSING: "Processing",
  DISPATCHED: "Dispatched", DELIVERED: "Delivered", DISPUTED: "Disputed", CANCELLED: "Cancelled",
};
const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-[#FEF3C7] text-[#B45309]", CONFIRMED: "bg-[#EFF6FF] text-[#1E3A5F]",
  PROCESSING: "bg-[#F5F3FF] text-[#6D28D9]", DISPATCHED: "bg-[#F0FDF4] text-[#166534]",
  DELIVERED: "bg-[#E8F5EE] text-[#2D6A4F]", DISPUTED: "bg-[#FFF7ED] text-[#C2410C]",
};

export default function BrandOrdersPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dispatchModal, setDispatchModal] = useState<{ orderId: string } | null>(null);
  const [tracking, setTracking] = useState({ number: "", carrier: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["brand-orders", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter) params.set("status", statusFilter);
      const { data } = await api.get(`/orders/brand?${params}`);
      return data.data;
    },
  });

  const dispatchMutation = useMutation({
    mutationFn: ({ orderId }: { orderId: string }) =>
      api.patch(`/orders/brand/${orderId}/status`, {
        status: "DISPATCHED",
        trackingNumber: tracking.number || undefined,
        trackingCarrier: tracking.carrier || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand-orders"] });
      toast.success("Order marked as dispatched");
      setDispatchModal(null);
      setTracking({ number: "", carrier: "" });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Failed"),
  });

  const confirmMutation = useMutation({
    mutationFn: (orderId: string) => api.patch(`/orders/brand/${orderId}/status`, { status: "CONFIRMED" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["brand-orders"] }); toast.success("Order confirmed"); },
    onError: () => toast.error("Failed to confirm"),
  });

  const orders = (data?.orders ?? []).filter((o: any) =>
    !search || o.buyer?.buyerProfile?.businessName?.toLowerCase().includes(search.toLowerCase()) ||
    o.id.includes(search)
  );

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-[#1A1A1A]">Orders</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6056]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by customer or ID…"
            className="pl-9 pr-4 h-10 w-64 rounded-lg border border-[#E8E0D8] bg-white text-sm focus:outline-none focus:border-[#C8956C]" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                statusFilter === s ? "bg-[#C8956C] border-[#C8956C] text-white" : "bg-white border-[#E8E0D8] text-[#6B6056] hover:border-[#C8956C]")}>
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#C8956C]" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-[#E8E0D8]">
          <p className="text-[#6B6056]">No orders found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E0D8] shadow-warm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FAFAF8] border-b border-[#E8E0D8] text-xs text-[#6B6056] uppercase tracking-wider">
                  {["Order ID", "Customer", "Items", "Total (₹)", "Status", "Date", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D8]">
                {orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[#6B6056]">{order.id.slice(0, 10)}…</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1A1A1A]">{order.buyer?.buyerProfile?.businessName ?? order.buyer?.name}</p>
                      <p className="text-xs text-[#6B6056]">{order.buyer?.buyerProfile?.countryCode}</p>
                    </td>
                    <td className="px-4 py-3 text-[#6B6056]">{order.items?.length ?? 0}</td>
                    <td className="px-4 py-3 font-medium">₹{Number(order.totalInr).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", STATUS_STYLE[order.status] ?? "bg-[#FAFAF8] text-[#6B6056]")}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6B6056] text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {order.status === "PENDING" && (
                          <button onClick={() => confirmMutation.mutate(order.id)}
                            className="h-7 px-2.5 rounded-lg bg-[#2D6A4F] text-white text-xs font-medium hover:bg-[#245c42] transition-colors">
                            Confirm
                          </button>
                        )}
                        {(order.status === "CONFIRMED" || order.status === "PROCESSING") && (
                          <button onClick={() => setDispatchModal({ orderId: order.id })}
                            className="h-7 px-2.5 rounded-lg bg-[#C8956C] text-white text-xs font-medium hover:bg-[#B07D57] transition-colors flex items-center gap-1">
                            <Truck className="h-3 w-3" /> Dispatch
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dispatch modal */}
      {dispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDispatchModal(null)} />
          <div className="relative bg-white rounded-2xl border border-[#E8E0D8] shadow-warm-lg p-6 w-full max-w-sm space-y-4">
            <h2 className="font-heading text-lg font-semibold text-[#1A1A1A]">Mark as dispatched</h2>
            <input placeholder="Tracking number (optional)" value={tracking.number}
              onChange={(e) => setTracking({ ...tracking, number: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-[#E8E0D8] text-sm focus:outline-none focus:border-[#C8956C]" />
            <input placeholder="Carrier (e.g. DHL, FedEx)" value={tracking.carrier}
              onChange={(e) => setTracking({ ...tracking, carrier: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-[#E8E0D8] text-sm focus:outline-none focus:border-[#C8956C]" />
            <div className="flex gap-3">
              <button onClick={() => setDispatchModal(null)} className="flex-1 h-10 rounded-lg border border-[#E8E0D8] text-sm font-medium hover:bg-[#FAFAF8]">Cancel</button>
              <button onClick={() => dispatchMutation.mutate(dispatchModal)} disabled={dispatchMutation.isPending}
                className="flex-1 h-10 rounded-lg bg-[#C8956C] text-white text-sm font-medium hover:bg-[#B07D57] flex items-center justify-center gap-2 disabled:opacity-60">
                {dispatchMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Mark dispatched
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
