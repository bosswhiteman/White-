import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const reviewId = Number(id);
    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return NextResponse.json({ error: "Invalid review ID." }, { status: 400 });
    }

    const [updated] = await db
      .update(reviews)
      .set({ helpfulCount: sql`${reviews.helpfulCount} + 1` })
      .where(eq(reviews.id, reviewId))
      .returning({ id: reviews.id, helpfulCount: reviews.helpfulCount });

    if (!updated) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    return NextResponse.json({ helpfulCount: updated.helpfulCount });
  } catch (error) {
    console.error("POST /api/reviews/[id]/helpful error:", error);
    return NextResponse.json(
      { error: "Unable to update review." },
      { status: 500 }
    );
  }
}
