import { BusinessHeader } from "@/components/BusinessHeader";
import { getSettingsMap } from "@/lib/settings-read";
import SettingsClient from "@/components/settings/SettingsClient";
import {
  defaultBillHtml,
  defaultEmailBill,
  defaultSmsBill,
  defaultSmsReady,
} from "@/lib/templates";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettingsMap();
  return (
    <div className="min-h-screen bg-pepperr-cream">
      <BusinessHeader title="Settings" />
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-6">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-pepperr-ink">Branding & templates</h1>
          <p className="mt-2 text-pepperr-muted">
            Control what appears on printed bills and outbound messages. Use placeholders like{" "}
            <code className="rounded bg-pepperr-border px-1 font-mono text-xs">{"{{company_name}}"}</code>,{" "}
            <code className="rounded bg-pepperr-border px-1 font-mono text-xs">{"{{total_lkr}}"}</code>,{" "}
            <code className="rounded bg-pepperr-border px-1 font-mono text-xs">{"{{customer_name}}"}</code>,{" "}
            <code className="rounded bg-pepperr-border px-1 font-mono text-xs">{"{{lines_text}}"}</code>, and more (same keys
            as the HTML bill).
          </p>
        </header>
        <SettingsClient
          initial={settings}
          defaults={{
            bill_html_template: defaultBillHtml,
            email_bill_template: defaultEmailBill,
            sms_bill_template: defaultSmsBill,
            sms_ready_template: defaultSmsReady,
          }}
        />
      </div>
    </div>
  );
}
