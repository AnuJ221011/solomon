"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

export default function AdminPayoutsPage() {
  const qc = useQueryClient();
  const [isPaidFilter, setIsPaidFilter] = useState<"false" | "true">("false");
  const [selected, setSelected] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payouts", isPaidFilter],
    queryFn: async () => {
      const { data } = await api.get(`/admin/payouts?isPaid=${isPaidFilter}&limit=100`);
      return data.data;
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (ids: string[]) => api.post("/admin/payouts/bulk-paid", { payoutIds: ids }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["admin-payouts"] });
      setSelected([]);
      toast.success(`${res.data.data.count} payouts marked as paid`);
    },
    onError: () => toast.error("Failed"),
  });

  const exportCsv = () => {
    window.open(`/api/admin/payouts/export?isPaid=${isPaidFilter}`, "_blank");
  };

  const payouts = data?.payouts ?? [];
  const totalPending = payouts.reduce((s: number, p: any) => s + Number(p.netInr), 0);

  const toggleAll = () => setSelected(selected.length === payouts.length ? [] : payouts.map((p: any) => p.id));
  const toggleOne = (id: string) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1A1A1A]">Payout Management</h1>
          {isPaidFilter === "false" && payouts.length > 0 && (
            <p className="text-sm text-[#444748] mt-0.5">
              Total pending: <span className="font-semibold text-[#1A1A1A]">₹{totalPending.toLocaleString("en-IN")}</span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="flex items-center gap-2 h-9 px-3 rounded-lg border border-[#E5E1D8] text-sm text-[#444748] hover:bg-[#F9F7F2] transition-colors">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          {selected.length > 0 && (
            <button onClick={() => markPaidMutation.mutate(selected)} disabled={markPaidMutation.isPending}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#2D6A4F] hover:bg-[#245c42] text-white text-sm font-medium transition-colors disabled:opacity-60">
              {markPaidMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Mark {selected.length} paid
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[["false", "Pending"], ["true", "Paid"]].map(([v, l]) => (
          <button key={v} onClick={() => { setIsPaidFilter(v as any); setSelected([]); }}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all border",
              isPaidFilter === v ? "bg-[#1A1A1A] border-[#A68B67] text-white" : "bg-white border-[#E5E1D8] text-[#444748] hover:border-[#A68B67]")}>
            {l}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#A68B67]" /></div>
      ) : payouts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-[#E5E1D8]">
          <CheckCircle2 className="h-8 w-8 text-[#2D6A4F] mx-auto mb-2" />
          <p className="text-sm text-[#444748]">No {isPaidFilter === "false" ? "pending" : "paid"} payouts.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#E5E1D8] shadow-warm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F7F2] border-b border-[#E5E1D8] text-xs text-[#444748] uppercase tracking-wider">
                  {isPaidFilter === "false" && (
                    <th className="px-4 py-3">
                      <input type="checkbox" checked={selected.length === payouts.length} onChange={toggleAll} className="accent-[#A68B67]" />
                    </th>
                  )}
                  {["Brand", "Order ID", "Gross (₹)", "Commission", "Net (₹)", "Speed", "Scheduled", isPaidFilter === "true" ? "Paid on" : ""].map((h) => h && (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E1D8]">
                {payouts.map((p: any) => (
                  <tr key={p.id} className="hover:bg-[#F9F7F2] transition-colors">
                    {isPaidFilter === "false" && (
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleOne(p.id)} className="accent-[#A68B67]" />
                      </td>
                    )}
                    <td className="px-4 py-3 font-medium text-[#1A1A1A]">{p.brandProfile?.brandName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#444748]">{p.orderId?.slice(0, 10)}…</td>
                    <td className="px-4 py-3">₹{Number(p.grossInr).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-[#C0392B]">-₹{Number(p.commissionInr).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 font-semibold text-[#2D6A4F]">₹{Number(p.netInr).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold",
                        p.payoutSpeed === "EXPRESS" ? "bg-[#FEF3C7] text-[#B45309]" : "bg-[#F5F5F5] text-[#444748]")}>
                        {p.payoutSpeed === "EXPRESS" ? "Express" : "Net 30"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#444748]">
                      {p.scheduledAt ? new Date(p.scheduledAt).toLocaleDateString() : "—"}
                    </td>
                    {isPaidFilter === "true" && (
                      <td className="px-4 py-3 text-xs text-[#2D6A4F]">
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}