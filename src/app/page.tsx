import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-6">
        <span className="font-display text-lg text-foreground">Reckon</span>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center px-4 pb-24">
        <h1 className="font-display text-4xl leading-tight text-foreground sm:text-5xl">
          Know what you earn.
          <br />
          Save what you mean to.
        </h1>
        <p className="mt-5 max-w-md text-base text-foreground-muted">
          Log your income, see an accurate UK take-home estimate, and track savings goals against what you&apos;re
          actually earning — not just the calendar.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/sign-up"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-6 font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border px-6 font-medium text-foreground transition-colors hover:border-accent"
          >
            Sign in
          </Link>
        </div>
      </main>
    </div>
  );
}
