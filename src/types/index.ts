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
  stock_quantity?: number | null;
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

export type PaymentStatus =
  | "pending"
  | "paid"
  | "payment_failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export interface OrderItemRecord {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  order_number: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  address: string;
  city: string | null;
  zip: string | null;
  notes: string | null;
  items: OrderItemRecord[];
  total: number;
  shipping_region: string;
  shipping_cost: number;
  status: string;
  payment_status: PaymentStatus;
  payment_provider: string | null;
  payment_terminal: string | null;
  payment_env: string | null;
  currency: string | null;
  tranzila_transaction_id: string | null;
  tranzila_confirmation_code: string | null;
  payment_method_brand: string | null;
  card_last4: string | null;
  installments: number | null;
  refunded_amount: number;
  idempotency_key: string | null;
  payment_attempts: number;
  last_payment_error: string | null;
  paid_at: string | null;
  created_at: string;
}
