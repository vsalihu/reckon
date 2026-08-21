"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUpWithEmail, signInWithGoogle } from "@/lib/auth/actions";
import { AuthCard } from "@/components/auth-card";
import { CurrencySelect } from "@/components/currency-select";
import { SubmitButton } from "@/components/submit-button";
import type { CurrencyCode } from "@/lib/currency";

export default function SignUpPage() {
  const [currency, setCurrency] = useState<CurrencyCode>("GBP");
  const [emailState, emailAction] = useActionState(signUpWithEmail, {});
  const [googleState, googleAction] = useActionState(signInWithGoogle, {});

  return (
    <AuthCard title="Create your account" subtitle="Track income, hit savings goals — free.">
      <div className="mb-4">
        <CurrencySelect value={currency} onChange={setCurrency} />
      </div>

      <form action={googleAction}>
        <input type="hidden" name="currency" value={currency} />
        <GoogleButton />
        {googleState.error ? <p className="mt-2 text-sm text-negative">{googleState.error}</p> : null}
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-foreground-muted">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={emailAction} className="flex flex-col gap-4">
        <input type="hidden" name="currency" value={currency} />
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
            minLength={8}
            autoComplete="new-password"
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground outline-none focus:border-accent"
          />
        </div>
        {emailState.error ? <p className="text-sm text-negative">{emailState.error}</p> : null}
        <SubmitButton>Create account</SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-foreground-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}

function GoogleButton() {
  return (
    <button
      type="submit"
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-5 font-medium text-foreground transition-colors hover:border-accent"
    >
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" aria-hidden>
        <path
          fill="#4285F4"
          d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24Z"
        />
        <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.27a12 12 0 0 0 0 10.76l4-3.1Z" />
        <path
          fill="#EA4335"
          d="M12 4.75c1.76 0 3.35.6 4.6 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.1C6.22 6.86 8.87 4.75 12 4.75Z"
        />
      </svg>
      Continue with Google
    </button>
  );
}
