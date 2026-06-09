"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ShoppingBag, Search, ChevronDown, Menu, X, Globe, User,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useCartStore } from "@/lib/stores/cartStore";
import { useCurrencyStore } from "@/lib/stores/currencyStore";
import { useAuthModal } from "@/lib/stores/authModalStore";
import { LinkButton } from "@/components/ui/link-button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/shop", label: "Browse" },
  { href: "/brands", label: "Brands" },
  { href: "/about", label: "How it works" },
];

const CURRENCIES = ["USD", "GBP", "EUR", "AUD", "CAD", "SGD", "AED", "INR", "JPY", "CHF"];

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { itemCount } = useCartStore();
  const { currency, setCurrency } = useCurrencyStore();
  const { openModal } = useAuthModal();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    logout();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFFFF] border-b border-[#E5E1D8] shadow-[0_1px_3px_rgba(26,26,26,0.04)]">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="font-heading text-xl font-bold text-[#1A1A1A] tracking-tight">
              Solomon Bharat
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-7 ml-10">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  pathname?.startsWith(link.href)
                    ? "text-[#A68B67]"
                    : "text-[#444748] hover:text-[#1A1A1A]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Search — desktop */}
          <div className="hidden md:flex flex-1 max-w-sm mx-8">
            <Link
              href="/shop"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-[#E5E1D8] bg-[#F9F7F2] text-sm text-[#444748] hover:border-[#A68B67] hover:bg-white transition-colors"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span>Search products, brands…</span>
            </Link>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Currency picker */}
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden md:flex items-center gap-1 text-sm text-[#444748] hover:text-[#1A1A1A] transition-colors px-2 py-1.5 rounded-md hover:bg-[#F5F0E8]">
                <Globe className="h-4 w-4" />
                <span>{currency}</span>
                <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 max-h-72 overflow-y-auto">
                {CURRENCIES.map((c) => (
                  <DropdownMenuItem
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={cn("text-sm cursor-pointer", c === currency && "font-semibold text-[#A68B67]")}
                  >
                    {c}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cart */}
            {isAuthenticated() && (
              <Link href="/cart" className="relative p-2 text-[#444748] hover:text-[#1A1A1A] transition-colors">
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded bg-[#1A1A1A] text-white text-[10px] font-semibold flex items-center justify-center leading-none">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </Link>
            )}

            {/* Auth */}
            {isAuthenticated() ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded border border-[#E5E1D8] hover:border-[#A68B67] transition-colors bg-white">
                  <div className="h-7 w-7 rounded bg-[#F5F0E8] flex items-center justify-center">
                    <User className="h-4 w-4 text-[#A68B67]" />
                  </div>
                  <span className="text-sm font-medium text-[#1A1A1A] max-w-[100px] truncate">
                    {user?.name}
                  </span>
                  <ChevronDown className="h-3 w-3 text-[#444748]" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-3 py-2 border-b border-[#E5E1D8]">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-[#444748] truncate">{user?.email}</p>
                  </div>
                  {user?.role === "BUYER" && (
                    <>
                      <DropdownMenuItem><Link href="/buyer/dashboard" className="w-full">Dashboard</Link></DropdownMenuItem>
                      <DropdownMenuItem><Link href="/buyer/orders" className="w-full">My Orders</Link></DropdownMenuItem>
                      <DropdownMenuItem><Link href="/buyer/saved" className="w-full">Saved Items</Link></DropdownMenuItem>
                    </>
                  )}
                  {user?.role === "BRAND" && (
                    <>
                      <DropdownMenuItem><Link href="/brand/dashboard" className="w-full">Brand Dashboard</Link></DropdownMenuItem>
                      <DropdownMenuItem><Link href="/brand/products" className="w-full">Products</Link></DropdownMenuItem>
                    </>
                  )}
                  {user?.role === "ADMIN" && (
                    <DropdownMenuItem><Link href="/admin" className="w-full">Admin Panel</Link></DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-[#C0392B] cursor-pointer"
                    onClick={handleLogout}
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => openModal("login")}
                  className="h-8 px-3 text-sm font-medium text-[#444748] hover:text-[#1A1A1A] hover:bg-[#F5F0E8] rounded-lg transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => openModal("signup")}
                  className="h-8 px-3 text-sm font-medium bg-[#1A1A1A] hover:bg-[#8B7055] text-white rounded-lg transition-colors"
                >
                  Join free
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-[#444748] hover:text-[#1A1A1A]"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-[#E5E1D8] space-y-1">
            {/* Mobile search */}
            <Link
              href="/shop"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F9F7F2] border border-[#E5E1D8] text-sm text-[#444748] mb-3"
              onClick={() => setMobileOpen(false)}
            >
              <Search className="h-4 w-4" />
              Search products, brands…
            </Link>

            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#F5F0E8]"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-3 border-t border-[#E5E1D8] flex gap-2">
              {isAuthenticated() ? (
                <button
                  onClick={handleLogout}
                  className="flex-1 text-sm h-9 rounded-lg border border-[#E5E1D8] hover:bg-[#F5F0E8] font-medium text-[#1A1A1A] transition-colors"
                >
                  Sign out
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { setMobileOpen(false); openModal("login"); }}
                    className="flex-1 h-9 rounded-lg border border-[#E5E1D8] text-sm font-medium text-[#1A1A1A] hover:bg-[#F5F0E8] transition-colors"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => { setMobileOpen(false); openModal("signup"); }}
                    className="flex-1 h-9 rounded-lg bg-[#1A1A1A] hover:bg-[#8B7055] text-white text-sm font-medium transition-colors"
                  >
                    Join free
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}