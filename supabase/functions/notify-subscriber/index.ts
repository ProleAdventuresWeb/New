// Supabase Edge Function: notify-subscriber
// ─────────────────────────────────────────────────────────────────────────────
// Triggered via Supabase Database Webhook when a row is inserted into
// the `subscribers` table.
//
// SETUP STEPS:
//   1. Deploy this function:
//        npx supabase functions deploy notify-subscriber --project-ref qkhjnbpvobkwbutldpvm
//
//   2. Add your Resend API key as a secret:
//        npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxxx --project-ref qkhjnbpvobkwbutldpvm
//
//   3. In Supabase Dashboard → Database → Webhooks → Create a new webhook:
//        Name:    on-new-subscriber
//        Table:   subscribers
//        Events:  INSERT
//        URL:     https://qkhjnbpvobkwbutldpvm.supabase.co/functions/v1/notify-subscriber
//        HTTP method: POST
//        Add header: Authorization: Bearer <your-supabase-service-role-key>
//
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

// ── Update these to match your Resend verified domain ─────────────────────
const FROM_ADDRESS = 'notifications@proleadventures.com';
const ADMIN_EMAIL  = 'hello@proleadventures.com';   // where YOU get notified
// ──────────────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  try {
    const body = await req.json();

    // Supabase webhook sends the new record under `record`
    const newRow = body?.record;
    const email  = newRow?.email;

    if (!email) {
      return new Response('No email in payload', { status: 400 });
    }

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not set');
      return new Response('Server config error', { status: 500 });
    }

    // ── 1) Notify you (the admin) ────────────────────────────────────────
    await sendEmail({
      from: FROM_ADDRESS,
      to:   ADMIN_EMAIL,
      subject: '📬 New Prole Adventures subscriber',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#ef4444">New Subscriber</h2>
          <p><strong>${email}</strong> just signed up to the Prole Adventures mailing list.</p>
          <hr style="border:none;border-top:1px solid #333;margin:20px 0"/>
          <p style="color:#888;font-size:12px">
            Prole Adventures · Automated notification
          </p>
        </div>
      `,
    });

    // ── 2) Send welcome email to the subscriber ──────────────────────────
    await sendEmail({
      from: FROM_ADDRESS,
      to:   email,
      subject: 'You\'re on the list — Prole Adventures',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#000;color:#f5f5f5;padding:32px;border-radius:12px">
          <h1 style="font-size:28px;margin-bottom:8px;color:#ffffff">
            You're on the list.
          </h1>
          <p style="color:#a3a3a3;margin-top:0">
            Cheers for signing up to Prole Adventures.
          </p>
          <p style="color:#d4d4d4;line-height:1.7">
            You'll hear from us when adventures go live, new drops are released,
            or something worth knowing about happens. Nothing more, nothing less.
          </p>
          <hr style="border:none;border-top:1px solid #222;margin:28px 0"/>
          <p style="color:#525252;font-size:12px">
            You signed up at proleadventures.com.
            If this was a mistake, just ignore it — no further emails until we have something real to say.
          </p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Edge function error:', err);
    return new Response('Internal error', { status: 500 });
  }
});

// ── Resend API helper ─────────────────────────────────────────────────────
async function sendEmail({
  from, to, subject, html,
}: {
  from: string; to: string; subject: string; html: string;
}) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error ${res.status}: ${text}`);
  }

  return res.json();
}
