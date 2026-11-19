"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FileText, MessageCircle } from "lucide-react";
import { formatPrice, getConditionLabel, type PriceSheetRowDTO } from "@/lib/format";
import { buildBuyWithColorWhatsAppUrl, buildNegotiateWhatsAppUrl, WHATSAPP_DISPLAY } from "@/lib/whatsapp";
import { WhatsAppIcon } from "./WhatsAppIcon";

interface Props {
  quasiNeuf: PriceSheetRowDTO[];
  nonActive: PriceSheetRowDTO[];
  neufScelle: PriceSheetRowDTO[];
}

type Tab = "quasi-neuf" | "nouveau" | "neuf-scelle";

export function PriceSheetSection({ quasiNeuf, nonActive, neufScelle }: Props) {
  const [tab, setTab] = useState<Tab>("quasi-neuf");
  const rows = tab === "quasi-neuf" ? quasiNeuf : tab === "nouveau" ? nonActive : neufScelle;

  const tabs: Array<{ id: Tab; label: string; count: number; cls: string }> = [
    { id: "quasi-neuf", label: "Quasi Neufs Grade A+", count: quasiNeuf.length, cls: "bg-[#B45309] text-white" },
    { id: "nouveau", label: "Non activés · Série 17", count: nonActive.length, cls: "bg-[#0066CC] text-white" },
    { id: "neuf-scelle", label: "Neufs scellés", count: neufScelle.length, cls: "bg-[#111113] text-white" },
  ];

  return (
    <section id="tarifs" className="scroll-mt-24 border-t border-[#E4E4E7] bg-white">
      <div className="mx-auto max-w-[1380px] px-4 py-14 sm:px-8 lg:px-12">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0066CC]">Tarifs en FCFA</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.02em] text-[#111113]">Grille des prix iPhone</h2>
            <p className="mt-1.5 max-w-2xl text-sm text-[#52525B]">
              Prix transparents par état et par capacité. Négociation et confirmation de couleur sur WhatsApp ({WHATSAPP_DISPLAY}).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                data-testid={`sheet-tab-${t.id}`}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${tab === t.id ? t.cls : "border border-[#E4E4E7] bg-[#F5F5F7] text-[#3F3F46] hover:text-[#111113]"}`}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E4E4E7]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-[#E4E4E7] bg-[#F5F5F7] text-[11px] font-bold uppercase tracking-wider text-[#52525B]">
                <tr>
                  <th className="px-5 py-3">Modèle</th>
                  <th className="px-4 py-3">Stockage / Version</th>
                  <th className="px-4 py-3">Disponibilité</th>
                  <th className="px-4 py-3 text-right">Prix</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEFF2]">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-[#52525B]">Prix communiqués sur WhatsApp selon l&apos;arrivage.</td>
                  </tr>
                )}
                {rows.map((row) => {
                  const ctx = {
                    productName: row.productName,
                    brand: "Apple",
                    conditionLabel: getConditionLabel(row.condition),
                    storage: row.storage,
                    simType: row.simType,
                    price: row.price,
                    selectedColor: row.colorNote ?? undefined,
                    availability: row.availability,
                  };
                  const inStock = row.availability === "in-stock";
                  return (
                    <tr key={row.variantId} className="transition hover:bg-[#FAFAFB]">
                      <td className="px-5 py-3">
                        <Link href={`/products/${row.productSlug}`} className="font-bold text-[#111113] hover:text-[#0066CC]">{row.productName}</Link>
                        {row.colorNote && <span className="ml-2 rounded-md bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-semibold text-[#0055B3]">{row.colorNote}</span>}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-[#3F3F46]">{row.storage}{row.simType ? ` · ${row.simType}` : ""}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${inStock ? "bg-[#ECFDF5] text-[#047857]" : "bg-[#FEF3C7] text-[#B45309]"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-[#047857]" : "bg-[#D97706]"}`} />
                          {inStock ? "En stock" : "Sur commande"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold tabular-nums text-[#111113]">{formatPrice(row.price)}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Link href={`/products/${row.productSlug}`} className="inline-flex items-center gap-1 rounded-lg border border-[#E4E4E7] px-2.5 py-1.5 text-[11px] font-semibold text-[#3F3F46] hover:border-[#111113]"><FileText className="h-3 w-3" />Fiche</Link>
                          <a href={buildNegotiateWhatsAppUrl(ctx)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-[#E4E4E7] px-2.5 py-1.5 text-[11px] font-semibold hover:border-[#15803D] hover:text-[#15803D]"><MessageCircle className="h-3 w-3" />Négocier</a>
                          <a href={buildBuyWithColorWhatsAppUrl(ctx)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-[#15803D] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#166534]"><WhatsAppIcon className="h-3 w-3" />Acheter</a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {tab === "neuf-scelle" && (
          <p className="mt-3 text-[11px] text-[#71717A]">Prix neufs scellés alignés sur les tarifs constatés dans les boutiques d&apos;Abidjan ; disponibilité confirmée sur WhatsApp.</p>
        )}
      </div>
    </section>
  );
}
