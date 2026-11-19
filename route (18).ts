import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cartItems, carts, productVariants } from "@/db/schema";
import { buildCartDTO, getOrCreateCart } from "@/lib/store";
import { attachCartCookie, extractCartToken } from "@/lib/cart-cookie";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await context.params;
    const id = Number(itemId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid cart item." }, { status: 400 });
    }

    const body = await req.json();
    const quantity = Number(body.quantity);
    if (!Number.isInteger(quantity)) {
      return NextResponse.json({ error: "Invalid quantity." }, { status: 400 });
    }

    const token = extractCartToken(req);
    const cart = await getOrCreateCart(token);

    const existingRows = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, id), eq(cartItems.cartId, cart.id)))
      .limit(1);

    const item = existingRows[0];
    if (!item) {
      const dto = await buildCartDTO(cart.id);
      return attachCartCookie(NextResponse.json({ cart: dto }), cart.sessionToken);
    }

    if (quantity <= 0) {
      await db.delete(cartItems).where(eq(cartItems.id, item.id));
    } else {
      const variantRows = await db
        .select({ stockQty: productVariants.stockQty })
        .from(productVariants)
        .where(eq(productVariants.id, item.variantId))
        .limit(1);
      const maxStock = variantRows[0]?.stockQty ?? 10;
      const clampedQty = Math.min(Math.max(1, maxStock), Math.min(10, quantity));

      await db
        .update(cartItems)
        .set({ quantity: clampedQty, updatedAt: new Date() })
        .where(eq(cartItems.id, item.id));
    }

    await db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cart.id));

    const dto = await buildCartDTO(cart.id);
    const res = NextResponse.json({ cart: dto });
    return attachCartCookie(res, cart.sessionToken);
  } catch (error) {
    console.error("PATCH /api/cart/items/[itemId] error:", error);
    return NextResponse.json(
      { error: "Unable to update quantity." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await context.params;
    const id = Number(itemId);
    const token = extractCartToken(req);
    const cart = await getOrCreateCart(token);

    if (Number.isInteger(id) && id > 0) {
      await db
        .delete(cartItems)
        .where(and(eq(cartItems.id, id), eq(cartItems.cartId, cart.id)));
      await db
        .update(carts)
        .set({ updatedAt: new Date() })
        .where(eq(carts.id, cart.id));
    }

    const dto = await buildCartDTO(cart.id);
    const res = NextResponse.json({ cart: dto });
    return attachCartCookie(res, cart.sessionToken);
  } catch (error) {
    console.error("DELETE /api/cart/items/[itemId] error:", error);
    return NextResponse.json(
      { error: "Unable to remove item." },
      { status: 500 }
    );
  }
}
