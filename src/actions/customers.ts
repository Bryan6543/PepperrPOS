"use server";

import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { requirePosUnlocked } from "@/lib/require-pos";
import type { Customer, OrderItemRow, OrderRow } from "@/types/db";

export async function searchCustomers(q: string): Promise<Customer[]> {
  if (!isSupabaseConfigured() || !q.trim()) return [];
  try {
    await requirePosUnlocked();
  } catch {
    return [];
  }
  const admin = createAdminClient();
  const safe = q.trim().replace(/%/g, "").replace(/,/g, "");
  const pat = `%${safe}%`;
  const { data, error } = await admin
    .from("customers")
    .select("*")
    .or(`name.ilike.${pat},phone.ilike.${pat},email.ilike.${pat}`)
    .order("updated_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Customer[];
}

export async function createCustomer(input: {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not configured." };
  try {
    await requirePosUnlocked();
  } catch {
    return { ok: false, error: "POS is locked." };
  }
  if (!input.name.trim()) return { ok: false, error: "Name is required." };
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("customers")
    .insert({
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id as string };
}

export async function getCustomerWithHistory(customerId: string): Promise<{
  customer: Customer;
  orders: (OrderRow & { items: OrderItemRow[] })[];
} | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    await requirePosUnlocked();
  } catch {
    return null;
  }
  const admin = createAdminClient();
  const { data: c, error: cErr } = await admin.from("customers").select("*").eq("id", customerId).maybeSingle();
  if (cErr || !c) return null;
  const { data: orders, error: oErr } = await admin
    .from("orders")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (oErr) throw oErr;
  const orderRows = (orders ?? []) as OrderRow[];
  const ids = orderRows.map((o) => o.id);
  let items: OrderItemRow[] = [];
  if (ids.length) {
    const { data: its, error: iErr } = await admin.from("order_items").select("*").in("order_id", ids);
    if (iErr) throw iErr;
    items = (its ?? []) as OrderItemRow[];
  }
  const byOrder = new Map<string, OrderItemRow[]>();
  for (const it of items) {
    const arr = byOrder.get(it.order_id) ?? [];
    arr.push(it);
    byOrder.set(it.order_id, arr);
  }
  return {
    customer: c as Customer,
    orders: orderRows.map((o) => ({ ...o, items: byOrder.get(o.id) ?? [] })),
  };
}

export async function listCustomersPage(params: {
  page?: number;
  pageSize?: number;
}): Promise<{ rows: Customer[]; total: number }> {
  if (!isSupabaseConfigured()) return { rows: [], total: 0 };
  try {
    await requirePosUnlocked();
  } catch {
    return { rows: [], total: 0 };
  }
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, params.pageSize ?? 20));
  const admin = createAdminClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await admin
    .from("customers")
    .select("*", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { rows: (data ?? []) as Customer[], total: count ?? 0 };
}
