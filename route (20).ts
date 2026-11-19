import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { carts } from "@/db/schema";
import { buildCartDTO, getOrCreateCart } from "@/lib/store";
import { calculatePromoDiscount } from "@/lib/format";
import { attachCartCookie, extractCartToken } from "@/lib/cart-cookie";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawCode = body.code ? String(body.code).trim() : "";

    const token = extractCartToken(req);
    const cart = await getOrCreateCart(token);

    if (!rawCode) {
      await db
        .update(carts)
        .set({ promoCode: null, updatedAt: new Date() })
        .where(eq(carts.id, cart.id));
      const dto = await buildCartDTO(cart.id);
      return attachCartCookie(NextResponse.json({ cart: dto }), cart.sessionToken);
    }

    const current = await buildCartDTO(cart.id);
    const check = calculatePromoDiscount(current.subtotal, rawCode);

    if (!check.valid || !check.code) {
      return NextResponse.json(
        { error: check.message ?? "Code promo invalide." },
        { status: 400 }
      );
    }

    await db
      .update(carts)
      .set({ promoCode: check.code, updatedAt: new Date() })
      .where(eq(carts.id, cart.id));

    const updated = await buildCartDTO(cart.id);
    return attachCartCookie(
      NextResponse.json({ cart: updated }),
      cart.sessionToken
    );
  } catch (error) {
    console.error("POST /api/cart/promo error:", error);
    return NextResponse.json(
      { error: "Impossible d'appliquer le code promo." },
      { status: 500 }
    );
  }
}
