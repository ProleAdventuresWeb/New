import React from 'react';
import { CheckCircle, Home, ShoppingCart } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Head } from '../components/Head';

export const ShopSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="pt-24 min-h-screen bg-black flex items-center justify-center p-4">
      <Head 
        title="Mission Success — Order Confirmed" 
        description="Your mission-critical gear has been ordered. Mission confirmed." 
        robots="noindex, follow"
      />

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-green-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-red-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-xl w-full glass-base rounded-3xl p-12 border border-green-500/20 shadow-investigation text-center hover:scale-[1.01] transition-transform duration-500 relative z-10">
        <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse shadow-glow shadow-green-500/20 relative">
          <div className="absolute inset-0 rounded-full border border-green-500/50 animate-ping opacity-20" />
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>

        <h1 className="font-display text-4xl font-bold text-neutral-50 mb-4 tracking-tight">
          MISSION <span className="text-green-500">ACKNOWLEDGED</span>
        </h1>
        
        <p className="text-neutral-300 text-lg mb-8 leading-relaxed">
          Order received and payment verified. Your artifacts are being prepared for dispatch. 
          Check your secure communication channel (email) for confirmation and tracking data.
        </p>

        {sessionId && (
         <div className="mb-10 p-5 bg-neutral-900/50 border border-neutral-800 rounded-2xl group">
           <p className="text-neutral-500 text-[10px] font-mono mb-2 uppercase tracking-[0.3em]">Transmission Identifier</p>
           <p className="text-green-500/70 text-sm break-all font-mono group-hover:text-green-400 transition-colors">
             {sessionId}
           </p>
         </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/shop"
            className="flex items-center justify-center gap-2 py-4 px-6 bg-neutral-900 text-neutral-400 border border-neutral-800 rounded-xl hover:bg-neutral-800 hover:text-neutral-100 transition-all font-bold group"
          >
            <ShoppingCart className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            BACK TO ARTEFACTS
          </Link>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 py-4 px-6 bg-red-600/10 text-red-500 border border-red-600/20 rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 shadow-glow shadow-red-600/10 transition-all font-bold group"
          >
            <Home className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
            HOME BASE
          </Link>
        </div>

        <div className="mt-12 flex items-center justify-center gap-8 opacity-40">
           <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent to-neutral-700" />
           <p className="text-neutral-500 text-[10px] font-mono uppercase tracking-[0.5em] whitespace-nowrap">
             FIELD OPS / LOGISTICS / COMPLETE
           </p>
           <div className="h-[1px] flex-grow bg-gradient-to-l from-transparent to-neutral-700" />
        </div>
      </div>
    </div>
  );
};
