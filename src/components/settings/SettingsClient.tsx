"use client";

import { useState, useTransition } from "react";
import { updateSettingsBatch, changePosPin } from "@/actions/settings";

type Props = {
  initial: Record<string, string>;
  defaults: {
    bill_html_template: string;
    email_bill_template: string;
    sms_bill_template: string;
    sms_ready_template: string;
  };
};

export default function SettingsClient({ initial, defaults }: Props) {
  const [company_name, setCompanyName] = useState(initial.company_name ?? "Pepperr");
  const [company_address, setCompanyAddress] = useState(initial.company_address ?? "");
  const [company_phone, setCompanyPhone] = useState(initial.company_phone ?? "");
  const [logo_url, setLogoUrl] = useState(initial.logo_url ?? "");
  const [bill_html_template, setBillHtml] = useState(initial.bill_html_template || defaults.bill_html_template);
  const [email_bill_template, setEmailTpl] = useState(initial.email_bill_template || defaults.email_bill_template);
  const [sms_bill_template, setSmsBill] = useState(initial.sms_bill_template || defaults.sms_bill_template);
  const [sms_ready_template, setSmsReady] = useState(initial.sms_ready_template || defaults.sms_ready_template);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [curPin, setCurPin] = useState("");
  const [nextPin, setNextPin] = useState("");
  const [pinMsg, setPinMsg] = useState<string | null>(null);

  function saveBranding() {
    setMsg(null);
    startTransition(async () => {
      const res = await updateSettingsBatch({
        company_name,
        company_address,
        company_phone,
        logo_url,
        bill_html_template,
        email_bill_template,
        sms_bill_template,
        sms_ready_template,
      });
      setMsg(res.ok ? "Saved." : res.error);
    });
  }

  function savePin() {
    setPinMsg(null);
    startTransition(async () => {
      const res = await changePosPin(curPin, nextPin);
      setPinMsg(res.ok ? "Passcode updated." : res.error);
      if (res.ok) {
        setCurPin("");
        setNextPin("");
      }
    });
  }

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-pepperr-border bg-pepperr-card p-6 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-pepperr-ink">Company profile</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-pepperr-muted md:col-span-2">
            Trading name
            <input
              className="mt-1 w-full rounded-2xl border border-pepperr-border-strong bg-pepperr-cream px-3 py-2 text-sm"
              value={company_name}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </label>
          <label className="text-sm text-pepperr-muted md:col-span-2">
            Address (multi-line)
            <textarea
              className="mt-1 w-full rounded-2xl border border-pepperr-border-strong bg-pepperr-cream px-3 py-2 text-sm"
              rows={3}
              value={company_address}
              onChange={(e) => setCompanyAddress(e.target.value)}
            />
          </label>
          <label className="text-sm text-pepperr-muted">
            Phone / hotline
            <input
              className="mt-1 w-full rounded-2xl border border-pepperr-border-strong bg-pepperr-cream px-3 py-2 text-sm"
              value={company_phone}
              onChange={(e) => setCompanyPhone(e.target.value)}
            />
          </label>
          <label className="text-sm text-pepperr-muted">
            Logo URL
            <input
              className="mt-1 w-full rounded-2xl border border-pepperr-border-strong bg-pepperr-cream px-3 py-2 text-sm"
              value={logo_url}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://"
            />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-pepperr-border bg-pepperr-card p-6 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-pepperr-ink">Printed bill (HTML)</h2>
        <p className="mt-1 text-sm text-pepperr-muted">
          Safe HTML snippet. Keys include <code className="font-mono text-xs">line_rows</code>,{" "}
          <code className="font-mono text-xs">logo_block</code>, <code className="font-mono text-xs">scheduled_block</code>.
        </p>
        <textarea
          className="mt-3 h-64 w-full rounded-2xl border border-pepperr-border-strong bg-pepperr-cream p-3 font-mono text-xs leading-relaxed"
          value={bill_html_template}
          onChange={(e) => setBillHtml(e.target.value)}
        />
      </section>

      <section className="rounded-3xl border border-pepperr-border bg-pepperr-card p-6 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-pepperr-ink">Email bill (plain text)</h2>
        <p className="mt-1 text-sm text-pepperr-muted">Optional first line: Subject: …</p>
        <textarea
          className="mt-3 h-48 w-full rounded-2xl border border-pepperr-border-strong bg-pepperr-cream p-3 font-mono text-xs leading-relaxed"
          value={email_bill_template}
          onChange={(e) => setEmailTpl(e.target.value)}
        />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-pepperr-border bg-pepperr-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-pepperr-ink">SMS — bill</h2>
          <textarea
            className="mt-3 h-40 w-full rounded-2xl border border-pepperr-border-strong bg-pepperr-cream p-3 font-mono text-xs"
            value={sms_bill_template}
            onChange={(e) => setSmsBill(e.target.value)}
          />
        </div>
        <div className="rounded-3xl border border-pepperr-border bg-pepperr-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-pepperr-ink">SMS — order ready</h2>
          <textarea
            className="mt-3 h-40 w-full rounded-2xl border border-pepperr-border-strong bg-pepperr-cream p-3 font-mono text-xs"
            value={sms_ready_template}
            onChange={(e) => setSmsReady(e.target.value)}
          />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={saveBranding}
          className="rounded-2xl bg-pepperr-ember px-6 py-3 text-sm font-semibold text-white hover:bg-pepperr-ember-dark disabled:opacity-50"
        >
          Save templates & profile
        </button>
        {msg && <p className="self-center text-sm text-pepperr-sage">{msg}</p>}
      </div>

      <section className="rounded-3xl border border-pepperr-border bg-pepperr-card p-6 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-pepperr-ink">Change POS passcode</h2>
        <p className="mt-1 text-sm text-pepperr-muted">Requires the current passcode. Minimum four characters for the new one.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            type="password"
            className="rounded-2xl border border-pepperr-border-strong bg-pepperr-cream px-3 py-2 text-sm"
            placeholder="Current passcode"
            value={curPin}
            onChange={(e) => setCurPin(e.target.value)}
          />
          <input
            type="password"
            className="rounded-2xl border border-pepperr-border-strong bg-pepperr-cream px-3 py-2 text-sm"
            placeholder="New passcode"
            value={nextPin}
            onChange={(e) => setNextPin(e.target.value)}
          />
        </div>
        <button
          type="button"
          disabled={pending || !curPin || !nextPin}
          onClick={savePin}
          className="mt-4 rounded-2xl bg-pepperr-ink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Update passcode
        </button>
        {pinMsg && <p className="mt-3 text-sm text-pepperr-sage">{pinMsg}</p>}
      </section>
    </div>
  );
}
