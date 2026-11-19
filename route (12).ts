import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orderItems, products, productVariants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isAdminRequest, unauthorized } from "@/lib/admin-auth";
import { getAdminCatalog, removeVariants, uniqueSlug } from "@/lib/admin-data";
import { parseProduct, parseVariant } from "@/lib/admin-validate";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  if (!isAdminRequest(req)) return unauthorized();
  const id = Number((await ctx.params).id);
  const data = await getAdminCatalog();
  const product = data.products.find((p) => p.id === id);
  if (!product) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
  return NextResponse.json({ product, collections: data.collections });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  if (!isAdminRequest(req)) return unauthorized();
  try {
    const id = Number((await ctx.params).id);
    const existing = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!existing[0]) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });

    const body = await req.json();
    const parsed = parseProduct(body.product ?? {});
    if (!parsed.data) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const p = parsed.data;

    const rawVariants: Record<string, unknown>[] = Array.isArray(body.variants) ? body.variants : [];
    const variants = rawVariants.map((v, i) => parseVariant(v, `${existing[0].slug.toUpperCase().slice(0, 20)}-${Date.now()}-${i}`));
    const priced = variants.filter((v) => v.price > 0 && !v.archived).map((v) => v.price);

    const slug = body.product?.slug ? await uniqueSlug(String(body.product.slug), id) : existing[0].slug;

    await db
      .update(products)
      .set({
        slug,
        name: p.name,
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
      })
      .where(eq(products.id, id));

    const current = await db.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.productId, id));
    const keepIds = new Set(variants.filter((v) => v.id).map((v) => v.id as number));
    await removeVariants(current.map((c) => c.id).filter((cid) => !keepIds.has(cid)));

    for (const v of variants) {
      const { id: vid, ...rest } = v;
      if (vid && current.some((c) => c.id === vid)) {
        await db.update(productVariants).set(rest).where(eq(productVariants.id, vid));
      } else {
        await db.insert(productVariants).values({ ...rest, productId: id });
      }
    }
    return NextResponse.json({ ok: true, slug });
  } catch (error) {
    console.error("PUT /api/admin/products/[id] error:", error);
    return NextResponse.json({ error: "Enregistrement impossible (SKU en double ?)." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  if (!isAdminRequest(req)) return unauthorized();
  const id = Number((await ctx.params).id);
  const used = await db.select({ id: orderItems.id }).from(orderItems).where(eq(orderItems.productId, id)).limit(1);
  if (used[0]) {
    await db.update(products).set({ published: false }).where(eq(products.id, id));
    return NextResponse.json({ ok: true, archived: true, message: "Produit lié à des commandes : il a été masqué de la boutique." });
  }
  await db.delete(products).where(eq(products.id, id));
  return NextResponse.json({ ok: true, deleted: true });
}
