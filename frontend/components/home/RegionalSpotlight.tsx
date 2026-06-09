import Link from "next/link";

const REGIONS = [
  { name: "Varanasi",       tag: "Silk & Handloom",      query: "varanasi"       },
  { name: "Jaipur",         tag: "Block print & Gems",   query: "jaipur"         },
  { name: "Rajasthan",      tag: "Pottery & Crafts",     query: "rajasthan"      },
  { name: "Kashmir",        tag: "Pashmina & Carpets",   query: "kashmir"        },
  { name: "Kerala",         tag: "Spices & Wellness",    query: "kerala"         },
  { name: "Kutch",          tag: "Embroidery & Mirror",  query: "kutch"          },
  { name: "Tamil Nadu",     tag: "Temple jewellery",     query: "tamil+nadu"     },
  { name: "Madhya Pradesh", tag: "Folk art & Crafts",    query: "madhya+pradesh" },
];

export function RegionalSpotlight() {
  return (
    <section className="py-12 bg-white border-y border-[#E5E1D8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold text-[#1A1A1A]">India's craft regions</h2>
          <Link href="/shop" className="text-sm font-medium text-[#A68B67] hover:text-[#8B7055] transition-colors">
            Explore all →
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {REGIONS.map((region) => (
            <Link
              key={region.name}
              href={`/shop?search=${region.query}`}
              className="group shrink-0 flex flex-col px-4 py-3 rounded-lg bg-[#F9F7F2] border border-[#E5E1D8] hover:border-[#A68B67] hover:bg-white transition-all min-w-[140px]"
            >
              <p className="text-sm font-semibold text-[#1A1A1A] group-hover:text-[#A68B67] transition-colors whitespace-nowrap">
                {region.name}
              </p>
              <p className="text-xs text-[#444748] whitespace-nowrap mt-0.5">{region.tag}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}