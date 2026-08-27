// Zustand-Store: Kombiniert Authentifizierung und Warenkorb in einer einzigen, sauberen Datei
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Product, CartItem } from '../types';
import { api } from './api';

// --- AUTH STORE ---
interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get<{ data: { user: User } }>('/auth/me');
      set({ user: res.data.user, isLoading: false });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, isLoading: false });
    }
  },
  login: async (email, password) => {
    const res = await api.post<{ data: { user: User; token: string } }>('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    set({ user: res.data.user });
  },
  register: async (name, email, password) => {
    const res = await api.post<{ data: { user: User; token: string } }>('/auth/register', { name, email, password });
    localStorage.setItem('token', res.data.token);
    set({ user: res.data.user });
  },
  logout: async () => {
    try { await api.post('/auth/logout', {}); } catch {}
    localStorage.removeItem('token');
    set({ user: null });
  },
}));

// --- WARENKORB STORE (Mit localStorage-Persistenz & Hydration-Schutz) ---
interface CartState {
  items: CartItem[];
  isHydrated: boolean;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setHydrated: (v: boolean) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isHydrated: false,
      addItem: (product, quantity = 1) => {
        const items = get().items;
        const exist = items.find((i) => i.product.id === product.id);
        const newQty = exist ? exist.quantity + quantity : quantity;
        const validQty = Math.min(newQty, product.stock); // Nie mehr als verfügbar
        if (exist) {
          set({ items: items.map((i) => i.product.id === product.id ? { ...i, quantity: validQty } : i) });
        } else {
          set({ items: [...items, { product, quantity: validQty }] });
        }
      },
      updateQuantity: (id, qty) => {
        if (qty <= 0) return get().removeItem(id);
        const item = get().items.find((i) => i.product.id === id);
        const validQty = item ? Math.min(qty, item.product.stock) : qty;
        set({ items: get().items.map((i) => i.product.id === id ? { ...i, quantity: validQty } : i) });
      },
      removeItem: (id) => set({ items: get().items.filter((i) => i.product.id !== id) }),
      clearCart: () => set({ items: [] }),
      setHydrated: (v) => set({ isHydrated: v }),
      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getTotalPrice: () => get().items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0),
    }),
    {
      name: 'techshop-warenkorb',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    }
  )
);
