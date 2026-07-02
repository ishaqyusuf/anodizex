import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password | afterservice",
  description: "Set a new password for your afterservice dashboard account.",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      description="Please enter your new password below."
      title="Set new password"
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
