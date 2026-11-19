import React, { useEffect, useState } from 'react';
import { Package, MapPin, CheckCircle, Lock, Clock, Send, ChevronDown, ChevronUp, X } from 'lucide-react';
import { MapContainer, TileLayer, Circle, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Head } from '../components/Head';
import { PageLoader } from '../components/PageLoader';
import { supabase } from '../lib/supabase';

// ─── Types ──────────────────────────────────────────────────────────────────
interface Drop {
  id: string;
  title: string;
  drop_number: number;
  region: string;
  lat?: number;
  lng?: number;
  clues: string[];
  status: 'available' | 'claimed' | 'unreleased';
  release_date: string;
  claimed_by?: string;
  claimed_at?: string;
}

// ─── Mock drops — used until DB table is set up ─────────────────────────────
const MOCK_DROPS: Drop[] = [
  {
    id: 'drop-001',
    title: 'Cache #001 — The Copper Token',
    drop_number: 1,
    region: 'East London, Greater London',
    lat: 51.52,
    lng: -0.05,
    clues: [
      'Where the old iron meets the new glass, beneath a painted sky.',
      'Step through the market\'s shadow — the traders have long since gone home.',
      'The token waits inside a rusted fitting, fixed to something that hasn\'t moved in years.',
    ],
    status: 'available',
    release_date: '2026-04-01T09:00:00Z',
  },
  {
    id: 'drop-002',
    title: 'Cache #002 — The Prole Pin',
    drop_number: 2,
    region: 'South East London',
    lat: 51.48,
    lng: 0.00,
    clues: [
      'Find the hill where Greenwich meets the sky.',
      'Stand where zero meets time, and look south.',
      'Look down, not up — it\'s smaller than you think.',
    ],
    status: 'claimed',
    release_date: '2026-03-01T09:00:00Z',
    claimed_by: 'urban_wanderer88',
    claimed_at: '2026-03-03T14:32:00Z',
  },
];


// ─── Map Updater ─────────────────────────────────────────────────────────────
const MapUpdater = ({ center }: { center: [number, number] | null }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      const timer = setTimeout(() => {
        map.flyTo(center, 13, { animate: true, duration: 1.5 });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [center, map]);
  return null;
};

// ─── Drop Card ───────────────────────────────────────────────────────────────
interface DropCardProps {
  drop: Drop;
  onLocate?: (lat: number, lng: number) => void;
}

const DropCard: React.FC<DropCardProps> = ({ drop, onLocate }) => {
  const [cluesOpen, setCluesOpen] = useState(true);
  const isClaimed = drop.status === 'claimed';
  const releaseDate = new Date(drop.release_date);

  return (
    <div className={`
      glass-base rounded-2xl p-6 transition-all duration-300 border
      ${isClaimed 
        ? 'border-neutral-700/30 opacity-70' 
        : 'border-red-500/20 hover:border-red-400/40 hover:scale-[1.005]'
      }
    `}>

      {/* Title + Badge */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="font-display text-xl font-bold text-neutral-50 leading-snug flex-1">
          {drop.title}
        </h3>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${isClaimed ? 'bg-neutral-800 text-neutral-400' : 'bg-green-400/10 text-green-400 border border-green-400/30'}`}>
          {isClaimed ? (
             <><CheckCircle className="w-3.5 h-3.5" /> Claimed by {drop.claimed_by}</>
          ) : (
             <><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live</>
          )}
        </span>
      </div>

      {/* Region + Date */}
      <div className="flex flex-col gap-2 mb-5">
        <div className="flex items-center gap-2 text-xs text-neutral-100 font-mono">
          <MapPin className="w-3 h-3 text-red-400/70" />
          {drop.region}
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
          <Clock className="w-3 h-3" />
          Released {releaseDate.toLocaleDateString('en-GB')}
        </div>
      </div>

        {/* Clues */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setCluesOpen(!cluesOpen)}
              className="flex items-center gap-2 text-xs text-neutral-500 uppercase tracking-wider font-semibold hover:text-neutral-300 transition-colors"
            >
              {cluesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {drop.clues.length} Clues
            </button>
            
            {drop.lat && drop.lng && onLocate && (
              <button
                onClick={() => onLocate(drop.lat!, drop.lng!)} 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800 text-xs font-semibold rounded-lg text-neutral-300 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                View Area
              </button>
            )}
          </div>

          {cluesOpen && (
            <ol className="space-y-3">
              {drop.clues.map((clue, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-neutral-300 text-sm leading-relaxed italic">"{clue}"</p>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* CTA */}
        {isClaimed ? (
          <div className="py-3 text-center border border-neutral-700/30 rounded-xl text-neutral-500 text-sm">
            <CheckCircle className="w-4 h-4 inline mr-1.5 text-neutral-600" />
            This one's been found
          </div>
        ) : (
          <div className="space-y-2.5">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-investigation active:scale-[0.98] text-center"
            >
              <Send className="w-5 h-5" />
              Found It? Send us a selfie to claim!
            </a>
            <button
              onClick={() => alert("We're currently building an automated Missing Report feature. For now, please drop us a quick message on our Facebook so we can update the status. Thank you for thinking of the community!")}
              className="w-full py-2.5 bg-transparent border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900 text-neutral-400 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors text-xs uppercase tracking-wider"
            >
              <X className="w-4 h-4" />
              Not Here / Missing?
            </button>
          </div>
        )}
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export const DropsPage: React.FC = () => {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  const handleLocate = (lat: number, lng: number) => {
    setMapCenter([lat, lng]);
    document.getElementById('cache-map')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  useEffect(() => {
    (async () => {
      try {
        if (supabase) {
          const { data, error } = await supabase
            .from('drops')
            .select('*')
            .neq('status', 'unreleased')
            .lte('release_date', new Date().toISOString())
            .order('drop_number', { ascending: true });

          if (data && !error) {
            setDrops(data as Drop[]);
            setLoading(false);
            return;
          }
        }
        // Fallback to mock data
        setDrops(MOCK_DROPS.filter(d => d.status !== 'unreleased'));
      } catch {
        setDrops(MOCK_DROPS.filter(d => d.status !== 'unreleased'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  const available = drops.filter(d => d.status === 'available');
  const claimed = drops.filter(d => d.status === 'claimed');

  return (
    <div className="pt-16 min-h-screen bg-black">
      <Head
        title="Prole Cache"
        description="Field caches hidden in real places. Follow the clues, explore the area and claim the item when you find it."
      />

      {/* Hero */}
      <section className="py-16 px-4 border-b border-red-500/10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass-subtle rounded-full text-red-400 text-xs font-mono mb-6 border border-red-500/20">
            <Package className="w-4 h-4" />
            Prole Adventures Field Cache
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold text-neutral-50 mb-4">
            Prole Cache
          </h1>
          <div className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed space-y-2 md:space-y-1">
            <p>Mystery items hidden in real locations across the UK.</p>
            <p>Follow the clues, get yourself out there and if you find one....</p>
            <p className="font-semibold text-neutral-200 md:pt-2">It's all yours!</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-10 px-4 border-b border-red-500/10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Read the Clues', desc: 'Each cache comes with a set of clues pointing to a real physical location. No GPS coordinates — use your head.' },
              { step: '02', title: 'Go Find It', desc: 'Get off your arse, get out there, and find it. The clues are specific but the search is real.' },
              { step: '03', title: 'Claim Your Victory', desc: 'Snap a photo of you with the cache and send it to our Facebook page. We\'ll verify it, feature you, and mark it as officially found!' },
            ].map(card => (
              <div key={card.step} className="glass-subtle rounded-xl p-6 border border-red-500/10">
                <p className="font-display text-5xl font-bold text-red-500/20 mb-3">{card.step}</p>
                <h3 className="font-semibold text-neutral-200 mb-2">{card.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Drops */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="py-20">
              <PageLoader />
            </div>
          ) : (
            <>
              {available.length > 0 && (
                <div className="mb-12">
                  <div 
                    id="cache-map"
                    className="w-full h-64 md:h-96 rounded-2xl overflow-hidden glass-subtle border border-red-500/10 mb-8"
                    style={{ zIndex: 0 }}
                  >
                    <MapContainer
                      center={[51.5, -0.09]} 
                      zoom={11}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <MapUpdater center={mapCenter} />
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {available.map(drop => drop.lat && drop.lng ? (
                        <Circle
                          key={drop.id}
                          center={[drop.lat, drop.lng]}
                          pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.15, weight: 3, opacity: 0.8 }}
                          radius={1000} // ~1km search area
                        >
                          <Tooltip direction="top" opacity={1}>
                            <div className="text-center">
                              <span className="font-bold text-sm block">{drop.title}</span>
                              <span className="text-xs text-neutral-500">General Area (1km radius)</span>
                            </div>
                          </Tooltip>
                        </Circle>
                      ) : null)}
                    </MapContainer>
                  </div>
                           
                  <h2 className="font-display text-3xl font-bold text-neutral-50 mb-2">
                    Live Cache
                  </h2>
                  <p className="text-neutral-500 text-sm mb-8">These are out there right now. Go get them.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {available.map(drop => (
                      <DropCard key={drop.id} drop={drop} onLocate={handleLocate} />
                    ))}
                  </div>
                </div>
              )}

              {available.length === 0 && (
                <div className="text-center py-20 glass-subtle rounded-2xl border border-red-500/10 mb-12">
                  <Lock className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                  <h3 className="font-display text-2xl font-bold text-neutral-600 mb-2">Nothing Active Right Now</h3>
                  <p className="text-neutral-600 text-sm max-w-sm mx-auto">
                    Subscribe to the Prole Adventures newsletter to be first to know when a new cache goes live.
                  </p>
                </div>
              )}

              {claimed.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl font-bold text-neutral-600 mb-2">Claimed</h2>
                  <p className="text-neutral-600 text-sm mb-6">Already found by someone out there.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {claimed.map(drop => (
                      <DropCard key={drop.id} drop={drop} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

    </div>
  );
};
