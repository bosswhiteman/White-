import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdminRequest, unauthorized } from "@/lib/admin-auth";
import { ORDER_STATUSES } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return unauthorized();
  const id = Number((await ctx.params).id);
  const body = await req.json();
  const status = String(body.status ?? "");
  if (!ORDER_STATUSES.some((s) => s.id === status)) {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  }
  const [updated] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning({ id: orders.id });
  if (!updated) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return unauthorized();
  const id = Number((await ctx.params).id);
  await db.delete(orders).where(eq(orders.id, id));
  return NextResponse.json({ ok: true });
}
