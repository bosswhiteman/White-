"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Connexion refusée.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  const field = "w-full rounded-xl border border-[#E4E4E7] bg-[#F5F5F7] py-3 pr-3 pl-9 text-sm focus:border-[#111113] focus:bg-white focus:outline-none";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111113] px-4">
      <div aria-hidden="true" className="pointer-events-none fixed -top-24 -right-24 h-80 w-80 rounded-full bg-[#0066CC]/30 blur-3xl" />
      <form onSubmit={submit} className="animate-fade-up relative w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111113] text-xs font-bold text-white">MS</span>
          <div>
            <h1 className="text-base font-extrabold text-[#111113]">Messi Store · Administration</h1>
            <p className="text-[11px] text-[#71717A]">Gestion de la boutique iPhone &amp; Apple</p>
          </div>
        </div>

        <label htmlFor="admin-email" className="mt-6 block text-xs font-semibold text-[#52525B]">Adresse e-mail</label>
        <div className="relative mt-1.5">
          <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#71717A]" />
          <input id="admin-email" type="email" autoComplete="username" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} className={field} placeholder="votre@email.com" />
        </div>

        <label htmlFor="admin-password" className="mt-4 block text-xs font-semibold text-[#52525B]">Mot de passe</label>
        <div className="relative mt-1.5">
          <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#71717A]" />
          <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
        </div>

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        <button type="submit" disabled={loading || !email || !password} className="mt-5 w-full rounded-xl bg-[#111113] py-3 text-sm font-bold text-white transition hover:bg-[#0066CC] disabled:opacity-50">
          {loading ? "Connexion…" : "Se connecter"}
        </button>
        <p className="mt-4 text-center text-[11px] text-[#A1A1AA]">Session sécurisée · 7 jours</p>
      </form>
    </div>
  );
}
