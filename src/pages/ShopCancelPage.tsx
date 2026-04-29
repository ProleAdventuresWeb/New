import React from 'react';
import { ShoppingCart, AlertTriangle, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Head } from '../components/Head';

export const ShopCancelPage: React.FC = () => {
  return (
    <div className="pt-24 min-h-screen bg-black flex items-center justify-center p-4">
      <Head 
        title="Operation Suspended — Order Cancelled" 
        description="The order process was aborted. Visit the shop when ready." 
      />

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-red-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-neutral-900/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-xl w-full glass-base rounded-3xl p-12 border border-red-500/10 shadow-investigation text-center hover:scale-[1.01] transition-transform duration-500 relative z-10">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse shadow-glow shadow-red-500/20">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        <h1 className="font-display text-4xl font-bold text-neutral-50 mb-4 tracking-tight">
          OPERATION <span className="text-red-500">ABORTED</span>
        </h1>
        
        <p className="text-neutral-300 text-lg mb-10 leading-relaxed font-mono italic">
          The checkout process was cancelled. No mission funds were processed. 
          The arsenal is still open if you wish to re-evaluate your gear requirements.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/shop"
            className="flex items-center justify-center gap-2 py-4 px-6 bg-red-600/10 text-red-500 border border-red-600/20 rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 shadow-glow shadow-red-600/10 transition-all font-bold group"
          >
            <ShoppingCart className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            RE-ENTER ARTEFACTS
          </Link>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 py-4 px-6 bg-neutral-900 text-neutral-400 border border-neutral-800 rounded-xl hover:bg-neutral-800 hover:text-neutral-100 transition-all font-bold group"
          >
            <Home className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
            HOME BASE
          </Link>
        </div>

        <div className="mt-12 flex items-center justify-center gap-8 opacity-40">
           <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent to-neutral-700" />
           <p className="text-neutral-500 text-[10px] font-mono uppercase tracking-[0.5em] whitespace-nowrap">
             FIELD OPS / LOGISTICS / SUSPENDED
           </p>
           <div className="h-[1px] flex-grow bg-gradient-to-l from-transparent to-neutral-700" />
        </div>
      </div>
    </div>
  );
};
