"use client";

import React, { useEffect, useState } from "react";
import { Download, Save } from "lucide-react";
import type { StoreSettings } from "@/lib/format";

export default function AdminSettingsPage() {
  const [s, setS] = useState<StoreSettings | null>(null);
  const [subs, setSubs] = useState<Array<{ id: number; contact: string; createdAt: string }>>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      if (res.status === 401) return void (window.location.href = "/admin/login");
      const data = await res.json();
      setS(data.settings);
      setSubs(data.subscribers ?? []);
    })();
  }, []);

  if (!s) return <p className="text-sm text-[#71717A]">Chargement…</p>;

  const save = async () => {
    const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    const data = await res.json();
    setMsg(res.ok ? { ok: true, text: "Paramètres enregistrés." } : { ok: false, text: data.error ?? "Erreur" });
  };

  const exportCsv = () => {
    const csv = ["contact;date", ...subs.map((x) => `${x.contact};${new Date(x.createdAt).toLocaleString("fr-FR")}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "abonnes-messi-store.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const field = "w-full rounded-lg border border-[#E4E4E7] px-3 py-2 text-sm focus:border-[#0066CC] focus:outline-none";
  const lab = "mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#71717A]";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111113]">Paramètres de la boutique</h1>
        <p className="text-sm text-[#52525B]">Bandeau d&apos;annonce, frais de livraison, adresse et horaires.</p>
      </div>
      {msg && <div className={`rounded-xl px-4 py-2.5 text-sm ${msg.ok ? "bg-[#ECFDF5] text-[#047857]" : "bg-[#FEF2F2] text-[#B91C1C]"}`}>{msg.text}</div>}

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-[#E4E4E7] bg-white p-5 md:grid-cols-2">
        <div className="md:col-span-2"><label className={lab}>Bandeau d&apos;annonce (haut du site)</label><input className={field} value={s.announcement} onChange={(e) => setS({ ...s, announcement: e.target.value })} /></div>
        <div><label className={lab}>Livraison Abidjan (FCFA)</label><input className={field} inputMode="numeric" value={s.deliveryAbidjan} onChange={(e) => setS({ ...s, deliveryAbidjan: Number(e.target.value.replace(/\D/g, "") || 0) })} /></div>
        <div><label className={lab}>Expédition intérieur (FCFA)</label><input className={field} inputMode="numeric" value={s.deliveryInterieur} onChange={(e) => setS({ ...s, deliveryInterieur: Number(e.target.value.replace(/\D/g, "") || 0) })} /></div>
        <div><label className={lab}>Livraison Abidjan offerte dès (FCFA, 0 = jamais)</label><input className={field} inputMode="numeric" value={s.freeDeliveryThreshold} onChange={(e) => setS({ ...s, freeDeliveryThreshold: Number(e.target.value.replace(/\D/g, "") || 0) })} /></div>
        <div><label className={lab}>Adresse du showroom</label><input className={field} value={s.showroomAddress} onChange={(e) => setS({ ...s, showroomAddress: e.target.value })} /></div>
        <div className="md:col-span-2"><label className={lab}>Horaires d&apos;ouverture</label><input className={field} value={s.openingHours} onChange={(e) => setS({ ...s, openingHours: e.target.value })} /></div>
        <div className="md:col-span-2 flex justify-end">
          <button type="button" onClick={() => void save()} className="inline-flex items-center gap-2 rounded-xl bg-[#0066CC] px-5 py-2.5 text-sm font-bold text-white"><Save className="h-4 w-4" />Enregistrer</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-[#E4E4E7] bg-white p-5 md:grid-cols-2">
        <h2 className="text-sm font-bold md:col-span-2">Profil du vendeur (affiché sur l&apos;accueil)</h2>
        <div><label className={lab}>Années d&apos;expérience (0 = ne pas afficher)</label><input className={field} inputMode="numeric" value={s.experienceYears} onChange={(e) => setS({ ...s, experienceYears: Number(e.target.value.replace(/\D/g, "") || 0) })} /></div>
        <div className="md:col-span-2"><label className={lab}>Présentation de Messi</label><textarea rows={4} className={field} value={s.aboutText} onChange={(e) => setS({ ...s, aboutText: e.target.value })} /></div>
        <div className="flex justify-end md:col-span-2">
          <button type="button" onClick={() => void save()} className="inline-flex items-center gap-2 rounded-xl bg-[#0066CC] px-5 py-2.5 text-sm font-bold text-white"><Save className="h-4 w-4" />Enregistrer le profil</button>
        </div>
      </div>

      <AccountSecurity />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E4E4E7] bg-white p-5">
        <div>
          <h2 className="text-sm font-bold">Paquet de déploiement Netlify</h2>
          <p className="text-xs text-[#52525B]">Code complet de la boutique + guide DEPLOIEMENT-NETLIFY.md.</p>
        </div>
        <a href="/api/admin/export" className="inline-flex items-center gap-1.5 rounded-xl bg-[#111113] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0066CC]">
          <Download className="h-3.5 w-3.5" />
          Télécharger le .zip
        </a>
      </div>

      <div className="rounded-2xl border border-[#E4E4E7] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">Abonnés aux alertes arrivages ({subs.length})</h2>
          <button type="button" onClick={exportCsv} disabled={subs.length === 0} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E4E7] px-3 py-1.5 text-xs font-semibold disabled:opacity-40"><Download className="h-3.5 w-3.5" />Exporter CSV</button>
        </div>
        <ul className="mt-3 max-h-72 divide-y divide-[#F1F1F4] overflow-y-auto text-sm">
          {subs.map((x) => (
            <li key={x.id} className="flex justify-between py-2"><span>{x.contact}</span><span className="text-xs text-[#71717A]">{new Date(x.createdAt).toLocaleDateString("fr-FR")}</span></li>
          ))}
          {subs.length === 0 && <li className="py-4 text-center text-[#71717A]">Aucun abonné pour le moment.</li>}
        </ul>
      </div>

    </div>
  );
}

function AccountSecurity() {
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/account", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setEmail(d.email ?? ""))
      .catch(() => undefined);
  }, []);

  const submit = async () => {
    setMsg(null);
    if (next && next !== confirm) return setMsg({ ok: false, text: "La confirmation ne correspond pas." });
    const res = await fetch("/api/admin/account", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next, newEmail }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg({ ok: false, text: data.error ?? "Erreur" });
    setEmail(data.email);
    setCurrent("");
    setNext("");
    setConfirm("");
    setNewEmail("");
    setMsg({ ok: true, text: "Identifiants mis à jour." });
  };

  const f = "w-full rounded-lg border border-[#E4E4E7] px-3 py-2 text-sm focus:border-[#0066CC] focus:outline-none";
  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[#E4E4E7] bg-white p-5 md:grid-cols-2">
      <div className="md:col-span-2">
        <h2 className="text-sm font-bold">Compte administrateur</h2>
        <p className="text-xs text-[#52525B]">Connecté avec : <strong>{email}</strong></p>
      </div>
      <input className={f} type="email" placeholder="Nouvel e-mail (optionnel)" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
      <input className={f} type="password" placeholder="Mot de passe actuel *" value={current} onChange={(e) => setCurrent(e.target.value)} />
      <input className={f} type="password" placeholder="Nouveau mot de passe (8 caractères min.)" value={next} onChange={(e) => setNext(e.target.value)} />
      <input className={f} type="password" placeholder="Confirmer le nouveau mot de passe" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      <div className="flex items-center justify-end gap-3 md:col-span-2">
        {msg && <span className={`text-xs ${msg.ok ? "text-[#047857]" : "text-[#B91C1C]"}`}>{msg.text}</span>}
        <button type="button" disabled={!current} onClick={() => void submit()} className="rounded-xl bg-[#111113] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">Mettre à jour</button>
      </div>
    </div>
  );
}
