import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shield, MapPin, ArrowLeft, ArrowRight, CheckCircle, Lock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SecureAdventure } from '../lib/supabase';
import { AdventureService } from '../services/adventureService';
import { MockAdventureService } from '../services/mockAdventureService';
import { Head } from '../components/Head';
import { PageLoader } from '../components/PageLoader';
import { EmbeddedCheckoutModal } from '../components/EmbeddedCheckoutModal';
import { useSearchParams } from 'react-router-dom';

type CheckoutSession = {
  clientSecret: string;
};

// Fix default Leaflet marker icons
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ─── Status config: plain-English labels + colours ─────────────────────────
const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  scouting: {
    label: 'Planning',
    dot: 'bg-amber-400',
    badge: 'text-amber-400 bg-amber-400/10 border border-amber-400/30',
  },
  greenlit: {
    label: 'Confirmed',
    dot: 'bg-green-400',
    badge: 'text-green-400 bg-green-400/10 border border-green-400/30',
  },
  active: {
    label: 'In Progress',
    dot: 'bg-blue-400 animate-pulse',
    badge: 'text-blue-400 bg-blue-400/10 border border-blue-400/30',
  },
  complete: {
    label: 'Done',
    dot: 'bg-neutral-500',
    badge: 'text-neutral-400 bg-neutral-400/10 border border-neutral-400/30',
  },
};

// ─── Map pin factory ────────────────────────────────────────────────────────
const createMapPin = (status: string, isSelected: boolean) => {
  const colours: Record<string, string> = {
    scouting: '251,191,36',
    greenlit: '74,222,128',
    active: '96,165,250',
    complete: '156,163,175',
  };
  const rgb = colours[status] || '156,163,175';
  const size = isSelected ? 46 : 36;

  return L.divIcon({
    html: `
      <div style="
        width:${size}px;height:${size}px;
        background:rgba(${rgb},${isSelected ? '1' : '0.85'});
        border-radius:50%;
        border:3px solid rgba(255,255,255,0.9);
        box-shadow:0 0 ${isSelected ? '24px' : '10px'} rgba(${rgb},0.7),
                   0 4px 12px rgba(0,0,0,0.5);
        display:flex;align-items:center;justify-content:center;
        transition:all 0.25s ease;
      ">
        <div style="width:10px;height:10px;background:rgba(0,0,0,0.45);border-radius:50%;"></div>
      </div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
};

// ─── Mission card ───────────────────────────────────────────────────────────
interface MissionCardProps {
  adventure: SecureAdventure;
  isSelected: boolean;
  onSelect: () => void;
  onContribute: (amount: number, missionId: string, missionName: string) => Promise<void>;
  contributionSuccess: boolean;
}

const MissionCard: React.FC<MissionCardProps> = ({ adventure, isSelected, onSelect, onContribute, contributionSuccess }) => {
  const [amount, setAmount] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const cfg = STATUS_CONFIG[adventure.status] ?? STATUS_CONFIG.scouting;
  const progress = Math.min((adventure.bounty_current / adventure.bounty_target) * 100, 100);
  const isDone = adventure.status === 'complete';
  const isScouting = adventure.status === 'scouting';

  const handleContribute = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const val = Number(amount);
    if (!amount || isNaN(val) || val < 1) {
      alert('Minimum contribution is £1.');
      return;
    }

    setLocalLoading(true);
    await onContribute(val, adventure.id, adventure.display_title);
    setLocalLoading(false);
  };

  return (
    <div
      id={`mission-${adventure.id}`}
      onClick={onSelect}
      className={`
        glass-base rounded-2xl p-6 cursor-pointer
        transition-all duration-300 border
        ${isSelected
          ? 'border-red-400/60 shadow-investigation ring-1 ring-red-500/20 scale-[1.01]'
          : 'border-red-500/20 hover:border-red-400/40 hover:scale-[1.005]'}
      `}
    >
      {/* Title + status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-display text-xl font-bold text-neutral-50 leading-snug flex-1">
          {adventure.display_title}
        </h3>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${cfg.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* Scouting location notice */}
      {isScouting && (
        <div className="flex items-center gap-1.5 text-xs text-amber-400/70 mb-3 font-mono">
          <Lock className="w-3 h-3" />
          Location withheld until confirmed
        </div>
      )}

      {/* Description */}
      <p className="text-neutral-300 text-sm leading-relaxed mb-4">
        {adventure.display_description || 'Mission brief pending.'}
      </p>

      {/* Coordinates (for non-scouting missions) */}
      {!isScouting && (
        <div className="flex items-center gap-2 text-xs text-neutral-100 mb-4 font-mono">
          <MapPin className="w-3 h-3 text-red-400/70" />
          {adventure.display_lat.toFixed(4)}°N, {adventure.display_lng.toFixed(4)}°E
        </div>
      )}

      {/* Budget progress */}
      <div className="mb-5">
        <div className="flex justify-between items-end mb-1.5">
          <span className="text-xs text-neutral-100 uppercase tracking-wider font-semibold">Mission Budget</span>
          <span className="text-sm text-red-400 font-bold">
            £{adventure.bounty_current.toFixed(2)}
            <span className="text-neutral-500 font-normal"> / £{adventure.bounty_target.toFixed(2)}</span>
          </span>
        </div>
        <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-neutral-100 mt-1">{progress.toFixed(0)}% funded</p>
      </div>

      {/* Contribute or Done */}
      {isDone ? (
        <div className="flex items-center justify-center gap-2 py-2.5 border border-neutral-700/50 rounded-xl text-neutral-500 text-xs">
          <CheckCircle className="w-4 h-4" />
          Mission complete — fully funded
        </div>
      ) : (
        <div onClick={e => e.stopPropagation()}>
          {contributionSuccess ? (
            <div className="flex items-center justify-center gap-2 py-3 bg-green-500/10 border border-green-500/30 rounded-xl animate-in zoom-in duration-500">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-green-400 text-sm font-semibold">Thanks for your support!</p>
                <p className="text-green-400/60 text-xs">Mission funding verified.</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-semibold pointer-events-none">£</span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleContribute(e as unknown as React.MouseEvent)}
                  placeholder="Amount"
                  min="1"
                  step="1"
                  className="
                    w-full pl-7 pr-3 py-2.5
                    bg-neutral-900/80 border border-neutral-700
                    rounded-xl text-white text-sm placeholder-neutral-600
                    focus:outline-none focus:border-green-400
                    transition-colors
                  "
                />
              </div>
              <button
                onClick={handleContribute}
                disabled={!amount || Number(amount) < 1 || localLoading}
                className="
                  px-4 py-2 flex items-center gap-2
                  bg-green-500/10 hover:bg-green-500/20 border border-green-500/30
                  disabled:bg-neutral-800 disabled:border-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed
                  text-green-400 text-sm font-bold rounded-xl
                  transition-colors whitespace-nowrap
                "
              >
                {localLoading ? (
                  <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                )}
                Contribute
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Map Updater Component ──────────────────────────────────────────────────
const MapUpdater = ({ selected, trigger }: { selected: SecureAdventure | null, trigger: number }) => {
  const map = useMap();

  useEffect(() => {
    if (selected) {
      // Calculate offset: we want the marker to appear 300px LOWER than the center.
      // To do this, we fly to a point that is 300px ABOVE the marker's actual coordinates.
      const targetLatLng: L.LatLngExpression = [selected.display_lat, selected.display_lng];
      
      const timer = setTimeout(() => {
        // Project the marker to pixel coordinates at the target zoom (13)
        const targetPoint = map.project(targetLatLng, 13);
        // Subtract 300px from Y (moving the center UP, which moves the marker DOWN on screen)
        const offsetPoint = L.point(targetPoint.x, targetPoint.y - 300);
        // Unproject back to LatLng
        const offsetLatLng = map.unproject(offsetPoint, 13);

        map.flyTo(offsetLatLng, 13, { animate: true, duration: 1.5 });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selected, map, trigger]);

  return null;
};

// ─── Main Page ──────────────────────────────────────────────────────────────
export const MissionControlPage: React.FC = () => {
  const [adventures, setAdventures] = useState<SecureAdventure[]>([]);
  const [selected, setSelected] = useState<SecureAdventure | null>(null);
  const [flyTrigger, setFlyTrigger] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutSession | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const success = searchParams.get('success') === 'true';

  useEffect(() => {
    if (success) {
      // Clean URL after 5 seconds of showing success message
      const timer = setTimeout(() => {
        searchParams.delete('success');
        searchParams.delete('session_id');
        searchParams.delete('mission_id');
        setSearchParams(searchParams);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, searchParams, setSearchParams]);

  const handleInitiateContribution = async (amount: number, missionId: string, missionName: string) => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Contribution: ${missionName}`,
          price: amount * 100, // to pence
          quantity: 1,
          mode: 'contribution',
          missionId,
          missionName
        })
      });

      const data = (await response.json()) as CheckoutSession;
      if (data.clientSecret) {
        // We append mission_id to the URL temporarily so we can highlight the correct card on return
        searchParams.set('mission_id', missionId);
        setSearchParams(searchParams, { replace: true });
        setCheckoutData(data);
      }
    } catch (err) {
      console.error('Failed to initiate contribution:', err);
      alert('Mission logistics failure. Please try again.');
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await AdventureService.initializeSampleData();
        const data = await AdventureService.getSecureAdventures();
        setAdventures(data);
        if (data.length > 0) setSelected(data[0]);
      } catch {
        try {
          await MockAdventureService.initializeSampleData();
          const data = await MockAdventureService.getSecureAdventures();
          setAdventures(data);
          if (data.length > 0) setSelected(data[0]);
          setIsDemo(true);
        } catch (err) {
          console.error('Failed to load missions:', err);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'scouting', label: 'Planning' },
    { id: 'greenlit', label: 'Confirmed' },
    { id: 'active', label: 'In Progress' },
    { id: 'complete', label: 'Done' },
  ];

  const filtered = statusFilter === 'all'
    ? adventures
    : adventures.filter(a => a.status === statusFilter);

  const mapCenter: [number, number] = adventures.length > 0
    ? [adventures[0].display_lat, adventures[0].display_lng]
    : [51.505, -0.09];

  const scrollToCard = (adventure: SecureAdventure) => {
    setSelected(adventure);
    setTimeout(() => {
      const el = document.getElementById(`mission-${adventure.id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const stats = [
    { label: 'In Progress', count: adventures.filter(a => a.status === 'active').length, color: 'text-blue-400' },
    { label: 'Confirmed', count: adventures.filter(a => a.status === 'greenlit').length, color: 'text-green-400' },
    { label: 'Planning', count: adventures.filter(a => a.status === 'scouting').length, color: 'text-amber-400' },
    { label: 'Done', count: adventures.filter(a => a.status === 'complete').length, color: 'text-neutral-400' },
  ];

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-black">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-black">
      <Head
        title="Prole Control"
        description="Track active Prole Adventures missions and contribute to the cause."
      />

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <section className="py-10 px-4 border-b border-red-500/10">
        <div className="max-w-7xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-red-400 transition-colors text-sm mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1 className="font-display text-5xl md:text-6xl font-bold text-neutral-50 mb-3">
                Prole Control
              </h1>
              <p className="text-neutral-400 text-lg max-w-2xl">
                Every adventure needs a budget. Browse active missions, see what's in planning,
                and help fund the ones worth doing.
              </p>
            </div>

            {/* Stat chips */}
            <div className="flex gap-3 flex-wrap">
              {stats.map(s => (
                <div key={s.label} className="glass-subtle rounded-xl px-4 py-3 text-center min-w-[72px] border border-red-500/10">
                  <p className={`text-2xl font-bold font-display ${s.color}`}>{s.count}</p>
                  <p className="text-xs text-neutral-100 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {isDemo && (
            <div className="mt-5 flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs font-mono w-fit">
              <AlertCircle className="w-4 h-4" />
              Demo mode — Supabase unavailable
            </div>
          )}
        </div>
      </section>

      {/* ─── Full-width Map ──────────────────────────────────────────────── */}
      <section className="px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div
            id="mission-map"
            className="rounded-2xl overflow-hidden border border-red-500/20"
            style={{ boxShadow: '0 0 40px rgba(239,68,68,0.15)' }}
          >
            <MapContainer
              center={mapCenter}
              zoom={7}
              style={{ height: '800px', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapUpdater selected={selected} trigger={flyTrigger} />

              {adventures.map(adv => {
                return (
                  <Marker
                    key={adv.id}
                    position={[adv.display_lat, adv.display_lng]}
                    icon={createMapPin(adv.status, selected?.id === adv.id)}
                    eventHandlers={{
                      click: () => {
                        setSelected(adv);
                      }
                    }}
                  >
                    <Popup autoPanPadding={[50, 50]}>
                      <div className="p-2 min-w-[320px] bg-black/95">
                        {(() => {
                          const isDone = adv.status === 'complete';
                          const isPlanning = adv.status === 'scouting';
                          const progress = Math.min((adv.bounty_current / adv.bounty_target) * 100, 100);
                          const cfg = STATUS_CONFIG[adv.status] ?? STATUS_CONFIG.scouting;

                          return (
                            <div className="space-y-4">
                              {/* Header: Title + Status Badge */}
                              <div className="flex justify-between items-start gap-3">
                                <h4 className="font-bold text-neutral-50 text-lg leading-tight flex-1">{adv.display_title}</h4>
                                <span className={`text-[11px] px-2 py-1 rounded-full border ${cfg.badge}`}>
                                  {cfg.label}
                                </span>
                              </div>

                              {/* Thumbnail Image (if available) */}
                              {adv.thumbnail_url && (
                                <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-500/20 shadow-2xl bg-neutral-900">
                                  <img 
                                    src={adv.thumbnail_url} 
                                    className="w-full h-full object-cover" 
                                    alt={adv.display_title}
                                    onError={(e) => {
                                      // Log for debugging
                                      console.error('Map Popup Image failed to load:', adv.thumbnail_url);
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/10" />
                                </div>
                              )}

                              {/* Description (truncated) */}
                              <p className="text-sm text-neutral-200 leading-relaxed line-clamp-4">
                                {isPlanning 
                                  ? (adv.display_description?.split(/[.!?]/)[0] + '.')
                                  : adv.display_description
                                }
                              </p>

                              {/* Location / Status Info */}
                              {isPlanning ? (
                                <div className="flex items-center gap-2 text-xs text-amber-400 font-mono py-1.5 px-3 bg-amber-400/5 rounded-lg border border-amber-400/20">
                                  <Lock className="w-4 h-4" />
                                  Location withheld until confirmed
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-xs text-neutral-300 font-mono">
                                  <MapPin className="w-4 h-4 text-red-500/70" />
                                  {adv.display_lat.toFixed(4)}°N, {adv.display_lng.toFixed(4)}°E
                                </div>
                              )}

                              {/* Progress Bar (if not done and not planning) or simple budget */}
                              {!isPlanning && (
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-neutral-400 uppercase tracking-widest">Funding Goal</span>
                                    <span className="text-red-400">£{adv.bounty_current.toLocaleString()} / £{adv.bounty_target.toLocaleString()}</span>
                                  </div>
                                  <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden border border-neutral-700/30">
                                    <div className="bg-gradient-to-r from-red-600 to-red-400 h-full transition-all duration-700 shadow-[0_0_10px_rgba(239,68,68,0.3)]" style={{ width: `${progress}%` }} />
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons */}
                              {isDone && adv.video_url ? (
                                <a
                                  href={adv.video_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-neutral-500/20 hover:bg-neutral-500/30 border border-neutral-500/40 rounded-full font-bold transition-all !text-white text-sm"
                                  style={{ color: 'white' }}
                                >
                                  <div className="w-2 h-2 rounded-full bg-neutral-400" />
                                  WATCH ADVENTURE
                                </a>
                              ) : !isDone && (
                                <button
                                  onClick={() => scrollToCard(adv)}
                                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-neutral-100/5 hover:bg-neutral-100/10 border border-neutral-100/20 rounded-full !text-white text-sm font-bold transition-all"
                                  style={{ color: 'white' }}
                                >
                                  <div className={`w-2 h-2 rounded-full ${cfg.dot} ${adv.status === 'active' ? 'animate-pulse' : ''}`} />
                                  {isPlanning ? 'FUND THIS MISSION' : 'CONTRIBUTE TO MISSION'}
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
          <p className="text-xs text-neutral-700 mt-2 text-right font-mono">
            Click a pin to jump to that mission below ↓
          </p>
        </div>
      </section>

      {/* ─── Filters ─────────────────────────────────────────────────────── */}
      <section className="px-4 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2">
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`
                  px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                  ${statusFilter === f.id
                    ? 'bg-red-600 text-white shadow-investigation'
                    : 'glass-subtle text-neutral-400 hover:text-neutral-100 hover:glass-base'}
                `}
              >
                {f.label}
                <span className="ml-2 text-xs opacity-50">
                  ({f.id === 'all'
                    ? adventures.length
                    : adventures.filter(a => a.status === f.id).length})
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Mission Cards ───────────────────────────────────────────────── */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <Shield className="w-12 h-12 text-neutral-800 mx-auto mb-3" />
              <p className="text-neutral-600">No missions in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(adv => (
                <MissionCard
                  key={adv.id}
                  adventure={adv}
                  isSelected={selected?.id === adv.id}
                  contributionSuccess={success && searchParams.get('mission_id') === adv.id}
                  onContribute={handleInitiateContribution}
                  onSelect={() => {
                    setSelected(adv);
                    setFlyTrigger(f => f + 1);
                    document.getElementById('mission-map')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Footer notice ───────────────────────────────────────────────── */}
      <section className="px-4 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="glass-subtle rounded-xl p-5 border border-red-500/10 flex items-start gap-3">
            <Lock className="w-5 h-5 text-red-400/50 flex-shrink-0 mt-0.5" />
            <p className="text-white text-sm leading-relaxed">
              <span className="text-red-400 font-semibold">Planning missions</span> have their precise coordinates
              withheld until officially confirmed — to protect locations ahead of the visit.
              All contributions go directly toward making the mission happen.{' '}
              <span className="text-neutral-400 text-xs font-mono uppercase">Secure Encrypted Processing Active</span>
            </p>
          </div>
        </div>
      </section>

      {/* ─── Checkout Modal ───────────────────────────────────────────────── */}
      {checkoutData && (
        <EmbeddedCheckoutModal
          clientSecret={checkoutData.clientSecret}
          onClose={() => setCheckoutData(null)}
        />
      )}
    </div>
  );
};