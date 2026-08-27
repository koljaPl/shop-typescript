// Gemeinsame TypeScript-Typen für das Frontend
export type Role = 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  _count?: { orders: number };
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string | number;
  stock: number;
  imageUrl?: string | null;
  isActive: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string | number;
  product?: Product;
}

export interface Order {
  id: string;
  totalAmount: string | number;
  status: string;
  items: OrderItem[];
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
