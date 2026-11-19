"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ExternalLink, LayoutDashboard, LogOut, Menu, MessageSquare, Package, Settings, ShoppingCart, X } from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/produits", label: "Produits & prix", icon: Package },
  { href: "/admin/commandes", label: "Commandes", icon: ShoppingCart },
  { href: "/admin/avis", label: "Avis clients", icon: MessageSquare },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  };

  const nav = (
    <nav className="flex flex-col gap-1">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              active ? "bg-white text-[#111113]" : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <l.icon className="h-4 w-4" />
            {l.label}
          </Link>
        );
      })}
      <div className="my-3 border-t border-white/10" />
      <Link href="/" target="_blank" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white/70 hover:text-white">
        <ExternalLink className="h-4 w-4" />
        Voir la boutique
      </Link>
      <button type="button" onClick={() => void logout()} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-white/70 hover:text-white">
        <LogOut className="h-4 w-4" />
        Déconnexion
      </button>
    </nav>
  );

  return (
    <>
      <div className="flex items-center justify-between bg-[#111113] px-4 py-3 text-white lg:hidden">
        <span className="text-sm font-extrabold">Messi Store · Admin</span>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && <div className="bg-[#111113] px-3 pb-4 lg:hidden">{nav}</div>}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-[#111113] p-4 lg:flex">
        <div className="mb-6 flex items-center gap-2.5 px-2 pt-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-bold text-[#111113]">MS</span>
          <div className="leading-tight">
            <p className="text-sm font-extrabold text-white">Messi Store</p>
            <p className="text-[10px] text-white/50">Administration</p>
          </div>
        </div>
        {nav}
      </aside>
    </>
  );
}
