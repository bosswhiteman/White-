"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Search, Trash2 } from "lucide-react";
import { DELIVERY_METHOD_LABELS, formatPrice, ORDER_STATUSES, PAYMENT_METHOD_LABELS, type OrderDTO } from "@/lib/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

function clientWhatsApp(order: OrderDTO): string {
  let digits = order.phone.replace(/\D/g, "");
  if (digits.length === 10) digits = `225${digits}`;
  const msg = `Bonjour ${order.fullName}, Messi Store vous contacte au sujet de votre commande ${order.orderNumber} (${formatPrice(order.total)}).`;
  return buildWhatsAppUrl(msg).replace(/wa\.me\/\d+/, `wa.me/${digits}`);
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/orders", { cache: "no-store" });
    if (res.status === 401) return void (window.location.href = "/admin/login");
    setOrders((await res.json()).orders ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return orders.filter(
      (o) =>
        (status === "all" || o.status === status) &&
        (!term || `${o.orderNumber} ${o.fullName} ${o.phone} ${o.commune}`.toLowerCase().includes(term))
    );
  }, [orders, status, q]);

  const updateStatus = async (id: number, s: string) => {
    await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: s }) });
    void load();
  };

  const remove = async (id: number) => {
    if (!window.confirm("Supprimer définitivement cette commande ?")) return;
    await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
    void load();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111113]">Commandes</h1>
        <p className="text-sm text-[#52525B]">Suivez et mettez à jour chaque bon de commande.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#71717A]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="N° de commande, nom, téléphone…" className="w-full rounded-xl border border-[#E4E4E7] bg-white py-2 pr-3 pl-8 text-xs" />
        </div>
        <button type="button" onClick={() => setStatus("all")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${status === "all" ? "bg-[#111113] text-white" : "bg-white"}`}>Toutes ({orders.length})</button>
        {ORDER_STATUSES.map((s) => (
          <button key={s.id} type="button" onClick={() => setStatus(s.id)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${status === s.id ? "bg-[#111113] text-white" : "bg-white"}`}>
            {s.label} ({orders.filter((o) => o.status === s.id).length})
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {loading && <p className="text-sm text-[#71717A]">Chargement…</p>}
        {!loading && filtered.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-sm text-[#71717A]">Aucune commande.</p>}
        {filtered.map((o) => {
          const st = ORDER_STATUSES.find((s) => s.id === o.status);
          const isOpen = open === o.id;
          return (
            <div key={o.id} className="rounded-2xl border border-[#E4E4E7] bg-white">
              <button type="button" onClick={() => setOpen(isOpen ? null : o.id)} className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left">
                <span className="font-bold text-[#111113]">{o.orderNumber}</span>
                <span className="text-xs text-[#52525B]">{new Date(o.createdAt).toLocaleString("fr-FR")}</span>
                <span className="text-xs font-semibold">{o.fullName} · {o.phone}</span>
                <span className="ml-auto font-extrabold tabular-nums">{formatPrice(o.total)}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st?.cls ?? ""}`}>{st?.label ?? o.status}</span>
                <ChevronDown className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="animate-fade-in grid grid-cols-1 gap-4 border-t border-[#F1F1F4] p-4 text-xs lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <ul className="divide-y divide-[#F1F1F4]">
                      {o.items.map((i) => (
                        <li key={i.id} className="flex justify-between gap-3 py-2">
                          <span><strong>{i.quantity}× {i.productName}</strong><br /><span className="text-[#52525B]">{i.variantLabel} · Couleur : {i.selectedColor}</span></span>
                          <span className="font-bold tabular-nums">{formatPrice(i.lineTotal)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[#52525B]">Sous-total {formatPrice(o.subtotal)} · Remise {formatPrice(o.discount)} · Livraison {formatPrice(o.shippingFee)}</p>
                    {o.customerNote && <p className="mt-2 rounded-lg bg-[#FFFBEB] p-2 text-[#92400E]">Note client : {o.customerNote}</p>}
                  </div>
                  <div className="space-y-2">
                    <p><strong>Livraison :</strong> {DELIVERY_METHOD_LABELS[o.deliveryMethod] ?? o.deliveryMethod}<br />{o.city} — {o.commune}<br />{o.addressDetails}</p>
                    <p><strong>Paiement :</strong> {PAYMENT_METHOD_LABELS[o.paymentMethod] ?? o.paymentMethod}</p>
                    <label className="block font-semibold">Statut</label>
                    <select value={o.status} onChange={(e) => void updateStatus(o.id, e.target.value)} className="w-full rounded-lg border border-[#E4E4E7] px-2 py-2">
                      {ORDER_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                    <div className="flex gap-2 pt-1">
                      <a href={clientWhatsApp(o)} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#15803D] px-3 py-2 font-bold text-white"><WhatsAppIcon className="h-3.5 w-3.5" />Contacter le client</a>
                      <a href={`/orders/${o.orderNumber}`} target="_blank" className="rounded-lg border border-[#E4E4E7] px-3 py-2 font-semibold">Reçu</a>
                      <button type="button" onClick={() => void remove(o.id)} className="rounded-lg border border-[#FECACA] px-2.5 text-[#B91C1C]" aria-label="Supprimer"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
