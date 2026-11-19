import type { AvailabilityStatus, GalleryItem, ProductColorOption, ProductCondition, ProductHighlight, ProductSpecs, ProductType } from "@/db/schema";

const CONDITIONS: ProductCondition[] = ["quasi-neuf", "nouveau", "neuf-scelle", "seconde-main"];
const TYPES: ProductType[] = ["iphone", "apple-accessory", "apple-equipment"];
const SPEC_KEYS: Array<keyof ProductSpecs> = [
  "ecran", "puce", "camera", "selfie", "batterie", "simReseau", "securite", "resistance", "dimensionsPoids", "systeme", "contenuGarantie",
];

const str = (v: unknown, max = 2000) => String(v ?? "").trim().slice(0, max);
const int = (v: unknown, def = 0) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 ? n : def;
};

export interface VariantInput {
  id?: number;
  sku: string;
  condition: ProductCondition;
  storage: string;
  simType: string | null;
  colorNote: string | null;
  batteryHealth: string;
  price: number;
  compareAtPrice: number | null;
  availability: AvailabilityStatus;
  stockQty: number;
  archived: boolean;
  priceNote: string | null;
}

export function parseVariant(raw: Record<string, unknown>, fallbackSku: string): VariantInput {
  const condition = CONDITIONS.includes(raw.condition as ProductCondition) ? (raw.condition as ProductCondition) : "quasi-neuf";
  const compare = int(raw.compareAtPrice, 0);
  return {
    id: Number.isInteger(raw.id) && Number(raw.id) > 0 ? Number(raw.id) : undefined,
    sku: str(raw.sku, 60) || fallbackSku,
    condition,
    storage: str(raw.storage, 30) || "Standard",
    simType: str(raw.simType, 60) || null,
    colorNote: str(raw.colorNote, 60) || null,
    batteryHealth: str(raw.batteryHealth, 120) || "Batterie contrôlée",
    price: int(raw.price, 0),
    compareAtPrice: compare > 0 ? compare : null,
    availability: raw.availability === "on-order" ? "on-order" : "in-stock",
    stockQty: int(raw.stockQty, 0),
    archived: Boolean(raw.archived),
    priceNote: str(raw.priceNote, 120) || null,
  };
}

export interface ProductInput {
  name: string;
  productType: ProductType;
  series: string;
  releaseYear: number;
  tagline: string;
  description: string;
  collectionId: number;
  badge: string | null;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  gallery: GalleryItem[];
  colors: ProductColorOption[];
  specs: ProductSpecs;
  highlights: ProductHighlight[];
}

export function parseProduct(raw: Record<string, unknown>): { data?: ProductInput; error?: string } {
  const name = str(raw.name, 120);
  if (name.length < 2) return { error: "Le nom du produit est obligatoire." };
  const collectionId = int(raw.collectionId, 0);
  if (!collectionId) return { error: "Choisissez une collection." };

  const gallery = (Array.isArray(raw.gallery) ? raw.gallery : [])
    .map((g: Record<string, unknown>, i: number) => ({
      url: str(g?.url, 600),
      alt: str(g?.alt, 160) || name,
      caption: str(g?.caption, 200) || `${name} — photo ${i + 1}`,
    }))
    .filter((g) => /^https?:\/\//.test(g.url) || g.url.startsWith("/"));
  if (gallery.length === 0) return { error: "Ajoutez au moins une photo (URL)." };

  const colors = (Array.isArray(raw.colors) ? raw.colors : [])
    .map((c: Record<string, unknown>) => ({ name: str(c?.name, 50), hex: /^#[0-9a-fA-F]{6}$/.test(str(c?.hex)) ? str(c?.hex) : "#CCCCCC" }))
    .filter((c) => c.name);

  const specsRaw = (raw.specs ?? {}) as Record<string, unknown>;
  const specs = Object.fromEntries(SPEC_KEYS.map((k) => [k, str(specsRaw[k], 600)])) as unknown as ProductSpecs;

  const highlights = (Array.isArray(raw.highlights) ? raw.highlights : [])
    .map((h: Record<string, unknown>) => ({ title: str(h?.title, 80), detail: str(h?.detail, 300) }))
    .filter((h) => h.title);

  return {
    data: {
      name,
      productType: TYPES.includes(raw.productType as ProductType) ? (raw.productType as ProductType) : "iphone",
      series: str(raw.series, 60) || "Autre",
      releaseYear: int(raw.releaseYear, new Date().getFullYear()),
      tagline: str(raw.tagline, 200),
      description: str(raw.description, 4000),
      collectionId,
      badge: str(raw.badge, 40) || null,
      featured: Boolean(raw.featured),
      published: raw.published === undefined ? true : Boolean(raw.published),
      sortOrder: int(raw.sortOrder, 100),
      gallery,
      colors,
      specs,
      highlights,
    },
  };
}
