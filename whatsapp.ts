export const WHATSAPP_LOCAL_NUMBER = "0545637922";
export const WHATSAPP_DISPLAY = "05 45 63 79 22";
export const WHATSAPP_INTL_DISPLAY = "+225 05 45 63 79 22";
export const WHATSAPP_E164 = "2250545637922";

export function buildWhatsAppUrl(message: string): string {
  const encoded = encodeURIComponent(message.trim());
  return `https://wa.me/${WHATSAPP_E164}?text=${encoded}`;
}

export function formatFcfaPlain(amount: number): string {
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${formatted} FCFA`;
}

export interface WhatsAppProductContext {
  productName: string;
  brand: string;
  conditionLabel: string;
  storage: string;
  simType?: string | null;
  price: number;
  selectedColor?: string;
  availability?: "in-stock" | "on-order";
}

function describeConfig(ctx: WhatsAppProductContext): string {
  const parts = [
    ctx.productName,
    `État : ${ctx.conditionLabel}`,
    ctx.storage !== "Standard" ? `Stockage : ${ctx.storage}` : null,
    ctx.simType ? `Version : ${ctx.simType}` : null,
    `Prix affiché : ${formatFcfaPlain(ctx.price)}`,
  ].filter(Boolean);
  return parts.join("\n• ");
}

/** 1. Acheter (indiquer la couleur par WhatsApp) */
export function buildBuyWithColorWhatsAppUrl(
  ctx: WhatsAppProductContext,
  customColorNote?: string
): string {
  const chosenColor =
    customColorNote?.trim() ||
    ctx.selectedColor?.trim() ||
    "À choisir parmi les couleurs disponibles";

  const statusLine =
    ctx.availability === "on-order"
      ? "\n(Je vois qu'il est actuellement sur commande, merci de me préciser le délai.)"
      : "";

  const msg = `Bonjour Messi Store,\nJe souhaite ACHETER cet article :\n• ${describeConfig(
    ctx
  )}\n• Couleur souhaitée : ${chosenColor}${statusLine}\n\nMerci de me confirmer la disponibilité de cette couleur et les modalités de livraison.`;
  return buildWhatsAppUrl(msg);
}

/** 2. Négocier sur WhatsApp */
export function buildNegotiateWhatsAppUrl(
  ctx: WhatsAppProductContext,
  proposedPrice?: number | null,
  customNote?: string
): string {
  const offerLine =
    proposedPrice && proposedPrice > 0
      ? `\n• Ma proposition de budget : ${formatFcfaPlain(proposedPrice)}`
      : "";
  const colorLine = ctx.selectedColor
    ? `\n• Couleur préférée : ${ctx.selectedColor}`
    : "";
  const noteLine = customNote?.trim() ? `\n• Note : ${customNote.trim()}` : "";

  const msg = `Bonjour Messi Store,\nJe suis vivement intéressé(e) par cet article et j'aimerais NÉGOCIER le prix avec vous :\n• ${describeConfig(
    ctx
  )}${colorLine}${offerLine}${noteLine}\n\nQuel est votre meilleur dernier prix s'il vous plaît ?`;
  return buildWhatsAppUrl(msg);
}

/** 3. Demander plus d'informations */
export function buildAskInfoWhatsAppUrl(ctx: WhatsAppProductContext): string {
  const colorLine = ctx.selectedColor
    ? `\n• Couleur recherchée : ${ctx.selectedColor}`
    : "";
  const msg = `Bonjour Messi Store,\nJ'aimerais avoir PLUS D'INFORMATIONS sur cet article :\n• ${describeConfig(
    ctx
  )}${colorLine}\n\nPouvez-vous me confirmer les couleurs réellement en stock, m'envoyer une photo/vidéo réelle et me préciser la garantie ? Merci.`;
  return buildWhatsAppUrl(msg);
}

/** 4. Commander directement sur WhatsApp */
export function buildDirectOrderWhatsAppUrl(
  ctx: WhatsAppProductContext,
  colorChoice?: string
): string {
  const color = colorChoice?.trim() || ctx.selectedColor || "À confirmer";
  const msg = `Bonjour Messi Store,\nJe souhaite PASSER COMMANDE maintenant :\n• ${describeConfig(
    ctx
  )}\n• Couleur : ${color}\n\nJe suis prêt(e) à vous communiquer mon lieu de livraison et mon mode de paiement.`;
  return buildWhatsAppUrl(msg);
}

/** 5. Envoyer tout le panier sur WhatsApp */
export function buildCartWhatsAppUrl(
  items: Array<{
    name: string;
    conditionLabel: string;
    storage: string;
    selectedColor: string;
    quantity: number;
    lineTotal: number;
  }>,
  total: number
): string {
  const lines = items
    .map(
      (it, idx) =>
        `${idx + 1}. ${it.name} (${it.conditionLabel}, ${it.storage}) — Couleur : ${it.selectedColor} × ${it.quantity} = ${formatFcfaPlain(it.lineTotal)}`
    )
    .join("\n");

  const msg = `Bonjour Messi Store,\nJe souhaite finaliser ma commande (et confirmer les couleurs) :\n\n${lines}\n\nTotal : ${formatFcfaPlain(
    total
  )}\n\nMerci de me confirmer la disponibilité pour la livraison.`;
  return buildWhatsAppUrl(msg);
}

/** 6. Envoyer le récapitulatif d'une commande enregistrée sur WhatsApp */
export function buildOrderConfirmationWhatsAppUrl(order: {
  orderNumber: string;
  fullName: string;
  phone: string;
  city: string;
  commune: string;
  addressDetails: string;
  deliveryMethodLabel: string;
  paymentMethodLabel: string;
  total: number;
  items: Array<{
    productName: string;
    variantLabel: string;
    selectedColor: string;
    quantity: number;
    lineTotal: number;
  }>;
}): string {
  const itemsText = order.items
    .map(
      (i) =>
        `• ${i.quantity}× ${i.productName} (${i.variantLabel}) — Couleur : ${i.selectedColor} [${formatFcfaPlain(i.lineTotal)}]`
    )
    .join("\n");

  const msg = `Bonjour Messi Store,\nJe viens de valider la commande N° ${order.orderNumber} sur le site :\n\n${itemsText}\n\nTotal : ${formatFcfaPlain(
    order.total
  )}\nClient : ${order.fullName} (${order.phone})\nLieu : ${order.city} — ${order.commune} (${order.addressDetails})\nLivraison : ${order.deliveryMethodLabel}\nPaiement : ${order.paymentMethodLabel}\n\nMerci de me confirmer la couleur et l'heure de livraison.`;
  return buildWhatsAppUrl(msg);
}

/** 7. Troc / Reprise iPhone */
export function buildTradeInWhatsAppUrl(): string {
  return buildWhatsAppUrl(
    "Bonjour Messi Store,\nJ'aimerais faire un TROC / ÉCHANGE pour passer sur un nouveau téléphone.\n• Mon appareil actuel (modèle, stockage, état batterie) : \n• Le modèle que je souhaite prendre chez vous : \n\nMerci de me dire combien je dois ajouter."
  );
}

/** 8. Contact général service client */
export function buildGeneralWhatsAppUrl(customMsg?: string): string {
  return buildWhatsAppUrl(
    customMsg ||
      "Bonjour Messi Store, je visite votre boutique en ligne et j'aimerais être conseillé(e) pour l'achat d'un téléphone ou accessoire."
  );
}
