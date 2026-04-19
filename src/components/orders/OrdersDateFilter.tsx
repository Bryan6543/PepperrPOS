"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function OrdersDateFilter({ defaultFrom, defaultTo }: { defaultFrom: string; defaultTo: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(sp.toString());
    if (from) next.set("from", from);
    else next.delete("from");
    if (to) next.set("to", to);
    else next.delete("to");
    next.delete("page");
    router.push(`/orders?${next.toString()}`);
  }

  function clear() {
    setFrom("");
    setTo("");
    router.push("/orders");
  }

  return (
    <form onSubmit={apply} className="flex flex-wrap items-end gap-3">
      <label className="text-sm text-pepperr-muted">
        From
        <input
          type="date"
          className="mt-1 block rounded-xl border border-pepperr-border-strong bg-pepperr-cream px-3 py-2 text-sm text-pepperr-ink"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
      </label>
      <label className="text-sm text-pepperr-muted">
        To
        <input
          type="date"
          className="mt-1 block rounded-xl border border-pepperr-border-strong bg-pepperr-cream px-3 py-2 text-sm text-pepperr-ink"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </label>
      <button
        type="submit"
        className="rounded-2xl bg-pepperr-ember px-5 py-2.5 text-sm font-semibold text-white hover:bg-pepperr-ember-dark"
      >
        Apply
      </button>
      <button type="button" onClick={clear} className="text-sm text-pepperr-muted hover:text-pepperr-ink">
        Clear dates
      </button>
    </form>
  );
}
