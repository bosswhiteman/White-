"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { PhotoManager } from "./PhotoManager";
import type { GalleryItem, ProductColorOption, ProductHighlight, ProductSpecs } from "@/db/schema";
import { CONDITIONS_MAP, CONDITION_ORDER } from "@/lib/format";

interface VariantDraft {
  id?: number;
  sku: string;
  condition: string;
  storage: string;
  simType: string;
  colorNote: string;
  batteryHealth: string;
  price: string;
  availability: "in-stock" | "on-order";
  stockQty: string;
  archived: boolean;
  priceNote: string;
}

interface Draft {
  name: string;
  slug: string;
  productType: string;
  series: string;
  releaseYear: string;
  tagline: string;
  description: string;
  collectionId: string;
  badge: string;
  featured: boolean;
  published: boolean;
  sortOrder: string;
  gallery: GalleryItem[];
  colors: ProductColorOption[];
  specs: ProductSpecs;
  highlights: ProductHighlight[];
}

const SPEC_FIELDS: Array<{ key: keyof ProductSpecs; label: string }> = [
  { key: "ecran", label: "Écran" },
  { key: "puce", label: "Puce / processeur / RAM" },
  { key: "camera", label: "Appareil photo arrière" },
  { key: "selfie", label: "Caméra avant / audio" },
  { key: "batterie", label: "Batterie & recharge" },
  { key: "simReseau", label: "SIM / réseaux / connectique" },
  { key: "securite", label: "Sécurité" },
  { key: "resistance", label: "Matériaux / étanchéité" },
  { key: "dimensionsPoids", label: "Dimensions & poids" },
  { key: "systeme", label: "Système" },
  { key: "contenuGarantie", label: "Contenu & garantie" },
];

const EMPTY_SPECS = Object.fromEntries(SPEC_FIELDS.map((f) => [f.key, ""])) as unknown as ProductSpecs;

function emptyVariant(): VariantDraft {
  return {
    sku: "",
    condition: "quasi-neuf",
    storage: "128 Go",
    simType: "Nano‑SIM + eSIM",
    colorNote: "",
    batteryHealth: "Batterie contrôlée · état indiqué avant achat",
    price: "",
    availability: "in-stock",
    stockQty: "1",
    archived: false,
    priceNote: "",
  };
}

const input = "w-full rounded-lg border border-[#E4E4E7] bg-white px-3 py-2 text-sm focus:border-[#0066CC] focus:outline-none";
const label = "mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#71717A]";

export function AdminProductEditor({ productId }: { productId: number | null }) {
  const router = useRouter();
  const [collections, setCollections] = useState<Array<{ id: number; slug: string; name: string }>>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      if (productId) {
        const res = await fetch(`/api/admin/products/${productId}`, { cache: "no-store" });
        if (res.status === 401) return void (window.location.href = "/admin/login");
        const data = await res.json();
        if (!res.ok) return setMsg({ ok: false, text: data.error ?? "Introuvable" });
        const p = data.product;
        setCollections(data.collections);
        setDraft({
          name: p.name,
          slug: p.slug,
          productType: p.productType,
          series: p.series,
          releaseYear: String(p.releaseYear),
          tagline: p.tagline,
          description: p.description,
          collectionId: String(p.collectionId),
          badge: p.badge ?? "",
          featured: p.featured,
          published: p.published,
          sortOrder: String(p.sortOrder),
          gallery: p.gallery,
          colors: p.colors,
          specs: { ...EMPTY_SPECS, ...p.specs },
          highlights: p.highlights,
        });
        setVariants(
          p.variants.map((v: Record<string, unknown>) => ({
            id: v.id as number,
            sku: String(v.sku),
            condition: String(v.condition),
            storage: String(v.storage),
            simType: String(v.simType ?? ""),
            colorNote: String(v.colorNote ?? ""),
            batteryHealth: String(v.batteryHealth ?? ""),
            price: Number(v.price) > 0 ? String(v.price) : "",
            availability: v.availability === "on-order" ? "on-order" : "in-stock",
            stockQty: String(v.stockQty ?? 0),
            archived: Boolean(v.archived),
            priceNote: String(v.priceNote ?? ""),
          }))
        );
      } else {
        const res = await fetch("/api/admin/products", { cache: "no-store" });
        if (res.status === 401) return void (window.location.href = "/admin/login");
        const data = await res.json();
        setCollections(data.collections);
        setDraft({
          name: "",
          slug: "",
          productType: "iphone",
          series: "Série 14",
          releaseYear: String(new Date().getFullYear()),
          tagline: "",
          description: "",
          collectionId: String(data.collections[0]?.id ?? ""),
          badge: "",
          featured: false,
          published: true,
          sortOrder: "100",
          gallery: [],
          colors: [{ name: "Noir", hex: "#1F2023" }],
          specs: EMPTY_SPECS,
          highlights: [],
        });
        setVariants([emptyVariant()]);
      }
    })();
  }, [productId]);

  if (!draft) {
    return <p className="text-sm text-[#71717A]">{msg?.text ?? "Chargement…"}</p>;
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft({ ...draft, [k]: v });
  const setVar = (i: number, patch: Partial<VariantDraft>) => setVariants(variants.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const payload = {
      product: {
        ...draft,
        slug: productId ? draft.slug : undefined,
        releaseYear: Number(draft.releaseYear),
        collectionId: Number(draft.collectionId),
        sortOrder: Number(draft.sortOrder),
        gallery: draft.gallery.filter((g) => g.url.trim()),
      },
      variants: variants.map((v) => ({
        ...v,
        price: Number(v.price.replace(/\D/g, "") || 0),
        stockQty: Number(v.stockQty.replace(/\D/g, "") || 0),
      })),
    };
    const res = await fetch(productId ? `/api/admin/products/${productId}` : "/api/admin/products", {
      method: productId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setMsg({ ok: false, text: data.error ?? "Erreur" });
    setMsg({ ok: true, text: "Produit enregistré." });
    if (!productId && data.id) router.replace(`/admin/produits/${data.id}`);
    else if (data.slug) set("slug", data.slug);
  };

  const duplicate = async () => {
    if (!productId) return;
    setSaving(true);
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product: {
          ...draft,
          name: `${draft.name} (copie)`,
          published: false,
          releaseYear: Number(draft.releaseYear),
          collectionId: Number(draft.collectionId),
          sortOrder: Number(draft.sortOrder),
        },
        variants: variants.map((v) => ({
          ...v,
          id: undefined,
          sku: "",
          price: Number(v.price.replace(/\D/g, "") || 0),
          stockQty: Number(v.stockQty.replace(/\D/g, "") || 0),
        })),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setMsg({ ok: false, text: data.error ?? "Duplication impossible" });
    router.push(`/admin/produits/${data.id}`);
  };

  const remove = async () => {
    if (!productId || !window.confirm("Supprimer ce produit ? (s'il a déjà été commandé, il sera simplement masqué)")) return;
    const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
    if (res.ok) router.replace("/admin/produits");
  };

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/produits" className="rounded-lg border border-[#E4E4E7] bg-white p-2"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-xl font-extrabold text-[#111113]">{productId ? draft.name || "Produit" : "Nouveau produit"}</h1>
        </div>
        <div className="flex gap-2">
          {productId && draft.slug && (
            <Link href={`/products/${draft.slug}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-xl border border-[#E4E4E7] bg-white px-3 py-2 text-xs font-semibold"><ExternalLink className="h-3.5 w-3.5" />Voir</Link>
          )}
          {productId && (
            <button type="button" onClick={() => void duplicate()} disabled={saving} className="inline-flex items-center gap-1.5 rounded-xl border border-[#E4E4E7] bg-white px-3 py-2 text-xs font-semibold"><Copy className="h-3.5 w-3.5" />Dupliquer</button>
          )}
          {productId && (
            <button type="button" onClick={() => void remove()} className="inline-flex items-center gap-1.5 rounded-xl border border-[#FECACA] bg-white px-3 py-2 text-xs font-semibold text-[#B91C1C]"><Trash2 className="h-3.5 w-3.5" />Supprimer</button>
          )}
        </div>
      </div>

      {msg && <div className={`rounded-xl px-4 py-2.5 text-sm ${msg.ok ? "bg-[#ECFDF5] text-[#047857]" : "bg-[#FEF2F2] text-[#B91C1C]"}`}>{msg.text}</div>}

      <section className="grid grid-cols-1 gap-4 rounded-2xl border border-[#E4E4E7] bg-white p-5 md:grid-cols-2">
        <div className="md:col-span-2"><label className={label}>Nom</label><input className={input} value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="iPhone 14 Pro Max" /></div>
        <div><label className={label}>Type</label>
          <select className={input} value={draft.productType} onChange={(e) => set("productType", e.target.value)}>
            <option value="iphone">iPhone</option><option value="apple-accessory">Accessoire Apple</option><option value="apple-equipment">Équipement Apple</option>
          </select>
        </div>
        <div><label className={label}>Série</label><input className={input} value={draft.series} onChange={(e) => set("series", e.target.value)} placeholder="Série 14 / AirPods & Audio…" /></div>
        <div><label className={label}>Collection</label>
          <select className={input} value={draft.collectionId} onChange={(e) => set("collectionId", e.target.value)}>
            {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Année</label><input className={input} value={draft.releaseYear} onChange={(e) => set("releaseYear", e.target.value)} /></div>
          <div><label className={label}>Ordre d&apos;affichage</label><input className={input} value={draft.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} /></div>
        </div>
        <div className="md:col-span-2"><label className={label}>Accroche</label><input className={input} value={draft.tagline} onChange={(e) => set("tagline", e.target.value)} /></div>
        <div className="md:col-span-2"><label className={label}>Description</label><textarea rows={4} className={input} value={draft.description} onChange={(e) => set("description", e.target.value)} /></div>
        <div><label className={label}>Badge (optionnel)</label><input className={input} value={draft.badge} onChange={(e) => set("badge", e.target.value)} placeholder="Ex : Très demandé" /></div>
        <div className="flex items-end gap-5 pb-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={draft.published} onChange={(e) => set("published", e.target.checked)} />Publié</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={draft.featured} onChange={(e) => set("featured", e.target.checked)} />Mis en avant</label>
        </div>
      </section>

      {/* VARIANTES */}
      <section className="rounded-2xl border border-[#E4E4E7] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#111113]">Variantes (état · stockage · prix)</h2>
          <button type="button" onClick={() => setVariants([...variants, emptyVariant()])} className="inline-flex items-center gap-1 rounded-lg bg-[#111113] px-3 py-1.5 text-xs font-bold text-white"><Plus className="h-3.5 w-3.5" />Ajouter</button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[980px] text-xs">
            <thead className="text-left text-[10px] font-bold uppercase text-[#71717A]">
              <tr><th className="py-2">État</th><th>Stockage</th><th>Version / SIM</th><th>Couleur(s)</th><th>Prix FCFA</th><th>Dispo</th><th>Qté</th><th>Batterie</th><th>SKU</th><th /></tr>
            </thead>
            <tbody>
              {variants.map((v, i) => (
                <tr key={v.id ?? `n-${i}`} className={`border-t border-[#F1F1F4] ${v.archived ? "opacity-50" : ""}`}>
                  <td className="py-1.5 pr-1"><select className="rounded border border-[#E4E4E7] px-1.5 py-1" value={v.condition} onChange={(e) => setVar(i, { condition: e.target.value })}>{CONDITION_ORDER.map((c) => <option key={c} value={c}>{CONDITIONS_MAP[c].shortLabel}</option>)}</select></td>
                  <td className="pr-1"><input className="w-20 rounded border border-[#E4E4E7] px-1.5 py-1" value={v.storage} onChange={(e) => setVar(i, { storage: e.target.value })} /></td>
                  <td className="pr-1"><input className="w-28 rounded border border-[#E4E4E7] px-1.5 py-1" value={v.simType} onChange={(e) => setVar(i, { simType: e.target.value })} /></td>
                  <td className="pr-1"><input className="w-24 rounded border border-[#E4E4E7] px-1.5 py-1" value={v.colorNote} onChange={(e) => setVar(i, { colorNote: e.target.value })} placeholder="optionnel" /></td>
                  <td className="pr-1"><input className="w-24 rounded border border-[#E4E4E7] px-1.5 py-1 font-bold tabular-nums" value={v.price} onChange={(e) => setVar(i, { price: e.target.value })} placeholder="Sur demande" /></td>
                  <td className="pr-1"><select className="rounded border border-[#E4E4E7] px-1.5 py-1" value={v.availability} onChange={(e) => setVar(i, { availability: e.target.value as "in-stock" | "on-order" })}><option value="in-stock">En stock</option><option value="on-order">❌ Commande</option></select></td>
                  <td className="pr-1"><input className="w-12 rounded border border-[#E4E4E7] px-1.5 py-1" value={v.stockQty} onChange={(e) => setVar(i, { stockQty: e.target.value })} /></td>
                  <td className="pr-1"><input className="w-40 rounded border border-[#E4E4E7] px-1.5 py-1" value={v.batteryHealth} onChange={(e) => setVar(i, { batteryHealth: e.target.value })} /></td>
                  <td className="pr-1"><input className="w-28 rounded border border-[#E4E4E7] px-1.5 py-1 text-[10px]" value={v.sku} onChange={(e) => setVar(i, { sku: e.target.value })} placeholder="auto" /></td>
                  <td className="whitespace-nowrap">
                    <label className="mr-2 text-[10px]"><input type="checkbox" checked={v.archived} onChange={(e) => setVar(i, { archived: e.target.checked })} /> masquer</label>
                    <button type="button" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="text-[#B91C1C]" aria-label="Retirer"><Trash2 className="inline h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* PHOTOS */}
      <section className="rounded-2xl border border-[#E4E4E7] bg-white p-5">
        <PhotoManager photos={draft.gallery} onChange={(g) => set("gallery", g)} productName={draft.name} />
      </section>

      {/* COULEURS & POINTS FORTS */}
      <section className="grid grid-cols-1 gap-4">

        <div className="rounded-2xl border border-[#E4E4E7] bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Couleurs proposées</h2>
            <button type="button" onClick={() => set("colors", [...draft.colors, { name: "", hex: "#CCCCCC" }])} className="text-xs font-bold text-[#0066CC]">+ Couleur</button>
          </div>
          <div className="mt-3 space-y-2">
            {draft.colors.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="color" value={c.hex} onChange={(e) => set("colors", draft.colors.map((x, idx) => (idx === i ? { ...x, hex: e.target.value } : x)))} className="h-9 w-10 rounded border border-[#E4E4E7]" />
                <input className={input} value={c.name} placeholder="Nom de la couleur" onChange={(e) => set("colors", draft.colors.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))} />
                <button type="button" onClick={() => set("colors", draft.colors.filter((_, idx) => idx !== i))} className="text-[#B91C1C]"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-sm font-bold">Points forts</h2>
            <button type="button" onClick={() => set("highlights", [...draft.highlights, { title: "", detail: "" }])} className="text-xs font-bold text-[#0066CC]">+ Point fort</button>
          </div>
          <div className="mt-3 space-y-2">
            {draft.highlights.map((h, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <input className={input} value={h.title} placeholder="Titre" onChange={(e) => set("highlights", draft.highlights.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)))} />
                  <input className={input} value={h.detail} placeholder="Détail" onChange={(e) => set("highlights", draft.highlights.map((x, idx) => (idx === i ? { ...x, detail: e.target.value } : x)))} />
                </div>
                <button type="button" onClick={() => set("highlights", draft.highlights.filter((_, idx) => idx !== i))} className="text-[#B91C1C]"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FICHE TECHNIQUE */}
      <section className="rounded-2xl border border-[#E4E4E7] bg-white p-5">
        <h2 className="text-sm font-bold">Fiche technique</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {SPEC_FIELDS.map((f) => (
            <div key={f.key}>
              <label className={label}>{f.label}</label>
              <textarea rows={2} className={input} value={draft.specs[f.key]} onChange={(e) => set("specs", { ...draft.specs, [f.key]: e.target.value })} />
            </div>
          ))}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E4E4E7] bg-white/95 px-4 py-3 backdrop-blur lg:left-60">
        <div className="flex items-center justify-end gap-3">
          {msg && <span className={`text-xs ${msg.ok ? "text-[#047857]" : "text-[#B91C1C]"}`}>{msg.text}</span>}
          <button type="button" onClick={() => void save()} disabled={saving} data-testid="admin-save-product" className="inline-flex items-center gap-2 rounded-xl bg-[#0066CC] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50">
            <Save className="h-4 w-4" />
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
