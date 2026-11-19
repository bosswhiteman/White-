import React from "react";
import {
  BatteryCharging,
  Camera,
  Cpu,
  Fingerprint,
  MessageCircle,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Truck,
  Wifi,
} from "lucide-react";
import { Reveal } from "./Reveal";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { buildGeneralWhatsAppUrl, WHATSAPP_DISPLAY } from "@/lib/whatsapp";

const CHECKS = [
  { icon: ScanLine, t: "IMEI & numéro de série", d: "Origine vérifiée, appareil non signalé" },
  { icon: Fingerprint, t: "Face ID / Touch ID", d: "Déverrouillage biométrique testé" },
  { icon: BatteryCharging, t: "Santé de la batterie", d: "Pourcentage annoncé avant l'achat" },
  { icon: Smartphone, t: "Écran & True Tone", d: "Affichage, tactile et True Tone d'origine" },
  { icon: Camera, t: "Caméras", d: "Objectifs avant et arrière, stabilisation" },
  { icon: Wifi, t: "Réseau & SIM", d: "Orange, MTN, Moov, Wi‑Fi, Bluetooth" },
  { icon: Cpu, t: "Pièces d'origine", d: "Aucun message « pièce inconnue »" },
  { icon: ShieldCheck, t: "Compte iCloud libre", d: "Appareil désassocié, prêt à l'emploi" },
];

const STEPS = [
  { n: "01", t: "Vous choisissez", d: "Modèle, état et stockage sur le site, ou conseil direct sur WhatsApp." },
  { n: "02", t: "Messi vous conseille", d: "Couleur disponible, photo réelle et prix confirmés en quelques minutes." },
  { n: "03", t: "Vous vérifiez", d: "À la livraison ou au showroom, vous testez l'appareil avant de payer." },
  { n: "04", t: "Vous repartez serein", d: "Reçu et garantie Messi Store, suivi après‑vente sur WhatsApp." },
];

export function SpecialistSection({ aboutText, experienceYears }: { aboutText: string; experienceYears: number }) {
  return (
    <section id="messi" className="scroll-mt-24 bg-[#0B0B0D] text-white">
      <div className="mx-auto max-w-[1380px] px-4 py-14 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#60A5FA]">Pourquoi acheter chez Messi</p>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-[-0.02em] sm:text-4xl">
              Un spécialiste,
              <br />
              <span className="text-[#FDE68A]">pas un revendeur de passage.</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/75">{aboutText}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              {experienceYears > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-2xl font-extrabold text-white">{experienceYears} ans</p>
                  <p className="text-[11px] text-white/60">d&apos;expérience iPhone</p>
                </div>
              )}
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-2xl font-extrabold text-white">100 %</p>
                <p className="text-[11px] text-white/60">iPhone &amp; Apple</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-2xl font-extrabold text-white">8 points</p>
                <p className="text-[11px] text-white/60">contrôlés sur chaque iPhone</p>
              </div>
            </div>

            <a
              href={buildGeneralWhatsAppUrl("Bonjour Messi, j'aimerais un conseil pour choisir mon iPhone.")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#15803D] px-5 py-3 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#166534]"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Demander conseil à Messi · {WHATSAPP_DISPLAY}
            </a>
          </Reveal>

          <div className="lg:col-span-7">
            <Reveal>
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <ShieldCheck className="h-4 w-4 text-[#4ADE80]" />
                Le protocole de contrôle Messi
              </h3>
            </Reveal>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CHECKS.map((c, i) => (
                <Reveal key={c.t} delay={i * 60}>
                  <div className="flex h-full items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/25 hover:bg-white/[0.07]">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0066CC]/20 text-[#93C5FD]">
                      <c.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{c.t}</p>
                      <p className="text-xs text-white/60">{c.d}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 90}>
              <div className="relative h-full rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-transparent p-5">
                <span className="text-3xl font-extrabold text-white/15">{s.n}</span>
                <p className="mt-1 text-sm font-bold">{s.t}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/65">{s.d}</p>
                {i === 0 && <MessageCircle className="absolute top-5 right-5 h-4 w-4 text-white/30" />}
                {i === 2 && <Truck className="absolute top-5 right-5 h-4 w-4 text-white/30" />}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
