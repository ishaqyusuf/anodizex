import type { Metadata } from "next";
import { AuthFooter, AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password | afterservice",
  description: "Request an afterservice dashboard password reset link.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      description="Enter your email address and we will send you a reset link."
      footer={
        <AuthFooter>
          Remember your password? <a href="/sign-in">Log in</a>
        </AuthFooter>
      }
      title="Reset your password"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
