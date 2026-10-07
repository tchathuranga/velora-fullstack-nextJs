export type PaymentMethod = "cod" | "bank_transfer";

export type SellerStatus = "active" | "rejected" | "limited" | "under_review";

export type BuyerStatus = "active" | "limited";

export interface Address {
  fullName: string;
  street: string;
  city: string;
  province: string;
  phone1: string;
  phone2: string;
  zipCode: string;
  email?: string;
}

export interface BankDetails {
  name: string;
  accountNumber: string;
  bankName: string;
  branch: string;
  contactNumber: string;
}

export interface StoreStats {
  activeListings: number;
  orders: number;
  unsoldListings: number;
  orderAmount: number;
}

export interface Store {
  id: string;
  slug: string;
  storeName: string;
  businessName: string;
  fullName: string;
  address: string;
  telephone: string;
  email: string;
  aboutStore: string;
  createdAt: string;
  status: SellerStatus;
  bankDetails: BankDetails;
  bankDetailsOptional?: BankDetails;
  stats: StoreStats;
  coverColor: string;
  profileColor: string;
}

export interface SpecEntry {
  label: string;
  value: string;
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  subcategories: Subcategory[];
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  /** Admin-uploaded image data URL; falls back to a gradient placeholder when absent. */
  imageUrl?: string;
}

export interface VariationAttribute {
  name: string;
  options: string[];
}

export interface VariationCombination {
  id: string;
  values: Record<string, string>;
  quantity: number;
  price: number;
}

export interface ProductVariations {
  attributes: VariationAttribute[];
  images: Record<string, string>;
  combinations: VariationCombination[];
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  storeId: string;
  price: number;
  quantity: number;
  brand?: string;
  size?: string;
  color?: string;
  packageInclude?: string;
  customSpecs: SpecEntry[];
  description: string;
  handlingTime: string;
  deliveryTime: string;
  /** Delivery fee in LKR; ignored when freeDelivery is true. Absent on legacy products. */
  deliveryFee?: number;
  freeDelivery?: boolean;
  paymentMethods: PaymentMethod[];
  location: string;
  categoryId?: string;
  subcategoryId?: string;
  icon: string;
  galleryCount: number;
  /**
   * Uploaded photo data URLs; falls back to the icon placeholder when absent. List endpoints only
   * include the first photo (galleryCount has the real total); the single-product endpoint has all.
   */
  images?: string[];
  tags: Array<"trending" | "new" | "deal" | "sale" | "recent">;
  rating: number;
  reviewCount: number;
  createdAt: string;
  variations?: ProductVariations;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  icon: string;
  storeId: string;
  /** Attribute selections made by the buyer, e.g. { Color: "Blue", Size: "Medium" }. */
  variation?: Record<string, string>;
  /** Courier tracking number, added by the seller once shipped. */
  trackingNumber?: string;
}

export type OrderStatus = "processing" | "shipped" | "delivered";

export interface Order {
  id: string;
  buyerName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCost: number;
  total: number;
  paymentMethod: PaymentMethod;
  billing: Address;
  orderNote?: string;
  saveAddress: boolean;
  status: OrderStatus;
  createdAt: string;
  trackingSteps: { label: string; done: boolean; date?: string }[];
}

export type AdminUserRole = "admin" | "seller" | "buyer";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: AdminUserRole;
  status: BuyerStatus;
  createdAt: string;
}

export interface Buyer {
  id: string;
  name: string;
  email: string;
  registered: boolean;
  status: BuyerStatus;
  savedAddress: boolean;
  address?: Address;
}

export interface SellerTransaction {
  id: string;
  storeId: string;
  productTitle: string;
  paymentMethod: PaymentMethod;
  amount: number;
  confirmed: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  sender: "buyer" | "seller";
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  buyerId: string;
  buyerName: string;
  storeId: string;
  storeName: string;
  messages: Message[];
}

export interface Feedback {
  id: string;
  productId: string;
  buyerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SiteContact {
  email: string;
  phone: string;
  whatsapp: string;
}

export interface AdminBankAccount {
  label: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
}

export interface SiteConfig {
  siteContact: SiteContact;
  adminBankAccounts: AdminBankAccount[];
}
