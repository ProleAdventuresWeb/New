# EMAIL ARCHITECTURE & AUTH AUDIT GUIDE

> **Last Updated:** 2026-09-26  
> **Status:** Reference Document / Ready for Review

This document explains how email dispatching, Brevo integration, and Supabase authentication emails work across Prole Adventures, addressing the Brevo SMTP key expiration warning and the auth redirect configuration.

---

## 1. Executive Summary

### The Brevo SMTP Key Expiration Notice
* **Notice:** Brevo flagged two inactive SMTP keys (`Master Password` and `Supa Key`, suffix: `MxQMt4`).
* **Verdict:** **Your custom shop and transactional emails are 100% safe.** Allowing these keys to expire will **NOT** break customer receipts, shipping notifications, or newsletter welcome emails.
* **Why:** The website's custom shop backend runs on Cloudflare Pages Functions and calls Brevo's **HTTPS REST API** (`https://api.brevo.com/v3/smtp/email`) using `BREVO_API_KEY`. It does **not** connect to `smtp-relay.brevo.com` or use SMTP credentials.
* **What was "Supa Key"?** It was generated for Supabase Custom SMTP in April. Because Custom SMTP was disabled in Supabase, the key has sat idle.

---

## 2. Active Brevo Templates & Code Mapping

All custom Brevo templates created in your dashboard are mapped directly in the Cloudflare backend:

| Brevo Template | ID | Source File | Trigger Event | Mechanism |
| :--- | :---: | :--- | :--- | :--- |
| **Shop Order Confirmed** | `#3` | `functions/webhook.ts` | Stripe checkout completed | REST API (`api.brevo.com`) |
| **Shipping Update** | `#4` | `functions/webhook.ts` | Order updated / tracking added | REST API (`api.brevo.com`) |
| **Order Delivered** | `#5` | `functions/printful-webhook.ts` | Printful package delivered | REST API (`api.brevo.com`) |
| **Newsletter Welcome** | `#6` | `functions/subscribe.ts` | User joins newsletter | REST API (`api.brevo.com`) |
| **Mission Reward** | `#7` | `functions/webhook.ts` | Mission funded via Stripe | REST API (`api.brevo.com`) |

---

## 3. Why the Test Signup Email Was Plain Supabase Text

There are two completely separate "sign up" mechanisms on the site:

### Flow A: Newsletter Subscription (Footer / "Enter the Grid")
* **Code:** `functions/subscribe.ts`
* **Action:** Adds email to Brevo List #5 and sends **Brevo Template #6 ("Newsletter Welcome")**.

### Flow B: Account Registration (`/signup`)
* **Code:** `src/pages/SignupPage.tsx` calling `supabase.auth.signUp()`
* **Action:** Supabase Auth handles password hashing and generates a confirmation link.
* **Why it didn't use Brevo Template #6:** 
  1. This email is generated and sent by **Supabase Auth**, not by your Cloudflare backend.
  2. Because Custom SMTP was toggled off, Supabase sent it from its default fallback mailer (`noreply@mail.app.supabase.io`).
  3. Even when Custom SMTP is enabled, Supabase uses Brevo purely as a transport pipe (SMTP relay) to deliver the template defined in the **Supabase Dashboard**, not the Brevo template library.

---

## 4. Fix for Auth Redirect Snag (`http://localhost:3000`)

### The Problem
When clicking "Confirm Signup" or "Reset Password" in the email, the user was redirected to `http://localhost:3000`.

### The Root Cause
1. In `src/lib/auth.tsx`:
   * Signup redirects to: `${window.location.origin}/account`
   * Password reset redirects to: `${window.location.origin}/reset-password`
2. In Supabase:
   * If the requested URL is not in Supabase's allowed whitelist, Supabase discards it and falls back to the project's **Site URL**, which defaults to `http://localhost:3000`.

### How to Fix (When Ready)
1. Open **Supabase Dashboard** > **Authentication** > **URL Configuration**.
2. **Site URL:** Change from `http://localhost:3000` to `https://proleadventures.com` (or your live domain).
3. **Redirect URLs:** Add the following to the whitelist:
   * `https://proleadventures.com/**`
   * `http://localhost:5173/**` (Vite dev server)
   * `http://localhost:3000/**` (local preview fallback)
4. Save changes.

---

## 5. Options for Account Signup Email Branding (To Decide Later)

When you are ready to style the account confirmation emails, pick one of these two approaches:

### Option 1: Style the Supabase Email Template (Recommended / Cleanest)
* **How it works:**
  1. Generate a new SMTP key in Brevo (**SMTP & API** > **SMTP** > **Generate a new SMTP key**).
  2. In Supabase (**Project Settings** > **Authentication** > **SMTP Settings**), enable Custom SMTP with `smtp-relay.brevo.com` on port `587`.
  3. In Supabase (**Authentication** > **Email Templates** > **Confirm signup**), paste your branded HTML containing `{{ .ConfirmationURL }}`.
* **Outcome:** When someone creates an account, Supabase sends a fully-branded Prole Adventures confirmation email from `contact@proleadventures.com`.

### Option 2: Dual Trigger (Supabase Auth + Brevo Newsletter Welcome)
* **How it works:**
  1. Keep Supabase Auth for confirmation links.
  2. When `/signup` succeeds, automatically trigger `/api/subscribe` as well.
* **Outcome:** The user gets their account verification email from Supabase, AND simultaneously receives Brevo Template #6 ("Newsletter Welcome") and gets added to your subscriber list.

---

## 6. Action Checklist When You Return

- [ ] Allow unused Brevo SMTP keys (`Master Password` & `Supa Key`) to expire in Brevo, or delete them manually.
- [ ] Update Supabase **Site URL** and **Redirect URLs** in the Supabase Dashboard.
- [ ] Decide between Option 1 (custom HTML in Supabase Email Templates) or Option 2 (dual trigger) for account signups.
