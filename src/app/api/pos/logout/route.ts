import { NextResponse } from "next/server";
import { POS_GATE_COOKIE_NAME } from "@/lib/pos-session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(POS_GATE_COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
