"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useCart } from "./CartContext";
import { formatPrice } from "@/lib/format";
import { buildCartWhatsAppUrl, WHATSAPP_DISPLAY } from "@/lib/whatsapp";
import { WhatsAppIcon } from "./WhatsAppIcon";

export function CartDrawer() {
  const {
    cart,
    isDrawerOpen,
    isMutating,
    closeDrawer,
    updateItemQuantity,
    removeItem,
    applyPromo,
  } = useCart();

  const [promoOpen, setPromoOpen] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) return null;

  const progressPct = Math.min(
    100,
    Math.round((cart.total / Math.max(1, cart.freeDeliveryThreshold)) * 100)
  );

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    if (!promoInput.trim()) return;
    const result = await applyPromo(promoInput.trim());
    if (!result.ok) {
      setPromoError(result.error ?? "Code invalide.");
    } else {
      setPromoInput("");
      setPromoOpen(false);
    }
  };

  const whatsappCartUrl = buildCartWhatsAppUrl(
    cart.items.map((i) => ({
      name: i.name,
      conditionLabel: i.conditionLabel,
      storage: i.storage,
      selectedColor: i.selectedColor,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
    cart.total
  );

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Votre panier"
      data-testid="cart-drawer"
    >
      <button
        type="button"
        aria-label="Fermer le panier"
        onClick={closeDrawer}
        className="animate-fade-in fixed inset-0 bg-black/40 backdrop-blur-[2px]"
      />

      <aside className="animate-slide-in-right relative z-10 flex h-full w-full max-w-[440px] flex-col bg-white shadow-2xl">
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-[#E4E4E7] px-6 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-[-0.01em] text-[#111113]">
              Votre Panier
            </h2>
            <span className="rounded-full bg-[#F5F5F7] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#52525B]">
              {cart.itemCount}
            </span>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Fermer le panier"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#52525B] transition hover:bg-[#F5F5F7] hover:text-[#111113]"
          >
            <X className="h-5 w-5" strokeWidth={1.7} />
          </button>
        </div>

        {/* Barre livraison gratuite Abidjan */}
        {cart.items.length > 0 && (
          <div className="border-b border-[#E4E4E7] bg-[#F5F5F7] px-6 py-3">
            <div className="flex items-center gap-2 text-xs text-[#111113]">
              {cart.remainingForFreeDelivery === 0 ? (
                <>
                  <Check className="h-3.5 w-3.5 shrink-0 text-[#15803D]" strokeWidth={2.4} />
                  <span>
                    <strong>Livraison Express Abidjan offerte</strong> sur votre commande
                  </span>
                </>
              ) : (
                <>
                  <Truck className="h-3.5 w-3.5 shrink-0 text-[#52525B]" strokeWidth={1.7} />
                  <span>
                    Plus que{" "}
                    <strong className="tabular-nums">
                      {formatPrice(cart.remainingForFreeDelivery)}
                    </strong>{" "}
                    pour la livraison gratuite à Abidjan
                  </span>
                </>
              )}
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#E4E4E7]">
              <div
                className="h-full rounded-full bg-[#0066CC] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Contenu */}
        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5F5F7] text-[#71717A]">
              <ShoppingBag className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <h3 className="mt-5 text-lg font-bold text-[#111113]">
              Votre panier est vide
            </h3>
            <p className="mt-2 max-w-[270px] text-sm leading-relaxed text-[#52525B]">
              Découvrez nos iPhone (Série X à 17), smartphones Samsung et accessoires 100% originaux.
            </p>
            <Link
              href="/#catalogue"
              onClick={closeDrawer}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#111113] px-6 py-3 text-xs font-semibold text-white transition hover:bg-[#0066CC]"
            >
              Parcourir le catalogue
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/#tarifs"
              onClick={closeDrawer}
              className="mt-3 text-xs font-medium text-[#0066CC] hover:underline"
            >
              Voir la grille tarifaire du jour
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-3">
              <ul className="divide-y divide-[#E4E4E7]">
                {cart.items.map((item) => (
                  <li key={item.id} className="flex gap-3.5 py-4">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeDrawer}
                      className="block h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#F5F5F7]"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover object-center"
                      />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/products/${item.slug}`}
                            onClick={closeDrawer}
                            className="text-sm font-bold text-[#111113] transition hover:text-[#0066CC]"
                          >
                            {item.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => void removeItem(item.id)}
                            disabled={isMutating}
                            aria-label={`Retirer ${item.name}`}
                            className="p-1 text-[#71717A] transition hover:text-red-600 disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <p className="mt-0.5 text-xs font-medium text-[#52525B]">
                          {item.conditionLabel}
                          {item.storage !== "Standard" ? ` · ${item.storage}` : ""}
                          {item.simType ? ` · ${item.simType}` : ""}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#71717A]">
                          Couleur :{" "}
                          <span className="font-medium text-[#111113]">
                            {item.selectedColor}
                          </span>
                        </p>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-full border border-[#E4E4E7] bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              void updateItemQuantity(item.id, item.quantity - 1)
                            }
                            disabled={isMutating}
                            aria-label="Diminuer la quantité"
                            className="flex h-7 w-7 items-center justify-center text-[#52525B] hover:text-[#111113] disabled:opacity-40"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-[22px] text-center text-xs font-semibold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              void updateItemQuantity(item.id, item.quantity + 1)
                            }
                            disabled={
                              isMutating ||
                              item.quantity >= Math.min(10, item.stockQty)
                            }
                            aria-label="Augmenter la quantité"
                            className="flex h-7 w-7 items-center justify-center text-[#52525B] hover:text-[#111113] disabled:opacity-30"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <span className="text-sm font-bold tabular-nums text-[#111113]">
                          {formatPrice(item.lineTotal)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Code promo */}
              <div className="mt-2 border-t border-[#E4E4E7] pt-3.5">
                {cart.promoCode ? (
                  <div className="flex items-center justify-between rounded-xl bg-[#EFF6FF] px-3.5 py-2.5 text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-[#0066CC]">
                      <Tag className="h-3.5 w-3.5" />
                      {cart.promoCode} ({cart.promoLabel})
                    </span>
                    <button
                      type="button"
                      onClick={() => void applyPromo("")}
                      className="font-medium text-[#0066CC] underline"
                    >
                      Retirer
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => setPromoOpen((v) => !v)}
                      className="flex w-full items-center justify-between text-xs font-medium text-[#52525B] hover:text-[#111113]"
                    >
                      <span>Ajouter un code de réduction</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${
                          promoOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {promoOpen && (
                      <form onSubmit={handleApplyPromo} className="mt-2.5">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={promoInput}
                            onChange={(e) => setPromoInput(e.target.value)}
                            placeholder="Ex : MESSI10"
                            className="flex-1 rounded-lg border border-[#E4E4E7] bg-[#F5F5F7] px-3 py-2 text-xs uppercase text-[#111113] placeholder:normal-case focus:border-[#111113] focus:bg-white focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={isMutating || !promoInput.trim()}
                            className="rounded-lg bg-[#111113] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0066CC] disabled:opacity-40"
                          >
                            Appliquer
                          </button>
                        </div>
                        {promoError && (
                          <p className="mt-1.5 text-[11px] text-red-600">
                            {promoError}
                          </p>
                        )}
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Pied du panier : Double choix Commander ou WhatsApp */}
            <div className="border-t border-[#E4E4E7] bg-[#FAFAFB] px-6 py-4">
              <div className="space-y-1 text-xs text-[#52525B]">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span className="font-medium tabular-nums text-[#111113]">
                    {formatPrice(cart.subtotal)}
                  </span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-[#0066CC]">
                    <span>Remise ({cart.promoCode})</span>
                    <span className="font-semibold tabular-nums">
                      −{formatPrice(cart.discount)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-baseline justify-between border-t border-[#E4E4E7] pt-3">
                <span className="text-sm font-bold text-[#111113]">Total</span>
                <span
                  data-testid="cart-total"
                  className="text-lg font-extrabold tabular-nums text-[#111113]"
                >
                  {formatPrice(cart.total)}
                </span>
              </div>

              <div className="mt-3.5 space-y-2">
                <Link
                  href="/checkout"
                  onClick={closeDrawer}
                  data-testid="checkout-cta"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#111113] px-5 py-3.5 text-xs font-bold text-white transition hover:bg-[#0066CC]"
                >
                  Finaliser la commande
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <a
                  href={whatsappCartUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#15803D] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#166534]"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Acheter sur WhatsApp ({WHATSAPP_DISPLAY})
                </a>
              </div>

              <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-[#71717A]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#15803D]" />
                Wave · Orange Money · MTN · Espèces à la livraison
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
