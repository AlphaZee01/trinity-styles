import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthPanel } from "@/components/auth/auth-panel";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ResetPasswordPage() {
  const { userId } = await requireUser();
  if (!userId) redirect("/login?next=/reset-password");
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="font-heading text-4xl tracking-tight">New password</h1>
        <p className="mt-2 text-sm text-muted-foreground">Choose a new password for your account.</p>
      </div>
      <AuthPanel>
        <ResetPasswordForm />
      </AuthPanel>
    </div>
  );
}
