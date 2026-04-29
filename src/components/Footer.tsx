import React from 'react';
import { MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-20 border-t border-white/10" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-700 to-primary-500 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold text-neutral-50">
                ProLe AdVeNTurES
              </span>
            </div>
            <p className="text-neutral-300 max-w-sm italic">
              Just a Prole, goin places...... Come along if you like.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-neutral-50 mb-4">Outpost</h3>
            <ul className="space-y-2" role="list">
              <li><a href="/watch" className="text-neutral-300 hover:text-primary-300 transition-colors">Watch</a></li>
              <li><a href="/stories" className="text-neutral-300 hover:text-primary-300 transition-colors">Read</a></li>
              <li><a href="/gear" className="text-neutral-300 hover:text-primary-300 transition-colors">Gear</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-neutral-50 mb-4">Follow Us</h3>
            <div className="grid grid-cols-5 gap-3 mb-4 max-w-[200px]">
              {/* Facebook */}
              <a href="https://www.facebook.com/ProleAdventures" aria-label="Facebook" title="Facebook" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-neutral-700 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              {/* YouTube */}
              <a href="https://www.youtube.com/@ProleAdventures" aria-label="YouTube" title="YouTube" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-neutral-700 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a href="https://www.instagram.com/proleadventures/" aria-label="Instagram" title="Instagram" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-neutral-700 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.621 5.367 11.987 11.988 11.987s11.987-5.366 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.316-1.295-.867-.805-1.369-1.912-1.369-3.207 0-1.297.49-2.448 1.295-3.316.805-.867 1.912-1.369 3.207-1.369 1.297 0 2.448.49 3.316 1.295.867.805 1.369 1.912 1.369 3.207 0 1.297-.49 2.448-1.295 3.316-.805.867-1.912 1.369-3.207 1.369z"/>
                </svg>
              </a>
              {/* X (Twitter) */}
              <a href="https://x.com/ProleAdventures" aria-label="X Twitter" title="X (Twitter)" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-neutral-700 hover:bg-black rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              {/* TikTok */}
              <a href="https://www.tiktok.com/@prole_adventures" aria-label="TikTok" title="TikTok" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-neutral-700 hover:bg-gray-900 rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
              {/* Patreon */}
              <a href="https://patreon.com/proleadventures" aria-label="Patreon" title="Patreon" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-neutral-700 hover:bg-[#FF424D] rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15.386.524c-4.764 0-8.64 3.876-8.64 8.64 0 4.75 3.876 8.613 8.64 8.613 4.75 0 8.614-3.863 8.614-8.613 0-4.764-3.864-8.64-8.614-8.64zM.48 23.513h4.29V.524H.48v22.99z"/>
                </svg>
              </a>
              {/* Pinterest */}
              <a href="https://uk.pinterest.com/ProleAdventuresCom/" aria-label="Pinterest" title="Pinterest" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-neutral-700 hover:bg-[#BD081C] rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.011 3.007 9.306 7.303 11.104-.102-.934-.194-2.366.04-3.385.212-.916 1.365-5.789 1.365-5.789s-.348-.696-.348-1.724c0-1.616.937-2.823 2.105-2.823 0.993 0 1.472.745 1.472 1.639 0 0.998-.636 2.491-.963 3.873-.274 1.157.581 2.099 1.72 2.099 2.062 0 3.648-2.176 3.648-5.316 0-2.779-1.997-4.723-4.849-4.723-3.303 0-5.24 2.478-5.24 5.03 0 1 .386 2.072.868 2.656.095.115.109.215.08.33l-.333 1.359c-.054.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.261 7.929-7.261 4.162 0 7.397 2.965 7.397 6.93 0 4.135-2.607 7.462-6.23 7.462-1.215 0-2.358-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.621 0 11.988-5.367 11.988-11.987S18.638 0 12.017 0z"/>
                </svg>
              </a>
              {/* Telegram */}
              <a href="https://t.me/ProleAdventures" aria-label="Telegram" title="Telegram" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-neutral-700 hover:bg-[#0088CC] rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 1.588 4.829c.19.525.096.733.655.733.435 0 .626-.2.87-.438l2.086-2.029 4.338 3.204c.8.44 1.374.213 1.573-.743l2.842-13.393c.29-1.165-.436-1.687-1.198-1.341z"/>
                </svg>
              </a>
              {/* WhatsApp */}
              <a href="https://chat.whatsapp.com/E54D8Hbdl8l6nrzzzx9Xrl" aria-label="WhatsApp" title="WhatsApp" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-neutral-700 hover:bg-[#25D366] rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.429 5.631 1.43h.005c6.547 0 11.88-5.337 11.883-11.898a11.825 11.825 0 00-3.48-8.413Z"/>
                </svg>
              </a>
              {/* Buy Me a Coffee */}
              <a href="https://buymeacoffee.com/proleadventures" aria-label="Buy Me a Coffee" title="Buy Me a Coffee" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-neutral-700 hover:bg-[#FFDD00] rounded-lg flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-white hover:text-black transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.285 2l-2.008 10h-2.131l.201-1h-9.141l.201 1h-2.131l-2.008-10h17.008zm2.715 3h-2.105l-.201 1h2.105c.497 0 .9.403.9.9v3.2c0 .497-.403.9-.9.9h-2.105l-.201 1h2.105c1.05 0 1.9-.85 1.9-1.9v-3.2c0-1.05-.85-1.9-1.9-1.9zM4 21c0 .552.448 1 1 1h14c.552 0 1-.448 1-1v-1h-16v1z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <p className="text-neutral-400 text-sm">
            © {currentYear} Prole Adventures.
          </p>
          
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Accepted Payments Inline - Moved to Right next to links */}
            <div className="hidden md:flex flex-col gap-2 border-r border-white/10 pr-8 text-right">
              <span className="text-[10px] text-neutral-400 font-mono tracking-[0.2em] uppercase">Secure Payments via Stripe</span>
              <div className="flex items-center gap-2 justify-end">
                {/* Visa */}
                <div className="h-7 w-12 bg-white rounded flex items-center justify-center p-1 shadow-sm group hover:scale-105 transition-transform">
                  <svg viewBox="0 0 32 20" className="h-full w-full">
                    <path d="M12.98 12.01h-2.14l1.34-8.3h2.14l-1.34 8.3zm10.15-8.11c-.42-.16-.95-.33-1.64-.33-1.81 0-3.08.97-3.09 2.34-.01 1.02.91 1.58 1.61 1.92.71.35.95.57.95.88 0 .47-.57.69-1.1.69-.73 0-1.13-.11-1.73-.37l-.24-.11-.26 1.62c.44.2.1.25 1.25.43.34.05.69.07 1.04.07 1.91 0 3.16-.95 3.17-2.42.01-.81-.48-1.43-1.54-1.94-.64-.32-1.04-.54-1.04-.87 0-.31.34-.63 1.07-.63.6 0 1.05.13 1.39.27l.17.07.27-1.64zM8.32 3.69l-2.01 5.37-.24-1.22c-.41-1.39-1.7-2.9-3.13-3.66l2.02 7.82h2.27l3.39-8.31H8.32zM2.42 3.69H0l.04.19c1.88.48 3.12 1.64 3.64 3.03l-.86-4.32-.05-.2.15-.09.31-.01c.21 0 .41.13.43.34l1.32 6.64L7.15 3.69H2.42z" fill="#0E4595" />
                  </svg>
                </div>
                {/* Mastercard */}
                <div className="h-7 w-12 bg-[#001C43] rounded flex items-center justify-center p-1 group hover:scale-105 transition-transform">
                  <svg viewBox="0 0 32 20" className="h-full w-full">
                    <circle cx="12" cy="10" r="7" fill="#EB001B" />
                    <circle cx="20" cy="10" r="7" fill="#F79E1B" />
                    <path d="M16 10a6.98 6.98 0 0 1 2.38-5.26 6.98 6.98 0 0 1 0 10.52A6.98 6.98 0 0 1 16 10z" fill="#FF5F00" />
                  </svg>
                </div>
                {/* PayPal */}
                <div className="h-7 w-12 bg-white rounded flex items-center justify-center p-1 group hover:scale-105 transition-transform">
                  <svg viewBox="0 0 32 20" className="h-full w-full">
                    <path d="M10.5 5.5l.5-2.5h5.5c3 0 4.5 1.5 4.5 3.5s-1.5 3.5-4.5 3.5h-2l-.5 2.5h-3.5zm7 7.5h-3.5l-.5 2.5h-3.5l2-10h7.5c3.5 0 5.5 2 5.5 4.5s-2 4.5-5.5 4.5z" fill="#003087" />
                  </svg>
                </div>
                {/* AMEX */}
                <div className="h-7 w-12 bg-[#016FD0] rounded flex items-center justify-center p-1 group hover:scale-105 transition-transform">
                  <svg viewBox="0 0 32 20" className="h-full w-full">
                    <path d="M4 14l3-8h3l3 8h-3l-.5-2h-1.5l-.5 2H4zm14-8h3l3 8h-3l-.5-2h-1.5l-.5 2h-3l0-8z" fill="white" />
                  </svg>
                </div>
                {/* Visa Electron */}
                <div className="h-7 w-12 bg-[#001C43] rounded flex items-center justify-center p-1 border border-white/10 group hover:scale-105 transition-transform">
                  <div className="h-full w-full flex items-center justify-center text-[6px] font-bold text-white tracking-tighter leading-none italic">
                    VISA<br/>ELECTRON
                  </div>
                </div>
                {/* Maestro */}
                <div className="h-7 w-12 bg-[#001C43] rounded flex items-center justify-center p-1 group hover:scale-105 transition-transform">
                  <svg viewBox="0 0 32 20" className="h-full w-full">
                    <circle cx="12" cy="10" r="7" fill="#006BB4" fillOpacity="0.8" />
                    <circle cx="20" cy="10" r="7" fill="#EB001B" fillOpacity="0.8" />
                    <path d="M16 10a6.98 6.98 0 0 1 2.38-5.26 6.98 6.98 0 0 1 0 10.52A6.98 6.98 0 0 1 16 10z" fill="#752B7C" fillOpacity="0.8" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-2">
              <a href="/about" className="text-neutral-400 hover:text-primary-300 transition-colors text-sm">
                About
              </a>
              <a href="/contact" className="text-neutral-400 hover:text-primary-300 transition-colors text-sm">
                Contact
              </a>
              <a href="/privacy-policy" className="text-neutral-400 hover:text-primary-300 transition-colors text-sm">
                Privacy Policy
              </a>
              <a href="/terms" className="text-neutral-400 hover:text-primary-300 transition-colors text-sm">
                Terms of Use
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};