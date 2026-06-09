import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/link-button";

export const metadata: Metadata = { title: "How it works" };

const BUYER_STEPS = [
  { n: "01", title: "Browse freely", body: "No account needed. See wholesale prices, product details, and brand stories before signing up." },
  { n: "02", title: "Create a free account", body: "Sign up in under 3 minutes. Provide your business name and country. No approval required for buyers." },
  { n: "03", title: "Add to cart & checkout", body: "Multi-brand cart. See prices in your local currency. Shipping calculated at checkout." },
  { n: "04", title: "Opening order protection", body: "Your first order from any brand gets a 30-day return window. We absorb the cost if you're not satisfied." },
];

const BRAND_STEPS = [
  { n: "01", title: "Apply in minutes", body: "Submit your brand name, Instagram, category, and a short story. Our team reviews within 24–48 hours." },
  { n: "02", title: "List your products", body: "5-step listing flow. Upload photos, set wholesale prices in INR, define MOQ and lead time." },
  { n: "03", title: "Share your catalogue link", body: "Every brand gets a shareable link. Orders via your link pay 0% commission. Marketplace orders pay the standard rate." },
  { n: "04", title: "Get paid in INR", body: "Standard payout: 30 days after dispatch. Express payout: next business day for a 2.5% fee." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 space-y-20">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-sm font-medium text-[#A68B67] uppercase tracking-widest mb-3">How it works</p>
        <h1 className="font-heading text-5xl font-bold text-[#1A1A1A] leading-tight">
          India's B2B wholesale marketplace for the world.
        </h1>
        <p className="mt-4 text-lg text-[#444748] leading-relaxed">
          Discovery is public. Commerce is gated. Browse freely — create an account exactly when you're ready to order.
        </p>
      </div>

      {/* For buyers */}
      <div>
        <h2 className="font-heading text-3xl font-bold text-[#1A1A1A] mb-2">For international retailers</h2>
        <p className="text-[#444748] mb-8">Independent boutiques, gift shops, subscription boxes, and online stores.</p>
        <div className="grid sm:grid-cols-2 gap-6">
          {BUYER_STEPS.map((s) => (
            <div key={s.n} className="flex gap-4 p-5 bg-white rounded-lg border border-[#E5E1D8] shadow-warm hover:border-[#A68B67] transition-all">
              <span className="font-heading text-2xl font-bold text-[#E5E1D8] shrink-0">{s.n}</span>
              <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-1">{s.title}</h3>
                <p className="text-sm text-[#444748] leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <LinkButton href="/signup" variant="default" size="lg">Start browsing free</LinkButton>
        </div>
      </div>

      {/* For brands */}
      <div className="pt-8 border-t border-[#E5E1D8]">
        <h2 className="font-heading text-3xl font-bold text-[#1A1A1A] mb-2">For Indian artisan brands</h2>
        <p className="text-[#444748] mb-8">Reach international retailers without a dedicated sales team.</p>
        <div className="grid sm:grid-cols-2 gap-6">
          {BRAND_STEPS.map((s) => (
            <div key={s.n} className="flex gap-4 p-5 bg-white rounded-lg border border-[#E5E1D8] shadow-warm hover:border-[#A68B67] transition-all">
              <span className="font-heading text-2xl font-bold text-[#E5E1D8] shrink-0">{s.n}</span>
              <div>
                <h3 className="font-semibold text-[#1A1A1A] mb-1">{s.title}</h3>
                <p className="text-sm text-[#444748] leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <LinkButton href="/signup?role=brand" variant="default" size="lg">Apply as a brand</LinkButton>
        </div>
      </div>

      {/* Commission table */}
      <div className="bg-[#1A1A1A] rounded-lg p-8 text-white">
        <h2 className="font-heading text-2xl font-bold mb-6">Commission structure</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#444748] border-b border-[#2D2D2D]">
                <th className="text-left pb-3 font-medium">Scenario</th>
                <th className="text-right pb-3 font-medium">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D2D2D]">
              {[
                ["Order via your Share Link (30-day window)", "0%", true],
                ["Manual order via Invoicing tab", "0%", true],
                ["New buyer via marketplace (Sprout)", "15%", false],
                ["Rising brand", "14%", false],
                ["Trusted brand", "14%", false],
                ["Elite brand", "12%", false],
                ["Legend brand", "10%", false],
              ].map(([scenario, rate, highlight]) => (
                <tr key={String(scenario)}>
                  <td className="py-3 text-[#E5E1D8]">{scenario}</td>
                  <td className={`py-3 text-right font-semibold ${highlight ? "text-[#A68B67]" : "text-white"}`}>{rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}