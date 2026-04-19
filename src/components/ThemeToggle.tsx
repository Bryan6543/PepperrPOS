"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type Props = {
  /** Smaller control for dense headers */
  compact?: boolean;
};

export function ThemeToggle({ compact }: Props) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span
        className={`inline-flex rounded-xl border border-pepperr-border-strong bg-pepperr-card ${compact ? "h-9 w-[4.5rem]" : "h-10 w-[5.25rem]"}`}
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";
  const pad = compact ? "px-1.5 py-1" : "px-2 py-1.5";
  const icon = compact ? "h-4 w-4" : "h-4 w-4";

  return (
    <div
      className={`inline-flex rounded-xl border border-pepperr-border-strong bg-pepperr-card p-0.5 shadow-sm ${compact ? "" : "gap-0.5"}`}
      role="group"
      aria-label="Theme"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`flex flex-1 items-center justify-center rounded-lg ${pad} transition ${
          !isDark ? "bg-pepperr-ember text-white shadow-sm" : "text-pepperr-muted hover:bg-pepperr-ink/[0.06]"
        }`}
        title="Light theme"
        aria-pressed={!isDark}
      >
        <SunIcon className={icon} />
        {!compact && <span className="ml-1 hidden text-xs font-medium sm:inline">Light</span>}
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`flex flex-1 items-center justify-center rounded-lg ${pad} transition ${
          isDark ? "bg-pepperr-ink text-pepperr-cream shadow-sm" : "text-pepperr-muted hover:bg-pepperr-ink/[0.06]"
        }`}
        title="Dark theme"
        aria-pressed={isDark}
      >
        <MoonIcon className={icon} />
        {!compact && <span className="ml-1 hidden text-xs font-medium sm:inline">Dark</span>}
      </button>
    </div>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
