"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/authStore";
import { useCartStore } from "@/lib/stores/cartStore";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  /** After successful auth, this action is replayed */
  pendingAction?: () => Promise<void>;
  /** Shown in the modal header */
  reason?: string;
}

export function AuthGateModal({ open, onClose, pendingAction, reason }: Props) {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { increment } = useCartStore();
  const [tab, setTab] = useState<"login" | "signup">("signup");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [countryCode, setCountryCode] = useState("US");
  const [showPw, setShowPw] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/auth/login", { email, password });
      return data.data;
    },
    onSuccess: async (data) => {
      setAuth(data.user, data.accessToken);
      toast.success("Logged in!");
      if (pendingAction) await pendingAction().catch(() => {});
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Login failed"),
  });

  const signupMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/auth/buyer/signup", {
        email, password, businessName, countryCode,
      });
      return data.data;
    },
    onSuccess: async (data) => {
      setAuth(data.user, data.accessToken);
      toast.success("Account created! Please verify your email when you have a chance.");
      if (pendingAction) await pendingAction().catch(() => {});
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Signup failed"),
  });

  if (!open) return null;

  const isPending = loginMutation.isPending || signupMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-warm-lg border border-[#E8E0D8] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#E8E0D8]">
          <div>
            <p className="text-xs text-[#C8956C] font-medium uppercase tracking-wider mb-0.5">
              {reason ?? "Create a free account to continue"}
            </p>
            <h2 className="font-heading text-xl font-bold text-[#1A1A1A]">
              {tab === "signup" ? "Join Solomon Bharat" : "Welcome back"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-[#6B6056] hover:bg-[#F5EDE6] hover:text-[#1A1A1A] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E8E0D8]">
          {(["signup", "login"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-2.5 text-sm font-medium transition-colors",
                tab === t
                  ? "text-[#C8956C] border-b-2 border-[#C8956C] -mb-px"
                  : "text-[#6B6056] hover:text-[#1A1A1A]"
              )}
            >
              {t === "signup" ? "Create account" : "Log in"}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-3">
          {/* Email */}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inp}
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              placeholder={tab === "signup" ? "Password (min 8 chars, 1 number)" : "Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inp + " pr-10"}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6056]"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Signup-only fields */}
          {tab === "signup" && (
            <>
              <input
                type="text"
                placeholder="Business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className={inp}
              />
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className={inp + " cursor-pointer"}
              >
                {[["US","United States"],["GB","United Kingdom"],["AU","Australia"],["CA","Canada"],["DE","Germany"],["FR","France"],["SG","Singapore"],["AE","UAE"],["IN","India"]].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </>
          )}

          <button
            onClick={() => tab === "login" ? loginMutation.mutate() : signupMutation.mutate()}
            disabled={isPending || !email || !password || (tab === "signup" && !businessName)}
            className="w-full h-10 rounded-lg bg-[#C8956C] hover:bg-[#B07D57] text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {tab === "signup" ? "Create free account" : "Log in"}
          </button>

          {tab === "login" && (
            <button
              onClick={() => { onClose(); router.push("/forgot-password"); }}
              className="w-full text-xs text-[#6B6056] hover:text-[#C8956C] text-center"
            >
              Forgot password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const inp = "w-full h-10 px-3 rounded-lg border border-[#E8E0D8] bg-[#FAFAF8] text-sm text-[#1A1A1A] placeholder:text-[#6B6056] focus:outline-none focus:border-[#C8956C] focus:bg-white transition-colors";
