import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

/** Server-only read helper (not a public Server Action). */
export async function getSettingsMap(): Promise<Record<string, string>> {
  if (!isSupabaseConfigured()) return {};
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("settings").select("key, value");
    if (error) throw error;
    return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}
