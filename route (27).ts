import { NextRequest, NextResponse } from "next/server";
import { getOrderByNumber } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await context.params;
    const order = await getOrderByNumber(orderNumber);
    if (!order) {
      return NextResponse.json(
        { error: "Commande introuvable. Vérifiez votre référence (ex : MS-225-12345)." },
        { status: 404 }
      );
    }
    return NextResponse.json({ order });
  } catch (error) {
    console.error("GET /api/orders/[orderNumber] error:", error);
    return NextResponse.json(
      { error: "Impossible de rechercher la commande." },
      { status: 500 }
    );
  }
}
