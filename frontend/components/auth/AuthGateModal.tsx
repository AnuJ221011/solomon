"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { X, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/authStore";
import { useCartStore } from "@/lib/stores/cartStore";
import { useAuthModal } from "@/lib/stores/authModalStore";
import { cn } from "@/lib/utils";

type Step = "auth" | "otp";

const COUNTRIES = [
  ["US","United States"],["GB","United Kingdom"],["AU","Australia"],
  ["CA","Canada"],["DE","Germany"],["FR","France"],["SG","Singapore"],
  ["AE","UAE"],["IN","India"],["NZ","New Zealand"],
];

export function AuthGateModal() {
  const { open, mode, reason, pendingAction, closeModal, setMode } = useAuthModal();
  const { setAuth } = useAuthStore();
  const { increment } = useCartStore();

  const [step, setStep] = useState<Step>("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [countryCode, setCountryCode] = useState("US");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const resetForm = () => {
    setStep("auth");
    setEmail(""); setPassword(""); setBusinessName(""); setCountryCode("US");
    setOtp(["", "", "", "", "", ""]); setShowPw(false);
  };

  const handleClose = () => { resetForm(); closeModal(); };
  const switchMode = (m: "login" | "signup") => { resetForm(); setMode(m); };

  /* ── Login ──────────────────────────────────────────────── */
  const loginMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/auth/login", { email, password });
      return data.data;
    },
    onSuccess: async (data) => {
      setAuth(data.user, data.accessToken);
      toast.success("Welcome back!");
      if (pendingAction) await pendingAction().catch(() => {});
      handleClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Invalid credentials"),
  });

  /* ── Buyer signup ───────────────────────────────────────── */
  const signupMutation = useMutation({
    mutationFn: async () => {
      const shareLinkToken = sessionStorage.getItem("slt") ?? undefined;
      const referralToken  = new URLSearchParams(window.location.search).get("ref") ?? undefined;
      const { data } = await api.post("/auth/buyer/signup", {
        email, password, businessName, countryCode, shareLinkToken, referralToken,
      });
      return data.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      setStep("otp");
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Signup failed"),
  });

  /* ── OTP verify ─────────────────────────────────────────── */
  const verifyMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/auth/verify-email", { email, otp: otp.join("") });
      return data;
    },
    onSuccess: async () => {
      toast.success("Email verified! Welcome to Solomon Bharat.");
      if (pendingAction) await pendingAction().catch(() => {});
      handleClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Invalid code"),
  });

  const resendMutation = useMutation({
    mutationFn: () => api.post("/auth/resend-otp", { email }),
    onSuccess: () => toast.success("New code sent"),
    onError: () => toast.error("Could not resend"),
  });

  /* ── OTP input handler ──────────────────────────────────── */
  const handleOtpChange = (i: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[i] = digit; setOtp(next);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
    if (!digit && i > 0) otpRefs.current[i - 1]?.focus();
  };

  if (!open) return null;

  const isPending = loginMutation.isPending || signupMutation.isPending || verifyMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-warm-lg border border-[#E8E0D8] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex-1">
            {step === "otp" ? (
              <>
                <button
                  onClick={() => setStep("auth")}
                  className="flex items-center gap-1.5 text-xs text-[#6B6056] hover:text-[#1A1A1A] mb-3 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <h2 className="font-heading text-2xl font-bold text-[#1A1A1A]">Check your email</h2>
                <p className="text-sm text-[#6B6056] mt-1">
                  We sent a 6-digit code to <span className="font-medium text-[#1A1A1A]">{email}</span>
                </p>
              </>
            ) : (
              <>
                {reason && (
                  <p className="text-xs font-medium text-[#C8956C] uppercase tracking-wider mb-1">{reason}</p>
                )}
                <h2 className="font-heading text-2xl font-bold text-[#1A1A1A]">
                  {mode === "signup" ? "Join Solomon Bharat" : "Welcome back"}
                </h2>
                <p className="text-sm text-[#6B6056] mt-0.5">
                  {mode === "signup" ? "Free forever for retailers." : "Log in to your account."}
                </p>
              </>
            )}
          </div>
          <button
            onClick={handleClose}
            className="ml-4 h-8 w-8 rounded-full flex items-center justify-center text-[#6B6056] hover:bg-[#F5EDE6] hover:text-[#1A1A1A] transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs — only on auth step */}
        {step === "auth" && (
          <div className="flex border-b border-[#E8E0D8] mx-6">
            {(["signup", "login"] as const).map((t) => (
              <button
                key={t}
                onClick={() => switchMode(t)}
                className={cn(
                  "flex-1 py-2.5 text-sm font-medium transition-colors",
                  mode === t
                    ? "text-[#C8956C] border-b-2 border-[#C8956C] -mb-px"
                    : "text-[#6B6056] hover:text-[#1A1A1A]"
                )}
              >
                {t === "signup" ? "Create account" : "Log in"}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 space-y-3">

          {/* ── OTP step ── */}
          {step === "otp" && (
            <>
              <div className="flex gap-2 justify-center py-2">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
                    }}
                    className="h-13 w-11 rounded-lg border border-[#E8E0D8] bg-white text-center text-xl font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#C8956C] transition-colors"
                  />
                ))}
              </div>

              <button
                onClick={() => verifyMutation.mutate()}
                disabled={otp.join("").length < 6 || verifyMutation.isPending}
                className={btnCls}
              >
                {verifyMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Verify email
              </button>

              <div className="text-center text-sm text-[#6B6056]">
                Didn't receive it?{" "}
                <button
                  onClick={() => resendMutation.mutate()}
                  disabled={resendMutation.isPending}
                  className="text-[#C8956C] hover:text-[#B07D57] font-medium"
                >
                  Resend code
                </button>
              </div>
            </>
          )}

          {/* ── Login form ── */}
          {step === "auth" && mode === "login" && (
            <>
              <input type="email" placeholder="Email address" value={email}
                onChange={(e) => setEmail(e.target.value)} className={inp} />

              <div className="relative">
                <input type={showPw ? "text" : "password"} placeholder="Password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className={inp + " pr-10"} />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6056]">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="text-right">
                <button
                  onClick={() => { handleClose(); }}
                  className="text-xs text-[#C8956C] hover:text-[#B07D57]"
                >
                  <Link href="/forgot-password">Forgot password?</Link>
                </button>
              </div>

              <button onClick={() => loginMutation.mutate()}
                disabled={!email || !password || isPending} className={btnCls}>
                {loginMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Log in
              </button>
            </>
          )}

          {/* ── Buyer signup form ── */}
          {step === "auth" && mode === "signup" && (
            <>
              <input type="email" placeholder="Email address" value={email}
                onChange={(e) => setEmail(e.target.value)} className={inp} />

              <div className="relative">
                <input type={showPw ? "text" : "password"}
                  placeholder="Password (min 8 chars, 1 number)"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className={inp + " pr-10"} />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6056]">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <input type="text" placeholder="Business name"
                value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                className={inp} />

              <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)}
                className={inp + " cursor-pointer"}>
                {COUNTRIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>

              <button onClick={() => signupMutation.mutate()}
                disabled={!email || !password || !businessName || isPending}
                className={btnCls}>
                {signupMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create free account
              </button>

              {/* Brand signup CTA */}
              <div className="pt-1 border-t border-[#E8E0D8] text-center">
                <p className="text-xs text-[#6B6056]">
                  Selling wholesale from India?{" "}
                  <Link
                    href="/signup?role=brand"
                    onClick={handleClose}
                    className="text-[#C8956C] hover:text-[#B07D57] font-medium"
                  >
                    Apply as a brand →
                  </Link>
                </p>
              </div>
            </>
          )}

          {/* Terms */}
          {step === "auth" && mode === "signup" && (
            <p className="text-xs text-[#6B6056] text-center">
              By signing up you agree to our{" "}
              <Link href="/terms" onClick={handleClose} className="text-[#C8956C] hover:underline">Terms</Link>
              {" "}and{" "}
              <Link href="/privacy" onClick={handleClose} className="text-[#C8956C] hover:underline">Privacy policy</Link>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const inp = "w-full h-10 px-3 rounded-lg border border-[#E8E0D8] bg-[#FAFAF8] text-sm text-[#1A1A1A] placeholder:text-[#6B6056] focus:outline-none focus:border-[#C8956C] focus:bg-white transition-colors";
const btnCls = "w-full h-11 rounded-lg bg-[#C8956C] hover:bg-[#B07D57] text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
