import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, checkCredentials, createSessionToken, isAdminRequest, setAdminCookie } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const attempts = new Map<string, { count: number; until: number }>();

export async function GET(req: NextRequest) {
  return NextResponse.json({ authenticated: isAdminRequest(req) });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const a = attempts.get(ip);
  if (a && a.until > Date.now()) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }, { status: 429 });
  }
  try {
    const body = await req.json();
    const email = String(body.email ?? "");
    const password = String(body.password ?? "");
    if (!email || !password || !(await checkCredentials(email, password))) {
      const count = (a?.count ?? 0) + 1;
      attempts.set(ip, { count, until: count >= 8 ? Date.now() + 10 * 60 * 1000 : 0 });
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json({ error: "E-mail ou mot de passe incorrect." }, { status: 401 });
    }
    attempts.delete(ip);
    const res = NextResponse.json({ ok: true });
    setAdminCookie(res, createSessionToken());
    return res;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
