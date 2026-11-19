"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, X } from "lucide-react";
import { useCart } from "./CartContext";
import { formatPrice, type ProductCardDTO } from "@/lib/format";

const QUICK_TERMS = [
  "iPhone 17 Pro",
  "iPhone 17 Air",
  "iPhone 14 Pro Max",
  "iPhone 13",
  "iPhone XR",
  "iPhone 12 Pro Max",
  "AirPods Pro",
  "Chargeur 20W",
];

export function SearchOverlay() {
  const { isSearchOpen, closeSearch } = useCart();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductCardDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isSearchOpen) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [isSearchOpen, closeSearch]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) {
          params.set("search", query.trim());
        } else {
          params.set("featured", "true");
        }
        const res = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setResults((data.products ?? []).slice(0, 8));
        }
      } catch {
        // ignore abort
      } finally {
        setLoading(false);
      }
    }, 140);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, isSearchOpen]);

  if (!isSearchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center bg-black/45 px-4 pt-14 backdrop-blur-xs sm:pt-20"
      role="dialog"
      aria-modal="true"
      aria-label="Rechercher dans la boutique"
    >
      <button
        type="button"
        aria-label="Fermer la recherche"
        onClick={closeSearch}
        className="fixed inset-0"
      />

      <div className="animate-fade-up relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-[#E4E4E7] px-5 py-4">
          <Search className="h-5 w-5 shrink-0 text-[#71717A]" strokeWidth={1.7} />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un modèle, une série ou un accessoire (ex : iPhone 14 Pro Max, 256 Go)..."
            className="flex-1 bg-transparent text-sm text-[#111113] placeholder:text-[#71717A] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-xs font-medium text-[#71717A] hover:text-[#111113]"
            >
              Effacer
            </button>
          )}
          <button
            type="button"
            onClick={closeSearch}
            aria-label="Fermer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#52525B] hover:bg-[#F5F5F7]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-b border-[#E4E4E7] bg-[#F5F5F7] px-5 py-2.5">
          <span className="mr-1 text-[11px] font-semibold text-[#71717A]">
            Recherches fréquentes :
          </span>
          {QUICK_TERMS.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setQuery(term)}
              className="rounded-full border border-[#E4E4E7] bg-white px-2.5 py-1 text-[11px] font-medium text-[#3F3F46] transition hover:border-[#111113] hover:text-[#111113]"
            >
              {term}
            </button>
          ))}
        </div>

        <div className="max-h-[58vh] overflow-y-auto p-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#71717A]">
            {query.trim()
              ? loading
                ? "Recherche en cours..."
                : `${results.length} modèle${results.length > 1 ? "s" : ""} trouvé${results.length > 1 ? "s" : ""}`
              : "Modèles les plus demandés"}
          </p>

          {results.length === 0 && !loading ? (
            <p className="py-8 text-center text-sm text-[#52525B]">
              Aucun résultat pour « {query} ». Essayez par série (ex : iPhone 13, S25, Watch).
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  onClick={closeSearch}
                  className="group flex items-center gap-3 rounded-xl border border-transparent p-2.5 transition hover:border-[#E4E4E7] hover:bg-[#F5F5F7]"
                >
                  <div className="h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-[#F5F5F7]">
                    <img
                      src={product.primaryImage}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-[#71717A]">
                      {product.brand} · {product.series}
                    </p>
                    <p className="truncate text-sm font-bold text-[#111113] group-hover:text-[#0066CC]">
                      {product.name}
                    </p>
                    <p className="text-xs font-semibold tabular-nums text-[#111113]">
                      {product.minPrice > 0 ? `Dès ${formatPrice(product.minPrice)}` : "Prix sur demande"}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-[#71717A] opacity-0 transition group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
