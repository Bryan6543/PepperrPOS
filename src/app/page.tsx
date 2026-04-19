import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

const tiles = [
  {
    href: "/pos",
    title: "POS",
    desc: "Take orders, print bills, and checkout.",
    accent: "from-pepperr-ember to-pepperr-ember-dark",
  },
  {
    href: "/customers",
    title: "Customers",
    desc: "Search guests, history, and contact details.",
    accent: "from-pepperr-sage to-emerald-900",
  },
  {
    href: "/orders",
    title: "Orders",
    desc: "Review tickets, order numbers, and reprint receipts.",
    accent: "from-sky-600 to-indigo-900",
  },
  {
    href: "/reports",
    title: "Sales",
    desc: "Daily, weekly, monthly, or custom ranges.",
    accent: "from-pepperr-gold to-amber-800",
  },
  {
    href: "/settings",
    title: "Settings",
    desc: "Logo, address, templates, passcode, and more.",
    accent: "from-zinc-700 to-pepperr-ink",
  },
];

export default function HomePage() {
  const configured = isSupabaseConfigured();
  return (
    <main className="relative min-h-screen bg-gradient-to-b from-pepperr-cream via-pepperr-card to-pepperr-cream">
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <div className="mx-auto max-w-5xl px-6 py-16">
        <header className="mb-14 text-center">
          <p className="font-display text-sm uppercase tracking-[0.35em] text-pepperr-muted">Restaurant suite</p>
          <h1 className="font-display mt-3 text-5xl font-semibold text-pepperr-ink md:text-6xl">Pepperr</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-pepperr-muted">
            One calm home screen for billing, regulars, sales, and branded receipts.
          </p>
          {!configured && (
            <p className="mx-auto mt-6 max-w-xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-100">
              Supabase environment variables are missing. Open the{" "}
              <Link href="/setup" className="font-medium text-amber-950 underline dark:text-amber-200">
                setup checklist
              </Link>
              , add your keys to <code className="font-mono">.env.local</code>, then restart{" "}
              <code className="font-mono">npm run dev</code>.
            </p>
          )}
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          {tiles.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="group relative overflow-hidden rounded-3xl border border-pepperr-border bg-pepperr-card p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br opacity-30 blur-2xl ${t.accent}`}
              />
              <h2 className="font-display text-2xl font-semibold text-pepperr-ink">{t.title}</h2>
              <p className="mt-2 text-pepperr-muted">{t.desc}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-pepperr-ember">
                Open
                <span aria-hidden className="transition group-hover:translate-x-1">
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>

        <footer className="mt-16 text-center text-xs text-pepperr-muted">
          Passcode protects POS and back-office sections. Configure SMS/email providers in environment variables when you are ready.
        </footer>
      </div>
    </main>
  );
}
