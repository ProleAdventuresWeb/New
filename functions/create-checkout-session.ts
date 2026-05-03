import Stripe from 'stripe';
import type { Env } from './env';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-03-25.dahlia' as Stripe.LatestApiVersion,
  });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const { name, price, quantity, productId, variantId, sku, mode, 
          missionId, missionName, missionSlug, rewardType, rewardTitle, profileId } = body as Record<string, string | number>;

  if (!name || !price || !quantity) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const isContribution = mode === 'contribution';
  const origin = request.headers.get('origin') || '';

  try {
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: String(name),
              metadata: {
                productId: String(productId || 'none'),
                variantId: String(variantId || 'none'),
                sku: String(sku || 'none'),
                missionId: String(missionId || 'none'),
              },
            },
            unit_amount: Number(price),
          },
          quantity: Number(quantity),
        },
      ],
      mode: 'payment',
      metadata: {
        product_name: String(name),
        product_id: String(productId || 'none'),
        variant_id: String(variantId || 'none'),
        sku: String(sku || 'none'),
        mission_id: String(missionId || 'none'),
        mission_name: String(missionName || 'none'),
        mission_slug: String(missionSlug || 'none'),
        reward_type: String(rewardType || 'none'),
        reward_title: String(rewardTitle || 'none'),
        type: isContribution ? 'contribution' : 'product',
        profile_id: String(profileId || 'none'),
      },
    };

    if (isContribution) {
      sessionOptions.success_url = `${origin}/prole-control?success=true&mission_id=${missionId}&session_id={CHECKOUT_SESSION_ID}`;
      sessionOptions.cancel_url = `${origin}/prole-control`;
      sessionOptions.payment_intent_data = {
        metadata: {
          mission_id: String(missionId || 'none'),
          mission_name: String(missionName || 'none'),
          mission_slug: String(missionSlug || 'none'),
          reward_type: String(rewardType || 'none'),
          reward_title: String(rewardTitle || 'none'),
          type: 'contribution',
        },
      };
    } else {
      sessionOptions.success_url = `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`;
      sessionOptions.cancel_url = `${origin}/shop/cancel`;
      sessionOptions.shipping_address_collection = {
        allowed_countries: ['GB', 'US', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT'],
      };
      sessionOptions.payment_intent_data = {
        metadata: {
          product_id: String(productId || 'none'),
          variant_id: String(variantId || 'none'),
          type: 'product',
          profile_id: String(profileId || 'none'),
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200, headers: corsHeaders,
    });
  } catch (error: unknown) {
    console.error('Stripe error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown Stripe error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: corsHeaders,
    });
  }
};
