"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, Package, Search, ShoppingBag, X } from "lucide-react";
import { useCart } from "./CartContext";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { buildGeneralWhatsAppUrl, WHATSAPP_DISPLAY } from "@/lib/whatsapp";

export function Navbar() {
  const { cart, settings, openDrawer, openSearch, openOrderModal } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="no-print sticky top-0 z-40 bg-white/92 backdrop-blur-md">
      {/* Barre supérieure sobre : Confiance, Livraison Abidjan & WhatsApp Direct */}
      <div className="border-b border-[#E4E4E7] bg-[#111113] text-white">
        <div className="mx-auto flex h-9 max-w-[1380px] items-center justify-between px-4 text-[11px] sm:px-8 lg:px-12">
          <p className="truncate font-medium text-white/85">
            {settings.announcement}
          </p>
          <a
            href={buildGeneralWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 inline-flex shrink-0 items-center gap-1.5 font-semibold tabular-nums text-[#4ADE80] transition hover:text-white"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
            <span>WhatsApp : {WHATSAPP_DISPLAY}</span>
          </a>
        </div>
      </div>

      {/* Navigation principale */}
      <div className="border-b border-[#E4E4E7]">
        <div className="mx-auto flex h-16 max-w-[1380px] items-center justify-between px-4 sm:px-8 lg:px-12">
          {/* Gauche : Menu mobile + Identité Messi Store */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#111113] transition hover:bg-[#F5F5F7] lg:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" strokeWidth={1.7} />
              ) : (
                <Menu className="h-5 w-5" strokeWidth={1.7} />
              )}
            </button>

            <Link
              href="/"
              className="group flex items-center gap-2.5 focus:outline-none"
            >
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111113] text-xs font-bold tracking-tight text-white transition-colors group-hover:bg-[#0066CC]"
              >
                MS
              </span>
              <div className="flex flex-col leading-none">
                <span className="text-[15px] font-bold tracking-[-0.02em] text-[#111113]">
                  Messi Store
                </span>
                <span className="mt-0.5 hidden text-[10px] font-medium text-[#71717A] sm:block">
                  Spécialiste iPhone &amp; Apple
                </span>
              </div>
            </Link>
          </div>

          {/* Centre : Navigation claire */}
          <nav
            aria-label="Navigation principale"
            className="hidden items-center gap-7 lg:flex"
          >
            <Link
              href="/?type=iphone&condition=quasi-neuf#catalogue"
              className="text-[13px] font-semibold text-[#B45309] transition hover:text-[#111113]"
            >
              Quasi Neufs
            </Link>
            <Link
              href="/?type=iphone&condition=all#catalogue"
              className="text-[13px] font-medium text-[#3F3F46] transition hover:text-[#111113]"
            >
              Tous les iPhone
            </Link>
            <Link
              href="/?type=apple-accessory#catalogue"
              className="text-[13px] font-medium text-[#3F3F46] transition hover:text-[#111113]"
            >
              Accessoires Apple
            </Link>
            <Link
              href="/#tarifs"
              className="text-[13px] font-medium text-[#3F3F46] transition hover:text-[#111113]"
            >
              Grille des Prix
            </Link>
            <Link
              href="/#garanties"
              className="text-[13px] font-medium text-[#3F3F46] transition hover:text-[#111113]"
            >
              États &amp; Garanties
            </Link>
          </nav>

          {/* Droite : Recherche, Suivi commande, Panier */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={openSearch}
              aria-label="Rechercher un modèle"
              title="Rechercher un iPhone, Samsung ou accessoire"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#111113] transition hover:bg-[#F5F5F7]"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={1.7} />
            </button>

            <button
              type="button"
              onClick={openOrderModal}
              aria-label="Suivre ma commande"
              title="Retrouver un reçu de commande"
              className="hidden h-10 w-10 items-center justify-center rounded-full text-[#111113] transition hover:bg-[#F5F5F7] sm:inline-flex"
            >
              <Package className="h-[18px] w-[18px]" strokeWidth={1.7} />
            </button>

            <button
              type="button"
              onClick={openDrawer}
              aria-label={`Ouvrir le panier (${cart.itemCount} article${cart.itemCount > 1 ? "s" : ""})`}
              data-testid="cart-button"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[#E4E4E7] bg-[#F5F5F7] px-3.5 text-[#111113] transition hover:border-[#111113]"
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={1.8} />
              <span
                data-testid="cart-count"
                className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums ${
                  cart.itemCount > 0
                    ? "bg-[#0066CC] text-white"
                    : "bg-white text-[#52525B]"
                }`}
              >
                {cart.itemCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile déroulant */}
      {mobileMenuOpen && (
        <div className="animate-fade-in border-b border-[#E4E4E7] bg-white px-5 py-5 lg:hidden">
          <nav className="flex flex-col space-y-3.5 text-[15px] font-medium text-[#111113]">
            <Link
              href="/?type=iphone&condition=quasi-neuf#catalogue"
              onClick={() => setMobileMenuOpen(false)}
            >
              iPhone Quasi Neufs Grade A+
            </Link>
            <Link
              href="/?type=iphone&condition=all#catalogue"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tous les iPhone (Série X à 17)
            </Link>
            <Link
              href="/?type=apple-accessory#catalogue"
              onClick={() => setMobileMenuOpen(false)}
            >
              Accessoires &amp; équipements Apple
            </Link>
            <Link href="/#tarifs" onClick={() => setMobileMenuOpen(false)}>
              Grille Tarifaire Officielle (Scellés, Non Activés, Quasi Neufs)
            </Link>
            <Link href="/#garanties" onClick={() => setMobileMenuOpen(false)}>
              Guide des États &amp; Garanties
            </Link>
            <div className="flex flex-wrap items-center gap-3 border-t border-[#E4E4E7] pt-4">
              <a
                href={buildGeneralWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#15803D] px-4 py-2.5 text-xs font-semibold text-white"
              >
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp {WHATSAPP_DISPLAY}
              </a>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openOrderModal();
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E4E4E7] px-4 py-2.5 text-xs font-medium text-[#52525B]"
              >
                <Package className="h-3.5 w-3.5" />
                Suivre une commande
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
