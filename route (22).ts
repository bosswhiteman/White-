import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  carts,
  cartItems,
  orders,
  orderItems,
  products,
  productVariants,
} from "@/db/schema";
import { buildCartDTO, getOrCreateCart, getSettings } from "@/lib/store";
import {
  calculatePromoDiscount,
  calculateShippingFee,
  getConditionLabel,
} from "@/lib/format";
import { attachCartCookie, extractCartToken } from "@/lib/cart-cookie";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function generateOrderNumber(): string {
  const num = crypto.randomInt(10000, 99999);
  return `MS-225-${num}`;
}

const VALID_DELIVERY = new Set([
  "abidjan-express",
  "retrait-boutique",
  "interieur-ci",
]);

const VALID_PAYMENT = new Set([
  "livraison-especes",
  "wave",
  "orange-money",
  "mtn-momo",
]);

export async function POST(req: NextRequest) {
  try {
    const token = extractCartToken(req);
    const cart = await getOrCreateCart(token);
    const cartDto = await buildCartDTO(cart.id);

    if (cartDto.items.length === 0) {
      return NextResponse.json(
        { error: "Votre panier est vide." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const fullName = String(body.fullName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const email = body.email ? String(body.email).trim() : null;
    const deliveryMethod = VALID_DELIVERY.has(body.deliveryMethod)
      ? String(body.deliveryMethod)
      : "abidjan-express";
    const paymentMethod = VALID_PAYMENT.has(body.paymentMethod)
      ? String(body.paymentMethod)
      : "livraison-especes";
    const city =
      String(body.city ?? "").trim() ||
      (deliveryMethod === "interieur-ci" ? "Intérieur CI" : "Abidjan");
    const commune =
      String(body.commune ?? "").trim() ||
      (deliveryMethod === "retrait-boutique" ? "Showroom Messi Store" : "Cocody");
    const addressDetails =
      String(body.addressDetails ?? "").trim() ||
      (deliveryMethod === "retrait-boutique"
        ? "Retrait direct au showroom Messi Store"
        : commune);
    const customerNote = body.customerNote
      ? String(body.customerNote).trim().slice(0, 500)
      : null;

    if (fullName.length < 2) {
      return NextResponse.json(
        { error: "Veuillez renseigner votre nom et prénom." },
        { status: 400 }
      );
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 8) {
      return NextResponse.json(
        { error: "Veuillez entrer un numéro de téléphone ou WhatsApp valide (ex: 07 / 05 / 01...)." },
        { status: 400 }
      );
    }

    if (deliveryMethod !== "retrait-boutique" && addressDetails.length < 3) {
      return NextResponse.json(
        { error: "Veuillez préciser votre quartier ou repère de livraison." },
        { status: 400 }
      );
    }

    const storeSettings = await getSettings();

    const createdOrder = await db.transaction(async (tx) => {
      const freshRows = await tx
        .select({
          item: cartItems,
          product: products,
          variant: productVariants,
        })
        .from(cartItems)
        .innerJoin(products, eq(cartItems.productId, products.id))
        .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
        .where(eq(cartItems.cartId, cart.id));

      if (freshRows.length === 0) {
        throw new Error("EMPTY_CART");
      }

      const subtotal = freshRows.reduce(
        (sum, r) => sum + r.variant.price * r.item.quantity,
        0
      );
      const promo = calculatePromoDiscount(subtotal, cart.promoCode);
      const discount = promo.valid ? promo.discount : 0;
      const afterDiscount = Math.max(0, subtotal - discount);
      const shippingFee = calculateShippingFee(deliveryMethod, afterDiscount, storeSettings);
      const total = afterDiscount + shippingFee;

      const orderNumber = generateOrderNumber();

      const [order] = await tx
        .insert(orders)
        .values({
          orderNumber,
          fullName,
          phone,
          email: email && email.includes("@") ? email : null,
          city,
          commune,
          addressDetails,
          deliveryMethod,
          paymentMethod,
          customerNote,
          promoCode: promo.valid ? promo.code : null,
          subtotal,
          discount,
          shippingFee,
          total,
          status: "confirmée",
        })
        .returning();

      for (const row of freshRows) {
        const labelParts = [
          getConditionLabel(row.variant.condition),
          row.variant.storage !== "Standard" ? row.variant.storage : null,
          row.variant.simType,
        ].filter(Boolean);

        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: row.product.id,
          variantId: row.variant.id,
          productName: row.product.name,
          productBrand: row.product.brand,
          productSlug: row.product.slug,
          variantLabel: labelParts.join(" · "),
          selectedColor: row.item.selectedColor,
          imageUrl: row.product.primaryImage,
          unitPrice: row.variant.price,
          quantity: row.item.quantity,
          lineTotal: row.variant.price * row.item.quantity,
        });

        await tx
          .update(productVariants)
          .set({
            stockQty: sql`GREATEST(1, ${productVariants.stockQty} - ${row.item.quantity})`,
          })
          .where(eq(productVariants.id, row.variant.id));
      }

      await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      await tx
        .update(carts)
        .set({ promoCode: null, updatedAt: new Date() })
        .where(eq(carts.id, cart.id));

      return order;
    });

    const emptyCart = await buildCartDTO(cart.id);
    const res = NextResponse.json(
      {
        orderNumber: createdOrder.orderNumber,
        total: createdOrder.total,
        cart: emptyCart,
      },
      { status: 201 }
    );
    return attachCartCookie(res, cart.sessionToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "EMPTY_CART") {
      return NextResponse.json(
        { error: "Votre panier est vide." },
        { status: 400 }
      );
    }
    console.error("POST /api/checkout error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement de la commande. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
