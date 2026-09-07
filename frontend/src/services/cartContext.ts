"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { getAllCarts } from "./cart.service";

type cartType = {
    count: number
}
type CartContextType = {
    cartCount: number;
    refreshCartCount: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [cartCount, setCartCount] = useState<number>(0);

    const fetchCartCount = useCallback(async () => {
        try {
            const res = await getAllCarts();
            if (!res) throw new Error("Failed to fetch cart");


            const count = Array.isArray(res) ? res.length : ((res as cartType).count || 0);
            setCartCount(count);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchCartCount();
    }, [fetchCartCount]);

    const value = useMemo(
        () => ({ cartCount, refreshCartCount: fetchCartCount }),
        [cartCount, fetchCartCount]
    );

    return React.createElement(CartContext.Provider, { value }, children);
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};