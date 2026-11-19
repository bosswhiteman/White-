import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { media } from "@/db/schema";
import { isAdminRequest, unauthorized } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 4 * 1024 * 1024;

/** Reçoit une ou plusieurs images (data URL déjà compressées côté navigateur). */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  try {
    const body = await req.json();
    const list: string[] = Array.isArray(body.images) ? body.images : body.image ? [body.image] : [];
    if (list.length === 0) return NextResponse.json({ error: "Aucune image reçue." }, { status: 400 });
    if (list.length > 12) return NextResponse.json({ error: "12 images maximum par envoi." }, { status: 400 });

    const urls: string[] = [];
    for (const dataUrl of list) {
      const m = /^data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl));
      if (!m || !ALLOWED.has(m[1])) return NextResponse.json({ error: "Format accepté : JPG, PNG ou WEBP." }, { status: 400 });
      const size = Math.floor((m[2].length * 3) / 4);
      if (size > MAX_BYTES) return NextResponse.json({ error: "Image trop lourde (4 Mo maximum)." }, { status: 400 });
      const [row] = await db.insert(media).values({ mime: m[1], data: m[2], size }).returning({ id: media.id });
      urls.push(`/api/media/${row.id}`);
    }
    return NextResponse.json({ urls }, { status: 201 });
  } catch (error) {
    console.error("upload error:", error);
    return NextResponse.json({ error: "Envoi impossible." }, { status: 500 });
  }
}
