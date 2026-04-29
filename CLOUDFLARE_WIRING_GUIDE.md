# PROLE ADVENTURES — CLOUDFLARE & SECURITY WIRING GUIDE

This document outlines the steps to securely wire your new infrastructure (Supabase, Stripe, Printful) to your Cloudflare Pages environment following the recent security rotation.

## 1. Environment Variables & Secrets
**CRITICAL**: Never store secret keys in `.env` or `wrangler.toml` files that are committed to Git. Use the Cloudflare Dashboard or Wrangler CLI.

### Frontend (Public)
*These can be added in the Cloudflare Pages Dashboard under **Settings > Variables > Production**.*

| Variable | Description | Source |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Your new Supabase Project URL | Supabase Dashboard |
| `VITE_SUPABASE_ANON_KEY` | Public API key for frontend auth | Supabase Dashboard |

### Backend Functions (Secrets)
*These MUST be added as **Secrets** to prevent them from being visible in build logs.*

| Secret Key | Description | Source |
| :--- | :--- | :--- |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin access for DB functions | Supabase (Private) |
| `STRIPE_SECRET_KEY` | New Stripe API Secret | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | For verifying Stripe events | Stripe > Developers > Webhooks |
| `PRINTFUL_API_KEY` | New Printful Access Token | Printful Developers |
| `BREVO_API_KEY` | For sending shipping emails | Brevo Dashboard |

---

## 2. Stripe Webhook Wiring
1. Go to your **Stripe Dashboard > Developers > Webhooks**.
2. Add an endpoint: `https://your-domain.com/api/webhook`.
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`.
4. Copy the **Signing Secret** and add it to Cloudflare as `STRIPE_WEBHOOK_SECRET`.

---

## 3. Printful Webhook Wiring
1. In your **Printful Dashboard**, go to **Settings > API > Webhooks**.
2. Set the Webhook URL to: `https://your-domain.com/api/printful-webhook`.
3. Select events: `package_shipped`, `order_canceled`, `order_failed`.
4. Cloudflare will automatically handle the incoming POST requests via your `functions/printful-webhook.ts`.

---

## 4. Supabase Database Hardening
Since you have a new Supabase account:
1. **Enable RLS**: Ensure Row Level Security is ON for `posts`, `adventures`, and `profiles`.
2. **Apply Security Policies**: Run the `supabase/blog_security.sql` script in the Supabase SQL Editor to ensure only public posts are readable by anonymous users.

---

## 5. Deployment Workflow
Once your keys are set in Cloudflare:
1. `git push origin main`
2. Cloudflare will trigger a build.
3. Check the **Functions** tab in Cloudflare to ensure the API endpoints are active.

> [!NOTE]
> If you encounter a "Module not found" error during the Cloudflare build, ensure that your `node_version` is set to `18` or higher in the Cloudflare build settings.
