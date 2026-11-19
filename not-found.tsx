import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-xs font-bold uppercase tracking-wider text-[#0066CC]">
        Page introuvable · Messi Store
      </p>
      <h1 className="mt-2 text-3xl font-extrabold text-[#111113] sm:text-4xl">
        Cette page n&apos;existe plus
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-[#52525B]">
        Consultez notre catalogue complet d&apos;iPhone (série X à série 17), de smartphones Samsung et d&apos;accessoires originaux.
      </p>
      <Link
        href="/#catalogue"
        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#111113] px-6 py-3.5 text-xs font-bold text-white transition hover:bg-[#0066CC]"
      >
        Retourner au catalogue
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
