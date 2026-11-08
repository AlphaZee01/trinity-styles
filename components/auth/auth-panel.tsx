import { cn } from "cn";

export function AuthPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("glass rounded-2xl p-6 sm:p-7", className)}>{children}</div>;
}
