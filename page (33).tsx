"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Truck,
  Wallet,
} from "lucide-react";
import { useCart } from "@/components/CartContext";
import { calculateShippingFee, formatPrice } from "@/lib/format";
import { buildCartWhatsAppUrl, WHATSAPP_DISPLAY } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

const ABIDJAN_COMMUNES = [
  "Cocody (Riviera, Angré, II-Plateaux, Danga)",
  "Plateau",
  "Marcory (Zone 4, Bietry, Résidentiel)",
  "Yopougon",
  "Treichville",
  "Koumassi",
  "Port-Bouët",
  "Adjamé",
  "Abobo",
  "Attécoubé",
  "Bingerville",
  "Grand-Bassam",
  "Anyama",
];

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    settings,
    isHydrated,
    isMutating,
    applyPromo,
    setCartDirect,
    getCartHeaders,
  } = useCart();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<
    "abidjan-express" | "retrait-boutique" | "interieur-ci"
  >("abidjan-express");
  const [commune, setCommune] = useState(ABIDJAN_COMMUNES[0]);
  const [interiorCity, setInteriorCity] = useState("");
  const [addressDetails, setAddressDetails] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "livraison-especes" | "wave" | "orange-money" | "mtn-momo"
  >("livraison-especes");
  const [customerNote, setCustomerNote] = useState("");

  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [orderRedirecting, setOrderRedirecting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const shippingFee = calculateShippingFee(deliveryMethod, cart.total, settings);
  const abidjanFeePreview = calculateShippingFee("abidjan-express", cart.total, settings);
  const grandTotal = cart.total + shippingFee;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    if (!promoInput.trim()) return;
    const res = await applyPromo(promoInput.trim());
    if (!res.ok) {
      setPromoError(res.error ?? "Code invalide.");
    } else {
      setPromoInput("");
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      const cityValue =
        deliveryMethod === "interieur-ci"
          ? interiorCity.trim() || "Intérieur CI"
          : "Abidjan";
      const communeValue =
        deliveryMethod === "retrait-boutique"
          ? "Showroom Messi Store"
          : deliveryMethod === "interieur-ci"
            ? interiorCity.trim()
            : commune;

      const res = await fetch("/api/checkout", {
        method: "POST",
        credentials: "same-origin",
        headers: getCartHeaders(),
        body: JSON.stringify({
          fullName,
          phone,
          email,
          city: cityValue,
          commune: communeValue,
          addressDetails:
            deliveryMethod === "retrait-boutique"
              ? "Retrait au showroom Messi Store Abidjan"
              : addressDetails,
          deliveryMethod,
          paymentMethod,
          customerNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Veuillez vérifier vos informations.");
        setSubmitting(false);
        return;
      }

      setOrderRedirecting(true);
      if (data.cart) {
        setCartDirect(data.cart);
      }
      router.push(`/orders/${encodeURIComponent(data.orderNumber)}`);
    } catch {
      setSubmitError("Erreur de connexion. Veuillez réessayer.");
      setSubmitting(false);
    }
  };

  if (!isHydrated || orderRedirecting) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#E4E4E7] border-t-[#111113]" />
        <p className="mt-4 text-sm text-[#52525B]">
          {orderRedirecting
            ? "Validation de votre bon de commande Messi Store..."
            : "Chargement de votre panier..."}
        </p>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5F5F7] text-[#71717A]">
          <ShoppingBag className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold text-[#111113]">
          Votre panier est vide
        </h1>
        <p className="mt-2 text-sm text-[#52525B]">
          Choisissez votre iPhone, Samsung ou accessoire pour passer commande.
        </p>
        <Link
          href="/#catalogue"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#111113] px-6 py-3.5 text-xs font-bold text-white hover:bg-[#0066CC]"
        >
          Voir le catalogue
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const waCartUrl = buildCartWhatsAppUrl(
    cart.items.map((i) => ({
      name: i.name,
      conditionLabel: i.conditionLabel,
      storage: i.storage,
      selectedColor: i.selectedColor,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
    grandTotal
  );

  return (
    <div className="mx-auto max-w-[1300px] px-4 py-10 sm:px-8 lg:px-12">
      <div className="mb-8 border-b border-[#E4E4E7] pb-5">
        <Link
          href="/#catalogue"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#52525B] hover:text-[#111113]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Continuer mes achats
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.02em] text-[#111113] sm:text-4xl">
          Valider ma commande
        </h1>
        <p className="mt-1 text-sm text-[#52525B]">
          Enregistrez votre bon de commande ci-dessous : vérification complète de l&apos;appareil avant règlement.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* FORMULAIRE DE COMMANDE */}
        <form
          onSubmit={handleSubmitOrder}
          className="space-y-8 lg:col-span-7"
        >
          {/* 1. Coordonnées client */}
          <section className="rounded-2xl border border-[#E4E4E7] bg-white p-5 sm:p-6">
            <h2 className="text-base font-bold text-[#111113]">
              1. Vos coordonnées
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="co-fullName"
                  className="block text-xs font-semibold text-[#52525B]"
                >
                  Nom et prénom *
                </label>
                <input
                  id="co-fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex : Kouassi Jean-Marc"
                  className="mt-1.5 w-full rounded-xl border border-[#E4E4E7] bg-[#F5F5F7] px-4 py-3 text-sm text-[#111113] focus:border-[#111113] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="co-phone"
                  className="block text-xs font-semibold text-[#52525B]"
                >
                  Numéro WhatsApp / Appel *
                </label>
                <input
                  id="co-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ex : 07 08 09 10 11"
                  className="mt-1.5 w-full rounded-xl border border-[#E4E4E7] bg-[#F5F5F7] px-4 py-3 text-sm tabular-nums text-[#111113] focus:border-[#111113] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="co-email"
                  className="block text-xs font-semibold text-[#52525B]"
                >
                  Adresse e-mail (facultatif, pour copie de facture)
                </label>
                <input
                  id="co-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@email.com"
                  className="mt-1.5 w-full rounded-xl border border-[#E4E4E7] bg-[#F5F5F7] px-4 py-3 text-sm text-[#111113] focus:border-[#111113] focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* 2. Mode & Lieu de livraison */}
          <section className="rounded-2xl border border-[#E4E4E7] bg-white p-5 sm:p-6">
            <h2 className="text-base font-bold text-[#111113]">
              2. Mode de réception
            </h2>
            <div className="mt-4 space-y-2.5">
              {[
                {
                  id: "abidjan-express" as const,
                  title: "Livraison à Abidjan",
                  sub: "Livreur dédié Messi Store · Test de l'appareil sur place",
                  price:
                    abidjanFeePreview === 0
                      ? "Gratuite"
                      : formatPrice(abidjanFeePreview),
                  icon: Truck,
                },
                {
                  id: "retrait-boutique" as const,
                  title: "Retrait direct au Showroom Messi Store",
                  sub: "Réservation immédiate · Vérification et prise en main en boutique",
                  price: "Gratuit",
                  icon: Building2,
                },
                {
                  id: "interieur-ci" as const,
                  title: "Expédition Intérieur du Pays (24h à 48h)",
                  sub: "Yamoussoukro, Bouaké, San-Pédro, Korhogo, Daloa, Man... (colis sécurisé)",
                  price: formatPrice(settings.deliveryInterieur),
                  icon: MapPin,
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = deliveryMethod === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-4 transition ${
                      active
                        ? "border-[#0066CC] bg-[#EFF6FF]/60 ring-1 ring-[#0066CC]"
                        : "border-[#E4E4E7] hover:border-[#111113]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        checked={active}
                        onChange={() => setDeliveryMethod(opt.id)}
                        className="h-4 w-4 accent-[#0066CC]"
                      />
                      <Icon className="h-4 w-4 shrink-0 text-[#111113]" />
                      <div>
                        <p className="text-xs font-bold text-[#111113] sm:text-sm">
                          {opt.title}
                        </p>
                        <p className="text-[11px] text-[#52525B]">{opt.sub}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-bold tabular-nums text-[#15803D]">
                      {opt.price}
                    </span>
                  </label>
                );
              })}
            </div>

            {deliveryMethod === "abidjan-express" && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="co-commune"
                    className="block text-xs font-semibold text-[#52525B]"
                  >
                    Commune *
                  </label>
                  <select
                    id="co-commune"
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#E4E4E7] bg-[#F5F5F7] px-3.5 py-3 text-sm text-[#111113] focus:border-[#111113] focus:bg-white focus:outline-none"
                  >
                    {ABIDJAN_COMMUNES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="co-address"
                    className="block text-xs font-semibold text-[#52525B]"
                  >
                    Quartier / Repère précis *
                  </label>
                  <input
                    id="co-address"
                    type="text"
                    required
                    value={addressDetails}
                    onChange={(e) => setAddressDetails(e.target.value)}
                    placeholder="Ex : Angré 8e Tranche, près du carrefour..."
                    className="mt-1.5 w-full rounded-xl border border-[#E4E4E7] bg-[#F5F5F7] px-4 py-3 text-sm text-[#111113] focus:border-[#111113] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {deliveryMethod === "interieur-ci" && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="co-interior-city"
                    className="block text-xs font-semibold text-[#52525B]"
                  >
                    Ville de destination *
                  </label>
                  <input
                    id="co-interior-city"
                    type="text"
                    required
                    value={interiorCity}
                    onChange={(e) => setInteriorCity(e.target.value)}
                    placeholder="Ex : Yamoussoukro, Bouaké, San-Pédro..."
                    className="mt-1.5 w-full rounded-xl border border-[#E4E4E7] bg-[#F5F5F7] px-4 py-3 text-sm text-[#111113] focus:border-[#111113] focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="co-compagnie"
                    className="block text-xs font-semibold text-[#52525B]"
                  >
                    Compagnie souhaitée &amp; quartier *
                  </label>
                  <input
                    id="co-compagnie"
                    type="text"
                    required
                    value={addressDetails}
                    onChange={(e) => setAddressDetails(e.target.value)}
                    placeholder="Ex : Gare UTB / AVS..."
                    className="mt-1.5 w-full rounded-xl border border-[#E4E4E7] bg-[#F5F5F7] px-4 py-3 text-sm text-[#111113] focus:border-[#111113] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            )}
          </section>

          {/* 3. Mode de paiement + Précision couleur */}
          <section className="rounded-2xl border border-[#E4E4E7] bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-[#111113]">
              <Wallet className="h-4 w-4 text-[#0066CC]" />
              3. Mode de paiement &amp; précision couleur
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {[
                {
                  id: "livraison-especes" as const,
                  label: "Espèces à la livraison",
                  note: "Après contrôle de l'appareil",
                },
                {
                  id: "wave" as const,
                  label: "Wave Côte d'Ivoire",
                  note: "Transfert simple à la réception",
                },
                {
                  id: "orange-money" as const,
                  label: "Orange Money",
                  note: "Paiement mobile sécurisé",
                },
                {
                  id: "mtn-momo" as const,
                  label: "MTN Mobile Money",
                  note: "Paiement mobile sécurisé",
                },
              ].map((pm) => {
                const active = paymentMethod === pm.id;
                return (
                  <label
                    key={pm.id}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3.5 transition ${
                      active
                        ? "border-[#111113] bg-[#F5F5F7] ring-1 ring-[#111113]"
                        : "border-[#E4E4E7] hover:border-[#111113]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={active}
                      onChange={() => setPaymentMethod(pm.id)}
                      className="mt-0.5 h-4 w-4 accent-[#111113]"
                    />
                    <div>
                      <p className="text-xs font-bold text-[#111113]">
                        {pm.label}
                      </p>
                      <p className="text-[11px] text-[#52525B]">{pm.note}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="mt-4">
              <label
                htmlFor="co-note"
                className="block text-xs font-semibold text-[#52525B]"
              >
                Précision couleur, heure de livraison ou demande particulière
              </label>
              <textarea
                id="co-note"
                rows={2}
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                placeholder="Ex : Je préfère la couleur Blanc (ou Orange en 2e choix), livraison vers 15h..."
                className="mt-1.5 w-full rounded-xl border border-[#E4E4E7] bg-[#F5F5F7] px-4 py-2.5 text-sm text-[#111113] focus:border-[#111113] focus:bg-white focus:outline-none"
              />
            </div>
          </section>

          {submitError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {submitError}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={submitting || isMutating}
              data-testid="place-order-button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#111113] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#0066CC] disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting
                ? "Enregistrement de la commande..."
                : `Confirmer ma commande — ${formatPrice(grandTotal)}`}
            </button>

            <a
              href={waCartUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#15803D] bg-[#ECFDF5] px-6 py-3.5 text-xs font-bold text-[#15803D] transition hover:bg-[#15803D] hover:text-white"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Ou commander directement sur WhatsApp ({WHATSAPP_DISPLAY})
            </a>
          </div>
        </form>

        {/* RÉCAPITULATIF DE COMMANDE */}
        <aside className="lg:col-span-5">
          <div className="rounded-2xl border border-[#E4E4E7] bg-[#F5F5F7] p-6 lg:sticky lg:top-28">
            <h2 className="text-base font-bold text-[#111113]">
              Récapitulatif ({cart.itemCount} article
              {cart.itemCount > 1 ? "s" : ""})
            </h2>

            <ul className="mt-4 divide-y divide-[#E4E4E7]">
              {cart.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3.5 py-3.5">
                  <div className="relative h-14 w-16 shrink-0 rounded-lg bg-white">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full rounded-lg object-cover object-center"
                    />
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#111113] px-1 text-[10px] font-bold text-white">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[#111113] sm:text-sm">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-[#52525B]">
                      {item.conditionLabel}
                      {item.storage !== "Standard" ? ` · ${item.storage}` : ""}
                      {item.simType ? ` · ${item.simType}` : ""}
                    </p>
                    <p className="text-[11px] text-[#0066CC]">
                      Couleur : {item.selectedColor}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-extrabold tabular-nums text-[#111113] sm:text-sm">
                    {formatPrice(item.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Code promo */}
            <div className="mt-2 border-t border-[#E4E4E7] pt-4">
              {cart.promoCode ? (
                <div className="flex items-center justify-between rounded-xl bg-[#EFF6FF] px-3.5 py-2.5 text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-[#0066CC]">
                    <Tag className="h-3.5 w-3.5" />
                    {cart.promoCode} ({cart.promoLabel})
                  </span>
                  <button
                    type="button"
                    onClick={() => void applyPromo("")}
                    className="font-semibold text-[#0066CC] underline"
                  >
                    Retirer
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Code promo (ex : MESSI10)"
                      data-testid="checkout-promo-input"
                      className="flex-1 rounded-xl border border-[#E4E4E7] bg-white px-3.5 py-2.5 text-xs uppercase text-[#111113] placeholder:normal-case focus:border-[#111113] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isMutating || !promoInput.trim()}
                      data-testid="checkout-promo-apply"
                      className="rounded-xl border border-[#111113] bg-white px-4 py-2.5 text-xs font-bold text-[#111113] hover:bg-[#111113] hover:text-white disabled:opacity-40"
                    >
                      OK
                    </button>
                  </div>
                  {promoError && (
                    <p className="mt-1.5 text-xs text-red-600">{promoError}</p>
                  )}
                </form>
              )}
            </div>

            <dl className="mt-4 space-y-2 border-t border-[#E4E4E7] pt-4 text-xs sm:text-sm">
              <div className="flex justify-between text-[#52525B]">
                <dt>Sous-total</dt>
                <dd className="font-semibold tabular-nums text-[#111113]">
                  {formatPrice(cart.subtotal)}
                </dd>
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-[#0066CC]">
                  <dt>Remise ({cart.promoCode})</dt>
                  <dd className="font-semibold tabular-nums">
                    −{formatPrice(cart.discount)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between text-[#52525B]">
                <dt>Livraison</dt>
                <dd className="font-semibold tabular-nums text-[#15803D]">
                  {shippingFee === 0 ? "Gratuite" : formatPrice(shippingFee)}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex items-baseline justify-between border-t border-[#E4E4E7] pt-4">
              <span className="text-sm font-bold text-[#111113]">
                Total à payer
              </span>
              <span
                data-testid="checkout-total"
                className="text-2xl font-extrabold tabular-nums text-[#111113]"
              >
                {formatPrice(grandTotal)}
              </span>
            </div>

            <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-white p-3.5 text-xs text-[#52525B]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#15803D]" />
              <span>
                Reçu officiel Messi Store + garantie inclus. Assistance WhatsApp immédiate au{" "}
                <strong className="text-[#111113]">{WHATSAPP_DISPLAY}</strong>.
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
