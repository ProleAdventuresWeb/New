import { createClient } from '@supabase/supabase-js';
import type { Env } from './env';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { email } = (await request.json()) as { email: string };

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // 1. Save to Supabase
    const { error: dbError } = await supabase
      .from('subscribers')
      .insert([{ email }]);

    if (dbError) {
      // Check for duplicate email
      if (dbError.code === '23505') {
        return new Response(JSON.stringify({ error: 'Duplicate' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      throw dbError;
    }

    // 2. Add contact to Brevo list (List ID: 5) for automation workflows
    if (env.BREVO_API_KEY) {
      const contactResponse = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'api-key': env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          listIds: [5],
          updateEnabled: true,
        }),
      });

      if (!contactResponse.ok) {
        console.error('Brevo contact creation failed:', await contactResponse.text());
      }
    }

    // 3. Send Welcome Email via Brevo (Template ID: 6)
    if (env.BREVO_API_KEY) {
      const senderEmail = env.BREVO_SENDER_EMAIL || 'contact@proleadventures.com';
      
      const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: 6, // Newsletter Welcome Template
          to: [{ email }],
          sender: { name: 'Prole Adventures', email: senderEmail },
          params: {
            email: email
          },
        }),
      });

      if (!brevoResponse.ok) {
        console.error('Brevo welcome email failed:', await brevoResponse.text());
      }
    } else {
      console.warn('BREVO_API_KEY not set, skipping welcome email');
    }

    // 4. Fire Umami server-side event — bypasses ad-blockers
    if (env.UMAMI_ENDPOINT && env.UMAMI_WEBSITE_ID) {
      fetch(env.UMAMI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'event',
          payload: {
            website: env.UMAMI_WEBSITE_ID,
            name: 'newsletter_signup',
            url: '/subscribe',
            hostname: 'proleadventures.com',
            language: 'en-GB',
            screen: '1920x1080',
          },
        }),
      }).catch((err) => console.error('Umami tracking error:', err));
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('Subscription error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
