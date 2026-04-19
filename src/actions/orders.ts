"use server";

import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { requirePosUnlocked } from "@/lib/require-pos";
import type { Customer, OrderItemRow, OrderRow, OrderType, PaymentMethod } from "@/types/db";
import { getSettingsMap } from "@/lib/settings-read";
import {
  applyTemplate,
  defaultBillHtml,
  defaultEmailBill,
  defaultSmsBill,
  defaultSmsReady,
} from "@/lib/templates";
import { formatDate, formatLkr } from "@/lib/format";
import { sendEmailBill, sendTwilioSms } from "@/lib/notify";

export type CartLine = {
  product_id: string;
  product_name: string;
  unit_price_lkr: number;
  quantity: number;
};

export async function createCheckoutOrder(input: {
  lines: CartLine[];
  customer_id: string | null;
  order_type: OrderType;
  scheduled_for: string | null;
  payment_method: PaymentMethod;
  notes: string | null;
  send_bill_sms: boolean;
  send_bill_email: boolean;
  send_ready_sms: boolean;
  /** When replaying an offline queue item, pass the same id for idempotent sync. */
  client_queue_id?: string | null;
}): Promise<
  | {
      ok: true;
      order_id: string;
      order_number: number | null;
      bill_html: string;
      notify: { bill_sms?: string; bill_email?: string; ready_sms?: string };
    }
  | { ok: false; error: string }
> {
  try {
    await requirePosUnlocked();
  } catch {
    return { ok: false, error: "POS is locked." };
  }
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not configured." };
  if (!input.lines.length) return { ok: false, error: "Cart is empty." };

  const admin = createAdminClient();

  if (input.client_queue_id) {
    const { data: existing, error: exErr } = await admin
      .from("orders")
      .select("*")
      .eq("client_queue_id", input.client_queue_id)
      .maybeSingle();
    if (exErr) return { ok: false, error: exErr.message };
    if (existing) {
      const pr = await getOrderForPrint((existing as OrderRow).id);
      if ("error" in pr) return { ok: false, error: pr.error };
      const om = (existing as OrderRow).order_number;
      return {
        ok: true,
        order_id: (existing as OrderRow).id,
        order_number: typeof om === "number" ? om : null,
        bill_html: pr.bill_html,
        notify: {},
      };
    }
  }

  const subtotal = input.lines.reduce((s, l) => s + l.unit_price_lkr * l.quantity, 0);
  const total = subtotal;

  const { data: order, error: oErr } = await admin
    .from("orders")
    .insert({
      client_queue_id: input.client_queue_id ?? null,
      customer_id: input.customer_id,
      order_type: input.order_type,
      scheduled_for: input.scheduled_for,
      status: "completed",
      payment_method: input.payment_method,
      subtotal_lkr: subtotal,
      total_lkr: total,
      notes: input.notes,
    })
    .select("*")
    .single();
  if (oErr || !order) return { ok: false, error: oErr?.message ?? "Order failed." };

  const orderId = order.id as string;
  const orderNumber =
    typeof (order as { order_number?: number }).order_number === "number"
      ? (order as { order_number: number }).order_number
      : null;
  const itemsPayload = input.lines.map((l) => ({
    order_id: orderId,
    product_id: l.product_id,
    product_name: l.product_name,
    unit_price_lkr: l.unit_price_lkr,
    quantity: l.quantity,
  }));
  const { error: iErr } = await admin.from("order_items").insert(itemsPayload);
  if (iErr) return { ok: false, error: iErr.message };

  const settings = await getSettingsMap();
  const company_name = settings.company_name || "Pepperr";
  const company_address = settings.company_address || "";
  const company_phone = settings.company_phone || "";
  const logo_url = settings.logo_url || "";

  let customer_name = "";
  let customer_phone: string | null = null;
  let customer_email: string | null = null;
  if (input.customer_id) {
    const { data: c } = await admin.from("customers").select("*").eq("id", input.customer_id).maybeSingle();
    if (c) {
      customer_name = (c as { name?: string }).name ?? "";
      customer_phone = (c as { phone?: string | null }).phone ?? null;
      customer_email = (c as { email?: string | null }).email ?? null;
    }
  }

  const orderRow = order as OrderRow;
  const vars = buildTemplateVars({
    order: orderRow,
    lines: input.lines,
    company_name,
    company_address,
    company_phone,
    logo_url,
    customer_name,
    customer_phone,
    customer_email,
  });

  const tpl = settings.bill_html_template?.trim() || defaultBillHtml;
  const bill_html = applyTemplate(tpl, vars);

  const notify: { bill_sms?: string; bill_email?: string; ready_sms?: string } = {};

  const emailTpl = settings.email_bill_template?.trim() || defaultEmailBill;
  const smsBillTpl = settings.sms_bill_template?.trim() || defaultSmsBill;
  const smsReadyTpl = settings.sms_ready_template?.trim() || defaultSmsReady;

  if (input.send_bill_email && customer_email) {
    const body = applyTemplate(emailTpl, vars);
    const subjectMatch = body.match(/^Subject:\s*(.+)$/im);
    const subject = subjectMatch?.[1]?.trim() || `Pepperr order #${vars.order_number}`;
    const textBody = subjectMatch ? body.replace(/^Subject:.*\r?\n+/im, "").trim() : body;
    const r = await sendEmailBill(customer_email, subject, textBody);
    notify.bill_email = r.ok ? "Sent" : r.error ?? "Failed";
  }

  if (input.send_bill_sms && customer_phone) {
    const r = await sendTwilioSms(customer_phone, applyTemplate(smsBillTpl, vars));
    notify.bill_sms = r.ok ? "Sent" : r.error ?? "Failed";
  }

  if (input.send_ready_sms && customer_phone) {
    const r = await sendTwilioSms(customer_phone, applyTemplate(smsReadyTpl, vars));
    notify.ready_sms = r.ok ? "Sent" : r.error ?? "Failed";
  }

  return { ok: true, order_id: orderId, order_number: orderNumber, bill_html, notify };
}

export async function getOrderForPrint(orderId: string): Promise<{ bill_html: string } | { error: string }> {
  try {
    await requirePosUnlocked();
  } catch {
    return { error: "POS is locked." };
  }
  const admin = createAdminClient();
  const { data: order, error: oErr } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (oErr || !order) return { error: "Order not found." };
  const { data: items, error: iErr } = await admin.from("order_items").select("*").eq("order_id", orderId);
  if (iErr) return { error: iErr.message };

  const settings = await getSettingsMap();
  const company_name = settings.company_name || "Pepperr";
  const company_address = settings.company_address || "";
  const company_phone = settings.company_phone || "";
  const logo_url = settings.logo_url || "";

  const orderRow = order as OrderRow;
  let customer_name = "";
  let customer_phone: string | null = null;
  let customer_email: string | null = null;
  if (orderRow.customer_id) {
    const { data: c } = await admin.from("customers").select("*").eq("id", orderRow.customer_id).maybeSingle();
    if (c) {
      customer_name = (c as { name?: string }).name ?? "";
      customer_phone = (c as { phone?: string | null }).phone ?? null;
      customer_email = (c as { email?: string | null }).email ?? null;
    }
  }

  const lines = (items ?? []) as OrderItemRow[];
  const cartLines: CartLine[] = lines.map((it) => ({
    product_id: it.product_id ?? "",
    product_name: it.product_name,
    unit_price_lkr: it.unit_price_lkr,
    quantity: it.quantity,
  }));

  const vars = buildTemplateVars({
    order: orderRow,
    lines: cartLines,
    company_name,
    company_address,
    company_phone,
    logo_url,
    customer_name,
    customer_phone,
    customer_email,
  });
  const tpl = settings.bill_html_template?.trim() || defaultBillHtml;
  return { bill_html: applyTemplate(tpl, vars) };
}

function buildTemplateVars(args: {
  order: OrderRow;
  lines: CartLine[];
  company_name: string;
  company_address: string;
  company_phone: string;
  logo_url: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
}): Record<string, string> {
  const { order, lines, company_name, company_address, company_phone, logo_url } = args;
  const rawCustomerLine = [
    args.customer_name,
    args.customer_phone ? `Phone: ${args.customer_phone}` : "",
    args.customer_email ? `Email: ${args.customer_email}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const line_rows = lines
    .map(
      (l) =>
        `<tr><td>${escapeHtml(l.product_name)}</td><td align="right">${l.quantity}</td><td align="right">${formatLkr(
          l.unit_price_lkr * l.quantity,
        )}</td></tr>`,
    )
    .join("");

  const lines_text = lines.map((l) => `${l.quantity}× ${l.product_name} — ${formatLkr(l.unit_price_lkr * l.quantity)}`).join("\n");

  const logo_block = logo_url
    ? `<div style="margin-bottom:10px"><img src="${escapeHtml(logo_url)}" alt="Logo" style="max-height:64px"/></div>`
    : "";

  const scheduled_block =
    order.order_type === "scheduled" && order.scheduled_for
      ? `<p><strong>Scheduled:</strong> ${escapeHtml(formatDate(order.scheduled_for))}</p>`
      : "";

  const order_type = prettyOrderType(order.order_type);
  const payment_method = order.payment_method.toUpperCase();

  const on = order.order_number;
  const order_number = formatOrderNumber(on);
  const order_number_padded = formatOrderNumberPadded(on);
  const order_id_short = on != null ? order_number_padded : order.id.slice(0, 8).toUpperCase();

  return {
    order_id: order.id,
    order_number,
    order_number_padded,
    order_id_short,
    created_at: formatDate(order.created_at),
    company_name: escapeHtml(company_name),
    company_address: escapeHtml(company_address),
    company_phone: escapeHtml(company_phone),
    logo_url: escapeHtml(logo_url),
    logo_block,
    customer_line: escapeHtml(rawCustomerLine || "Walk-in"),
    customer_name: args.customer_name ? ` ${args.customer_name}` : "",
    order_type,
    payment_method,
    scheduled_block,
    line_rows,
    lines_text,
    total_lkr: formatLkr(order.total_lkr),
  };
}

export type OrderListRow = OrderRow & { customer_name: string | null };

export async function listOrdersPage(params: {
  page?: number;
  pageSize?: number;
  fromIso?: string | null;
  toIso?: string | null;
}): Promise<{ rows: OrderListRow[]; total: number }> {
  if (!isSupabaseConfigured()) return { rows: [], total: 0 };
  try {
    await requirePosUnlocked();
  } catch {
    return { rows: [], total: 0 };
  }
  const admin = createAdminClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, params.pageSize ?? 20));
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  let q = admin.from("orders").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (params.fromIso) q = q.gte("created_at", params.fromIso);
  if (params.toIso) q = q.lte("created_at", params.toIso);

  const { data, error, count } = await q.range(start, end);
  if (error) throw error;

  const orderRows = (data ?? []) as OrderRow[];
  const custIds = [...new Set(orderRows.map((o) => o.customer_id).filter(Boolean))] as string[];
  const nameById = new Map<string, string>();
  if (custIds.length) {
    const { data: custs, error: cErr } = await admin.from("customers").select("id, name").in("id", custIds);
    if (cErr) throw cErr;
    for (const c of custs ?? []) nameById.set((c as { id: string }).id, (c as { name: string }).name);
  }

  return {
    rows: orderRows.map((o) => ({
      ...o,
      customer_name: o.customer_id ? (nameById.get(o.customer_id) ?? null) : null,
    })),
    total: count ?? 0,
  };
}

export async function getOrderDetail(orderId: string): Promise<{
  order: OrderRow;
  items: OrderItemRow[];
  customer: Customer | null;
} | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    await requirePosUnlocked();
  } catch {
    return null;
  }
  const admin = createAdminClient();
  const { data: order, error: oErr } = await admin.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (oErr || !order) return null;
  const { data: items, error: iErr } = await admin.from("order_items").select("*").eq("order_id", orderId);
  if (iErr) throw iErr;
  const o = order as OrderRow;
  let customer: Customer | null = null;
  if (o.customer_id) {
    const { data: c } = await admin.from("customers").select("*").eq("id", o.customer_id).maybeSingle();
    if (c) customer = c as Customer;
  }
  return { order: o, items: (items ?? []) as OrderItemRow[], customer };
}

function formatOrderNumber(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return String(n);
}

function formatOrderNumberPadded(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return String(n).padStart(5, "0");
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function prettyOrderType(t: OrderType): string {
  switch (t) {
    case "dine_in":
      return "Dine-in";
    case "takeaway":
      return "Takeaway";
    case "delivery":
      return "Delivery";
    case "scheduled":
      return "Future order";
    default:
      return t;
  }
}
