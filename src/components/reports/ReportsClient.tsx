"use client";

import { useMemo, useState, useTransition } from "react";
import { endOfDay, endOfMonth, startOfDay, startOfMonth, subDays, subMonths } from "date-fns";
import { getSalesReport, type ReportBucket } from "@/actions/reports";
import { formatLkr } from "@/lib/format";

type Preset = "today" | "week" | "month" | "custom";

export default function ReportsClient() {
  const [preset, setPreset] = useState<Preset>("today");
  const [from, setFrom] = useState(() => toInputDate(startOfDay(new Date())));
  const [to, setTo] = useState(() => toInputDate(endOfDay(new Date())));
  const [data, setData] = useState<ReportBucket | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const rangeIso = useMemo(() => {
    const fromDate = startOfDay(new Date(from + "T00:00:00"));
    const toDate = endOfDay(new Date(to + "T00:00:00"));
    return { fromIso: fromDate.toISOString(), toIso: toDate.toISOString() };
  }, [from, to]);

  function applyPreset(p: Preset) {
    setPreset(p);
    const now = new Date();
    if (p === "today") {
      setFrom(toInputDate(startOfDay(now)));
      setTo(toInputDate(endOfDay(now)));
    } else if (p === "week") {
      setFrom(toInputDate(startOfDay(subDays(now, 6))));
      setTo(toInputDate(endOfDay(now)));
    } else if (p === "month") {
      setFrom(toInputDate(startOfMonth(now)));
      setTo(toInputDate(endOfMonth(now)));
    } else if (p === "custom") {
      setFrom(toInputDate(startOfMonth(subMonths(now, 1))));
      setTo(toInputDate(endOfDay(now)));
    }
  }

  function load() {
    setErr(null);
    startTransition(async () => {
      const res = await getSalesReport(rangeIso);
      if ("error" in res) {
        setErr(res.error);
        setData(null);
        return;
      }
      setData(res);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["today", "Today"],
            ["week", "Last 7 days"],
            ["month", "This month"],
            ["custom", "Custom"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => applyPreset(id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              preset === id ? "bg-pepperr-ink text-white" : "bg-pepperr-card text-pepperr-ink shadow-sm hover:bg-pepperr-ink/[0.06]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-3xl border border-pepperr-border bg-pepperr-card p-5 shadow-sm">
        <label className="text-sm text-pepperr-muted">
          From
          <input
            type="date"
            className="mt-1 block rounded-xl border border-pepperr-border-strong bg-pepperr-cream px-3 py-2 text-sm"
            value={from}
            onChange={(e) => {
              setPreset("custom");
              setFrom(e.target.value);
            }}
          />
        </label>
        <label className="text-sm text-pepperr-muted">
          To
          <input
            type="date"
            className="mt-1 block rounded-xl border border-pepperr-border-strong bg-pepperr-cream px-3 py-2 text-sm"
            value={to}
            onChange={(e) => {
              setPreset("custom");
              setTo(e.target.value);
            }}
          />
        </label>
        <button
          type="button"
          disabled={pending}
          onClick={load}
          className="rounded-2xl bg-pepperr-ember px-5 py-2.5 text-sm font-semibold text-white hover:bg-pepperr-ember-dark disabled:opacity-50"
        >
          {pending ? "Loading…" : "Run report"}
        </button>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      {data && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-pepperr-border bg-pepperr-card p-6 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-pepperr-muted">Orders</p>
            <p className="mt-2 font-display text-4xl font-semibold text-pepperr-ink">{data.order_count}</p>
            <p className="mt-4 text-xs uppercase tracking-wide text-pepperr-muted">Gross sales</p>
            <p className="mt-2 font-display text-3xl font-semibold text-pepperr-ember">{formatLkr(data.total_lkr)}</p>
          </div>
          <div className="rounded-3xl border border-pepperr-border bg-pepperr-card p-6 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-pepperr-muted">By payment</p>
            <ul className="mt-4 space-y-3 text-sm">
              {(["cash", "card", "credit"] as const).map((pm) => (
                <li key={pm} className="flex items-center justify-between rounded-2xl bg-pepperr-cream/80 px-3 py-2">
                  <span className="font-medium capitalize text-pepperr-ink">{pm}</span>
                  <span className="text-pepperr-muted">
                    {data.by_payment[pm].count} orders · {formatLkr(data.by_payment[pm].total_lkr)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}
