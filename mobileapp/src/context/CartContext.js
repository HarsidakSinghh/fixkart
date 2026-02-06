import React, { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addItem = (product) => {
    const incomingMax = typeof product.quantity === 'number' ? product.quantity : Infinity;
    let blocked = false;
    setItems((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (existing) {
        const maxQty = typeof existing.maxQty === 'number' ? existing.maxQty : incomingMax;
        if (existing.qty >= maxQty) {
          blocked = true;
          return prev;
        }
        return prev.map((p) =>
          p.id === product.id
            ? { ...p, qty: Math.min(p.qty + 1, maxQty), maxQty }
            : p
        );
      }
      if (incomingMax <= 0) {
        blocked = true;
        return prev;
      }
      return [
        ...prev,
        { ...product, qty: Math.min(1, incomingMax), maxQty: incomingMax === Infinity ? null : incomingMax },
      ];
    });
    return { added: !blocked, maxQty: incomingMax === Infinity ? null : incomingMax };
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const updateQty = (id, qty) => {
    let blocked = false;
    setItems((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const maxQty =
          typeof p.maxQty === 'number'
            ? p.maxQty
            : typeof p.quantity === 'number'
            ? p.quantity
            : Infinity;
        const next = Math.max(1, Math.min(qty, maxQty));
        if (qty > maxQty) {
          blocked = true;
        }
        return { ...p, qty: next };
      })
    );
    return { updated: !blocked };
  };

  const clearCart = () => setItems([]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    return { subtotal, count: items.reduce((sum, item) => sum + item.qty, 0) };
  }, [items]);

  const value = { items, addItem, removeItem, updateQty, clearCart, totals };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
