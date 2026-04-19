"use server";

import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { requirePosUnlocked } from "@/lib/require-pos";
import type { PaymentMethod } from "@/types/db";

export type ReportBucket = {
  from: string;
  to: string;
  order_count: number;
  total_lkr: number;
  by_payment: Record<PaymentMethod, { count: number; total_lkr: number }>;
};

export async function getSalesReport(range: {
  fromIso: string;
  toIso: string;
}): Promise<ReportBucket | { error: string }> {
  try {
    await requirePosUnlocked();
  } catch {
    return { error: "POS is locked." };
  }
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured." };
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("id,total_lkr,payment_method,created_at")
    .gte("created_at", range.fromIso)
    .lte("created_at", range.toIso);
  if (error) return { error: error.message };

  const rows = data ?? [];
  const by_payment: ReportBucket["by_payment"] = {
    cash: { count: 0, total_lkr: 0 },
    card: { count: 0, total_lkr: 0 },
    credit: { count: 0, total_lkr: 0 },
  };
  let total_lkr = 0;
  for (const r of rows) {
    const pm = r.payment_method as PaymentMethod;
    if (!by_payment[pm]) continue;
    by_payment[pm].count += 1;
    by_payment[pm].total_lkr += r.total_lkr as number;
    total_lkr += r.total_lkr as number;
  }
  return {
    from: range.fromIso,
    to: range.toIso,
    order_count: rows.length,
    total_lkr,
    by_payment,
  };
}
