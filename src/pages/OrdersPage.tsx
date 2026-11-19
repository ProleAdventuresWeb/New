import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Head } from '../components/Head';
import { PageLoader } from '../components/PageLoader';
import { analytics } from '../lib/analytics';

interface OrderSummary {
  id: string;
  order_number: string;
  status: string;
  total_pence: number;
  currency: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  paid: 'text-green-400 bg-green-400/10 border-green-400/20',
  processing: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  fulfilled: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  shipped: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  delivered: 'text-green-400 bg-green-400/10 border-green-400/20',
  cancelled: 'text-red-400 bg-red-400/10 border-red-400/20',
  refunded: 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20',
};

export const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!supabase || !user) return;

      const { data, error } = await supabase
        .from('shop_orders')
        .select('id, order_number, status, total_pence, currency, created_at')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [user]);

  const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`;
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="pt-24 min-h-screen bg-black">
      <Head title="Orders" description="Your order history." robots="noindex, follow" />

      <div className="max-w-4xl mx-auto px-4 pb-24">
        {/* Back nav */}
        <Link to="/account" className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-300 text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Account
        </Link>

        <h1 className="font-display text-3xl font-bold text-neutral-50 mb-8">
          OrDErS
        </h1>

        {loading ? (
          <div className="py-20">
            <PageLoader />
          </div>
        ) : orders.length === 0 ? (
          <div className="glass-subtle rounded-2xl p-12 text-center border border-red-500/5">
            <Package className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-400 mb-6">No orders yet</p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition-colors"
            >
              Browse Artefacts
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/account/orders/${order.id}`}
                onClick={() => analytics.orderViewed(order.id)}
                className="flex items-center gap-4 p-5 glass-subtle rounded-xl border border-red-500/5 hover:border-red-500/20 transition-all duration-300 group"
              >
                <div className="w-10 h-10 bg-neutral-800 group-hover:bg-red-500/10 rounded-lg flex items-center justify-center transition-colors">
                  <Package className="w-5 h-5 text-neutral-400 group-hover:text-red-400 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-neutral-50 font-mono text-sm font-medium">{order.order_number}</p>
                    <span className={`px-2 py-0.5 text-xs font-mono rounded-full border ${statusColors[order.status] || 'text-neutral-400'}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-neutral-500 text-xs">{formatDate(order.created_at)}</p>
                </div>
                <p className="text-neutral-200 font-mono text-sm">{formatPrice(order.total_pence)}</p>
                <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
