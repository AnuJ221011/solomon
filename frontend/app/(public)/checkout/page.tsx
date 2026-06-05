"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, MapPin, CreditCard, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useCurrencyStore } from "@/lib/stores/currencyStore";
import { useCartStore } from "@/lib/stores/cartStore";
import { useAuthStore } from "@/lib/stores/authStore";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const COUNTRIES = [
  ["US","United States"],["GB","United Kingdom"],["AU","Australia"],
  ["CA","Canada"],["DE","Germany"],["FR","France"],["NL","Netherlands"],
  ["SG","Singapore"],["AE","UAE"],["IN","India"],["NZ","New Zealand"],
];

export default function CheckoutPage() {
  const router = useRouter();
  const { format } = useCurrencyStore();
  const { reset } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [step, setStep] = useState<"address" | "payment">("address");

  const [address, setAddress] = useState({
    line1: "", line2: "", city: "", state: "", postalCode: "", countryCode: "US",
  });

  // Fetch cart total
  const { data: totals, isLoading } = useQuery({
    queryKey: ["cart-total", address.countryCode],
    queryFn: async () => {
      const { data } = await api.get(`/payments/paypal/cart-total?countryCode=${address.countryCode}`);
      return data.data;
    },
    enabled: isAuthenticated() && address.countryCode.length === 2,
  });

  // Create PayPal order
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/payments/paypal/create-order", {
        countryCode: address.countryCode,
        walletCreditsToApplyInr: 0,
      });
      return data.data;
    },
    onSuccess: (data) => {
      // In production: redirect to data.approvalUrl (PayPal hosted page)
      // For now, simulate capture with the paypalOrderId
      captureMutation.mutate(data.paypalOrderId);
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Payment initiation failed"),
  });

  // Capture + create orders
  const captureMutation = useMutation({
    mutationFn: async (paypalOrderId: string) => {
      const { data } = await api.post("/payments/paypal/capture", {
        paypalOrderId,
        shippingAddress: address,
        walletCreditsToApplyInr: 0,
      });
      return data.data;
    },
    onSuccess: (data) => {
      reset();
      const orderId = data.orders?.[0]?.id;
      toast.success("Order placed successfully!");
      router.push(orderId ? `/orders/${orderId}` : "/buyer/orders");
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Payment failed"),
  });

  const addressComplete = address.line1 && address.city && address.postalCode && address.countryCode;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-heading text-3xl font-bold text-[#1A1A1A] mb-2">Checkout</h1>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 text-sm">
          <span className={step === "address" ? "font-semibold text-[#C8956C]" : "text-[#2D6A4F]"}>
            1. Shipping address
          </span>
          <ChevronRight className="h-4 w-4 text-[#E8E0D8]" />
          <span className={step === "payment" ? "font-semibold text-[#C8956C]" : "text-[#6B6056]"}>
            2. Payment
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === "address" ? (
              <div className="bg-white rounded-xl border border-[#E8E0D8] shadow-warm p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-[#C8956C]" />
                  <h2 className="font-heading text-lg font-semibold text-[#1A1A1A]">Shipping address</h2>
                </div>

                <input placeholder="Address line 1 *" value={address.line1}
                  onChange={(e) => setAddress({ ...address, line1: e.target.value })} className={inp} />
                <input placeholder="Address line 2 (optional)" value={address.line2}
                  onChange={(e) => setAddress({ ...address, line2: e.target.value })} className={inp} />
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="City *" value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })} className={inp} />
                  <input placeholder="State / Province" value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })} className={inp} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Postal code *" value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} className={inp} />
                  <select value={address.countryCode}
                    onChange={(e) => setAddress({ ...address, countryCode: e.target.value })} className={inp + " cursor-pointer"}>
                    {COUNTRIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>

                <button
                  onClick={() => setStep("payment")}
                  disabled={!addressComplete}
                  className="w-full h-11 rounded-lg bg-[#C8956C] hover:bg-[#B07D57] text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2"
                >
                  Continue to payment
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#E8E0D8] shadow-warm p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-[#C8956C]" />
                  <h2 className="font-heading text-lg font-semibold text-[#1A1A1A]">Payment</h2>
                </div>

                <div className="p-4 rounded-lg bg-[#F5EDE6] border border-[#E8C4A2] text-sm text-[#6B6056]">
                  <p className="font-medium text-[#1A1A1A] mb-1">Secure payment via PayPal</p>
                  <p>You'll be redirected to PayPal to complete your payment. Your order will be created once payment is confirmed.</p>
                </div>

                <div className="text-sm text-[#6B6056] space-y-1">
                  <div className="flex justify-between">
                    <span>Shipping to</span>
                    <span className="font-medium text-[#1A1A1A]">{address.city}, {address.countryCode}</span>
                  </div>
                  {totals && (
                    <div className="flex justify-between">
                      <span>Total (approx.)</span>
                      <span className="font-bold text-[#1A1A1A]">{totals.currency} {Number(totals.grandTotalBuyerCurrency ?? 0).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep("address")} className="flex-1 h-11 rounded-lg border border-[#E8E0D8] text-sm font-medium text-[#6B6056] hover:bg-[#FAFAF8] transition-colors">
                    ← Back
                  </button>
                  <button
                    onClick={() => createOrderMutation.mutate()}
                    disabled={createOrderMutation.isPending || captureMutation.isPending}
                    className="flex-1 h-11 rounded-lg bg-[#C8956C] hover:bg-[#B07D57] text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                  >
                    {(createOrderMutation.isPending || captureMutation.isPending) && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Place order
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="bg-white rounded-xl border border-[#E8E0D8] shadow-warm h-fit">
            <div className="p-4 border-b border-[#E8E0D8]">
              <h3 className="font-heading text-sm font-semibold text-[#1A1A1A]">Order summary</h3>
            </div>
            <div className="p-4 space-y-2 text-sm">
              {isLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-[#C8956C]" /></div>
              ) : totals ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-[#6B6056]">Subtotal (INR)</span>
                    <span>₹{Number(totals.grandTotalInr ?? 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-[#E8E0D8]">
                    <span>Total</span>
                    <span className="text-[#C8956C]">{totals.currency} {Number(totals.grandTotalBuyerCurrency ?? 0).toFixed(2)}</span>
                  </div>
                  {totals.availableCreditsInr > 0 && (
                    <p className="text-xs text-[#2D6A4F]">₹{Number(totals.availableCreditsInr).toFixed(0)} wallet credits available</p>
                  )}
                </>
              ) : (
                <p className="text-[#6B6056] text-xs">Enter your country to see shipping costs.</p>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

const inp = "w-full h-10 px-3 rounded-lg border border-[#E8E0D8] bg-[#FAFAF8] text-sm text-[#1A1A1A] placeholder:text-[#6B6056] focus:outline-none focus:border-[#C8956C] focus:bg-white transition-colors";
