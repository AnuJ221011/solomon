"use client";

import Link from "next/link";
import Image from "next/image";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Package, Loader2, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { useCurrencyStore } from "@/lib/stores/currencyStore";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  PENDING:    { label: "Pending",    class: "bg-[#FEF3C7] text-[#B45309]"  },
  CONFIRMED:  { label: "Confirmed",  class: "bg-[#EFF6FF] text-[#1E3A5F]"  },
  PROCESSING: { label: "Processing", class: "bg-[#F5F3FF] text-[#6D28D9]"  },
  DISPATCHED: { label: "Dispatched", class: "bg-[#F0FDF4] text-[#166534]"  },
  DELIVERED:  { label: "Delivered",  class: "bg-[#E8F5EE] text-[#2D6A4F]"  },
  CANCELLED:  { label: "Cancelled",  class: "bg-[#FEF2F2] text-[#B91C1C]"  },
};

const STEPS = ["PENDING", "CONFIRMED", "PROCESSING", "DISPATCHED", "DELIVERED"];

interface Props { params: Promise<{ id: string }> }

export default function OrderConfirmPage({ params }: Props) {
  const { id } = use(params);
  const { format } = useCurrencyStore();

  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-[#C8956C]" /></div>
        ) : !data ? (
          <div className="text-center py-20">
            <p className="text-[#6B6056]">Order not found.</p>
            <Link href="/buyer/orders" className="mt-4 text-sm text-[#C8956C] font-medium">← My orders</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success header */}
            <div className="text-center py-8">
              <div className="h-16 w-16 rounded-full bg-[#E8F5EE] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-[#2D6A4F]" />
              </div>
              <h1 className="font-heading text-3xl font-bold text-[#1A1A1A]">Order confirmed!</h1>
              <p className="mt-2 text-[#6B6056]">
                Your order from <span className="font-medium text-[#1A1A1A]">{data.brand?.brandName}</span> has been placed.
              </p>
              <p className="text-sm text-[#6B6056] mt-1">Order ID: <span className="font-mono text-[#1A1A1A]">{data.id.slice(0, 12)}…</span></p>
            </div>

            {/* Progress bar */}
            <div className="bg-white rounded-xl border border-[#E8E0D8] p-6 shadow-warm">
              <h2 className="font-heading text-base font-semibold text-[#1A1A1A] mb-5">Order status</h2>
              <div className="relative flex items-center justify-between">
                <div className="absolute left-0 right-0 top-3 h-0.5 bg-[#E8E0D8]" />
                <div
                  className="absolute left-0 top-3 h-0.5 bg-[#C8956C] transition-all duration-500"
                  style={{ width: `${(STEPS.indexOf(data.status) / (STEPS.length - 1)) * 100}%` }}
                />
                {STEPS.map((s) => {
                  const done = STEPS.indexOf(data.status) >= STEPS.indexOf(s);
                  return (
                    <div key={s} className="relative flex flex-col items-center gap-2 z-10">
                      <div className={cn("h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
                        done ? "bg-[#C8956C] border-[#C8956C]" : "bg-white border-[#E8E0D8]"
                      )}>
                        {done && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                      <span className="text-[10px] text-[#6B6056] whitespace-nowrap hidden sm:block">
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
              {data.trackingNumber && (
                <div className="mt-5 p-3 rounded-lg bg-[#F5EDE6] text-sm">
                  <span className="font-medium text-[#1A1A1A]">Tracking: </span>
                  <span className="font-mono text-[#C8956C]">{data.trackingNumber}</span>
                  {data.trackingCarrier && <span className="text-[#6B6056]"> via {data.trackingCarrier}</span>}
                </div>
              )}
            </div>

            {/* Items */}
            <div className="bg-white rounded-xl border border-[#E8E0D8] shadow-warm overflow-hidden">
              <div className="px-5 py-3 border-b border-[#E8E0D8] bg-[#FAFAF8]">
                <h2 className="font-heading text-sm font-semibold text-[#1A1A1A]">Items</h2>
              </div>
              <div className="divide-y divide-[#E8E0D8]">
                {data.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 p-4">
                    <div className="h-12 w-12 rounded-lg bg-[#F5EDE6] shrink-0 flex items-center justify-center">
                      <Package className="h-5 w-5 text-[#C8956C]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">{item.product?.name ?? "Product"}</p>
                      <p className="text-xs text-[#6B6056]">{item.quantity} units</p>
                    </div>
                    <p className="font-medium text-sm text-[#1A1A1A] shrink-0">{format(Number(item.totalInr))}</p>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 bg-[#FAFAF8] border-t border-[#E8E0D8] flex justify-between font-semibold text-sm">
                <span>Total</span>
                <span className="text-[#C8956C]">{data.buyerCurrency} {Number(data.totalBuyerCurrency).toFixed(2)}</span>
              </div>
            </div>

            {/* Opening order badge */}
            {data.isOpeningOrder && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[#E8F5EE] border border-[#B7DFC7] text-sm text-[#2D6A4F]">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span><span className="font-semibold">Opening order protection active</span> — 30-day free returns if you're not satisfied.</span>
              </div>
            )}

            {/* CTAs */}
            <div className="flex gap-3">
              <Link href="/shop" className="flex-1 h-10 rounded-lg border border-[#E8E0D8] text-sm font-medium text-[#6B6056] flex items-center justify-center hover:bg-[#FAFAF8] transition-colors">
                Continue shopping
              </Link>
              <Link href="/buyer/orders" className="flex-1 h-10 rounded-lg bg-[#C8956C] hover:bg-[#B07D57] text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                View all orders <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
