import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; code?: string }>;
}) {
  const { next, code } = await searchParams;
  if (code) {
    const target = new URLSearchParams({ code });
    if (next) target.set("next", next);
    redirect(`/auth/callback?${target}`);
  }
  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : "/register";
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="font-heading text-4xl tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Use your email for orders, looks, and checkout.</p>
      </div>
      <AuthForm mode="login" next={next} />
      <Link href="/forgot-password" className="press inline-flex h-11 items-center text-sm text-muted-foreground">
        Forgot password
      </Link>
      <div className="space-y-3 border-t border-border pt-6">
        <p className="text-sm text-muted-foreground">New here?</p>
        <Link
          href={registerHref}
          className="press flex h-11 w-full items-center justify-center rounded-lg border border-border bg-background text-sm font-medium"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}
