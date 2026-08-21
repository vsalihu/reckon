"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signInWithEmail } from "@/lib/auth/actions";
import { AuthCard } from "@/components/auth-card";
import { SubmitButton } from "@/components/submit-button";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: "Google sign-in couldn't be started. Please try again.",
  auth_failed: "That sign-in link is invalid or has expired.",
  missing_code: "That sign-in link is invalid or has expired.",
};

export default function SignInPage() {
  const [state, action] = useActionState(signInWithEmail, {});

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to keep tracking your goals.">
      <Suspense fallback={null}>
        <OAuthErrorBanner />
      </Suspense>

      <form action={action} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm text-foreground-muted">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm text-foreground-muted">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
          />
        </div>
        {state.error ? <p className="text-sm text-negative">{state.error}</p> : null}
        <SubmitButton>Sign in</SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-foreground-muted">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-accent hover:underline">
          Create one
        </Link>
      </p>
    </AuthCard>
  );
}

function OAuthErrorBanner() {
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  if (!oauthError) return null;

  return (
    <p className="mb-4 rounded-lg border border-negative/30 bg-negative/10 px-3 py-2 text-sm text-negative">
      {OAUTH_ERROR_MESSAGES[oauthError] ?? "Something went wrong. Please try again."}
    </p>
  );
}
