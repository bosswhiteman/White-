import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { isAdminRequest, unauthorized } from "@/lib/admin-auth";
import { getAdminCatalog, uniqueSlug } from "@/lib/admin-data";
import { parseProduct, parseVariant } from "@/lib/admin-validate";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  return NextResponse.json(await getAdminCatalog());
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  try {
    const body = await req.json();
    const parsed = parseProduct(body.product ?? {});
    if (!parsed.data) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const p = parsed.data;
    const slug = await uniqueSlug(p.name);
    const rawVariants: Record<string, unknown>[] = Array.isArray(body.variants) ? body.variants : [];
    const variants = rawVariants.map((v, i) => parseVariant(v, `${slug.toUpperCase().slice(0, 20)}-${Date.now()}-${i}`));
    if (variants.length === 0) return NextResponse.json({ error: "Ajoutez au moins une variante (état / stockage / prix)." }, { status: 400 });

    const priced = variants.filter((v) => v.price > 0).map((v) => v.price);
    const [created] = await db
      .insert(products)
      .values({
        slug,
        name: p.name,
        brand: "Apple",
        productType: p.productType,
        series: p.series,
        releaseYear: p.releaseYear,
        tagline: p.tagline,
        description: p.description,
        collectionId: p.collectionId,
        basePrice: priced.length ? Math.min(...priced) : 0,
        badge: p.badge,
        featured: p.featured,
        published: p.published,
        primaryImage: p.gallery[0].url,
        galleryJson: p.gallery,
        colorsJson: p.colors,
        specsJson: p.specs,
        highlightsJson: p.highlights,
        sortOrder: p.sortOrder,
        ratingAvg: 0,
        reviewCount: 0,
      })
      .returning({ id: products.id });

    for (const v of variants) {
      const { id: _ignored, ...rest } = v;
      void _ignored;
      await db.insert(productVariants).values({ ...rest, productId: created.id }).onConflictDoNothing({ target: productVariants.sku });
    }
    return NextResponse.json({ id: created.id, slug }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/products error:", error);
    return NextResponse.json({ error: "Création impossible (SKU déjà utilisé ?)." }, { status: 500 });
  }
}
