import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { X } from 'lucide-react';

// Initialize Stripe with the publishable key from env
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface EmbeddedCheckoutModalProps {
  clientSecret: string;
  onClose: () => void;
}

export const EmbeddedCheckoutModal: React.FC<EmbeddedCheckoutModalProps> = ({ clientSecret, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-neutral-900 rounded-3xl overflow-hidden shadow-investigation border border-red-500/20 animate-in zoom-in duration-300">
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-black/40">
          <div>
            <h3 className="text-xl font-display font-bold text-neutral-50 tracking-tight">SECURE CONTRIBUTION</h3>
            <p className="text-xs text-neutral-500 font-mono uppercase">Mission Logistics / Stripe Encryption</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-xl transition-colors group"
          >
            <X className="w-6 h-6 text-neutral-400 group-hover:text-red-500" />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {clientSecret ? (
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ clientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          ) : (
            <div className="p-20 text-center text-neutral-500 font-mono">
               <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-4" />
               Initialising Secure Channel...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
