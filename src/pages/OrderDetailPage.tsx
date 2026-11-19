import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Package, Truck, ArrowLeft, Loader2, ExternalLink, CheckCircle, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Head } from '../components/Head';
import { PageLoader } from '../components/PageLoader';

interface OrderDetail {
  id: string;
  order_number: string;
  status: string;
  email: string;
  subtotal_pence: number;
  shipping_pence: number;
  total_pence: number;
  currency: string;
  shipping_address: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  variant_name: string | null;
  sku: string | null;
  quantity: number;
  unit_price_pence: number;
  total_pence: number;
}

interface Fulfilment {
  id: string;
  status: string;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
}

interface ShippingEvent {
  id: string;
  status: string;
  location: string | null;
  description: string | null;
  occurred_at: string;
}

const statusSteps = ['paid', 'processing', 'fulfilled', 'shipped', 'delivered'];

const statusConfig: Record<string, { icon: React.ElementType; color: string }> = {
  pending: { icon: Clock, color: 'text-yellow-400' },
  paid: { icon: CheckCircle, color: 'text-green-400' },
  processing: { icon: Package, color: 'text-blue-400' },
  fulfilled: { icon: Package, color: 'text-purple-400' },
  shipped: { icon: Truck, color: 'text-cyan-400' },
  delivered: { icon: CheckCircle, color: 'text-green-400' },
  cancelled: { icon: Clock, color: 'text-red-400' },
  refunded: { icon: Clock, color: 'text-neutral-400' },
};

export const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [fulfilment, setFulfilment] = useState<Fulfilment | null>(null);
  const [shippingEvents, setShippingEvents] = useState<ShippingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!supabase || !user || !orderId) return;

      // Fetch order
      const { data: orderData } = await supabase
        .from('shop_orders')
        .select('*')
        .eq('id', orderId)
        .eq('profile_id', user.id)
        .single();

      if (orderData) {
        setOrder(orderData);

        // Fetch items
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId);

        if (itemsData) setItems(itemsData);

        // Fetch fulfilment
        const { data: fulfilmentData } = await supabase
          .from('fulfilments')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (fulfilmentData) {
          setFulfilment(fulfilmentData);

          // Fetch shipping events
          const { data: eventsData } = await supabase
            .from('shipping_events')
            .select('*')
            .eq('fulfilment_id', fulfilmentData.id)
            .order('occurred_at', { ascending: false });

          if (eventsData) setShippingEvents(eventsData);
        }
      }

      setLoading(false);
    };

    fetchOrder();
  }, [user, orderId]);

  const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`;
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="pt-24 min-h-screen bg-black">
        <PageLoader />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pt-24 min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-400 mb-4">Order not found</p>
          <Link to="/account/orders" className="text-red-400 hover:text-red-300 text-sm">
            ← Back to orders
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = statusSteps.indexOf(order.status);
  const StatusIcon = statusConfig[order.status]?.icon || Clock;
  const statusColor = statusConfig[order.status]?.color || 'text-neutral-400';

  return (
    <div className="pt-24 min-h-screen bg-black">
      <Head title={`Order ${order.order_number}`} description="View your order details and tracking." robots="noindex, follow" />

      <div className="max-w-4xl mx-auto px-4 pb-24">
        <Link to="/account/orders" className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-300 text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Orders
        </Link>

        {/* Order header */}
        <div className="glass-base rounded-2xl p-6 border border-red-500/10 shadow-investigation mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-mono text-xl font-bold text-neutral-50">{order.order_number}</h1>
              <p className="text-neutral-500 text-sm mt-1">{formatDate(order.created_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon className={`w-5 h-5 ${statusColor}`} />
              <span className={`font-mono text-sm font-bold ${statusColor}`}>{order.status.toUpperCase()}</span>
            </div>
          </div>

          {/* Progress bar */}
          {currentStepIndex >= 0 && !['cancelled', 'refunded'].includes(order.status) && (
            <div className="flex items-center gap-1 mb-2">
              {statusSteps.map((step, i) => (
                <div key={step} className="flex-1 flex items-center gap-1">
                  <div className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i <= currentStepIndex ? 'bg-red-500' : 'bg-neutral-800'
                  }`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="glass-subtle rounded-2xl p-6 border border-red-500/5 mb-6">
          <h2 className="text-neutral-300 font-medium mb-4">Items</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-neutral-800 last:border-0">
                <div>
                  <p className="text-neutral-50 text-sm font-medium">{item.product_name}</p>
                  {item.variant_name && <p className="text-neutral-500 text-xs">{item.variant_name}</p>}
                  {item.sku && <p className="text-neutral-700 text-xs font-mono">SKU: {item.sku}</p>}
                </div>
                <div className="text-right">
                  <p className="text-neutral-200 text-sm font-mono">{formatPrice(item.unit_price_pence)}</p>
                  <p className="text-neutral-600 text-xs">× {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-neutral-800 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Subtotal</span>
              <span className="text-neutral-300 font-mono">{formatPrice(order.subtotal_pence)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Shipping</span>
              <span className="text-neutral-300 font-mono">
                {order.shipping_pence === 0 ? 'Free' : formatPrice(order.shipping_pence)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-neutral-800">
              <span className="text-neutral-50">Total</span>
              <span className="text-red-400 font-mono">{formatPrice(order.total_pence)}</span>
            </div>
          </div>
        </div>

        {/* Shipping / Tracking */}
        {fulfilment && (
          <div className="glass-subtle rounded-2xl p-6 border border-red-500/5 mb-6">
            <h2 className="text-neutral-300 font-medium mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Shipping
            </h2>

            {fulfilment.tracking_number && (
              <div className="bg-neutral-900/50 rounded-xl p-4 mb-4">
                <p className="text-neutral-500 text-xs font-mono mb-1">TRACKING</p>
                <div className="flex items-center gap-3">
                  <p className="text-neutral-50 font-mono text-sm">{fulfilment.tracking_number}</p>
                  {fulfilment.carrier && (
                    <span className="text-neutral-600 text-xs">via {fulfilment.carrier}</span>
                  )}
                  {fulfilment.tracking_url && (
                    <a
                      href={fulfilment.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-400 hover:text-red-300 transition-colors"
                      aria-label="Track shipment"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            {shippingEvents.length > 0 && (
              <div className="space-y-0">
                {shippingEvents.map((event, i) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-red-500' : 'bg-neutral-700'}`} />
                      {i < shippingEvents.length - 1 && <div className="w-0.5 h-8 bg-neutral-800" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-neutral-200 text-sm">{event.description || event.status}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {event.location && (
                          <span className="text-neutral-600 text-xs flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                        )}
                        <span className="text-neutral-700 text-xs">{formatDate(event.occurred_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Shipping address */}
        {order.shipping_address && (
          <div className="glass-subtle rounded-2xl p-6 border border-red-500/5">
            <h2 className="text-neutral-300 font-medium mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Shipping Address
            </h2>
            <div className="text-neutral-400 text-sm space-y-0.5">
              {order.shipping_address.full_name && <p className="text-neutral-200">{order.shipping_address.full_name}</p>}
              {order.shipping_address.line1 && <p>{order.shipping_address.line1}</p>}
              {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
              {order.shipping_address.city && <p>{order.shipping_address.city}</p>}
              {order.shipping_address.postcode && <p>{order.shipping_address.postcode}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
