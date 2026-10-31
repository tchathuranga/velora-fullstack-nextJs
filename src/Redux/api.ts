import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { AuthUser } from "@/types/auth";
import type {
  AdminUser,
  AppNotification,
  Address,
  Banner,
  Buyer,
  BuyerStatus,
  Category,
  Conversation,
  Feedback,
  Message,
  Order,
  PaymentMethod,
  Product,
  ProductStatus,
  ProductVariations,
  SellerStatus,
  SellerTransaction,
  SiteConfig,
  SpecEntry,
  Store,
  Subcategory,
} from "@/types";

/** Everything scoped to the signed-in account — refetched whenever someone logs in or out. */
const USER_TAGS = [
  "MyStore",
  "Orders",
  "Order",
  "MyProducts",
  "Notifications",
  "Wishlist",
  "Conversations",
  "AdminStores",
  "AdminBuyers",
  "AdminUsers",
  "Payments",
] as const;

export interface RegisterInput {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface BankInput {
  name: string;
  accountNumber: string;
  bankName: string;
  branch: string;
  contactNumber: string;
}

export interface CreateStoreInput {
  businessName: string;
  fullName: string;
  address: string;
  telephone: string;
  email: string;
  aboutStore: string;
  bankDetails: BankInput;
  bankDetailsOptional?: BankInput;
  /** Cloudinary URLs of the photos chosen while registering. */
  profileImage?: string;
  coverImage?: string;
}

export interface CreateProductInput {
  title: string;
  categoryId: string | null;
  subcategoryId: string | null;
  price: number;
  quantity: number;
  brand: string;
  condition: string;
  size?: string;
  color?: string;
  packageInclude?: string;
  customSpecs: SpecEntry[];
  description: string;
  handlingTime: string;
  deliveryTime: string;
  freeDelivery: boolean;
  deliveryFee: number;
  extraDeliveryFee: number;
  returnsAccepted: boolean;
  paymentMethods: PaymentMethod[];
  location: string;
  images: string[];
  variations: ProductVariations | null;
}

export interface PlaceOrderInput {
  items: { productId: string; variationId?: string; quantity: number }[];
  paymentMethod: PaymentMethod;
  billing: Omit<Address, "email"> & { email?: string };
  orderNote?: string;
  saveAddress: boolean;
}

export interface PaymentsData {
  transactions: SellerTransaction[];
  /** Amount already paid out to each store, keyed by store id. */
  paidOut: Record<string, number>;
}

type SessionResponse = { user: AuthUser | null };

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: [
    "Session",
    "Stores",
    "Categories",
    "Banners",
    "Products",
    "Product",
    "Feedback",
    "Site",
    ...USER_TAGS,
  ],
  endpoints: (build) => ({
    // ───────────── Auth & account ─────────────
    getSession: build.query<AuthUser | null, void>({
      query: () => "/auth/me",
      transformResponse: (res: SessionResponse) => res.user,
      providesTags: ["Session"],
    }),
    login: build.mutation<AuthUser | null, { identifier: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: (res: SessionResponse) => res.user,
      invalidatesTags: [...USER_TAGS],
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        const { data } = await queryFulfilled;
        dispatch(api.util.upsertQueryData("getSession", undefined, data));
      },
    }),
    register: build.mutation<AuthUser | null, RegisterInput>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      transformResponse: (res: SessionResponse) => res.user,
      invalidatesTags: [...USER_TAGS],
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        const { data } = await queryFulfilled;
        dispatch(api.util.upsertQueryData("getSession", undefined, data));
      },
    }),
    adminLogin: build.mutation<AuthUser | null, { username: string; password: string }>({
      query: (body) => ({ url: "/auth/admin-login", method: "POST", body }),
      transformResponse: (res: SessionResponse) => res.user,
      invalidatesTags: [...USER_TAGS],
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        const { data } = await queryFulfilled;
        dispatch(api.util.upsertQueryData("getSession", undefined, data));
      },
    }),
    logout: build.mutation<{ ok: true }, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      invalidatesTags: [...USER_TAGS],
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        await queryFulfilled;
        dispatch(api.util.upsertQueryData("getSession", undefined, null));
      },
    }),
    saveAddress: build.mutation<AuthUser | null, Address>({
      query: (body) => ({ url: "/account/address", method: "PUT", body }),
      transformResponse: (res: SessionResponse) => res.user,
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        const { data } = await queryFulfilled;
        dispatch(api.util.upsertQueryData("getSession", undefined, data));
      },
    }),

    updateProfileImages: build.mutation<AuthUser | null, { avatarUrl?: string | null; coverUrl?: string | null }>({
      query: (body) => ({ url: "/account/profile", method: "PATCH", body }),
      transformResponse: (res: SessionResponse) => res.user,
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        const { data } = await queryFulfilled;
        dispatch(api.util.upsertQueryData("getSession", undefined, data));
      },
    }),

    // ───────────── Stores ─────────────
    getStores: build.query<Store[], void>({ query: () => "/stores", providesTags: ["Stores"] }),
    getMyStore: build.query<Store | null, void>({
      query: () => "/stores/mine",
      transformResponse: (res: { store: Store | null }) => res.store,
      providesTags: ["MyStore"],
    }),
    updateStoreImages: build.mutation<Store | null, { profileImage?: string | null; coverImage?: string | null }>({
      query: (body) => ({ url: "/stores/mine", method: "PATCH", body }),
      transformResponse: (res: { store: Store | null }) => res.store,
      invalidatesTags: ["MyStore", "Stores"],
    }),
    createStore: build.mutation<Store, CreateStoreInput>({
      query: (body) => ({ url: "/stores", method: "POST", body }),
      transformResponse: (res: { store: Store }) => res.store,
      invalidatesTags: ["MyStore", "Session", "AdminStores"],
    }),
    getAdminStores: build.query<Store[], void>({ query: () => "/admin/stores", providesTags: ["AdminStores"] }),
    setStoreStatus: build.mutation<Store, { id: string; status: SellerStatus }>({
      query: ({ id, status }) => ({ url: `/admin/stores/${id}`, method: "PATCH", body: { status } }),
      invalidatesTags: ["AdminStores", "Stores", "Products", "Session"],
    }),

    // ───────────── Categories ─────────────
    getCategories: build.query<Category[], void>({ query: () => "/categories", providesTags: ["Categories"] }),
    addCategory: build.mutation<Category, { name: string }>({
      query: (body) => ({ url: "/admin/categories", method: "POST", body }),
      invalidatesTags: ["Categories"],
    }),
    renameCategory: build.mutation<void, { id: string; name: string }>({
      query: ({ id, name }) => ({ url: `/admin/categories/${id}`, method: "PATCH", body: { name } }),
      invalidatesTags: ["Categories"],
    }),
    deleteCategory: build.mutation<void, string>({
      query: (id) => ({ url: `/admin/categories/${id}`, method: "DELETE" }),
      invalidatesTags: ["Categories", "Products"],
    }),
    addSubcategory: build.mutation<Subcategory, { categoryId: string; name: string }>({
      query: ({ categoryId, name }) => ({ url: `/admin/categories/${categoryId}/subcategories`, method: "POST", body: { name } }),
      invalidatesTags: ["Categories"],
    }),
    renameSubcategory: build.mutation<void, { categoryId: string; subcategoryId: string; name: string }>({
      query: ({ categoryId, subcategoryId, name }) => ({
        url: `/admin/categories/${categoryId}/subcategories/${subcategoryId}`,
        method: "PATCH",
        body: { name },
      }),
      invalidatesTags: ["Categories"],
    }),
    deleteSubcategory: build.mutation<void, { categoryId: string; subcategoryId: string }>({
      query: ({ categoryId, subcategoryId }) => ({
        url: `/admin/categories/${categoryId}/subcategories/${subcategoryId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Categories", "Products"],
    }),

    // ───────────── Banners ─────────────
    getBanners: build.query<Banner[], void>({ query: () => "/banners", providesTags: ["Banners"] }),
    addBanner: build.mutation<Banner, { title: string }>({
      query: (body) => ({ url: "/admin/banners", method: "POST", body }),
      invalidatesTags: ["Banners"],
    }),
    updateBanner: build.mutation<Banner, { id: string; title?: string; subtitle?: string; imageUrl?: string | null }>({
      query: ({ id, ...body }) => ({ url: `/admin/banners/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Banners"],
    }),
    deleteBanner: build.mutation<void, string>({
      query: (id) => ({ url: `/admin/banners/${id}`, method: "DELETE" }),
      invalidatesTags: ["Banners"],
    }),
    moveBanner: build.mutation<void, { id: string; direction: "up" | "down" }>({
      query: ({ id, direction }) => ({ url: `/admin/banners/${id}/move`, method: "POST", body: { direction } }),
      invalidatesTags: ["Banners"],
    }),

    // ───────────── Products & feedback ─────────────
    getProducts: build.query<Product[], void>({ query: () => "/products", providesTags: ["Products"] }),
    getProduct: build.query<Product, string>({
      query: (slug) => `/products/${encodeURIComponent(slug)}`,
      providesTags: (_res, _err, slug) => [{ type: "Product", id: slug }],
    }),
    createProduct: build.mutation<Product, CreateProductInput>({
      query: (body) => ({ url: "/products", method: "POST", body }),
      invalidatesTags: ["Products", "Stores", "MyStore", "MyProducts"],
    }),
    updateProduct: build.mutation<Product, { slug: string; input: CreateProductInput }>({
      query: ({ slug, input }) => ({ url: `/products/${encodeURIComponent(slug)}`, method: "PATCH", body: input }),
      invalidatesTags: ["Products", "Product", "Stores", "MyStore", "MyProducts"],
    }),
    setProductStatus: build.mutation<Product, { slug: string; status: ProductStatus }>({
      query: ({ slug, status }) => ({ url: `/products/${encodeURIComponent(slug)}/status`, method: "PUT", body: { status } }),
      invalidatesTags: ["Products", "Product", "Stores", "MyStore", "MyProducts"],
    }),
    /** The signed-in seller's own listings, active and ended. */
    getMyProducts: build.query<Product[], void>({ query: () => "/stores/mine/products", providesTags: ["MyProducts"] }),
    getFeedback: build.query<Feedback[], string>({
      query: (productId) => `/feedback?productId=${productId}`,
      providesTags: (_res, _err, productId) => [{ type: "Feedback", id: productId }],
    }),
    submitFeedback: build.mutation<Feedback, { productId: string; rating: number; comment: string }>({
      query: (body) => ({ url: "/feedback", method: "POST", body }),
      invalidatesTags: (_res, _err, { productId }) => [{ type: "Feedback", id: productId }, "Products", "Product"],
    }),

    // ───────────── Orders ─────────────
    placeOrder: build.mutation<Order, PlaceOrderInput>({
      query: (body) => ({ url: "/orders", method: "POST", body }),
      invalidatesTags: ["Orders", "Products", "Product", "Session"],
    }),
    getOrders: build.query<Order[], void>({ query: () => "/orders", providesTags: ["Orders"] }),
    getSellerOrders: build.query<Order[], void>({ query: () => "/orders?as=seller", providesTags: ["Orders"] }),
    getOrder: build.query<Order, string>({
      query: (id) => `/orders/${encodeURIComponent(id)}`,
      providesTags: (_res, _err, id) => [{ type: "Order", id }],
    }),
    getSellerOrder: build.query<Order, string>({
      query: (id) => `/orders/${encodeURIComponent(id)}?as=seller`,
      providesTags: (_res, _err, id) => [{ type: "Order", id }],
    }),
    setShipment: build.mutation<
      { trackingNumber: string; courierName: string },
      { orderId: string; itemId: string; trackingNumber: string; courierName: string }
    >({
      query: ({ orderId, itemId, trackingNumber, courierName }) => ({
        url: `/orders/${encodeURIComponent(orderId)}/items/${itemId}`,
        method: "PATCH",
        body: { trackingNumber, courierName },
      }),
      invalidatesTags: ["Orders", "Order"],
    }),

    // ───────────── Messages ─────────────
    getConversations: build.query<Conversation[], "buyer" | "seller">({
      query: (as) => (as === "seller" ? "/conversations?as=seller" : "/conversations"),
      providesTags: ["Conversations"],
    }),
    startConversation: build.mutation<Conversation, { storeId: string }>({
      query: (body) => ({ url: "/conversations", method: "POST", body }),
      invalidatesTags: ["Conversations"],
    }),
    sendMessage: build.mutation<
      Message,
      { conversationId: string; text: string; images?: string[]; productId?: string; orderId?: string }
    >({
      query: ({ conversationId, ...body }) => ({ url: `/conversations/${conversationId}/messages`, method: "POST", body }),
      invalidatesTags: ["Conversations"],
    }),

    // ───────────── Notifications ─────────────
    getNotifications: build.query<{ notifications: AppNotification[]; unreadCount: number }, void>({
      query: () => "/notifications",
      providesTags: ["Notifications"],
    }),
    markNotificationsRead: build.mutation<{ ok: true }, string[] | void>({
      query: (ids) => ({ url: "/notifications", method: "POST", body: ids ? { ids } : {} }),
      invalidatesTags: ["Notifications"],
    }),

    // ───────────── Wishlist ─────────────
    getWishlist: build.query<string[], void>({
      query: () => "/wishlist",
      transformResponse: (res: { productIds: string[] }) => res.productIds,
      providesTags: ["Wishlist"],
    }),
    toggleWishlistItem: build.mutation<string[], string>({
      query: (productId) => ({ url: "/wishlist", method: "POST", body: { productId } }),
      transformResponse: (res: { productIds: string[] }) => res.productIds,
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        const { data } = await queryFulfilled;
        dispatch(api.util.upsertQueryData("getWishlist", undefined, data));
      },
    }),
    mergeWishlist: build.mutation<string[], string[]>({
      query: (productIds) => ({ url: "/wishlist", method: "PUT", body: { productIds } }),
      transformResponse: (res: { productIds: string[] }) => res.productIds,
      onQueryStarted: async (_arg, { dispatch, queryFulfilled }) => {
        const { data } = await queryFulfilled;
        dispatch(api.util.upsertQueryData("getWishlist", undefined, data));
      },
    }),

    // ───────────── Site & admin ─────────────
    getSite: build.query<SiteConfig, void>({ query: () => "/site", providesTags: ["Site"] }),
    getAdminBuyers: build.query<Buyer[], void>({ query: () => "/admin/buyers", providesTags: ["AdminBuyers"] }),
    setBuyerStatus: build.mutation<{ id: string; status: BuyerStatus }, { id: string; status: BuyerStatus }>({
      query: ({ id, status }) => ({ url: `/admin/buyers/${id}`, method: "PATCH", body: { status } }),
      invalidatesTags: ["AdminBuyers"],
    }),
    getAdminUsers: build.query<AdminUser[], void>({ query: () => "/admin/users", providesTags: ["AdminUsers"] }),
    createAdminUser: build.mutation<AdminUser, RegisterInput>({
      query: (body) => ({ url: "/admin/users", method: "POST", body }),
      invalidatesTags: ["AdminUsers"],
    }),
    deleteUser: build.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/admin/users/${id}`, method: "DELETE" }),
      invalidatesTags: ["AdminUsers", "AdminBuyers", "AdminStores", "Payments"],
    }),
    getPayments: build.query<PaymentsData, void>({ query: () => "/admin/payments", providesTags: ["Payments"] }),
    confirmTransaction: build.mutation<{ id: string; confirmed: boolean }, { id: string; confirmed: boolean }>({
      query: ({ id, confirmed }) => ({ url: `/admin/transactions/${id}`, method: "PATCH", body: { confirmed } }),
      invalidatesTags: ["Payments"],
    }),
    payOutStore: build.mutation<{ storeId: string; amount: number }, string>({
      query: (storeId) => ({ url: "/admin/payouts", method: "POST", body: { storeId } }),
      invalidatesTags: ["Payments"],
    }),
  }),
});

export const {
  useGetSessionQuery,
  useLoginMutation,
  useRegisterMutation,
  useAdminLoginMutation,
  useLogoutMutation,
  useSaveAddressMutation,
  useGetStoresQuery,
  useGetMyStoreQuery,
  useCreateStoreMutation,
  useGetAdminStoresQuery,
  useSetStoreStatusMutation,
  useGetCategoriesQuery,
  useAddCategoryMutation,
  useRenameCategoryMutation,
  useDeleteCategoryMutation,
  useAddSubcategoryMutation,
  useRenameSubcategoryMutation,
  useDeleteSubcategoryMutation,
  useGetBannersQuery,
  useAddBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  useMoveBannerMutation,
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useSetProductStatusMutation,
  useGetMyProductsQuery,
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
  useGetFeedbackQuery,
  useSubmitFeedbackMutation,
  usePlaceOrderMutation,
  useGetOrdersQuery,
  useGetSellerOrdersQuery,
  useGetOrderQuery,
  useGetSellerOrderQuery,
  useSetShipmentMutation,
  useGetConversationsQuery,
  useUpdateProfileImagesMutation,
  useUpdateStoreImagesMutation,
  useStartConversationMutation,
  useSendMessageMutation,
  useGetWishlistQuery,
  useToggleWishlistItemMutation,
  useMergeWishlistMutation,
  useGetSiteQuery,
  useGetAdminBuyersQuery,
  useSetBuyerStatusMutation,
  useGetAdminUsersQuery,
  useCreateAdminUserMutation,
  useDeleteUserMutation,
  useGetPaymentsQuery,
  useConfirmTransactionMutation,
  usePayOutStoreMutation,
} = api;

/** Pulls a human-readable message out of an RTK Query error (the API always replies `{ error }`). */
export function getErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const data = (err as { data?: { error?: unknown } } | undefined)?.data;
  if (data && typeof data.error === "string") return data.error;
  if ((err as { status?: unknown } | undefined)?.status === "FETCH_ERROR") return "Couldn't reach the server. Check your connection and try again.";
  return fallback;
}
