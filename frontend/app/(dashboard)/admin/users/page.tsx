"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("BUYER");

  // Use the brands list for BRAND users, buyer dashboard isn't directly accessible for all users
  // We'll use a combined approach — call the admin stats to get counts, then show manageable users
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", roleFilter, search],
    queryFn: async () => {
      // Admin doesn't have a direct /admin/users list endpoint — use brands for BRAND role
      if (roleFilter === "BRAND") {
        const { data } = await api.get(`/brands?limit=100${search ? `&search=${search}` : ""}`);
        return data.data.brands.map((b: any) => ({
          id: b.id,
          userId: b.userId,
          name: b.brandName,
          email: b.user?.email ?? "—",
          role: "BRAND",
          isActive: b.status !== "SUSPENDED",
          status: b.status,
        }));
      }
      return [];
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/admin/users/${userId}/suspend`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("User suspended"); },
    onError: () => toast.error("Failed"),
  });

  const reactivateMutation = useMutation({
    mutationFn: (userId: string) => api.post(`/admin/users/${userId}/reactivate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("User reactivated"); },
    onError: () => toast.error("Failed"),
  });

  const users = data ?? [];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#1A1A1A]">User Management</h1>
        <p className="text-sm text-[#6B6056] mt-0.5">Suspend or reactivate user accounts.</p>
      </div>

      <div className="flex gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6056]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name…"
            className="pl-9 pr-4 h-10 w-64 rounded-lg border border-[#E8E0D8] bg-white text-sm focus:outline-none focus:border-[#C8956C]" />
        </div>
        <div className="flex gap-1.5">
          {["BRAND", "BUYER"].map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium border transition-all",
                roleFilter === r ? "bg-[#C8956C] border-[#C8956C] text-white" : "bg-white border-[#E8E0D8] text-[#6B6056] hover:border-[#C8956C]")}>
              {r}s
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#C8956C]" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#E8E0D8]">
          <p className="text-sm text-[#6B6056]">No {roleFilter.toLowerCase()}s found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E8E0D8] shadow-warm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAFAF8] border-b border-[#E8E0D8] text-xs text-[#6B6056] uppercase tracking-wider">
                {["Name", "Role", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E0D8]">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-[#FAFAF8] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#1A1A1A]">{u.name}</p>
                    <p className="text-xs text-[#6B6056]">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#1E3A5F]">{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold",
                      u.isActive ? "bg-[#E8F5EE] text-[#2D6A4F]" : "bg-[#FEF2F2] text-[#B91C1C]")}>
                      {u.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive ? (
                      <button onClick={() => { if (confirm(`Suspend ${u.name}?`)) suspendMutation.mutate(u.userId ?? u.id); }}
                        className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-[#E8E0D8] text-xs font-medium text-[#C0392B] hover:bg-[#FEF2F2] hover:border-[#C0392B] transition-colors">
                        <UserX className="h-3.5 w-3.5" /> Suspend
                      </button>
                    ) : (
                      <button onClick={() => reactivateMutation.mutate(u.userId ?? u.id)}
                        className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-[#2D6A4F] text-white text-xs font-medium hover:bg-[#245c42] transition-colors">
                        <UserCheck className="h-3.5 w-3.5" /> Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
