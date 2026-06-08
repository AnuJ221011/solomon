const ITEMS = [
  "✦  500+ verified brands",
  "✦  40+ countries reached",
  "✦  Opening order protection — 30-day returns",
  "✦  0% commission via your share link",
  "✦  42 display currencies",
  "✦  All brands admin-approved",
  "✦  Ships from India worldwide",
  "✦  INR payouts for brands",
  "✦  Wholesale prices direct from makers",
  "✦  Free to join as a retailer",
];

export function TrustStrip() {
  // Double the items so the marquee loops seamlessly
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div className="bg-[#1A1A1A] border-y border-[#2D2D2D] py-3 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap gap-0">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-3 px-8 text-sm font-medium text-[#C8956C]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
