import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const product = await getProductBySlug(slug);
    if (!product) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
    return NextResponse.json({ product });
  } catch (error) {
    console.error("GET /api/products/[slug] error:", error);
    return NextResponse.json({ error: "Impossible de charger le produit." }, { status: 500 });
  }
}
