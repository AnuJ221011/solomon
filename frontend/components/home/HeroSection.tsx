"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Play, Pause } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { useAuthModal } from "@/lib/stores/authModalStore";
import { useAuthStore } from "@/lib/stores/authStore";

const STATS = [
  { value: "500+",  label: "Verified brands"           },
  { value: "40+",   label: "Countries reached"         },
  { value: "0%",    label: "Commission via share link" },
  { value: "42",    label: "Display currencies"        },
];

/**
 * Background: set NEXT_PUBLIC_HERO_VIDEO_URL for a video background,
 * or NEXT_PUBLIC_HERO_IMAGE_URL for a static image.
 * Falls back to a premium dark-copper gradient.
 */
const HERO_VIDEO = process.env.NEXT_PUBLIC_HERO_VIDEO_URL ?? "";
const HERO_IMAGE = process.env.NEXT_PUBLIC_HERO_IMAGE_URL ?? "";

export function HeroSection() {
  const { openModal } = useAuthModal();
  const { isAuthenticated } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPaused, setVideoPaused] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setLoaded(true); }, []);

  const toggleVideo = () => {
    if (!videoRef.current) return;
    if (videoPaused) { videoRef.current.play(); setVideoPaused(false); }
    else             { videoRef.current.pause(); setVideoPaused(true); }
  };

  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">

      {/* ── Background layer ─────────────────────────────── */}
      {HERO_VIDEO ? (
        <video
          ref={videoRef}
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster={HERO_IMAGE || undefined}
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
      ) : HERO_IMAGE ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden
        />
      ) : (
        /* Premium gradient fallback */
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 120% 80% at 70% 50%, rgba(200,149,108,0.25) 0%, transparent 60%),
              linear-gradient(135deg, #0F0A06 0%, #1C0D03 25%, #2D1409 50%, #3D1C08 75%, #1A0A02 100%)
            `,
          }}
        />
      )}

      {/* ── Overlay gradient (always applied) ───────────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, rgba(10,5,0,0.82) 0%, rgba(10,5,0,0.60) 50%, rgba(10,5,0,0.30) 100%)",
        }}
      />

      {/* ── Decorative grain texture ─────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* ── Content ─────────────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="max-w-3xl">

          {/* Eyebrow */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-7 transition-all duration-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ background: "rgba(200,149,108,0.15)", borderColor: "rgba(200,149,108,0.40)" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#C8956C] animate-pulse" />
            <span className="text-xs font-medium text-[#E8C4A2] tracking-wide">
              India's B2B Wholesale Marketplace
            </span>
          </div>

          {/* Headline */}
          <h1
            className={`font-heading text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight text-balance transition-all duration-700 delay-100 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            Wholesale from{" "}
            <span
              className="italic"
              style={{
                background: "linear-gradient(90deg, #C8956C, #E8B98A, #C8956C)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundSize: "200% auto",
              }}
            >
              India's finest
            </span>
            <br />
            artisan brands.
          </h1>

          <p
            className={`mt-6 text-lg sm:text-xl text-white/70 leading-relaxed max-w-xl transition-all duration-700 delay-200 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            Discover unique, story-driven products from verified Indian makers.
            Browse freely — sign up when you're ready to order.
          </p>

          {/* CTAs */}
          <div
            className={`mt-9 flex flex-wrap gap-3 transition-all duration-700 delay-300 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <LinkButton href="/shop" size="lg" variant="copper" className="shadow-none gap-2 h-13 px-8 text-base">
              Browse products
              <ArrowRight className="h-5 w-5" />
            </LinkButton>

            {!isAuthenticated() && (
              <button
                onClick={() => openModal("signup")}
                className="h-13 px-8 text-base font-medium rounded-lg border border-white/25 text-white hover:bg-white/10 hover:border-white/40 transition-all backdrop-blur-sm"
              >
                Create free account
              </button>
            )}

            <LinkButton href="/signup?role=brand" size="lg" variant="ghost"
              className="h-13 px-8 text-base text-white/70 hover:text-white hover:bg-white/10 border border-transparent">
              Sell on Solomon Bharat
            </LinkButton>
          </div>

          {/* Stats */}
          <div
            className={`mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 transition-all duration-700 delay-500 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <div
                  className="font-heading text-4xl font-bold"
                  style={{ background: "linear-gradient(90deg,#C8956C,#E8B98A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                >
                  {stat.value}
                </div>
                <div className="text-sm text-white/55">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Video play/pause control ─────────────────────── */}
      {HERO_VIDEO && (
        <button
          onClick={toggleVideo}
          className="absolute bottom-6 right-6 z-10 h-10 w-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
          aria-label={videoPaused ? "Play video" : "Pause video"}
        >
          {videoPaused ? <Play className="h-4 w-4 fill-current" /> : <Pause className="h-4 w-4" />}
        </button>
      )}

      {/* ── Bottom fade ──────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: "linear-gradient(to top, #FAFAF8, transparent)" }} />
    </section>
  );
}
