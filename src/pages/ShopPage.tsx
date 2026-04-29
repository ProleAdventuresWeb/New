import React, { useState, useEffect } from 'react';
import { ShoppingBag, Loader2, Info, ArrowLeft, ArrowRight } from 'lucide-react';
import { Head } from '../components/Head';
import { JsonLd } from '../components/JsonLd';
import { products, Product } from '../data/products';
import { useAuth } from '../lib/auth';
import { analytics } from '../lib/analytics';

type CheckoutRedirect = {
  url: string;
};

const ProductImage: React.FC<{ product: Product }> = ({ product }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = product.images || [product.image];

  return (
    <div className="aspect-[4/5] overflow-hidden relative group">
      <img 
        src={images[currentIndex]} 
        alt={product.name} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
      />
      
      {/* Category Badge */}
      <div className="absolute top-4 left-4 z-10">
        <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded uppercase tracking-wider shadow-lg">
          {product.category}
        </span>
      </div>

      {/* Image Switcher Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex ? 'bg-red-500 w-4' : 'bg-white/50 hover:bg-white'
              }`}
            />
          ))}
        </div>
      )}

      {/* Side arrows for quick switching */}
      {images.length > 1 && (
        <>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
};

export const ShopPage: React.FC = () => {
  const { user } = useAuth();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Track page view
  useEffect(() => {
    analytics.pageView('shop');
  }, []);

  const handleBuyNow = async (product: Product) => {
    setLoadingId(product.id);
    analytics.beginCheckout(product.price, 1);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: product.name,
          price: product.price,
          quantity: 1,
          productId: product.id,
          profileId: user?.id || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = (await response.json()) as CheckoutRedirect;
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed. Please try again later.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-black">
      <Head 
        title="Prole Artefacts — Support the Cause" 
        description="Exclusive gear and intel. Every purchase funds future missions." 
      />

      <header className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-5xl md:text-7xl font-bold text-neutral-50 mb-6 tracking-tight">
          PROLE <span className="text-red-500">ARTEFACTS</span>
        </h1>
        <p className="text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed uppercase tracking-widest font-mono">
          Adventure Gear<br />
          Built for Performance<br />
          Designed for Proles
        </p>
      </header>

      <main className="max-w-7xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <React.Fragment key={product.id}>
              <JsonLd 
                type="product"
                data={{
                  name: product.name,
                  description: product.description,
                  image: `https://proleadventures.com${product.image}`,
                  brand: 'Prole Adventures',
                  offers: {
                    price: (product.price / 100).toFixed(2),
                    priceCurrency: 'GBP',
                    availability: 'https://schema.org/InStock'
                  }
                }}
              />
              <div className="glass-base rounded-2xl overflow-hidden border border-red-500/10 hover:border-red-500/30 transition-all duration-500 group flex flex-col h-full">
                <ProductImage product={product} />

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-display text-2xl font-bold text-neutral-50 leading-tight">
                      {product.name}
                    </h3>
                    <span className="text-xl font-mono text-red-400">
                      £{(product.price / 100).toFixed(2)}
                    </span>
                  </div>
                  
                  <p className="text-neutral-400 text-sm leading-relaxed mb-6 flex-grow">
                    {product.description}
                  </p>

                  <button
                    onClick={() => handleBuyNow(product)}
                    disabled={loadingId !== null}
                    className="
                      w-full py-4 px-6 rounded-xl flex items-center justify-center gap-3
                      bg-neutral-900 border border-red-500/20 text-red-400 font-bold
                      hover:bg-red-600 hover:text-white hover:border-red-600
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-300
                    "
                  >
                    {loadingId === product.id ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        SECURE CHECKOUT...
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5" />
                        BUY NOW
                      </>
                    )}
                  </button>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>

        <section className="mt-20 glass-subtle rounded-2xl p-8 border border-red-500/10 max-w-4xl mx-auto">
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
            <div>
              <h4 className="text-neutral-100 font-bold mb-2">Shipping Information</h4>
              <p className="text-neutral-500 text-sm leading-relaxed">
                All physical orders are fulfilled by Printful. Estimated delivery time is 10-14 business days. 
                Digital intel is delivered instantly via email.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
