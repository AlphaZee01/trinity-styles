export type UserRole = "customer" | "admin";

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type TryOnStatus = "pending" | "processing" | "completed" | "failed";

export type ShippingAddress = {
  full_name: string;
  phone: string;
  momo_phone?: string;
  city: string;
  region: string;
  address_line: string;
  notes?: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  shipping_address: ShippingAddress | null;
  created_at: string;
};

export type ProductGender = "women" | "men" | "unisex";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  category: string;
  gender: ProductGender;
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
  price_override: number | null;
};

export type ProductWithVariants = Product & {
  product_variants: ProductVariant[];
};

export type CartItem = {
  variantId: string;
  productId: string;
  name: string;
  slug: string;
  image: string | null;
  size: string;
  color: string;
  unitPrice: number;
  compareAt?: number | null;
  quantity: number;
};

export type TryOnSession = {
  id: string;
  user_id: string | null;
  product_id: string;
  person_image_url: string | null;
  result_image_url: string | null;
  status: TryOnStatus;
  runpod_job_id: string | null;
  runpod_cost_usd?: number | null;
  runpod_endpoint_mode?: "qwen_image_edit" | "seedream_v4_edit" | null;
  selected_garment_image_url: string | null;
  created_at: string;
};
