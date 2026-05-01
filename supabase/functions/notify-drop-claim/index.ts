// Supabase Edge Function: notify-drop-claim
// ─────────────────────────────────────────────────────────────────────────────
// Triggered via Supabase Database Webhook when a row is inserted into
// the `drop_claims` table (i.e., someone claims a geocache drop).
//
// SETUP STEPS:
//   1. Deploy:
//        npx supabase functions deploy notify-drop-claim --project-ref qkhjnbpvobkwbutldpvm
//
//   2. Secret already set from notify-subscriber. If not:
//        npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxxx --project-ref qkhjnbpvobkwbutldpvm
//
//   3. In Supabase Dashboard → Database → Webhooks → Create webhook:
//        Name:    on-drop-claimed
//        Table:   drop_claims
//        Events:  INSERT
//        URL:     https://qkhjnbpvobkwbutldpvm.supabase.co/functions/v1/notify-drop-claim
//        HTTP method: POST
//        Header:  Authorization: Bearer <service-role-key>
//
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY   = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const FROM_ADDRESS = 'notifications@proleadventures.com';
const ADMIN_EMAIL  = 'contact@proleadventures.com';

serve(async (req: Request) => {
  try {
    const body   = await req.json();
    const claim  = body?.record;

    if (!claim?.drop_id) {
      return new Response('No drop_id in payload', { status: 400 });
    }

    // Fetch the drop details so we can include them in the email
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: drop } = await supabase
      .from('drops')
      .select('title, region, drop_number')
      .eq('id', claim.drop_id)
      .single();

    const dropName   = drop?.title ?? `Drop #${drop?.drop_number ?? '?'}`;
    const dropRegion = drop?.region ?? 'Unknown';

    await sendEmail({
      from: FROM_ADDRESS,
      to:   ADMIN_EMAIL,
      subject: `🎯 Drop Claimed: ${dropName}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#ef4444">A drop has been claimed!</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#888;width:120px">Drop</td>
                <td style="padding:8px 0;font-weight:bold">${dropName}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Region</td>
                <td style="padding:8px 0">${dropRegion}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Found by</td>
                <td style="padding:8px 0;font-weight:bold">${claim.finder_alias}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Message</td>
                <td style="padding:8px 0">${claim.finder_message || '(none left)'}</td></tr>
            <tr><td style="padding:8px 0;color:#888">Time</td>
                <td style="padding:8px 0">${new Date().toLocaleString('en-GB')}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
          <p style="color:#888;font-size:12px">
            Log into Supabase to view full claim details and confirm the drop as claimed.
          </p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Drop claim notification error:', err);
    return new Response('Internal error', { status: 500 });
  }
});

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
    throw new Error(`Resend ${res.status}: ${text}`);
  }

  return res.json();
}
