"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Link2, Package, RefreshCw, Unlink, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

const SHIPPING_ZONES = ["DOMESTIC","SOUTH_ASIA","SOUTHEAST_ASIA","MIDDLE_EAST","EUROPE","NORTH_AMERICA","OCEANIA"];

export default function BrandSettingsPage() {
  const qc = useQueryClient();
  const [profile, setProfile] = useState<Record<string, any>>({});
  const [shippingRates, setShippingRates] = useState<Record<string, any>>({});
  const [shopifyForm, setShopifyForm] = useState({ shopDomain: "", accessToken: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["brand-profile-settings"],
    queryFn: async () => {
      const [p, s, sh] = await Promise.all([
        api.get("/brands/me/profile"),
        api.get("/shipping"),
        api.get("/shopify/store").catch(() => ({ data: { data: null } })),
      ]);
      return { profile: p.data.data, rates: s.data.data, shopify: sh.data.data };
    },
  });

  const shopifyStore = data?.shopify;

  const connectShopifyMutation = useMutation({
    mutationFn: () => api.post("/shopify/store/connect", {
      shopDomain: shopifyForm.shopDomain.replace(/^https?:\/\//, ""),
      accessToken: shopifyForm.accessToken,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brand-profile-settings"] });
      toast.success("Shopify store connected!");
      setShopifyForm({ shopDomain: "", accessToken: "" });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Connection failed — check your credentials"),
  });

  const disconnectShopifyMutation = useMutation({
    mutationFn: () => api.delete("/shopify/store/disconnect"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["brand-profile-settings"] }); toast.success("Store disconnected"); },
    onError: () => toast.error("Disconnect failed"),
  });

  const importShopifyMutation = useMutation({
    mutationFn: () => api.post("/shopify/import-products"),
    onSuccess: (res: any) => {
      const { imported, skipped } = res.data.data;
      toast.success(`Import complete: ${imported} products imported, ${skipped} skipped`);
      qc.invalidateQueries({ queryKey: ["brand-products"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Import failed"),
  });

  useEffect(() => {
    if (data?.profile) setProfile(data.profile);
    if (data?.rates) {
      const r: Record<string, any> = {};
      data.rates.forEach((rate: any) => { r[rate.zone] = rate; });
      setShippingRates(r);
    }
  }, [data]);

  const profileMutation = useMutation({
    mutationFn: () => api.patch("/brands/me/profile", {
      brandName: profile.brandName, description: profile.description,
      brandStory: profile.brandStory, instagramHandle: profile.instagramHandle,
      websiteUrl: profile.websiteUrl, yearFounded: profile.yearFounded ? Number(profile.yearFounded) : undefined,
      payoutSpeed: profile.payoutSpeed, pickupPincode: profile.pickupPincode,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["brand-profile-settings"] }); toast.success("Profile updated"); },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Update failed"),
  });

  const shippingMutation = useMutation({
    mutationFn: (zone: string) => api.put("/shipping/zone", {
      zone,
      rateType: shippingRates[zone]?.rateType ?? "FLAT",
      flatRateInr: shippingRates[zone]?.flatRateInr ? Number(shippingRates[zone].flatRateInr) : undefined,
      perKgRateInr: shippingRates[zone]?.perKgRateInr ? Number(shippingRates[zone].perKgRateInr) : undefined,
      freeShippingAboveInr: shippingRates[zone]?.freeShippingAboveInr ? Number(shippingRates[zone].freeShippingAboveInr) : undefined,
    }),
    onSuccess: () => toast.success("Shipping rate saved"),
    onError: () => toast.error("Failed to save"),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#C8956C]" /></div>;

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="font-heading text-2xl font-bold text-[#1A1A1A]">Settings</h1>

      {/* Profile */}
      <Section title="Brand profile">
        <Field label="Brand name">
          <input value={profile.brandName ?? ""} onChange={(e) => setProfile({ ...profile, brandName: e.target.value })} className={inp} />
        </Field>
        <Field label="Description">
          <textarea value={profile.description ?? ""} onChange={(e) => setProfile({ ...profile, description: e.target.value })}
            rows={3} className={inp + " resize-none"} />
        </Field>
        <Field label="Brand story">
          <textarea value={profile.brandStory ?? ""} onChange={(e) => setProfile({ ...profile, brandStory: e.target.value })}
            rows={4} className={inp + " resize-none"} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Instagram handle">
            <input value={profile.instagramHandle ?? ""} onChange={(e) => setProfile({ ...profile, instagramHandle: e.target.value })}
              placeholder="@yourbrand" className={inp} />
          </Field>
          <Field label="Year founded">
            <input type="number" value={profile.yearFounded ?? ""} onChange={(e) => setProfile({ ...profile, yearFounded: e.target.value })}
              placeholder="2018" className={inp} />
          </Field>
          <Field label="Website URL">
            <input value={profile.websiteUrl ?? ""} onChange={(e) => setProfile({ ...profile, websiteUrl: e.target.value })}
              placeholder="https://yourbrand.com" className={inp} />
          </Field>
          <Field label="Pickup pincode (for Shiprocket)">
            <input value={profile.pickupPincode ?? ""} onChange={(e) => setProfile({ ...profile, pickupPincode: e.target.value })}
              placeholder="110001" className={inp} />
          </Field>
        </div>
        <Field label="Payout speed">
          <select value={profile.payoutSpeed ?? "NET_30"} onChange={(e) => setProfile({ ...profile, payoutSpeed: e.target.value })}
            className={inp + " cursor-pointer"}>
            <option value="NET_30">Standard — Net 30 (free)</option>
            <option value="EXPRESS">Express — Next day (2.5% fee)</option>
          </select>
        </Field>
        <button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}
          className="h-10 px-5 rounded-lg bg-[#C8956C] hover:bg-[#B07D57] text-white text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-60">
          {profileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save profile
        </button>
      </Section>

      {/* Shopify Integration */}
      <Section title="Shopify Integration">
        <p className="text-sm text-[#6B6056] -mt-2">
          Connect your Shopify store to sync products and push orders automatically.
        </p>

        {shopifyStore ? (
          /* ── Connected state ── */
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#E8F5EE] border border-[#B7DFC7]">
              <CheckCircle2 className="h-5 w-5 text-[#2D6A4F] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A1A1A]">Connected to {shopifyStore.shopDomain}</p>
                {shopifyStore.lastSyncAt && (
                  <p className="text-xs text-[#6B6056] mt-0.5">
                    Last synced: {new Date(shopifyStore.lastSyncAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => importShopifyMutation.mutate()}
                disabled={importShopifyMutation.isPending}
                className="h-10 rounded-lg bg-[#C8956C] hover:bg-[#B07D57] text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {importShopifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Import products from Shopify
              </button>
              <button
                onClick={() => { if (confirm("Disconnect your Shopify store?")) disconnectShopifyMutation.mutate(); }}
                disabled={disconnectShopifyMutation.isPending}
                className="h-10 rounded-lg border border-[#E8E0D8] text-sm font-medium text-[#C0392B] hover:bg-[#FEF2F2] hover:border-[#C0392B] flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {disconnectShopifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
                Disconnect
              </button>
            </div>

            <div className="p-3 rounded-lg bg-[#FAFAF8] border border-[#E8E0D8] text-xs text-[#6B6056] space-y-1">
              <p>✦ <span className="font-medium text-[#1A1A1A]">Products:</span> Imported products appear in your listings for you to review and price.</p>
              <p>✦ <span className="font-medium text-[#1A1A1A]">Orders:</span> When you mark an order as dispatched, it's automatically pushed to Shopify.</p>
              <p>✦ <span className="font-medium text-[#1A1A1A]">Webhooks:</span> Product updates on Shopify sync back automatically via webhook.</p>
            </div>
          </div>
        ) : (
          /* ── Connect form ── */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#F5EDE6] border border-[#E8C4A2] text-sm text-[#6B6056]">
              <p className="font-medium text-[#1A1A1A] mb-1">How to get your access token</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>In Shopify Admin → go to <span className="font-medium">Apps → Develop apps</span></li>
                <li>Create a new app → enable Admin API access</li>
                <li>Grant permissions: <code className="bg-[#E8E0D8] px-1 rounded">read_products</code>, <code className="bg-[#E8E0D8] px-1 rounded">write_orders</code></li>
                <li>Install the app → copy the Admin API access token</li>
              </ol>
            </div>

            <Field label="Shopify store domain">
              <input
                value={shopifyForm.shopDomain}
                onChange={(e) => setShopifyForm({ ...shopifyForm, shopDomain: e.target.value })}
                placeholder="mybrand.myshopify.com"
                className={inp}
              />
            </Field>
            <Field label="Admin API access token">
              <input
                type="password"
                value={shopifyForm.accessToken}
                onChange={(e) => setShopifyForm({ ...shopifyForm, accessToken: e.target.value })}
                placeholder="shppa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className={inp}
              />
            </Field>
            <button
              onClick={() => connectShopifyMutation.mutate()}
              disabled={!shopifyForm.shopDomain || !shopifyForm.accessToken || connectShopifyMutation.isPending}
              className="h-10 px-5 rounded-lg bg-[#C8956C] hover:bg-[#B07D57] text-white text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-60"
            >
              {connectShopifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Connect Shopify store
            </button>
          </div>
        )}
      </Section>

      {/* Shipping rates */}
      <Section title="Shipping rates">
        <p className="text-sm text-[#6B6056] -mt-2">Set the shipping rate you charge buyers per zone.</p>
        {SHIPPING_ZONES.map((zone) => {
          const r = shippingRates[zone] ?? { rateType: "FLAT" };
          return (
            <div key={zone} className="border border-[#E8E0D8] rounded-xl p-4 space-y-3">
              <p className="font-medium text-sm text-[#1A1A1A]">{zone.replace(/_/g, " ")}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-[#6B6056]">Rate type</label>
                  <select value={r.rateType ?? "FLAT"}
                    onChange={(e) => setShippingRates({ ...shippingRates, [zone]: { ...r, rateType: e.target.value } })}
                    className={inp + " h-9 text-xs cursor-pointer"}>
                    <option value="FLAT">Flat rate</option>
                    <option value="PER_KG">Per kg</option>
                  </select>
                </div>
                {r.rateType === "FLAT" || !r.rateType ? (
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#6B6056]">Flat rate (₹)</label>
                    <input type="number" value={r.flatRateInr ?? ""}
                      onChange={(e) => setShippingRates({ ...shippingRates, [zone]: { ...r, flatRateInr: e.target.value } })}
                      placeholder="850" className={inp + " h-9 text-xs"} />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#6B6056]">Per kg (₹)</label>
                    <input type="number" value={r.perKgRateInr ?? ""}
                      onChange={(e) => setShippingRates({ ...shippingRates, [zone]: { ...r, perKgRateInr: e.target.value } })}
                      placeholder="200" className={inp + " h-9 text-xs"} />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs text-[#6B6056]">Free above (₹, optional)</label>
                  <input type="number" value={r.freeShippingAboveInr ?? ""}
                    onChange={(e) => setShippingRates({ ...shippingRates, [zone]: { ...r, freeShippingAboveInr: e.target.value } })}
                    placeholder="15000" className={inp + " h-9 text-xs"} />
                </div>
                <div className="flex items-end">
                  <button onClick={() => shippingMutation.mutate(zone)} disabled={shippingMutation.isPending}
                    className="h-9 px-3 rounded-lg bg-[#C8956C] hover:bg-[#B07D57] text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-60">
                    <Save className="h-3.5 w-3.5" /> Save
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E0D8] shadow-warm p-6 space-y-4">
      <h2 className="font-heading text-base font-semibold text-[#1A1A1A] pb-3 border-b border-[#E8E0D8]">{title}</h2>
      {children}
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
