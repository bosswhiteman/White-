import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { ProductDetailClient } from "@/components/ProductDetailClient";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: "Produit introuvable — Messi Store Abidjan" };
  }
  return {
    title: `${product.name} — Dès ${formatPrice(product.minPrice)} | Fiche Technique | Messi Store`,
    description: `${product.name} chez Messi Store Abidjan : ${product.tagline} Disponible en Neuf Scellé, Non Activé, Quasi Neuf A+ et Seconde Main. WhatsApp 05 45 63 79 22.`,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
