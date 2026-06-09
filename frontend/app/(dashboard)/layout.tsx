"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, Link2, BarChart3,
  Users, Settings, LogOut, ShoppingBag, Wallet,
  Heart, ChevronRight, BadgeCheck, Zap,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/authStore";
import { cn } from "@/lib/utils";

const BRAND_NAV = [
  { href: "/brand/dashboard",  icon: LayoutDashboard, label: "Overview"      },
  { href: "/brand/orders",     icon: ShoppingBag,     label: "Orders"        },
  { href: "/brand/products",   icon: Package,         label: "Products"      },
  { href: "/brand/share-links",icon: Link2,           label: "Share Links"   },
  { href: "/brand/promotions", icon: Zap,             label: "Promotions"    },
  { href: "/brand/analytics",  icon: BarChart3,       label: "Analytics"     },
  { href: "/brand/settings",   icon: Settings,        label: "Settings"      },
];

const BUYER_NAV = [
  { href: "/buyer/dashboard", icon: LayoutDashboard, label: "Overview"    },
  { href: "/buyer/orders",    icon: ShoppingBag,     label: "My Orders"   },
  { href: "/buyer/saved",     icon: Heart,           label: "Saved"       },
  { href: "/buyer/referrals", icon: Users,           label: "Referrals"   },
  { href: "/buyer/wallet",    icon: Wallet,          label: "Wallet"      },
  { href: "/buyer/settings",  icon: Settings,        label: "Settings"    },
];

const ADMIN_NAV = [
  { href: "/admin",           icon: LayoutDashboard, label: "Overview"   },
  { href: "/admin/brands",    icon: BadgeCheck,      label: "Brands"     },
  { href: "/admin/payouts",   icon: Wallet,          label: "Payouts"    },
  { href: "/admin/users",     icon: Users,           label: "Users"      },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const nav =
    user?.role === "BRAND" ? BRAND_NAV :
    user?.role === "ADMIN" ? ADMIN_NAV :
    BUYER_NAV;

  return (
    <div className="flex min-h-screen bg-[#F9F7F2]">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col bg-white border-r border-[#E5E1D8]">
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-[#E5E1D8]">
          <Link href="/" className="font-heading text-base font-bold text-[#1A1A1A]">
            Solomon Bharat
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-[#F5F0E8] text-[#A68B67]"
                    : "text-[#444748] hover:bg-[#F9F7F2] hover:text-[#1A1A1A]"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
                {active && <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-[#E5E1D8] p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-8 w-8 rounded bg-[#F5F0E8] flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-[#A68B67]">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#1A1A1A] truncate">{user?.name}</p>
              <p className="text-[10px] text-[#444748] truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#444748] hover:bg-[#F9F7F2] hover:text-[#C0392B] transition-colors mt-1"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden h-14 flex items-center justify-between px-4 bg-white border-b border-[#E5E1D8]">
          <Link href="/" className="font-heading text-base font-bold text-[#1A1A1A]">Solomon Bharat</Link>
          <span className="text-xs text-[#444748]">{user?.name}</span>
        </header>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}