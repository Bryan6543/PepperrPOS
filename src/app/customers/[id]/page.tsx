import Link from "next/link";
import { notFound } from "next/navigation";
import { BusinessHeader } from "@/components/BusinessHeader";
import { getCustomerWithHistory } from "@/actions/customers";
import { formatDate, formatLkr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getCustomerWithHistory(id);
  if (!data) notFound();
  const { customer, orders } = data;

  return (
    <div className="min-h-screen bg-pepperr-cream">
      <BusinessHeader title="Customer" />
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 lg:px-6">
        <Link href="/customers" className="text-sm text-pepperr-ember hover:underline">
          ← All customers
        </Link>
        <header className="rounded-3xl border border-pepperr-border bg-pepperr-card p-8 shadow-sm">
          <h1 className="font-display text-3xl font-semibold text-pepperr-ink">{customer.name}</h1>
          <div className="mt-3 space-y-1 text-sm text-pepperr-muted">
            {customer.phone && <p>Phone: {customer.phone}</p>}
            {customer.email && <p>Email: {customer.email}</p>}
            {!customer.phone && !customer.email && <p>No phone or email on file.</p>}
            {customer.notes && <p className="text-pepperr-ink">Notes: {customer.notes}</p>}
          </div>
        </header>

        <section>
          <h2 className="font-display text-xl font-semibold text-pepperr-ink">Purchase history</h2>
          <div className="mt-4 space-y-4">
            {orders.map((o) => (
              <article key={o.id} className="rounded-3xl border border-pepperr-border bg-pepperr-card p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-pepperr-ink">{formatDate(o.created_at)}</span>
                  <span className="rounded-full bg-pepperr-cream px-3 py-1 text-xs font-semibold uppercase text-pepperr-muted">
                    {o.payment_method}
                  </span>
                  <span className="rounded-full bg-pepperr-cream px-3 py-1 text-xs font-semibold text-pepperr-muted">
                    {o.order_type.replaceAll("_", " ")}
                  </span>
                  <span className="text-base font-semibold text-pepperr-ink">{formatLkr(o.total_lkr)}</span>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-pepperr-muted">
                  {o.items.map((it) => (
                    <li key={it.id}>
                      {it.quantity}× {it.product_name} — {formatLkr(it.unit_price_lkr * it.quantity)}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
            {!orders.length && <p className="text-pepperr-muted">No orders linked yet.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
