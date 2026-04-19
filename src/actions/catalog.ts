"use server";

import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { requirePosUnlocked } from "@/lib/require-pos";
import type { Category, Product } from "@/types/db";

export type GroupedCatalog = { category: Category; products: Product[] }[];

export async function getCatalogGrouped(): Promise<GroupedCatalog> {
  if (!isSupabaseConfigured()) return [];
  try {
    await requirePosUnlocked();
  } catch {
    return [];
  }
  try {
    const admin = createAdminClient();
    const [{ data: categories, error: cErr }, { data: products, error: pErr }] = await Promise.all([
      admin.from("categories").select("*").order("sort_order", { ascending: true }),
      admin.from("products").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    ]);
    if (cErr) throw cErr;
    if (pErr) throw pErr;
    const cats = (categories ?? []) as Category[];
    const prods = (products ?? []) as Product[];
    return cats.map((category) => ({
      category,
      products: prods.filter((p) => p.category_id === category.id),
    }));
  } catch {
    return [];
  }
}

export async function updateProductImage(
  productId: string,
  imageUrl: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requirePosUnlocked();
  } catch {
    return { ok: false, error: "POS is locked." };
  }
  const admin = createAdminClient();
  const { error } = await admin.from("products").update({ image_url: imageUrl }).eq("id", productId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
