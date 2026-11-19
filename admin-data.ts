import { db } from "@/db";
import { collections, orderItems, products, productVariants, type GalleryItem, type ProductColorOption, type ProductHighlight, type ProductSpecs } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { asc, eq, inArray } from "drizzle-orm";

export type AdminVariant = typeof productVariants.$inferSelect;

export interface AdminProduct {
  id: number;
  slug: string;
  name: string;
  productType: string;
  series: string;
  releaseYear: number;
  tagline: string;
  description: string;
  collectionId: number;
  collectionSlug: string;
  badge: string | null;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  gallery: GalleryItem[];
  colors: ProductColorOption[];
  specs: ProductSpecs;
  highlights: ProductHighlight[];
  variants: AdminVariant[];
}

export async function getAdminCatalog(): Promise<{
  products: AdminProduct[];
  collections: Array<{ id: number; slug: string; name: string }>;
}> {
  await ensureSeeded();
  const [cols, prods, vars] = await Promise.all([
    db.select().from(collections).orderBy(asc(collections.sortOrder)),
    db.select().from(products).orderBy(asc(products.sortOrder), asc(products.id)),
    db.select().from(productVariants).orderBy(asc(productVariants.id)),
  ]);
  const colMap = new Map(cols.map((c) => [c.id, c]));
  return {
    collections: cols.map((c) => ({ id: c.id, slug: c.slug, name: c.name })),
    products: prods.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      productType: p.productType,
      series: p.series,
      releaseYear: p.releaseYear,
      tagline: p.tagline,
      description: p.description,
      collectionId: p.collectionId,
      collectionSlug: colMap.get(p.collectionId)?.slug ?? "",
      badge: p.badge,
      featured: p.featured,
      published: p.published,
      sortOrder: p.sortOrder,
      gallery: p.galleryJson ?? [],
      colors: p.colorsJson ?? [],
      specs: p.specsJson,
      highlights: p.highlightsJson ?? [],
      variants: vars.filter((v) => v.productId === p.id),
    })),
  };
}

/** Supprime des variantes ; celles déjà présentes dans des commandes sont archivées. */
export async function removeVariants(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const used = await db.select({ variantId: orderItems.variantId }).from(orderItems).where(inArray(orderItems.variantId, ids));
  const usedSet = new Set(used.map((u) => u.variantId));
  const toArchive = ids.filter((id) => usedSet.has(id));
  const toDelete = ids.filter((id) => !usedSet.has(id));
  if (toArchive.length) await db.update(productVariants).set({ archived: true }).where(inArray(productVariants.id, toArchive));
  if (toDelete.length) await db.delete(productVariants).where(inArray(productVariants.id, toDelete));
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export async function uniqueSlug(base: string, excludeId?: number): Promise<string> {
  const root = slugify(base) || "produit";
  let candidate = root;
  for (let i = 2; i < 200; i++) {
    const found = await db.select({ id: products.id }).from(products).where(eq(products.slug, candidate)).limit(1);
    if (!found[0] || found[0].id === excludeId) return candidate;
    candidate = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}
