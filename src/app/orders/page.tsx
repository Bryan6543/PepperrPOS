import Link from "next/link";
import { endOfDay, startOfDay } from "date-fns";
import { BusinessHeader } from "@/components/BusinessHeader";
import { OrdersDateFilter } from "@/components/orders/OrdersDateFilter";
import { listOrdersPage } from "@/actions/orders";
import { formatDate, formatLkr } from "@/lib/format";

export const dynamic = "force-dynamic";

function toStartIso(dateStr: string | undefined): string | null {
  if (!dateStr?.trim()) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  return startOfDay(d).toISOString();
}

function toEndIso(dateStr: string | undefined): string | null {
  if (!dateStr?.trim()) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  return endOfDay(d).toISOString();
}

function ordersQueryString(sp: { from?: string; to?: string }, pageNum: number): string {
  const q = new URLSearchParams();
  if (sp.from) q.set("from", sp.from);
  if (sp.to) q.set("to", sp.to);
  if (pageNum > 1) q.set("page", String(pageNum));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const fromIso = toStartIso(sp.from);
  const toIso = toEndIso(sp.to);
  const { rows, total } = await listOrdersPage({ page, pageSize: 25, fromIso, toIso });
  const pages = Math.max(1, Math.ceil(total / 25));
  const qBase = { from: sp.from, to: sp.to };

  return (
    <div className="min-h-screen bg-pepperr-cream">
      <BusinessHeader title="Orders" />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 lg:px-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-pepperr-ink">Orders placed</h1>
            <p className="mt-1 text-pepperr-muted">Browse tickets by date. Order numbers are sequential for staff and guests.</p>
          </div>
          <Link href="/pos" className="text-sm font-medium text-pepperr-ember hover:underline">
            → Open POS
          </Link>
        </header>

        <div className="rounded-3xl border border-pepperr-border bg-pepperr-card p-5 shadow-sm">
          <OrdersDateFilter key={`${sp.from ?? ""}-${sp.to ?? ""}`} defaultFrom={sp.from ?? ""} defaultTo={sp.to ?? ""} />
        </div>

        <div className="overflow-x-auto rounded-3xl border border-pepperr-border bg-pepperr-card shadow-sm">
          <table className="min-w-[720px] w-full text-left text-sm">
            <thead className="border-b border-pepperr-border bg-pepperr-cream/80 text-xs uppercase tracking-wide text-pepperr-muted">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Pay</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-t border-pepperr-border">
                  <td className="px-4 py-3 font-mono font-semibold text-pepperr-ink">
                    {o.order_number != null ? `#${o.order_number}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-pepperr-muted">{formatDate(o.created_at)}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-pepperr-ink">{o.customer_name ?? "Walk-in"}</td>
                  <td className="px-4 py-3 capitalize text-pepperr-muted">{o.order_type.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3 uppercase text-pepperr-muted">{o.payment_method}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-pepperr-ink">{formatLkr(o.total_lkr)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/orders/${o.id}`} className="font-medium text-pepperr-ember hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-pepperr-muted">
                    No orders in this range yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            {page > 1 && (
              <Link
                href={`/orders${ordersQueryString(qBase, page - 1)}`}
                className="rounded-full border border-pepperr-border-strong px-4 py-2 hover:bg-pepperr-ink/[0.06]"
              >
                Previous
              </Link>
            )}
            <span className="text-pepperr-muted">
              Page {page} of {pages} · {total} orders
            </span>
            {page < pages && (
              <Link
                href={`/orders${ordersQueryString(qBase, page + 1)}`}
                className="rounded-full border border-pepperr-border-strong px-4 py-2 hover:bg-pepperr-ink/[0.06]"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
