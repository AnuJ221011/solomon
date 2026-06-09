"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      // Stub — wire to your email service or a simple API endpoint
      await new Promise((r) => setTimeout(r, 800));
      return true;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast.success("You're on the list!");
    },
    onError: () => toast.error("Something went wrong, please try again"),
  });

  return (
    <section className="py-16 bg-[#F9F7F2] border-t border-[#E5E1D8]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          {/* Icon */}
          <div className="h-14 w-14 rounded-lg bg-[#F5F0E8] border border-[#DDD0BA] flex items-center justify-center text-2xl mx-auto mb-6">
            📬
          </div>

          <p className="text-xs font-semibold text-[#A68B67] uppercase tracking-widest mb-2">
            Weekly wholesale digest
          </p>
          <h2 className="font-heading text-3xl lg:text-4xl font-bold text-[#1A1A1A]">
            New Indian brands, every Monday.
          </h2>
          <p className="mt-3 text-base text-[#444748] max-w-md mx-auto leading-relaxed">
            Curated new arrivals based on your store type. Be the first to discover brands
            before they sell out at wholesale.
          </p>

          {submitted ? (
            <div className="mt-8 flex items-center justify-center gap-2 text-[#2D6A4F] font-medium">
              <CheckCircle2 className="h-5 w-5" />
              You're on the list! Expect your first digest next Monday.
            </div>
          ) : (
            <form
              className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              onSubmit={(e) => { e.preventDefault(); if (email) subscribeMutation.mutate(); }}
            >
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 h-12 px-4 rounded-lg border border-[#E5E1D8] bg-white text-sm text-[#1A1A1A] placeholder:text-[#444748] focus:outline-none focus:border-[#A68B67] focus:bg-white transition-colors shadow-warm"
              />
              <button
                type="submit"
                disabled={!email || subscribeMutation.isPending}
                className="h-12 px-6 rounded-lg bg-[#1A1A1A] hover:bg-[#8B7055] text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 whitespace-nowrap shadow-warm"
              >
                {subscribeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Subscribe <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="mt-4 text-xs text-[#444748]">
            Join 2,000+ retailers already on the list. Unsubscribe any time.
          </p>

          {/* Social proof */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-[#444748]">
            {[
              "📦 Weekly new arrivals",
              "🎯 Curated to your store type",
              "🔔 First to know about new brands",
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">{item}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}