import { db } from "@/db";
import {
  carts,
  cartItems,
  collections,
  products,
  productVariants,
  reviews,
  orders,
  orderItems,
  settings,
  type ProductCondition,
  type ProductType,
} from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import crypto from "crypto";
import {
  calculatePromoDiscount,
  CONDITION_ORDER,
  DEFAULT_STORE_SETTINGS,
  getConditionLabel,
  STORAGE_ORDER,
  type CartDTO,
  type CollectionDTO,
  type OrderDTO,
  type PriceSheetRowDTO,
  type ProductCardDTO,
  type ProductDetailDTO,
  type ReviewDTO,
  type StoreSettings,
  type VariantDTO,
} from "./format";

export const CART_COOKIE_NAME = "messi_cart_session";

type ProductRow = typeof products.$inferSelect;
type VariantRow = typeof productVariants.$inferSelect;

export function mapVariant(v: VariantRow): VariantDTO {
  return {
    id: v.id,
    productId: v.productId,
    sku: v.sku,
    condition: v.condition,
    conditionLabel: getConditionLabel(v.condition),
    storage: v.storage,
    simType: v.simType,
    colorNote: v.colorNote,
    batteryHealth: v.batteryHealth,
    price: v.price,
    compareAtPrice: v.compareAtPrice,
    availability: v.availability,
    stockQty: v.stockQty,
    fromOfficialSheet: v.fromOfficialSheet,
  };
}

function storageRank(s: string): number {
  const i = STORAGE_ORDER.indexOf(s);
  return i === -1 ? 99 : i;
}

/** Choisit la variante affichée par défaut : Quasi Neuf en priorité, puis prix vérifié, puis stock. */
function summarizeVariants(
  pVariants: VariantDTO[],
  preferredCondition?: ProductCondition,
  preferredStorages?: string[]
) {
  const storages = Array.from(
    new Set(pVariants.filter((v) => v.storage !== "Standard").map((v) => v.storage))
  ).sort((a, b) => storageRank(a) - storageRank(b));

  const conditions = Array.from(new Set(pVariants.map((v) => v.condition))).sort(
    (a, b) => CONDITION_ORDER.indexOf(a) - CONDITION_ORDER.indexOf(b)
  );

  let pool = [...pVariants];
  if (preferredStorages && preferredStorages.length > 0) {
    const m = pool.filter((v) => preferredStorages.includes(v.storage));
    if (m.length > 0) pool = m;
  }

  const score = (v: VariantDTO) => {
    let s = 0;
    if (preferredCondition) {
      if (v.condition === preferredCondition) s += 1000;
    } else if (v.condition === "quasi-neuf" && v.price > 0) {
      s += 1000;
    }
    if (v.price > 0) s += 500;
    if (v.availability === "in-stock") s += 200;
    s -= CONDITION_ORDER.indexOf(v.condition) * 10;
    return s;
  };

  const sorted = [...pool].sort(
    (a, b) => score(b) - score(a) || (a.price || Infinity) - (b.price || Infinity)
  );
  const defaultVariant = sorted[0] ?? pVariants[0];

  const priced = pVariants.filter((v) => v.price > 0).map((v) => v.price);
  return {
    storages,
    conditions,
    defaultVariant,
    minPrice: priced.length ? Math.min(...priced) : 0,
    maxPrice: priced.length ? Math.max(...priced) : 0,
    inStock: pVariants.some((v) => v.availability === "in-stock" && v.price > 0),
    hasOnOrder: pVariants.some((v) => v.availability === "on-order"),
  };
}

function buildCard(
  p: ProductRow,
  pVariants: VariantDTO[],
  col: { slug: string; name: string } | undefined,
  preferredCondition?: ProductCondition,
  preferredStorages?: string[]
): ProductCardDTO {
  const s = summarizeVariants(pVariants, preferredCondition, preferredStorages);
  const gallery = p.galleryJson ?? [];
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    productType: p.productType,
    series: p.series,
    releaseYear: p.releaseYear,
    tagline: p.tagline,
    collectionSlug: col?.slug ?? "iphone-16-17",
    collectionName: col?.name ?? "iPhone",
    basePrice: s.defaultVariant?.price ?? 0,
    minPrice: s.minPrice,
    maxPrice: s.maxPrice,
    compareAtPrice: s.defaultVariant?.compareAtPrice ?? null,
    badge: p.badge,
    featured: p.featured,
    inStock: s.inStock,
    hasOnOrder: s.hasOnOrder,
    ratingAvg: Number(p.ratingAvg.toFixed(1)),
    reviewCount: p.reviewCount,
    primaryImage: gallery[0]?.url ?? p.primaryImage,
    secondaryImage: gallery[1]?.url ?? gallery[0]?.url ?? p.primaryImage,
    photoCount: gallery.length,
    colors: p.colorsJson ?? [],
    storages: s.storages,
    conditions: s.conditions,
    specsSummary: {
      ecran: p.specsJson.ecran,
      puce: p.specsJson.puce,
      camera: p.specsJson.camera,
      batterie: p.specsJson.batterie,
    },
    defaultVariant: s.defaultVariant,
    variants: pVariants,
  };
}

export async function getSettings(): Promise<StoreSettings> {
  await ensureSeeded();
  const rows = await db.select().from(settings);
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const num = (k: keyof StoreSettings, def: number) => {
    const n = Number(map.get(k));
    return Number.isFinite(n) && n >= 0 ? n : def;
  };
  return {
    announcement: map.get("announcement") ?? DEFAULT_STORE_SETTINGS.announcement,
    deliveryAbidjan: num("deliveryAbidjan", DEFAULT_STORE_SETTINGS.deliveryAbidjan),
    deliveryInterieur: num("deliveryInterieur", DEFAULT_STORE_SETTINGS.deliveryInterieur),
    freeDeliveryThreshold: num("freeDeliveryThreshold", DEFAULT_STORE_SETTINGS.freeDeliveryThreshold),
    showroomAddress: map.get("showroomAddress") ?? DEFAULT_STORE_SETTINGS.showroomAddress,
    openingHours: map.get("openingHours") ?? DEFAULT_STORE_SETTINGS.openingHours,
    experienceYears: num("experienceYears", DEFAULT_STORE_SETTINGS.experienceYears),
    aboutText: map.get("aboutText") || DEFAULT_STORE_SETTINGS.aboutText,
  };
}

async function loadPublicCatalog() {
  await ensureSeeded();
  const [cols, allProducts, allVariants] = await Promise.all([
    db.select().from(collections),
    db.select().from(products).where(eq(products.published, true)).orderBy(asc(products.sortOrder)),
    db.select().from(productVariants).where(eq(productVariants.archived, false)).orderBy(asc(productVariants.id)),
  ]);
  const colMap = new Map(cols.map((c) => [c.id, c]));
  const variantsByProduct = new Map<number, VariantDTO[]>();
  for (const raw of allVariants) {
    const arr = variantsByProduct.get(raw.productId) ?? [];
    arr.push(mapVariant(raw));
    variantsByProduct.set(raw.productId, arr);
  }
  return { cols, colMap, allProducts, variantsByProduct };
}

export async function getCollectionsWithCounts(): Promise<CollectionDTO[]> {
  const { cols, allProducts } = await loadPublicCatalog();
  const countMap = new Map<number, number>();
  for (const p of allProducts) countMap.set(p.collectionId, (countMap.get(p.collectionId) ?? 0) + 1);
  return cols
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      subtitle: c.subtitle,
      description: c.description,
      heroImage: c.heroImage,
      featured: c.featured,
      productCount: countMap.get(c.id) ?? 0,
    }))
    .filter((c) => c.productCount > 0);
}

export interface ProductFilterParams {
  search?: string;
  collection?: string;
  productType?: ProductType | "all";
  series?: string;
  condition?: ProductCondition | "all";
  storages?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  featuredOnly?: boolean;
  sort?: "featured" | "price-asc" | "price-desc" | "newest" | "rating";
}

export async function getFilteredProducts(filters: ProductFilterParams = {}): Promise<{
  products: ProductCardDTO[];
  availableStorages: string[];
  totalCatalogCount: number;
}> {
  const { colMap, allProducts, variantsByProduct } = await loadPublicCatalog();
  const activeCondition = filters.condition && filters.condition !== "all" ? filters.condition : undefined;
  const hasPriceFilter = typeof filters.minPrice === "number" || typeof filters.maxPrice === "number";

  const allStorageSet = new Set<string>();
  for (const vs of variantsByProduct.values()) {
    for (const v of vs) if (v.storage !== "Standard") allStorageSet.add(v.storage);
  }

  const matched = allProducts.filter((p) => {
    const pVariants = variantsByProduct.get(p.id) ?? [];
    if (pVariants.length === 0) return false;
    const col = colMap.get(p.collectionId);

    if (filters.collection && filters.collection !== "all" && col?.slug !== filters.collection) return false;
    if (filters.productType && filters.productType !== "all" && p.productType !== filters.productType) return false;
    if (filters.series && filters.series !== "all" && p.series.toLowerCase() !== filters.series.toLowerCase()) return false;
    if (filters.featuredOnly && !p.featured) return false;

    const okVariants = pVariants.filter((v) => {
      if (activeCondition && v.condition !== activeCondition) return false;
      if (filters.storages && filters.storages.length > 0 && !filters.storages.includes(v.storage)) return false;
      if (hasPriceFilter && v.price <= 0) return false;
      if (typeof filters.minPrice === "number" && v.price < filters.minPrice) return false;
      if (typeof filters.maxPrice === "number" && v.price > filters.maxPrice) return false;
      if (filters.inStockOnly && (v.availability !== "in-stock" || v.price <= 0)) return false;
      return true;
    });
    if (okVariants.length === 0) return false;

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      const hay = [p.name, p.series, p.tagline, col?.name ?? "", ...p.colorsJson.map((c) => c.name), ...pVariants.map((v) => `${v.storage} ${v.conditionLabel} ${v.simType ?? ""}`)]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const cards = matched.map((p) => ({
    sortOrder: p.sortOrder,
    card: buildCard(p, variantsByProduct.get(p.id) ?? [], colMap.get(p.collectionId), activeCondition, filters.storages),
  }));

  const rank = (c: ProductCardDTO) =>
    c.defaultVariant.price > 0 ? (c.defaultVariant.availability === "in-stock" ? 0 : 1) : 2;

  switch (filters.sort) {
    case "price-asc":
      cards.sort((a, b) => (a.card.basePrice || Infinity) - (b.card.basePrice || Infinity));
      break;
    case "price-desc":
      cards.sort((a, b) => b.card.basePrice - a.card.basePrice);
      break;
    case "newest":
      cards.sort((a, b) => b.card.releaseYear - a.card.releaseYear || a.sortOrder - b.sortOrder);
      break;
    case "rating":
      cards.sort((a, b) => b.card.ratingAvg - a.card.ratingAvg || a.sortOrder - b.sortOrder);
      break;
    default:
      cards.sort((a, b) => rank(a.card) - rank(b.card) || a.sortOrder - b.sortOrder);
  }

  return {
    products: cards.map((c) => c.card),
    availableStorages: Array.from(allStorageSet).sort((a, b) => storageRank(a) - storageRank(b)),
    totalCatalogCount: allProducts.length,
  };
}

export async function getOfficialPriceSheet(): Promise<{
  quasiNeuf: PriceSheetRowDTO[];
  nonActive: PriceSheetRowDTO[];
  neufScelle: PriceSheetRowDTO[];
}> {
  await ensureSeeded();
  const rows = await db
    .select({ variant: productVariants, productSlug: products.slug, productName: products.name, series: products.series })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(and(eq(products.productType, "iphone"), eq(products.published, true), eq(productVariants.archived, false)))
    .orderBy(desc(products.sortOrder), asc(productVariants.price));

  const quasiNeuf: PriceSheetRowDTO[] = [];
  const nonActive: PriceSheetRowDTO[] = [];
  const neufScelle: PriceSheetRowDTO[] = [];
  for (const r of rows) {
    if (r.variant.price <= 0) continue;
    const dto: PriceSheetRowDTO = {
      variantId: r.variant.id,
      productSlug: r.productSlug,
      productName: r.productName,
      series: r.series,
      condition: r.variant.condition,
      storage: r.variant.storage,
      simType: r.variant.simType,
      colorNote: r.variant.colorNote,
      price: r.variant.price,
      availability: r.variant.availability,
    };
    if (r.variant.condition === "quasi-neuf") quasiNeuf.push(dto);
    else if (r.variant.condition === "nouveau") nonActive.push(dto);
    else if (r.variant.condition === "neuf-scelle") neufScelle.push(dto);
  }
  nonActive.sort((a, b) => a.price - b.price);
  return { quasiNeuf, nonActive, neufScelle };
}

export async function recomputeProductRating(productId: number): Promise<{
  ratingAvg: number;
  reviewCount: number;
}> {
  const rows = await db
    .select({ rating: reviews.rating })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.approved, true)));
  const reviewCount = rows.length;
  const ratingAvg = reviewCount > 0 ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10 : 0;
  await db.update(products).set({ ratingAvg, reviewCount }).where(eq(products.id, productId));
  return { ratingAvg, reviewCount };
}

function mapReview(r: typeof reviews.$inferSelect): ReviewDTO {
  return {
    id: r.id,
    productId: r.productId,
    authorName: r.authorName,
    authorLocation: r.authorLocation,
    rating: r.rating,
    title: r.title,
    body: r.body,
    variantLabel: r.variantLabel,
    verifiedPurchase: r.verifiedPurchase,
    helpfulCount: r.helpfulCount,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function getProductBySlug(slug: string): Promise<ProductDetailDTO | null> {
  const { colMap, allProducts, variantsByProduct } = await loadPublicCatalog();
  const product = allProducts.find((p) => p.slug === slug);
  if (!product) return null;

  const pReviews = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.productId, product.id), eq(reviews.approved, true)))
    .orderBy(desc(reviews.createdAt));

  const ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of pReviews) ratingBreakdown[Math.min(5, Math.max(1, r.rating)) as 1 | 2 | 3 | 4 | 5] += 1;

  const related = allProducts
    .filter((p) => p.id !== product.id && (variantsByProduct.get(p.id)?.length ?? 0) > 0)
    .sort(
      (a, b) =>
        Number(b.series === product.series) - Number(a.series === product.series) ||
        Number(b.productType === product.productType) - Number(a.productType === product.productType) ||
        Math.abs(a.sortOrder - product.sortOrder) - Math.abs(b.sortOrder - product.sortOrder)
    )
    .slice(0, 4)
    .map((p) => buildCard(p, variantsByProduct.get(p.id) ?? [], colMap.get(p.collectionId)));

  const base = buildCard(product, variantsByProduct.get(product.id) ?? [], colMap.get(product.collectionId));
  return {
    ...base,
    reviewCount: pReviews.length,
    description: product.description,
    gallery: product.galleryJson ?? [],
    specs: product.specsJson,
    highlights: product.highlightsJson ?? [],
    ratingBreakdown,
    reviews: pReviews.map(mapReview),
    relatedProducts: related,
  };
}

export async function getFeaturedReviews(limit = 3): Promise<ReviewDTO[]> {
  await ensureSeeded();
  const rows = await db
    .select({ review: reviews, productName: products.name, productSlug: products.slug })
    .from(reviews)
    .innerJoin(products, eq(reviews.productId, products.id))
    .where(eq(reviews.approved, true))
    .orderBy(desc(reviews.helpfulCount), desc(reviews.createdAt))
    .limit(limit);
  return rows.map(({ review, productName, productSlug }) => ({ ...mapReview(review), productName, productSlug }));
}

export function generateSessionToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

export async function getOrCreateCart(existingToken?: string | null) {
  await ensureSeeded();
  const token = existingToken && /^[a-f0-9]{24,64}$/.test(existingToken) ? existingToken : generateSessionToken();
  const found = await db.select().from(carts).where(eq(carts.sessionToken, token)).limit(1);
  if (found[0]) return { id: found[0].id, sessionToken: found[0].sessionToken, promoCode: found[0].promoCode };
  const [created] = await db
    .insert(carts)
    .values({ sessionToken: token })
    .onConflictDoUpdate({ target: carts.sessionToken, set: { updatedAt: new Date() } })
    .returning();
  return { id: created.id, sessionToken: created.sessionToken, promoCode: created.promoCode };
}

export async function buildCartDTO(cartId: number): Promise<CartDTO> {
  const [cartRows, storeSettings] = await Promise.all([
    db.select().from(carts).where(eq(carts.id, cartId)).limit(1),
    getSettings(),
  ]);
  const cart = cartRows[0];
  if (!cart) throw new Error("Panier introuvable");

  const rows = await db
    .select({ item: cartItems, product: products, variant: productVariants })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .where(eq(cartItems.cartId, cartId))
    .orderBy(asc(cartItems.createdAt));

  const items = rows
    .filter(({ variant }) => variant.price > 0 && !variant.archived)
    .map(({ item, product, variant }) => ({
      id: item.id,
      productId: product.id,
      variantId: variant.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      condition: variant.condition,
      conditionLabel: getConditionLabel(variant.condition),
      storage: variant.storage,
      simType: variant.simType,
      selectedColor: item.selectedColor,
      availability: variant.availability,
      imageUrl: product.primaryImage,
      unitPrice: variant.price,
      quantity: item.quantity,
      stockQty: variant.stockQty,
      lineTotal: variant.price * item.quantity,
    }));

  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const promo = calculatePromoDiscount(subtotal, cart.promoCode);
  const discount = promo.valid ? promo.discount : 0;
  const total = Math.max(0, subtotal - discount);
  return {
    sessionToken: cart.sessionToken,
    items,
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    subtotal,
    promoCode: promo.valid ? promo.code : null,
    promoLabel: promo.valid ? promo.label : null,
    discount,
    total,
    freeDeliveryThreshold: storeSettings.freeDeliveryThreshold,
    remainingForFreeDelivery: Math.max(0, storeSettings.freeDeliveryThreshold - total),
  };
}

export async function getOrderByNumber(orderNumber: string): Promise<OrderDTO | null> {
  await ensureSeeded();
  const rows = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber.trim().toUpperCase())).limit(1);
  const order = rows[0];
  if (!order) return null;
  return mapOrder(order, await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).orderBy(asc(orderItems.id)));
}

export function mapOrder(
  order: typeof orders.$inferSelect,
  items: Array<typeof orderItems.$inferSelect>
): OrderDTO {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    fullName: order.fullName,
    phone: order.phone,
    email: order.email,
    city: order.city,
    commune: order.commune,
    addressDetails: order.addressDetails,
    deliveryMethod: order.deliveryMethod,
    paymentMethod: order.paymentMethod,
    customerNote: order.customerNote,
    promoCode: order.promoCode,
    subtotal: order.subtotal,
    discount: order.discount,
    shippingFee: order.shippingFee,
    total: order.total,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    items: items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      productBrand: i.productBrand,
      productSlug: i.productSlug,
      variantLabel: i.variantLabel,
      selectedColor: i.selectedColor,
      imageUrl: i.imageUrl,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
  };
}

export async function getOrdersWithItems(limit = 200): Promise<OrderDTO[]> {
  await ensureSeeded();
  const orderRows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
  if (orderRows.length === 0) return [];
  const items = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderRows.map((o) => o.id)));
  return orderRows.map((o) => mapOrder(o, items.filter((i) => i.orderId === o.id)));
}
