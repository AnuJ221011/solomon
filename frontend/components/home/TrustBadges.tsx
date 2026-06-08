const BADGES = [
  {
    icon: "🛡️",
    title: "30-day opening order returns",
    body: "Your first order from any brand has a 30-day free return window. We absorb the cost — zero risk to you.",
    accent: "#2D6A4F",
    bg: "#E8F5EE",
    border: "#B7DFC7",
  },
  {
    icon: "💱",
    title: "42 display currencies",
    body: "See wholesale prices in your local currency. USD, GBP, EUR, AED, SGD and 37 more — updated every 6 hours.",
    accent: "#C8956C",
    bg: "#F5EDE6",
    border: "#E8C4A2",
  },
  {
    icon: "✅",
    title: "All brands admin-verified",
    body: "Every brand is reviewed by our team before they can list. GST/business registration required for payout.",
    accent: "#1E3A5F",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  {
    icon: "📦",
    title: "Ships from India worldwide",
    body: "Brands ship directly to your address in 40+ countries. Estimated delivery shown per zone at checkout.",
    accent: "#6D28D9",
    bg: "#F5F3FF",
    border: "#DDD6FE",
  },
];

export function TrustBadges() {
  return (
    <section className="py-14 bg-[#FAFAF8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-[#C8956C] uppercase tracking-widest mb-2">
            Built for international retailers
          </p>
          <h2 className="font-heading text-3xl font-bold text-[#1A1A1A]">
            Order with confidence
          </h2>
          <p className="mt-2 text-sm text-[#6B6056] max-w-md mx-auto">
            We've eliminated the biggest friction points in international wholesale purchasing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {BADGES.map((badge) => (
            <div
              key={badge.title}
              className="group flex flex-col p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-warm-md bg-white"
              style={{ borderColor: badge.border }}
            >
              {/* Icon */}
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                style={{ background: badge.bg }}
              >
                {badge.icon}
              </div>

              <h3
                className="font-heading text-base font-semibold leading-snug mb-2"
                style={{ color: badge.accent }}
              >
                {badge.title}
              </h3>
              <p className="text-sm text-[#6B6056] leading-relaxed">{badge.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
