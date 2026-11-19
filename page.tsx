"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Check, EyeOff, Star, Trash2 } from "lucide-react";

interface AdminReview {
  id: number;
  productName: string;
  productSlug: string;
  authorName: string;
  authorLocation: string;
  rating: number;
  title: string;
  body: string;
  variantLabel: string | null;
  approved: boolean;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/reviews", { cache: "no-store" });
    if (res.status === 401) return void (window.location.href = "/admin/login");
    setReviews((await res.json()).reviews ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setApproved = async (id: number, approved: boolean) => {
    await fetch(`/api/admin/reviews/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approved }) });
    void load();
  };
  const remove = async (id: number) => {
    if (!window.confirm("Supprimer cet avis ?")) return;
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    void load();
  };

  const list = reviews.filter((r) => filter === "all" || (filter === "pending" ? !r.approved : r.approved));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111113]">Avis clients</h1>
        <p className="text-sm text-[#52525B]">Seuls les avis validés apparaissent sur la boutique.</p>
      </div>
      <div className="flex gap-2">
        {(["pending", "approved", "all"] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === f ? "bg-[#111113] text-white" : "bg-white"}`}>
            {f === "pending" ? `En attente (${reviews.filter((r) => !r.approved).length})` : f === "approved" ? "Publiés" : "Tous"}
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-sm text-[#71717A]">Aucun avis.</p>}
      <div className="space-y-2">
        {list.map((r) => (
          <div key={r.id} className="rounded-2xl border border-[#E4E4E7] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-[#F59E0B] text-[#F59E0B]" : "text-[#E4E4E7]"}`} />)}</div>
                <span className="text-xs font-bold">{r.productName}</span>
                {r.approved ? <span className="rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-semibold text-[#047857]">Publié</span> : <span className="rounded-full bg-[#FFFBEB] px-2 py-0.5 text-[10px] font-semibold text-[#B45309]">En attente</span>}
              </div>
              <span className="text-[11px] text-[#71717A]">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</span>
            </div>
            <p className="mt-2 text-sm font-bold">{r.title}</p>
            <p className="mt-1 text-sm text-[#52525B]">{r.body}</p>
            <p className="mt-2 text-xs text-[#71717A]">{r.authorName} · {r.authorLocation}{r.variantLabel ? ` · ${r.variantLabel}` : ""}</p>
            <div className="mt-3 flex gap-2">
              {r.approved ? (
                <button type="button" onClick={() => void setApproved(r.id, false)} className="inline-flex items-center gap-1 rounded-lg border border-[#E4E4E7] px-3 py-1.5 text-xs font-semibold"><EyeOff className="h-3.5 w-3.5" />Dépublier</button>
              ) : (
                <button type="button" onClick={() => void setApproved(r.id, true)} className="inline-flex items-center gap-1 rounded-lg bg-[#15803D] px-3 py-1.5 text-xs font-bold text-white"><Check className="h-3.5 w-3.5" />Valider et publier</button>
              )}
              <button type="button" onClick={() => void remove(r.id)} className="inline-flex items-center gap-1 rounded-lg border border-[#FECACA] px-3 py-1.5 text-xs font-semibold text-[#B91C1C]"><Trash2 className="h-3.5 w-3.5" />Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
