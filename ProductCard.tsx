"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, FileText, ShoppingBag } from "lucide-react";
import {
  CONDITIONS_MAP,
  formatPrice,
  getConditionShortLabel,
  priceLabel,
  type ProductCardDTO,
} from "@/lib/format";
import { buildAskInfoWhatsAppUrl, buildBuyWithColorWhatsAppUrl } from "@/lib/whatsapp";
import { useCart } from "./CartContext";
import { WhatsAppIcon } from "./WhatsAppIcon";

interface ProductCardProps {
  product: ProductCardDTO;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, isMutating } = useCart();
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [showAltPhoto, setShowAltPhoto] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const variant = product.defaultVariant;
  const activeColor = product.colors[selectedColorIdx] ?? product.colors[0];
  const displayImage = showAltPhoto
    ? product.secondaryImage
    : product.primaryImage;

  const onRequest = variant.price <= 0;
  const isAvailableNow = variant.availability === "in-stock" && !onRequest;
  const condMeta = CONDITIONS_MAP[variant.condition];

  const handleQuickOrder = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await addItem(variant.id, 1, {
      openDrawer: true,
      selectedColor: activeColor?.name ?? "À confirmer sur WhatsApp",
    });
    if (ok) {
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 1600);
    }
  };

  const waCtx = {
    productName: product.name,
    brand: product.brand,
    conditionLabel: variant.conditionLabel,
    storage: variant.storage,
    simType: variant.simType,
    price: variant.price,
    selectedColor: activeColor?.name,
    availability: variant.availability,
  };
  const whatsappBuyUrl = onRequest
    ? buildAskInfoWhatsAppUrl(waCtx)
    : buildBuyWithColorWhatsAppUrl(waCtx);

  return (
    <article
      data-testid={`product-card-${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#C4C4CC] hover:shadow-xl"
    >
      {/* Photo réelle du produit (bascule photo 1 / photo 2 au survol) */}
      <div
        className="relative aspect-[4/3] w-full overflow-hidden bg-[#F5F5F7]"
        onMouseEnter={() => {
          if (product.photoCount > 1) setShowAltPhoto(true);
        }}
        onMouseLeave={() => setShowAltPhoto(false)}
      >
        <Link href={`/products/${product.slug}`} className="block h-full w-full">
          <img
            src={displayImage}
            alt={product.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        </Link>

        {/* Badge d'état en haut à gauche */}
        <span
          className={`pointer-events-none absolute top-3 left-3 rounded-full border px-2.5 py-0.5 text-[10px] font-bold shadow-2xs backdrop-blur-xs ${condMeta.badgeClass}`}
        >
          {getConditionShortLabel(variant.condition)}
        </span>

        {/* Disponibilité en haut à droite */}
        <span
          className={`pointer-events-none absolute top-3 right-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-xs ${
            isAvailableNow
              ? "bg-white/92 text-[#15803D]"
              : "bg-white/92 text-[#B45309]"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isAvailableNow ? "bg-[#15803D]" : "bg-[#D97706]"
            }`}
          />
          {onRequest ? "Sur demande" : isAvailableNow ? "En stock" : "Sur commande"}
        </span>

        {/* Indicateur de photos multiples */}
        {product.photoCount > 1 && (
          <div className="pointer-events-none absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
            <span>{showAltPhoto ? "2" : "1"}/{product.photoCount} photos</span>
          </div>
        )}
      </div>

      {/* Corps de la carte */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          {/* Série & Marque */}
          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[#71717A]">
            <span>
              {product.brand} · {product.series}
            </span>
            {variant.storage !== "Standard" && (
              <span className="rounded bg-[#F5F5F7] px-2 py-0.5 font-bold tabular-nums text-[#111113]">
                {variant.storage}
                {variant.simType === "eSIM"
                  ? " · eSIM"
                  : variant.simType === "SIM Physique"
                    ? " · SIM"
                    : ""}
              </span>
            )}
          </div>

          {/* Titre */}
          <h3 className="mt-1 text-base font-bold tracking-[-0.01em] text-[#111113] transition group-hover:text-[#0066CC]">
            <Link href={`/products/${product.slug}`}>{product.name}</Link>
          </h3>

          {/* Aperçu concis fiche technique */}
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#52525B]">
            {product.tagline}
          </p>

          {/* Pastilles de couleurs + Stockages disponibles */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            {product.colors.length > 0 && (
              <div
                className="flex items-center gap-1.5"
                aria-label={`Coloris de ${product.name}`}
              >
                {product.colors.slice(0, 5).map((col, idx) => {
                  const active = idx === selectedColorIdx;
                  return (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => setSelectedColorIdx(idx)}
                      title={col.name}
                      aria-label={col.name}
                      className={`h-4 w-4 rounded-full border border-black/20 transition ${
                        active
                          ? "ring-2 ring-[#111113] ring-offset-1"
                          : "opacity-80 hover:scale-110 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: col.hex }}
                    />
                  );
                })}
              </div>
            )}

            {product.storages.length > 1 && (
              <span className="text-[10px] font-medium tabular-nums text-[#71717A]">
                {product.storages.join(" / ")}
              </span>
            )}
          </div>

          {/* États proposés pour ce modèle */}
          {product.conditions.length > 1 && product.minPrice > 0 && (
            <p className="mt-2 text-[11px] text-[#71717A]">
              {product.conditions.length} états dispo · dès{" "}
              <span className="font-semibold tabular-nums text-[#3F3F46]">
                {formatPrice(product.minPrice)}
              </span>
            </p>
          )}
        </div>

        {/* Prix & Boutons d'action */}
        <div className="mt-4 border-t border-[#E4E4E7] pt-3.5">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <p
                className={`font-extrabold tabular-nums tracking-[-0.02em] ${
                  onRequest ? "text-sm text-[#52525B]" : "text-base text-[#111113] sm:text-lg"
                }`}
              >
                {priceLabel(variant.price)}
              </p>
              {variant.colorNote && (
                <p className="text-[10px] font-medium text-[#0066CC]">
                  Coloris : {variant.colorNote}
                </p>
              )}
            </div>
            {variant.compareAtPrice && variant.compareAtPrice > variant.price && (
              <span className="text-xs tabular-nums text-[#71717A] line-through">
                {formatPrice(variant.compareAtPrice)}
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Link
              href={`/products/${product.slug}`}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#111113] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-[#0066CC]"
            >
              <FileText className="h-3.5 w-3.5" strokeWidth={1.8} />
              <span className="hidden sm:inline">Fiche &amp; Options</span>
              <span className="sm:hidden">Voir</span>
            </Link>

            <a
              href={whatsappBuyUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`Acheter ${product.name} (${activeColor?.name ?? ""}) sur WhatsApp`}
              aria-label={`Acheter ${product.name} sur WhatsApp`}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#15803D] text-white transition hover:bg-[#166534]"
            >
              <WhatsAppIcon className="h-4 w-4" />
            </a>

            <button
              type="button"
              onClick={(e) => void handleQuickOrder(e)}
              disabled={isMutating || onRequest}
              title="Ajouter au panier pour commander"
              aria-label={`Ajouter ${product.name} au panier`}
              data-testid={`quick-add-${product.slug}`}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E4E4E7] bg-[#F5F5F7] text-[#111113] transition hover:border-[#111113] hover:bg-white disabled:opacity-40"
            >
              {justAdded ? (
                <Check className="h-4 w-4 text-[#15803D]" strokeWidth={2.3} />
              ) : (
                <ShoppingBag className="h-4 w-4" strokeWidth={1.8} />
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
