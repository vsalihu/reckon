"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Income & goals" },
  { href: "/tax-tools", label: "Tax tools" },
  { href: "/overview", label: "Overview" },
  { href: "/calculators/car", label: "Car" },
  { href: "/calculators/house", label: "House" },
  { href: "/spending", label: "Spending" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 overflow-x-auto">
      {LINKS.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors ${
              isActive ? "bg-accent text-accent-foreground" : "text-foreground-muted hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
