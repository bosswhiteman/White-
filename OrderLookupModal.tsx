"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Package, X } from "lucide-react";
import { useCart } from "./CartContext";

export function OrderLookupModal() {
  const { isOrderModalOpen, closeOrderModal } = useCart();
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  if (!isOrderModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleaned = orderNumber.trim().toUpperCase();
    if (!cleaned) {
      setError("Veuillez saisir votre numéro de commande.");
      return;
    }
    setChecking(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(cleaned)}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Commande introuvable.");
        return;
      }
      closeOrderModal();
      setOrderNumber("");
      router.push(`/orders/${encodeURIComponent(cleaned)}`);
    } catch {
      setError("Impossible de vérifier la commande pour l'instant.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Suivre une commande"
    >
      <button
        type="button"
        aria-label="Fermer"
        onClick={closeOrderModal}
        className="fixed inset-0"
      />
      <div className="animate-fade-up relative z-10 w-full max-w-md rounded-2xl border border-[#E4E4E7] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F5F7] text-[#111113]">
              <Package className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-bold text-[#111113]">
              Suivre ma commande
            </h2>
          </div>
          <button
            type="button"
            onClick={closeOrderModal}
            aria-label="Fermer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#52525B] hover:bg-[#F5F5F7]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-[#52525B]">
          Saisissez la référence figurant sur votre bon de commande Messi Store pour consulter ou imprimer votre reçu.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <label
              htmlFor="order-lookup-input"
              className="block text-xs font-semibold text-[#52525B]"
            >
              Numéro de commande
            </label>
            <input
              id="order-lookup-input"
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Ex : MS-225-48291"
              className="mt-1.5 w-full rounded-xl border border-[#E4E4E7] bg-[#F5F5F7] px-4 py-3 text-sm uppercase tracking-wider text-[#111113] focus:border-[#111113] focus:bg-white focus:outline-none"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={checking}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#111113] px-6 py-3.5 text-xs font-bold text-white transition hover:bg-[#0066CC] disabled:opacity-50"
          >
            {checking ? "Recherche..." : "Consulter mon reçu"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
