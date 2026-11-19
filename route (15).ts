import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { isAdminRequest, unauthorized } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  const rows = await db
    .select({ review: reviews, productName: products.name, productSlug: products.slug })
    .from(reviews)
    .innerJoin(products, eq(reviews.productId, products.id))
    .orderBy(desc(reviews.createdAt));
  return NextResponse.json({
    reviews: rows.map((r) => ({ ...r.review, createdAt: r.review.createdAt.toISOString(), productName: r.productName, productSlug: r.productSlug })),
  });
}
