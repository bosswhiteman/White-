import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    await ensureSeeded();
    const { slug } = await context.params;
    const found = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1);
    const product = found[0];
    if (!product) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });

    const body = await req.json();
    const authorName = String(body.authorName ?? "").trim();
    const authorLocation = String(body.authorLocation ?? "").trim() || "Abidjan";
    const title = String(body.title ?? "").trim();
    const reviewBody = String(body.body ?? "").trim();
    const variantLabel = body.variantLabel ? String(body.variantLabel).trim().slice(0, 90) : null;
    const rating = Number(body.rating);

    if (authorName.length < 2 || authorName.length > 80)
      return NextResponse.json({ error: "Veuillez indiquer votre nom (2 à 80 caractères)." }, { status: 400 });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      return NextResponse.json({ error: "Veuillez choisir une note entre 1 et 5." }, { status: 400 });
    if (title.length < 3 || title.length > 120)
      return NextResponse.json({ error: "Titre de 3 à 120 caractères." }, { status: 400 });
    if (reviewBody.length < 10 || reviewBody.length > 1500)
      return NextResponse.json({ error: "Votre avis doit contenir au moins 10 caractères." }, { status: 400 });

    await db.insert(reviews).values({
      productId: product.id,
      authorName,
      authorLocation: authorLocation.slice(0, 60),
      rating,
      title,
      body: reviewBody,
      variantLabel,
      verifiedPurchase: false,
      approved: false,
    });

    return NextResponse.json(
      { message: "Merci ! Votre avis sera publié après vérification par Messi Store." },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST review error:", error);
    return NextResponse.json({ error: "Impossible d'envoyer l'avis." }, { status: 500 });
  }
}
