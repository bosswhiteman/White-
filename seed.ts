import { db, pool } from "./index";
import { BOOTSTRAP_STATEMENTS } from "./bootstrap-sql";
import {
  collections,
  products,
  productVariants,
  settings,
  type ProductCondition,
} from "./schema";
import { count, eq } from "drizzle-orm";
import { P, type SeedCollection, type SeedProduct } from "./seed-types";
import { IPHONE_PRODUCTS } from "./catalog-iphones";
import { APPLE_ACCESSORY_PRODUCTS } from "./catalog-apple-accessories";

const SEED_COLLECTIONS: SeedCollection[] = [
  {
    slug: "iphone-16-17",
    name: "iPhone Séries 17 & 16",
    subtitle: "Non activés série 17 & dernières générations",
    description: "iPhone 17 Pro Max, 17 Pro (eSIM & SIM), 17 Air, 17 et toute la série 16.",
    heroImage: P.orangeTriple1,
    featured: true,
    sortOrder: 1,
  },
  {
    slug: "iphone-14-15",
    name: "iPhone Séries 15 & 14",
    subtitle: "Dynamic Island, 48 Mpx, USB‑C",
    description: "iPhone 14, 14 Plus, 14 Pro, 14 Pro Max et série 15.",
    heroImage: P.ip14ProMaxPair,
    featured: true,
    sortOrder: 2,
  },
  {
    slug: "iphone-x-13",
    name: "iPhone Séries X à 13",
    subtitle: "Les meilleurs prix en Quasi Neuf",
    description: "De l'iPhone X et XR jusqu'à l'iPhone 13 Pro Max.",
    heroImage: P.ip13BlueWood,
    featured: true,
    sortOrder: 3,
  },
  {
    slug: "equipements-accessoires",
    name: "Équipements & Accessoires Apple",
    subtitle: "AirPods, chargeurs, câbles, Watch, Mac & iPad",
    description: "Accessoires Apple d'origine et équipements de la marque.",
    heroImage: P.airpodsPro1,
    featured: true,
    sortOrder: 4,
  },
];

export const DEFAULT_SETTINGS: Record<string, string> = {
  announcement:
    "Arrivage iPhone Quasi Neufs Grade A+ · Contrôle IMEI & reçu à chaque achat · Livraison Abidjan",
  deliveryAbidjan: "2000",
  deliveryInterieur: "5000",
  freeDeliveryThreshold: "150000",
  showroomAddress: "Abidjan, Côte d'Ivoire",
  openingHours: "Lundi – Samedi : 9h00 – 20h00 · Dimanche sur rendez‑vous",
};

/** Remise boutique appliquée sur chaque article ayant un prix (décision Messi Store). */
const STORE_DISCOUNT_FCFA = 10000;

const ALL_SEED_PRODUCTS: SeedProduct[] = [...IPHONE_PRODUCTS, ...APPLE_ACCESSORY_PRODUCTS].map((p) => ({
  ...p,
  variants: p.variants.map((v) => ({
    ...v,
    price: v.price > 0 ? Math.max(0, v.price - STORE_DISCOUNT_FCFA) : 0,
  })),
}));

function defaultBatteryHealth(condition: ProductCondition): string {
  switch (condition) {
    case "nouveau":
      return "100 % · 0 cycle (non activé)";
    case "neuf-scelle":
      return "100 % · neuf sous scellé";
    case "quasi-neuf":
      return "Batterie contrôlée · état indiqué avant achat";
    case "seconde-main":
      return "Batterie testée · pourcentage communiqué sur WhatsApp";
  }
}

let seedPromise: Promise<void> | null = null;

/** Crée les tables si la base est vide (déploiement Netlify / nouvelle base Neon). */
async function ensureSchema(): Promise<void> {
  const res = await pool.query(
    "SELECT to_regclass('public.products') AS products, to_regclass('public.media') AS media"
  );
  const row = res.rows[0] as { products: string | null; media: string | null };
  if (row?.products && row?.media) return;
  if (!row?.products) {
    for (const stmt of BOOTSTRAP_STATEMENTS) {
      await pool.query(stmt);
    }
    return;
  }
  // Base existante d'une version précédente : on ajoute seulement la table des photos.
  const mediaStmt = BOOTSTRAP_STATEMENTS.find((s) => s.includes('CREATE TABLE "media"'));
  if (mediaStmt) await pool.query(mediaStmt);
}

export async function seedDatabase(): Promise<void> {
  await ensureSchema();

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db.insert(settings).values({ key, value }).onConflictDoNothing({ target: settings.key });
  }

  const existing = await db.select({ value: count() }).from(products);
  if ((existing[0]?.value ?? 0) > 0) return;

  const collectionMap = new Map<string, number>();
  for (const col of SEED_COLLECTIONS) {
    const [inserted] = await db
      .insert(collections)
      .values(col)
      .onConflictDoUpdate({
        target: collections.slug,
        set: { name: col.name, subtitle: col.subtitle, description: col.description, heroImage: col.heroImage, sortOrder: col.sortOrder },
      })
      .returning({ id: collections.id, slug: collections.slug });
    collectionMap.set(inserted.slug, inserted.id);
  }

  for (const item of ALL_SEED_PRODUCTS) {
    const collectionId = collectionMap.get(item.collectionSlug);
    if (!collectionId) continue;

    const priced = item.variants.filter((v) => v.price > 0);
    const minPrice = priced.length > 0 ? Math.min(...priced.map((v) => v.price)) : 0;

    const [inserted] = await db
      .insert(products)
      .values({
        slug: item.slug,
        name: item.name,
        brand: "Apple",
        productType: item.productType,
        series: item.series,
        releaseYear: item.releaseYear,
        tagline: item.tagline,
        description: item.description,
        collectionId,
        basePrice: minPrice,
        compareAtPrice: null,
        badge: item.badge ?? null,
        featured: item.featured,
        inStock: item.variants.some((v) => (v.availability ?? "in-stock") === "in-stock"),
        ratingAvg: 0,
        reviewCount: 0,
        primaryImage: item.gallery[0].url,
        galleryJson: item.gallery,
        colorsJson: item.colors,
        specsJson: item.specs,
        highlightsJson: item.highlights,
        sortOrder: item.sortOrder,
      })
      .onConflictDoNothing({ target: products.slug })
      .returning({ id: products.id });

    let productId = inserted?.id;
    if (!productId) {
      const found = await db.select({ id: products.id }).from(products).where(eq(products.slug, item.slug)).limit(1);
      productId = found[0]?.id;
    }
    if (!productId) continue;

    for (const v of item.variants) {
      await db
        .insert(productVariants)
        .values({
          productId,
          sku: v.sku,
          condition: v.condition,
          storage: v.storage,
          simType: v.simType ?? null,
          colorNote: v.colorNote ?? null,
          batteryHealth: v.batteryHealth ?? defaultBatteryHealth(v.condition),
          price: v.price,
          compareAtPrice: v.compareAtPrice ?? null,
          availability: v.availability ?? (v.price > 0 ? "in-stock" : "on-order"),
          stockQty: v.stockQty ?? 3,
          fromOfficialSheet: v.fromOfficialSheet ?? false,
          priceNote: v.priceNote ?? null,
        })
        .onConflictDoNothing({ target: productVariants.sku });
    }
  }
}

export async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = seedDatabase().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  await seedPromise;
}
