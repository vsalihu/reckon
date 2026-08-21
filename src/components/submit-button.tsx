"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";

export function SubmitButton({ children, className = "", ...props }: ComponentProps<"button">) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex h-11 w-full items-center justify-center rounded-lg bg-accent px-5 font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60 ${className}`}
      {...props}
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}
