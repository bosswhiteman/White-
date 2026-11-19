import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { newsletterSubscribers, settings } from "@/db/schema";
import { desc } from "drizzle-orm";
import { isAdminRequest, unauthorized } from "@/lib/admin-auth";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

const KEYS = ["announcement", "deliveryAbidjan", "deliveryInterieur", "freeDeliveryThreshold", "showroomAddress", "openingHours", "experienceYears", "aboutText"] as const;
const NUMERIC = new Set(["deliveryAbidjan", "deliveryInterieur", "freeDeliveryThreshold", "experienceYears"]);

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  const [s, subs] = await Promise.all([
    getSettings(),
    db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt)),
  ]);
  return NextResponse.json({
    settings: s,
    subscribers: subs.map((x) => ({ id: x.id, contact: x.contact, createdAt: x.createdAt.toISOString() })),
  });
}

export async function PUT(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  const body = await req.json();
  for (const key of KEYS) {
    if (body[key] === undefined) continue;
    let value = String(body[key]).trim().slice(0, key === "aboutText" ? 1200 : 300);
    if (NUMERIC.has(key)) {
      const n = Math.round(Number(value));
      if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: `Valeur invalide pour ${key}.` }, { status: 400 });
      value = String(n);
    }
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
  }
  return NextResponse.json({ ok: true, settings: await getSettings() });
}
