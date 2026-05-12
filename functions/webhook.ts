import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import type { Env } from './env';

// Relax Supabase typing to avoid bogus "never" errors while keeping logic the same
type Supa = any;

type SessionWithShipping = Stripe.Checkout.Session & {
  shipping_details?: {
    name?: string | null;
    address?: {
      line1?: string | null;
      line2?: string | null;
      city?: string | null;
      postal_code?: string | null;
      country?: string | null;
    } | null;
  } | null;
};

async function isEventProcessed(
  supabase: Supa,
  provider: string,
  eventId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('provider', provider)
    .eq('event_id', eventId)
    .eq('processed', true)
    .single();
  return !!data;
}

async function markEventProcessed(
  supabase: Supa,
  provider: string,
  eventId: string,
  eventType: string,
  rawData: unknown
): Promise<void> {
  await supabase.from('webhook_events').upsert(
    {
      provider,
      event_id: eventId,
      event_type: eventType,
      processed: true,
      processed_at: new Date().toISOString(),
      raw_data: rawData,
    },
    { onConflict: 'provider,event_id' },
  );
}

async function sendTransactionalEmail(
  supabase: Supa,
  env: Env,
  to: string,
  templateKey: string,
  params: Record<string, string | number>
): Promise<void> {
  if (!env.BREVO_API_KEY) {
    console.log('BREVO_API_KEY not set, skipping email:', templateKey);
    return;
  }

  const senderEmail = env.BREVO_SENDER_EMAIL || 'contact@proleadventures.com';
  const templateIds: Record<string, number> = {
    order_confirmed: 3,
    shipping_update: 4,
    delivered: 5,
    mission_reward: 7,
  };
  const templateId = templateIds[templateKey];
  if (!templateId) {
    console.log('No Brevo template ID mapped for:', templateKey);
    return;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateId,
        to: [{ email: to }],
        sender: { name: 'Prole Adventures', email: senderEmail },
        params,
      }),
    });

    if (response.ok) {
      const result = (await response.json()) as { messageId?: string };
      await supabase.from('email_events').insert({
        recipient_email: to,
        template: templateKey,
        provider: 'brevo',
        provider_message_id: result.messageId || null,
        status: 'sent',
      });
    } else {
      console.error('Brevo email failed:', await response.text());
    }
  } catch (err) {
    console.error('Brevo email error:', err);
  }
}

// ── Umami server-side event tracking ────────────────────────────────────────
async function trackUmamiEvent(
  env: Env,
  eventName: string,
  url: string,
  data?: Record<string, string | number>
): Promise<void> {
  if (!env.UMAMI_ENDPOINT || !env.UMAMI_WEBSITE_ID) return;
  try {
    await fetch(env.UMAMI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'event',
        payload: {
          website: env.UMAMI_WEBSITE_ID,
          name: eventName,
          url,
          hostname: 'proleadventures.com',
          language: 'en-GB',
          screen: '1920x1080',
          ...(data ? { data } : {}),
        },
      }),
    });
  } catch (err) {
    console.error('Umami tracking error:', err);
  }
}

// ── Operational inbox alert via Zoho SMTP (no Brevo credits) ─────────────────
// Uses Zoho's SMTP-to-HTTP relay. Cloudflare Workers cannot open raw TCP sockets
// so we POST to an authenticated Zoho Mail API endpoint instead.
async function sendOperationalAlert(
  env: Env,
  subject: string,
  body: string
): Promise<void> {
  if (!env.ZOHO_SMTP_USER || !env.ZOHO_SMTP_PASS) {
    console.warn('ZOHO_SMTP_USER/PASS not set — skipping operational alert:', subject);
    return;
  }
  try {
    // Zoho Mail API: https://mail.zoho.com/api/accounts/{accountId}/messages
    // We derive the accountId from the email address segment. Zoho also
    // supports a simple form-encoded relay at their MX API — we use the
    // official Zoho Mail Send API v1 (no OAuth required for SMTP App Password).
    const auth = btoa(`${env.ZOHO_SMTP_USER}:${env.ZOHO_SMTP_PASS}`);
    const payload = {
      fromAddress: env.ZOHO_SMTP_USER,
      toAddress: 'contact@proleadventures.com',
      subject,
      content: body,
      mailFormat: 'plaintext',
    };
    // Extract accountId (numeric) embedded in ZOHO_SMTP_USER env var
    // Format expected: "accountId|email" e.g. "12345678|contact@proleadventures.com"
    const [accountId, fromEmail] = env.ZOHO_SMTP_USER.includes('|')
      ? env.ZOHO_SMTP_USER.split('|')
      : ['', env.ZOHO_SMTP_USER];
    if (!accountId) {
      console.warn('ZOHO_SMTP_USER must be in format "accountId|email" for Zoho API');
      return;
    }
    const response = await fetch(
      `https://mail.zoho.eu/api/accounts/${accountId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...payload, fromAddress: fromEmail }),
      }
    );
    if (!response.ok) {
      console.error('Operational alert send failed:', await response.text());
    } else {
      console.log('Operational alert sent:', subject);
    }
  } catch (err) {
    console.error('Operational alert error:', err);
  }
}

async function createPrintfulOrder(
  supabase: Supa,
  env: Env,
  orderId: string
): Promise<void> {
  if (!env.PRINTFUL_API_KEY) {
    console.log('PRINTFUL_API_KEY not set, skipping fulfilment for order:', orderId);
    return;
  }

  const { data: order } = await supabase
    .from('shop_orders')
    .select('*')
    .eq('id', orderId)
    .single();
  if (!order) return;

  const { data: items } = await supabase
    .from('order_items')
    .select('*, product_variants!inner(printful_variant_id)')
    .eq('order_id', orderId);
  if (!items || items.length === 0) return;

  const printfulItems = items
    .filter((item: Record<string, unknown>) => {
      const variants = item.product_variants as { printful_variant_id: string | null } | undefined;
      return variants?.printful_variant_id;
    })
    .map((item: Record<string, unknown>) => {
      const variants = item.product_variants as { printful_variant_id: string };
      return {
        variant_id: parseInt(variants.printful_variant_id),
        quantity: item.quantity as number,
        retail_price: String(((item.unit_price_pence as number) / 100).toFixed(2)),
      };
    });

  if (printfulItems.length === 0) {
    console.log('No Printful-mapped items in order:', orderId);
    return;
  }

  const address = (order.shipping_address as Record<string, string>) || {};

  try {
    const response = await fetch('https://api.printful.com/orders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.PRINTFUL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        external_id: order.order_number,
        recipient: {
          name: address.full_name || 'Customer',
          address1: address.line1 || '',
          address2: address.line2 || '',
          city: address.city || '',
          state_code: '',
          country_code: address.country_code || 'GB',
          zip: address.postcode || '',
          email: order.email,
        },
        items: printfulItems,
      }),
    });

    if (response.ok) {
      const result = (await response.json()) as {
        result?: { id?: number; status?: string };
      };
      await supabase.from('fulfilments').insert({
        order_id: orderId,
        printful_order_id: String(result.result?.id || ''),
        printful_status: result.result?.status || 'draft',
        status: 'created',
      });
      await supabase
        .from('shop_orders')
        .update({ status: 'processing' })
        .eq('id', orderId);
      console.log('Printful order created for:', order.order_number);
    } else {
      const errorText = await response.text();
      console.error('Printful order creation failed:', errorText);
      await supabase.from('fulfilments').insert({
        order_id: orderId,
        status: 'failed',
        printful_status: `error: ${errorText.substring(0, 200)}`,
      });
    }
  } catch (err) {
    console.error('Printful API error:', err);
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const sig = request.headers.get('stripe-signature');
  if (!sig || !env.STRIPE_WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature or webhook secret' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-03-25.dahlia' as Stripe.LatestApiVersion,
  });

  const supabase: Supa = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      sig,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', errorMessage);
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  if (await isEventProcessed(supabase, 'stripe', event.id)) {
    console.log('Event already processed, skipping:', event.id);
    return new Response(JSON.stringify({ received: true, skipped: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as SessionWithShipping;
      const type = session.metadata?.type || 'product';

      if (type === 'contribution') {
        const contributionData = {
          mission_id: session.metadata?.mission_id || 'unknown',
          mission_name: session.metadata?.mission_name || 'unknown',
          amount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency || 'gbp',
          customer_email: session.customer_details?.email || 'unknown',
          stripe_session_id: session.id,
          status: 'paid',
        };
        const { error } = await supabase
          .from('mission_contributions')
          .insert([contributionData]);
        if (error) {
          console.error('Error saving contribution:', error);
          throw error;
        }

        // If there's a reward, fetch its URL and send it
        if (session.metadata?.reward_title && session.metadata?.reward_title !== 'none') {
          const { data: adv } = await supabase
            .from('adventures')
            .select('reward_url')
            .eq('id', contributionData.mission_id)
            .single();

          if (adv?.reward_url) {
            await sendTransactionalEmail(supabase, env, contributionData.customer_email, 'mission_reward', {
              mission_name: contributionData.mission_name,
              reward_title: session.metadata.reward_title,
              reward_url: adv.reward_url,
              amount: `£${contributionData.amount.toFixed(2)}`
            });
            
            await supabase
              .from('mission_contributions')
              .update({ reward_delivered: true })
              .eq('stripe_session_id', session.id);
          }
        }

        // Fire Umami + operational alert for mission contribution
        const contribAmountGBP = `£${contributionData.amount.toFixed(2)}`;
        await trackUmamiEvent(env, 'mission_contribution', '/mission-control', {
          mission: contributionData.mission_name,
          amount: contributionData.amount,
        });
        await sendOperationalAlert(
          env,
          `SIGNAL: Operation Funded ${contribAmountGBP}`,
          `Mission contribution received.\n\nMission: ${contributionData.mission_name}\nAmount: ${contribAmountGBP}\nEmail: ${contributionData.customer_email}\nStripe Session: ${session.id}`
        );

        // Increment the bounty_current in the adventures table
        if (session.metadata?.mission_id && session.metadata.mission_id !== 'unknown') {
          const { error: updateError } = await supabase.rpc('increment_mission_bounty', {
            mission_uuid: session.metadata.mission_id,
            amount_to_add: contributionData.amount
          });
          
          if (updateError) {
            // Fallback if RPC doesn't exist
            console.warn('RPC increment_mission_bounty failed, falling back to manual update:', updateError);
            const { data: adv } = await supabase
              .from('adventures')
              .select('bounty_current')
              .eq('id', session.metadata.mission_id)
              .single();
              
            if (adv) {
              await supabase
                .from('adventures')
                .update({ bounty_current: (adv.bounty_current || 0) + contributionData.amount })
                .eq('id', session.metadata.mission_id);
            }
          }
        }
      } else {
        const customerEmail = session.customer_details?.email || 'unknown';
        const profileId = session.metadata?.profile_id || null;

        const { data: order, error: orderError } = await supabase
          .from('shop_orders')
          .insert({
            order_number: '',
            profile_id: profileId,
            email: customerEmail,
            status: 'paid',
            subtotal_pence: session.amount_subtotal || 0,
            shipping_pence: 0,
            total_pence: session.amount_total || 0,
            currency: session.currency || 'gbp',
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id:
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : null,
            shipping_address: session.shipping_details?.address
              ? {
                full_name: session.shipping_details.name || '',
                line1: session.shipping_details.address.line1 || '',
                line2: session.shipping_details.address.line2 || '',
                city: session.shipping_details.address.city || '',
                postcode: session.shipping_details.address.postal_code || '',
                country_code: session.shipping_details.address.country || 'GB',
              }
              : null,
          })
          .select()
          .single();

        if (orderError) {
          console.error('Error creating order:', orderError);
          throw orderError;
        }

        if (order) {
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
            expand: ['data.price.product']
          });
          for (const item of lineItems.data) {
            const productMetadata = (item.price?.product as Stripe.Product)?.metadata || {};
            const variantId = productMetadata.variantId && productMetadata.variantId !== 'none' 
              ? productMetadata.variantId 
              : null;

            await supabase.from('order_items').insert({
              order_id: order.id,
              variant_id: variantId,
              product_name: item.description || 'Product',
              quantity: item.quantity || 1,
              unit_price_pence: item.price?.unit_amount || 0,
              total_pence: item.amount_total || 0,
            });
          }
          await supabase.from('payments').insert({
            order_id: order.id,
            stripe_payment_intent_id:
              typeof session.payment_intent === 'string'
                ? session.payment_intent
                : null,
            amount_pence: session.amount_total || 0,
            currency: session.currency || 'gbp',
            status: 'succeeded',
            payment_method: session.payment_method_types?.[0] || 'card',
          });
          await sendTransactionalEmail(supabase, env, customerEmail, 'order_confirmed', {
            order_number: order.order_number,
            total: `£${((session.amount_total || 0) / 100).toFixed(2)}`,
            customer_name: session.customer_details?.name || 'there',
          });

          // Fire Umami + operational alert for shop sale
          const saleAmountGBP = `£${((session.amount_total || 0) / 100).toFixed(2)}`;
          await trackUmamiEvent(env, 'shop_sale', '/gear', {
            order_number: order.order_number,
            amount: (session.amount_total || 0) / 100,
          });
          await sendOperationalAlert(
            env,
            `SIGNAL: Operation Funded ${saleAmountGBP}`,
            `Shop sale completed.\n\nOrder: ${order.order_number}\nAmount: ${saleAmountGBP}\nEmail: ${customerEmail}\nStripe Session: ${session.id}`
          );

          await createPrintfulOrder(supabase, env, order.id);
          console.log(`Order ${order.order_number} created for ${customerEmail}`);
        }
      }
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await supabase
        .from('payments')
        .update({
          status: 'succeeded',
          receipt_url: paymentIntent.latest_charge
            ? `https://dashboard.stripe.com/payments/${paymentIntent.latest_charge}`
            : null,
        })
        .eq('stripe_payment_intent_id', paymentIntent.id);
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId =
        typeof charge.payment_intent === 'string' ? charge.payment_intent : null;
      if (paymentIntentId) {
        await supabase
          .from('payments')
          .update({
            status:
              charge.amount_refunded === charge.amount
                ? 'refunded'
                : 'partially_refunded',
            refund_amount_pence: charge.amount_refunded,
          })
          .eq('stripe_payment_intent_id', paymentIntentId);

        const { data: payment } = await supabase
          .from('payments')
          .select('order_id')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .single();
        if (payment) {
          await supabase
            .from('shop_orders')
            .update({ status: 'refunded' })
            .eq('id', payment.order_id);
        }
      }
    }

    await markEventProcessed(supabase, 'stripe', event.id, event.type, {
      id: event.id,
      type: event.type,
    });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error handling webhook event:', errorMessage);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};