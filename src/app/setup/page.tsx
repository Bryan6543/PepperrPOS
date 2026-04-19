import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function SetupPage() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <h1 className="font-display text-3xl font-semibold text-pepperr-ink">Finish setup</h1>
      <p className="mt-3 text-pepperr-muted">
        Protected screens need a strong signing secret for the POS gate cookie. Add the following to{" "}
        <code className="rounded bg-pepperr-border px-1.5 py-0.5 font-mono text-sm">.env.local</code> and restart the dev
        server.
      </p>
      <pre className="mt-6 overflow-x-auto rounded-2xl bg-pepperr-ink p-4 text-xs text-white">
{`POS_SESSION_SECRET=replace_with_a_long_random_string

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional — email bills (https://resend.com)
RESEND_API_KEY=
RESEND_FROM_EMAIL="Pepperr <onboarding@resend.dev>"

# Optional — SMS (https://www.twilio.com)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=`}
      </pre>
      <p className="mt-4 text-sm text-pepperr-muted">
        Then run the SQL in <code className="font-mono">supabase/schema.sql</code> inside the Supabase SQL editor.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center rounded-2xl bg-pepperr-ember px-5 py-3 text-sm font-semibold text-white hover:bg-pepperr-ember-dark"
      >
        Back to menu
      </Link>
    </main>
  );
}
