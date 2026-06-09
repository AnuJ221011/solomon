import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupFlow } from "./SignupFlow";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="h-6 w-6 rounded-full border-2 border-[#A68B67] border-t-transparent animate-spin" /></div>}>
      <SignupFlow />
    </Suspense>
  );
}