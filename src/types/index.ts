export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  long_description?: string;
  price: number;
  compare_price?: number;
  images: string[];
  category: string;
  flavor?: string;
  weight?: string;
  servings?: number;
  serving_size?: string;
  in_stock: boolean;
  featured: boolean;
  badge?: string;
  tags?: string[];
  nutrition_facts?: Record<string, string>;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type ShippingRegion = "north" | "center" | "south" | "pickup";

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  shippingRegion: ShippingRegion;
  addItem: (product: Product, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setShippingRegion: (region: ShippingRegion) => void;
}

export interface ContactForm {
  name: string;
  email: string;
  phone?: string;
  message: string;
}
