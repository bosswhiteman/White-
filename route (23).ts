import { NextResponse } from "next/server";
import { getCollectionsWithCounts } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const collections = await getCollectionsWithCounts();
    return NextResponse.json({ collections });
  } catch (error) {
    console.error("GET /api/collections error:", error);
    return NextResponse.json(
      { error: "Unable to load collections." },
      { status: 500 }
    );
  }
}
