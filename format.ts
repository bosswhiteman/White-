import type {
  AvailabilityStatus,
  GalleryItem,
  ProductColorOption,
  ProductCondition,
  ProductHighlight,
  ProductSpecs,
  ProductType,
} from "@/db/schema";

export interface StoreSettings {
  announcement: string;
  deliveryAbidjan: number;
  deliveryInterieur: number;
  freeDeliveryThreshold: number;
  showroomAddress: string;
  openingHours: string;
  experienceYears: number;
  aboutText: string;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  announcement:
    "Arrivage iPhone Quasi Neufs Grade A+ · Contrôle IMEI & reçu à chaque achat · Livraison Abidjan",
  deliveryAbidjan: 2000,
  deliveryInterieur: 5000,
  freeDeliveryThreshold: 150000,
  showroomAddress: "Abidjan, Côte d'Ivoire",
  openingHours: "Lundi – Samedi : 9h00 – 20h00 · Dimanche sur rendez‑vous",
  experienceYears: 0,
  aboutText:
    "Messi est spécialisé exclusivement dans l'iPhone et l'univers Apple. Chaque appareil passe entre ses mains avant de vous être proposé : vérification de l'origine, test complet des fonctions et conseil honnête pour choisir le modèle adapté à votre usage et à votre budget.",
};

export interface ConditionMeta {
  id: ProductCondition;
  label: string;
  shortLabel: string;
  description: string;
  batteryNote: string;
  warranty: string;
  badgeClass: string;
}

export const CONDITIONS_MAP: Record<ProductCondition, ConditionMeta> = {
  "quasi-neuf": {
    id: "quasi-neuf",
    label: "Quasi Neuf Grade A+",
    shortLabel: "Quasi Neuf A+",
    description:
      "Esthétique proche du neuf, aucune pièce réparée ni remplacée. Face ID, True Tone, réseau et caméras testés devant vous.",
    batteryNote: "État de batterie indiqué avant achat",
    warranty: "Garantie boutique + reçu",
    badgeClass: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
  },
  "nouveau": {
    id: "nouveau",
    label: "Nouveau (Non activé)",
    shortLabel: "Non activé",
    description:
      "Appareil neuf jamais activé (0 cycle de charge). La garantie Apple démarre à votre première activation.",
    batteryNote: "Batterie 100 % · 0 cycle",
    warranty: "Garantie constructeur dès l'activation",
    badgeClass: "bg-[#EFF6FF] text-[#0055B3] border-[#BFDBFE]",
  },
  "neuf-scelle": {
    id: "neuf-scelle",
    label: "Neuf Scellé",
    shortLabel: "Neuf Scellé",
    description:
      "Boîte d'origine fermée sous blister. Ouverture et vérification du numéro de série devant vous.",
    batteryNote: "Batterie 100 % d'origine",
    warranty: "Garantie constructeur + reçu",
    badgeClass: "bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]",
  },
  "seconde-main": {
    id: "seconde-main",
    label: "Seconde Main",
    shortLabel: "Seconde Main",
    description:
      "Occasion contrôlée (réseau, caméras, micros, Face ID, charge). Prix et état communiqués sur WhatsApp selon l'arrivage.",
    batteryNote: "Pourcentage de batterie communiqué",
    warranty: "Garantie boutique + reçu",
    badgeClass: "bg-[#F4F4F5] text-[#3F3F46] border-[#E4E4E7]",
  },
};

export const CONDITION_ORDER: ProductCondition[] = [
  "quasi-neuf",
  "nouveau",
  "neuf-scelle",
  "seconde-main",
];

export const PRODUCT_TYPES: Array<{ id: ProductType | "all"; label: string }> = [
  { id: "iphone", label: "iPhone (Série X à 17)" },
  { id: "apple-accessory", label: "Accessoires Apple" },
  { id: "apple-equipment", label: "Équipements Apple" },
  { id: "all", label: "Tout le catalogue" },
];

export const IPHONE_SERIES_ORDER = [
  "Série 17",
  "Série 16",
  "Série 15",
  "Série 14",
  "Série 13",
  "Série 12",
  "Série 11",
  "Série X",
];

export const STORAGE_ORDER = ["64 Go", "128 Go", "256 Go", "512 Go", "1 To", "Standard"];

export function getConditionLabel(condition: ProductCondition): string {
  return CONDITIONS_MAP[condition]?.label ?? condition;
}

export function getConditionShortLabel(condition: ProductCondition): string {
  return CONDITIONS_MAP[condition]?.shortLabel ?? condition;
}

export interface PromoRule {
  code: string;
  label: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal: number;
}

export const PROMO_CODES: Record<string, PromoRule> = {
  MESSI10: {
    code: "MESSI10",
    label: "Remise −10 000 FCFA",
    type: "fixed",
    value: 10000,
    minSubtotal: 150000,
  },
};

export function calculatePromoDiscount(
  subtotal: number,
  rawCode?: string | null
): { valid: boolean; code: string | null; label: string | null; discount: number; message?: string } {
  if (!rawCode || !rawCode.trim()) {
    return { valid: false, code: null, label: null, discount: 0 };
  }
  const rule = PROMO_CODES[rawCode.trim().toUpperCase()];
  if (!rule) {
    return { valid: false, code: null, label: null, discount: 0, message: "Code promo invalide." };
  }
  if (subtotal < rule.minSubtotal) {
    return {
      valid: false,
      code: null,
      label: null,
      discount: 0,
      message: `Le code ${rule.code} s'applique dès ${formatPrice(rule.minSubtotal)} d'achat.`,
    };
  }
  const discount =
    rule.type === "percent"
      ? Math.round((subtotal * rule.value) / 1000) * 10
      : Math.min(rule.value, subtotal);
  return { valid: true, code: rule.code, label: rule.label, discount };
}

export function calculateShippingFee(
  method: string,
  subtotalAfterDiscount: number,
  s: Pick<StoreSettings, "deliveryAbidjan" | "deliveryInterieur" | "freeDeliveryThreshold"> = DEFAULT_STORE_SETTINGS
): number {
  if (method === "retrait-boutique") return 0;
  if (method === "interieur-ci") return s.deliveryInterieur;
  return s.freeDeliveryThreshold > 0 && subtotalAfterDiscount >= s.freeDeliveryThreshold
    ? 0
    : s.deliveryAbidjan;
}

export function formatPrice(fcfa: number): string {
  const spaced = Math.round(fcfa)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${spaced} FCFA`;
}

/** Affichage public d'un prix de variante : 0 = « Prix sur demande ». */
export function priceLabel(fcfa: number): string {
  return fcfa > 0 ? formatPrice(fcfa) : "Prix sur demande";
}

export function formatReviewDate(isoDate: string | Date): string {
  const date = typeof isoDate === "string" ? new Date(isoDate) : isoDate;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export const DELIVERY_METHOD_LABELS: Record<string, string> = {
  "abidjan-express": "Livraison à Abidjan",
  "retrait-boutique": "Retrait au showroom Messi Store",
  "interieur-ci": "Expédition à l'intérieur du pays",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  "livraison-especes": "Espèces à la livraison (après vérification)",
  "wave": "Wave",
  "orange-money": "Orange Money",
  "mtn-momo": "MTN Mobile Money",
};

export const ORDER_STATUSES = [
  { id: "confirmée", label: "Nouvelle / Confirmée", cls: "bg-[#EFF6FF] text-[#0055B3]" },
  { id: "en-preparation", label: "En préparation", cls: "bg-[#FFFBEB] text-[#B45309]" },
  { id: "en-livraison", label: "En livraison", cls: "bg-[#F5F3FF] text-[#6D28D9]" },
  { id: "livrée", label: "Livrée / Payée", cls: "bg-[#ECFDF5] text-[#047857]" },
  { id: "annulée", label: "Annulée", cls: "bg-[#FEF2F2] text-[#B91C1C]" },
];

export interface CollectionDTO {
  id: number;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  heroImage: string;
  featured: boolean;
  productCount: number;
}

export interface VariantDTO {
  id: number;
  productId: number;
  sku: string;
  condition: ProductCondition;
  conditionLabel: string;
  storage: string;
  simType: string | null;
  colorNote: string | null;
  batteryHealth: string;
  price: number;
  compareAtPrice: number | null;
  availability: AvailabilityStatus;
  stockQty: number;
  fromOfficialSheet: boolean;
}

export interface ProductCardDTO {
  id: number;
  slug: string;
  name: string;
  brand: string;
  productType: ProductType;
  series: string;
  releaseYear: number;
  tagline: string;
  collectionSlug: string;
  collectionName: string;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  compareAtPrice: number | null;
  badge: string | null;
  featured: boolean;
  inStock: boolean;
  hasOnOrder: boolean;
  ratingAvg: number;
  reviewCount: number;
  primaryImage: string;
  secondaryImage: string;
  photoCount: number;
  colors: ProductColorOption[];
  storages: string[];
  conditions: ProductCondition[];
  specsSummary: { ecran: string; puce: string; camera: string; batterie: string };
  defaultVariant: VariantDTO;
  variants: VariantDTO[];
}

export interface ReviewDTO {
  id: number;
  productId: number;
  productName?: string;
  productSlug?: string;
  authorName: string;
  authorLocation: string;
  rating: number;
  title: string;
  body: string;
  variantLabel: string | null;
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
}

export interface ProductDetailDTO extends ProductCardDTO {
  description: string;
  gallery: GalleryItem[];
  specs: ProductSpecs;
  highlights: ProductHighlight[];
  reviews: ReviewDTO[];
  ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number>;
  relatedProducts: ProductCardDTO[];
}

export interface PriceSheetRowDTO {
  variantId: number;
  productSlug: string;
  productName: string;
  series: string;
  condition: ProductCondition;
  storage: string;
  simType: string | null;
  colorNote: string | null;
  price: number;
  availability: AvailabilityStatus;
}

export interface CartItemDTO {
  id: number;
  productId: number;
  variantId: number;
  slug: string;
  name: string;
  brand: string;
  condition: ProductCondition;
  conditionLabel: string;
  storage: string;
  simType: string | null;
  selectedColor: string;
  availability: AvailabilityStatus;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  stockQty: number;
  lineTotal: number;
}

export interface CartDTO {
  sessionToken: string;
  items: CartItemDTO[];
  itemCount: number;
  subtotal: number;
  promoCode: string | null;
  promoLabel: string | null;
  discount: number;
  total: number;
  freeDeliveryThreshold: number;
  remainingForFreeDelivery: number;
}

export interface OrderItemDTO {
  id: number;
  productId: number;
  productName: string;
  productBrand: string;
  productSlug: string;
  variantLabel: string;
  selectedColor: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderDTO {
  id: number;
  orderNumber: string;
  fullName: string;
  phone: string;
  email: string | null;
  city: string;
  commune: string;
  addressDetails: string;
  deliveryMethod: string;
  paymentMethod: string;
  customerNote: string | null;
  promoCode: string | null;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItemDTO[];
}
