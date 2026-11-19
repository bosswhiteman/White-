import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdminRequest, unauthorized } from "@/lib/admin-auth";
import { recomputeProductRating } from "@/lib/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!isAdminRequest(req)) return unauthorized();
  const id = Number((await ctx.params).id);
  const body = await req.json();
  const [updated] = await db
    .update(reviews)
    .set({ approved: Boolean(body.approved), verifiedPurchase: Boolean(body.verifiedPurchase ?? body.approved) })
    .where(eq(reviews.id, id))
    .returning({ productId: reviews.productId });
  if (!updated) return NextResponse.json({ error: "Avis introuvable." }, { status: 404 });
  await recomputeProductRating(updated.productId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  if (!isAdminRequest(req)) return unauthorized();
  const id = Number((await ctx.params).id);
  const [deleted] = await db.delete(reviews).where(eq(reviews.id, id)).returning({ productId: reviews.productId });
  if (deleted) await recomputeProductRating(deleted.productId);
  return NextResponse.json({ ok: true });
}
