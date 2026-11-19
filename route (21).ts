import { NextRequest, NextResponse } from "next/server";
import { buildCartDTO, getOrCreateCart } from "@/lib/store";
import { attachCartCookie, extractCartToken } from "@/lib/cart-cookie";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = extractCartToken(req);
    const cart = await getOrCreateCart(token);
    const dto = await buildCartDTO(cart.id);
    const res = NextResponse.json({ cart: dto });
    return attachCartCookie(res, cart.sessionToken);
  } catch (error) {
    console.error("GET /api/cart error:", error);
    return NextResponse.json(
      { error: "Unable to load shopping bag." },
      { status: 500 }
    );
  }
}
