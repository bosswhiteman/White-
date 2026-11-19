import React from "react";
import { buildGeneralWhatsAppUrl, WHATSAPP_DISPLAY } from "@/lib/whatsapp";

export function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12.031 2C6.51 2 2.023 6.485 2.021 12.006a9.95 9.95 0 0 0 1.335 4.996L2 22l5.134-1.347a9.99 9.99 0 0 0 4.892 1.275h.004c5.52 0 10.008-4.486 10.01-10.007A9.946 9.946 0 0 0 19.11 4.93 9.945 9.945 0 0 0 12.031 2Zm5.822 14.122c-.246.693-1.43 1.326-1.996 1.41-.51.076-1.156.108-1.865-.117a17.02 17.02 0 0 1-1.693-.626c-2.98-1.287-4.927-4.287-5.076-4.486-.148-.199-1.213-1.614-1.213-3.079 0-1.465.768-2.185 1.04-2.483.273-.298.595-.373.793-.373.198 0 .396.002.57.01.183.01.428-.069.669.511.248.596.842 2.06.916 2.209.075.149.124.323.025.521-.099.199-.149.323-.297.497-.149.174-.313.388-.446.521-.149.149-.304.31-.13.608.173.298.77 1.27 1.653 2.058 1.135 1.012 2.092 1.326 2.39 1.475.297.149.47.124.644-.075.173-.198.743-.868.941-1.166.198-.298.396-.248.669-.149.272.1 1.734.818 2.031.967.298.149.496.223.57.347.074.124.074.719-.172 1.412Z" />
    </svg>
  );
}

export function WhatsAppFloat() {
  return (
    <a
      href={buildGeneralWhatsAppUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Contacter Messi Store sur WhatsApp au ${WHATSAPP_DISPLAY}`}
      data-testid="whatsapp-float"
      className="no-print fixed right-5 bottom-5 z-40 inline-flex items-center gap-2.5 rounded-full bg-[#15803D] px-4 py-3 text-white shadow-lg ring-1 ring-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#166534] hover:shadow-xl"
    >
      <WhatsAppIcon className="h-5 w-5 shrink-0" />
      <span className="hidden flex-col leading-tight sm:flex">
        <span className="text-[10px] font-medium text-white/85">
          WhatsApp Direct
        </span>
        <span className="text-xs font-bold tabular-nums tracking-wide">
          {WHATSAPP_DISPLAY}
        </span>
      </span>
    </a>
  );
}
