"use client";

import { useState, useTransition } from "react";
import { getOrderForPrint } from "@/actions/orders";

export function OrderReprintButton({ orderId }: { orderId: string }) {
  const [billHtml, setBillHtml] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function print() {
    setErr(null);
    startTransition(async () => {
      const r = await getOrderForPrint(orderId);
      if ("error" in r) {
        setErr(r.error);
        return;
      }
      setBillHtml(r.bill_html);
      setTimeout(() => window.print(), 150);
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={pending}
        onClick={print}
        className="rounded-2xl border border-pepperr-border-strong bg-pepperr-card px-5 py-2.5 text-sm font-semibold text-pepperr-ink hover:bg-pepperr-ink/[0.06] disabled:opacity-50"
      >
        {pending ? "Loading…" : "Print receipt"}
      </button>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {billHtml && (
        <div className="min-w-0 max-w-full">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-pepperr-muted">Receipt preview</p>
          <div
            id="printable-bill"
            className="max-h-[480px] min-w-0 max-w-full overflow-x-auto overflow-y-auto break-words rounded-3xl border border-pepperr-border-strong bg-pepperr-card p-4 shadow-inner [&_img]:max-h-48 [&_img]:max-w-full [&_img]:object-contain [&_table]:max-w-full"
            dangerouslySetInnerHTML={{ __html: billHtml }}
          />
        </div>
      )}
    </div>
  );
}
