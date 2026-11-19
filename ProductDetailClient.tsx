"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  BatteryCharging,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Handshake,
  HelpCircle,
  Maximize2,
  PenLine,
  ShieldCheck,
  ShoppingBag,
  Star,
  ThumbsUp,
  Truck,
  X,
} from "lucide-react";
import type { ProductCondition } from "@/db/schema";
import {
  CONDITIONS_MAP,
  formatPrice,
  formatReviewDate,
  priceLabel,
  type ProductDetailDTO,
  type ReviewDTO,
} from "@/lib/format";
import {
  buildAskInfoWhatsAppUrl,
  buildBuyWithColorWhatsAppUrl,
  buildNegotiateWhatsAppUrl,
  WHATSAPP_DISPLAY,
} from "@/lib/whatsapp";
import { useCart } from "./CartContext";
import { ProductCard } from "./ProductCard";
import { WhatsAppIcon } from "./WhatsAppIcon";

interface ProductDetailClientProps {
  product: ProductDetailDTO;
}

const SPEC_ROWS: Array<{
  key: keyof ProductDetailDTO["specs"];
  label: string;
}> = [
  { key: "ecran", label: "Écran & Affichage" },
  { key: "puce", label: "Puce, Processeur & RAM" },
  { key: "camera", label: "Appareil Photo / Capteurs" },
  { key: "selfie", label: "Caméra Avant / Audio" },
  { key: "batterie", label: "Batterie & Recharge" },
  { key: "simReseau", label: "SIM, eSIM & Réseaux" },
  { key: "securite", label: "Sécurité & Biométrie" },
  { key: "resistance", label: "Matériaux & Étanchéité" },
  { key: "dimensionsPoids", label: "Dimensions & Poids" },
  { key: "systeme", label: "Système d'exploitation" },
  { key: "contenuGarantie", label: "Contenu & Garantie Messi Store" },
];

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const { addItem, isMutating, showToast } = useCart();

  const initialVar = product.defaultVariant ?? product.variants[0];

  const [selectedCondition, setSelectedCondition] = useState<ProductCondition>(
    initialVar.condition
  );
  const [selectedVariantId, setSelectedVariantId] = useState<number>(
    initialVar.id
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    initialVar.colorNote ?? product.colors[0]?.name ?? "Couleur au choix"
  );
  const [customColorNote, setCustomColorNote] = useState<string>("");

  // Panneau de négociation WhatsApp
  const [negotiateOpen, setNegotiateOpen] = useState<boolean>(false);
  const [offerInput, setOfferInput] = useState<string>("");
  const [negotiateMessage, setNegotiateMessage] = useState<string>("");

  // Galerie photos réelles
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [addedFeedback, setAddedFeedback] = useState<boolean>(false);

  // Avis clients
  const [reviewsList, setReviewsList] = useState<ReviewDTO[]>(product.reviews);
  const [ratingAvg, setRatingAvg] = useState<number>(product.ratingAvg);
  const [reviewCount, setReviewCount] = useState<number>(product.reviewCount);
  const [breakdown, setBreakdown] = useState(product.ratingBreakdown);
  const [votedIds, setVotedIds] = useState<number[]>([]);

  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formAuthor, setFormAuthor] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Variantes filtrées selon l'état choisi
  const conditionVariants = useMemo(
    () =>
      product.variants
        .filter((v) => v.condition === selectedCondition)
        .sort((a, b) => a.price - b.price),
    [product.variants, selectedCondition]
  );

  const activeVariant = useMemo(() => {
    return (
      conditionVariants.find((v) => v.id === selectedVariantId) ??
      conditionVariants[0] ??
      product.variants[0]
    );
  }, [conditionVariants, selectedVariantId, product.variants]);

  const handleSelectCondition = (cond: ProductCondition) => {
    setSelectedCondition(cond);
    const matching = product.variants
      .filter((v) => v.condition === cond)
      .sort((a, b) => a.price - b.price);
    const preferred =
      matching.find((v) => v.availability === "in-stock") ?? matching[0];
    if (preferred) {
      setSelectedVariantId(preferred.id);
      if (preferred.colorNote) {
        setSelectedColor(preferred.colorNote);
      }
    }
  };

  const handleSelectVariant = (variantId: number, colorNote: string | null) => {
    setSelectedVariantId(variantId);
    if (colorNote) {
      setSelectedColor(colorNote);
    }
  };

  const activePhoto = product.gallery[activePhotoIdx] ?? product.gallery[0];
  const conditionInfo = CONDITIONS_MAP[activeVariant.condition];
  const isAvailableNow = activeVariant.availability === "in-stock";

  const finalColorText = customColorNote.trim()
    ? `${selectedColor} (${customColorNote.trim()})`
    : selectedColor;

  const waContext = {
    productName: product.name,
    brand: product.brand,
    conditionLabel: activeVariant.conditionLabel,
    storage: activeVariant.storage,
    simType: activeVariant.simType,
    price: activeVariant.price,
    selectedColor: finalColorText,
    availability: activeVariant.availability,
  };

  const onRequest = activeVariant.price <= 0;
  const buyWhatsAppUrl = onRequest
    ? buildAskInfoWhatsAppUrl(waContext)
    : buildBuyWithColorWhatsAppUrl(waContext, finalColorText);
  const askInfoWhatsAppUrl = buildAskInfoWhatsAppUrl(waContext);

  const parsedOffer = Number(offerInput.replace(/\D/g, ""));
  const negotiateWhatsAppUrl = buildNegotiateWhatsAppUrl(
    waContext,
    parsedOffer > 0 ? parsedOffer : null,
    negotiateMessage
  );

  const handleOrderNow = async () => {
    const ok = await addItem(activeVariant.id, 1, {
      openDrawer: false,
      selectedColor: finalColorText,
    });
    if (ok) {
      router.push("/checkout");
    }
  };

  const handleAddToCart = async () => {
    const ok = await addItem(activeVariant.id, 1, {
      openDrawer: true,
      selectedColor: finalColorText,
    });
    if (ok) {
      setAddedFeedback(true);
      window.setTimeout(() => setAddedFeedback(false), 1800);
    }
  };

  const handleMarkHelpful = async (reviewId: number) => {
    if (votedIds.includes(reviewId)) return;
    setVotedIds((prev) => [...prev, reviewId]);
    setReviewsList((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
      )
    );
    try {
      await fetch(`/api/reviews/${reviewId}/helpful`, { method: "POST" });
    } catch {
      // ignore
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmittingReview(true);
    try {
      const variantLabel = `${activeVariant.conditionLabel}${
        activeVariant.storage !== "Standard" ? ` · ${activeVariant.storage}` : ""
      }`;
      const res = await fetch(`/api/products/${product.slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: formAuthor,
          authorLocation: formLocation || "Abidjan",
          rating: formRating,
          title: formTitle,
          body: formBody,
          variantLabel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Veuillez vérifier tous les champs.");
        return;
      }

      setFormAuthor("");
      setFormLocation("");
      setFormTitle("");
      setFormBody("");
      setFormRating(5);
      setReviewFormOpen(false);
      showToast(data.message ?? "Merci ! Votre avis sera publié après vérification.");
    } catch {
      setFormError("Impossible d'envoyer votre avis pour le moment.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="bg-white">
      {/* Fil d'Ariane */}
      <nav
        aria-label="Fil d'Ariane"
        className="mx-auto max-w-[1380px] px-4 pt-5 sm:px-8 lg:px-12"
      >
        <ol className="flex flex-wrap items-center gap-2 text-xs text-[#71717A]">
          <li>
            <Link href="/" className="hover:text-[#111113]">
              Accueil
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link
              href={`/?collection=${product.collectionSlug}#catalogue`}
              className="hover:text-[#111113]"
            >
              {product.collectionName}
            </Link>
          </li>
          <li>/</li>
          <li className="font-semibold text-[#111113]">{product.name}</li>
        </ol>
      </nav>

      {/* SECTION PRINCIPALE : GALERIE PHOTOS RÉELLES + CONFIGURATEUR & ACTIONS */}
      <section className="mx-auto max-w-[1380px] px-4 pt-5 pb-16 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          {/* GAUCHE : Galerie de photos réelles (6 cols) */}
          <div className="lg:col-span-6">
            <div className="lg:sticky lg:top-28">
              <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#E4E4E7] bg-[#F5F5F7]">
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  aria-label="Agrandir la photo"
                  className="block h-full w-full cursor-zoom-in"
                >
                  <img
                    src={activePhoto.url}
                    alt={activePhoto.alt}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover object-center transition-transform duration-500"
                  />
                </button>

                {product.gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Photo précédente"
                      onClick={() =>
                        setActivePhotoIdx(
                          (activePhotoIdx - 1 + product.gallery.length) %
                            product.gallery.length
                        )
                      }
                      className="absolute top-1/2 left-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#111113] shadow-sm transition hover:bg-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Photo suivante"
                      onClick={() =>
                        setActivePhotoIdx(
                          (activePhotoIdx + 1) % product.gallery.length
                        )
                      }
                      className="absolute top-1/2 right-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#111113] shadow-sm transition hover:bg-white"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  aria-label="Plein écran"
                  className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#52525B] shadow-xs hover:text-[#111113]"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>

                <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
                  <span className="truncate rounded-lg bg-black/65 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-xs">
                    {activePhoto.caption}
                  </span>
                  <span className="shrink-0 rounded-lg bg-black/65 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white backdrop-blur-xs">
                    {activePhotoIdx + 1}/{product.gallery.length}
                  </span>
                </div>
              </div>

              {/* Miniatures des photos réelles */}
              <div className="mt-3 grid grid-cols-4 gap-2.5">
                {product.gallery.map((photo, idx) => {
                  const active = idx === activePhotoIdx;
                  return (
                    <button
                      key={`${photo.url}-${idx}`}
                      type="button"
                      onClick={() => setActivePhotoIdx(idx)}
                      aria-label={`Afficher photo ${idx + 1}`}
                      className={`aspect-[4/3] overflow-hidden rounded-xl border bg-[#F5F5F7] transition ${
                        active
                          ? "border-[#0066CC] ring-2 ring-[#0066CC]/30"
                          : "border-[#E4E4E7] opacity-75 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.alt}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover object-center"
                      />
                    </button>
                  );
                })}
              </div>

              {/* Résumé rapide Fiche Technique sous la photo */}
              <div className="mt-5 rounded-2xl border border-[#E4E4E7] bg-[#FAFAFB] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#111113]">
                    Aperçu technique
                  </span>
                  <a
                    href="#fiche-technique"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0066CC] hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Voir toute la fiche technique
                  </a>
                </div>
                <dl className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                  <div className="rounded-lg bg-white p-2.5 ring-1 ring-[#EFEFF2]">
                    <dt className="text-[10px] font-bold uppercase text-[#71717A]">
                      Écran
                    </dt>
                    <dd className="mt-0.5 line-clamp-2 font-medium text-[#111113]">
                      {product.specs.ecran}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-white p-2.5 ring-1 ring-[#EFEFF2]">
                    <dt className="text-[10px] font-bold uppercase text-[#71717A]">
                      Puce &amp; Mémoire
                    </dt>
                    <dd className="mt-0.5 line-clamp-2 font-medium text-[#111113]">
                      {product.specs.puce}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-white p-2.5 ring-1 ring-[#EFEFF2]">
                    <dt className="text-[10px] font-bold uppercase text-[#71717A]">
                      Caméra
                    </dt>
                    <dd className="mt-0.5 line-clamp-2 font-medium text-[#111113]">
                      {product.specs.camera}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-white p-2.5 ring-1 ring-[#EFEFF2]">
                    <dt className="text-[10px] font-bold uppercase text-[#71717A]">
                      Batterie
                    </dt>
                    <dd className="mt-0.5 line-clamp-2 font-medium text-[#111113]">
                      {product.specs.batterie}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* DROITE : Sélection État, Stockage, Couleur & 4 Actions d'achat (6 cols) */}
          <div className="lg:col-span-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[#F5F5F7] px-2.5 py-1 text-[11px] font-bold text-[#3F3F46]">
                {product.brand} · {product.series}
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${conditionInfo.badgeClass}`}
              >
                {conditionInfo.label}
              </span>
              {reviewCount > 0 && (
                <a
                  href="#avis"
                  className="inline-flex items-center gap-1 text-xs text-[#52525B] hover:text-[#111113]"
                >
                  <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                  <strong className="tabular-nums text-[#111113]">
                    {ratingAvg.toFixed(1)}
                  </strong>
                  <span>({reviewCount} avis)</span>
                </a>
              )}
            </div>

            <h1 className="mt-2.5 text-3xl font-extrabold tracking-[-0.025em] text-[#111113] sm:text-4xl">
              {product.name}
            </h1>

            <p className="mt-2.5 text-sm leading-relaxed text-[#52525B]">
              {product.description}
            </p>

            {/* BLOC PRIX & DISPONIBILITÉ EN DIRECT */}
            <div className="mt-5 rounded-2xl border border-[#E4E4E7] bg-[#F5F5F7] p-4 sm:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <span
                    data-testid="pdp-price"
                    className="text-3xl font-extrabold tabular-nums tracking-[-0.02em] text-[#111113]"
                  >
                    {priceLabel(activeVariant.price)}
                  </span>
                  {activeVariant.compareAtPrice &&
                    activeVariant.compareAtPrice > activeVariant.price && (
                      <span className="ml-2.5 text-sm tabular-nums text-[#71717A] line-through">
                        {formatPrice(activeVariant.compareAtPrice)}
                      </span>
                    )}
                </div>

                {isAvailableNow ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-bold text-[#047857]">
                    <span className="h-2 w-2 rounded-full bg-[#047857]" />
                    En stock immédiat
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-bold text-[#B45309]">
                    <span className="h-2 w-2 rounded-full bg-[#D97706]" />
                    Sur commande (24h–48h)
                  </span>
                )}
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#52525B]">
                <span className="inline-flex items-center gap-1 font-medium text-[#111113]">
                  <BatteryCharging className="h-3.5 w-3.5 text-[#15803D]" />
                  {activeVariant.batteryHealth}
                </span>
                <span>·</span>
                <span>{conditionInfo.warranty}</span>
              </div>
            </div>

            {/* SÉLECTEUR 1 : ÉTAT DE L'APPAREIL */}
            <div className="mt-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#52525B]">
                1. Choisissez l&apos;état
              </span>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                {product.conditions.map((cond) => {
                  const meta = CONDITIONS_MAP[cond];
                  const active = cond === selectedCondition;
                  const pricedForCond = product.variants
                    .filter((v) => v.condition === cond && v.price > 0)
                    .map((v) => v.price);
                  const lowestForCond = pricedForCond.length ? Math.min(...pricedForCond) : 0;
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => handleSelectCondition(cond)}
                      data-testid={`pdp-condition-${cond}`}
                      className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                        active
                          ? "border-[#111113] bg-[#111113] text-white"
                          : "border-[#E4E4E7] bg-white text-[#111113] hover:border-[#111113]"
                      }`}
                    >
                      <span className="text-xs font-bold">{meta.label}</span>
                      <span
                        className={`mt-0.5 text-[11px] font-semibold tabular-nums ${
                          active ? "text-white/80" : "text-[#52525B]"
                        }`}
                      >
                        {lowestForCond > 0 ? `Dès ${formatPrice(lowestForCond)}` : "Prix sur demande"}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#52525B]">
                {conditionInfo.description}
              </p>
            </div>

            {/* SÉLECTEUR 2 : STOCKAGE & VERSION SIM */}
            <div className="mt-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#52525B]">
                2. Choisissez le stockage / la version
              </span>
              <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {conditionVariants.map((v) => {
                  const active = v.id === activeVariant.id;
                  const avail = v.availability === "in-stock";
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleSelectVariant(v.id, v.colorNote)}
                      data-testid={`variant-option-${v.sku}`}
                      className={`flex items-center justify-between rounded-xl border px-3.5 py-3 text-left transition ${
                        active
                          ? "border-[#0066CC] bg-[#EFF6FF] ring-1 ring-[#0066CC]"
                          : "border-[#E4E4E7] bg-white hover:border-[#111113]"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-[#111113]">
                          {v.storage !== "Standard" ? v.storage : v.simType ?? "Version Standard"}
                          {v.storage !== "Standard" && v.simType
                            ? ` · ${v.simType}`
                            : ""}
                        </p>
                        <p className="text-[11px] text-[#52525B]">
                          {v.colorNote
                            ? `${v.colorNote} · `
                            : ""}
                          <span
                            className={
                              avail ? "text-[#15803D]" : "text-[#B45309]"
                            }
                          >
                            {avail ? "En stock" : "Sur commande"}
                          </span>
                        </p>
                      </div>
                      <span className="text-xs font-extrabold tabular-nums text-[#111113]">
                        {priceLabel(v.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SÉLECTEUR 3 : COULEUR SOUHAITÉE (confirmée sur WhatsApp) */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-[#52525B]">
                  3. Couleur souhaitée
                </span>
                <span className="font-bold text-[#111113]">{selectedColor}</span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {product.colors.map((c) => {
                  const active = selectedColor === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c.name)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "border-[#111113] bg-[#F5F5F7] text-[#111113] ring-1 ring-[#111113]"
                          : "border-[#E4E4E7] bg-white text-[#52525B] hover:border-[#111113]"
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-black/20"
                        style={{ backgroundColor: c.hex }}
                      />
                      {c.name}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={customColorNote}
                onChange={(e) => setCustomColorNote(e.target.value)}
                placeholder="Précision couleur optionnelle (ex : 2e choix ou modèle de coque)..."
                className="mt-2.5 w-full rounded-xl border border-[#E4E4E7] bg-[#FAFAFB] px-3.5 py-2 text-xs text-[#111113] placeholder:text-[#71717A] focus:border-[#111113] focus:bg-white focus:outline-none"
              />
            </div>

            {/* LES 4 OPTIONS D'ACHAT DEMANDÉES PAR LE CLIENT */}
            <div className="mt-7 space-y-2.5 border-t border-[#E4E4E7] pt-6">
              {/* Option 1 : ACHETER (indiquer la couleur par WhatsApp) */}
              <a
                href={buyWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="whatsapp-buy-button"
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#15803D] px-6 py-4 text-sm font-bold text-white shadow-xs transition hover:bg-[#166534]"
              >
                <WhatsAppIcon className="h-5 w-5 shrink-0" />
                <span>
                  {onRequest
                    ? "Obtenir le prix du jour sur WhatsApp"
                    : "Acheter — Indiquer la couleur sur WhatsApp"}
                </span>
              </a>

              {/* Option 2 : COMMANDER (en ligne + Ajouter au panier) */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void handleOrderNow()}
                  disabled={isMutating || onRequest}
                  title={onRequest ? "Prix sur demande : contactez-nous sur WhatsApp" : undefined}
                  data-testid="order-now-button"
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#111113] px-5 py-3.5 text-xs font-bold text-white transition hover:bg-[#0066CC] disabled:opacity-50 sm:text-sm"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Commander maintenant
                </button>

                <button
                  type="button"
                  onClick={() => void handleAddToCart()}
                  disabled={isMutating || onRequest}
                  data-testid="add-to-bag-button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#111113] bg-white px-5 py-3.5 text-xs font-bold text-[#111113] transition hover:bg-[#F5F5F7] disabled:opacity-50 sm:text-sm"
                >
                  {addedFeedback ? (
                    <>
                      <Check className="h-4 w-4 text-[#15803D]" />
                      Ajouté au panier
                    </>
                  ) : (
                    <>Ajouter au panier</>
                  )}
                </button>
              </div>

              {/* Options 3 & 4 : NÉGOCIER SUR WHATSAPP + DEMANDER PLUS D'INFORMATIONS */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setNegotiateOpen((v) => !v)}
                  data-testid="negotiate-toggle-button"
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition ${
                    negotiateOpen
                      ? "border-[#0066CC] bg-[#EFF6FF] text-[#0066CC]"
                      : "border-[#E4E4E7] bg-[#F5F5F7] text-[#111113] hover:border-[#15803D] hover:text-[#15803D]"
                  }`}
                >
                  <Handshake className="h-4 w-4" />
                  Négocier sur WhatsApp
                </button>

                <a
                  href={askInfoWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="ask-info-button"
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#E4E4E7] bg-[#F5F5F7] px-4 py-3 text-xs font-bold text-[#111113] transition hover:border-[#0066CC] hover:text-[#0066CC]"
                >
                  <HelpCircle className="h-4 w-4" />
                  Demander plus d&apos;informations
                </a>
              </div>

              {/* Encart interactif de négociation sur WhatsApp */}
              {negotiateOpen && (
                <div
                  data-testid="negotiate-panel"
                  className="animate-fade-in rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF]/70 p-4"
                >
                  <p className="text-xs font-bold text-[#111113]">
                    Proposez votre budget à Messi Store ({WHATSAPP_DISPLAY})
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#52525B]">
                    Prix affiché : <strong>{priceLabel(activeVariant.price)}</strong>. Indiquez votre proposition (facultatif) avant d&apos;ouvrir la discussion WhatsApp.
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={offerInput}
                      onChange={(e) => setOfferInput(e.target.value)}
                      placeholder="Votre offre en FCFA (ex : 315000)"
                      className="rounded-xl border border-[#E4E4E7] bg-white px-3 py-2 text-xs tabular-nums text-[#111113] focus:border-[#0066CC] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={negotiateMessage}
                      onChange={(e) => setNegotiateMessage(e.target.value)}
                      placeholder="Message (ex : achat cash aujourd'hui, troc...)"
                      className="rounded-xl border border-[#E4E4E7] bg-white px-3 py-2 text-xs text-[#111113] focus:border-[#0066CC] focus:outline-none"
                    />
                  </div>
                  <a
                    href={negotiateWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="send-negotiate-whatsapp"
                    className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#15803D] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#166534]"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    Discuter du prix sur WhatsApp
                  </a>
                </div>
              )}

              <p className="pt-1 text-center text-[11px] text-[#71717A]">
                Ligne directe Messi Store :{" "}
                <strong className="tabular-nums text-[#111113]">
                  {WHATSAPP_DISPLAY}
                </strong>{" "}
                · Réponse rapide 7j/7
              </p>
            </div>

            {/* Garanties & Confiance */}
            <ul className="mt-5 grid grid-cols-1 gap-2 rounded-2xl border border-[#E4E4E7] p-4 text-xs text-[#52525B] sm:grid-cols-3">
              <li className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 shrink-0 text-[#0066CC]" />
                <span>IMEI &amp; Face ID vérifiés</span>
              </li>
              <li className="flex items-center gap-2">
                <Truck className="h-4 w-4 shrink-0 text-[#15803D]" />
                <span>Livraison Abidjan &amp; CI</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#111113]" />
                <span>Reçu + Garantie boutique</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FICHE TECHNIQUE COMPLÈTE DU TÉLÉPHONE / ACCESSOIRE */}
      <section
        id="fiche-technique"
        className="scroll-mt-24 border-t border-[#E4E4E7] bg-[#F5F5F7]"
      >
        <div className="mx-auto max-w-[1380px] px-4 py-16 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0066CC]">
              Caractéristiques Officielles
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.02em] text-[#111113] sm:text-3xl">
              Fiche technique — {product.name}
            </h2>
          </div>

          {/* Points forts */}
          {product.highlights.length > 0 && (
            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {product.highlights.map((hl) => (
                <div
                  key={hl.title}
                  className="rounded-2xl border border-[#E4E4E7] bg-white p-5"
                >
                  <h3 className="text-sm font-bold text-[#111113]">
                    {hl.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#52525B]">
                    {hl.detail}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Tableau complet de la fiche technique */}
          <div className="mt-8 overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white">
            <dl className="divide-y divide-[#EFEFF2]">
              {SPEC_ROWS.map(({ key, label }) => {
                const val = product.specs[key];
                if (!val) return null;
                return (
                  <div
                    key={key}
                    className="grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-12 sm:gap-6 sm:px-6"
                  >
                    <dt className="text-xs font-bold text-[#52525B] sm:col-span-4">
                      {label}
                    </dt>
                    <dd className="text-sm text-[#111113] sm:col-span-8">
                      {val}
                    </dd>
                  </div>
                );
              })}
              <div className="grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-12 sm:gap-6 sm:px-6">
                <dt className="text-xs font-bold text-[#52525B] sm:col-span-4">
                  Couleurs de la gamme
                </dt>
                <dd className="text-sm text-[#111113] sm:col-span-8">
                  {product.colors.map((c) => c.name).join(" · ")}
                </dd>
              </div>
            </dl>
          </div>

          {/* Récapitulatif de tous les prix selon état & stockage */}
          <div className="mt-8 overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white">
            <div className="border-b border-[#E4E4E7] bg-[#FAFAFB] px-6 py-4">
              <h3 className="text-sm font-bold text-[#111113]">
                Tous les tarifs disponibles pour {product.name}
              </h3>
            </div>
            <div className="divide-y divide-[#EFEFF2]">
              {product.variants.map((v) => (
                <div
                  key={v.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 text-xs"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 font-bold ${CONDITIONS_MAP[v.condition].badgeClass}`}
                    >
                      {v.conditionLabel}
                    </span>
                    <span className="font-bold text-[#111113]">
                      {v.storage !== "Standard" ? v.storage : ""}
                      {v.simType ? ` ${v.simType}` : ""}
                      {v.colorNote ? ` (${v.colorNote})` : ""}
                    </span>
                    <span className="text-[#71717A]">
                      — {v.availability === "in-stock" ? "En stock" : "Sur commande"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold tabular-nums text-[#111113]">
                      {priceLabel(v.price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCondition(v.condition);
                        setSelectedVariantId(v.id);
                        if (v.colorNote) setSelectedColor(v.colorNote);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="rounded-lg border border-[#E4E4E7] px-3 py-1.5 font-semibold text-[#0066CC] hover:border-[#0066CC] hover:bg-[#EFF6FF]"
                    >
                      Choisir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AVIS CLIENTS VÉRIFIÉS */}
      <section
        id="avis"
        className="scroll-mt-24 border-t border-[#E4E4E7] bg-white"
      >
        <div className="mx-auto max-w-[1380px] px-4 py-16 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0066CC]">
                Avis Vérifiés
              </p>
              <h2 className="mt-1 text-2xl font-extrabold text-[#111113]">
                Retours de nos clients
              </h2>

              <div className="mt-5 flex items-end gap-3">
                <span className="text-5xl font-extrabold leading-none tabular-nums text-[#111113]">
                  {ratingAvg.toFixed(1)}
                </span>
                <div className="pb-1">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.round(ratingAvg)
                            ? "fill-[#F59E0B] text-[#F59E0B]"
                            : "text-[#E4E4E7]"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-[#52525B]">
                    Sur {reviewCount} avis client{reviewCount > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-1.5">
                {([5, 4, 3, 2, 1] as const).map((star) => {
                  const cnt = breakdown[star] ?? 0;
                  const pct =
                    reviewCount > 0 ? Math.round((cnt / reviewCount) * 100) : 0;
                  return (
                    <div
                      key={star}
                      className="flex items-center gap-2.5 text-xs tabular-nums"
                    >
                      <span className="w-7 font-semibold text-[#111113]">
                        {star} ★
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F5F5F7]">
                        <div
                          className="h-full rounded-full bg-[#F59E0B]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-[#71717A]">
                        {cnt}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setReviewFormOpen((v) => !v)}
                data-testid="write-review-toggle"
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#111113] px-5 py-2.5 text-xs font-bold text-[#111113] transition hover:bg-[#111113] hover:text-white"
              >
                <PenLine className="h-3.5 w-3.5" />
                {reviewFormOpen ? "Annuler" : "Laisser un avis"}
              </button>
            </div>

            <div className="lg:col-span-8">
              {reviewFormOpen && (
                <form
                  onSubmit={handleSubmitReview}
                  data-testid="review-form"
                  className="mb-8 rounded-2xl border border-[#E4E4E7] bg-[#F5F5F7] p-6"
                >
                  <h3 className="text-base font-bold text-[#111113]">
                    Donnez votre avis sur {product.name}
                  </h3>
                  <div className="mt-4 flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFormRating(num)}
                        aria-label={`${num} étoiles`}
                      >
                        <Star
                          className={`h-6 w-6 ${
                            num <= formRating
                              ? "fill-[#F59E0B] text-[#F59E0B]"
                              : "text-[#D4D4D8]"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      required
                      value={formAuthor}
                      onChange={(e) => setFormAuthor(e.target.value)}
                      placeholder="Votre nom et prénom *"
                      className="rounded-xl border border-[#E4E4E7] bg-white px-4 py-2.5 text-sm focus:border-[#111113] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      placeholder="Commune / Ville (ex : Cocody, Bouaké)"
                      className="rounded-xl border border-[#E4E4E7] bg-white px-4 py-2.5 text-sm focus:border-[#111113] focus:outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Titre de votre avis *"
                    className="mt-3 w-full rounded-xl border border-[#E4E4E7] bg-white px-4 py-2.5 text-sm focus:border-[#111113] focus:outline-none"
                  />
                  <textarea
                    rows={3}
                    required
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    placeholder="Partagez votre expérience (état du téléphone, batterie, livraison) *"
                    className="mt-3 w-full rounded-xl border border-[#E4E4E7] bg-white px-4 py-2.5 text-sm focus:border-[#111113] focus:outline-none"
                  />
                  {formError && (
                    <p className="mt-2 text-xs text-red-600">{formError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="mt-4 rounded-xl bg-[#111113] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#0066CC] disabled:opacity-50"
                  >
                    {submittingReview ? "Publication..." : "Publier mon avis"}
                  </button>
                </form>
              )}

              <div className="divide-y divide-[#E4E4E7]">
                {reviewsList.map((rev) => {
                  const voted = votedIds.includes(rev.id);
                  return (
                    <article key={rev.id} className="py-6 first:pt-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < rev.rating
                                  ? "fill-[#F59E0B] text-[#F59E0B]"
                                  : "text-[#E4E4E7]"
                              }`}
                            />
                          ))}
                        </div>
                        <time className="text-xs text-[#71717A]">
                          {formatReviewDate(rev.createdAt)}
                        </time>
                      </div>
                      <h3 className="mt-2 text-sm font-bold text-[#111113]">
                        {rev.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-[#52525B]">
                        {rev.body}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2 text-[#52525B]">
                          <strong className="text-[#111113]">
                            {rev.authorName}
                          </strong>
                          <span>· {rev.authorLocation}</span>
                          {rev.variantLabel && (
                            <span className="rounded bg-[#F5F5F7] px-2 py-0.5 text-[11px] font-medium">
                              {rev.variantLabel}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleMarkHelpful(rev.id)}
                          disabled={voted}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                            voted
                              ? "border-[#0066CC]/30 bg-[#EFF6FF] text-[#0066CC]"
                              : "border-[#E4E4E7] text-[#52525B] hover:border-[#111113]"
                          }`}
                        >
                          <ThumbsUp className="h-3 w-3" />
                          Utile ({rev.helpfulCount})
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUITS SIMILAIRES DE LA GAMME */}
      {product.relatedProducts.length > 0 && (
        <section className="border-t border-[#E4E4E7] bg-[#F5F5F7]">
          <div className="mx-auto max-w-[1380px] px-4 py-16 sm:px-8 lg:px-12">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0066CC]">
                  Dans la même gamme
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-[#111113]">
                  Modèles similaires
                </h2>
              </div>
              <Link
                href="/#catalogue"
                className="text-xs font-bold text-[#0066CC] hover:underline"
              >
                Tout le catalogue →
              </Link>
            </div>
            <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {product.relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* VISIONNEUSE PLEIN ÉCRAN */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo agrandie"
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Fermer"
            className="absolute top-5 right-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex max-w-4xl flex-col items-center">
            <img
              src={activePhoto.url}
              alt={activePhoto.alt}
              referrerPolicy="no-referrer"
              className="max-h-[78vh] w-auto rounded-2xl object-contain"
            />
            <p className="mt-4 text-center text-xs text-white/80">
              {activePhoto.caption}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
