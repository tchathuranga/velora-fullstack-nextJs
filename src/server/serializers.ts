import type {
  Address,
  BankDetails,
  Banner,
  Buyer,
  Category,
  Conversation,
  Feedback,
  Message,
  Order,
  OrderItem,
  PaymentMethod,
  Product,
  ProductVariations,
  SellerStatus,
  SellerTransaction,
  SpecEntry,
  Store,
} from "@/types";

const EMPTY_BANK: BankDetails = { name: "", accountNumber: "", bankName: "", branch: "", contactNumber: "" };

const iso = (d: Date | string) => (d instanceof Date ? d.toISOString() : d);

// ───────────────────────── Stores ─────────────────────────
export interface StoreRow {
  id: string;
  slug: string;
  store_name: string;
  business_name: string;
  full_name: string;
  address: string;
  telephone: string;
  email: string;
  about_store: string;
  status: SellerStatus;
  bank_details: BankDetails;
  bank_details_optional: BankDetails | null;
  cover_color: string;
  profile_color: string;
  created_at: Date;
  active_listings: number;
  unsold_listings: number;
  orders: number;
  order_amount: number;
}

/** Select list shared by every store query; stats are computed live from products / order_items. */
export const STORE_SELECT = `
  s.id, s.slug, s.store_name, s.business_name, s.full_name, s.address, s.telephone, s.email, s.about_store,
  s.status, s.bank_details, s.bank_details_optional, s.cover_color, s.profile_color, s.created_at,
  (SELECT count(*) FROM products p WHERE p.store_id = s.id AND p.quantity > 0) AS active_listings,
  (SELECT count(*) FROM products p WHERE p.store_id = s.id AND p.quantity = 0) AS unsold_listings,
  (SELECT count(DISTINCT oi.order_id) FROM order_items oi WHERE oi.store_id = s.id) AS orders,
  (SELECT COALESCE(sum(oi.price * oi.quantity), 0) FROM order_items oi WHERE oi.store_id = s.id) AS order_amount`;

/**
 * `includePrivate` is for the store's owner and admins. Public responses keep the `Store` shape but blank
 * out contact / address / bank details so they never reach other visitors' browsers.
 */
export function toStore(row: StoreRow, includePrivate: boolean): Store {
  return {
    id: row.id,
    slug: row.slug,
    storeName: row.store_name,
    businessName: row.business_name,
    aboutStore: row.about_store,
    createdAt: iso(row.created_at),
    status: row.status,
    coverColor: row.cover_color,
    profileColor: row.profile_color,
    stats: {
      activeListings: row.active_listings,
      orders: row.orders,
      unsoldListings: row.unsold_listings,
      orderAmount: row.order_amount,
    },
    fullName: includePrivate ? row.full_name : "",
    address: includePrivate ? row.address : "",
    telephone: includePrivate ? row.telephone : "",
    email: includePrivate ? row.email : "",
    bankDetails: includePrivate ? row.bank_details : EMPTY_BANK,
    ...(includePrivate && row.bank_details_optional ? { bankDetailsOptional: row.bank_details_optional } : {}),
  };
}

// ───────────────────────── Categories / banners ─────────────────────────
export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  subcategories: { id: string; name: string; slug: string }[];
}

export const CATEGORY_SELECT = `
  c.id, c.name, c.slug,
  COALESCE((SELECT json_agg(json_build_object('id', sc.id, 'name', sc.name, 'slug', sc.slug) ORDER BY sc.position, sc.name)
              FROM subcategories sc WHERE sc.category_id = c.id), '[]'::json) AS subcategories`;

export const toCategory = (row: CategoryRow): Category => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  subcategories: row.subcategories,
});

export interface BannerRow {
  id: string;
  title: string;
  subtitle: string;
  image_url: string | null;
}

export const toBanner = (row: BannerRow): Banner => ({
  id: row.id,
  title: row.title,
  subtitle: row.subtitle,
  ...(row.image_url ? { imageUrl: row.image_url } : {}),
});

// ───────────────────────── Products ─────────────────────────
export interface ProductRow {
  id: string;
  slug: string;
  store_id: string;
  category_id: string | null;
  subcategory_id: string | null;
  title: string;
  price: number;
  quantity: number;
  brand: string | null;
  size: string | null;
  color: string | null;
  package_include: string | null;
  custom_specs: SpecEntry[];
  description: string;
  handling_time: string;
  delivery_time: string;
  delivery_fee: number;
  free_delivery: boolean;
  payment_methods: PaymentMethod[];
  location: string;
  icon: string;
  images: string[];
  image_count: number;
  tags: string[];
  variations: ProductVariations | null;
  created_at: Date;
  rating: number;
  review_count: number;
  sold_30d: number;
}

/**
 * Only products from approved stores are public. `images` is the full gallery when `full` is set,
 * otherwise just the cover photo (list responses stay small); `image_count` is always the real total.
 */
export function productSelect(full: boolean): string {
  return `
  p.id, p.slug, p.store_id, p.category_id, p.subcategory_id, p.title, p.price, p.quantity, p.brand, p.size, p.color,
  p.package_include, p.custom_specs, p.description, p.handling_time, p.delivery_time, p.delivery_fee, p.free_delivery,
  p.payment_methods, p.location, p.icon, p.tags, p.variations, p.created_at,
  ${full ? "p.images" : "CASE WHEN jsonb_array_length(p.images) > 0 THEN jsonb_build_array(p.images->0) ELSE '[]'::jsonb END AS images"},
  jsonb_array_length(p.images) AS image_count,
  COALESCE((SELECT round(avg(f.rating), 1) FROM feedback f WHERE f.product_id = p.id), 0) AS rating,
  (SELECT count(*) FROM feedback f WHERE f.product_id = p.id) AS review_count,
  COALESCE((SELECT sum(oi.quantity) FROM order_items oi JOIN orders o ON o.id = oi.order_id
             WHERE oi.product_id = p.id AND o.created_at > now() - interval '30 days'), 0) AS sold_30d`;
}

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export function toProduct(row: ProductRow): Product {
  const created = new Date(row.created_at);
  // "new" and "trending" are derived from listing age / recent sales; "deal" and "sale" are curated tags.
  const tags = new Set(row.tags.filter((t) => t !== "new" && t !== "trending"));
  if (Date.now() - created.getTime() < NEW_WINDOW_MS) tags.add("new");
  if (row.sold_30d > 0) tags.add("trending");

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    storeId: row.store_id,
    price: row.price,
    quantity: row.quantity,
    brand: row.brand ?? undefined,
    size: row.size ?? undefined,
    color: row.color ?? undefined,
    packageInclude: row.package_include ?? undefined,
    customSpecs: row.custom_specs,
    description: row.description,
    handlingTime: row.handling_time,
    deliveryTime: row.delivery_time,
    deliveryFee: row.free_delivery ? 0 : row.delivery_fee,
    freeDelivery: row.free_delivery,
    paymentMethods: row.payment_methods,
    location: row.location,
    categoryId: row.category_id ?? undefined,
    subcategoryId: row.subcategory_id ?? undefined,
    icon: row.icon,
    galleryCount: Math.max(row.image_count, 1),
    images: row.images.length ? row.images : undefined,
    tags: [...tags] as Product["tags"],
    rating: Number(row.rating),
    reviewCount: row.review_count,
    createdAt: iso(row.created_at),
    variations: row.variations ?? undefined,
  };
}

// ───────────────────────── Orders ─────────────────────────
export interface OrderRow {
  id: string;
  buyer_name: string;
  subtotal: number;
  delivery_cost: number;
  total: number;
  payment_method: PaymentMethod;
  billing: Address;
  order_note: string;
  save_address: boolean;
  status: Order["status"];
  tracking_steps: Order["trackingSteps"];
  created_at: Date;
  buyer_id: string | null;
}

export interface OrderItemRow {
  order_id: string;
  product_id: string | null;
  store_id: string;
  title: string;
  price: number;
  quantity: number;
  icon: string;
  variation: Record<string, string> | null;
  tracking_number: string | null;
}

export function toOrder(row: OrderRow, items: OrderItemRow[]): Order {
  return {
    id: row.id,
    buyerName: row.buyer_name,
    items: items.map(
      (i): OrderItem => ({
        productId: i.product_id ?? "",
        title: i.title,
        price: i.price,
        quantity: i.quantity,
        icon: i.icon,
        storeId: i.store_id,
        ...(i.variation ? { variation: i.variation } : {}),
        ...(i.tracking_number ? { trackingNumber: i.tracking_number } : {}),
      }),
    ),
    subtotal: row.subtotal,
    deliveryCost: row.delivery_cost,
    total: row.total,
    paymentMethod: row.payment_method,
    billing: row.billing,
    orderNote: row.order_note || undefined,
    saveAddress: row.save_address,
    status: row.status,
    createdAt: iso(row.created_at),
    trackingSteps: row.tracking_steps,
  };
}

// ───────────────────────── Misc ─────────────────────────
export interface BuyerRow {
  id: string;
  name: string;
  email: string;
  status: Buyer["status"];
  address: (Omit<Address, "email"> & { email: string | null }) | null;
}

export function toBuyer(row: BuyerRow): Buyer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    registered: true,
    status: row.status,
    savedAddress: Boolean(row.address),
    ...(row.address ? { address: { ...row.address, email: row.address.email ?? undefined } } : {}),
  };
}

export interface TransactionRow {
  id: string;
  store_id: string;
  product_title: string;
  payment_method: PaymentMethod;
  amount: number;
  confirmed: boolean;
  created_at: Date;
}

export const toTransaction = (row: TransactionRow): SellerTransaction => ({
  id: row.id,
  storeId: row.store_id,
  productTitle: row.product_title,
  paymentMethod: row.payment_method,
  amount: row.amount,
  confirmed: row.confirmed,
  createdAt: iso(row.created_at),
});

export interface FeedbackRow {
  id: string;
  product_id: string;
  buyer_name: string;
  rating: number;
  comment: string;
  created_at: Date;
}

export const toFeedback = (row: FeedbackRow): Feedback => ({
  id: row.id,
  productId: row.product_id,
  buyerName: row.buyer_name,
  rating: row.rating,
  comment: row.comment,
  createdAt: iso(row.created_at),
});

export interface ConversationRow {
  id: string;
  buyer_id: string;
  buyer_name: string;
  store_id: string;
  store_name: string;
  messages: { id: string; sender: "buyer" | "seller"; text: string; timestamp: string }[];
}

export const CONVERSATION_SELECT = `
  c.id, c.buyer_id, u.name AS buyer_name, c.store_id, s.store_name,
  COALESCE((SELECT json_agg(json_build_object('id', m.id, 'sender', m.sender, 'text', m.text, 'timestamp', m.created_at)
                            ORDER BY m.created_at)
              FROM messages m WHERE m.conversation_id = c.id), '[]'::json) AS messages
  FROM conversations c
  JOIN users u ON u.id = c.buyer_id
  JOIN stores s ON s.id = c.store_id`;

export const toConversation = (row: ConversationRow): Conversation => ({
  id: row.id,
  buyerId: row.buyer_id,
  buyerName: row.buyer_name,
  storeId: row.store_id,
  storeName: row.store_name,
  messages: row.messages as Message[],
});
