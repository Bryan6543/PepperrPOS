"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function UnlockForm() {
  const router = useRouter();
  const search = useSearchParams();
  const nextPath = search.get("next") || "/pos";
  const [pin, setPin] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/pos/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setErr(data.error || "Could not unlock.");
        setLoading(false);
        return;
      }
      router.replace(nextPath);
      router.refresh();
    } catch {
      setErr("Network error.");
    }
    setLoading(false);
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-pepperr-cream px-6">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-3xl border border-pepperr-border bg-pepperr-card p-10 shadow-xl">
        <p className="font-display text-xs uppercase tracking-[0.3em] text-pepperr-muted">Pepperr</p>
        <h1 className="font-display mt-2 text-3xl font-semibold text-pepperr-ink">Enter POS passcode</h1>
        <p className="mt-2 text-sm text-pepperr-muted">Employees need the passcode to open billing and back office.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="w-full rounded-2xl border border-pepperr-border-strong bg-pepperr-cream px-4 py-3 text-lg tracking-widest text-pepperr-ink outline-none ring-pepperr-ember focus:ring-2"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button
            type="submit"
            disabled={loading || !pin}
            className="w-full rounded-2xl bg-pepperr-ember py-3 text-sm font-semibold text-white hover:bg-pepperr-ember-dark disabled:opacity-50"
          >
            {loading ? "Checking…" : "Unlock"}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-pepperr-muted">
          After running <code className="font-mono">supabase/schema.sql</code>, the starter passcode is{" "}
          <code className="font-mono">pepperr</code> — change it under Settings.
        </p>
        <Link href="/" className="mt-4 block text-center text-sm text-pepperr-ember hover:underline">
          ← App menu
        </Link>
      </div>
    </main>
  );
}
