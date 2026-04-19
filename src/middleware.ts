import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { POS_GATE_COOKIE_NAME } from "@/lib/pos-session";

const PROTECTED_PREFIXES = ["/pos", "/customers", "/reports", "/settings", "/orders"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!isProtectedPath(pathname)) return NextResponse.next();

  const secret = process.env.POS_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    const url = req.nextUrl.clone();
    url.pathname = "/setup";
    return NextResponse.redirect(url);
  }

  const token = req.cookies.get(POS_GATE_COOKIE_NAME)?.value;
  try {
    if (!token) throw new Error("no token");
    await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    return NextResponse.next();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/unlock";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    "/pos",
    "/pos/:path*",
    "/customers",
    "/customers/:path*",
    "/reports",
    "/reports/:path*",
    "/settings",
    "/settings/:path*",
    "/orders",
    "/orders/:path*",
  ],
};
