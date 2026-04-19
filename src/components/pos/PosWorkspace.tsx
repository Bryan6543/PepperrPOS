"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { GroupedCatalog } from "@/actions/catalog";
import { updateProductImage } from "@/actions/catalog";
import { createCheckoutOrder, type CartLine } from "@/actions/orders";
import { searchCustomers, createCustomer } from "@/actions/customers";
import type { Customer, OrderType, PaymentMethod, Product } from "@/types/db";

type Props = {
  catalog: GroupedCatalog;
  settings: Record<string, string>;
};

type CartEntry = { product: Product; quantity: number };

export default function PosWorkspace({ catalog, settings }: Props) {
  const [cart, setCart] = useState<Record<string, CartEntry>>({});
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(catalog[0]?.category.id ?? null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [custQuery, setCustQuery] = useState("");
  const [custHits, setCustHits] = useState<Customer[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [scheduledFor, setScheduledFor] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const [sendBillSms, setSendBillSms] = useState(false);
  const [sendBillEmail, setSendBillEmail] = useState(false);
  const [sendReadySms, setSendReadySms] = useState(false);
  const [billHtml, setBillHtml] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [imgProduct, setImgProduct] = useState<Product | null>(null);
  const [imgUrl, setImgUrl] = useState("");

  const activeProducts = useMemo(() => {
    const g = catalog.find((c) => c.category.id === activeCategoryId);
    return g?.products ?? [];
  }, [catalog, activeCategoryId]);

  const subtotal = useMemo(() => {
    return Object.values(cart).reduce((s, e) => s + e.product.price_lkr * e.quantity, 0);
  }, [cart]);

  useEffect(() => {
    if (!custQuery.trim()) {
      setCustHits([]);
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        const rows = await searchCustomers(custQuery);
        setCustHits(rows);
      })();
    }, 280);
    return () => clearTimeout(t);
  }, [custQuery]);

  const addLine = useCallback((p: Product) => {
    setCart((prev) => {
      const cur = prev[p.id];
      const nextQty = (cur?.quantity ?? 0) + 1;
      return { ...prev, [p.id]: { product: p, quantity: nextQty } };
    });
  }, []);

  const bump = (id: string, delta: number) => {
    setCart((prev) => {
      const cur = prev[id];
      if (!cur) return prev;
      const q = cur.quantity + delta;
      if (q <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { ...cur, quantity: q } };
    });
  };

  const lines: CartLine[] = useMemo(() => {
    return Object.values(cart).map((e) => ({
      product_id: e.product.id,
      product_name: e.product.name,
      unit_price_lkr: e.product.price_lkr,
      quantity: e.quantity,
    }));
  }, [cart]);

  function printBill() {
    window.print();
  }

  function checkout() {
    setStatus(null);
    setBillHtml(null);
    if (!lines.length) {
      setStatus("Cart is empty.");
      return;
    }
    if (orderType === "scheduled" && !scheduledFor) {
      setStatus("Pick a date and time for the future order.");
      return;
    }
    startTransition(async () => {
      const res = await createCheckoutOrder({
        lines,
        customer_id: customer?.id ?? null,
        order_type: orderType,
        scheduled_for: orderType === "scheduled" ? new Date(scheduledFor).toISOString() : null,
        payment_method: payment,
        notes: notes.trim() || null,
        send_bill_sms: sendBillSms,
        send_bill_email: sendBillEmail,
        send_ready_sms: sendReadySms,
      });
      if (!res.ok) {
        setStatus(res.error);
        return;
      }
      setBillHtml(res.bill_html);
      const bits = [
        res.notify.bill_sms && `Bill SMS: ${res.notify.bill_sms}`,
        res.notify.bill_email && `Bill email: ${res.notify.bill_email}`,
        res.notify.ready_sms && `Ready SMS: ${res.notify.ready_sms}`,
      ].filter(Boolean);
      setStatus(["Order saved.", ...bits].join(" "));
      setCart({});
      setNotes("");
      setSendBillSms(false);
      setSendBillEmail(false);
      setSendReadySms(false);
    });
  }

  const company = settings.company_name || "Pepperr";

  return (
    <div className="mx-auto box-border min-w-0 max-w-[1600px] space-y-4 px-3 pb-16 pt-3 sm:px-4 sm:pt-4 lg:px-6">
      <div className="flex min-w-0 max-w-full flex-col gap-4 lg:flex-row lg:items-start">
      <section className="min-w-0 flex-1 space-y-4">
        <div className="min-w-0 rounded-3xl border border-pepperr-border bg-pepperr-card p-4 shadow-sm">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-pepperr-muted">Order type</span>
            {(
              [
                ["dine_in", "Dine-in"],
                ["takeaway", "Takeaway"],
                ["delivery", "Delivery"],
                ["scheduled", "Future"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setOrderType(id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  orderType === id
                    ? "bg-pepperr-ink text-white shadow"
                    : "bg-pepperr-cream text-pepperr-ink hover:bg-pepperr-ink/[0.06]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {orderType === "scheduled" && (
            <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <label className="shrink-0 text-sm text-pepperr-muted">Schedule for</label>
              <input
                type="datetime-local"
                className="min-w-0 w-full max-w-full rounded-xl border border-pepperr-border-strong bg-pepperr-cream px-2 py-2 text-sm sm:max-w-md sm:flex-1"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-pepperr-border bg-pepperr-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-pepperr-muted">Customer</p>
          <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center">
            <input
              className="w-full flex-1 rounded-2xl border border-pepperr-border-strong bg-pepperr-cream px-4 py-2 text-sm outline-none ring-pepperr-ember focus:ring-2"
              placeholder="Search name, phone, or email"
              value={custQuery}
              onChange={(e) => setCustQuery(e.target.value)}
            />
            {customer && (
              <button
                type="button"
                className="rounded-2xl border border-pepperr-border-strong px-4 py-2 text-sm text-pepperr-muted hover:bg-pepperr-ink/[0.05]"
                onClick={() => {
                  setCustomer(null);
                  setCustQuery("");
                  setCustHits([]);
                }}
              >
                Walk-in
              </button>
            )}
          </div>
          {customer && (
            <p className="mt-2 break-words text-sm text-pepperr-ink">
              <strong>{customer.name}</strong>
              {customer.phone && <span className="text-pepperr-muted"> · {customer.phone}</span>}
              {customer.email && <span className="text-pepperr-muted"> · {customer.email}</span>}
            </p>
          )}
          {!customer && custHits.length > 0 && (
            <ul className="mt-2 max-h-44 overflow-auto rounded-2xl border border-pepperr-border bg-pepperr-cream text-sm">
              {custHits.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col px-3 py-2 text-left hover:bg-pepperr-card"
                    onClick={() => {
                      setCustomer(c);
                      setCustHits([]);
                      setCustQuery(c.name);
                    }}
                  >
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-pepperr-muted">
                      {[c.phone, c.email].filter(Boolean).join(" · ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!customer && (
            <NewCustomerInline
              onCreated={(c) => {
                setCustomer(c);
                setCustQuery(c.name);
                setCustHits([]);
              }}
            />
          )}
        </div>

        <div className="min-w-0 rounded-3xl border border-pepperr-border bg-pepperr-card p-3 shadow-sm">
          <div className="-mx-1 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {catalog.map(({ category }) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategoryId(category.id)}
                className={`whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium ${
                  activeCategoryId === category.id
                    ? "bg-pepperr-ember text-white"
                    : "bg-pepperr-cream text-pepperr-ink hover:bg-pepperr-ink/[0.06]"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {!catalog.length && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
            No menu loaded. Confirm Supabase keys and run <code className="font-mono">supabase/schema.sql</code>.
          </div>
        )}

        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {activeProducts.map((p) => (
            <article
              key={p.id}
              className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-pepperr-border bg-pepperr-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <button type="button" onClick={() => addLine(p)} className="flex min-w-0 flex-1 flex-col text-left">
                <div className="relative aspect-[4/3] w-full min-w-0 bg-gradient-to-br from-pepperr-cream to-pepperr-card">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt=""
                      className="h-full w-full max-w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl text-pepperr-muted/30">🍽</div>
                  )}
                  <span className="absolute bottom-2 left-2 rounded-full bg-pepperr-card/90 px-3 py-1 text-xs font-semibold text-pepperr-ink shadow">
                    LKR {p.price_lkr.toLocaleString("en-LK")}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
                  <h3 className="font-display text-base font-semibold leading-snug text-pepperr-ink break-words">
                    {p.name}
                  </h3>
                  <span className="mt-2 text-xs text-pepperr-ember">Tap to add</span>
                </div>
              </button>
              <button
                type="button"
                className="border-t border-pepperr-border px-4 py-2 text-xs font-medium text-pepperr-muted hover:bg-pepperr-cream"
                onClick={() => {
                  setImgProduct(p);
                  setImgUrl(p.image_url ?? "");
                }}
              >
                Photo / image URL
              </button>
            </article>
          ))}
        </div>
      </section>

      <aside className="w-full min-w-0 max-w-full space-y-4 lg:max-w-md lg:flex-shrink-0">
        <div className="rounded-3xl border border-pepperr-border bg-pepperr-card p-4 shadow-lg sm:p-5">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <h2 className="font-display shrink-0 text-lg font-semibold">Current bill</h2>
            <span className="truncate text-right text-xs text-pepperr-muted sm:text-sm">{company}</span>
          </div>
          <div className="mt-4 max-h-[320px] space-y-3 overflow-auto pr-1">
            {Object.entries(cart).map(([id, e]) => (
              <div
                key={id}
                className="flex min-w-0 items-start justify-between gap-2 rounded-2xl bg-pepperr-cream/80 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium text-pepperr-ink">{e.product.name}</p>
                  <p className="text-xs text-pepperr-muted">LKR {e.product.price_lkr.toLocaleString("en-LK")} each</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="h-8 w-8 rounded-lg border border-pepperr-border-strong bg-pepperr-card text-lg leading-none"
                    onClick={() => bump(id, -1)}
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{e.quantity}</span>
                  <button
                    type="button"
                    className="h-8 w-8 rounded-lg border border-pepperr-border-strong bg-pepperr-card text-lg leading-none"
                    onClick={() => bump(id, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
            {!Object.keys(cart).length && <p className="text-sm text-pepperr-muted">No items yet.</p>}
          </div>
          <div className="mt-4 flex min-w-0 items-center justify-between gap-3 border-t border-pepperr-border pt-4 text-base font-semibold sm:text-lg">
            <span className="shrink-0">Subtotal</span>
            <span className="truncate tabular-nums">LKR {subtotal.toLocaleString("en-LK")}</span>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-pepperr-muted">Payment</p>
            <div className="flex flex-wrap gap-2">
              {(["cash", "card", "credit"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPayment(m)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                    payment === m ? "bg-pepperr-sage text-white" : "bg-pepperr-cream text-pepperr-ink hover:bg-pepperr-ink/[0.06]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <label className="mt-4 block min-w-0 text-sm text-pepperr-muted">
            Kitchen / driver notes
            <textarea
              className="mt-1 box-border min-h-[3rem] w-full min-w-0 max-w-full rounded-2xl border border-pepperr-border-strong bg-pepperr-cream px-3 py-2 text-sm text-pepperr-ink outline-none ring-pepperr-ember focus:ring-2"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          <div className="mt-4 space-y-2 rounded-2xl border border-dashed border-pepperr-border-strong bg-pepperr-cream/50 p-3 text-sm">
            <label className="flex min-w-0 items-start gap-2 break-words">
              <input
                type="checkbox"
                checked={sendBillSms}
                disabled={!customer?.phone}
                onChange={(e) => setSendBillSms(e.target.checked)}
              />
              Text bill to customer (needs phone + Twilio)
            </label>
            <label className="flex min-w-0 items-start gap-2 break-words">
              <input
                type="checkbox"
                checked={sendBillEmail}
                disabled={!customer?.email}
                onChange={(e) => setSendBillEmail(e.target.checked)}
              />
              Email bill (needs email + Resend)
            </label>
            <label className="flex min-w-0 items-start gap-2 break-words">
              <input
                type="checkbox"
                checked={sendReadySms}
                disabled={!customer?.phone}
                onChange={(e) => setSendReadySms(e.target.checked)}
              />
              “Order ready” SMS when food is up
            </label>
          </div>

          <button
            type="button"
            disabled={pending}
            onClick={checkout}
            className="mt-5 w-full rounded-2xl bg-pepperr-ember py-3 text-sm font-semibold text-white shadow hover:bg-pepperr-ember-dark disabled:opacity-50"
          >
            {pending ? "Saving…" : "Place order & build receipt"}
          </button>
          {status && <p className="mt-3 break-words text-sm text-pepperr-sage">{status}</p>}
          {billHtml && (
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={printBill}
                className="w-full rounded-2xl border border-pepperr-border-strong bg-pepperr-card py-3 text-sm font-semibold text-pepperr-ink hover:bg-pepperr-cream"
              >
                Print receipt
              </button>
            </div>
          )}
        </div>
      </aside>
      </div>

      {billHtml && (
        <div className="min-w-0 max-w-full">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-pepperr-muted">Receipt preview</p>
          <div
            id="printable-bill"
            className="max-h-[520px] min-w-0 max-w-full overflow-x-auto overflow-y-auto break-words rounded-3xl border border-pepperr-border-strong bg-pepperr-card p-4 shadow-inner [&_img]:max-h-48 [&_img]:max-w-full [&_img]:object-contain [&_table]:max-w-full"
            dangerouslySetInnerHTML={{ __html: billHtml }}
          />
        </div>
      )}

      {imgProduct && (
        <ImageUrlModal
          title={imgProduct.name}
          url={imgUrl}
          onUrlChange={setImgUrl}
          onClose={() => setImgProduct(null)}
          onSave={async () => {
            const r = await updateProductImage(imgProduct.id, imgUrl.trim() || null);
            if (!r.ok) {
              alert(r.error);
              return;
            }
            setImgProduct(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

function ImageUrlModal({
  title,
  url,
  onUrlChange,
  onClose,
  onSave,
}: {
  title: string;
  url: string;
  onUrlChange: (v: string) => void;
  onClose: () => void;
  onSave: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-3xl bg-pepperr-card p-6 shadow-2xl">
        <h3 className="font-display text-lg font-semibold">Image for {title}</h3>
        <p className="mt-1 text-sm text-pepperr-muted">Paste a public image URL (for example from Supabase Storage or a CDN).</p>
        <input
          className="mt-4 w-full rounded-2xl border border-pepperr-border-strong bg-pepperr-cream px-3 py-2 text-sm outline-none ring-pepperr-ember focus:ring-2"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-xl px-4 py-2 text-sm text-pepperr-muted hover:bg-pepperr-ink/[0.05]" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            className="rounded-xl bg-pepperr-ember px-4 py-2 text-sm font-semibold text-white hover:bg-pepperr-ember-dark disabled:opacity-50"
            onClick={async () => {
              setBusy(true);
              await onSave();
              setBusy(false);
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function NewCustomerInline({ onCreated }: { onCreated: (c: Customer) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open) {
    return (
      <button type="button" className="mt-3 text-sm font-medium text-pepperr-ember hover:underline" onClick={() => setOpen(true)}>
        + New customer
      </button>
    );
  }
  return (
    <div className="mt-3 space-y-2 rounded-2xl border border-pepperr-border bg-pepperr-card p-3">
      <input
        className="w-full rounded-xl border border-pepperr-border-strong px-3 py-2 text-sm"
        placeholder="Name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="w-full rounded-xl border border-pepperr-border-strong px-3 py-2 text-sm"
        placeholder="Phone (optional)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        className="w-full rounded-xl border border-pepperr-border-strong px-3 py-2 text-sm"
        placeholder="Email (optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div className="flex gap-2">
        <button type="button" className="text-sm text-pepperr-muted" onClick={() => setOpen(false)}>
          Cancel
        </button>
        <button
          type="button"
          disabled={busy || !name.trim()}
          className="rounded-xl bg-pepperr-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          onClick={async () => {
            setBusy(true);
            const r = await createCustomer({ name, phone, email });
            setBusy(false);
            if (!r.ok) {
              alert(r.error);
              return;
            }
            onCreated({
              id: r.id,
              name: name.trim(),
              phone: phone.trim() || null,
              email: email.trim() || null,
              notes: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            setOpen(false);
            setName("");
            setPhone("");
            setEmail("");
          }}
        >
          Save customer
        </button>
      </div>
    </div>
  );
}
