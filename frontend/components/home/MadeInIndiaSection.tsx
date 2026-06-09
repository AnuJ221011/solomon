import { LinkButton } from "@/components/ui/link-button";

const IMPACT_STATS = [
  { value: "7M+",  label: "Artisan businesses in India" },
  { value: "<2%",  label: "Reach international buyers" },
  { value: "₹0",   label: "Cost to list on Solomon Bharat" },
];

export function MadeInIndiaSection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 80% 50%, rgba(200,149,108,0.12) 0%, transparent 60%),
            linear-gradient(135deg, #1A0A02 0%, #2D1409 40%, #1C0D03 100%)
          `,
        }}
      />

      {/* Decorative border top */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(200,149,108,0.4), transparent)" }} />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

          {/* Left — text */}
          <div>
            <p className="text-xs font-semibold text-[#A68B67] uppercase tracking-widest mb-4">
              The story behind the platform
            </p>
            <h2 className="font-heading text-4xl lg:text-5xl font-bold text-white leading-tight text-balance">
              From the looms of Varanasi{" "}
              <span className="italic"
                style={{ background: "linear-gradient(90deg,#A68B67,#E8B98A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                to the shelves of London boutiques.
              </span>
            </h2>
            <p className="mt-6 text-base text-white/60 leading-relaxed max-w-lg">
              India has over 7 million artisan businesses producing some of the world's most unique handcrafted goods.
              Less than 2% of them reach international buyers.
              We built Solomon Bharat to fix that — a direct bridge between India's makers and the world's retailers.
            </p>
            <p className="mt-4 text-base text-white/60 leading-relaxed max-w-lg">
              No middlemen. No markups. Just verified brands, transparent wholesale pricing,
              and a share link that earns you 0% commission.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <LinkButton href="/about" size="lg" variant="copper" className="shadow-none">
                How it works →
              </LinkButton>
              <LinkButton href="/brands" size="lg" variant="dark" className="border-white/20 text-white/80 hover:border-[#A68B67]">
                Meet our brands
              </LinkButton>
            </div>
          </div>

          {/* Right — impact stats */}
          <div className="grid grid-cols-1 gap-4">
            {IMPACT_STATS.map((stat, i) => (
              <div
                key={stat.label}
                className="flex items-center gap-6 p-6 rounded-lg border"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(200,149,108,0.20)",
                }}
              >
                <div
                  className="font-heading text-5xl font-bold shrink-0 w-28 text-right"
                  style={{
                    background: "linear-gradient(90deg,#A68B67,#E8B98A)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {stat.value}
                </div>
                <div className="h-10 w-px shrink-0" style={{ background: "rgba(200,149,108,0.3)" }} />
                <p className="text-white/65 text-base leading-snug">{stat.label}</p>
              </div>
            ))}

            {/* Quote */}
            <div
              className="p-6 rounded-lg border mt-2"
              style={{ background: "rgba(200,149,108,0.08)", borderColor: "rgba(200,149,108,0.25)" }}
            >
              <p className="text-[#DDD0BA] text-sm italic leading-relaxed">
                "Discovery is public, commerce is gated. Browse freely — a free account is only needed when you're ready to place an order."
              </p>
              <p className="text-[#A68B67] text-xs font-semibold mt-3 uppercase tracking-wider">
                — Core principle
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative border bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(200,149,108,0.4), transparent)" }} />
    </section>
  );
}