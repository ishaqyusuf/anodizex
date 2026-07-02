import type { Metadata } from "next";
import { SignUpView } from "@/components/auth/sign-up-view";

export const metadata: Metadata = {
  title: "Sign up | afterservice",
  description: "Create an afterservice dashboard account.",
};

export default function SignUpPage() {
  return <SignUpView />;
}
