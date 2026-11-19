import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { collections, products, productVariants, type ProductCondition } from "@/db/schema";
import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { isAdminRequest, unauthorized } from "@/lib/admin-auth";
import { removeVariants } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

const CONDITIONS: ProductCondition[] = ["quasi-neuf", "nouveau", "neuf-scelle", "seconde-main"];

/**
 * Modification collective.
 * scope "variants" : set-price, adjust-percent, adjust-amount, set-availability, set-stock,
 *                    set-condition, set-battery, set-on-request, archive, restore, delete
 * scope "products" : publish, unpublish, feature, unfeature, set-badge, set-collection
 */
export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  try {
    const body = await req.json();
    const scope = body.scope === "products" ? "products" : "variants";
    const ids: number[] = (Array.isArray(body.ids) ? body.ids : []).map(Number).filter((n: number) => Number.isInteger(n) && n > 0);
    const action = String(body.action ?? "");
    const value = body.value;
    if (ids.length === 0) return NextResponse.json({ error: "Aucun élément sélectionné." }, { status: 400 });

    if (scope === "variants") {
      const where = inArray(productVariants.id, ids);
      const num = Number(value);
      switch (action) {
        case "set-price":
          if (!Number.isFinite(num) || num < 0) return NextResponse.json({ error: "Prix invalide." }, { status: 400 });
          await db.update(productVariants).set({ price: Math.round(num) }).where(where);
          break;
        case "set-on-request":
          await db.update(productVariants).set({ price: 0, availability: "on-order" }).where(where);
          break;
        case "adjust-percent":
          if (!Number.isFinite(num)) return NextResponse.json({ error: "Pourcentage invalide." }, { status: 400 });
          await db
            .update(productVariants)
            .set({ price: sql`GREATEST(500, ROUND(${productVariants.price} * (1 + ${num}::numeric / 100) / 500) * 500)::int` })
            .where(and(where, gt(productVariants.price, 0)));
          break;
        case "adjust-amount":
          if (!Number.isFinite(num)) return NextResponse.json({ error: "Montant invalide." }, { status: 400 });
          await db
            .update(productVariants)
            .set({ price: sql`GREATEST(500, ${productVariants.price} + ${Math.round(num)})::int` })
            .where(and(where, gt(productVariants.price, 0)));
          break;
        case "set-availability":
          await db.update(productVariants).set({ availability: value === "on-order" ? "on-order" : "in-stock" }).where(where);
          break;
        case "set-stock":
          if (!Number.isFinite(num) || num < 0) return NextResponse.json({ error: "Stock invalide." }, { status: 400 });
          await db.update(productVariants).set({ stockQty: Math.round(num) }).where(where);
          break;
        case "set-condition":
          if (!CONDITIONS.includes(value)) return NextResponse.json({ error: "État invalide." }, { status: 400 });
          await db.update(productVariants).set({ condition: value }).where(where);
          break;
        case "set-battery":
          await db.update(productVariants).set({ batteryHealth: String(value ?? "").slice(0, 120) || "Batterie contrôlée" }).where(where);
          break;
        case "archive":
          await db.update(productVariants).set({ archived: true }).where(where);
          break;
        case "restore":
          await db.update(productVariants).set({ archived: false }).where(where);
          break;
        case "delete":
          await removeVariants(ids);
          break;
        default:
          return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
      }
    } else {
      const where = inArray(products.id, ids);
      switch (action) {
        case "publish":
          await db.update(products).set({ published: true }).where(where);
          break;
        case "unpublish":
          await db.update(products).set({ published: false }).where(where);
          break;
        case "feature":
          await db.update(products).set({ featured: true }).where(where);
          break;
        case "unfeature":
          await db.update(products).set({ featured: false }).where(where);
          break;
        case "set-badge":
          await db.update(products).set({ badge: String(value ?? "").trim().slice(0, 40) || null }).where(where);
          break;
        case "set-collection": {
          const col = await db.select({ id: collections.id }).from(collections).where(eq(collections.slug, String(value))).limit(1);
          if (!col[0]) return NextResponse.json({ error: "Collection introuvable." }, { status: 400 });
          await db.update(products).set({ collectionId: col[0].id }).where(where);
          break;
        }
        default:
          return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
      }
    }
    return NextResponse.json({ ok: true, count: ids.length });
  } catch (error) {
    console.error("PATCH /api/admin/bulk error:", error);
    return NextResponse.json({ error: "Modification collective impossible." }, { status: 500 });
  }
}
