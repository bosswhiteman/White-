"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckSquare, Eye, EyeOff, Pencil, Plus, RefreshCw, Search, Square, Star } from "lucide-react";
import type { ProductCondition } from "@/db/schema";
import { CONDITIONS_MAP, CONDITION_ORDER, formatPrice } from "@/lib/format";
import type { AdminProduct, AdminVariant } from "@/lib/admin-data";

type BulkAction =
  | "set-price"
  | "adjust-percent"
  | "adjust-amount"
  | "set-availability"
  | "set-stock"
  | "set-condition"
  | "set-on-request"
  | "set-battery"
  | "archive"
  | "restore"
  | "delete";

const BULK_OPTIONS: Array<{ id: BulkAction; label: string; needs?: "number" | "text" | "condition" | "availability" }> = [
  { id: "set-price", label: "Fixer le prix (FCFA)", needs: "number" },
  { id: "adjust-percent", label: "Augmenter / baisser de … %", needs: "number" },
  { id: "adjust-amount", label: "Augmenter / baisser de … FCFA", needs: "number" },
  { id: "set-availability", label: "Disponibilité (En stock / ❌ Sur commande)", needs: "availability" },
  { id: "set-condition", label: "Changer l'état", needs: "condition" },
  { id: "set-stock", label: "Fixer la quantité en stock", needs: "number" },
  { id: "set-battery", label: "Texte état batterie", needs: "text" },
  { id: "set-on-request", label: "Passer en « Prix sur demande »" },
  { id: "archive", label: "Masquer (archiver) les variantes" },
  { id: "restore", label: "Réafficher les variantes archivées" },
  { id: "delete", label: "Supprimer définitivement" },
];

interface Row {
  product: AdminProduct;
  variant: AdminVariant;
}

export function AdminProductsManager() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [series, setSeries] = useState("all");
  const [condition, setCondition] = useState<string>("all");
  const [avail, setAvail] = useState("all");
  const [showArchived, setShowArchived] = useState(false);

  const [action, setAction] = useState<BulkAction>("set-price");
  const [actionValue, setActionValue] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/products", { cache: "no-store" });
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await res.json();
    setProducts(data.products ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 3500);
    return () => window.clearTimeout(t);
  }, [flash]);

  const allSeries = useMemo(() => Array.from(new Set(products.map((p) => p.series))), [products]);

  const rows: Row[] = useMemo(() => {
    const term = q.trim().toLowerCase();
    const out: Row[] = [];
    for (const p of products) {
      if (type !== "all" && p.productType !== type) continue;
      if (series !== "all" && p.series !== series) continue;
      if (term && !`${p.name} ${p.series}`.toLowerCase().includes(term)) continue;
      for (const v of p.variants) {
        if (!showArchived && v.archived) continue;
        if (condition !== "all" && v.condition !== condition) continue;
        if (avail === "in-stock" && !(v.availability === "in-stock" && v.price > 0)) continue;
        if (avail === "on-order" && v.availability !== "on-order") continue;
        if (avail === "on-request" && v.price > 0) continue;
        if (term && !`${p.name} ${p.series} ${v.storage} ${v.sku}`.toLowerCase().includes(term)) continue;
        out.push({ product: p, variant: v });
      }
    }
    return out;
  }, [products, q, type, series, condition, avail, showArchived]);

  const visibleIds = rows.map((r) => r.variant.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const toggle = (id: number) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const toggleAllVisible = () =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (allVisibleSelected) visibleIds.forEach((id) => n.delete(id));
      else visibleIds.forEach((id) => n.add(id));
      return n;
    });

  const toggleProduct = (p: AdminProduct) => {
    const ids = p.variants.filter((v) => showArchived || !v.archived).map((v) => v.id);
    const all = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const n = new Set(prev);
      ids.forEach((id) => (all ? n.delete(id) : n.add(id)));
      return n;
    });
  };

  const callBulk = async (payload: Record<string, unknown>, successMsg: string) => {
    const res = await fetch("/api/admin/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setFlash({ type: "err", msg: data.error ?? "Erreur." });
      return false;
    }
    setFlash({ type: "ok", msg: successMsg });
    await load();
    return true;
  };

  const applyBulk = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const opt = BULK_OPTIONS.find((o) => o.id === action)!;
    let value: unknown = actionValue;
    if (opt.needs === "number") {
      value = Number(actionValue.replace(/[\s\u202f]/g, "").replace(",", "."));
      if (!Number.isFinite(value as number)) {
        setFlash({ type: "err", msg: "Saisissez une valeur numérique." });
        return;
      }
    }
    if (opt.needs === "condition" && !actionValue) value = "quasi-neuf";
    if (opt.needs === "availability" && !actionValue) value = "in-stock";
    if (action === "delete" && !window.confirm(`Supprimer ${ids.length} variante(s) ? Les variantes déjà commandées seront archivées.`)) return;
    const ok = await callBulk({ scope: "variants", ids, action, value }, `${ids.length} variante(s) mise(s) à jour.`);
    if (ok) setSelected(new Set());
  };

  const applyProductAction = async (a: "publish" | "unpublish" | "feature" | "unfeature") => {
    const productIds = Array.from(
      new Set(products.filter((p) => p.variants.some((v) => selected.has(v.id))).map((p) => p.id))
    );
    if (productIds.length === 0) return;
    await callBulk({ scope: "products", ids: productIds, action: a }, `${productIds.length} produit(s) mis à jour.`);
  };

  const saveInline = async (variantId: number, act: BulkAction, value: unknown) => {
    await callBulk({ scope: "variants", ids: [variantId], action: act, value }, "Modification enregistrée.");
  };

  const opt = BULK_OPTIONS.find((o) => o.id === action)!;
  let lastProductId = -1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111113]">Produits &amp; prix</h1>
          <p className="text-sm text-[#52525B]">Modifiez les prix et disponibilités en ligne ou en sélection multiple.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void load()} className="inline-flex items-center gap-1.5 rounded-xl border border-[#E4E4E7] bg-white px-3.5 py-2 text-xs font-semibold">
            <RefreshCw className="h-3.5 w-3.5" /> Actualiser
          </button>
          <Link href="/admin/produits/nouveau" className="inline-flex items-center gap-1.5 rounded-xl bg-[#111113] px-4 py-2 text-xs font-bold text-white hover:bg-[#0066CC]">
            <Plus className="h-3.5 w-3.5" /> Nouveau produit
          </Link>
        </div>
      </div>

      {flash && (
        <div className={`animate-fade-in rounded-xl px-4 py-2.5 text-sm font-medium ${flash.type === "ok" ? "bg-[#ECFDF5] text-[#047857]" : "bg-[#FEF2F2] text-[#B91C1C]"}`}>
          {flash.msg}
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#E4E4E7] bg-white p-3">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#71717A]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un modèle ou SKU…" className="w-full rounded-lg border border-[#E4E4E7] bg-[#F5F5F7] py-2 pr-3 pl-8 text-xs focus:outline-none" />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-[#E4E4E7] px-2.5 py-2 text-xs">
          <option value="all">Tous types</option>
          <option value="iphone">iPhone</option>
          <option value="apple-accessory">Accessoires</option>
          <option value="apple-equipment">Équipements</option>
        </select>
        <select value={series} onChange={(e) => setSeries(e.target.value)} className="rounded-lg border border-[#E4E4E7] px-2.5 py-2 text-xs">
          <option value="all">Toutes séries</option>
          {allSeries.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={condition} onChange={(e) => setCondition(e.target.value)} className="rounded-lg border border-[#E4E4E7] px-2.5 py-2 text-xs">
          <option value="all">Tous états</option>
          {CONDITION_ORDER.map((c) => (
            <option key={c} value={c}>{CONDITIONS_MAP[c].label}</option>
          ))}
        </select>
        <select value={avail} onChange={(e) => setAvail(e.target.value)} className="rounded-lg border border-[#E4E4E7] px-2.5 py-2 text-xs">
          <option value="all">Toutes disponibilités</option>
          <option value="in-stock">En stock (avec prix)</option>
          <option value="on-order">❌ Sur commande</option>
          <option value="on-request">Prix sur demande</option>
        </select>
        <label className="flex items-center gap-1.5 text-xs">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Archivées
        </label>
      </div>

      {/* Barre de modification collective */}
      <div className={`sticky top-0 z-20 rounded-2xl border p-3 transition ${selected.size > 0 ? "border-[#0066CC] bg-[#EFF6FF]" : "border-[#E4E4E7] bg-white"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-[#111113] px-2.5 py-1.5 text-xs font-bold text-white">{selected.size} sélectionnée(s)</span>
          <select value={action} onChange={(e) => { setAction(e.target.value as BulkAction); setActionValue(""); }} className="rounded-lg border border-[#E4E4E7] bg-white px-2.5 py-2 text-xs">
            {BULK_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
          {opt.needs === "number" && (
            <input value={actionValue} onChange={(e) => setActionValue(e.target.value)} placeholder={action === "adjust-percent" ? "ex : -5 ou 10" : action === "adjust-amount" ? "ex : -5000" : "ex : 155000"} className="w-36 rounded-lg border border-[#E4E4E7] bg-white px-2.5 py-2 text-xs tabular-nums" />
          )}
          {opt.needs === "text" && (
            <input value={actionValue} onChange={(e) => setActionValue(e.target.value)} placeholder="ex : Batterie 90 % à 100 %" className="w-56 rounded-lg border border-[#E4E4E7] bg-white px-2.5 py-2 text-xs" />
          )}
          {opt.needs === "condition" && (
            <select value={actionValue || "quasi-neuf"} onChange={(e) => setActionValue(e.target.value)} className="rounded-lg border border-[#E4E4E7] bg-white px-2.5 py-2 text-xs">
              {CONDITION_ORDER.map((c) => (
                <option key={c} value={c}>{CONDITIONS_MAP[c].label}</option>
              ))}
            </select>
          )}
          {opt.needs === "availability" && (
            <select value={actionValue || "in-stock"} onChange={(e) => setActionValue(e.target.value)} className="rounded-lg border border-[#E4E4E7] bg-white px-2.5 py-2 text-xs">
              <option value="in-stock">En stock</option>
              <option value="on-order">❌ Sur commande</option>
            </select>
          )}
          <button type="button" disabled={selected.size === 0} onClick={() => void applyBulk()} data-testid="admin-bulk-apply" className="rounded-lg bg-[#0066CC] px-4 py-2 text-xs font-bold text-white disabled:opacity-40">
            Appliquer
          </button>
          <span className="mx-1 hidden h-5 w-px bg-[#D4D4D8] sm:block" />
          <button type="button" disabled={selected.size === 0} onClick={() => void applyProductAction("publish")} className="inline-flex items-center gap-1 rounded-lg border border-[#E4E4E7] bg-white px-2.5 py-2 text-xs disabled:opacity-40"><Eye className="h-3.5 w-3.5" />Publier</button>
          <button type="button" disabled={selected.size === 0} onClick={() => void applyProductAction("unpublish")} className="inline-flex items-center gap-1 rounded-lg border border-[#E4E4E7] bg-white px-2.5 py-2 text-xs disabled:opacity-40"><EyeOff className="h-3.5 w-3.5" />Masquer</button>
          <button type="button" disabled={selected.size === 0} onClick={() => void applyProductAction("feature")} className="inline-flex items-center gap-1 rounded-lg border border-[#E4E4E7] bg-white px-2.5 py-2 text-xs disabled:opacity-40"><Star className="h-3.5 w-3.5" />Mettre en avant</button>
          {selected.size > 0 && (
            <button type="button" onClick={() => setSelected(new Set())} className="text-xs font-semibold text-[#0066CC]">Vider la sélection</button>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-xs">
            <thead className="border-b border-[#E4E4E7] bg-[#FAFAFB] text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
              <tr>
                <th className="w-10 px-3 py-2.5">
                  <button type="button" onClick={toggleAllVisible} aria-label="Tout sélectionner">
                    {allVisibleSelected ? <CheckSquare className="h-4 w-4 text-[#0066CC]" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <th className="px-2 py-2.5">Produit</th>
                <th className="px-2 py-2.5">État</th>
                <th className="px-2 py-2.5">Stockage / version</th>
                <th className="px-2 py-2.5">Prix (FCFA)</th>
                <th className="px-2 py-2.5">Disponibilité</th>
                <th className="px-2 py-2.5">Qté</th>
                <th className="px-3 py-2.5 text-right">Fiche</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-[#71717A]">Chargement…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-[#71717A]">Aucune variante ne correspond aux filtres.</td></tr>
              )}
              {rows.map(({ product: p, variant: v }) => {
                const first = p.id !== lastProductId;
                lastProductId = p.id;
                return (
                  <tr key={v.id} className={`${first ? "border-t-2 border-[#E4E4E7]" : "border-t border-[#F1F1F4]"} ${selected.has(v.id) ? "bg-[#EFF6FF]/60" : ""} ${v.archived ? "opacity-50" : ""}`}>
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={selected.has(v.id)} onChange={() => toggle(v.id)} className="h-4 w-4 accent-[#0066CC]" />
                    </td>
                    <td className="px-2 py-2">
                      {first ? (
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => toggleProduct(p)} title="Sélectionner toutes les variantes" className="text-[#71717A] hover:text-[#0066CC]">
                            <CheckSquare className="h-3.5 w-3.5" />
                          </button>
                          {p.gallery[0] && (
                            <img src={p.gallery[0].url} alt="" referrerPolicy="no-referrer" className="h-9 w-11 shrink-0 rounded-md object-cover" />
                          )}
                          <div>
                            <p className="font-bold text-[#111113]">{p.name}</p>
                            <p className="text-[10px] text-[#71717A]">
                              {p.series} {!p.published && <span className="ml-1 rounded bg-[#FEF2F2] px-1 text-[#B91C1C]">masqué</span>}
                              {p.featured && <span className="ml-1 rounded bg-[#FFFBEB] px-1 text-[#B45309]">en avant</span>}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="pl-6 text-[10px] text-[#A1A1AA]">↳ {v.sku}</span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <select value={v.condition} onChange={(e) => void saveInline(v.id, "set-condition", e.target.value as ProductCondition)} className={`rounded-md border px-1.5 py-1 text-[11px] font-semibold ${CONDITIONS_MAP[v.condition].badgeClass}`}>
                        {CONDITION_ORDER.map((c) => (
                          <option key={c} value={c}>{CONDITIONS_MAP[c].shortLabel}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2 text-[11px] text-[#3F3F46]">
                      {v.storage}{v.simType ? ` · ${v.simType}` : ""}{v.colorNote ? ` · ${v.colorNote}` : ""}
                    </td>
                    <td className="px-2 py-2">
                      <input
                        key={`p-${v.id}-${v.price}`}
                        defaultValue={v.price || ""}
                        placeholder="Sur demande"
                        inputMode="numeric"
                        onBlur={(e) => {
                          const n = Number(e.target.value.replace(/\D/g, "") || 0);
                          if (n !== v.price) void saveInline(v.id, n > 0 ? "set-price" : "set-on-request", n);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                        }}
                        className="w-28 rounded-md border border-[#E4E4E7] px-2 py-1 font-bold tabular-nums focus:border-[#0066CC] focus:outline-none"
                      />
                      {v.price > 0 && <p className="mt-0.5 text-[10px] text-[#A1A1AA]">{formatPrice(v.price)}</p>}
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => void saveInline(v.id, "set-availability", v.availability === "in-stock" ? "on-order" : "in-stock")}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${v.availability === "in-stock" ? "bg-[#ECFDF5] text-[#047857]" : "bg-[#FEF3C7] text-[#B45309]"}`}
                      >
                        {v.availability === "in-stock" ? "En stock" : "❌ Sur commande"}
                      </button>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        key={`s-${v.id}-${v.stockQty}`}
                        defaultValue={v.stockQty}
                        inputMode="numeric"
                        onBlur={(e) => {
                          const n = Number(e.target.value.replace(/\D/g, "") || 0);
                          if (n !== v.stockQty) void saveInline(v.id, "set-stock", n);
                        }}
                        className="w-14 rounded-md border border-[#E4E4E7] px-2 py-1 tabular-nums"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      {first && (
                        <Link href={`/admin/produits/${p.id}`} className="inline-flex items-center gap-1 rounded-md border border-[#E4E4E7] px-2 py-1 text-[11px] font-semibold hover:border-[#111113]">
                          <Pencil className="h-3 w-3" /> Modifier
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[11px] text-[#71717A]">Astuce : laissez le prix vide pour afficher « Prix sur demande ». Les ajustements en % sont arrondis aux 500 FCFA.</p>
    </div>
  );
}
