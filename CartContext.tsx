"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_STORE_SETTINGS,
  type CartDTO,
  type StoreSettings,
} from "@/lib/format";

const FREE_DELIVERY_THRESHOLD_FCFA = DEFAULT_STORE_SETTINGS.freeDeliveryThreshold;

const LOCAL_TOKEN_KEY = "messi_store_ci_cart_token";

const EMPTY_CART: CartDTO = {
  sessionToken: "",
  items: [],
  itemCount: 0,
  subtotal: 0,
  promoCode: null,
  promoLabel: null,
  discount: 0,
  total: 0,
  freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD_FCFA,
  remainingForFreeDelivery: FREE_DELIVERY_THRESHOLD_FCFA,
};

interface CartContextValue {
  cart: CartDTO;
  settings: StoreSettings;
  isHydrated: boolean;
  isMutating: boolean;
  isDrawerOpen: boolean;
  isSearchOpen: boolean;
  isOrderModalOpen: boolean;
  toastMessage: string | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  openOrderModal: () => void;
  closeOrderModal: () => void;
  showToast: (msg: string) => void;
  refreshCart: () => Promise<void>;
  addItem: (
    variantId: number,
    quantity?: number,
    options?: { openDrawer?: boolean; selectedColor?: string }
  ) => Promise<boolean>;
  updateItemQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  applyPromo: (code: string) => Promise<{ ok: boolean; error?: string }>;
  setCartDirect: (next: CartDTO) => void;
  getCartHeaders: () => Record<string, string>;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LOCAL_TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveStoredToken(token: string) {
  if (typeof window === "undefined" || !token) return;
  try {
    window.localStorage.setItem(LOCAL_TOKEN_KEY, token);
  } catch {
    // ignore storage errors
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartDTO>(EMPTY_CART);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.settings) setSettings(d.settings);
      })
      .catch(() => undefined);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(t);
  }, [toastMessage]);

  const getCartHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = cart.sessionToken || readStoredToken();
    if (token) {
      headers["x-cart-token"] = token;
    }
    return headers;
  }, [cart.sessionToken]);

  const setCartDirect = useCallback((next: CartDTO) => {
    setCart(next);
    if (next.sessionToken) {
      saveStoredToken(next.sessionToken);
    }
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      const stored = readStoredToken();
      if (stored) headers["x-cart-token"] = stored;
      const res = await fetch("/api/cart", {
        method: "GET",
        credentials: "same-origin",
        headers,
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.cart) {
          setCartDirect(data.cart);
        }
      }
    } catch (err) {
      console.error("Failed to load cart:", err);
    } finally {
      setIsHydrated(true);
    }
  }, [setCartDirect]);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const addItem = useCallback(
    async (
      variantId: number,
      quantity = 1,
      options: { openDrawer?: boolean; selectedColor?: string } = {
        openDrawer: true,
      }
    ): Promise<boolean> => {
      setIsMutating(true);
      try {
        const res = await fetch("/api/cart/items", {
          method: "POST",
          credentials: "same-origin",
          headers: getCartHeaders(),
          body: JSON.stringify({
            variantId,
            quantity,
            selectedColor:
              options.selectedColor || "À confirmer sur WhatsApp",
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error ?? "Impossible d'ajouter au panier.");
          return false;
        }
        if (data.cart) {
          setCartDirect(data.cart);
        }
        if (options.openDrawer !== false) {
          setIsDrawerOpen(true);
        } else {
          showToast("Article ajouté à votre panier");
        }
        return true;
      } catch {
        showToast("Erreur de connexion. Veuillez réessayer.");
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [getCartHeaders, setCartDirect, showToast]
  );

  const updateItemQuantity = useCallback(
    async (itemId: number, quantity: number) => {
      setIsMutating(true);
      try {
        const res = await fetch(`/api/cart/items/${itemId}`, {
          method: "PATCH",
          credentials: "same-origin",
          headers: getCartHeaders(),
          body: JSON.stringify({ quantity }),
        });
        const data = await res.json();
        if (res.ok && data.cart) {
          setCartDirect(data.cart);
        } else if (data.error) {
          showToast(data.error);
        }
      } catch {
        showToast("Impossible de modifier la quantité.");
      } finally {
        setIsMutating(false);
      }
    },
    [getCartHeaders, setCartDirect, showToast]
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      setIsMutating(true);
      try {
        const res = await fetch(`/api/cart/items/${itemId}`, {
          method: "DELETE",
          credentials: "same-origin",
          headers: getCartHeaders(),
        });
        const data = await res.json();
        if (res.ok && data.cart) {
          setCartDirect(data.cart);
        }
      } catch {
        showToast("Impossible de retirer l'article.");
      } finally {
        setIsMutating(false);
      }
    },
    [getCartHeaders, setCartDirect, showToast]
  );

  const applyPromo = useCallback(
    async (code: string): Promise<{ ok: boolean; error?: string }> => {
      setIsMutating(true);
      try {
        const res = await fetch("/api/cart/promo", {
          method: "POST",
          credentials: "same-origin",
          headers: getCartHeaders(),
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { ok: false, error: data.error ?? "Code invalide." };
        }
        if (data.cart) {
          setCartDirect(data.cart);
        }
        return { ok: true };
      } catch {
        return { ok: false, error: "Impossible de vérifier le code." };
      } finally {
        setIsMutating(false);
      }
    },
    [getCartHeaders, setCartDirect]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      settings,
      isHydrated,
      isMutating,
      isDrawerOpen,
      isSearchOpen,
      isOrderModalOpen,
      toastMessage,
      openDrawer: () => setIsDrawerOpen(true),
      closeDrawer: () => setIsDrawerOpen(false),
      openSearch: () => setIsSearchOpen(true),
      closeSearch: () => setIsSearchOpen(false),
      openOrderModal: () => setIsOrderModalOpen(true),
      closeOrderModal: () => setIsOrderModalOpen(false),
      showToast,
      refreshCart,
      addItem,
      updateItemQuantity,
      removeItem,
      applyPromo,
      setCartDirect,
      getCartHeaders,
    }),
    [
      cart,
      settings,
      isHydrated,
      isMutating,
      isDrawerOpen,
      isSearchOpen,
      isOrderModalOpen,
      toastMessage,
      showToast,
      refreshCart,
      addItem,
      updateItemQuantity,
      removeItem,
      applyPromo,
      setCartDirect,
      getCartHeaders,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 z-[80] -translate-x-1/2 animate-fade-up rounded-full bg-[#111113] px-5 py-2.5 text-xs font-medium text-white shadow-xl"
        >
          {toastMessage}
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return ctx;
}
