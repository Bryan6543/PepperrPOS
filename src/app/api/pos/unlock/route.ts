import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { POS_GATE_COOKIE_NAME, POS_GATE_TTL_SEC, signPosGateJwt } from "@/lib/pos-session";

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Supabase is not configured." }, { status: 500 });
  }
  let body: { pin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }
  const pin = body.pin ?? "";
  if (!pin) return NextResponse.json({ ok: false, error: "Passcode required." }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.from("settings").select("value").eq("key", "pos_pin_hash").maybeSingle();
  if (error || !data?.value) {
    return NextResponse.json({ ok: false, error: "Passcode not initialized in database." }, { status: 500 });
  }
  if (!bcrypt.compareSync(pin, data.value)) {
    return NextResponse.json({ ok: false, error: "Incorrect passcode." }, { status: 401 });
  }

  let token: string;
  try {
    token = await signPosGateJwt();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid POS_SESSION_SECRET (min 16 chars)." },
      { status: 500 },
    );
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(POS_GATE_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: POS_GATE_TTL_SEC,
  });
  return res;
}
