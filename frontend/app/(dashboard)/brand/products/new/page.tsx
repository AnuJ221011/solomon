"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Loader2, ArrowLeft, ArrowRight, Upload } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const STEPS = ["Photos", "Details", "Pricing & Terms", "Preview"];
const ZONES = ["DOMESTIC", "SOUTH_ASIA", "SOUTHEAST_ASIA", "MIDDLE_EAST", "EUROPE", "NORTH_AMERICA", "OCEANIA"];
const CATEGORIES = ["Textiles", "Home Décor", "Jewellery", "Accessories", "Stationery", "Apparel", "Food & Wellness", "Art & Craft"];

export default function NewProductPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<File[]>([]);
  const [form, setForm] = useState({
    name: "", shortDescription: "", fullDescription: "",
    wholesalePriceInr: "", msrpInr: "", moq: "", weightGrams: "",
    hsTariffCode: "", leadTime: "ONE_TO_TWO_WEEKS",
    categories: [] as string[], tags: "", enabledZones: [] as string[],
  });
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/products", {
        ...form,
        wholesalePriceInr: Number(form.wholesalePriceInr),
        msrpInr: form.msrpInr ? Number(form.msrpInr) : undefined,
        moq: Number(form.moq),
        weightGrams: Number(form.weightGrams),
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        countryOfOrigin: "IN",
      });
      return data.data;
    },
    onSuccess: async (product) => {
      setCreatedProductId(product.id);
      // Upload photos if any
      if (photos.length > 0) {
        const fd = new FormData();
        photos.forEach((f) => fd.append("photos", f));
        await api.post(`/photos/product/${product.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        }).catch(() => {});
      }
      toast.success("Product created!");
      router.push("/brand/products");
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Failed to create product"),
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const toggleArr = (k: "categories" | "enabledZones", v: string) =>
    set(k, form[k].includes(v) ? form[k].filter((x) => x !== v) : [...form[k], v]);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-[#6B6056] hover:text-[#1A1A1A]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-heading text-2xl font-bold text-[#1A1A1A]">Add product</h1>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? "bg-[#C8956C]" : "bg-[#E8E0D8]"}`} />
        ))}
      </div>
      <p className="text-sm font-medium text-[#C8956C]">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>

      <div className="bg-white rounded-xl border border-[#E8E0D8] shadow-warm p-6 space-y-4">
        {/* Step 0 — Photos */}
        {step === 0 && (
          <>
            <p className="text-sm text-[#6B6056]">Upload up to 8 photos. First image is the cover.</p>
            <label className="block border-2 border-dashed border-[#E8E0D8] rounded-xl p-8 text-center cursor-pointer hover:border-[#C8956C] transition-colors">
              <Upload className="h-8 w-8 text-[#E8E0D8] mx-auto mb-2" />
              <p className="text-sm text-[#6B6056]">Click to upload photos</p>
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => setPhotos(Array.from(e.target.files ?? []).slice(0, 8))} />
            </label>
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {photos.map((f, i) => (
                  <div key={i} className="h-16 w-16 rounded-lg bg-[#F5EDE6] border border-[#E8E0D8] overflow-hidden relative">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                <p className="w-full text-xs text-[#6B6056]">{photos.length} photo(s) selected</p>
              </div>
            )}
          </>
        )}

        {/* Step 1 — Details */}
        {step === 1 && (
          <>
            <Field label="Product name *">
              <input value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={80}
                placeholder="Hand-woven Silk Scarf" className={inp} />
            </Field>
            <Field label="Short description * (160 chars)">
              <textarea value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} maxLength={160}
                rows={2} placeholder="Artisan scarf from Varanasi…" className={inp + " resize-none"} />
            </Field>
            <Field label="Full description (optional)">
              <textarea value={form.fullDescription} onChange={(e) => set("fullDescription", e.target.value)}
                rows={4} placeholder="Detailed description…" className={inp + " resize-none"} />
            </Field>
            <Field label="Categories *">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c} type="button" onClick={() => toggleArr("categories", c)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${form.categories.includes(c) ? "bg-[#C8956C] border-[#C8956C] text-white" : "border-[#E8E0D8] text-[#6B6056] hover:border-[#C8956C]"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Tags (comma-separated)">
              <input value={form.tags} onChange={(e) => set("tags", e.target.value)}
                placeholder="silk, varanasi, handwoven" className={inp} />
            </Field>
          </>
        )}

        {/* Step 2 — Pricing */}
        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Wholesale price (₹) *">
                <input type="number" value={form.wholesalePriceInr} onChange={(e) => set("wholesalePriceInr", e.target.value)}
                  placeholder="1200" className={inp} />
              </Field>
              <Field label="MSRP (₹) optional">
                <input type="number" value={form.msrpInr} onChange={(e) => set("msrpInr", e.target.value)}
                  placeholder="2500" className={inp} />
              </Field>
              <Field label="MOQ *">
                <input type="number" value={form.moq} onChange={(e) => set("moq", e.target.value)}
                  placeholder="10" className={inp} />
              </Field>
              <Field label="Weight (grams) *">
                <input type="number" value={form.weightGrams} onChange={(e) => set("weightGrams", e.target.value)}
                  placeholder="150" className={inp} />
              </Field>
            </div>
            <Field label="Lead time *">
              <select value={form.leadTime} onChange={(e) => set("leadTime", e.target.value)} className={inp + " cursor-pointer"}>
                <option value="ONE_TO_THREE_DAYS">1–3 days</option>
                <option value="ONE_TO_TWO_WEEKS">1–2 weeks</option>
                <option value="TWO_TO_FOUR_WEEKS">2–4 weeks</option>
              </select>
            </Field>
            <Field label="HS / Tariff code (optional)">
              <input value={form.hsTariffCode} onChange={(e) => set("hsTariffCode", e.target.value)}
                placeholder="6214.10" className={inp} />
            </Field>
            <Field label="Shipping zones * (select all that apply)">
              <div className="flex flex-wrap gap-2">
                {ZONES.map((z) => (
                  <button key={z} type="button" onClick={() => toggleArr("enabledZones", z)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${form.enabledZones.includes(z) ? "bg-[#C8956C] border-[#C8956C] text-white" : "border-[#E8E0D8] text-[#6B6056] hover:border-[#C8956C]"}`}>
                    {z.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </Field>
          </>
        )}

        {/* Step 3 — Preview */}
        {step === 3 && (
          <div className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-[#1A1A1A]">Review before publishing</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ["Name", form.name],
                ["Price", `₹${form.wholesalePriceInr}`],
                ["MOQ", form.moq],
                ["Weight", `${form.weightGrams}g`],
                ["Lead time", form.leadTime.replace(/_/g, " ")],
                ["Categories", form.categories.join(", ")],
                ["Zones", form.enabledZones.length + " zones"],
                ["Photos", photos.length + " selected"],
              ].map(([k, v]) => (
                <div key={k} className="bg-[#FAFAF8] rounded-lg p-3">
                  <p className="text-xs text-[#6B6056]">{k}</p>
                  <p className="font-medium text-[#1A1A1A] mt-0.5">{v || "—"}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)}
            className="flex-1 h-11 rounded-lg border border-[#E8E0D8] text-sm font-medium text-[#6B6056] flex items-center justify-center gap-1 hover:bg-[#FAFAF8]">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}
        {step < 3 ? (
          <button onClick={() => setStep((s) => s + 1)}
            disabled={step === 0 && photos.length === 0}
            className="flex-1 h-11 rounded-lg bg-[#C8956C] hover:bg-[#B07D57] text-white text-sm font-medium flex items-center justify-center gap-1 transition-colors disabled:opacity-50">
            Next <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
            className="flex-1 h-11 rounded-lg bg-[#2D6A4F] hover:bg-[#245c42] text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
            {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Publish product
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[#1A1A1A]">{label}</label>
      {children}
    </div>
  );
}
const inp = "w-full h-10 px-3 rounded-lg border border-[#E8E0D8] bg-[#FAFAF8] text-sm text-[#1A1A1A] placeholder:text-[#6B6056] focus:outline-none focus:border-[#C8956C] focus:bg-white transition-colors";
