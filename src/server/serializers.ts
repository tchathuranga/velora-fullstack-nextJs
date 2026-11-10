import { decryptBankDetails } from "./crypto";
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
  /** Plaintext form, only on rows saved before encryption was introduced (see scripts/bank-details.mjs). */
  bank_details: BankDetails | null;
  bank_details_optional: BankDetails | null;
  bank_details_enc: string | null;
  bank_details_optional_enc: string | null;
  cover_color: string;
  profile_color: string;
  cover_image_url: string | null;
  profile_image_url: string | null;
  created_at: Date;
  active_listings: number;
  unsold_listings: number;
  orders: number;
  order_amount: number;
}

/** The encrypted form when there is one, else the legacy plaintext. */
function readBank(encrypted: string | null, plain: BankDetails | null): BankDetails | null {
  return encrypted ? decryptBankDetails<BankDetails>(encrypted) : plain;
}

/** Select list shared by every store query; stats are computed live from products / order_items. */
export const STORE_SELECT = `
  s.id, s.slug, s.store_name, s.business_name, s.full_name, s.address, s.telephone, s.email, s.about_store,
  s.status, s.bank_details, s.bank_details_optional, s.bank_details_enc, s.bank_details_optional_enc, s.cover_color, s.profile_color, s.cover_image_url, s.profile_image_url, s.created_at,
  (SELECT count(*) FROM products p WHERE p.store_id = s.id AND p.status = 'active') AS active_listings,
  (SELECT count(*) FROM products p WHERE p.store_id = s.id AND p.status = 'ended') AS unsold_listings,
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
    ...(row.cover_image_url ? { coverImage: row.cover_image_url } : {}),
    ...(row.profile_image_url ? { profileImage: row.profile_image_url } : {}),
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
    // Decrypted only for the owner and admins, so public responses never need the key.
    bankDetails: includePrivate ? (readBank(row.bank_details_enc, row.bank_details) ?? EMPTY_BANK) : EMPTY_BANK,
    ...(includePrivate && (row.bank_details_optional_enc || row.bank_details_optional)
      ? { bankDetailsOptional: readBank(row.bank_details_optional_enc, row.bank_details_optional)! }
      : {}),
  };
}

// ───────────────────────── Categories / banners ─────────────────────────
export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  subcategories: { id: string; name: string; slug: string }[];
}

export const CATEGORY_SELECT = `
  c.id, c.name, c.slug, c.image_url,
  COALESCE((SELECT json_agg(json_build_object('id', sc.id, 'name', sc.name, 'slug', sc.slug) ORDER BY sc.position, sc.name)
              FROM subcategories sc WHERE sc.category_id = c.id), '[]'::json) AS subcategories`;

export const toCategory = (row: CategoryRow): Category => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  ...(row.image_url ? { imageUrl: row.image_url } : {}),
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
  status: Product["status"];
  condition: string | null;
  extra_delivery_fee: number;
  returns_accepted: boolean;
  sold_total: number;
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
  handling_days_min: number;
  handling_days_max: number;
  delivery_days_min: number;
  delivery_days_max: number;
  compare_at_price: number | null;
  sale_ends_at: Date | null;
  /** Derived in SQL: the original price is above the price and the sale has not ended. */
  on_sale: boolean;
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
  last_sold_at: Date | null;
}

/**
 * Only products from approved stores are public. `images` is the full gallery when `full` is set,
 * otherwise just the cover photo (list responses stay small); `image_count` is always the real total.
 */
/** A listing is on sale while its original price is above its price and the sale has not ended. */
export const ON_SALE_SQL = "p.compare_at_price IS NOT NULL AND p.compare_at_price > p.price AND (p.sale_ends_at IS NULL OR p.sale_ends_at > now())";

export function productSelect(full: boolean): string {
  return `
  p.id, p.status, p.condition, p.extra_delivery_fee, p.returns_accepted, p.slug, p.store_id, p.category_id, p.subcategory_id, p.title, p.price, p.quantity, p.brand, p.size, p.color,
  p.package_include, p.custom_specs, p.description, p.handling_days_min, p.handling_days_max, p.delivery_days_min, p.delivery_days_max, p.delivery_fee, p.free_delivery,
  p.compare_at_price, p.sale_ends_at,
  (${ON_SALE_SQL}) AS on_sale,
  p.payment_methods, p.location, p.icon, p.tags, product_variations_json(p.id) AS variations, p.created_at,
  ${full ? "p.images" : "CASE WHEN jsonb_array_length(p.images) > 0 THEN jsonb_build_array(p.images->0) ELSE '[]'::jsonb END AS images"},
  jsonb_array_length(p.images) AS image_count,
  p.rating_avg AS rating, p.review_count, p.sold_count AS sold_total, p.last_sold_at`;
}

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/** 2,3 -> "2-3 days"; 3,3 -> "3 days"; 1,1 -> "1 day"; 0 (unknown) -> "". */
function formatDays(min: number, max: number): string {
  if (max <= 0) return "";
  if (min === max) return `${max} ${max === 1 ? "day" : "days"}`;
  return `${min}-${max} days`;
}

/** jsonb does not keep object key order, so put each combination's values back in the seller's attribute order. */
function orderedVariations(v: ProductVariations): ProductVariations {
  const names = v.attributes.map((a) => a.name);
  return {
    ...v,
    combinations: v.combinations.map((c) => ({
      ...c,
      values: Object.fromEntries(names.filter((n) => n in c.values).map((n) => [n, c.values[n]])),
    })),
  };
}

export function toProduct(row: ProductRow): Product {
  const created = new Date(row.created_at);
  // "new" and "trending" are derived from listing age / recent sales; "deal" and "sale" are curated tags.
  const tags = new Set(row.tags.filter((t) => t !== "new" && t !== "trending"));
  if (Date.now() - created.getTime() < NEW_WINDOW_MS) tags.add("new");
  // "Trending" means it sold within the last 30 days, which the stored last_sold_at answers directly.
  if (row.last_sold_at && Date.now() - new Date(row.last_sold_at).getTime() < NEW_WINDOW_MS) tags.add("trending");
  if (row.on_sale) tags.add("sale"); // priced sales count alongside the curated "sale" tag

  return {
    id: row.id,
    status: row.status,
    slug: row.slug,
    title: row.title,
    storeId: row.store_id,
    price: row.price,
    quantity: row.quantity,
    brand: row.brand ?? undefined,
    condition: row.condition ?? undefined,
    size: row.size ?? undefined,
    color: row.color ?? undefined,
    packageInclude: row.package_include ?? undefined,
    customSpecs: row.custom_specs,
    description: row.description,
    handlingTime: formatDays(row.handling_days_min, row.handling_days_max),
    deliveryTime: formatDays(row.delivery_days_min, row.delivery_days_max),
    deliveryFee: row.free_delivery ? 0 : row.delivery_fee,
    extraDeliveryFee: row.free_delivery ? 0 : row.extra_delivery_fee,
    freeDelivery: row.free_delivery,
    returnsAccepted: row.returns_accepted,
    soldCount: Number(row.sold_total),
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
    ...(row.on_sale
      ? { compareAtPrice: Number(row.compare_at_price), ...(row.sale_ends_at ? { saleEndsAt: iso(row.sale_ends_at) } : {}) }
      : {}),
    ...(row.last_sold_at ? { lastSoldAt: iso(row.last_sold_at) } : {}),
    variations: row.variations
      ? {
          ...orderedVariations(row.variations),
          // Older rows stored one URL per option.
          images: Object.fromEntries(
            Object.entries(row.variations.images ?? {}).map(([option, v]) => [option, Array.isArray(v) ? v : [v as string]]),
          ),
        }
      : undefined,
  };
}

// ───────────────────────── Orders ─────────────────────────
export interface OrderRow {
  id: string;
  buyer_name: string;
  buyer_username: string | null;
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
  variation_id: string | null;
  shipping_cost: number;
  tracking_number: string | null;
  courier_name: string | null;
  ship_by: string | null;
  id: string;
}

export function toOrder(row: OrderRow, items: OrderItemRow[]): Order {
  return {
    id: row.id,
    buyerName: row.buyer_name,
    buyerUsername: row.buyer_username ?? "guest",
    items: items.map(
      (i): OrderItem => ({
        id: i.id,
        productId: i.product_id ?? "",
        title: i.title,
        price: i.price,
        quantity: i.quantity,
        icon: i.icon,
        storeId: i.store_id,
        shippingCost: i.shipping_cost,
        ...(i.variation ? { variation: i.variation } : {}),
        ...(i.variation_id ? { variationId: i.variation_id } : {}),
        ...(i.tracking_number ? { trackingNumber: i.tracking_number } : {}),
        ...(i.courier_name ? { courierName: i.courier_name } : {}),
        ...(i.ship_by ? { shipBy: i.ship_by } : {}),
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
  username: string;
  name: string;
  email: string;
  status: Buyer["status"];
  address: (Omit<Address, "email"> & { email: string | null }) | null;
}

export function toBuyer(row: BuyerRow): Buyer {
  return {
    id: row.id,
    username: row.username,
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
  fee_rate: number;
  fee_amount: number;
  confirmed: boolean;
  payout_id: string | null;
  created_at: Date;
}

export const toTransaction = (row: TransactionRow): SellerTransaction => ({
  id: row.id,
  storeId: row.store_id,
  productTitle: row.product_title,
  paymentMethod: row.payment_method,
  amount: row.amount,
  feeRate: Number(row.fee_rate),
  feeAmount: row.fee_amount,
  confirmed: row.confirmed,
  ...(row.payout_id ? { payoutId: row.payout_id } : {}),
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
  messages: Message[];
}

export const CONVERSATION_SELECT = `
  c.id, c.buyer_id, u.username AS buyer_name, c.store_id, s.store_name,
  COALESCE((SELECT jsonb_agg(
                     jsonb_build_object('id', m.id, 'sender', m.sender, 'text', m.text, 'images', m.images, 'timestamp', m.created_at)
                     || CASE WHEN mp.id IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('product', jsonb_build_object(
                          'id', mp.id, 'slug', mp.slug, 'title', mp.title,
                          'image', CASE WHEN jsonb_array_length(mp.images) > 0 THEN mp.images->>0 END)) END
                     || CASE WHEN m.order_id IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('order', jsonb_build_object('id', m.order_id)) END
                   ORDER BY m.created_at)
              FROM messages m LEFT JOIN products mp ON mp.id = m.product_id
             WHERE m.conversation_id = c.id), '[]'::jsonb) AS messages
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
