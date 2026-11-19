import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FileCheck2,
  RefreshCw,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import type { ProductCondition, ProductType } from "@/db/schema";
import {
  getCollectionsWithCounts,
  getFeaturedReviews,
  getFilteredProducts,
  getOfficialPriceSheet,
  getSettings,
} from "@/lib/store";
import { SpecialistSection } from "@/components/SpecialistSection";
import { CONDITIONS_MAP, formatPrice } from "@/lib/format";
import { buildGeneralWhatsAppUrl, buildTradeInWhatsAppUrl, WHATSAPP_DISPLAY } from "@/lib/whatsapp";
import { CatalogSection } from "@/components/CatalogSection";
import { PriceSheetSection } from "@/components/PriceSheetSection";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { Reveal } from "@/components/Reveal";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{ collection?: string; type?: string; condition?: string }>;
}

const VALID_TYPES = new Set(["all", "iphone", "apple-equipment", "apple-accessory"]);
const VALID_CONDITIONS = new Set(["all", "nouveau", "neuf-scelle", "quasi-neuf", "seconde-main"]);

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const initialCollection = params.collection?.trim() || "all";
  const initialType: ProductType | "all" =
    params.type && VALID_TYPES.has(params.type)
      ? (params.type as ProductType | "all")
      : initialCollection !== "all"
        ? "all"
        : "iphone";
  const isAccessoryView = initialType === "apple-accessory" || initialType === "apple-equipment" || initialCollection === "equipements-accessoires";
  const initialCondition: ProductCondition | "all" =
    params.condition && VALID_CONDITIONS.has(params.condition)
      ? (params.condition as ProductCondition | "all")
      : isAccessoryView || initialCollection !== "all"
        ? "all"
        : "quasi-neuf";

  const [collections, catalogData, priceSheet, featuredReviews, storeSettings] = await Promise.all([
    getCollectionsWithCounts(),
    getFilteredProducts({
      collection: initialCollection === "all" ? undefined : initialCollection,
      productType: initialType,
      condition: initialCondition,
      sort: "featured",
    }),
    getOfficialPriceSheet(),
    getFeaturedReviews(3),
    getSettings(),
  ]);
  const heroOffer =
    priceSheet.quasiNeuf.find((r) => r.productSlug === "iphone-14-pro-max" && r.availability === "in-stock") ??
    priceSheet.quasiNeuf.find((r) => r.availability === "in-stock");

  const ticker = priceSheet.quasiNeuf.filter((r) => r.availability === "in-stock");
  const tickerItems = ticker.length > 0 ? [...ticker, ...ticker] : [];
  const cheapest = [...priceSheet.quasiNeuf].sort((a, b) => a.price - b.price)[0];

  return (
    <div>
      {/* BANDEAU D'ACCUEIL COMPACT */}
      <section className="relative overflow-hidden bg-[#111113] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#0066CC]/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-10 h-64 w-64 rounded-full bg-[#F59E0B]/15 blur-3xl" />

        <div className="relative mx-auto grid max-w-[1380px] grid-cols-1 items-center gap-6 px-4 py-8 sm:px-8 lg:grid-cols-12 lg:px-12 lg:py-10">
          <div className="lg:col-span-7">
            <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-semibold text-white/90">
              <span className="animate-soft-pulse h-2 w-2 rounded-full bg-[#4ADE80]" />
              Messi · Spécialiste iPhone &amp; Apple à Abidjan{storeSettings.experienceYears > 0 ? ` · ${storeSettings.experienceYears} ans d'expérience` : ""}
            </div>
            <h1 className="animate-fade-up mt-3 text-[28px] leading-[1.1] font-extrabold tracking-[-0.03em] sm:text-4xl lg:text-[44px]">
              L&apos;expert iPhone qui vous dit <span className="text-shimmer">toute la vérité</span>
              <br className="hidden sm:block" /> sur chaque appareil.
            </h1>
            <p className="animate-fade-up mt-3 max-w-xl text-sm leading-relaxed text-white/75">
              100 % iPhone et Apple : Quasi Neufs Grade A+, Non activés et accessoires d&apos;origine{cheapest ? `, dès ${formatPrice(cheapest.price)}` : ""}. Chaque téléphone est contrôlé par Messi (IMEI, Face ID, batterie) et testé devant vous avant paiement.
            </p>
            <div className="animate-fade-up mt-5 flex flex-wrap gap-2.5">
              <a href="#catalogue" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-bold text-[#111113] transition hover:-translate-y-0.5 hover:bg-[#0066CC] hover:text-white">
                Voir les Quasi Neufs
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href={buildGeneralWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#15803D] px-5 py-3 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#166534]">
                <WhatsAppIcon className="h-4 w-4" />
                {WHATSAPP_DISPLAY}
              </a>
              <a href="#tarifs" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-xs font-semibold text-white transition hover:border-white/60">
                Grille des prix
              </a>
            </div>
          </div>

          <div className="hidden lg:col-span-5 lg:block">
            <div className="relative">
              <Link href={`/products/${heroOffer?.productSlug ?? "iphone-14-pro-max"}`} className="animate-float group block overflow-hidden rounded-2xl ring-1 ring-white/10">
                <img
                  src="https://images.pexels.com/photos/16004744/pexels-photo-16004744.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                  alt="iPhone 14 Pro Max Quasi Neuf chez Messi Store"
                  referrerPolicy="no-referrer"
                  className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <div className="absolute inset-x-4 bottom-3 flex items-end justify-between">
                  <div>
                    <span className="rounded bg-[#F59E0B] px-2 py-0.5 text-[10px] font-bold uppercase text-[#111113]">Quasi Neuf A+</span>
                    <p className="mt-1 text-sm font-bold">{heroOffer ? `${heroOffer.productName} ${heroOffer.storage}` : "iPhone 14 Pro Max"}</p>
                  </div>
                  {heroOffer && <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-extrabold text-[#111113]">{formatPrice(heroOffer.price)}</span>}
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Défilement animé des prix Quasi Neufs en stock */}
        {tickerItems.length > 0 && (
          <div className="relative border-t border-white/10 bg-black/30 py-2.5">
            <div className="flex w-max animate-marquee gap-8 whitespace-nowrap">
              {tickerItems.map((r, i) => (
                <Link key={`${r.variantId}-${i}`} href={`/products/${r.productSlug}`} className="inline-flex items-center gap-2 text-xs text-white/80 hover:text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80]" />
                  <span className="font-semibold">{r.productName}</span>
                  <span className="text-white/50">{r.storage}</span>
                  <span className="font-bold tabular-nums text-[#FDE68A]">{formatPrice(r.price)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* CATALOGUE : iPHONE QUASI NEUFS PAR DÉFAUT */}
      <CatalogSection
        initialProducts={catalogData.products}
        availableStorages={catalogData.availableStorages}
        initialCollection={initialCollection}
        initialType={initialType}
        initialCondition={initialCondition}
      />

      <SpecialistSection aboutText={storeSettings.aboutText} experienceYears={storeSettings.experienceYears} />

      {/* CONFIANCE */}
      <section className="border-y border-[#E4E4E7] bg-white">
        <div className="mx-auto grid max-w-[1380px] grid-cols-2 gap-4 px-4 py-6 sm:px-8 lg:grid-cols-4 lg:px-12">
          {[
            { icon: BadgeCheck, t: "Originalité vérifiable", d: "Contrôle IMEI & numéro de série", c: "bg-[#EFF6FF] text-[#0066CC]" },
            { icon: FileCheck2, t: "Reçu & garantie", d: "Remis à chaque achat", c: "bg-[#ECFDF5] text-[#15803D]" },
            { icon: Truck, t: "Livraison", d: "Abidjan & intérieur du pays", c: "bg-[#F5F5F7] text-[#111113]" },
            { icon: ShieldCheck, t: "Paiement après vérification", d: "Espèces, Wave, Orange, MTN", c: "bg-[#FFFBEB] text-[#B45309]" },
          ].map((x, i) => (
            <Reveal key={x.t} delay={i * 80}>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${x.c}`}>
                  <x.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#111113]">{x.t}</p>
                  <p className="text-[11px] text-[#52525B]">{x.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* RAYONS */}
      <section className="mx-auto max-w-[1380px] px-4 py-12 sm:px-8 lg:px-12">
        <Reveal>
          <h2 className="text-xl font-extrabold tracking-[-0.02em] text-[#111113] sm:text-2xl">Parcourir par rayon</h2>
        </Reveal>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {collections.map((col, i) => (
            <Reveal key={col.id} delay={i * 90}>
              <Link href={`/?collection=${col.slug}#catalogue`} className="group block overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="aspect-[16/10] overflow-hidden bg-[#F5F5F7]">
                  <img src={col.heroImage} alt={col.name} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-3.5">
                  <h3 className="text-sm font-bold text-[#111113] group-hover:text-[#0066CC]">{col.name}</h3>
                  <p className="mt-0.5 text-[11px] text-[#52525B]">{col.subtitle}</p>
                  <p className="mt-2 text-[11px] font-semibold text-[#71717A]">{col.productCount} références</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <PriceSheetSection quasiNeuf={priceSheet.quasiNeuf} nonActive={priceSheet.nonActive} neufScelle={priceSheet.neufScelle} />

      {/* ÉTATS & TROC */}
      <section id="garanties" className="scroll-mt-24 border-t border-[#E4E4E7] bg-[#F5F5F7]">
        <div className="mx-auto max-w-[1380px] px-4 py-14 sm:px-8 lg:px-12">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0066CC]">Transparence</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.02em] text-[#111113]">Nos 4 états, expliqués clairement</h2>
            <p className="mt-2 max-w-2xl text-sm text-[#52525B]">Avant tout paiement, vous testez librement le réseau, les caméras, le Face ID, le True Tone et l&apos;état de la batterie.</p>
          </Reveal>
          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(["quasi-neuf", "nouveau", "neuf-scelle", "seconde-main"] as ProductCondition[]).map((cid, i) => {
              const info = CONDITIONS_MAP[cid];
              return (
                <Reveal key={cid} delay={i * 90}>
                  <div className="h-full rounded-2xl border border-[#E4E4E7] bg-white p-5 transition hover:shadow-md">
                    <span className={`inline-block rounded-full border px-3 py-1 text-[11px] font-bold ${info.badgeClass}`}>{info.label}</span>
                    <p className="mt-3 text-xs leading-relaxed text-[#52525B]">{info.description}</p>
                    <div className="mt-4 space-y-1.5 border-t border-[#F1F1F4] pt-3 text-xs">
                      <p className="flex items-center gap-1.5 font-semibold text-[#111113]"><CheckCircle2 className="h-3.5 w-3.5 text-[#15803D]" />{info.batteryNote}</p>
                      <p className="flex items-center gap-1.5 text-[#52525B]"><ShieldCheck className="h-3.5 w-3.5 text-[#0066CC]" />{info.warranty}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal>
            <div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-2xl bg-[#111113] p-6 text-white sm:p-8 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4ADE80]"><RefreshCw className="h-3.5 w-3.5" />Troc & négociation</div>
                <h3 className="mt-2 text-xl font-extrabold">Échangez votre ancien iPhone ou discutez du prix</h3>
                <p className="mt-2 text-sm text-white/75">Envoyez le modèle, la capacité et le pourcentage de batterie de votre téléphone au {WHATSAPP_DISPLAY} : nous vous indiquons le complément à prévoir.</p>
              </div>
              <a href={buildTradeInWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#15803D] px-6 py-3.5 text-xs font-bold text-white hover:bg-[#166534]">
                <WhatsAppIcon className="h-4 w-4" />
                Proposer un troc
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* AVIS (uniquement les avis réels validés) + FAQ */}
      <section className="border-t border-[#E4E4E7] bg-white">
        <div className="mx-auto max-w-[1380px] px-4 py-14 sm:px-8 lg:px-12">
          {featuredReviews.length > 0 && (
            <div className="mb-14">
              <h2 className="text-2xl font-extrabold text-[#111113]">Avis de nos clients</h2>
              <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
                {featuredReviews.map((rev) => (
                  <article key={rev.id} className="rounded-2xl border border-[#E4E4E7] bg-[#FAFAFB] p-6">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < rev.rating ? "fill-[#F59E0B] text-[#F59E0B]" : "text-[#E4E4E7]"}`} />
                      ))}
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-[#111113]">« {rev.title} »</h3>
                    <p className="mt-2 text-sm text-[#52525B]">{rev.body}</p>
                    <p className="mt-4 text-xs font-bold text-[#111113]">{rev.authorName} <span className="font-normal text-[#71717A]">· {rev.authorLocation}</span></p>
                  </article>
                ))}
              </div>
            </div>
          )}

          <h2 className="text-xl font-extrabold text-[#111113]">Questions fréquentes</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              ["Que signifie « Quasi Neuf Grade A+ » ?", "Un iPhone à l'esthétique proche du neuf, sans pièce réparée ni remplacée. Il est testé devant vous (réseau, Face ID, True Tone, caméras) et l'état de la batterie vous est indiqué avant l'achat."],
              ["Comment choisir la couleur ?", `Sur chaque fiche, sélectionnez la couleur puis cliquez sur « Acheter — indiquer la couleur sur WhatsApp ». Nous vous confirmons les couleurs disponibles au ${WHATSAPP_DISPLAY} et pouvons envoyer une photo réelle.`],
              ["Pourquoi certains prix sont « sur demande » ?", "Les prix changent selon les arrivages. Plutôt que d'afficher un prix incertain, nous vous donnons le prix du jour sur WhatsApp en quelques minutes."],
              ["Que veut dire « Sur commande » ?", "Le modèle n'est pas en rayon à l'instant : nous pouvons vous le réserver lors du prochain arrivage ou vous proposer un équivalent disponible immédiatement."],
            ].map(([q, a]) => (
              <Reveal key={q}>
                <details className="group rounded-xl border border-[#E4E4E7] p-5 open:bg-[#FAFAFB]">
                  <summary className="cursor-pointer list-none text-sm font-bold text-[#111113]">
                    <span className="mr-2 inline-block transition-transform group-open:rotate-90">›</span>
                    {q}
                  </summary>
                  <p className="mt-2 text-xs leading-relaxed text-[#52525B]">{a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
