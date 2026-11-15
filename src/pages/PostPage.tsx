import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import { Calendar, Clock, ArrowLeft, ArrowRight, Share2, Twitter, Copy, Check, Youtube, Heart, Lock, Key, ShieldCheck, Unlock, AlertTriangle, Shield, Target, Sparkles, MapPin, Trophy } from 'lucide-react';
import { getPostBySlug, getPostsByCategory, getAdjacentPosts } from '../lib/posts';
import { getAdventures, getAuditByStorySlug, type SecureAdventure } from '../lib/supabase';
import { AdventureService } from '../services/adventureService';
import { YouTubeFacade } from '../components/YouTubeFacade';
import { useAuth } from '../lib/auth';
import type { Post, PostPreview, TemplateData } from '../types/post';
import { Head } from '../components/Head';

// ─── Audit Dossier Header (Spine §15–16) ────────────────────────────────────
const AuditDossierHeader: React.FC<{ audit: SecureAdventure }> = ({ audit }) => {
  const formattedDate = audit.audit_date
    ? new Date(audit.audit_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : audit.created_at
      ? new Date(audit.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '';

  return (
    <section className="mb-12 bg-gradient-to-b from-neutral-900/90 via-neutral-950 to-black rounded-3xl border border-red-500/30 p-6 md:p-10 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Trophy className="w-48 h-48 text-red-500" />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950/80 border border-red-500/40 rounded-full text-red-400 text-xs font-mono uppercase tracking-widest">
            <span>🍅</span> Spine Audit Dossier {audit.episode_number ? `#${audit.episode_number}` : ''}
          </div>

          <Link
            to={`/prole-control?pin=${audit.id}`}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-red-500/50 text-neutral-300 hover:text-white font-mono text-xs transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-red-400" />
            View Map Pin ({audit.display_lat.toFixed(3)}°N, {audit.display_lng.toFixed(3)}°E)
          </Link>
        </div>

        {/* Place & Score */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-800">
          <div>
            <h1 className="text-3xl md:text-5xl font-display font-black text-neutral-50 tracking-tight">
              {audit.display_title || audit.codename}
            </h1>
            {audit.verdict_line && (
              <p className="text-lg md:text-xl text-red-400 font-medium italic mt-2">
                &ldquo;{audit.verdict_line}&rdquo;
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-400 mt-3">
              {formattedDate && <span>AUDIT DATE: {formattedDate}</span>}
              {audit.conditions_line && (
                <>
                  <span>•</span>
                  <span>CONDITIONS: {audit.conditions_line}</span>
                </>
              )}
            </div>
          </div>

          {audit.score !== null && audit.score !== undefined && (
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-black/60 border border-neutral-800 shrink-0 min-w-[110px]">
              <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest mb-1">Audit Score</span>
              <span className={`text-4xl md:text-5xl font-black font-display ${
                audit.score >= 80 ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]' :
                audit.score >= 60 ? 'text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]' :
                'text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]'
              }`}>
                {audit.score}
              </span>
              <span className="text-[10px] font-mono text-neutral-500 mt-1">/ 100</span>
            </div>
          )}
        </div>

        {/* Evidence Stats Grid (Spine §16 five pressures) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
            <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">Actual Spend</span>
            <span className="text-base font-bold font-mono text-neutral-200">
              {audit.actual_spend_gbp !== null && audit.actual_spend_gbp !== undefined ? `£${Number(audit.actual_spend_gbp).toFixed(2)}` : '--'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
            <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">Kebab Index</span>
            <span className="text-base font-bold font-mono text-neutral-200">
              {audit.kebab_index_gbp !== null && audit.kebab_index_gbp !== undefined ? `£${Number(audit.kebab_index_gbp).toFixed(2)}` : '--'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
            <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">Tomato Index</span>
            <span className="text-base font-bold font-mono text-neutral-200">
              {audit.tomato_index_gbp !== null && audit.tomato_index_gbp !== undefined ? `£${Number(audit.tomato_index_gbp).toFixed(2)}` : '--'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
            <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">Exchanges</span>
            <span className="text-base font-bold font-mono text-neutral-200">
              {audit.exchanges_count ?? '--'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
            <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">Free Finds</span>
            <span className="text-base font-bold font-mono text-emerald-400">
              {audit.free_pins_found_count ?? '--'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
            <span className="text-[10px] font-mono uppercase text-neutral-500 block mb-1">Hassle Log</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {audit.hassle_log && audit.hassle_log.length > 0 ? (
                audit.hassle_log.map((h, i) => (
                  <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-500/30">
                    {h.type}
                  </span>
                ))
              ) : (
                <span className="text-xs font-mono text-neutral-500">None</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const MissionFundingCallout: React.FC<{ missionId?: string | null }> = ({ missionId }) => {
  const [mission, setMission] = useState<SecureAdventure | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getAdventures()
      .then((adventures) => {
        if (!isMounted || !adventures || adventures.length === 0) {
          setLoading(false);
          return;
        }

        if (missionId && missionId !== 'auto') {
          const found = adventures.find(a => a.id === missionId);
          if (found) {
            setMission(found);
            setLoading(false);
            return;
          }
        }

        // Auto selection: find active/scouting mission nearest to 100% or highest current bounty
        const uncompleted = adventures.filter(a => a.status !== 'complete');
        const sorted = (uncompleted.length > 0 ? uncompleted : adventures).sort((a, b) => {
          const pctA = (a.bounty_current || 0) / (a.bounty_target || 1);
          const pctB = (b.bounty_current || 0) / (b.bounty_target || 1);
          return pctB - pctA;
        });

        setMission(sorted[0] || null);
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [missionId]);

  if (loading || !mission) return null;

  const current = Number(mission.bounty_current || 0);
  const target = Number(mission.bounty_target || 100);
  const percentage = Math.min(100, Math.round((current / target) * 100));

  return (
    <section className="bg-gradient-to-br from-red-950/40 via-neutral-900/90 to-black p-8 md:p-12 rounded-3xl border border-red-500/30 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
        <Shield className="w-32 h-32 text-red-500" />
      </div>

      <div className="max-w-2xl mx-auto text-center relative z-10 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-red-950/80 border border-red-500/40 rounded-full text-red-400 text-xs font-mono font-bold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" /> Next Operation Awaiting Fuel
        </div>

        <div>
          <h3 className="text-2xl md:text-3xl font-display font-bold text-neutral-50 mb-2">
            Fund The Next Expedition: <span className="text-red-500">{mission.codename || mission.display_title}</span>
          </h3>
          <p className="text-neutral-400 text-sm md:text-base leading-relaxed max-w-lg mx-auto">
            Directly back this investigation on Prole Control. Financial contributors become recognized operatives and automatically receive classified clearance codes for all future dispatches.
          </p>
        </div>

        {/* Live Funding Progress Bar */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-400">OPERATION BOUNTY</span>
            <span className="text-red-400 font-bold">£{current.toFixed(2)} / £{target.toFixed(2)} ({percentage}%)</span>
          </div>
          <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(239,68,68,0.5)]"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div>
          <Link
            to={`/prole-control?mission_id=${mission.id}`}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-red-900/40 text-sm uppercase tracking-wider group"
          >
            <Target className="w-4 h-4" />
            Fuel This Mission on Prole Control
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

const TemplateLayout: React.FC<{ data: TemplateData; title: string }> = ({ data, title }) => {
  return (
    <div className="space-y-12">
      {/* 1. Hero section */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
        {data.heroImageUrl && (
          <div className="rounded-3xl overflow-hidden glass-elevated border border-neutral-800/50 shadow-glass aspect-video mb-12">
            <img src={data.heroImageUrl} alt={title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-neutral-50 mb-6 leading-tight">
            {title}
          </h1>
          <p className="text-xl text-neutral-400 leading-relaxed italic">
            {data.summary}
          </p>
        </div>
      </section>

      {/* 2. Affiliate banner */}
        <section className="animate-in fade-in duration-1000 delay-300">
          <a
            href={data.affiliateUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            data-umami-event="affiliate_click"
            className="block glass-elevated rounded-2xl overflow-hidden border border-red-500/20 shadow-lg shadow-red-950/10 group cursor-pointer"
          >
            <img src={data.affiliateImageUrl} alt="Recommended Gear" className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-500" />
          </a>
        </section>

      {/* 3. Text Block A */}
      <section className="prose-custom max-w-none text-neutral-300 leading-relaxed text-lg">
        <p>{data.textBlockA}</p>
      </section>

      {/* 4. Tweet / Text split */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center py-8">
        <div className="lg:col-span-1">
          {data.tweetUrl ? (
            <div className="glass-subtle p-6 rounded-2xl border border-neutral-800 shadow-glass hover:border-neutral-700 transition-colors bg-neutral-900/40">
              <div className="flex items-center gap-3 text-sky-400 hover:text-sky-300 transition-colors mb-4">
                <Twitter className="w-6 h-6" />
                <span className="font-bold uppercase tracking-widest text-xs">Live_Intelligence</span>
              </div>
              <p className="text-sm text-neutral-400 mb-6 leading-relaxed">External data point archived in the public square. View the full investigation thread below.</p>
              <a
                href={data.tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-umami-event="outbound_click"
                data-umami-event-type="tweet"
                className="inline-block w-full py-3 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-center rounded-xl font-bold text-xs uppercase tracking-widest border border-sky-500/20 transition-all duration-300"
              >
                Inspect Original Entry
              </a>
            </div>
          ) : (
            <div className="h-48 bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-800 flex items-center justify-center text-neutral-600 font-mono text-[10px] uppercase tracking-[0.2em] text-center p-8">
              Intelligence_Gaps_Found: Data_Point_Offline
            </div>
          )}
        </div>
        <div className="lg:col-span-2 prose-custom max-w-none text-neutral-300 leading-relaxed text-lg">
          <p>{data.textBlockB}</p>
        </div>
      </section>

      {/* 5. Text Block C */}
      <section className="prose-custom max-w-none text-neutral-300 leading-relaxed text-lg">
        <p>{data.textBlockC}</p>
      </section>

      {/* 6. Prole Control Mission Funding Callout */}
      {(data.missionCalloutEnabled ?? data.patreonCtaEnabled ?? true) && (
        <MissionFundingCallout missionId={data.missionCalloutId} />
      )}

      {/* 7. Text Block D */}
      <section className="prose-custom max-w-none text-neutral-300 leading-relaxed text-lg">
        <p>{data.textBlockD}</p>
      </section>

      {/* 8. YouTube video */}
      {data.youtubeUrl && (
        <section className="aspect-video w-full rounded-3xl overflow-hidden glass-elevated border border-neutral-800 shadow-glass">
          <iframe
            src={data.youtubeUrl.replace('watch?v=', 'embed/').split('&')[0]}
            title="Adventure Report"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </section>
      )}

      {/* 9. Close-out Text */}
      <section className="prose-custom max-w-none text-neutral-300 leading-relaxed text-lg border-t border-neutral-900 pt-16">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-0.5 bg-red-600"></div>
          <span className="text-red-500 font-mono text-xs uppercase tracking-[0.3em] font-bold">Final Transmission</span>
        </div>
        <p className="italic text-neutral-100 font-medium leading-relaxed bg-neutral-900/30 p-8 rounded-2xl border border-neutral-800/50 underline-offset-8 decoration-red-500/20 underline">
          &quot;{data.closeoutText}&quot;
        </p>
      </section>
    </div>
  );
};

export const PostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [audit, setAudit] = useState<SecureAdventure | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<PostPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [adjacent, setAdjacent] = useState<{ next: PostPreview | null; prev: PostPreview | null }>({ next: null, prev: null });

  // Gated Access State
  const [enteredCode, setEnteredCode] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const absoluteImageUrl = post?.cover_image_url.startsWith('http')
    ? post.cover_image_url
    : typeof window !== 'undefined'
      ? window.location.origin + post?.cover_image_url
      : post?.cover_image_url;

  const handleShareCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      console.warn('Clipboard sharing not supported on this browser.');
    }
  };

  const verifyAndUnlock = (codeToCheck: string, correctCode?: string | null) => {
    if (!correctCode) return false;
    const cleanInput = codeToCheck.trim().toUpperCase();
    const cleanTarget = correctCode.trim().toUpperCase();
    if (cleanInput === cleanTarget) {
      setIsUnlocked(true);
      setUnlockError(null);
      if (slug && typeof window !== 'undefined') {
        localStorage.setItem(`prole_access_${slug}`, cleanTarget);
      }
      return true;
    }
    return false;
  };

  const handleManualUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!post?.access_code) return;
    if (verifyAndUnlock(enteredCode, post.access_code)) {
      setUnlockError(null);
    } else {
      setUnlockError('Invalid Access Clearance Code. Please check your contributor email.');
    }
  };

  useEffect(() => {
    if (!slug) return;

    const loadData = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const result = await getPostBySlug(slug);
        if (!result) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setPost(result);

        // Check for attached audit record (Spine §15–16)
        try {
          const auditData = await getAuditByStorySlug(slug).catch(() => null);
          if (auditData) {
            setAudit(auditData);
          } else {
            const allAdventures = await AdventureService.getSecureAdventures().catch(() => []);
            const found = allAdventures.find(a =>
              a.story_slug === slug ||
              (a.codename && a.codename.toLowerCase().replace(/\s+/g, '-') === slug) ||
              (a.display_title && a.display_title.toLowerCase().replace(/\s+/g, '-') === slug)
            );
            if (found) setAudit(found);
          }
        } catch {
          // Non-critical
        }

        // Check unlock status
        if (!result.is_gated) {
          setIsUnlocked(true);
        } else {
          // Check if admin is logged in
          if (user?.email === 'contact@proleadventures.com') {
            setIsUnlocked(true);
          } else {
            // Check query param (?code=...)
            const urlCode = searchParams.get('code');
            const storedCode = typeof window !== 'undefined' ? localStorage.getItem(`prole_access_${slug}`) : null;

            if (urlCode && verifyAndUnlock(urlCode, result.access_code)) {
              // URL code unlocked it
            } else if (storedCode && verifyAndUnlock(storedCode, result.access_code)) {
              // Stored code unlocked it
            } else {
              setIsUnlocked(false);
            }
          }
        }

        // Fetch related and adjacent posts
        const [related, adj] = await Promise.all([
          getPostsByCategory(result.category),
          result.published_at ? getAdjacentPosts(result.published_at) : Promise.resolve({ next: null, prev: null })
        ]);

        const filtered = related
          .filter(p => p.slug !== slug)
          .slice(0, 3);
        setRelatedPosts(filtered);
        setAdjacent(adj);
      } catch (err) {
        console.error('Error loading post page:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    window.scrollTo(0, 0);
  }, [slug, searchParams, user]);

  if (!slug) {
    return (
      <div className="pt-32 min-h-screen bg-black text-center">
        <p className="text-red-500">Invalid story identifier.</p>
        <Link to="/stories" className="text-neutral-400 hover:text-white mt-4 inline-block underline">Back to Stories</Link>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="pt-32 min-h-screen bg-black px-4">
        <div className="max-w-2xl mx-auto text-center glass-elevated p-12 rounded-3xl border border-neutral-800 shadow-glass">
          <h1 className="text-4xl font-display font-bold text-neutral-50 mb-4">Story not found</h1>
          <p className="text-neutral-400 mb-8 leading-relaxed">
            The story you are looking for might have been removed, its URL changed, or it is not yet published to the archives.
          </p>
          <Link
            to="/stories"
            className="inline-flex items-center px-8 py-3 glass-subtle hover:glass-base text-neutral-100 hover:text-neutral-50 rounded-xl font-medium transition-all duration-300 shadow-glass"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Return to Stories
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !post) {
    return (
      <div className="pt-32 min-h-screen bg-black px-4">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-10 w-32 bg-neutral-800 rounded-lg mb-8" />
          <div className="w-full aspect-video bg-neutral-800 rounded-3xl mb-8" />
          <div className="h-12 w-3/4 bg-neutral-800 rounded-lg mb-6" />
          <div className="space-y-4">
            <div className="h-4 w-full bg-neutral-800 rounded" />
            <div className="h-4 w-full bg-neutral-800 rounded" />
            <div className="h-4 w-2/3 bg-neutral-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const isTemplate = post.layout === 'template';

  return (
    <div className="pt-24 min-h-screen bg-black pb-20 overflow-x-hidden">
      <Head
        title={post.title}
        description={post.excerpt}
        ogImage={absoluteImageUrl}
        ogUrl={currentUrl}
        twitterCard="summary_large_image"
      />

      <div className="max-w-5xl mx-auto px-4">
        {/* Navigation */}
        <div className="mb-12 flex justify-between items-center">
          <Link
            to="/stories"
            className="inline-flex items-center px-6 py-3 glass-subtle hover:glass-base text-neutral-300 hover:text-white rounded-full text-sm font-medium transition-all duration-300 border border-neutral-800 shadow-glass group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Archive Catalog
          </Link>

          <div className="flex items-center gap-4 text-xs font-mono text-neutral-500 uppercase tracking-widest">
             <span className="w-2 h-2 bg-red-500 rounded-full"></span>
             Direct_Intelligence_Feed
          </div>
        </div>

        {/* Gated Post Status Header Badge */}
        {post.is_gated && (
          <div className="mb-6 flex items-center justify-between p-3.5 bg-neutral-900/60 border border-neutral-800 rounded-2xl">
            <div className="flex items-center gap-2 text-xs font-mono">
              {isUnlocked ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-bold uppercase tracking-wider">Access Granted</span>
                  <span className="text-neutral-500">• Contributor Clearance Active</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 font-bold uppercase tracking-wider">Classified Transmission</span>
                  <span className="text-neutral-500">• Restricted to Prole Contributors</span>
                </>
              )}
            </div>
            {isUnlocked && (
              <span className="text-[10px] bg-green-950/40 text-green-300 border border-green-500/30 px-2.5 py-0.5 rounded-full font-mono">
                CLEARED
              </span>
            )}
          </div>
        )}

        {/* ─── Case 1: Audit Dispatch (Spine §15–16) ─────────────────────────── */}
        {audit ? (
          <div className="space-y-12 mb-20 animate-in fade-in duration-500">
            {/* 1. Header auto-rendered from the audit record */}
            <AuditDossierHeader audit={audit} />

            {/* 2. Free Body: Outline/Summary + Embedded Main Video (Facade, click-to-play) */}
            <section className="glass-elevated rounded-3xl overflow-hidden shadow-glass border border-neutral-800/50 p-6 md:p-12 space-y-8">
              <div className="flex items-center gap-3">
                <span className="w-8 h-px bg-red-500"></span>
                <span className="text-red-500 font-mono text-xs uppercase tracking-widest font-bold">Field Overview & Audio-Visual Transmission</span>
              </div>

              {/* YouTube Facade (No autoplay, click-to-play) */}
              <div className="max-w-4xl mx-auto">
                <YouTubeFacade
                  videoId={audit.youtube_id}
                  videoUrl={audit.video_url || post.template_data?.youtubeUrl}
                  thumbnailUrl={post.cover_image_url}
                  title={post.title}
                />
              </div>

              {/* Free narrative summary (Does NOT duplicate ledger numbers) */}
              <div className="prose-custom max-w-none text-neutral-300 text-lg leading-relaxed pt-2">
                <p className="font-medium text-neutral-100 italic text-xl border-l-2 border-red-500 pl-4">
                  {post.excerpt}
                </p>
                {post.template_data?.summary && (
                  <p className="text-neutral-300 mt-4 leading-relaxed">
                    {post.template_data.summary}
                  </p>
                )}
              </div>
            </section>

            {/* 3. Paid Section: The Long Read / Deep Analysis */}
            {post.is_gated && !isUnlocked ? (
              <section className="glass-elevated p-8 md:p-12 rounded-3xl border border-red-500/30 bg-gradient-to-b from-red-950/20 via-neutral-900/60 to-black shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Lock className="w-32 h-32 text-red-500" />
                </div>

                <div className="max-w-xl mx-auto text-center space-y-6 relative z-10">
                  <div className="w-14 h-14 bg-red-950/60 border border-red-500/40 rounded-2xl flex items-center justify-center mx-auto text-red-400 shadow-lg shadow-red-900/30">
                    <Key className="w-7 h-7 animate-pulse" />
                  </div>

                  <div>
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-neutral-50 mb-2">
                      Unlock Field Analysis & Long Read
                    </h2>
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      The deep forensic analysis and operational notes for this location are restricted to verified contributors.
                    </p>
                  </div>

                  <form onSubmit={handleManualUnlock} className="space-y-4 pt-2">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={enteredCode}
                        onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
                        placeholder="ENTER ACCESS CODE (E.G. PROLE-XXXX)"
                        className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-red-500/70 rounded-xl p-4 text-center font-mono text-base font-bold text-red-400 uppercase tracking-widest placeholder:text-neutral-600 outline-none transition-colors"
                      />
                      <button
                        type="submit"
                        className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-red-900/40 text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                      >
                        <Unlock className="w-4 h-4" />
                        Unlock
                      </button>
                    </div>

                    {unlockError && (
                      <div className="flex items-center justify-center gap-2 text-xs text-red-400 bg-red-950/40 p-3 rounded-xl border border-red-500/30 animate-in fade-in">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>{unlockError}</span>
                      </div>
                    )}
                  </form>

                  <div className="pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-neutral-500">
                    <span>Need clearance?</span>
                    <div className="flex items-center gap-3">
                      <Link to="/prole-control" className="text-red-400 hover:text-red-300 font-bold underline transition-colors">
                        Fund an Operation
                      </Link>
                      <span>•</span>
                      <Link to="/gear" className="text-red-400 hover:text-red-300 font-bold underline transition-colors">
                        Get Gear
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <section className="space-y-8">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-px bg-red-500"></span>
                  <span className="text-red-500 font-mono text-xs uppercase tracking-widest font-bold">Field Dossier • Unabridged Long Read</span>
                </div>

                {isTemplate && post.template_data ? (
                  <TemplateLayout data={post.template_data} title={post.title} />
                ) : (
                  <article className="glass-elevated rounded-3xl overflow-hidden p-8 md:p-16 shadow-glass border border-neutral-800/50">
                    <div className="prose-custom max-w-none text-neutral-300 leading-relaxed text-xl post-content">
                      <ReactMarkdown
                        components={{
                          h1: ({node, ...props}) => <h2 className="text-3xl font-bold text-neutral-50 mt-16 mb-8 border-l-4 border-red-600 pl-6" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-neutral-50 mt-12 mb-6 pb-2 border-b border-neutral-800" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-xl font-bold text-neutral-50 mt-10 mb-4" {...props} />,
                          p: ({node, ...props}) => <p className="mb-8" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-8 mb-8 space-y-3" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-8 mb-8 space-y-3" {...props} />,
                          li: ({node, ...props}) => <li className="pl-2" {...props} />,
                          blockquote: ({node, ...props}) => (
                            <blockquote className="border-l-4 border-red-500 bg-neutral-950/80 p-8 italic mb-10 rounded-r-2xl shadow-inner text-neutral-400" {...props} />
                          ),
                          code: ({node, inline, ...props}: any) => (
                            inline
                              ? <code className="bg-neutral-800 text-red-400 px-2 py-1 rounded font-mono text-base" {...props} />
                              : <pre className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 overflow-x-auto mb-10 shadow-glass"><code className="text-neutral-300 font-mono text-sm leading-relaxed" {...props} /></pre>
                          ),
                          a: ({node, ...props}) => {
                            const isAffiliate = props.href?.includes('amazon') || props.href?.includes('amzn.to');
                            return (
                              <a
                                className="text-red-400 hover:text-red-300 underline decoration-red-500/40 underline-offset-8 transition-all duration-300 font-medium"
                                data-umami-event={isAffiliate ? 'affiliate_click' : 'outbound_click'}
                                data-umami-event-url={props.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                {...props}
                              />
                            );
                          },
                          img: ({node, ...props}) => <img className="rounded-3xl border border-neutral-800 shadow-2xl my-16 w-full hover:scale-[1.01] transition-transform duration-700" {...props} />
                        }}
                      >
                        {post.content}
                      </ReactMarkdown>
                    </div>
                  </article>
                )}
              </section>
            )}

            {/* 4. Footer: Commissioned vs Self-Funded */}
            {audit.commissioned ? (
              <section className="p-8 rounded-3xl bg-neutral-900/60 border border-neutral-800 text-center space-y-3">
                <div className="inline-block px-3.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full font-mono text-xs uppercase tracking-wider">
                  Commissioned Field Audit
                </div>
                <p className="text-neutral-200 font-display text-xl font-bold">
                  Commissioned by <span className="text-white">{audit.funder_credit || 'Operative'}</span>
                </p>
                {audit.commissioning_question && (
                  <p className="text-neutral-400 text-sm max-w-xl mx-auto italic">
                    Framing Inquiry: &ldquo;{audit.commissioning_question}&rdquo;
                  </p>
                )}
              </section>
            ) : (
              <MissionFundingCallout missionId={audit.id} />
            )}
          </div>
        ) : (
          /* ─── Case 2: Standard Post (Non-Audit) ─────────────────────────── */
          post.is_gated && !isUnlocked ? (
          <div className="space-y-12 animate-in fade-in duration-500">
            {/* SEO & Public Hook Section */}
            <section className="glass-elevated rounded-3xl overflow-hidden shadow-glass border border-neutral-800/50">
              <div className="aspect-video w-full overflow-hidden relative">
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80" />
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="px-3.5 py-1 bg-red-600 text-white rounded-md font-bold uppercase tracking-[0.2em] text-[9px] mb-3 inline-block">
                    {post.category.replace('-', ' ')}
                  </span>
                  <h1 className="text-3xl md:text-5xl font-display font-bold text-neutral-50 leading-tight">
                    {post.title}
                  </h1>
                </div>
              </div>

              <div className="p-8 md:p-12 space-y-6">
                <div className="flex flex-wrap items-center gap-6 text-sm text-neutral-400 font-mono pb-6 border-b border-neutral-800">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-neutral-500" />
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                      : 'Live Dispatch'}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-neutral-500" />
                    {post.read_time} Min Full Report
                  </div>
                </div>

                {/* Excerpt / Teaser narrative */}
                <div className="prose-custom max-w-none text-neutral-300 text-lg leading-relaxed">
                  <p className="font-medium text-neutral-200 italic text-xl border-l-2 border-red-500 pl-4">
                    {post.excerpt}
                  </p>
                  {isTemplate && post.template_data?.summary && (
                    <p className="text-neutral-400 mt-4 leading-relaxed">
                      {post.template_data.summary}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Contributor Access Code Unlock Box */}
            <section className="glass-elevated p-8 md:p-12 rounded-3xl border border-red-500/30 bg-gradient-to-b from-red-950/20 via-neutral-900/60 to-black shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Lock className="w-32 h-32 text-red-500" />
              </div>

              <div className="max-w-xl mx-auto text-center space-y-6 relative z-10">
                <div className="w-14 h-14 bg-red-950/60 border border-red-500/40 rounded-2xl flex items-center justify-center mx-auto text-red-400 shadow-lg shadow-red-900/30">
                  <Key className="w-7 h-7 animate-pulse" />
                </div>

                <div>
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-neutral-50 mb-2">
                    Enter Contributor Clearance Code
                  </h2>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    This complete investigation is restricted to financial supporters. A clearance code was emailed to all contributors when this dispatch went live.
                  </p>
                </div>

                <form onSubmit={handleManualUnlock} className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={enteredCode}
                      onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
                      placeholder="ENTER ACCESS CODE (E.G. PROLE-XXXX)"
                      className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-red-500/70 rounded-xl p-4 text-center font-mono text-base font-bold text-red-400 uppercase tracking-widest placeholder:text-neutral-600 outline-none transition-colors"
                    />
                    <button
                      type="submit"
                      className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-red-900/40 text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <Unlock className="w-4 h-4" />
                      Unlock
                    </button>
                  </div>

                  {unlockError && (
                    <div className="flex items-center justify-center gap-2 text-xs text-red-400 bg-red-950/40 p-3 rounded-xl border border-red-500/30 animate-in fade-in">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{unlockError}</span>
                    </div>
                  )}
                </form>

                <div className="pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-neutral-500">
                  <span>Haven't contributed yet?</span>
                  <div className="flex items-center gap-3">
                    <Link to="/prole-control" className="text-red-400 hover:text-red-300 font-bold underline transition-colors">
                      Fund an Adventure
                    </Link>
                    <span>•</span>
                    <Link to="/gear" className="text-red-400 hover:text-red-300 font-bold underline transition-colors">
                      Visit Merch Shop
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : isTemplate && post.template_data ? (
          <TemplateLayout data={post.template_data} title={post.title} />
        ) : (
          /* Existing Markdown Hero Card */
          <article className="glass-elevated rounded-3xl overflow-hidden mb-20 shadow-glass border border-neutral-800/50">
            <div className="aspect-video w-full overflow-hidden relative">
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
            </div>

            <div className="p-8 md:p-16">
              <div className="flex flex-wrap items-center gap-6 mb-8 text-sm">
                <span className="px-4 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-md font-bold uppercase tracking-[0.2em] text-[10px]">
                  {post.category.replace('-', ' ')}
                </span>
                <div className="flex items-center text-neutral-400 font-medium">
                  <Calendar className="w-4 h-4 mr-2 text-neutral-500" />
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : 'Unspecified Time'}
                </div>
                <div className="flex items-center text-neutral-400 font-medium">
                  <Clock className="w-4 h-4 mr-2 text-neutral-500" />
                  {post.read_time} Min Estimate
                </div>
              </div>

              <h1 className="text-4xl md:text-6xl font-display font-bold text-neutral-50 mb-12 leading-[1.1] tracking-tight">
                {post.title}
              </h1>

              {/* Markdown Content */}
              <div className="prose-custom max-w-none text-neutral-300 leading-relaxed text-xl post-content">
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <h2 className="text-3xl font-bold text-neutral-50 mt-16 mb-8 border-l-4 border-red-600 pl-6" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-neutral-50 mt-12 mb-6 pb-2 border-b border-neutral-800" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-xl font-bold text-neutral-50 mt-10 mb-4" {...props} />,
                    p: ({node, ...props}) => <p className="mb-8" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-8 mb-8 space-y-3" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-8 mb-8 space-y-3" {...props} />,
                    li: ({node, ...props}) => <li className="pl-2" {...props} />,
                    blockquote: ({node, ...props}) => (
                      <blockquote className="border-l-4 border-red-500 bg-neutral-950/80 p-8 italic mb-10 rounded-r-2xl shadow-inner text-neutral-400" {...props} />
                    ),
                    code: ({node, inline, ...props}: any) => (
                      inline
                        ? <code className="bg-neutral-800 text-red-400 px-2 py-1 rounded font-mono text-base" {...props} />
                        : <pre className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 overflow-x-auto mb-10 shadow-glass"><code className="text-neutral-300 font-mono text-sm leading-relaxed" {...props} /></pre>
                    ),
                    a: ({node, ...props}) => {
                      const isAffiliate = props.href?.includes('amazon') || props.href?.includes('amzn.to');
                      return (
                        <a
                          className="text-red-400 hover:text-red-300 underline decoration-red-500/40 underline-offset-8 transition-all duration-300 font-medium"
                          data-umami-event={isAffiliate ? 'affiliate_click' : 'outbound_click'}
                          data-umami-event-url={props.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          {...props}
                        />
                      );
                    },
                    img: ({node, ...props}) => <img className="rounded-3xl border border-neutral-800 shadow-2xl my-16 w-full hover:scale-[1.01] transition-transform duration-700" {...props} />
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              </div>
            </div>
          </article>
        )
      )}

        {/* Adjacent Navigation */}
        <section className="mb-24 grid grid-cols-1 md:grid-cols-2 gap-6">
          {adjacent.prev ? (
            <Link
              to={`/read/${adjacent.prev.slug}`}
              className="glass-elevated p-8 rounded-3xl border border-neutral-800/50 hover:border-red-500/30 transition-all duration-300 group flex items-center gap-6 text-left"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:bg-red-500/10 group-hover:border-red-500/50 transition-colors">
                <ArrowLeft className="w-5 h-5 text-neutral-500 group-hover:text-red-400 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Previous Intelligence</p>
                <h4 className="text-lg font-bold text-neutral-50 truncate group-hover:text-red-400 transition-colors">{adjacent.prev.title}</h4>
              </div>
            </Link>
          ) : <div />}

          {adjacent.next && (
            <Link
              to={`/read/${adjacent.next.slug}`}
              className="glass-elevated p-8 rounded-3xl border border-neutral-800/50 hover:border-red-500/30 transition-all duration-300 group flex items-center gap-6 text-right"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Next Intelligence</p>
                <h4 className="text-lg font-bold text-neutral-50 truncate group-hover:text-red-400 transition-colors">{adjacent.next.title}</h4>
              </div>
              <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center group-hover:bg-red-500/10 group-hover:border-red-500/50 transition-colors">
                <ArrowRight className="w-5 h-5 text-neutral-500 group-hover:text-red-400 transition-colors" />
              </div>
            </Link>
          )}
        </section>

        {/* Share Section */}
        <section className="mb-24 glass-elevated p-10 rounded-[2.5rem] border border-neutral-800/60 shadow-glass relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-950/30 rounded-2xl border border-red-500/20">
                <Share2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-neutral-50 mb-1">Pass this Archive</h2>
                <p className="text-neutral-500 text-sm font-mono tracking-tight text-neutral-100">Synchronize data across the open net.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleShareCopy}
                className="flex items-center gap-3 px-8 py-4 glass-subtle hover:glass-elevated border border-neutral-700/50 rounded-2xl text-sm font-bold transition-all duration-300 group/btn"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-mono">HASH_MATCHED</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    <span className="tracking-widest uppercase">Sync_Link</span>
                  </>
                )}
              </button>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-8 py-4 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-2xl text-sky-400 text-sm font-bold transition-all duration-300 uppercase tracking-widest"
              >
                <Twitter className="w-4 h-4" />
                <span>Blast_X</span>
              </a>
            </div>
          </div>
        </section>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-32 border-t border-neutral-900 pt-20">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-4xl md:text-5xl font-display font-bold text-neutral-50 mb-4">RELaTeD_InTeL</h2>
                <p className="text-neutral-500 font-mono text-sm tracking-widest uppercase">Cross-referenced archives in {post.category.replace(/-/g, '_')}</p>
              </div>
              <Link to="/stories" className="text-red-500 hover:text-red-400 font-mono text-xs uppercase tracking-[0.2em] flex items-center transition-all group pb-2">
                Scan_Full_Archive <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {relatedPosts.map(rp => (
                <Link
                  key={rp.id}
                  to={`/read/${rp.slug}`}
                  className="group glass-base rounded-3xl overflow-hidden hover:glass-elevated transition-all duration-500 shadow-glass border border-neutral-800/40 transform hover:-translate-y-2"
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={rp.cover_image_url}
                      alt={rp.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                    <span className="absolute bottom-4 left-4 text-[9px] font-bold uppercase tracking-[0.3em] bg-red-600 text-white px-3 py-1 rounded shadow-lg">
                      {rp.layout === 'markdown' ? 'Text' : 'Intel'}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-xl text-neutral-100 group-hover:text-red-400 transition-colors line-clamp-2 mb-4 leading-tight">
                      {rp.title}
                    </h3>
                    <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono uppercase tracking-tighter pt-4 border-t border-neutral-800/50">
                      <span>{rp.published_at ? new Date(rp.published_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Archive_Pending'}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {rp.read_time}M</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
