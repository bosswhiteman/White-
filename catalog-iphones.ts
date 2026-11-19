import type { ProductSpecs } from "./schema";
import type { SeedProduct, SeedVariant } from "./seed-types";
import { IPHONE_MODERN_PRODUCTS } from "./catalog-iphones-modern";
import { IPHONE_CLASSIC_PRODUCTS } from "./catalog-iphones-classic";

/**
 * TARIFICATION OFFICIELLE iPHONE — Messi Store
 *
 * - QUASI NEUF (catégorie par défaut) : grille de prix fournie par Messi Store.
 *   Les lignes marquées ❌ dans la grille sont affichées « Sur commande ».
 * - NOUVEAU (NON ACTIVÉ) : série 17 selon la grille Messi Store.
 * - NEUF SCELLÉ : prix relevés sur des boutiques en ligne d'Abidjan
 *   (Djokstore.ci, IvoireMobiles.net) — modifiables depuis l'espace admin.
 * - price = 0 : « Prix sur demande » (aucun prix vérifié).
 */

const GRID = "Grille Messi Store";
const MARKET = "Réf. boutiques Abidjan (Djokstore / IvoireMobiles)";

type Avail = "in-stock" | "on-order";

function quasi(sku: string, storage: string, price: number, availability: Avail = "in-stock"): SeedVariant {
  return {
    sku,
    condition: "quasi-neuf",
    storage,
    simType: "Nano‑SIM + eSIM",
    price,
    availability: price > 0 ? availability : "on-order",
    stockQty: price > 0 && availability === "in-stock" ? 5 : 2,
    fromOfficialSheet: price > 0,
    priceNote: price > 0 ? GRID : undefined,
  };
}

function scelle(sku: string, storage: string, price: number, note: string = MARKET): SeedVariant {
  return {
    sku,
    condition: "neuf-scelle",
    storage,
    simType: "Nano‑SIM + eSIM",
    price,
    availability: price > 0 ? "in-stock" : "on-order",
    stockQty: price > 0 ? 3 : 1,
    fromOfficialSheet: false,
    priceNote: price > 0 ? note : undefined,
  };
}

function occasion(sku: string, storage: string): SeedVariant {
  return {
    sku,
    condition: "seconde-main",
    storage,
    simType: "Nano‑SIM + eSIM",
    price: 0,
    availability: "on-order",
    stockQty: 1,
  };
}

function nonActive(sku: string, price: number, simType: string, colorNote: string): SeedVariant {
  return {
    sku,
    condition: "nouveau",
    storage: "256 Go",
    simType,
    colorNote,
    price,
    availability: "in-stock",
    stockQty: 3,
    fromOfficialSheet: true,
    priceNote: GRID,
  };
}

interface PricingEntry {
  tagline: string;
  badge?: string;
  variants: SeedVariant[];
  specs?: Partial<ProductSpecs>;
}

const PRICING: Record<string, PricingEntry> = {
  // ---------------- SÉRIE X ----------------
  "iphone-x": {
    tagline: "L'iPhone qui a inauguré l'écran OLED bord à bord et Face ID.",
    variants: [quasi("IPX-QN-64", "64 Go", 0), occasion("IPX-SM-64", "64 Go")],
  },
  "iphone-xr": {
    tagline: "Écran Liquid Retina 6,1\", Face ID et puce A12 Bionic — le meilleur petit budget.",
    badge: "Meilleur prix",
    variants: [quasi("IPXR-QN-64", "64 Go", 92000), scelle("IPXR-NS-64", "64 Go", 0), occasion("IPXR-SM-64", "64 Go")],
  },
  "iphone-xs": {
    tagline: "Écran Super Retina OLED 5,8\", double caméra avec téléobjectif 2×.",
    variants: [quasi("IPXS-QN-64", "64 Go", 0), occasion("IPXS-SM-64", "64 Go")],
  },
  "iphone-xs-max": {
    tagline: "Grand écran Super Retina OLED 6,5\" et cadre en acier inoxydable.",
    variants: [quasi("IPXSM-QN-64", "64 Go", 0), occasion("IPXSM-SM-64", "64 Go")],
  },
  // ---------------- SÉRIE 11 ----------------
  "iphone-11": {
    tagline: "Double caméra 12 Mpx avec ultra grand‑angle, Mode Nuit et grande autonomie.",
    variants: [quasi("IP11-QN-128", "128 Go", 122000, "on-order"), scelle("IP11-NS-128", "128 Go", 0), occasion("IP11-SM-128", "128 Go")],
  },
  "iphone-11-pro": {
    tagline: "Triple caméra Pro, écran OLED 5,8\" et finition acier inoxydable.",
    badge: "Triple caméra Pro",
    variants: [quasi("IP11P-QN-64", "64 Go", 140000), occasion("IP11P-SM-64", "64 Go")],
  },
  "iphone-11-pro-max": {
    tagline: "Triple caméra Pro, grand écran OLED 6,5\" et batterie 3 969 mAh.",
    variants: [quasi("IP11PM-QN-64", "64 Go", 0), occasion("IP11PM-SM-64", "64 Go")],
  },
  // ---------------- SÉRIE 12 ----------------
  "iphone-12": {
    tagline: "Bords plats, écran OLED 6,1\", 5G et MagSafe dans 164 g.",
    variants: [
      quasi("IP12-QN-64", "64 Go", 125000, "on-order"),
      quasi("IP12-QN-128", "128 Go", 140000, "on-order"),
      occasion("IP12-SM-64", "64 Go"),
    ],
  },
  "iphone-12-pro": {
    tagline: "Acier inoxydable, triple caméra avec LiDAR, 6 Go de RAM et 5G.",
    variants: [
      quasi("IP12P-QN-128", "128 Go", 175000),
      quasi("IP12P-QN-256", "256 Go", 190000, "on-order"),
      occasion("IP12P-SM-128", "128 Go"),
    ],
  },
  "iphone-12-pro-max": {
    tagline: "Grand écran OLED 6,7\", stabilisation par capteur et LiDAR.",
    variants: [
      quasi("IP12PM-QN-128", "128 Go", 195000),
      quasi("IP12PM-QN-256", "256 Go", 210000),
      occasion("IP12PM-SM-128", "128 Go"),
    ],
  },
  // ---------------- SÉRIE 13 ----------------
  "iphone-13": {
    tagline: "Puce A15 Bionic, Mode Cinématique et excellente autonomie.",
    badge: "Le plus vendu",
    variants: [
      quasi("IP13-QN-128", "128 Go", 155000),
      quasi("IP13-QN-256", "256 Go", 195000),
      occasion("IP13-SM-128", "128 Go"),
    ],
  },
  "iphone-13-pro": {
    tagline: "Écran ProMotion 120 Hz, triple caméra avec macro et LiDAR.",
    variants: [
      quasi("IP13P-QN-128", "128 Go", 230000, "on-order"),
      quasi("IP13P-QN-256", "256 Go", 240000, "on-order"),
      scelle("IP13P-NS-128", "128 Go", 249900),
      scelle("IP13P-NS-256", "256 Go", 276900),
      occasion("IP13P-SM-128", "128 Go"),
    ],
  },
  "iphone-13-pro-max": {
    tagline: "ProMotion 120 Hz, autonomie de référence et acier inoxydable.",
    variants: [
      quasi("IP13PM-QN-128", "128 Go", 255000, "on-order"),
      quasi("IP13PM-QN-256", "256 Go", 270000),
      occasion("IP13PM-SM-128", "128 Go"),
    ],
  },
  // ---------------- SÉRIE 14 ----------------
  "iphone-14": {
    tagline: "Puce A15 (GPU 5 cœurs), 6 Go de RAM, détection des accidents.",
    variants: [quasi("IP14-QN-128", "128 Go", 210000), occasion("IP14-SM-128", "128 Go")],
  },
  "iphone-14-plus": {
    tagline: "Grand écran 6,7\" et l'une des meilleures autonomies d'iPhone.",
    variants: [quasi("IP14PL-QN-128", "128 Go", 250000), occasion("IP14PL-SM-128", "128 Go")],
  },
  "iphone-14-pro": {
    tagline: "Dynamic Island, écran Always‑On 120 Hz et capteur principal 48 Mpx.",
    variants: [
      quasi("IP14P-QN-128", "128 Go", 280000),
      quasi("IP14P-QN-256", "256 Go", 305000),
      occasion("IP14P-SM-128", "128 Go"),
    ],
  },
  "iphone-14-pro-max": {
    tagline: "Dynamic Island, 48 Mpx, écran 6,7\" ProMotion et acier inoxydable.",
    badge: "Très demandé",
    variants: [
      quasi("IP14PM-QN-128", "128 Go", 305000),
      quasi("IP14PM-QN-256", "256 Go", 330000),
      occasion("IP14PM-SM-128", "128 Go"),
    ],
  },
  // ---------------- SÉRIE 15 ----------------
  "iphone-15": {
    tagline: "Dynamic Island, caméra 48 Mpx, verre teinté dans la masse et USB‑C.",
    variants: [
      quasi("IP15-QN-128", "128 Go", 0),
      scelle("IP15-NS-128", "128 Go", 389900),
      scelle("IP15-NS-256", "256 Go", 459900),
      occasion("IP15-SM-128", "128 Go"),
    ],
  },
  "iphone-15-plus": {
    tagline: "Écran 6,7\" Dynamic Island, 48 Mpx, USB‑C et grande autonomie.",
    variants: [
      quasi("IP15PL-QN-128", "128 Go", 320000),
      scelle("IP15PL-NS-128", "128 Go", 479900),
      occasion("IP15PL-SM-128", "128 Go"),
    ],
  },
  "iphone-15-pro": {
    tagline: "Titane, puce A17 Pro, bouton Action et USB‑C 3.",
    variants: [quasi("IP15P-QN-128", "128 Go", 385000, "on-order"), occasion("IP15P-SM-128", "128 Go")],
  },
  "iphone-15-pro-max": {
    tagline: "Titane, téléobjectif 5×, A17 Pro et USB‑C 3.",
    variants: [quasi("IP15PM-QN-256", "256 Go", 440000, "on-order"), occasion("IP15PM-SM-256", "256 Go")],
  },
  // ---------------- SÉRIE 16 ----------------
  "iphone-16": {
    tagline: "Puce A18, Commande de l'appareil photo et bouton Action.",
    variants: [
      quasi("IP16-QN-128", "128 Go", 0),
      scelle("IP16-NS-128", "128 Go", 421900),
      scelle("IP16-NS-256", "256 Go", 465900),
      occasion("IP16-SM-128", "128 Go"),
    ],
  },
  "iphone-16-plus": {
    tagline: "Écran 6,7\", puce A18 et batterie longue durée.",
    variants: [
      quasi("IP16PL-QN-128", "128 Go", 0),
      scelle("IP16PL-NS-128", "128 Go", 509900),
      occasion("IP16PL-SM-128", "128 Go"),
    ],
  },
  "iphone-16-pro": {
    tagline: "Titane, A18 Pro, téléobjectif 5× et vidéo 4K 120 i/s.",
    variants: [
      quasi("IP16P-QN-128", "128 Go", 470000, "on-order"),
      scelle("IP16P-NS-256", "256 Go", 554900),
      occasion("IP16P-SM-128", "128 Go"),
    ],
  },
  "iphone-16-pro-max": {
    tagline: "Écran 6,9\", titane, A18 Pro et jusqu'à 33 h de vidéo.",
    variants: [
      quasi("IP16PM-QN-256", "256 Go", 0),
      scelle("IP16PM-NS-256", "256 Go", 621900),
      occasion("IP16PM-SM-256", "256 Go"),
    ],
  },
  // ---------------- SÉRIE 17 ----------------
  "iphone-17": {
    tagline: "ProMotion 120 Hz, double 48 Mpx, caméra avant 18 Mpx et 256 Go de base.",
    variants: [
      scelle("IP17-NS-256", "256 Go", 569900, "Réf. IvoireMobiles Abidjan"),
      quasi("IP17-QN-256", "256 Go", 0),
    ],
    specs: {
      camera: "Double 48 Mpx (Fusion f/1.6 avec stabilisation + ultra grand‑angle 48 Mpx macro) · zoom 2× qualité optique · vidéo 4K 60 i/s",
      batterie: "3 692 mAh · charge rapide USB‑C · MagSafe 25 W",
    },
  },
  "iphone-17-air": {
    tagline: "L'iPhone le plus fin (5,64 mm), cadre titane, puce A19 Pro.",
    badge: "Non activé · Bleu",
    variants: [nonActive("IP17AIR-NA-256-BLU", 530000, "eSIM", "Bleu"), quasi("IP17AIR-QN-256", "256 Go", 0)],
    specs: {
      batterie: "3 149 mAh (eSIM) · jusqu'à 27 h de vidéo · MagSafe jusqu'à 20 W",
      simReseau: "eSIM uniquement · 5G · Wi‑Fi 7 · puce N1 · modem Apple C1X",
    },
  },
  "iphone-17-pro": {
    tagline: "A19 Pro, triple 48 Mpx avec zoom 8× qualité optique — eSIM ou SIM physique.",
    badge: "Non activé",
    variants: [
      nonActive("IP17P-NA-256-ESIM", 685000, "eSIM", "Blanc / Orange"),
      nonActive("IP17P-NA-256-SIM-ORG", 770000, "SIM physique", "Orange"),
      nonActive("IP17P-NA-256-SIM-WHT", 775000, "SIM physique", "Blanc"),
      quasi("IP17P-QN-256", "256 Go", 0),
    ],
    specs: {
      batterie: "4 252 mAh (eSIM) / 3 988 mAh (SIM physique) · jusqu'à 33 h de vidéo (eSIM) · MagSafe 25 W",
      simReseau: "Version eSIM (double eSIM) ou version Nano‑SIM + eSIM · 5G · Wi‑Fi 7 · USB‑C 3 (10 Gb/s)",
    },
  },
  "iphone-17-pro-max": {
    tagline: "Écran 6,9\", A19 Pro, triple 48 Mpx et la plus grande batterie d'iPhone.",
    badge: "Non activé",
    variants: [
      nonActive("IP17PM-NA-256-ESIM", 750000, "eSIM", "Blanc / Orange"),
      quasi("IP17PM-QN-256", "256 Go", 0),
    ],
    specs: {
      batterie: "5 088 mAh (eSIM) / 4 823 mAh (SIM physique) · jusqu'à 39 h de vidéo · MagSafe 25 W",
    },
  },
};

const PRICE_PATTERN = /(FCFA|\d{2,3}[\s.\u202f]?000\s?F\b|scell|non activ|en stock|disponible|sur commande|stock imm|Quasi Neuf|Seconde Main|offre officielle|tarif)/i;

function cleanDescription(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const kept = sentences.filter((s) => !PRICE_PATTERN.test(s));
  const base = kept.join(" ").trim();
  return `${base}${base ? " " : ""}Chaque appareil est contrôlé avant remise (IMEI, Face ID, True Tone, réseau, caméras et état de la batterie).`;
}

const GENERIC_WARRANTY =
  "Téléphone + câble de charge · Contrôle complet avant remise · Reçu Messi Store · Garantie selon l'état (voir ci‑dessous)";

function mapProduct(item: SeedProduct): SeedProduct {
  const pricing = PRICING[item.slug];
  if (!pricing) return { ...item, reviews: [] };

  return {
    ...item,
    tagline: pricing.tagline,
    badge: pricing.badge,
    description: cleanDescription(item.description),
    highlights: item.highlights.filter(
      (h) => !PRICE_PATTERN.test(h.title) && !PRICE_PATTERN.test(h.detail)
    ),
    gallery: item.gallery.map((g, idx) => ({
      ...g,
      caption: PRICE_PATTERN.test(g.caption)
        ? `${item.name} — photo ${idx + 1}`
        : g.caption,
    })),
    specs: {
      ...item.specs,
      ...pricing.specs,
      contenuGarantie: GENERIC_WARRANTY,
    },
    variants: pricing.variants,
    reviews: [],
  };
}

export const IPHONE_PRODUCTS: SeedProduct[] = [
  ...IPHONE_MODERN_PRODUCTS,
  ...IPHONE_CLASSIC_PRODUCTS,
].map(mapProduct);
