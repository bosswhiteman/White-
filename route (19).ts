import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cartItems, carts, productVariants } from "@/db/schema";
import { buildCartDTO, getOrCreateCart } from "@/lib/store";
import { attachCartCookie, extractCartToken } from "@/lib/cart-cookie";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const variantId = Number(body.variantId);
    const requestedQty = Math.max(1, Math.min(10, Number(body.quantity ?? 1)));
    const selectedColor =
      String(body.selectedColor ?? "")
        .trim()
        .slice(0, 60) || "À confirmer sur WhatsApp";

    if (!Number.isInteger(variantId) || variantId <= 0) {
      return NextResponse.json(
        { error: "Veuillez sélectionner une version valide." },
        { status: 400 }
      );
    }

    const token = extractCartToken(req);
    const cart = await getOrCreateCart(token);

    const variantRows = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, variantId))
      .limit(1);

    const variant = variantRows[0];
    if (!variant) {
      return NextResponse.json(
        { error: "Cette option n'est plus disponible." },
        { status: 404 }
      );
    }

    if (variant.price <= 0 || variant.archived) {
      return NextResponse.json(
        { error: "Prix sur demande : contactez-nous sur WhatsApp au 05 45 63 79 22 pour ce modèle." },
        { status: 409 }
      );
    }

    const maxAllowed = Math.max(1, Math.min(10, variant.stockQty));

    const existingRows = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cart.id),
          eq(cartItems.variantId, variant.id),
          eq(cartItems.selectedColor, selectedColor)
        )
      )
      .limit(1);

    const existing = existingRows[0];
    if (existing) {
      const nextQty = Math.min(maxAllowed, existing.quantity + requestedQty);
      await db
        .update(cartItems)
        .set({ quantity: nextQty, updatedAt: new Date() })
        .where(eq(cartItems.id, existing.id));
    } else {
      const nextQty = Math.min(maxAllowed, requestedQty);
      await db.insert(cartItems).values({
        cartId: cart.id,
        productId: variant.productId,
        variantId: variant.id,
        selectedColor,
        quantity: nextQty,
      });
    }

    await db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cart.id));

    const dto = await buildCartDTO(cart.id);
    const res = NextResponse.json({ cart: dto });
    return attachCartCookie(res, cart.sessionToken);
  } catch (error) {
    console.error("POST /api/cart/items error:", error);
    return NextResponse.json(
      { error: "Impossible d'ajouter l'article au panier." },
      { status: 500 }
    );
  }
}
