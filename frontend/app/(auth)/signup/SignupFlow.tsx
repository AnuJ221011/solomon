"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/authStore";

type Step = "form" | "otp";
type Role = "BUYER" | "BRAND";

const STORE_TYPES = ["Boutique", "Gift shop", "Subscription box", "Online store", "Pop-up", "Other"];
const AESTHETICS  = ["Artisan", "Minimalist", "Bohemian", "Luxury", "Contemporary", "Eclectic"];

export function SignupFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = (searchParams.get("role")?.toUpperCase() ?? "BUYER") as Role;
  const shareLinkToken = searchParams.get("slt") ?? undefined;
  const referralToken  = searchParams.get("ref") ?? undefined;

  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Form state
  const [form, setForm] = useState({
    password: "", businessName: "", countryCode: "US",
    brandName: "", instagramHandle: "", brandStory: "",
    storeType: "", aesthetic: "",
  });
  const [showPw, setShowPw] = useState(false);

  /* ── Signup mutation ────────────────────── */
  const signupMutation = useMutation({
    mutationFn: async () => {
      const endpoint = role === "BUYER" ? "/auth/buyer/signup" : "/auth/brand/signup";
      const body =
        role === "BUYER"
          ? { email, password: form.password, businessName: form.businessName, countryCode: form.countryCode, shareLinkToken, referralToken, storeType: form.storeType.toLowerCase().replace(/ /g, "_") || undefined, aesthetic: form.aesthetic.toLowerCase() || undefined }
          : { email, password: form.password, brandName: form.brandName, category: ["General"], countryOfOrigin: "IN", instagramHandle: form.instagramHandle || undefined, brandStory: form.brandStory || undefined };
      const { data } = await api.post(endpoint, body);
      return data.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      setStep("otp");
      toast.success("Account created! Check your email for the verification code.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? "Signup failed");
    },
  });

  /* ── OTP mutation ───────────────────────── */
  const verifyMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/auth/verify-email", { email, otp: otp.join("") });
      return data;
    },
    onSuccess: () => {
      toast.success("Email verified! Welcome to Solomon Bharat.");
      router.push(role === "BRAND" ? "/brand/dashboard" : "/shop");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? "Invalid code");
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => api.post("/auth/resend-otp", { email }),
    onSuccess: () => toast.success("New code sent to your email"),
    onError: () => toast.error("Could not resend code"),
  });

  /* ── OTP input handler ──────────────────── */
  const handleOtpChange = (i: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
    if (!digit && i > 0) otpRefs.current[i - 1]?.focus();
  };

  /* ── OTP step ───────────────────────────── */
  if (step === "otp") {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#F5EDE6] flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">📬</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-[#1A1A1A]">Check your email</h1>
        <p className="mt-2 text-sm text-[#6B6056]">
          We sent a 6-digit code to <span className="font-medium text-[#1A1A1A]">{email}</span>
        </p>

        <div className="mt-8 flex gap-2 justify-center">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { otpRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus(); }}
              className="h-12 w-10 rounded-lg border border-[#E8E0D8] bg-white text-center text-lg font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#C8956C] transition-colors"
            />
          ))}
        </div>

        <button
          onClick={() => verifyMutation.mutate()}
          disabled={otp.join("").length < 6 || verifyMutation.isPending}
          className="mt-6 w-full h-11 rounded-lg bg-[#C8956C] hover:bg-[#B07D57] text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
        >
          {verifyMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Verify email
        </button>

        <p className="mt-4 text-sm text-[#6B6056]">
          Didn't get it?{" "}
          <button
            onClick={() => resendMutation.mutate()}
            disabled={resendMutation.isPending}
            className="text-[#C8956C] hover:text-[#B07D57] font-medium"
          >
            Resend code
          </button>
        </p>

        <button
          onClick={() => setStep("form")}
          className="mt-2 text-xs text-[#6B6056] hover:text-[#1A1A1A]"
        >
          ← Change email
        </button>
      </div>
    );
  }

  /* ── Signup form ────────────────────────── */
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="font-heading text-3xl font-bold text-[#1A1A1A]">
          {role === "BUYER" ? "Join Solomon Bharat" : "Apply as a brand"}
        </h1>
        <p className="mt-2 text-sm text-[#6B6056]">
          {role === "BUYER"
            ? "Discover Indian wholesale brands. Free forever."
            : "Reach international retailers. Under 15 minutes to list."}
        </p>
      </div>

      {/* Role tabs */}
      <div className="flex rounded-lg border border-[#E8E0D8] p-1 mb-6 bg-[#FAFAF8]">
        <Link
          href="/signup?role=buyer"
          className={`flex-1 h-8 rounded-md flex items-center justify-center text-sm font-medium transition-all ${role === "BUYER" ? "bg-white shadow-warm text-[#1A1A1A]" : "text-[#6B6056] hover:text-[#1A1A1A]"}`}
        >
          I'm a retailer
        </Link>
        <Link
          href="/signup?role=brand"
          className={`flex-1 h-8 rounded-md flex items-center justify-center text-sm font-medium transition-all ${role === "BRAND" ? "bg-white shadow-warm text-[#1A1A1A]" : "text-[#6B6056] hover:text-[#1A1A1A]"}`}
        >
          I'm a brand
        </Link>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); signupMutation.mutate(); }}
        className="bg-white rounded-2xl border border-[#E8E0D8] shadow-warm p-6 space-y-4"
      >
        <Field label="Email address">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" required className={inp} />
        </Field>

        <Field label="Password">
          <div className="relative">
            <input
              type={showPw ? "text" : "password"} value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min 8 chars, at least 1 number" required minLength={8} className={inp + " pr-10"}
            />
            <button type="button" tabIndex={-1} onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6056]">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        {role === "BUYER" ? (
          <>
            <Field label="Business name">
              <input type="text" value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="Little Boutique NYC" required className={inp} />
            </Field>
            <Field label="Country">
              <select value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
                className={inp + " cursor-pointer"}>
                {[["US","United States"],["GB","United Kingdom"],["AU","Australia"],["CA","Canada"],["DE","Germany"],["FR","France"],["SG","Singapore"],["AE","UAE"],["IN","India"]].map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </Field>
            <div>
              <p className="text-sm font-medium text-[#1A1A1A] mb-2">Store type <span className="text-[#6B6056] font-normal">(optional)</span></p>
              <div className="flex flex-wrap gap-2">
                {STORE_TYPES.map((t) => (
                  <button key={t} type="button" onClick={() => setForm({ ...form, storeType: form.storeType === t ? "" : t })}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${form.storeType === t ? "bg-[#C8956C] border-[#C8956C] text-white" : "bg-[#FAFAF8] border-[#E8E0D8] text-[#6B6056] hover:border-[#C8956C]"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <Field label="Brand name">
              <input type="text" value={form.brandName}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                placeholder="Silk Route Co" required className={inp} />
            </Field>
            <Field label="Instagram handle (optional)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6056] text-sm">@</span>
                <input type="text" value={form.instagramHandle}
                  onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })}
                  placeholder="yourbrand" className={inp + " pl-7"} />
              </div>
            </Field>
            <Field label="Brand story (optional)">
              <textarea value={form.brandStory}
                onChange={(e) => setForm({ ...form, brandStory: e.target.value })}
                rows={3} placeholder="Tell buyers your story…"
                className="w-full px-3 py-2 rounded-lg border border-[#E8E0D8] bg-[#FAFAF8] text-sm text-[#1A1A1A] placeholder:text-[#6B6056] focus:outline-none focus:border-[#C8956C] focus:bg-white transition-colors resize-none" />
            </Field>
          </>
        )}

        <p className="text-xs text-[#6B6056]">
          By signing up you agree to our{" "}
          <Link href="/terms" className="text-[#C8956C] hover:underline">Terms</Link> and{" "}
          <Link href="/privacy" className="text-[#C8956C] hover:underline">Privacy policy</Link>.
        </p>

        <button type="submit" disabled={signupMutation.isPending}
          className="w-full h-11 rounded-lg bg-[#C8956C] hover:bg-[#B07D57] text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
          {signupMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {role === "BUYER" ? "Create free account" : "Submit application"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[#6B6056]">
        Already have an account?{" "}
        <Link href="/login" className="text-[#C8956C] hover:text-[#B07D57] font-medium">Log in</Link>
      </p>

      {role === "BRAND" && (
        <div className="mt-4 p-3 rounded-lg bg-[#F5EDE6] border border-[#E8C4A2] text-xs text-[#6B6056]">
          ⏱ Applications are reviewed within 24–48 hours. You'll receive an email when approved.
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-[#1A1A1A]">{label}</label>
      {children}
    </div>
  );
}
const inp = "w-full h-10 px-3 rounded-lg border border-[#E8E0D8] bg-[#FAFAF8] text-sm text-[#1A1A1A] placeholder:text-[#6B6056] focus:outline-none focus:border-[#C8956C] focus:bg-white transition-colors";
