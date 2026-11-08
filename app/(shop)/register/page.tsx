import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthPanel } from "@/components/auth/auth-panel";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="font-heading text-4xl tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Save orders, looks, and pieces you want to come back to.</p>
      </div>
      <AuthPanel>
        <AuthForm mode="register" next={next} />
      </AuthPanel>
      <div className="space-y-3 pt-2">
        <p className="text-center text-sm text-muted-foreground">Already shopping with us?</p>
        <Link href={loginHref} className="link-secondary">
          Sign in
        </Link>
      </div>
    </div>
  );
}
