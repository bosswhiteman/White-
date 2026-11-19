import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { isAdminRequest, unauthorized } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/** Téléchargement du paquet de déploiement Netlify (réservé à l'administrateur). */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  const file = path.join(process.cwd(), "messi-store-netlify.zip");
  if (!fs.existsSync(file)) {
    return NextResponse.json({ error: "Paquet indisponible sur ce serveur." }, { status: 404 });
  }
  const buf = fs.readFileSync(file);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="messi-store-netlify.zip"',
      "Content-Length": String(buf.length),
    },
  });
}
