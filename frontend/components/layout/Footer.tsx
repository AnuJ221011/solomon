import Link from "next/link";

const LINKS = {
  Marketplace: [
    { label: "Browse Products", href: "/shop" },
    { label: "All Brands", href: "/brands" },
    { label: "New Arrivals", href: "/shop?sortBy=createdAt&sortOrder=desc" },
  ],
  Sellers: [
    { label: "Sell on Solomon Bharat", href: "/signup?role=brand" },
    { label: "How it works", href: "/about" },
    { label: "Brand login", href: "/login" },
  ],
  Support: [
    { label: "Help Centre", href: "/help" },
    { label: "Contact Us", href: "/contact" },
    { label: "Returns Policy", href: "/returns" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-[#E5E1D8] mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <span className="font-heading text-xl font-bold text-white">
              Solomon Bharat
            </span>
            <p className="mt-3 text-sm text-[#444748] leading-relaxed max-w-[220px]">
              Connecting India's finest artisan brands with retailers worldwide.
            </p>
            <p className="mt-4 text-xs text-[#444748]">
              Discovery is public. Commerce is yours.
            </p>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-sm font-semibold text-white mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#444748] hover:text-[#A68B67] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-[#2D2D2D] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#444748]">
            © {new Date().getFullYear()} Solomon Bharat. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs text-[#444748] hover:text-[#A68B67] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs text-[#444748] hover:text-[#A68B67] transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}