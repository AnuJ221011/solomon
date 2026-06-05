import type { Metadata } from "next";
import { SignupFlow } from "./SignupFlow";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return <SignupFlow />;
}
