export type Category = {
  id: string;
  name: string;
  sort_order: number;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  price_lkr: number;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export type OrderType = "dine_in" | "takeaway" | "delivery" | "scheduled";
export type PaymentMethod = "cash" | "card" | "credit";

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderRow = {
  id: string;
  /** Sequential public order number (starts at 1000). */
  order_number: number | null;
  customer_id: string | null;
  order_type: OrderType;
  scheduled_for: string | null;
  status: string;
  payment_method: PaymentMethod;
  subtotal_lkr: number;
  total_lkr: number;
  notes: string | null;
  created_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price_lkr: number;
  quantity: number;
};
