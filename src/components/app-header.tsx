import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader({ email }: { email?: string | null }) {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="font-display text-2xl text-foreground">
            Reckon
          </Link>
          {email ? <p className="text-sm text-foreground-muted">{email}</p> : null}
        </div>
        <ThemeToggle />
      </div>
      <AppNav />
    </header>
  );
}
