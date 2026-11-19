"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Clock, MapPin, Phone } from "lucide-react";
import { useCart } from "./CartContext";
import {
  buildGeneralWhatsAppUrl,
  buildTradeInWhatsAppUrl,
  WHATSAPP_DISPLAY,
  WHATSAPP_INTL_DISPLAY,
  WHATSAPP_LOCAL_NUMBER,
} from "@/lib/whatsapp";
import { WhatsAppIcon } from "./WhatsAppIcon";

export function Footer() {
  const { openOrderModal, settings } = useCart();
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [feedback, setFeedback] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: contact.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setFeedback(data.error ?? "Veuillez vérifier votre saisie.");
        return;
      }
      setStatus("success");
      setFeedback(data.message);
      setContact("");
    } catch {
      setStatus("error");
      setFeedback("Service momentanément indisponible.");
    }
  };

  return (
    <footer className="no-print border-t border-[#E4E4E7] bg-[#111113] text-white">
      <div className="mx-auto max-w-[1380px] px-4 py-16 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12">
          {/* Identité & Contact Direct */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-bold text-[#111113]">
                MS
              </span>
              <span className="text-lg font-bold tracking-tight text-white">
                Messi Store
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              Votre boutique iPhone à Abidjan : de la série X à la série 17 en Quasi Neuf Grade A+, Non activé, Neuf scellé et Seconde main, ainsi que les accessoires et équipements Apple d&apos;origine.
            </p>

            <div className="mt-6 space-y-2.5 text-xs text-white/75">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-[#60A5FA]" />
                {settings.showroomAddress} — Livraison Abidjan &amp; intérieur du pays
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-[#60A5FA]" />
                {settings.openingHours}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-[#4ADE80]" />
                <a
                  href={`tel:+225${WHATSAPP_LOCAL_NUMBER}`}
                  className="font-semibold tabular-nums text-white hover:underline"
                >
                  {WHATSAPP_INTL_DISPLAY}
                </a>
              </p>
            </div>

            <a
              href={buildGeneralWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#15803D] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#166534]"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Écrire sur WhatsApp : {WHATSAPP_DISPLAY}
            </a>
          </div>

          {/* Rayons */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Nos Produits
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              <li>
                <Link href="/?collection=iphone-16-17#catalogue" className="hover:text-white">
                  iPhone Série 17 &amp; 16
                </Link>
              </li>
              <li>
                <Link href="/?collection=iphone-14-15#catalogue" className="hover:text-white">
                  iPhone Série 15 &amp; 14
                </Link>
              </li>
              <li>
                <Link href="/?collection=iphone-x-13#catalogue" className="hover:text-white">
                  iPhone Série X à 13
                </Link>
              </li>
              <li>
                <Link href="/?type=apple-accessory#catalogue" className="hover:text-white">
                  AirPods, chargeurs &amp; câbles
                </Link>
              </li>
              <li>
                <Link href="/?type=apple-equipment#catalogue" className="hover:text-white">
                  Mac, iPad &amp; Apple Watch
                </Link>
              </li>
            </ul>
          </div>

          {/* Services & Confiance */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Service Client
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              <li>
                <Link href="/#tarifs" className="hover:text-white">
                  Grille tarifaire du jour
                </Link>
              </li>
              <li>
                <Link href="/#garanties" className="hover:text-white">
                  Guide des 4 états
                </Link>
              </li>
              <li>
                <a
                  href={buildTradeInWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  Troc &amp; Reprise iPhone
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openOrderModal}
                  className="text-left hover:text-white"
                >
                  Retrouver ma commande
                </button>
              </li>
            </ul>
          </div>

          {/* Alertes Arrivages */}
          <div className="lg:col-span-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Alertes Arrivages &amp; Promos
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Laissez votre numéro WhatsApp ou votre e-mail pour recevoir nos nouveaux arrivages d&apos;iPhone scellés, non activés et quasi neufs dès leur entrée en stock.
            </p>
            <form onSubmit={handleSubscribe} className="mt-4">
              <div className="flex items-center rounded-xl border border-white/15 bg-white/8 p-1.5 focus-within:border-white/40">
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="N° WhatsApp (05/07/01...) ou e-mail"
                  aria-label="Numéro WhatsApp ou e-mail"
                  required
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/45 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-bold text-[#111113] transition hover:bg-[#0066CC] hover:text-white disabled:opacity-50"
                >
                  S&apos;inscrire
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              {status === "success" && (
                <p className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-[#4ADE80]">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  {feedback}
                </p>
              )}
              {status === "error" && (
                <p className="mt-2 text-xs text-red-400">{feedback}</p>
              )}
            </form>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-7 text-xs text-white/55 sm:flex-row sm:items-center">
          <p>© 2026 Messi Store Abidjan. Tous droits réservés.</p>
          <div className="flex flex-wrap items-center gap-3">
            <span>Paiements acceptés :</span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-white/85">
              Espèces à la livraison
            </span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-white/85">
              Wave
            </span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-white/85">
              Orange Money
            </span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-white/85">
              MTN MoMo
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
