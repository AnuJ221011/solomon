import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="h-6 w-6 rounded-full border-2 border-[#A68B67] border-t-transparent animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}