"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { AchievementBadge } from "@/components/shared/AchievementBadge";
import type { AchievementLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUSES = ["APPROVED","PENDING","REJECTED","SUSPENDED"];
const LEVELS   = ["","L1_SPROUT","L2_RISING","L3_TRUSTED","L4_ELITE","L5_LEGEND"];

export default function AdminBrandsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("APPROVED");
  const [level, setLevel] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-brands", search, status, level],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (status) params.set("status", status);
      if (level)  params.set("level", level);
      if (search) params.set("search", search);
      const { data } = await api.get(`/brands?${params}`);
      return data.data;
    },
    placeholderData: (prev) => prev,
  });

  const overrideMutation = useMutation({
    mutationFn: ({ id, level }: { id: string; level: string }) => api.post(`/admin/brands/${id}/level`, { level }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-brands"] }); toast.success("Level updated"); },
    onError: () => toast.error("Failed"),
  });

  const suspendMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/admin/users/${userId}/suspend`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-brands"] }); toast.success("User suspended"); },
    onError: () => toast.error("Failed"),
  });

  const brands = data?.brands ?? [];

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#1A1A1A]">Brand Management</h1>
        <p className="text-sm text-[#444748] mt-0.5">View and manage all brands on the platform.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#444748]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search brands…"
            className="pl-9 pr-4 h-10 w-56 rounded-lg border border-[#E5E1D8] bg-white text-sm focus:outline-none focus:border-[#A68B67]" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                status === s ? "bg-[#1A1A1A] border-[#A68B67] text-white" : "bg-white border-[#E5E1D8] text-[#444748] hover:border-[#A68B67]")}>
              {s}
            </button>
          ))}
        </div>
        <select value={level} onChange={(e) => setLevel(e.target.value)}
          className="h-10 pl-3 pr-8 rounded-lg border border-[#E5E1D8] bg-white text-sm text-[#444748] focus:outline-none focus:border-[#A68B67] cursor-pointer">
          {LEVELS.map((l) => <option key={l} value={l}>{l || "All levels"}</option>)}
        </select>
      </div>

      <p className="text-sm text-[#444748]">{data?.total ?? 0} brands</p>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#A68B67]" /></div>
      ) : (
        <div className="bg-white rounded-lg border border-[#E5E1D8] shadow-warm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9F7F2] border-b border-[#E5E1D8] text-xs text-[#444748] uppercase tracking-wider">
                  {["Brand", "Category", "Level", "Orders", "Rating", "Override Level", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E1D8]">
                {brands.map((brand: any) => (
                  <tr key={brand.id} className="hover:bg-[#F9F7F2] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/brands/${brand.slug}`} className="font-medium text-[#1A1A1A] hover:text-[#A68B67] transition-colors">
                        {brand.brandName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#444748]">{brand.category?.[0]}</td>
                    <td className="px-4 py-3">
                      <AchievementBadge level={brand.achievementLevel as AchievementLevel} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-[#444748]">{brand.confirmedOrderCount ?? 0}</td>
                    <td className="px-4 py-3 text-[#444748]">{brand.avgRating > 0 ? brand.avgRating.toFixed(1) : "—"}</td>
                    <td className="px-4 py-3">
                      <select
                        defaultValue={brand.achievementLevel}
                        onChange={(e) => overrideMutation.mutate({ id: brand.id, level: e.target.value })}
                        className="h-8 px-2 rounded-lg border border-[#E5E1D8] text-xs focus:outline-none focus:border-[#A68B67] cursor-pointer"
                      >
                        {["L1_SPROUT","L2_RISING","L3_TRUSTED","L4_ELITE","L5_LEGEND"].map((l) => (
                          <option key={l} value={l}>{l.replace("L","").replace("_"," ").replace(/\d /,"")}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { if (confirm("Suspend this brand's account?")) suspendMutation.mutate(brand.userId ?? brand.id); }}
                        className="text-xs text-[#C0392B] hover:underline">
                        Suspend
                      </button>
                    </td>
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