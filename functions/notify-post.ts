import { createClient } from '@supabase/supabase-js';
import type { Env } from './env';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify admin user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user || user.email !== 'contact@proleadventures.com') {
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const { postId, slug, title, excerpt, accessCode } = (await request.json()) as {
      postId: string;
      slug: string;
      title: string;
      excerpt: string;
      accessCode?: string;
    };

    if (!slug || !title) {
      return new Response(JSON.stringify({ error: 'Slug and title are required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Fetch all active subscribers
    const { data: subscribers, error: subError } = await supabase
      .from('subscribers')
      .select('email');

    if (subError) {
      console.error('Error fetching subscribers:', subError);
      return new Response(JSON.stringify({ error: 'Failed to fetch subscribers' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const subscriberEmails = (subscribers || [])
      .map((s: { email: string }) => s.email)
      .filter(Boolean);

    if (subscriberEmails.length === 0) {
      return new Response(JSON.stringify({ success: true, count: 0, message: 'No subscribers found' }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    const origin = request.headers.get('origin') || 'https://proleadventures.com';
    const unlockUrl = accessCode 
      ? `${origin}/read/${slug}?code=${encodeURIComponent(accessCode)}`
      : `${origin}/read/${slug}`;

    const senderEmail = env.BREVO_SENDER_EMAIL || 'contact@proleadventures.com';

    // Broadcast in batches via Brevo
    let sentCount = 0;
    if (env.BREVO_API_KEY) {
      const BATCH_SIZE = 50;
      for (let i = 0; i < subscriberEmails.length; i += BATCH_SIZE) {
        const batch = subscriberEmails.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async (email) => {
          try {
            const htmlContent = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #e5e5e5; padding: 32px; border-radius: 16px; border: 1px solid #262626;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <span style="font-size: 11px; font-weight: bold; letter-spacing: 0.2em; text-transform: uppercase; color: #ef4444; background: rgba(239, 68, 68, 0.1); padding: 4px 12px; border-radius: 9999px; border: 1px solid rgba(239, 68, 68, 0.2);">
                    Intelligence Dispatch
                  </span>
                </div>
                
                <h1 style="color: #ffffff; font-size: 24px; font-weight: bold; line-height: 1.3; margin: 0 0 16px 0; text-align: center;">
                  ${title}
                </h1>
                
                <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
                  ${excerpt}
                </p>

                ${accessCode ? `
                <div style="background: #171717; border: 1px dashed #ef4444; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                  <p style="color: #737373; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 8px 0;">
                    Contributor Access Clearance Code
                  </p>
                  <p style="color: #ef4444; font-family: monospace; font-size: 22px; font-weight: bold; letter-spacing: 0.1em; margin: 0;">
                    ${accessCode}
                  </p>
                </div>
                ` : ''}

                <div style="text-align: center; margin: 32px 0 16px 0;">
                  <a href="${unlockUrl}" style="background: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block; letter-spacing: 0.05em; text-transform: uppercase;">
                    ${accessCode ? 'Unlock Full Intelligence' : 'Read Full Dispatch'}
                  </a>
                </div>

                <hr style="border: none; border-top: 1px solid #262626; margin: 32px 0 20px 0;" />
                <p style="color: #525252; font-size: 11px; text-align: center; margin: 0;">
                  Prole Adventures · You are receiving this because you supported or subscribed to Prole Adventures.
                </p>
              </div>
            `;

            const res = await fetch('https://api.brevo.com/v3/smtp/email', {
              method: 'POST',
              headers: {
                'api-key': env.BREVO_API_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: [{ email }],
                sender: { name: 'Prole Adventures', email: senderEmail },
                subject: `📡 New Dispatch: ${title}`,
                htmlContent,
              }),
            });

            if (res.ok) {
              sentCount++;
            }
          } catch (e) {
            console.error(`Failed to send dispatch to ${email}:`, e);
          }
        }));
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      count: sentCount,
      totalSubscribers: subscriberEmails.length 
    }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err: any) {
    console.error('Notify post publish error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};
