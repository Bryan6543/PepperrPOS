import { BusinessHeader } from "@/components/BusinessHeader";
import ReportsClient from "@/components/reports/ReportsClient";

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-pepperr-cream">
      <BusinessHeader title="Sales reports" />
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-6">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-pepperr-ink">Performance</h1>
          <p className="mt-2 text-pepperr-muted">Slice totals by day, week, month, or any custom window.</p>
        </header>
        <ReportsClient />
      </div>
    </div>
  );
}
