"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CartDrawer } from "./CartDrawer";
import { SearchOverlay } from "./SearchOverlay";
import { OrderLookupModal } from "./OrderLookupModal";
import { WhatsAppFloat } from "./WhatsAppIcon";

/** Affiche l'habillage boutique partout, sauf dans l'espace /admin. */
export function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <SearchOverlay />
      <OrderLookupModal />
      <WhatsAppFloat />
    </>
  );
}
