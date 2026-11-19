"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Search, Sparkles } from "lucide-react";
import type { ProductCondition, ProductType } from "@/db/schema";
import {
  IPHONE_SERIES_ORDER,
  PRODUCT_TYPES,
  type ProductCardDTO,
} from "@/lib/format";
import { ProductCard } from "./ProductCard";

interface CatalogSectionProps {
  initialProducts: ProductCardDTO[];
  availableStorages: string[];
  initialCollection?: string;
  initialType?: ProductType | "all";
  initialCondition?: ProductCondition | "all";
}

type BudgetPreset = "all" | "under-150" | "150-250" | "250-400" | "over-400";

const BUDGETS: Array<{ id: BudgetPreset; label: string; min?: number; max?: number }> = [
  { id: "all", label: "Tous les budgets" },
  { id: "under-150", label: "Moins de 150 000 F", max: 150000 },
  { id: "150-250", label: "150 000 – 250 000 F", min: 150000, max: 250000 },
  { id: "250-400", label: "250 000 – 400 000 F", min: 250000, max: 400000 },
  { id: "over-400", label: "Plus de 400 000 F", min: 400000 },
];

const CONDITION_TABS: Array<{ id: ProductCondition | "all"; label: string; hint?: string }> = [
  { id: "quasi-neuf", label: "Quasi Neuf A+", hint: "Recommandé" },
  { id: "nouveau", label: "Nouveau (Non activé)" },
  { id: "neuf-scelle", label: "Neuf Scellé" },
  { id: "seconde-main", label: "Seconde Main" },
  { id: "all", label: "Tous les états" },
];

const SORTS = [
  { value: "featured", label: "Disponibles en premier" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "newest", label: "Série la plus récente" },
];

function seriesFor(type: ProductType | "all"): string[] {
  if (type === "iphone" || type === "all") return IPHONE_SERIES_ORDER;
  if (type === "apple-equipment") return ["Mac & iPad", "Apple Watch"];
  return ["AirPods & Audio", "Chargeurs & Câbles", "Protection & MagSafe"];
}

export function CatalogSection({
  initialProducts,
  availableStorages,
  initialCollection = "all",
  initialType = "iphone",
  initialCondition = "quasi-neuf",
}: CatalogSectionProps) {
  const [collection, setCollection] = useState(initialCollection);
  const [productType, setProductType] = useState<ProductType | "all">(initialType);
  const [series, setSeries] = useState("all");
  const [condition, setCondition] = useState<ProductCondition | "all">(initialCondition);
  const [storage, setStorage] = useState("all");
  const [budget, setBudget] = useState<BudgetPreset>("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [products, setProducts] = useState<ProductCardDTO[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    setCollection(initialCollection);
    setProductType(initialType);
    setCondition(initialCondition);
    setSeries("all");
  }, [initialCollection, initialType, initialCondition]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (collection !== "all") p.set("collection", collection);
      if (productType !== "all") p.set("type", productType);
      if (series !== "all") p.set("series", series);
      if (condition !== "all") p.set("condition", condition);
      if (storage !== "all") p.set("storage", storage);
      const b = BUDGETS.find((x) => x.id === budget);
      if (b?.min !== undefined) p.set("minPrice", String(b.min));
      if (b?.max !== undefined) p.set("maxPrice", String(b.max));
      if (inStockOnly) p.set("inStock", "true");
      if (search.trim()) p.set("search", search.trim());
      if (sort !== "featured") p.set("sort", sort);
      const res = await fetch(`/api/products?${p.toString()}`, { cache: "no-store" });
      if (res.ok) setProducts((await res.json()).products ?? []);
    } finally {
      setLoading(false);
    }
  }, [collection, productType, series, condition, storage, budget, inStockOnly, search, sort]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = window.setTimeout(() => void fetchProducts(), 120);
    return () => window.clearTimeout(t);
  }, [fetchProducts]);

  const changeType = (t: ProductType | "all") => {
    setProductType(t);
    setCollection("all");
    setSeries("all");
    setStorage("all");
    // Les accessoires n'existent qu'en neuf : on bascule automatiquement l'état
    if (t !== "iphone" && t !== "all") setCondition("all");
    else if (condition === "all") setCondition("quasi-neuf");
  };

  const reset = () => {
    setCollection("all");
    setProductType("iphone");
    setSeries("all");
    setCondition("quasi-neuf");
    setStorage("all");
    setBudget("all");
    setInStockOnly(false);
    setSearch("");
    setSort("featured");
  };

  const isPhone = productType === "iphone" || productType === "all";
  const isDefault =
    collection === "all" && productType === "iphone" && series === "all" && condition === "quasi-neuf" &&
    storage === "all" && budget === "all" && !inStockOnly && !search.trim() && sort === "featured";

  const pill = (active: boolean, accent = false) =>
    `rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
      active
        ? accent
          ? "bg-[#0066CC] text-white shadow-sm"
          : "bg-[#111113] text-white shadow-sm"
        : "border border-[#E4E4E7] bg-white text-[#3F3F46] hover:-translate-y-0.5 hover:border-[#111113]"
    }`;

  return (
    <section id="catalogue" className="scroll-mt-24 bg-[#F5F5F7]/70">
      <div className="mx-auto max-w-[1380px] px-4 py-10 sm:px-8 lg:px-12 lg:py-14">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#B45309]">
              <Sparkles className="h-3.5 w-3.5" />
              {condition === "quasi-neuf" && isPhone ? "iPhone Quasi Neufs Grade A+ — prix officiels Messi Store" : "Catalogue Messi Store"}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.02em] text-[#111113] sm:text-3xl">
              {condition === "quasi-neuf" && isPhone ? "Nos iPhone Quasi Neufs disponibles" : "Choisissez votre iPhone ou accessoire"}
            </h2>
          </div>
          <span className="w-fit rounded-full bg-white px-3.5 py-1.5 text-xs font-bold tabular-nums text-[#111113] ring-1 ring-[#E4E4E7]">
            {loading ? "Actualisation…" : `${products.length} produit${products.length > 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Configurateur */}
        <div className="mt-6 space-y-4 rounded-2xl border border-[#E4E4E7] bg-white p-4 shadow-2xs sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-[#71717A]">1. Type</span>
            {PRODUCT_TYPES.map((t) => (
              <button key={t.id} type="button" onClick={() => changeType(t.id)} data-testid={`type-filter-${t.id}`} className={pill(productType === t.id && collection === "all")}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 border-t border-[#F1F1F4] pt-3">
            <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-[#71717A]">2. Série</span>
            <button type="button" onClick={() => setSeries("all")} className={pill(series === "all", true)}>
              Toutes
            </button>
            {seriesFor(productType).map((s) => (
              <button key={s} type="button" onClick={() => { setSeries(s); setCollection("all"); }} data-testid={`series-filter-${s.toLowerCase().replace(/\s+/g, "-")}`} className={pill(series === s, true)}>
                {s.startsWith("Série") ? `iPhone ${s.replace("Série ", "")}` : s}
              </button>
            ))}
          </div>

          {isPhone && (
            <div className="grid grid-cols-1 gap-3 border-t border-[#F1F1F4] pt-3 lg:grid-cols-12">
              <div className="flex flex-wrap items-center gap-1.5 lg:col-span-7">
                <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-[#71717A]">3. État</span>
                {CONDITION_TABS.map((c) => (
                  <button key={c.id} type="button" onClick={() => setCondition(c.id)} data-testid={`condition-filter-${c.id}`} className={`relative ${pill(condition === c.id)}`}>
                    {c.label}
                    {c.hint && condition !== c.id && (
                      <span className="absolute -top-2 -right-2 rounded-full bg-[#F59E0B] px-1.5 py-px text-[9px] font-bold text-white">
                        {c.hint}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 lg:col-span-5">
                <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-[#71717A]">4. Stockage</span>
                <button type="button" onClick={() => setStorage("all")} className={pill(storage === "all")}>Tous</button>
                {availableStorages.map((s) => (
                  <button key={s} type="button" onClick={() => setStorage(s)} data-testid={`storage-filter-${s.replace(/\s+/g, "-")}`} className={pill(storage === s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2.5 border-t border-[#F1F1F4] pt-3 md:flex-row md:flex-wrap md:items-center md:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#71717A]" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher (ex : 14 Pro Max, XR, AirPods)…"
                  data-testid="catalog-search"
                  className="w-full rounded-xl border border-[#E4E4E7] bg-[#F5F5F7] py-2 pr-3 pl-8 text-xs focus:border-[#111113] focus:bg-white focus:outline-none"
                />
              </div>
              <select aria-label="Budget" value={budget} onChange={(e) => setBudget(e.target.value as BudgetPreset)} className="rounded-xl border border-[#E4E4E7] bg-white px-3 py-2 text-xs font-medium">
                {BUDGETS.map((b) => (
                  <option key={b.id} value={b.id}>{b.label}</option>
                ))}
              </select>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#E4E4E7] bg-white px-3 py-2 text-xs font-medium">
                <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="h-3.5 w-3.5 accent-[#15803D]" />
                En stock immédiat
              </label>
            </div>
            <div className="flex items-center gap-2">
              {!isDefault && (
                <button type="button" onClick={reset} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-[#0066CC] hover:bg-[#EFF6FF]">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Réinitialiser
                </button>
              )}
              <select aria-label="Trier" data-testid="catalog-sort" value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-xl border border-[#E4E4E7] bg-white px-3 py-2 text-xs font-medium">
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {products.length === 0 && !loading ? (
          <div className="mt-8 rounded-2xl border border-[#E4E4E7] bg-white px-6 py-14 text-center">
            <h3 className="text-lg font-bold text-[#111113]">Aucun produit ne correspond à ces critères</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#52525B]">
              Modifiez l&apos;état ou le stockage, ou écrivez‑nous sur WhatsApp : nous recevons des arrivages chaque semaine.
            </p>
            <button type="button" onClick={reset} className="mt-5 rounded-full bg-[#111113] px-6 py-3 text-xs font-bold text-white hover:bg-[#0066CC]">
              Revenir aux Quasi Neufs
            </button>
          </div>
        ) : (
          <div className={`mt-6 grid grid-cols-2 gap-3 transition-opacity sm:gap-5 lg:grid-cols-3 xl:grid-cols-4 ${loading ? "opacity-50" : "opacity-100"}`}>
            {products.map((product, idx) => (
              <div key={product.id} className="animate-card-in" style={{ animationDelay: `${Math.min(idx, 12) * 45}ms` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
