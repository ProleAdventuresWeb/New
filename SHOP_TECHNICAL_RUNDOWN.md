# Prole Adventures - Shop Technical Rundown

This document provides a comprehensive overview of the current shop infrastructure for debugging and synchronization.

## 1. System Architecture
The shop is a "Decoupled" system using three main components:

- **Frontend:** React + Vite (deployed on Cloudflare Pages).
- **Database:** Supabase (PostgreSQL) for product metadata and order persistence.
- **Backend (API):** Cloudflare Pages Functions (serverless) for Stripe integration and Printful fulfillment.

---

## 2. The Data Model (Supabase)
We moved from a flat hardcoded file to a normalized relational database.

### Tables:
1. **`products`**: Stores core product info (slug, name, description, base_price_pence, image_url).
2. **`product_variants`**: Stores specific options (Size/Color) linked to Printful.
   - Important column: `printful_variant_id` (The actual SKU needed for manufacturing).
3. **`orders`**: Tracks Stripe payment status.
4. **`order_items`**: Linked to `orders` and `product_variants`.

### Current State:
The `supabase/products_seed.sql` file contains the logic to populate both tables. If you don't see sizes on the site, check if `product_variants` has rows for that product ID.

---

## 3. The Frontend (ShopPage.tsx)
The logic in `src/pages/ShopPage.tsx` was updated to:
1. Fetch products and their nested variants in a single query:
   ```typescript
   supabase.from('products').select('*, product_variants(*)')
   ```
2. Display a `<select>` dropdown for products that have variants.
3. Pass the `variant.id` and `variant.sku` to the checkout function.

**Problem:** If the dropdown is missing, the site you are seeing is **NOT** running the current code in `ShopPage.tsx`.

---

## 4. The Checkout Flow
1. **Frontend:** Calls `POST /create-checkout-session`.
2. **Function (`functions/create-checkout-session.ts`):** 
   - Creates a Stripe Checkout session.
   - Includes `variantId` in the `metadata`.
3. **Stripe:** Handles the credit card payment.
4. **Webhook (`functions/webhook.ts`):**
   - Receives the `checkout.session.completed` event.
   - Retrieves `variantId` from metadata.
   - Fetches the `printful_variant_id` from Supabase.
   - Sends the order to Printful for fulfillment.

---

## 5. Infrastructure Requirements (Cloudflare)
Cloudflare Pages needs the following **Environment Variables** (Settings > Variables) to function:

### Supabase (Needed for API & Webhook):
- `SUPABASE_URL`: Your Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: **CRITICAL.** This is the secret key that allows the webhook to write orders. (Do NOT use the Anon key here).

### Stripe:
- `STRIPE_SECRET_KEY`: For creating sessions.
- `STRIPE_WEBHOOK_SECRET`: For verifying webhook authenticity.

### Printful:
- `PRINTFUL_API_KEY`: For creating the actual fulfillment order.

---

## 6. Troubleshooting Checklist
- **If you see 404/405 errors:** Cloudflare is not recognizing the `functions/` folder. Ensure the folder is at the root of the project and that the build command is just building the frontend (the functions are picked up automatically by Cloudflare).
- **If sizes are missing:** 
   1. Check `product_variants` table in Supabase.
   2. Ensure the code in `ShopPage.tsx` actually has the `<select>` element (it should if you have the latest git pull).
- **Branch Sync:** Ensure Cloudflare is building the `main` branch and that your local `main` matches `origin/main`.
