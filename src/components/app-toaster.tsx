"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

/**
 * Single Toaster, mounted once at the root (per Sonner's own guidance).
 * Styled to match the ledger surfaces/border/ink tokens rather than
 * Sonner's defaults, and tracks the resolved theme so it never renders
 * light toasts in dark mode or vice versa.
 */
export function AppToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "!bg-surface !border-border !text-foreground !rounded-2xl !shadow-lg",
          title: "!font-display !text-foreground",
          description: "!text-foreground-muted",
        },
      }}
    />
  );
}
