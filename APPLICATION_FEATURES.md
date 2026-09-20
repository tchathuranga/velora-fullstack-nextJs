# EDEELZ.lk - Complete Application Features

A full-stack Next.js e-commerce marketplace platform with buyer, seller, and admin functionalities. Below is a comprehensive list of all features organized by section.

---

## 🏠 **1. HOME PAGE** (`/`)

### Hero Section & Promotions
- **Hero Banners** - Eye-catching promotional banners at top of homepage
- **Promo Banners** - Additional promotional content sections

### Product Sections
- **Trending Products Section** - Display 12 trending products with tags
- **New Arrivals Section** - Showcase 12 newly added products
- **Today's Deal Section** - Special deals tagged products
- **On Sale Section** - Sales/discount promoted items

### Recently Viewed Section
- Track and display recently viewed products
- Quick access to previously browsed items
- Powered by Redux integration (RecentlyViewedContext)

---

## 🔐 **2. AUTHENTICATION**

### Buyer Sign-Up (`/signup`)
- **Registration Form:**
  - Full name validation (minimum 2 characters)
  - Username validation (3+ characters, alphanumeric with dots/underscores/hyphens)
  - Email validation (valid email format)
  - Password validation (minimum 6 characters)
  - Real-time error handling
  - Links to login and seller registration

### Buyer Login (`/login`)
- **Login Form:**
  - Username or email identifier support
  - Password authentication
  - Field validation (minimum 3 chars for identifier, 6 for password)
  - Error messages and alerts
  - Links to signup and admin login
  - Role-based redirection (buyer → account, seller → store)

### Admin Login (`/admin/login`)
- **Secure Admin Access:**
  - Separate from buyer/seller authentication
  - Username & password authentication
  - Credential validation against admins.json
  - Error handling for invalid credentials
  - Redirects to sellers dashboard after login

### Authentication Context
- **AuthContext Features:**
  - User role management (buyer, seller, admin)
  - User identification (buyerId, storeSlug)
  - Display name and username storage
  - Login/logout functionality
  - Admin-specific authentication

---

## 🛒 **3. SHOPPING FEATURES**

### Product Browsing
- **Product Grid Display** - Responsive grid layout for products
- **Product Cards** - Display product images, title, price, rating, reviews
- **Product Filtering** - Search and category filtering
- **Product Search** (`/search`)
  - Search by product title
  - Search by brand name
  - Search by product description
  - Real-time search results with count display
  - All products view when no search query

### Product Details Page (`/product/[productId]`)
- **Product Information:**
  - Full product title and description
  - Product gallery with multiple images (count tracking)
  - Price display
  - Star rating and review count
  - Brand, size, color specifications
  - Package include information
  - Custom specifications support
  - Handling time and delivery time details

- **Related Products** - Suggest similar products
- **Seller Information** - Display store name and link to store
- **Seller Contact** - Direct messaging option with seller
- **Customer Feedback Section** - Product reviews and ratings
- **Product View Tracking** - Track product views in Redux (for recently viewed)

### Cart Management (`/cart`)
- **Cart Features:**
  - View all added items
  - Item quantity, price, title, and icon display
  - Product count with maximum 50 items limit
  - Cart summary with subtotal calculation
  - Empty cart state with call-to-action
  - Individual item row with details
  - Cart context with Redux integration (CartContext)

- **Cart Actions:**
  - Add/remove items
  - Modify quantities
  - Clear cart
  - View item details
  - Maximum cart items enforcement (50 items)

### Wishlist (`/wishlist`)
- **Wishlist Features:**
  - Save favorite products
  - View all wishlist items
  - Empty wishlist state
  - Quick links to continue shopping
  - Wishlist context with Redux integration (WishlistContext)

- **Product Actions in Lists:**
  - Add to cart button
  - Add/remove from wishlist (heart icon)
  - Star ratings and review counts

---

## 💳 **4. CHECKOUT & PAYMENT**

### Checkout Page (`/checkout`)
- **Billing Information Form:**
  - Full name (required)
  - Street address (required)
  - City (required)
  - Province/State (required)
  - Phone numbers - primary & secondary (required)
  - Zip code (required)
  - Email address (optional)
  - Order notes/special instructions
  - Save address checkbox (for registered buyers)
  - Auto-fill saved address for logged-in buyers

- **Payment Method Selection:**
  - Cash on Delivery (COD) option
  - Bank Transfer option
  - Payment method selector with radio buttons

- **Order Summary:**
  - Item listing with quantities
  - Subtotal calculation
  - Delivery cost (flat rate)
  - Order total
  - "Place Order" button

- **Order Processing:**
  - Order ID generation
  - Order status tracking (processing initially)
  - Save billing address for future purchases
  - Tracking steps initialization

### Order Confirmation Page (`/order/[orderId]/confirmation`)
- **Order Confirmation Display:**
  - Success message with order ID
  - Order details summary
  - Order total amount
  - Contact information display

- **COD Payment Instructions:**
  - Clear COD process explanation
  - Timeline for order preparation

- **Bank Transfer Instructions:**
  - Multiple bank account options
  - Bank name, account name, account number, branch
  - Order ID as payment reference requirement
  - WhatsApp contact for payment receipt submission
  - Warning/alert box for bank transfer payment

- **Contact Information Section:**
  - Email address
  - Phone number
  - WhatsApp number
  - Mail, phone, and message icons

- **Post-Order Actions:**
  - View orders button (to account page)
  - Continue shopping button

---

## 👤 **5. BUYER ACCOUNT** (`/account`)

### Account Profile
- **Profile Section:**
  - Gradient header background
  - User avatar with icon
  - Display user name
  - Display user email
  - Profile information card

### Delivery Address Management
- **Address Card:**
  - Display full name
  - Street address
  - City and province
  - Phone numbers
  - Zip code
  - Edit/manage address capability
  - Save/update address functionality

### Purchase History
- **Order History Display:**
  - Complete purchase history
  - Order items with product info
  - Product images/icons
  - Product title and price
  - Order date
  - Order quantity
  - Order status tracking
  - Divider between items
  - Pagination/list view

### Recently Viewed Products
- Display recently viewed products
- Quick access to browse again
- Product grid format

### Authentication Guard
- Redirect non-buyers to login
- Display message for logged-out users
- Require buyer role to access

---

## 🏪 **6. SELLER FEATURES**

### Seller Landing Page (`/sell`)
- **Seller Benefits Display:**
  - "Reach thousands of buyers" with trending icon
  - "Get paid reliably" with wallet icon
  - "Control fulfilment" with truck icon
  - Feature descriptions

- **Call-to-Action:**
  - "Create your own store" button
  - Clear value proposition
  - Link to seller registration

### Seller Registration (`/sell/register`)
- Store account setup process
- Seller profile creation
- Registration flow management

### Store Management (`/seller`)
- Seller dashboard access
- Store information management

### Product Listing (`/seller/products/new`)
- **Multi-Step Product Form:**
  - Form, attributes, images, review steps

- **Basic Product Information:**
  - Product title (max 100 characters with counter)
  - Price input (number field)
  - Quantity in stock (number field)
  - Product photos/images upload
  - Photo grid display

- **Specifications Section:**
  - Brand name
  - Size
  - Color
  - Package include
  - Custom specifications editor (dynamic fields)
  - Add/remove custom specs

- **Product Variations:**
  - Add variations option
  - Variation attribute builder
  - Multiple variation combinations
  - Variation-specific images
  - Variation pricing adjustments
  - Edit/remove variations
  - Variation summary table display

- **Variation Attributes:**
  - Create custom attributes (e.g., color, size)
  - Multiple values per attribute
  - Attribute value management
  - Image assignment per variation

- **Product Description:**
  - Rich text description field
  - Full product details

- **Delivery Details:**
  - Handling time (seller processing time)
  - Delivery time (expected delivery window)
  - Custom time descriptions

- **Payment Methods:**
  - Cash on Delivery (COD) option
  - Bank Transfer option
  - Multiple payment method support
  - Checkbox selection

- **Location:**
  - Store location input
  - City/region specification

- **Product Form Submission:**
  - Form validation
  - Success confirmation screen
  - "View my store" button
  - "List another product" button
  - Product form state management (Redux)

---

## 🏬 **7. STORE PAGES** (`/store/[storeSlug]`)

### Store Header
- Store logo/avatar
- Store name display
- Store status badge
- Contact seller button
- Quick info section

### Store Information Section
- **About Us Card:**
  - Store name
  - Store creation date
  - Store description (about store)

### Store Statistics
- Metrics and performance indicators
- Store rating/stats display

### Store Products
- **Product Listing:**
  - All products from the store
  - Product grid layout
  - Responsive display
  - Filter/sort options

---

## 💬 **8. MESSAGING & COMMUNICATION** (Placeholders)

### Buyer Messages (`/account/messages`)
- Messaging interface for buyer-seller communication
- Conversation history
- Message viewing

### Seller Messages (`/seller/messages`)
- Messaging interface for seller perspective
- Customer message management
- Conversation handling

### Contact Seller
- Direct messaging with seller
- "Contact seller" button on product pages
- Store page contact option

---

## 👥 **9. ADMIN DASHBOARD** (`/admin`)

### Admin Authentication
- Separate admin login system
- Credential validation
- Error handling
- Redirect to sellers dashboard

### Admin Navigation
- Tab-based navigation
- Sellers tab
- Buyers tab
- Payments tab
- Active tab highlighting
- Responsive design

### Seller Management Dashboard (`/admin/sellers`)
- **Sellers List:**
  - All registered sellers in left panel
  - Click to select seller
  - Seller names display
  - Status indicators

- **Seller Details Panel (Right Panel):**
  - Store name and status badge
  - Public store page link

- **Seller Information:**
  - Full name
  - Address
  - Telephone number
  - Business name
  - About store description
  - Account creation date

- **Seller Payment Details:**
  - Bank account holder name
  - Bank account number
  - Bank name
  - Branch information
  - Contact number

- **Seller Management Actions:**
  - Approve seller button
  - Decline/reject seller button
  - Limit seller button
  - Status update functionality

- **Sellers Summary Table:**
  - Store names
  - Current status display
  - Status badges (active, limited, rejected)
  - Quick reference list

### Buyer Management Dashboard (`/admin/buyers`)
- **Registered Buyers List:**
  - Only registered buyers shown (guests excluded)
  - Left panel buyer list
  - Click to select buyer
  - Status indicators

- **Buyer Details Panel:**
  - Buyer name
  - Email address

- **Saved Address Information:**
  - Full name
  - Street address
  - City
  - Province
  - Phone numbers (primary & secondary)
  - Zip code
  - Email address

- **Address Management:**
  - Alert if address not saved
  - Display message for missing address data

- **Buyer Status Control:**
  - Limit buyer button (restrict access)
  - Reactivate buyer button (restore access)
  - Toggle between active/limited status

### Seller Payments Management (`/admin/sellers/payments`)
- **Store Selection:**
  - Dropdown to select seller/store
  - Filter transactions by store
  - Display stores with transactions

- **Transaction List:**
  - Transaction ID
  - Payment method (bank transfer, COD)
  - Amount
  - Confirmation status
  - Timestamp
  - Checkbox for confirmation

- **Transaction Confirmation:**
  - Toggle confirm/unconfirm transactions
  - Batch confirmation handling
  - Confirmed filter

- **Payment Fee Calculation:**
  - Bank transfer fee calculation
  - COD fee calculation
  - Automatic fee deduction

- **Summary Cards:**
  - Confirmed amount total
  - Bank transaction fee total
  - COD transaction fee total
  - Net sale amount (after fees)

- **Available Funds Display:**
  - Total available for payout
  - Calculation: Net sale - Previously paid out
  - Wallet icon display
  - Next payout date (biweekly Monday)
  - "Paid" button to mark as paid out
  - Disabled state when no funds available

- **Payment Tracking:**
  - Track paid out amount
  - Calculate remaining balance
  - Maintain payment history

---

## 📄 **10. ADDITIONAL PAGES**

### About Page (`/about`)
- Company/marketplace information

### Help/Support Page (`/help`)
- FAQ or support information
- Help resources

### Seller Pending (`/sell/pending`)
- Registration status page
- Pending applications
- Status tracking

---

## 🔧 **11. TECHNICAL FEATURES**

### State Management
- **Redux Store:**
  - Cart context management
  - Wishlist context management
  - Recently viewed context management
  - Checkout state management
  - Product form state management

- **Context API:**
  - AuthContext for authentication state
  - CartContext for shopping cart
  - WishlistContext for saved items
  - RecentlyViewedContext for browsing history

### Data Management
- JSON data files for demo data
  - `admins.json` - Admin accounts
  - `buyers.json` - Buyer profiles and addresses
  - `stores.json` - Seller store information
  - `products.json` - Product catalog
  - `feedback.json` - Customer reviews/feedback
  - `conversations.json` - Message conversations
  - `orders.json` - Order data
  - `sellerTransactions.json` - Payment transactions
  - `users.json` - User accounts
  - `site.json` - Site configuration (contact, bank info)

### Performance Features
- Page loaders for data fetching
- Lazy loading indicators
- Responsive layouts
- Mobile-first design
- Grid-based product displays

### UI Components
- Reusable button components (variants: primary, outline, danger, secondary)
- Input fields with validation
- Textarea for long text
- Select dropdowns
- Modals/dialogs
- Badges for status display
- Star rating component (read-only and interactive)
- Product cards
- Image dropzone for file uploads
- Placeholder images
- Navigation components

### Form Features
- Input validation
- Error display and handling
- Field-level errors
- Form submission handling
- Auto-fill capabilities
- Placeholder text
- Required field indicators
- Character counters
- Input hints/help text

---

## 🎯 **12. BUSINESS LOGIC**

### Pricing & Calculations
- **Subtotal Calculation** - Sum of item prices
- **Delivery Cost** - Flat rate per order
- **Order Total** - Subtotal + delivery cost
- **Transaction Fees** - Bank transfer and COD fees
- **Net Sale** - Subtotal - transaction fees
- **Available Funds** - Net sale - already paid out

### Order Processing
- Order ID generation
- Order status tracking
- Delivery tracking steps
- Order confirmation flow
- Payment method selection
- Address saving options

### Seller Management
- Seller status (active, limited, rejected, pending)
- Seller approval/decline workflow
- Seller restriction capability
- Store visibility management

### Buyer Management
- Buyer status (active, limited)
- Address management
- Purchase history tracking
- Account restrictions

### Payment Processing
- Multiple payment methods (COD, Bank Transfer)
- Payment confirmation workflow
- Payout scheduling (biweekly Monday)
- Fee calculation and deduction
- Payment reference tracking

### Product Management
- Product variation support
- Custom specifications
- Photo galleries
- Product tagging (trending, new, deal, sale)
- Product ratings and reviews
- Stock quantity tracking
- Handling and delivery time specification

---

## 📱 **13. RESPONSIVE DESIGN**

- Mobile-first approach
- Tablet layout optimization
- Desktop layout optimization
- Grid-based layouts (1, 2, 3, 4 columns)
- Responsive navigation
- Touch-friendly buttons and inputs
- Responsive tables
- Mobile sidebar transformations

---

## 🎨 **14. STYLING & THEMING**

- Color-coded status badges
- Theme-aware components
- CSS utility classes (Tailwind)
- Consistent spacing and typography
- Icon integration (Lucide icons)
- Gradient headers/sections
- Card-based layouts
- Rounded corners and shadows

---

## 📊 **15. DATA FEATURES**

### Tracking & Analytics
- Recently viewed products tracking
- Product view tracking
- Order tracking
- Payment tracking
- User activity tracking

### Data Storage
- Client-side session storage for orders
- Browser localStorage for user preferences
- JSON files for static data
- Redux store for state management

---

## ✨ **KEY HIGHLIGHTS**

✅ **Multi-role System** - Buyer, Seller, and Admin roles  
✅ **Complete E-commerce Flow** - Browse, Add to Cart, Checkout, Order Confirmation  
✅ **Seller Dashboard** - Product listing with variations and specifications  
✅ **Admin Controls** - Seller approval, buyer management, payment processing  
✅ **Responsive Design** - Works on mobile, tablet, and desktop  
✅ **Real-time Validation** - Form validation with error messages  
✅ **Modern Tech Stack** - Next.js 15+, React, TypeScript, Redux, Tailwind CSS  
✅ **Multiple Payment Methods** - Cash on Delivery and Bank Transfer  
✅ **Order Management** - Order tracking, status updates, delivery tracking  
✅ **Product Features** - Variations, custom specs, galleries, ratings  
✅ **Messaging System** - Buyer-seller communication  
✅ **Address Management** - Save and manage delivery addresses  
✅ **Wishlist & Recently Viewed** - Personalized shopping experience  
✅ **Search Functionality** - Find products by title, brand, description  

---

**Last Updated:** 2026-09-20  
**Platform:** EDEELZ.lk - Sri Lankan E-commerce Marketplace
