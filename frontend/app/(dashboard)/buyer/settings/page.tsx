"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useCurrencyStore } from "@/lib/stores/currencyStore";
import { useCategoriesFlat } from "@/lib/hooks/useCategories";

const STORE_TYPES = ["boutique", "gift_shop", "subscription_box", "online_store", "pop_up", "other"];
const AESTHETICS  = ["artisan", "minimalist", "bohemian", "luxury", "contemporary", "eclectic"];
const CURRENCIES  = ["USD", "GBP", "EUR", "AUD", "CAD", "SGD", "AED", "INR", "JPY", "CHF", "NZD", "SEK", "NOK"];
const COUNTRIES   = [["US","United States"],["GB","United Kingdom"],["AU","Australia"],["CA","Canada"],["DE","Germany"],["FR","France"],["SG","Singapore"],["AE","UAE"],["IN","India"],["NZ","New Zealand"]];

export default function BuyerSettingsPage() {
  const qc = useQueryClient();
  const { currency, setCurrency } = useCurrencyStore();
  const { data: categories = [] } = useCategoriesFlat();
  const [form, setForm] = useState<Record<string, any>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["buyer-settings"],
    queryFn: async () => {
      const { data } = await api.get("/buyer/dashboard");
      return data.data.profile;
    },
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const profileMutation = useMutation({
    mutationFn: () => api.patch("/buyer/cart", {}), // placeholder — buyer profile update via auth endpoint
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["buyer-settings"] }); toast.success("Settings saved"); },
    onError: () => toast.error("Failed to save"),
  });

  const quizMutation = useMutation({
    mutationFn: () => api.post("/auth/store-quiz", {
      storeType: form.storeType,
      aesthetic: form.aesthetic,
      categoryInterests: form.categoryInterests?.length ? form.categoryInterests : ["textiles"],
    }),
    onSuccess: () => toast.success("Preferences saved"),
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Failed"),
  });

  const toggleCategory = (cat: string) => {
    const current = form.categoryInterests ?? [];
    setForm({
      ...form,
      categoryInterests: current.includes(cat)
        ? current.filter((c: string) => c !== cat)
        : [...current, cat],
    });
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#A68B67]" /></div>;

  return (
    <div className="max-w-xl space-y-8">
      <h1 className="font-heading text-2xl font-bold text-[#1A1A1A]">Settings</h1>

      {/* Currency preference */}
      <Section title="Display currency">
        <p className="text-sm text-[#444748] -mt-2">Prices across the platform will show in this currency.</p>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {CURRENCIES.map((c) => (
            <button key={c} onClick={() => setCurrency(c)}
              className={`h-9 rounded-lg border text-xs font-medium transition-all ${currency === c ? "bg-[#1A1A1A] border-[#A68B67] text-white" : "border-[#E5E1D8] text-[#444748] hover:border-[#A68B67] bg-white"}`}>
              {c}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#444748]">Currently showing: <span className="font-semibold text-[#1A1A1A]">{currency}</span></p>
      </Section>

      {/* Store type quiz */}
      <Section title="Store preferences">
        <p className="text-sm text-[#444748] -mt-2">We use these to personalise your product feed.</p>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#1A1A1A]">Store type</label>
          <div className="flex flex-wrap gap-2">
            {STORE_TYPES.map((t) => (
              <button key={t} onClick={() => setForm({ ...form, storeType: form.storeType === t ? "" : t })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.storeType === t ? "bg-[#1A1A1A] border-[#A68B67] text-white" : "border-[#E5E1D8] text-[#444748] hover:border-[#A68B67] bg-white"}`}>
                {t.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#1A1A1A]">Aesthetic</label>
          <div className="flex flex-wrap gap-2">
            {AESTHETICS.map((a) => (
              <button key={a} onClick={() => setForm({ ...form, aesthetic: form.aesthetic === a ? "" : a })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.aesthetic === a ? "bg-[#1A1A1A] border-[#A68B67] text-white" : "border-[#E5E1D8] text-[#444748] hover:border-[#A68B67] bg-white"}`}>
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#1A1A1A]">Product interests</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const selected = (form.categoryInterests ?? []).includes(cat.name);
              return (
                <button key={cat.slug} onClick={() => toggleCategory(cat.name)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selected ? "bg-[#1A1A1A] border-[#A68B67] text-white" : "border-[#E5E1D8] text-[#444748] hover:border-[#A68B67] bg-white"}`}>
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={() => quizMutation.mutate()} disabled={quizMutation.isPending}
          className="h-10 px-5 rounded-lg bg-[#1A1A1A] hover:bg-[#8B7055] text-white text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-60">
          {quizMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save preferences
        </button>
      </Section>

      {/* Account info (read-only) */}
      <Section title="Account">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ["Business name", form.businessName],
            ["Country",       form.countryCode],
            ["Phone",         form.phone ?? "Not set"],
            ["Verified",      form.businessVerified ? "Yes" : "Pending first order"],
          ].map(([k, v]) => (
            <div key={k} className="bg-[#F9F7F2] rounded-lg p-3 border border-[#E5E1D8]">
              <p className="text-xs text-[#444748]">{k}</p>
              <p className="font-medium text-[#1A1A1A] mt-0.5">{v ?? "—"}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#444748]">To update email or password, contact support.</p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-[#E5E1D8] shadow-warm p-6 space-y-4">
      <h2 className="font-heading text-base font-semibold text-[#1A1A1A] pb-3 border-b border-[#E5E1D8]">{title}</h2>
      {children}
    </div>
  );
}