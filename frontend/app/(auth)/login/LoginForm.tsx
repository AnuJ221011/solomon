"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/authStore";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/auth/login", { email, password });
      return data.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      toast.success("Welcome back!");
      router.push(redirect);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? "Login failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="font-heading text-3xl font-bold text-[#1A1A1A]">Welcome back</h1>
        <p className="mt-2 text-sm text-[#444748]">
          Log in to your Solomon Bharat account
        </p>
      </div>

      <div className="bg-white rounded-lg border border-[#E5E1D8] shadow-warm p-6 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email address">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className={inputCls}
            />
          </Field>

          <Field label="Password">
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={inputCls + " pr-10"}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444748]"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <div className="text-right">
            <Link href="/forgot-password" className="text-xs text-[#A68B67] hover:text-[#8B7055]">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full h-11 rounded-lg bg-[#1A1A1A] hover:bg-[#8B7055] text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {loginMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Log in
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E5E1D8]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs text-[#444748]">New to Solomon Bharat?</span>
          </div>
        </div>

        <Link
          href="/signup"
          className="block w-full h-11 rounded-lg border border-[#E5E1D8] text-sm font-medium text-[#1A1A1A] flex items-center justify-center hover:border-[#A68B67] hover:bg-[#F9F7F2] transition-colors"
        >
          Create a free account
        </Link>
      </div>
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

const inputCls =
  "w-full h-10 px-3 rounded-lg border border-[#E5E1D8] bg-[#F9F7F2] text-sm text-[#1A1A1A] placeholder:text-[#444748] focus:outline-none focus:border-[#A68B67] focus:bg-white transition-colors";