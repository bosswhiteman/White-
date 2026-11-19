import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  real,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type ProductCondition =
  | "nouveau"
  | "neuf-scelle"
  | "quasi-neuf"
  | "seconde-main";

export type ProductType = "iphone" | "apple-equipment" | "apple-accessory";

export type AvailabilityStatus = "in-stock" | "on-order";

export interface GalleryItem {
  url: string;
  alt: string;
  caption: string;
}

export interface ProductColorOption {
  name: string;
  hex: string;
}

export interface ProductSpecs {
  ecran: string;
  puce: string;
  camera: string;
  selfie: string;
  batterie: string;
  simReseau: string;
  securite: string;
  resistance: string;
  dimensionsPoids: string;
  systeme: string;
  contenuGarantie: string;
}

export interface ProductHighlight {
  title: string;
  detail: string;
}

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  subtitle: text("subtitle").notNull(),
  description: text("description").notNull(),
  heroImage: text("hero_image").notNull(),
  featured: boolean("featured").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  brand: text("brand").notNull().default("Apple"),
  published: boolean("published").notNull().default(true),
  productType: text("product_type").$type<ProductType>().notNull(),
  series: text("series").notNull(), // "Série 17" .. "Série X", "Galaxy S", etc.
  releaseYear: integer("release_year").notNull().default(2024),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  collectionId: integer("collection_id")
    .notNull()
    .references(() => collections.id, { onDelete: "restrict" }),
  basePrice: integer("base_price").notNull(), // FCFA
  compareAtPrice: integer("compare_at_price"), // FCFA
  badge: text("badge"),
  featured: boolean("featured").notNull().default(false),
  inStock: boolean("in_stock").notNull().default(true),
  ratingAvg: real("rating_avg").notNull().default(4.9),
  reviewCount: integer("review_count").notNull().default(0),
  primaryImage: text("primary_image").notNull(),
  galleryJson: jsonb("gallery_json").$type<GalleryItem[]>().notNull(),
  colorsJson: jsonb("colors_json").$type<ProductColorOption[]>().notNull(),
  specsJson: jsonb("specs_json").$type<ProductSpecs>().notNull(),
  highlightsJson: jsonb("highlights_json").$type<ProductHighlight[]>().notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  sku: text("sku").notNull().unique(),
  condition: text("condition").$type<ProductCondition>().notNull(),
  storage: text("storage").notNull(), // "64 Go", "128 Go", "256 Go", "512 Go", "1 To", etc.
  simType: text("sim_type"), // "eSIM", "SIM Physique", "Nano-SIM + eSIM"
  colorNote: text("color_note"), // e.g. "Bleu", "Blanc / Orange", "Blanc", "Orange"
  batteryHealth: text("battery_health").notNull(),
  price: integer("price").notNull(), // FCFA
  compareAtPrice: integer("compare_at_price"), // FCFA
  availability: text("availability")
    .$type<AvailabilityStatus>()
    .notNull()
    .default("in-stock"),
  stockQty: integer("stock_qty").notNull().default(10),
  fromOfficialSheet: boolean("from_official_sheet").notNull().default(false),
  priceNote: text("price_note"),
  archived: boolean("archived").notNull().default(false),
});

/** Photos envoyées depuis l'admin (stockées en base pour survivre aux redéploiements). */
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  mime: text("mime").notNull(),
  data: text("data").notNull(), // base64
  size: integer("size").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  authorLocation: text("author_location").notNull(),
  rating: integer("rating").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  variantLabel: text("variant_label"),
  verifiedPurchase: boolean("verified_purchase").notNull().default(true),
  approved: boolean("approved").notNull().default(false),
  helpfulCount: integer("helpful_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  promoCode: text("promo_code"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cartItems = pgTable(
  "cart_items",
  {
    id: serial("id").primaryKey(),
    cartId: integer("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: integer("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    selectedColor: text("selected_color").notNull().default("À confirmer sur WhatsApp"),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("cart_items_cart_variant_color_idx").on(
      table.cartId,
      table.variantId,
      table.selectedColor
    ),
  ]
);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  city: text("city").notNull(),
  commune: text("commune").notNull(),
  addressDetails: text("address_details").notNull(),
  deliveryMethod: text("delivery_method").notNull(),
  paymentMethod: text("payment_method").notNull(),
  customerNote: text("customer_note"),
  promoCode: text("promo_code"),
  subtotal: integer("subtotal").notNull(),
  discount: integer("discount").notNull().default(0),
  shippingFee: integer("shipping_fee").notNull().default(0),
  total: integer("total").notNull(),
  status: text("status").notNull().default("confirmée"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  variantId: integer("variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "restrict" }),
  productName: text("product_name").notNull(),
  productBrand: text("product_brand").notNull(),
  productSlug: text("product_slug").notNull(),
  variantLabel: text("variant_label").notNull(),
  selectedColor: text("selected_color").notNull(),
  imageUrl: text("image_url").notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  lineTotal: integer("line_total").notNull(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  contact: text("contact").notNull().unique(), // WhatsApp or Email
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
