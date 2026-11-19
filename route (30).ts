import { NextRequest, NextResponse } from "next/server";
import { getFilteredProducts, type ProductFilterParams } from "@/lib/store";
import type { ProductCondition, ProductType } from "@/db/schema";

export const dynamic = "force-dynamic";

const VALID_SORTS = new Set(["featured", "price-asc", "price-desc", "rating", "newest"]);
const VALID_CONDITIONS = new Set(["all", "nouveau", "neuf-scelle", "quasi-neuf", "seconde-main"]);
const VALID_TYPES = new Set(["all", "iphone", "apple-equipment", "apple-accessory"]);

export async function GET(req: NextRequest) {
  try {
    const sp = new URL(req.url).searchParams;
    const rawType = sp.get("type") ?? "all";
    const rawCondition = sp.get("condition") ?? "all";
    const storageParam = sp.get("storage");
    const minRaw = sp.get("minPrice");
    const maxRaw = sp.get("maxPrice");
    const sortParam = sp.get("sort") ?? "featured";

    const data = await getFilteredProducts({
      search: sp.get("search") ?? undefined,
      collection: sp.get("collection") ?? undefined,
      series: sp.get("series") ?? undefined,
      productType: VALID_TYPES.has(rawType) ? (rawType as ProductType | "all") : "all",
      condition: VALID_CONDITIONS.has(rawCondition) ? (rawCondition as ProductCondition | "all") : "all",
      storages: storageParam ? storageParam.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      minPrice: minRaw && minRaw.trim() !== "" ? Number(minRaw) : undefined,
      maxPrice: maxRaw && maxRaw.trim() !== "" ? Number(maxRaw) : undefined,
      inStockOnly: sp.get("inStock") === "true",
      featuredOnly: sp.get("featured") === "true",
      sort: VALID_SORTS.has(sortParam) ? (sortParam as ProductFilterParams["sort"]) : "featured",
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Impossible de charger le catalogue." }, { status: 500 });
  }
}
