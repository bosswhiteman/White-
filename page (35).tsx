import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Check,
  MapPin,
  Package,
  Truck,
  Wallet,
} from "lucide-react";
import { getOrderByNumber } from "@/lib/store";
import {
  DELIVERY_METHOD_LABELS,
  formatPrice,
  formatReviewDate,
  PAYMENT_METHOD_LABELS,
} from "@/lib/format";
import {
  buildOrderConfirmationWhatsAppUrl,
  WHATSAPP_DISPLAY,
} from "@/lib/whatsapp";
import { PrintReceiptButton } from "@/components/PrintReceiptButton";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

export const dynamic = "force-dynamic";

interface OrderPageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function OrderConfirmationPage({ params }: OrderPageProps) {
  const { orderNumber } = await params;
  const order = await getOrderByNumber(orderNumber);

  if (!order) {
    notFound();
  }

  const deliveryLabel =
    DELIVERY_METHOD_LABELS[order.deliveryMethod] ?? order.deliveryMethod;
  const paymentLabel =
    PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod;

  const waOrderUrl = buildOrderConfirmationWhatsAppUrl({
    orderNumber: order.orderNumber,
    fullName: order.fullName,
    phone: order.phone,
    city: order.city,
    commune: order.commune,
    addressDetails: order.addressDetails,
    deliveryMethodLabel: deliveryLabel,
    paymentMethodLabel: paymentLabel,
    total: order.total,
    items: order.items,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-8 lg:py-16">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ECFDF5] text-[#15803D]">
          <Check className="h-7 w-7" strokeWidth={2.3} />
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-wider text-[#15803D]">
          Bon de commande enregistré
        </p>
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-[-0.02em] text-[#111113] sm:text-4xl">
          Merci, {order.fullName} !
        </h1>
        <p className="mx-auto mt-2.5 max-w-xl text-sm leading-relaxed text-[#52525B]">
          Votre commande{" "}
          <strong
            data-testid="order-number"
            className="font-bold tracking-wider text-[#111113]"
          >
            {order.orderNumber}
          </strong>{" "}
          est bien enregistrée chez <strong>Messi Store</strong>. Cliquez sur le bouton WhatsApp ci-dessous pour confirmer instantanément votre couleur et l&apos;heure de livraison au{" "}
          <strong className="text-[#111113]">{WHATSAPP_DISPLAY}</strong>.
        </p>

        {/* Action prioritaire : transmettre le bon sur WhatsApp 0545637922 */}
        <div className="no-print mt-6 flex justify-center">
          <a
            href={waOrderUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="order-whatsapp-confirm"
            className="inline-flex items-center gap-2.5 rounded-xl bg-[#15803D] px-6 py-4 text-sm font-bold text-white shadow-md transition hover:bg-[#166534]"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Envoyer ma commande &amp; couleur sur WhatsApp ({WHATSAPP_DISPLAY})
          </a>
        </div>
      </div>

      {/* Détail des articles */}
      <div className="mt-9 overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4E4E7] bg-[#F5F5F7] px-6 py-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#111113]">
            <Package className="h-4 w-4 text-[#0066CC]" />
            Reçu Messi Store — {order.orderNumber}
          </h2>
          <span className="text-xs text-[#52525B]">
            {formatReviewDate(order.createdAt)}
          </span>
        </div>

        <ul className="divide-y divide-[#EFEFF2] px-6">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-4">
              <Link
                href={`/products/${item.productSlug}`}
                className="block h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-[#F5F5F7]"
              >
                <img
                  src={item.imageUrl}
                  alt={item.productName}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover object-center"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${item.productSlug}`}
                  className="text-sm font-bold text-[#111113] hover:text-[#0066CC]"
                >
                  {item.productName}
                </Link>
                <p className="text-xs text-[#52525B]">
                  {item.variantLabel} · Qté : {item.quantity}
                </p>
                <p className="text-xs font-medium text-[#0066CC]">
                  Couleur : {item.selectedColor}
                </p>
              </div>
              <div className="text-right tabular-nums">
                <p className="text-sm font-extrabold text-[#111113]">
                  {formatPrice(item.lineTotal)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="border-t border-[#E4E4E7] bg-[#FAFAFB] px-6 py-5">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between text-[#52525B]">
              <dt>Sous-total</dt>
              <dd className="font-semibold tabular-nums text-[#111113]">
                {formatPrice(order.subtotal)}
              </dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-[#0066CC]">
                <dt>Remise ({order.promoCode})</dt>
                <dd className="font-semibold tabular-nums">
                  −{formatPrice(order.discount)}
                </dd>
              </div>
            )}
            <div className="flex justify-between text-[#52525B]">
              <dt>Livraison</dt>
              <dd className="font-semibold tabular-nums text-[#15803D]">
                {order.shippingFee === 0
                  ? "Gratuite"
                  : formatPrice(order.shippingFee)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-[#E4E4E7] pt-3 text-base font-extrabold text-[#111113]">
              <dt>Total</dt>
              <dd className="text-xl tabular-nums">
                {formatPrice(order.total)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Infos client, livraison & paiement */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E4E4E7] p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-[#71717A]">
            <MapPin className="h-3.5 w-3.5" />
            Client &amp; Lieu
          </p>
          <p className="mt-2 text-xs font-bold text-[#111113]">
            {order.fullName}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[#52525B]">
            {order.city} — {order.commune}
            <br />
            {order.addressDetails}
            <br />
            Tél : {order.phone}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E4E4E7] p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-[#71717A]">
            <Truck className="h-3.5 w-3.5" />
            Réception
          </p>
          <p className="mt-2 text-xs font-bold text-[#111113]">
            {deliveryLabel}
          </p>
          {order.customerNote && (
            <p className="mt-1.5 text-xs text-[#52525B]">
              Note : {order.customerNote}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-[#E4E4E7] p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-[#71717A]">
            <Wallet className="h-3.5 w-3.5" />
            Règlement
          </p>
          <p className="mt-2 text-xs font-bold text-[#111113]">
            {paymentLabel}
          </p>
          <p className="mt-1 text-xs text-[#52525B]">
            Reçu cacheté &amp; garantie Messi Store remis à la livraison.
          </p>
        </div>
      </div>

      <div className="no-print mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[#111113] px-6 py-3 text-xs font-bold text-white hover:bg-[#0066CC]"
        >
          Retour à la boutique
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <PrintReceiptButton />
      </div>
    </div>
  );
}
