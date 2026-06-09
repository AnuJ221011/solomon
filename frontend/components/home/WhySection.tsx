const REASONS = [
  {
    icon: "🏺",
    title: "Authentic artisan goods",
    description:
      "Every brand is approved by our team. Direct from the makers — no middlemen.",
  },
  {
    icon: "🌍",
    title: "Ship to 40+ countries",
    description:
      "Verified international shipping from India. Prices shown in your currency.",
  },
  {
    icon: "🔗",
    title: "0% commission via your link",
    description:
      "Share your brand's catalogue link. Every order through it earns you zero commission.",
  },
  {
    icon: "📦",
    title: "Opening order protection",
    description:
      "Your first order from any brand has a 30-day return window. We absorb the risk.",
  },
];

export function WhySection() {
  return (
    <section className="py-16 bg-white border-y border-[#E5E1D8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl font-bold text-[#1A1A1A]">
            Why Solomon Bharat
          </h2>
          <p className="mt-2 text-sm text-[#444748] max-w-md mx-auto">
            Built for independent retailers and Indian artisan brands who want
            to trade internationally without the friction.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {REASONS.map((r) => (
            <div
              key={r.title}
              className="p-6 rounded-lg bg-[#F9F7F2] border border-[#E5E1D8] hover:border-[#A68B67] hover:bg-white transition-all"
            >
              <span className="text-3xl">{r.icon}</span>
              <h3 className="mt-3 font-heading text-base font-semibold text-[#1A1A1A]">
                {r.title}
              </h3>
              <p className="mt-1.5 text-sm text-[#444748] leading-relaxed">
                {r.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}