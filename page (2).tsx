import React from "react";
import Link from "next/link";
import { AlertTriangle, MessageSquare, Package, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import { db } from "@/db";
import { products, productVariants, reviews } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { getOrdersWithItems } from "@/lib/store";
import { formatPrice, ORDER_STATUSES } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [ordersList, prodCount, publishedCount, pendingReviews, variantRows] = await Promise.all([
    getOrdersWithItems(500),
    db.select({ v: count() }).from(products),
    db.select({ v: count() }).from(products).where(eq(products.published, true)),
    db.select({ v: count() }).from(reviews).where(eq(reviews.approved, false)),
    db.select().from(productVariants).where(eq(productVariants.archived, false)),
  ]);

  const active = ordersList.filter((o) => o.status !== "annulée");
  const revenue = ordersList.filter((o) => o.status === "livrée").reduce((s, o) => s + o.total, 0);
  const pipeline = active.filter((o) => o.status !== "livrée").reduce((s, o) => s + o.total, 0);
  const todayStr = new Date().toDateString();
  const today = ordersList.filter((o) => new Date(o.createdAt).toDateString() === todayStr).length;
  const onRequest = variantRows.filter((v) => v.price <= 0).length;
  const lowStock = variantRows.filter((v) => v.price > 0 && v.availability === "in-stock" && v.stockQty <= 1);
  const quasiPriced = variantRows.filter((v) => v.condition === "quasi-neuf" && v.price > 0).length;

  const cards = [
    { label: "Commandes aujourd'hui", value: String(today), icon: ShoppingCart, cls: "text-[#0066CC] bg-[#EFF6FF]" },
    { label: "En cours (non livrées)", value: formatPrice(pipeline), icon: TrendingUp, cls: "text-[#B45309] bg-[#FFFBEB]" },
    { label: "Chiffre d'affaires livré", value: formatPrice(revenue), icon: Wallet, cls: "text-[#047857] bg-[#ECFDF5]" },
    { label: "Produits publiés", value: `${publishedCount[0]?.v ?? 0} / ${prodCount[0]?.v ?? 0}`, icon: Package, cls: "text-[#111113] bg-white" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111113]">Tableau de bord</h1>
        <p className="text-sm text-[#52525B]">Vue d&apos;ensemble de Messi Store.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-[#E4E4E7] bg-white p-4">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.cls}`}>
              <c.icon className="h-4 w-4" />
            </div>
            <p className="mt-3 text-lg font-extrabold tabular-nums text-[#111113]">{c.value}</p>
            <p className="text-[11px] text-[#71717A]">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Link href="/admin/produits" className="rounded-2xl border border-[#E4E4E7] bg-white p-4 hover:border-[#111113]">
          <p className="text-sm font-bold text-[#111113]">{quasiPriced} prix Quasi Neuf actifs</p>
          <p className="mt-1 text-xs text-[#52525B]">{onRequest} variantes affichées « Prix sur demande » — à compléter si besoin.</p>
        </Link>
        <Link href="/admin/avis" className="flex items-start gap-3 rounded-2xl border border-[#E4E4E7] bg-white p-4 hover:border-[#111113]">
          <MessageSquare className="mt-0.5 h-4 w-4 text-[#0066CC]" />
          <div>
            <p className="text-sm font-bold text-[#111113]">{pendingReviews[0]?.v ?? 0} avis en attente</p>
            <p className="mt-1 text-xs text-[#52525B]">Validez les avis pour les publier sur les fiches.</p>
          </div>
        </Link>
        <div className="flex items-start gap-3 rounded-2xl border border-[#E4E4E7] bg-white p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-[#B45309]" />
          <div>
            <p className="text-sm font-bold text-[#111113]">{lowStock.length} variantes en stock faible (≤ 1)</p>
            <p className="mt-1 text-xs text-[#52525B]">Pensez à réapprovisionner ou passer en « Sur commande ».</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white">
        <div className="flex items-center justify-between border-b border-[#E4E4E7] px-5 py-3.5">
          <h2 className="text-sm font-bold text-[#111113]">Dernières commandes</h2>
          <Link href="/admin/commandes" className="text-xs font-semibold text-[#0066CC]">Tout voir →</Link>
        </div>
        {ordersList.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[#71717A]">Aucune commande pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <tbody className="divide-y divide-[#EFEFF2]">
                {ordersList.slice(0, 8).map((o) => {
                  const st = ORDER_STATUSES.find((s) => s.id === o.status);
                  return (
                    <tr key={o.id}>
                      <td className="px-5 py-3 font-bold">{o.orderNumber}</td>
                      <td className="px-3 py-3 text-xs">{o.fullName}<br /><span className="text-[#71717A]">{o.phone}</span></td>
                      <td className="px-3 py-3 text-xs text-[#52525B]">{o.items.map((i) => i.productName).join(", ")}</td>
                      <td className="px-3 py-3 text-right font-bold tabular-nums">{formatPrice(o.total)}</td>
                      <td className="px-5 py-3 text-right"><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st?.cls ?? ""}`}>{st?.label ?? o.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
