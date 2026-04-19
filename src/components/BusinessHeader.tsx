"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export function BusinessHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-pepperr-border bg-pepperr-card/90 backdrop-blur">
      <div className="mx-auto flex min-w-0 max-w-[1600px] items-center justify-between gap-3 px-3 py-3 sm:gap-4 sm:px-4 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="font-display shrink-0 text-base font-semibold tracking-tight text-pepperr-ink hover:text-pepperr-ember sm:text-lg"
          >
            Pepperr
          </Link>
          <span className="shrink-0 text-pepperr-muted">/</span>
          <span className="truncate text-sm font-medium text-pepperr-muted">{title}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ThemeToggle compact />
          <Link
            href="/"
            className="rounded-xl px-2 py-2 text-sm text-pepperr-muted hover:bg-pepperr-ink/[0.06] hover:text-pepperr-ink sm:px-3"
          >
            Menu
          </Link>
          <button
            type="button"
            className="rounded-xl border border-pepperr-border-strong bg-pepperr-card px-2 py-2 text-xs font-medium text-pepperr-ink hover:bg-pepperr-ink/[0.06] sm:px-3 sm:text-sm"
            onClick={async () => {
              await fetch("/api/pos/logout", { method: "POST" });
              window.location.href = "/";
            }}
          >
            Lock / sign out
          </button>
        </div>
      </div>
    </header>
  );
}
