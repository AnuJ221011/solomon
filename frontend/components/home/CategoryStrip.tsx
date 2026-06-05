import Link from "next/link";

const CATEGORIES = [
  { label: "Textiles", emoji: "🧵", href: "/shop?category=Textiles" },
  { label: "Home Décor", emoji: "🏺", href: "/shop?category=Home+Decor" },
  { label: "Jewellery", emoji: "💍", href: "/shop?category=Jewellery" },
  { label: "Stationery", emoji: "📓", href: "/shop?category=Stationery" },
  { label: "Accessories", emoji: "👜", href: "/shop?category=Accessories" },
  { label: "Food & Wellness", emoji: "🌿", href: "/shop?category=Food+%26+Wellness" },
  { label: "Art & Craft", emoji: "🎨", href: "/shop?category=Art+%26+Craft" },
  { label: "Apparel", emoji: "👗", href: "/shop?category=Apparel" },
];

export function CategoryStrip() {
  return (
    <section className="py-8 bg-white border-b border-[#E8E0D8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAFAF8] border border-[#E8E0D8] text-sm font-medium text-[#1A1A1A] whitespace-nowrap hover:border-[#C8956C] hover:bg-[#F5EDE6] hover:text-[#C8956C] transition-all shrink-0"
            >
              <span className="text-base leading-none">{cat.emoji}</span>
              {cat.label}
            </Link>
          ))}

          <Link
            href="/shop"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-[#C8956C] whitespace-nowrap hover:underline shrink-0 ml-2"
          >
            See all →
          </Link>
        </div>
      </div>
    </section>
  );
}
