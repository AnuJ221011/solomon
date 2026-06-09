"use client";

import { useQuery } from "@tanstack/react-query";
import { Copy, Loader2, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function BuyerReferralsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["referrals-page"],
    queryFn: async () => {
      const [link, leaderboard] = await Promise.all([
        api.get("/referrals/link"),
        api.get("/referrals/leaderboard"),
      ]);
      return { link: link.data.data, leaderboard: leaderboard.data.data };
    },
  });

  const copyLink = () => {
    const url = `${window.location.origin}${data?.link?.referralLink}`;
    navigator.clipboard.writeText(url);
    toast.success("Referral link copied!");
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#A68B67]" /></div>;

  const lb = data?.leaderboard;
  const myStats = lb?.myStats;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#1A1A1A]">Referral Program</h1>
        <p className="mt-1 text-sm text-[#444748]">Refer brands to Solomon Bharat and earn ₹500 store credit per brand's first sale.</p>
      </div>

      {/* Referral link */}
      <div className="bg-white rounded-lg border border-[#E5E1D8] shadow-warm p-6 space-y-4">
        <h2 className="font-heading text-base font-semibold text-[#1A1A1A]">Your referral link</h2>
        <div className="flex gap-2">
          <div className="flex-1 h-10 px-3 rounded-lg border border-[#E5E1D8] bg-[#F9F7F2] text-sm text-[#1A1A1A] flex items-center overflow-hidden">
            <span className="truncate">{window.location.origin}{data?.link?.referralLink ?? "/signup?ref=…"}</span>
          </div>
          <button onClick={copyLink} className="h-10 px-3 rounded-lg bg-[#1A1A1A] hover:bg-[#8B7055] text-white flex items-center gap-2 text-sm font-medium transition-colors">
            <Copy className="h-4 w-4" /> Copy
          </button>
        </div>
        <p className="text-xs text-[#444748]">Share this link with brands. You'll earn ₹500 when they complete their first wholesale sale.</p>
      </div>

      {/* My stats */}
      {myStats && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Brands referred", value: myStats.referrals ?? 0, icon: Users },
            { label: "Your rank", value: myStats.rank ? `#${myStats.rank}` : "–", icon: Trophy },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg border border-[#E5E1D8] shadow-warm p-4 text-center">
              <s.icon className="h-6 w-6 text-[#A68B67] mx-auto mb-2" />
              <p className="text-2xl font-bold text-[#1A1A1A]">{s.value}</p>
              <p className="text-xs text-[#444748]">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {myStats?.summary && (
        <div className="p-4 rounded-lg bg-[#F5F0E8] border border-[#DDD0BA] text-sm text-[#6B4E2A] font-medium">
          🏆 {myStats.summary}
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-white rounded-lg border border-[#E5E1D8] shadow-warm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E1D8] bg-[#F9F7F2]">
          <h2 className="font-heading text-sm font-semibold text-[#1A1A1A]">Top referrers this month</h2>
        </div>
        <div className="divide-y divide-[#E5E1D8]">
          {lb?.leaderboard?.slice(0, 10).map((entry: any) => (
            <div key={entry.userId} className="flex items-center gap-4 px-5 py-3">
              <span className="text-sm font-bold text-[#444748] w-6">{entry.rank}</span>
              <div className="h-8 w-8 rounded bg-[#F5F0E8] flex items-center justify-center text-sm font-semibold text-[#A68B67]">
                {entry.name?.charAt(0)}
              </div>
              <p className="flex-1 text-sm font-medium text-[#1A1A1A]">{entry.name}</p>
              <p className="text-sm font-semibold text-[#2D6A4F]">{entry.referrals} brands</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}