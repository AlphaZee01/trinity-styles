import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthPanel } from "@/components/auth/auth-panel";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="font-heading text-4xl tracking-tight">Reset password</h1>
        <p className="mt-2 text-sm text-muted-foreground">We will email you a link to choose a new password.</p>
      </div>
      <AuthPanel>
        <ForgotPasswordForm />
      </AuthPanel>
      <Link href="/login" className="press inline-flex h-11 items-center text-sm text-muted-foreground">
        Back to sign in
      </Link>
    </div>
  );
}
