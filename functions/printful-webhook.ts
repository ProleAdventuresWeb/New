import { createClient } from '@supabase/supabase-js';
import type { Env } from './env';

type Supa = any;

interface PrintfulWebhookPayload {
  type: string;
  created: number;
  retries: number;
  store: number;
  data: {
    order: {
      id: number;
      external_id: string;
      status: string;
      shipping: string;
      shipping_service_name: string;
      created: number;
      updated: number;
      recipient: {
        name: string;
        email: string;
      };
      shipments?: Array<{
        id: number;
        carrier: string;
        service: string;
        tracking_number: string;
        tracking_url: string;
        ship_date: string;
        delivered_at?: string;
        estimated_delivery?: string;
        location?: string;
      }>;
    };
  };
}

function mapPrintfulStatus(printfulStatus: string): string {
  const mapping: Record<string, string> = {
    draft: 'pending',
    pending: 'pending',
    failed: 'failed',
    canceled: 'cancelled',
    in_process: 'in_production',
    onhold: 'pending',
    partial: 'in_production',
    fulfilled: 'shipped',
  };
  return mapping[printfulStatus] || 'pending';
}

async function sendShippingEmail(
  env: Env,
  supabase: Supa,
  email: string,
  orderNumber: string,
  trackingNumber: string,
  carrier: string,
  trackingUrl: string
): Promise<void> {
  if (!env.BREVO_API_KEY) return;
  const senderEmail = env.BREVO_SENDER_EMAIL || 'contact@proleadventures.com';
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateId: 2,
        to: [{ email }],
        sender: { name: 'Prole Adventures', email: senderEmail },
        params: { order_number: orderNumber, tracking_number: trackingNumber, carrier, tracking_url: trackingUrl },
      }),
    });
    await supabase.from('email_events').insert({
      recipient_email: email,
      template: 'shipping_update',
      provider: 'brevo',
      status: 'sent',
    });
  } catch (err) {
    console.error('Shipping email error:', err);
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const supabase: Supa = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  let payload: PrintfulWebhookPayload;
  try {
    payload = (await request.json()) as PrintfulWebhookPayload;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!payload?.type || !payload?.data?.order) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const eventId = `printful_${payload.data.order.id}_${payload.type}_${payload.created}`;

  const { data: existing } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('provider', 'printful')
    .eq('event_id', eventId)
    .eq('processed', true)
    .single();

  if (existing) {
    return new Response(JSON.stringify({ received: true, skipped: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const printfulOrder = payload.data.order;
    const printfulOrderId = String(printfulOrder.id);

    const { data: fulfilment } = await supabase
      .from('fulfilments')
      .select('id, order_id')
      .eq('printful_order_id', printfulOrderId)
      .single();

    if (!fulfilment) {
      console.log('No fulfilment found for Printful order:', printfulOrderId);
      await supabase.from('webhook_events').upsert(
        {
          provider: 'printful',
          event_id: eventId,
          event_type: payload.type,
          processed: true,
          processed_at: new Date().toISOString(),
          raw_data: { note: 'No matching fulfilment' },
        },
        { onConflict: 'provider,event_id' },
      );
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const newStatus = mapPrintfulStatus(printfulOrder.status);
    const fulfilmentUpdate: Record<string, unknown> = {
      printful_status: printfulOrder.status,
      status: newStatus,
    };

    if (payload.type === 'package_shipped' && printfulOrder.shipments?.length) {
      const shipment = printfulOrder.shipments[0];
      fulfilmentUpdate.carrier = shipment.carrier;
      fulfilmentUpdate.tracking_number = shipment.tracking_number;
      fulfilmentUpdate.tracking_url = shipment.tracking_url;
      fulfilmentUpdate.shipped_at = shipment.ship_date;
      fulfilmentUpdate.status = 'shipped';
      if (shipment.estimated_delivery) {
        fulfilmentUpdate.estimated_delivery = shipment.estimated_delivery;
      }
      await supabase.from('shipping_events').insert({
        fulfilment_id: fulfilment.id,
        status: 'shipped',
        description: `Package shipped via ${shipment.carrier} (${shipment.service})`,
        occurred_at: shipment.ship_date || new Date().toISOString(),
        raw_data: shipment,
      });
      await supabase
        .from('shop_orders')
        .update({ status: 'shipped' })
        .eq('id', fulfilment.order_id);

      const { data: order } = await supabase
        .from('shop_orders')
        .select('email, order_number')
        .eq('id', fulfilment.order_id)
        .single();
      if (order) {
        await sendShippingEmail(
          env,
          supabase,
          order.email,
          order.order_number,
          shipment.tracking_number,
          shipment.carrier,
          shipment.tracking_url,
        );
      }
    }

    if (payload.type === 'order_canceled') {
      fulfilmentUpdate.status = 'cancelled';
      await supabase.from('shipping_events').insert({
        fulfilment_id: fulfilment.id,
        status: 'cancelled',
        description: 'Fulfilment cancelled by Printful',
        occurred_at: new Date().toISOString(),
      });
    }

    if (payload.type === 'order_failed') {
      fulfilmentUpdate.status = 'failed';
      await supabase.from('shipping_events').insert({
        fulfilment_id: fulfilment.id,
        status: 'failed',
        description: 'Fulfilment failed at Printful',
        occurred_at: new Date().toISOString(),
      });
    }

    await supabase
      .from('fulfilments')
      .update(fulfilmentUpdate)
      .eq('id', fulfilment.id);

    await supabase.from('webhook_events').upsert(
      {
        provider: 'printful',
        event_id: eventId,
        event_type: payload.type,
        processed: true,
        processed_at: new Date().toISOString(),
        raw_data: { printful_order_id: printfulOrderId, type: payload.type },
      },
      { onConflict: 'provider,event_id' },
    );

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Printful webhook error:', errorMessage);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
