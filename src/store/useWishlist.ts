import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistItem {
    id: string;
    name: string;
    price: number;
    image?: string;
}

interface WishlistState {
    items: WishlistItem[];
    addItem: (item: WishlistItem) => void;
    removeItem: (id: string) => void;
    isInWishlist: (id: string) => boolean;
    clearWishlist: () => void;
}

export const useWishlist = create<WishlistState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (item) => {
                const { items } = get();
                if (!items.find((i) => i.id === item.id)) {
                    set({ items: [...items, item] });
                }
            },
            removeItem: (id) => {
                set({ items: get().items.filter((i) => i.id !== id) });
            },
            isInWishlist: (id) => {
                return !!get().items.find((i) => i.id === id);
            },
            clearWishlist: () => set({ items: [] }),
        }),
        {
            name: "wishlist-storage",
        }
    )
);
