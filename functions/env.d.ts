export interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  BREVO_API_KEY: string;
  BREVO_SENDER_EMAIL: string;
  PRINTFUL_API_KEY: string;
  // Zoho SMTP for operational inbox alerts (no Brevo credits used)
  ZOHO_SMTP_USER: string;
  ZOHO_SMTP_PASS: string;
}
