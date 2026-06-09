"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";

type Step = "email" | "otp" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const requestMutation = useMutation({
    mutationFn: () => api.post("/auth/forgot-password", { email }),
    onSuccess: () => { setStep("otp"); toast.success("If that email exists, a code has been sent."); },
    onError: () => setStep("otp"), // always advance (anti-enumeration)
  });

  const resetMutation = useMutation({
    mutationFn: () => api.post("/auth/reset-password", { email, otp, newPassword }),
    onSuccess: () => { toast.success("Password reset! Please log in."); router.push("/login"); },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Reset failed"),
  });

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="font-heading text-3xl font-bold text-[#1A1A1A]">
          {step === "email" ? "Forgot password?" : step === "otp" ? "Enter your code" : "New password"}
        </h1>
        <p className="mt-2 text-sm text-[#444748]">
          {step === "email" && "Enter your email and we'll send a reset code."}
          {step === "otp" && `We sent a 6-digit code to ${email}.`}
          {step === "reset" && "Choose a new password for your account."}
        </p>
      </div>

      <div className="bg-white rounded-lg border border-[#E5E1D8] shadow-warm p-6 space-y-4">
        {step === "email" && (
          <>
            <input type="email" placeholder="Email address" value={email}
              onChange={(e) => setEmail(e.target.value)} className={inp} />
            <button onClick={() => requestMutation.mutate()} disabled={!email || requestMutation.isPending}
              className={btn}>
              {requestMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Send reset code
            </button>
          </>
        )}

        {step === "otp" && (
          <>
            <input type="text" inputMode="numeric" maxLength={6} placeholder="6-digit code"
              value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} className={inp} />
            <button onClick={() => setStep("reset")} disabled={otp.length < 6} className={btn}>
              Continue
            </button>
          </>
        )}

        {step === "reset" && (
          <>
            <input type="password" placeholder="New password (min 8, 1 number)" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} className={inp} />
            <button onClick={() => resetMutation.mutate()} disabled={newPassword.length < 8 || resetMutation.isPending} className={btn}>
              {resetMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Reset password
            </button>
          </>
        )}

        <Link href="/login" className="flex items-center justify-center gap-1 text-sm text-[#444748] hover:text-[#A68B67]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to login
        </Link>
      </div>
    </div>
  );
}

const inp = "w-full h-10 px-3 rounded-lg border border-[#E5E1D8] bg-[#F9F7F2] text-sm text-[#1A1A1A] placeholder:text-[#444748] focus:outline-none focus:border-[#A68B67] focus:bg-white transition-colors";
const btn = "w-full h-11 rounded-lg bg-[#1A1A1A] hover:bg-[#8B7055] text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50";