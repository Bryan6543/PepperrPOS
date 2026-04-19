import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const POS_GATE_COOKIE_NAME = "pepperr_pos_gate";
/** Cookie max-age / JWT lifetime */
export const POS_GATE_TTL_SEC = 60 * 60 * 10;

function getSecretKey(): Uint8Array {
  const s = process.env.POS_SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("Set POS_SESSION_SECRET (at least 16 characters) in .env.local");
  }
  return new TextEncoder().encode(s);
}

export async function signPosGateJwt(): Promise<string> {
  return new SignJWT({ sub: "pos" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${POS_GATE_TTL_SEC}s`)
    .sign(getSecretKey());
}

export async function verifyPosGateToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export async function readPosGateCookie(): Promise<boolean> {
  const jar = await cookies();
  return verifyPosGateToken(jar.get(POS_GATE_COOKIE_NAME)?.value);
}

export async function setPosGateCookie(token: string) {
  const jar = await cookies();
  jar.set(POS_GATE_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: POS_GATE_TTL_SEC,
  });
}

export async function clearPosGateCookie() {
  const jar = await cookies();
  jar.set(POS_GATE_COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}
