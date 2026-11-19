import { NextRequest, NextResponse } from "next/server";
import { CART_COOKIE_NAME } from "./store";

export function extractCartToken(req: NextRequest): string | null {
  const fromCookie = req.cookies.get(CART_COOKIE_NAME)?.value;
  if (fromCookie && /^[a-f0-9]{24,64}$/.test(fromCookie)) {
    return fromCookie;
  }
  const fromHeader = req.headers.get("x-cart-token");
  if (fromHeader && /^[a-f0-9]{24,64}$/.test(fromHeader)) {
    return fromHeader;
  }
  return null;
}

export function attachCartCookie(
  res: NextResponse,
  sessionToken: string
): NextResponse {
  res.cookies.set(CART_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: 60 * 60 * 24 * 60, // 60 days
  });
  return res;
}
