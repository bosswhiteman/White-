import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";
import { PublicChrome } from "@/components/PublicChrome";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Messi Store — iPhone Quasi Neufs, Non activés & Accessoires Apple à Abidjan",
  description:
    "Messi Store Abidjan : iPhone de la série X à la série 17 en Quasi Neuf Grade A+, Non activé, Neuf scellé et Seconde main, accessoires Apple d'origine. Commande et négociation sur WhatsApp au 05 45 63 79 22.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={jakarta.variable}>
      <body className="flex min-h-screen flex-col bg-white text-[#111113] antialiased">
        <CartProvider>
          <PublicChrome>{children}</PublicChrome>
        </CartProvider>
      </body>
    </html>
  );
}
