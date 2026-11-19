"use client";

import React from "react";
import { Printer } from "lucide-react";

export function PrintReceiptButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center justify-center gap-2 rounded-xl border border-[#E4E4E7] bg-white px-5 py-3 text-xs font-bold text-[#111113] transition hover:border-[#111113]"
    >
      <Printer className="h-4 w-4" />
      Imprimer le reçu
    </button>
  );
}
