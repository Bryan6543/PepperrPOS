import Link from "next/link";
import { notFound } from "next/navigation";
import { BusinessHeader } from "@/components/BusinessHeader";
import { OrderReprintButton } from "@/components/orders/OrderReprintButton";
import { getOrderDetail } from "@/actions/orders";
import { formatDate, formatLkr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getOrderDetail(id);
  if (!data) notFound();
  const { order, items, customer } = data;

  return (
    <div className="min-h-screen bg-pepperr-cream">
      <BusinessHeader title="Order detail" />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 lg:px-6">
        <Link href="/orders" className="text-sm text-pepperr-ember hover:underline">
          ← All orders
        </Link>

        <header className="rounded-3xl border border-pepperr-border bg-pepperr-card p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-pepperr-muted">Order number</p>
          <h1 className="font-display mt-1 text-4xl font-semibold text-pepperr-ink">
            {order.order_number != null ? `#${order.order_number}` : "Order"}
          </h1>
          <p className="mt-2 text-sm text-pepperr-muted">{formatDate(order.created_at)}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-pepperr-cream px-3 py-1 capitalize text-pepperr-muted">
              {order.order_type.replaceAll("_", " ")}
            </span>
            <span className="rounded-full bg-pepperr-cream px-3 py-1 uppercase text-pepperr-muted">{order.payment_method}</span>
            <span className="rounded-full bg-pepperr-cream px-3 py-1 font-semibold text-pepperr-ink">{formatLkr(order.total_lkr)}</span>
          </div>
          {order.scheduled_for && (
            <p className="mt-3 text-sm text-pepperr-muted">
              Scheduled: <span className="text-pepperr-ink">{formatDate(order.scheduled_for)}</span>
            </p>
          )}
          {order.notes && (
            <p className="mt-3 rounded-2xl bg-pepperr-cream/80 px-3 py-2 text-sm text-pepperr-ink">
              <span className="text-pepperr-muted">Notes: </span>
              {order.notes}
            </p>
          )}
        </header>

        {customer && (
          <section className="rounded-3xl border border-pepperr-border bg-pepperr-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-pepperr-ink">Customer</h2>
            <p className="mt-2 text-pepperr-ink">
              <Link href={`/customers/${customer.id}`} className="font-medium text-pepperr-ember hover:underline">
                {customer.name}
              </Link>
            </p>
            <p className="mt-1 text-sm text-pepperr-muted">
              {[customer.phone, customer.email].filter(Boolean).join(" · ") || "No phone or email"}
            </p>
          </section>
        )}

        <section className="rounded-3xl border border-pepperr-border bg-pepperr-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-pepperr-ink">Line items</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((it) => (
              <li key={it.id} className="flex justify-between gap-4 border-b border-pepperr-border py-2 last:border-0">
                <span className="text-pepperr-ink">
                  {it.quantity}× {it.product_name}
                </span>
                <span className="shrink-0 tabular-nums text-pepperr-muted">{formatLkr(it.unit_price_lkr * it.quantity)}</span>
              </li>
            ))}
          </ul>
        </section>

        <OrderReprintButton orderId={order.id} />
      </div>
    </div>
  );
}
