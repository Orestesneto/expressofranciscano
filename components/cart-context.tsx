'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface CartItem {
  productId: number;
  nome: string;
  preco: number;
  quantidade: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantidade: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = 'ecri_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored) as CartItem[]);
      } catch {
        setItems([]);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  const addItem = useCallback((item: CartItem) => {
    setItems((current) => {
      const existing = current.find((x) => x.productId === item.productId);
      if (existing) {
        return current.map((x) =>
          x.productId === item.productId ? { ...x, quantidade: x.quantidade + item.quantidade } : x,
        );
      }
      return [...current, item];
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: number, quantidade: number) => {
    setItems((current) =>
      current
        .map((item) => (item.productId === productId ? { ...item, quantidade } : item))
        .filter((item) => item.quantidade > 0),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const total = useMemo(() => items.reduce((sum, item) => sum + item.preco * item.quantidade, 0), [items]);
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantidade, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
