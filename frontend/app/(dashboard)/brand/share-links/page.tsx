"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Copy, ExternalLink, Loader2, Trash2, ToggleLeft, ToggleRight, Link2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function BrandShareLinksPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ target: "STOREFRONT", slug: "", customMessage: "", lockedCurrency: "" });

  const { data: links, isLoading } = useQuery({
    queryKey: ["share-links-brand"],
    queryFn: async () => {
      const { data } = await api.get("/share-links");
      return data.data as any[];
    },
  });

  const createMutation = useMutation({
    mutationFn: () => api.post("/share-links", { ...form, slug: form.slug || undefined, lockedCurrency: form.lockedCurrency || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["share-links-brand"] }); setShowCreate(false); setForm({ target: "STOREFRONT", slug: "", customMessage: "", lockedCurrency: "" }); toast.success("Share link created!"); },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Failed"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`/share-links/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["share-links-brand"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/share-links/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["share-links-brand"] }); toast.success("Link deleted"); },
  });

  const copyLink = (token: string, slug?: string) => {
    const url = `${window.location.origin}/share-links/${slug ?? token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  };

  const whatsappShare = (token: string, brandName: string) => {
    const url = `${window.location.origin}/share-links/${token}`;
    const msg = encodeURIComponent(`Check out ${brandName}'s wholesale catalogue: ${url}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1A1A1A]">Share Links</h1>
          <p className="text-sm text-[#6B6056] mt-0.5">Orders via your share link pay 0% commission.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#C8956C] hover:bg-[#B07D57] text-white text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" /> Create link
        </button>
      </div>

      {/* Stats summary */}
      {links && links.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total links", value: links.length },
            { label: "Total signups", value: links.reduce((s: number, l: any) => s + l.signupCount, 0) },
            { label: "Commission saved", value: `₹${links.reduce((s: number, l: any) => s + Number(l.commissionSavedInr), 0).toLocaleString("en-IN")}` },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-[#E8E0D8] p-4 shadow-warm text-center">
              <p className="text-2xl font-bold text-[#1A1A1A]">{s.value}</p>
              <p className="text-xs text-[#6B6056] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-[#E8E0D8] shadow-warm p-5 space-y-4">
          <h2 className="font-heading text-base font-semibold text-[#1A1A1A]">New share link</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1A1A1A]">Target</label>
              <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className={inp}>
                <option value="STOREFRONT">Full storefront</option>
                <option value="COLLECTION">Collection</option>
                <option value="PRODUCT">Single product</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1A1A1A]">Custom slug (optional)</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="uk-buyers" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1A1A1A]">Lock currency (optional)</label>
              <input value={form.lockedCurrency} onChange={(e) => setForm({ ...form, lockedCurrency: e.target.value })} placeholder="GBP" maxLength={3} className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1A1A1A]">Welcome message (optional)</label>
              <input value={form.customMessage} onChange={(e) => setForm({ ...form, customMessage: e.target.value })} placeholder="Exclusive wholesale access…" className={inp} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowCreate(false)} className="flex-1 h-9 rounded-lg border border-[#E8E0D8] text-sm font-medium text-[#6B6056] hover:bg-[#FAFAF8]">Cancel</button>
            <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
              className="flex-1 h-9 rounded-lg bg-[#C8956C] hover:bg-[#B07D57] text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60">
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create link
            </button>
          </div>
        </div>
      )}

      {/* Links list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#C8956C]" /></div>
      ) : !links?.length ? (
        <div className="text-center py-20 bg-white rounded-xl border border-[#E8E0D8]">
          <Link2 className="h-10 w-10 text-[#E8E0D8] mx-auto mb-3" />
          <p className="font-heading text-lg text-[#1A1A1A] mb-1">No share links yet</p>
          <p className="text-sm text-[#6B6056]">Create a link and send it to your wholesale customers — 0% commission on all orders.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link: any) => (
            <div key={link.id} className="bg-white rounded-xl border border-[#E8E0D8] shadow-warm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-[#1A1A1A]">{link.slug ?? link.token.slice(0, 16) + "…"}</p>
                    <span className="text-xs text-[#6B6056] bg-[#F5EDE6] px-2 py-0.5 rounded-full">{link.target}</span>
                    {!link.isActive && <span className="text-xs text-[#C0392B] bg-[#FEF2F2] px-2 py-0.5 rounded-full">Inactive</span>}
                  </div>
                  {link.customMessage && <p className="text-xs text-[#6B6056] mb-2">"{link.customMessage}"</p>}
                  <div className="flex flex-wrap gap-4 text-sm text-[#6B6056]">
                    <span><b className="text-[#1A1A1A]">{link.viewCount}</b> views</span>
                    <span><b className="text-[#1A1A1A]">{link.signupCount}</b> signups</span>
                    <span><b className="text-[#1A1A1A]">{link.orderCount}</b> orders</span>
                    <span className="text-[#2D6A4F]">₹<b>{Number(link.commissionSavedInr).toFixed(0)}</b> saved</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => copyLink(link.token, link.slug)} className="h-8 w-8 rounded-lg border border-[#E8E0D8] flex items-center justify-center text-[#6B6056] hover:border-[#C8956C] hover:text-[#C8956C] transition-colors" title="Copy link">
                    <Copy className="h-4 w-4" />
                  </button>
                  <a href={`https://wa.me/?text=${encodeURIComponent(`${window.location.origin}/share-links/${link.slug ?? link.token}`)}`} target="_blank" rel="noopener noreferrer"
                    className="h-8 w-8 rounded-lg border border-[#E8E0D8] flex items-center justify-center text-[#6B6056] hover:border-[#25D366] hover:text-[#25D366] transition-colors" title="Share on WhatsApp">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button onClick={() => toggleMutation.mutate({ id: link.id, isActive: !link.isActive })}
                    className="text-[#6B6056] hover:text-[#C8956C]" title={link.isActive ? "Deactivate" : "Activate"}>
                    {link.isActive ? <ToggleRight className="h-5 w-5 text-[#2D6A4F]" /> : <ToggleLeft className="h-5 w-5" />}
                  </button>
                  <button onClick={() => { if (confirm("Delete this link?")) deleteMutation.mutate(link.id); }}
                    className="text-[#6B6056] hover:text-[#C0392B]"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
const inp = "w-full h-10 px-3 rounded-lg border border-[#E8E0D8] bg-[#FAFAF8] text-sm focus:outline-none focus:border-[#C8956C] focus:bg-white transition-colors";
