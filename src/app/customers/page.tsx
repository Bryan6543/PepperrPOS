import Link from "next/link";
import { BusinessHeader } from "@/components/BusinessHeader";
import { listCustomersPage } from "@/actions/customers";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1") || 1;
  const { rows, total } = await listCustomersPage({ page, pageSize: 20 });
  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="min-h-screen bg-pepperr-cream">
      <BusinessHeader title="Customers" />
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 lg:px-6">
        <header>
          <h1 className="font-display text-3xl font-semibold text-pepperr-ink">Guests & regulars</h1>
          <p className="mt-2 text-pepperr-muted">Search returning visitors in POS; this list shows recent profiles.</p>
        </header>

        <div className="overflow-hidden rounded-3xl border border-pepperr-border bg-pepperr-card shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-pepperr-cream/80 text-xs uppercase tracking-wide text-pepperr-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-pepperr-border">
                  <td className="px-4 py-3 font-medium text-pepperr-ink">{c.name}</td>
                  <td className="px-4 py-3 text-pepperr-muted">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-pepperr-muted">{c.email ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/customers/${c.id}`} className="text-pepperr-ember hover:underline">
                      History
                    </Link>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-pepperr-muted">
                    No customers yet — save one from the POS screen.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-center gap-3 text-sm">
            {page > 1 && (
              <Link href={`/customers?page=${page - 1}`} className="rounded-full border border-pepperr-border-strong px-4 py-2 hover:bg-pepperr-ink/[0.06]">
                Previous
              </Link>
            )}
            <span className="text-pepperr-muted">
              Page {page} of {pages}
            </span>
            {page < pages && (
              <Link href={`/customers?page=${page + 1}`} className="rounded-full border border-pepperr-border-strong px-4 py-2 hover:bg-pepperr-ink/[0.06]">
                Next
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
