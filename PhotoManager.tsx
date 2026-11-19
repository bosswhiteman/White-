"use client";

import React, { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Star, Trash2, Upload } from "lucide-react";
import type { GalleryItem } from "@/db/schema";

const MAX_PHOTOS = 12;
const MAX_SIDE = 1600;

/** Redimensionne et compresse l'image dans le navigateur (JPEG ~80 %). */
async function compressImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Lecture impossible"));
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Image illisible"));
    i.src = dataUrl;
  });
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function PhotoManager({
  photos,
  onChange,
  productName,
}: {
  photos: GalleryItem[];
  onChange: (next: GalleryItem[]) => void;
  productName: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const valid = photos.filter((p) => p.url.trim());

  const upload = async (files: FileList | File[]) => {
    setError(null);
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const room = MAX_PHOTOS - valid.length;
    if (room <= 0) return setError(`Maximum ${MAX_PHOTOS} photos par produit.`);
    const selected = arr.slice(0, room);
    const added: GalleryItem[] = [];
    for (let i = 0; i < selected.length; i++) {
      setBusy(`Envoi ${i + 1}/${selected.length}…`);
      try {
        const dataUrl = await compressImage(selected[i]);
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Échec de l'envoi");
        const n = valid.length + added.length + 1;
        added.push({ url: data.urls[0], alt: `${productName || "Produit"} — photo ${n}`, caption: `${productName || "Produit"} — photo réelle ${n}` });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Échec de l'envoi");
      }
    }
    setBusy(null);
    if (added.length) onChange([...valid, ...added]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= valid.length) return;
    const next = [...valid];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const makePrimary = (i: number) => {
    const next = [...valid];
    const [item] = next.splice(i, 1);
    onChange([item, ...next]);
  };

  const addUrl = () => {
    const u = urlInput.trim();
    if (!/^https?:\/\//.test(u) && !u.startsWith("/")) return setError("Lien invalide (doit commencer par https://).");
    if (valid.length >= MAX_PHOTOS) return setError(`Maximum ${MAX_PHOTOS} photos.`);
    onChange([...valid, { url: u, alt: productName, caption: `${productName} — photo ${valid.length + 1}` }]);
    setUrlInput("");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold">
          Photos du produit <span className="font-normal text-[#71717A]">({valid.length}/{MAX_PHOTOS} · la 1re est la photo principale)</span>
        </h2>
        {valid.length < 2 && <span className="rounded-full bg-[#FFFBEB] px-2.5 py-0.5 text-[11px] font-semibold text-[#B45309]">Conseil : au moins 2 photos réelles</span>}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); void upload(e.dataTransfer.files); }}
        className={`mt-3 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${dragOver ? "border-[#0066CC] bg-[#EFF6FF]" : "border-[#D4D4D8] bg-[#FAFAFB]"}`}
      >
        <ImagePlus className="h-7 w-7 text-[#71717A]" />
        <p className="mt-2 text-sm font-semibold text-[#111113]">Glissez vos photos ici</p>
        <p className="text-[11px] text-[#71717A]">JPG, PNG ou WEBP — compressées automatiquement</p>
        <button type="button" disabled={!!busy} onClick={() => fileRef.current?.click()} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#111113] px-4 py-2 text-xs font-bold text-white hover:bg-[#0066CC] disabled:opacity-50" data-testid="admin-upload-button">
          <Upload className="h-3.5 w-3.5" />
          {busy ?? "Choisir des photos (téléphone ou ordinateur)"}
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => e.target.files && void upload(e.target.files)} />
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {valid.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {valid.map((p, i) => (
            <div key={`${p.url}-${i}`} className={`overflow-hidden rounded-xl border bg-white ${i === 0 ? "border-[#0066CC] ring-2 ring-[#0066CC]/20" : "border-[#E4E4E7]"}`}>
              <div className="relative aspect-[4/3] bg-[#F5F5F7]">
                <img src={p.url} alt={p.alt} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                {i === 0 && <span className="absolute top-1.5 left-1.5 rounded bg-[#0066CC] px-1.5 py-0.5 text-[10px] font-bold text-white">Principale</span>}
              </div>
              <div className="space-y-1.5 p-2">
                <input
                  value={p.caption}
                  onChange={(e) => onChange(valid.map((x, idx) => (idx === i ? { ...x, caption: e.target.value, alt: e.target.value } : x)))}
                  placeholder="Légende"
                  className="w-full rounded border border-[#E4E4E7] px-2 py-1 text-[11px]"
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded border border-[#E4E4E7] p-1 disabled:opacity-30" aria-label="Avancer"><ArrowLeft className="h-3 w-3" /></button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === valid.length - 1} className="rounded border border-[#E4E4E7] p-1 disabled:opacity-30" aria-label="Reculer"><ArrowRight className="h-3 w-3" /></button>
                    {i !== 0 && <button type="button" onClick={() => makePrimary(i)} className="rounded border border-[#E4E4E7] p-1" title="Définir comme principale"><Star className="h-3 w-3" /></button>}
                  </div>
                  <button type="button" onClick={() => onChange(valid.filter((_, idx) => idx !== i))} className="rounded p-1 text-[#B91C1C] hover:bg-[#FEF2F2]" aria-label="Supprimer"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#71717A]" />
          <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="…ou coller le lien d'une photo (https://…)" className="w-full rounded-lg border border-[#E4E4E7] py-2 pr-2 pl-8 text-xs" />
        </div>
        <button type="button" onClick={addUrl} className="rounded-lg border border-[#E4E4E7] px-3 text-xs font-semibold">Ajouter</button>
      </div>
    </div>
  );
}
