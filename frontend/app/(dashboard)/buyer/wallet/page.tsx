"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Wallet, Clock } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  ACTIVE:  "bg-[#E8F5EE] text-[#2D6A4F]",
  PENDING: "bg-[#FEF3C7] text-[#B45309]",
  USED:    "bg-[#F5F0E8] text-[#444748]",
  EXPIRED: "bg-[#F5F5F5] text-[#9CA3AF]",
};

export default function BuyerWalletPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const { data } = await api.get("/referrals/wallet");
      return data.data;
    },
  });

  const balance = Number(data?.balanceInr ?? 0);
  const credits = data?.credits ?? [];

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-heading text-2xl font-bold text-[#1A1A1A]">Wallet & Credits</h1>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#A68B67]" /></div>
      ) : (
        <>
          {/* Balance card */}
          <div className="bg-[#1A1A1A] rounded-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-[#1A1A1A]/20 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-[#A68B67]" />
              </div>
              <div>
                <p className="text-xs text-[#444748]">Available balance</p>
                <p className="font-heading text-3xl font-bold text-white">₹{balance.toFixed(0)}</p>
              </div>
            </div>
            <p className="text-xs text-[#444748]">Credits are applied automatically at checkout. Expire after 12 months.</p>
          </div>

          {/* Credits history */}
          <div className="bg-white rounded-lg border border-[#E5E1D8] shadow-warm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E1D8] bg-[#F9F7F2]">
              <h2 className="font-heading text-sm font-semibold text-[#1A1A1A]">Credit history</h2>
            </div>
            {credits.length === 0 ? (
              <div className="py-12 text-center">
                <Clock className="h-8 w-8 text-[#E5E1D8] mx-auto mb-2" />
                <p className="text-sm text-[#444748]">No credits yet. Refer a brand to earn ₹500!</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E5E1D8]">
                {credits.map((credit: any) => (
                  <div key={credit.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">{credit.reason}</p>
                      <p className="text-xs text-[#444748] mt-0.5">
                        Expires {new Date(credit.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm text-[#2D6A4F]">₹{Number(credit.amountInr).toFixed(0)}</p>
                      <span className={cn("inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold", STATUS_STYLE[credit.status] ?? "")}>
                        {credit.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}