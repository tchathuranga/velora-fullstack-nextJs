import { z } from "zod";
import { isOwnCloudinaryUrl } from "./cloudinary";

const text = (max = 200) => z.string().trim().max(max);
const required = (label: string, max = 200) => z.string().trim().min(1, `${label} is required.`).max(max);

const imageUrl = z
  .string()
  .max(500)
  .refine(isOwnCloudinaryUrl, "Images must be uploaded through the site.");

export const paymentMethodSchema = z.enum(["cod", "bank_transfer"]);

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(100),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters long.")
    .max(40)
    .regex(/^[a-zA-Z0-9_.-]+$/, "Use letters, numbers, dots, underscores or hyphens only."),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address.").max(200),
  password: z.string().min(6, "Password must be at least 6 characters long.").max(200),
});

export const createAdminSchema = registerSchema;

export const loginSchema = z.object({
  identifier: required("Username or email", 200),
  password: z.string().min(1, "Enter your password.").max(200),
});

export const addressSchema = z.object({
  fullName: required("Full name", 120),
  street: required("Street address", 200),
  city: required("City", 100),
  province: required("Province", 100),
  phone1: required("Phone number", 30),
  phone2: text(30).default(""),
  zipCode: required("Zip code", 20),
  email: z.union([z.literal(""), z.string().trim().email().max(200)]).optional(),
});

const bankSchema = z.object({
  name: required("Bank account name", 120),
  accountNumber: required("Bank account number", 50),
  bankName: required("Bank name", 100),
  branch: required("Branch", 100),
  contactNumber: required("Bank contact number", 30),
});

export const createStoreSchema = z.object({
  businessName: required("Business name", 120),
  fullName: required("Full name", 120),
  address: required("Business address", 300),
  telephone: required("Business telephone", 30),
  email: z.string().trim().email("Enter a valid business email.").max(200),
  aboutStore: required("About your store", 2000),
  bankDetails: bankSchema,
  bankDetailsOptional: bankSchema.optional(),
  profileImage: imageUrl.nullish(),
  coverImage: imageUrl.nullish(),
});

export const storeStatusSchema = z.object({ status: z.enum(["active", "rejected", "limited", "under_review"]) });
export const buyerStatusSchema = z.object({ status: z.enum(["active", "limited"]) });

export const nameSchema = z.object({ name: required("Name", 100) });

export const bannerCreateSchema = z.object({ title: required("Title", 150) });
export const bannerUpdateSchema = z.object({
  title: required("Title", 150).optional(),
  subtitle: text(300).optional(),
  imageUrl: z.string().max(4_000_000).nullable().optional(),
});
export const bannerMoveSchema = z.object({ direction: z.enum(["up", "down"]) });

export const uploadSignSchema = z.object({
  kind: z.enum(["avatar", "cover", "store-avatar", "store-cover", "product", "message"]),
});
export const profileImagesSchema = z.object({
  avatarUrl: imageUrl.nullable().optional(),
  coverUrl: imageUrl.nullable().optional(),
});
export const storeImagesSchema = z.object({
  profileImage: imageUrl.nullable().optional(),
  coverImage: imageUrl.nullable().optional(),
});

/** Handling / delivery time is free text, but it must state the number of days so deadlines and estimates can be computed. */
const dayRange = (label: string) =>
  required(label, 100).refine((value) => /d/.test(value), `${label} must include the number of days, e.g. "2-3 days".`);

export const createProductSchema = z.object({
  title: required("Product title", 100),
  categoryId: z.string().uuid("Select a category.").nullish(),
  subcategoryId: z.string().uuid().nullish(),
  price: z.number().min(0, "Price can't be negative.").max(100_000_000),
  quantity: z.number().int().min(0).max(1_000_000),
  brand: required("Brand name", 100),
  condition: required("Condition", 100),
  size: text(100).optional(),
  color: text(100).optional(),
  packageInclude: text(300).optional(),
  customSpecs: z.array(z.object({ label: text(100), value: text(300) })).max(30).default([]),
  description: required("Description", 100_000),
  handlingTime: dayRange("Handling time"),
  deliveryTime: dayRange("Delivery time"),
  freeDelivery: z.boolean().default(false),
  deliveryFee: z.number().min(0).max(1_000_000).default(0),
  extraDeliveryFee: z.number().min(0).max(1_000_000).default(0),
  returnsAccepted: z.literal(true, "Please accept the return policy to list your product."),
  paymentMethods: z.array(paymentMethodSchema).min(1, "Select at least one payment method."),
  location: required("Store location", 200),
  images: z.array(imageUrl).max(13).default([]),
  variations: z
    .object({
      attributes: z.array(z.object({ name: text(60), options: z.array(text(60)).max(50) })).max(5),
      images: z.record(z.string(), imageUrl),
      combinations: z
        .array(
          z.object({
            id: z.string().max(100),
            values: z.record(z.string(), z.string()),
            quantity: z.number().int().min(0),
            price: z.number().min(0),
          }),
        )
        .max(500),
    })
    .nullish(),
});

export const productStatusSchema = z.object({ status: z.enum(["active", "ended"]) });

export const placeOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        /** Required for listings that have variations. */
        variationId: z.string().max(100).optional(),
        quantity: z.number().int().min(1).max(100),
      }),
    )
    .min(1, "Your cart is empty.")
    .max(100),
  paymentMethod: paymentMethodSchema,
  billing: addressSchema,
  orderNote: text(1000).optional(),
  saveAddress: z.boolean().default(false),
});

export const trackingSchema = z.object({
  trackingNumber: required("Tracking number", 100),
  courierName: required("Courier company name", 100),
});

export const feedbackSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: text(2000).default(""),
});

export const startConversationSchema = z.object({ storeId: z.string().uuid() });
export const messageSchema = z
  .object({
    text: text(4000).default(""),
    images: z.array(imageUrl).max(10).default([]),
    productId: z.string().uuid().optional(),
    orderId: z.string().max(40).optional(),
  })
  .refine((m) => m.text.length > 0 || m.images.length > 0, { message: "Write a message or attach a photo." });

export const notificationsReadSchema = z.object({ ids: z.array(z.string().uuid()).max(200).optional() });

export const wishlistSchema = z.object({ productId: z.string().uuid() });
export const wishlistMergeSchema = z.object({ productIds: z.array(z.string().uuid()).max(500) });

export const transactionConfirmSchema = z.object({ confirmed: z.boolean() });
export const payoutSchema = z.object({ storeId: z.string().uuid() });

export const siteSchema = z.object({
  siteContact: z.object({ email: text(200), phone: text(50), whatsapp: text(50) }),
  adminBankAccounts: z
    .array(
      z.object({
        label: required("Label", 60),
        bankName: required("Bank name", 100),
        accountName: required("Account name", 100),
        accountNumber: required("Account number", 50),
        branch: required("Branch", 100),
      }),
    )
    .max(10),
});

export function slugify(value: string, fallback: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || fallback;
}
