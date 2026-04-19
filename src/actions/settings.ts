"use server";

import bcrypt from "bcryptjs";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { requirePosUnlocked } from "@/lib/require-pos";

export async function updateSettingsBatch(
  updates: Record<string, string>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requirePosUnlocked();
  } catch {
    return { ok: false, error: "POS is locked." };
  }
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not configured." };
  const admin = createAdminClient();
  const allowed = new Set([
    "company_name",
    "company_address",
    "company_phone",
    "logo_url",
    "bill_html_template",
    "email_bill_template",
    "sms_bill_template",
    "sms_ready_template",
  ]);
  const rows = Object.entries(updates)
    .filter(([key]) => allowed.has(key))
    .map(([key, value]) => ({ key, value }));
  const { error } = await admin.from("settings").upsert(rows, { onConflict: "key" });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function changePosPin(
  currentPin: string,
  nextPin: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requirePosUnlocked();
  } catch {
    return { ok: false, error: "POS is locked." };
  }
  if (nextPin.length < 4) return { ok: false, error: "New passcode must be at least 4 characters." };
  const admin = createAdminClient();
  const { data, error } = await admin.from("settings").select("value").eq("key", "pos_pin_hash").maybeSingle();
  if (error || !data?.value) return { ok: false, error: "Could not read current passcode." };
  if (!bcrypt.compareSync(currentPin, data.value)) {
    return { ok: false, error: "Current passcode is incorrect." };
  }
  const hash = bcrypt.hashSync(nextPin, 10);
  const { error: up } = await admin.from("settings").upsert({ key: "pos_pin_hash", value: hash });
  if (up) return { ok: false, error: up.message };
  return { ok: true };
}
