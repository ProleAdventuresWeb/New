import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shield, MapPin, ArrowLeft, ArrowRight, CheckCircle, Lock, AlertCircle, BookOpen, ExternalLink, Calendar, Trophy } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Head } from '../components/Head';
import { YouTubeFacade } from '../components/YouTubeFacade';
import {
  getAdventures,
  SecureAdventure,
  isMissionRedacted,
  applyCoordinateJitter
} from '../lib/supabase';
import { AdventureService } from '../services/adventureService';
import { MockAdventureService } from '../services/mockAdventureService';
import { PageLoader } from '../components/PageLoader';
import { EmbeddedCheckoutModal } from '../components/EmbeddedCheckoutModal';

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
const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string; glow: string; border: string }> = {
  scouting: {
    label: 'Planning',
    dot: 'bg-amber-400',
    badge: 'text-amber-400 bg-amber-400/10 border border-amber-400/30',
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.15)]',
    border: 'border-amber-400/30'
  },
  greenlit: {
    label: 'Confirmed',
    dot: 'bg-green-400',
    badge: 'text-green-400 bg-green-400/10 border border-green-400/30',
    glow: 'shadow-[0_0_20px_rgba(74,222,128,0.15)]',
    border: 'border-green-400/30'
  },
  active: {
    label: 'In Progress',
    dot: 'bg-blue-400 animate-pulse',
    badge: 'text-blue-400 bg-blue-400/10 border border-blue-400/30',
    glow: 'shadow-[0_0_20px_rgba(96,165,250,0.15)]',
    border: 'border-blue-400/30'
  },
  complete: {
    label: 'Done',
    dot: 'bg-neutral-500',
    badge: 'text-neutral-400 bg-neutral-400/10 border border-neutral-400/30',
    glow: 'shadow-none',
    border: 'border-neutral-700/50'
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
  onContribute: (amount: number, missionId: string, missionName: string, missionCodename: string, rewardType?: string, rewardTitle?: string) => Promise<void>;
  onProleFoods: (tier: 'snack' | 'dinner', adventure: SecureAdventure) => Promise<void>;
  contributionSuccess: boolean;
  proleFoodsSuccess: boolean;
}

const MissionCard: React.FC<MissionCardProps> = ({
  adventure, isSelected, onSelect, onContribute, onProleFoods,
  contributionSuccess, proleFoodsSuccess
}) => {
  const [amount, setAmount] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [foodLoading, setFoodLoading] = useState<'snack' | 'dinner' | null>(null);
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
    await onContribute(val, adventure.id, adventure.display_title, adventure.codename, adventure.reward_type, adventure.reward_title);
    setLocalLoading(false);
  };

  const handleProleFoods = async (e: React.MouseEvent, tier: 'snack' | 'dinner') => {
    e.stopPropagation();
    setFoodLoading(tier);
    await onProleFoods(tier, adventure);
    setFoodLoading(null);
  };

  // Completed Billboard Card (Spine §16 spec)
  if (isDone) {
    const formattedDate = adventure.audit_date
      ? new Date(adventure.audit_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : adventure.created_at
        ? new Date(adventure.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : '';

    return (
      <div
        id={`mission-${adventure.id}`}
        onClick={onSelect}
        className={`
          glass-base rounded-2xl p-6 cursor-pointer
          transition-all duration-300 border-[3px] space-y-4
          ${isSelected
            ? `ring-2 ring-red-500/40 scale-[1.02] shadow-[0_0_25px_rgba(239,68,68,0.15)] border-red-500/40`
            : `hover:scale-[1.005] border-neutral-800 hover:border-neutral-700`}
        `}
      >
        {/* Media slot: YouTube Facade (click-to-play only, never autoplay) */}
        <YouTubeFacade
          videoId={adventure.youtube_id}
          videoUrl={adventure.video_url}
          thumbnailUrl={adventure.thumbnail_url}
          title={adventure.display_title}
        />

        {/* Title: Place #Episode + Score */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div>
            <h3 className="font-display text-2xl font-bold text-neutral-50 leading-tight">
              {adventure.display_title} {adventure.episode_number ? `#${adventure.episode_number}` : ''}
            </h3>
            {formattedDate && (
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono mt-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                <span>Audited: {formattedDate}</span>
              </div>
            )}
          </div>
          {adventure.score !== null && adventure.score !== undefined && (
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono text-neutral-500 uppercase">Score</span>
              <span className={`text-lg font-black font-display px-2.5 py-0.5 rounded-lg border ${
                adventure.score >= 80 ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40' :
                adventure.score >= 60 ? 'text-amber-400 bg-amber-950/60 border-amber-500/40' :
                'text-red-400 bg-red-950/60 border-red-500/40'
              }`}>
                {adventure.score}
              </span>
            </div>
          )}
        </div>

        {/* Verdict Line */}
        {adventure.verdict_line && (
          <p className="text-sm text-red-400/90 font-medium italic border-l-2 border-red-500/50 pl-3 py-0.5">
            &ldquo;{adventure.verdict_line}&rdquo;
          </p>
        )}

        {/* Description */}
        <p className="text-neutral-300 text-sm leading-relaxed">
          {adventure.display_description || 'Audit completed.'}
        </p>

        {/* Coordinates */}
        <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
          <MapPin className="w-3.5 h-3.5 text-red-400/70" />
          {adventure.display_lat.toFixed(4)}°N, {adventure.display_lng.toFixed(4)}°E
        </div>

        {/* Actions: READ THE STORY CTA + Watch on YouTube */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2" onClick={e => e.stopPropagation()}>
          {adventure.story_slug ? (
            <Link
              to={`/stories/${adventure.story_slug}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-red-950/40"
            >
              <BookOpen className="w-4 h-4" />
              READ THE STORY
            </Link>
          ) : (
            <Link
              to="/league"
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              VIEW ON LEAGUE
            </Link>
          )}

          {(adventure.video_url || adventure.youtube_id) && (
            <a
              href={adventure.video_url || `https://www.youtube.com/watch?v=${adventure.youtube_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-3 px-3.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-colors"
              title="Watch on YouTube"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">YouTube</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      id={`mission-${adventure.id}`}
      onClick={onSelect}
      className={`
        glass-base rounded-2xl p-6 cursor-pointer
        transition-all duration-300 border-[3px]
        ${isSelected
          ? `ring-2 ring-red-500/40 scale-[1.02] ${cfg.glow} ${cfg.border}`
          : `hover:scale-[1.005] ${cfg.border} hover:border-red-400/40`}
      `}
    >
      <h3 className="font-display text-2xl font-bold text-neutral-50 leading-tight mb-4">
        {adventure.display_title}
      </h3>

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

      {/* Mission Reward Block */}
      {adventure.is_reward_active && adventure.reward_title && (
        <div className="mb-5 bg-neutral-900/60 border border-neutral-700/50 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Instant Reward
            </span>
            <span className="text-white text-sm font-bold">{adventure.reward_title}</span>
          </div>
          {adventure.reward_description && (
            <p className="text-neutral-400 text-xs leading-relaxed">
              {adventure.reward_description}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <CheckCircle className="w-3.5 h-3.5 text-green-400/80" />
            <span className="text-neutral-500 text-[11px] font-mono uppercase">
              {adventure.reward_delivery_mode === 'email' ? 'Delivered instantly by email after payment' : 'Delivered instantly after payment'}
            </span>
          </div>
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
        <div className="w-full bg-neutral-800/50 rounded-full h-1.5 overflow-hidden border border-white/5">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${adventure.bounty_target > 0 ? progress : 100}%`,
              background: (() => {
                const pct = adventure.bounty_target > 0 ? progress : 100;
                // Hue: 0 = red, 120 = green; interpolate linearly with progress
                const hue = Math.round((pct / 100) * 120);
                const startHue = Math.max(0, hue - 15);
                return `linear-gradient(to right, hsl(${startHue}, 90%, 40%), hsl(${hue}, 90%, 50%))`;
              })(),
            }}
          />
        </div>
        <p className="text-[10px] font-mono text-neutral-500 mt-2 uppercase tracking-tighter">
          {adventure.bounty_target > 0 ? `${progress.toFixed(0)}% funded` : 'Direct Funding Complete'}
        </p>
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
                {adventure.is_reward_active ? 'Fund & Get Reward' : 'Contribute'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Prole Foods Section ──────────────────────────────────────────── */}
      {!isDone && (
        <div onClick={e => e.stopPropagation()} className="mt-4 border-t border-neutral-800/60 pt-4">
          {proleFoodsSuccess ? (
            <div className="flex items-center gap-2 py-2.5 px-3 bg-amber-500/10 border border-amber-500/30 rounded-xl animate-in zoom-in duration-500">
              <span className="text-lg">🥪</span>
              <p className="text-amber-400 text-xs font-semibold">Prole Foods slot claimed — instruction received.</p>
            </div>
          ) : adventure.prole_foods_claimed ? (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <span className="text-base">🥪</span>
              <p className="text-amber-300 text-xs font-semibold">
                Prole Foods: Claimed
                {adventure.prole_foods_donor_name && (
                  <span className="text-amber-400/70 font-normal">
                    {' '}by {adventure.prole_foods_donor_name}
                    {adventure.prole_foods_town ? ` (${adventure.prole_foods_town})` : ''}
                  </span>
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-neutral-500 text-[11px] uppercase tracking-widest font-mono">
                🥪 Prole Foods — Fund a food stop &amp; get a shout-out in the film
              </p>
              <div className="flex gap-2">
                <button
                  onClick={(e) => handleProleFoods(e, 'snack')}
                  disabled={foodLoading !== null}
                  className="
                    flex-1 py-2.5 flex items-center justify-center gap-2
                    bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30
                    disabled:opacity-50 disabled:cursor-not-allowed
                    text-amber-400 text-sm font-bold rounded-xl
                    transition-colors
                  "
                >
                  {foodLoading === 'snack' ? (
                    <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  ) : '🥪'}
                  Snack £5
                </button>
                <button
                  onClick={(e) => handleProleFoods(e, 'dinner')}
                  disabled={foodLoading !== null}
                  className="
                    flex-1 py-2.5 flex items-center justify-center gap-2
                    bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30
                    disabled:opacity-50 disabled:cursor-not-allowed
                    text-orange-400 text-sm font-bold rounded-xl
                    transition-colors
                  "
                >
                  {foodLoading === 'dinner' ? (
                    <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                  ) : '🍲'}
                  Dinner £10
                </button>
              </div>
              <p className="text-neutral-600 text-[10px] font-mono text-center">
                One slot per mission · First come, first served
              </p>
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
    if (selected && Number.isFinite(selected.display_lat) && Number.isFinite(selected.display_lng)) {
      const targetLatLng: L.LatLngExpression = [selected.display_lat, selected.display_lng];

      const timer = setTimeout(() => {
        const targetPoint = map.project(targetLatLng, 13);
        const offsetPoint = L.point(targetPoint.x, targetPoint.y - 300);
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
  const proleFoodsSuccessParam = searchParams.get('prole_foods') === 'claimed';
  const targetPinId = searchParams.get('pin') || searchParams.get('mission_id');

  // Deep-link auto-select pin if present in URL (?pin=<id> or ?mission_id=<id>)
  useEffect(() => {
    if (adventures.length > 0 && targetPinId) {
      const match = adventures.find(a => a.id === targetPinId || a.story_slug === targetPinId);
      if (match) {
        setSelected(match);
        setFlyTrigger(prev => prev + 1);
        setTimeout(() => {
          const el = document.getElementById(`mission-${match.id}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
  }, [adventures, targetPinId]);

  useEffect(() => {
    if (success || proleFoodsSuccessParam) {
      const timer = setTimeout(() => {
        searchParams.delete('success');
        searchParams.delete('session_id');
        searchParams.delete('mission_id');
        searchParams.delete('prole_foods');
        setSearchParams(searchParams);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, proleFoodsSuccessParam, searchParams, setSearchParams]);

  const handleInitiateContribution = async (amount: number, missionId: string, missionName: string, missionCodename: string, rewardType?: string, rewardTitle?: string) => {
    try {
      const response = await fetch('/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Contribution: ${missionName}`,
          price: amount * 100,
          quantity: 1,
          mode: 'contribution',
          missionId,
          missionName,
          missionSlug: (missionCodename || '').toLowerCase().replace(/\s+/g, '-'),
          rewardType: rewardType || null,
          rewardTitle: rewardTitle || null
        })
      });

      const data = await response.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Failed to initiate contribution:', err);
      alert('Mission logistics failure. Please try again.');
    }
  };

  const handleInitiateProleFoods = async (tier: 'snack' | 'dinner', adventure: SecureAdventure) => {
    try {
      const response = await fetch('/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'prole_foods',
          missionId: adventure.id,
          missionName: adventure.display_title,
          foodTier: tier,
          // Required by the validation guard but unused in prole_foods path:
          name: 'prole_foods',
          price: tier === 'dinner' ? 1000 : 500,
          quantity: 1,
        })
      });

      const data = await response.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Failed to initiate Prole Foods:', err);
      alert('Could not open Prole Foods checkout. Please try again.');
    }
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Run sample init in background without blocking mission display
        AdventureService.initializeSampleData().catch(() => {});
        const data = await AdventureService.getSecureAdventures();
        if (isMounted) {
          setAdventures(data);
        }
      } catch {
        try {
          const data = await MockAdventureService.getSecureAdventures();
          if (isMounted) {
            setAdventures(data);
            setIsDemo(true);
          }
        } catch (err) {
          console.error('Failed to load missions:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
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

  // Start wide enough to show the UK and every mission pin. Selecting a card or
  // marker still invokes MapUpdater, which performs the close-up fly-to.
  const mapCenter: [number, number] = [55.4, -3.4];

  const scrollToCard = (adventure: SecureAdventure) => {
    setSelected(adventure);
    setTimeout(() => {
      const el = document.getElementById(`mission-${adventure.id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

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
        title="Prole Control | Place Audits & Field Missions"
        description="Browse on-the-ground place audits and field missions examining rent, food, safety, transport, access and the realities of everyday life."
      />

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <section className="py-10 px-4 border-b border-red-500/10">
        <div className="max-w-7xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-neutral-500 hover:text-red-400 transition-colors text-sm mb-6 font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1 className="font-display text-5xl md:text-7xl font-bold text-neutral-50 mb-3 tracking-tight uppercase">
                Prole Control
              </h1>
              <p className="text-xl text-neutral-400 max-w-2xl leading-relaxed">
                Back the next mission.<br />
                Browse upcoming trips, fund the ones you want to see, or buy me dinner for a shout-out in the Prole Foods segment.<br />
                Every contributor gets behind-the-scenes access.
              </p>
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
                zoom={5}
              style={{ height: '800px', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapUpdater selected={selected} trigger={flyTrigger} />

              {adventures.filter(adv => Number.isFinite(adv.display_lat) && Number.isFinite(adv.display_lng)).map(adv => {
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

                          if (isDone) {
                            const formattedDate = adv.audit_date
                              ? new Date(adv.audit_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                              : adv.created_at
                                ? new Date(adv.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                : '';

                            return (
                              <div className="space-y-3 p-1">
                                {/* Media Slot: Facade */}
                                <YouTubeFacade
                                  videoId={adv.youtube_id}
                                  videoUrl={adv.video_url}
                                  thumbnailUrl={adv.thumbnail_url}
                                  title={adv.display_title}
                                />

                                {/* Title: Place #Episode + Score */}
                                <div className="flex justify-between items-start gap-2">
                                  <div>
                                    <h4 className="font-bold text-neutral-50 text-base leading-tight">
                                      {adv.display_title} {adv.episode_number ? `#${adv.episode_number}` : ''}
                                    </h4>
                                    {formattedDate && (
                                      <span className="text-[10px] text-neutral-400 font-mono">Audited: {formattedDate}</span>
                                    )}
                                  </div>
                                  {adv.score !== null && adv.score !== undefined && (
                                    <span className={`text-xs font-black font-display px-2 py-0.5 rounded border ${
                                      adv.score >= 80 ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40' :
                                      adv.score >= 60 ? 'text-amber-400 bg-amber-950/60 border-amber-500/40' :
                                      'text-red-400 bg-red-950/60 border-red-500/40'
                                    }`}>
                                      {adv.score}
                                    </span>
                                  )}
                                </div>

                                {/* Verdict line */}
                                {adv.verdict_line && (
                                  <p className="text-xs text-red-400/90 italic border-l border-red-500/50 pl-2">
                                    &ldquo;{adv.verdict_line}&rdquo;
                                  </p>
                                )}

                                {/* Description */}
                                <p className="text-xs text-neutral-300 leading-relaxed line-clamp-3">
                                  {adv.display_description}
                                </p>

                                {/* Coordinates */}
                                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono">
                                  <MapPin className="w-3 h-3 text-red-500/70" />
                                  {adv.display_lat.toFixed(4)}°N, {adv.display_lng.toFixed(4)}°E
                                </div>

                                {/* Actions */}
                                <div className="pt-1 flex flex-col gap-1.5">
                                  {adv.story_slug ? (
                                    <Link
                                      to={`/stories/${adv.story_slug}`}
                                      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                                    >
                                      <BookOpen className="w-3.5 h-3.5" />
                                      READ THE STORY
                                    </Link>
                                  ) : (
                                    <Link
                                      to="/league"
                                      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                                    >
                                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                                      VIEW ON LEAGUE
                                    </Link>
                                  )}

                                  {(adv.video_url || adv.youtube_id) && (
                                    <a
                                      href={adv.video_url || `https://www.youtube.com/watch?v=${adv.youtube_id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      Watch on YouTube
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          }

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
                                  {adv.is_reward_active ? 'FUND & GET REWARD' : isPlanning ? 'FUND THIS MISSION' : 'CONTRIBUTE TO MISSION'}
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
          <div className="flex flex-wrap gap-4">
            {filters.map(f => {
              const count = f.id === 'all'
                ? adventures.length
                : adventures.filter(a => a.status === f.id).length;

              // Map colors explicitly for the deliberate look
              const colors: Record<string, { text: string; border: string; glow: string; bg: string }> = {
                all: { text: 'text-red-500', border: 'border-red-500', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.25)]', bg: 'bg-red-500/5' },
                active: { text: 'text-blue-400', border: 'border-blue-400', glow: 'shadow-[0_0_15px_rgba(96,165,250,0.25)]', bg: 'bg-blue-400/5' },
                greenlit: { text: 'text-green-400', border: 'border-green-400', glow: 'shadow-[0_0_15px_rgba(74,222,128,0.25)]', bg: 'bg-green-400/5' },
                scouting: { text: 'text-amber-400', border: 'border-amber-400', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.25)]', bg: 'bg-amber-400/5' },
                complete: { text: 'text-neutral-400', border: 'border-neutral-500', glow: 'shadow-[0_0_15px_rgba(156,163,175,0.2)]', bg: 'bg-neutral-500/5' }
              };
              const c = colors[f.id] || colors.all;
              const isActive = statusFilter === f.id;

              return (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`
                    flex flex-col items-center justify-center
                    w-28 h-28 rounded-2xl transition-all duration-300
                    border-[3px] backdrop-blur-md
                    ${isActive
                      ? `${c.bg} ${c.border} ${c.glow} scale-105 z-10`
                      : `bg-neutral-900/80 border-neutral-800/50 hover:border-neutral-700`}
                  `}
                >
                  <span className={`text-4xl font-black font-display mb-1 ${isActive ? c.text : 'text-neutral-600'}`}>
                    {count}
                  </span>
                  <span className={`text-[11px] font-bold uppercase tracking-widest ${isActive ? 'text-neutral-100' : 'text-neutral-500'}`}>
                    {f.label}
                  </span>
                </button>
              );
            })}
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
                  proleFoodsSuccess={proleFoodsSuccessParam && searchParams.get('mission_id') === adv.id}
                  onContribute={handleInitiateContribution}
                  onProleFoods={handleInitiateProleFoods}
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

    </div>
  );
};
