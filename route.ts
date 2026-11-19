import { NextRequest, NextResponse } from "next/server";
import { checkCredentials, getAdminEmail, isAdminRequest, unauthorized, updateAdminCredentials } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  return NextResponse.json({ email: await getAdminEmail() });
}

/** Modifier l'e-mail et/ou le mot de passe administrateur (mot de passe actuel requis). */
export async function PUT(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  const body = await req.json();
  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "").trim();
  const newEmail = String(body.newEmail ?? "").trim();
  const email = await getAdminEmail();

  if (!(await checkCredentials(email, currentPassword))) {
    return NextResponse.json({ error: "Mot de passe actuel incorrect." }, { status: 400 });
  }
  if (newPassword && newPassword.length < 8) {
    return NextResponse.json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
  }
  if (newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }
  await updateAdminCredentials(newEmail || null, newPassword || null);
  return NextResponse.json({ ok: true, email: await getAdminEmail() });
}
