import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  MapPin,
  Calendar,
  ShieldAlert,
  Search,
  ExternalLink,
  BookOpen,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Head } from '../components/Head';
import { PageLoader } from '../components/PageLoader';
import { getCompletedAudits, type SecureAdventure } from '../lib/supabase';
import { AdventureService } from '../services/adventureService';
import { MockAdventureService } from '../services/mockAdventureService';
import { LEAGUE_COLUMNS, HASSLE_LABELS, type HassleIncident } from '../types/audit';

type SortDirection = 'asc' | 'desc';

export const LeaguePage: React.FC = () => {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<SecureAdventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Attempt fetch from live database
        const data = await getCompletedAudits();
        if (isMounted) {
          if (data && data.length > 0) {
            setAudits(data);
          } else {
            // Fallback to secure adventures filtered for completed audits
            const all = await AdventureService.getSecureAdventures();
            const completed = all.filter(a => a.status === 'complete' && a.score !== null && a.score !== undefined);
            setAudits(completed.length > 0 ? completed : all.filter(a => a.status === 'complete'));
          }
        }
      } catch (err) {
        console.warn('Falling back to mock adventures for league table:', err);
        try {
          const mock = await MockAdventureService.getSecureAdventures();
          if (isMounted) {
            const completed = mock.filter(a => a.status === 'complete' && a.score !== null && a.score !== undefined);
            setAudits(completed.length > 0 ? completed : mock.filter(a => a.status === 'complete'));
          }
        } catch (mockErr) {
          console.error('Failed to load mock audits:', mockErr);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => { isMounted = false; };
  }, []);

  // Handle column sorting
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection(key === 'place_name' || key === 'verdict_line' ? 'asc' : 'desc');
    }
  };

  // Filter and sort audits
  const processedAudits = useMemo(() => {
    // Phase 2 TODO: Per-place audit history view (group by place_name to show score delta across years)

    // Only completed audits with scores appear; default to deduplicating latest audit per place
    const placeMap = new Map<string, SecureAdventure>();

    audits.forEach(audit => {
      const canonicalName = audit.codename || audit.display_title || 'Unnamed Place';
      const existing = placeMap.get(canonicalName);
      if (!existing) {
        placeMap.set(canonicalName, audit);
      } else {
        // Keep the one with latest date or higher episode
        const dateA = new Date(audit.audit_date || audit.created_at || 0).getTime();
        const dateB = new Date(existing.audit_date || existing.created_at || 0).getTime();
        if (dateA > dateB) {
          placeMap.set(canonicalName, audit);
        }
      }
    });

    let list = Array.from(placeMap.values());

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(a =>
        (a.display_title && a.display_title.toLowerCase().includes(q)) ||
        (a.codename && a.codename.toLowerCase().includes(q)) ||
        (a.verdict_line && a.verdict_line.toLowerCase().includes(q)) ||
        (a.conditions_line && a.conditions_line.toLowerCase().includes(q))
      );
    }

    // Sort
    return list.sort((a, b) => {
      let valA: any = a[sortKey as keyof SecureAdventure];
      let valB: any = b[sortKey as keyof SecureAdventure];

      if (sortKey === 'place_name') {
        valA = a.display_title || a.codename || '';
        valB = b.display_title || b.codename || '';
      } else if (sortKey === 'hassle') {
        valA = Array.isArray(a.hassle_log) ? a.hassle_log.length : 0;
        valB = Array.isArray(b.hassle_log) ? b.hassle_log.length : 0;
      } else if (sortKey === 'audit_date') {
        valA = new Date(a.audit_date || a.created_at || 0).getTime();
        valB = new Date(b.audit_date || b.created_at || 0).getTime();
      }

      if (valA === undefined || valA === null) valA = sortDirection === 'asc' ? Infinity : -Infinity;
      if (valB === undefined || valB === null) valB = sortDirection === 'asc' ? Infinity : -Infinity;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return sortDirection === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
  }, [audits, searchTerm, sortKey, sortDirection]);

  // Navigate to map pin
  const handlePlaceClick = (auditId: string) => {
    navigate(`/prole-control?pin=${auditId}`);
  };

  const getScoreBadge = (score?: number | null) => {
    if (score === null || score === undefined) {
      return <span className="text-neutral-500 font-mono text-xs">--</span>;
    }

    let color = 'text-red-400 bg-red-950/50 border-red-500/30';
    if (score >= 80) {
      color = 'text-emerald-400 bg-emerald-950/50 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]';
    } else if (score >= 60) {
      color = 'text-amber-400 bg-amber-950/50 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]';
    }

    return (
      <span className={`inline-flex items-center justify-center font-display font-black text-base px-3 py-1 rounded-xl border ${color} min-w-[3rem]`}>
        {score}
      </span>
    );
  };

  const renderHasslePills = (hassleLog?: HassleIncident[] | null) => {
    if (!hassleLog || hassleLog.length === 0) {
      return <span className="text-neutral-600 text-xs font-mono">None</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {hassleLog.map((incident, idx) => {
          const cfg = HASSLE_LABELS[incident.type] || { label: incident.type, short: incident.type, badge: 'bg-neutral-800 text-neutral-300 border-neutral-700' };
          const fineText = incident.type === 'fined' && incident.amount ? ` (£${incident.amount})` : '';
          return (
            <span
              key={idx}
              title={incident.note || cfg.label}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono border whitespace-nowrap ${cfg.badge}`}
            >
              {cfg.short}{fineText}
            </span>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="pt-24 min-h-screen bg-black">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-black text-white pb-24">
      <Head
        title="Proletariat League Table | Place Audits Ranked"
        description="Public rank ledger of places audited across the UK. Measured by real friction, surveillance density, and cost of living under the five pressures."
      />

      {/* Hero Header */}
      <section className="px-4 py-12 max-w-7xl mx-auto border-b border-neutral-800/80">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950/80 border border-red-500/40 rounded-full text-red-400 text-xs font-mono uppercase tracking-widest">
              <span className="text-sm">🍅</span> Spine §15–16 Documentary Index
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tight text-neutral-50">
              The League Table
            </h1>
            <p className="text-neutral-400 text-base md:text-lg leading-relaxed">
              Every audit documents a place and closes with a fixed three-number ledger: actual spend, advertised equivalent, and free value discovered.
              Scored <span className="text-neutral-200 font-bold">1–100</span> editorially against the five pressures (Gate, Commons, Disguise Density, Public Mat, State Mat). Stale rows remain honest.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/prole-control"
              className="px-5 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-red-500/50 text-neutral-200 hover:text-white font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <MapPin className="w-4 h-4 text-red-500" />
              Open Audit Map
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search place, verdict, conditions..."
              className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-red-500/70 transition-colors"
            />
          </div>

          <div className="text-xs text-neutral-500 font-mono self-end sm:self-center">
            Showing <span className="text-neutral-300 font-bold">{processedAudits.length}</span> audited locations
          </div>
        </div>
      </section>

      {/* Main League Table */}
      <section className="max-w-7xl mx-auto px-4 mt-8">
        <div className="glass-base rounded-2xl border border-neutral-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/90 text-neutral-400 font-mono text-xs uppercase tracking-wider">
                  {LEAGUE_COLUMNS.map(col => {
                    const isSorted = sortKey === col.key || (col.key === 'place_name' && sortKey === 'title');
                    return (
                      <th
                        key={col.key}
                        onClick={() => col.sortable && handleSort(col.key)}
                        className={`p-4 whitespace-nowrap select-none ${
                          col.sortable ? 'cursor-pointer hover:text-white transition-colors' : ''
                        } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                      >
                        <div className={`inline-flex items-center gap-1.5 ${col.align === 'right' ? 'flex-row-reverse' : ''}`}>
                          <span>{col.label}</span>
                          {col.sortable && (
                            <span className="text-neutral-600">
                              {isSorted ? (
                                sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-red-500" /> : <ChevronDown className="w-3.5 h-3.5 text-red-500" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th className="p-4 text-center font-mono text-xs uppercase tracking-wider text-neutral-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-sans">
                {processedAudits.length === 0 ? (
                  <tr>
                    <td colSpan={LEAGUE_COLUMNS.length + 1} className="p-12 text-center text-neutral-500 font-mono text-sm">
                      No audits match your criteria.
                    </td>
                  </tr>
                ) : (
                  processedAudits.map((audit) => {
                    const placeName = audit.codename || audit.display_title || 'Classified Site';
                    const epNum = audit.episode_number ? `#${audit.episode_number}` : '--';
                    const formattedDate = audit.audit_date
                      ? new Date(audit.audit_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : audit.created_at
                        ? new Date(audit.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '--';

                    return (
                      <tr
                        key={audit.id}
                        className="hover:bg-neutral-900/60 transition-colors group"
                      >
                        {/* 1. Place Name */}
                        <td className="p-4 font-bold text-neutral-100">
                          <button
                            type="button"
                            onClick={() => handlePlaceClick(audit.id)}
                            className="text-left font-display text-base text-neutral-100 group-hover:text-red-400 transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <span>{placeName}</span>
                          </button>
                        </td>

                        {/* 2. Episode # */}
                        <td className="p-4 text-center font-mono text-xs text-neutral-400 font-bold">
                          {epNum}
                        </td>

                        {/* 3. Score */}
                        <td className="p-4 text-center">
                          {getScoreBadge(audit.score)}
                        </td>

                        {/* 4. Verdict */}
                        <td className="p-4 text-neutral-300 text-sm max-w-xs truncate italic">
                          {audit.verdict_line ? `"${audit.verdict_line}"` : <span className="text-neutral-600 font-mono text-xs">--</span>}
                        </td>

                        {/* 5. Actual Spend */}
                        <td className="p-4 text-right font-mono text-sm text-neutral-200">
                          {audit.actual_spend_gbp !== null && audit.actual_spend_gbp !== undefined
                            ? `£${Number(audit.actual_spend_gbp).toFixed(2)}`
                            : '--'}
                        </td>

                        {/* 6. Kebab Index */}
                        <td className="p-4 text-right font-mono text-sm text-neutral-300">
                          {audit.kebab_index_gbp !== null && audit.kebab_index_gbp !== undefined
                            ? `£${Number(audit.kebab_index_gbp).toFixed(2)}`
                            : '--'}
                        </td>

                        {/* 7. Tomato Index */}
                        <td className="p-4 text-right font-mono text-sm text-neutral-300">
                          {audit.tomato_index_gbp !== null && audit.tomato_index_gbp !== undefined
                            ? `£${Number(audit.tomato_index_gbp).toFixed(2)}`
                            : '--'}
                        </td>

                        {/* 8. Exchanges Count */}
                        <td className="p-4 text-center font-mono text-sm text-neutral-300">
                          {audit.exchanges_count ?? '--'}
                        </td>

                        {/* 9. Free Finds Count */}
                        <td className="p-4 text-center font-mono text-sm text-emerald-400 font-bold">
                          {audit.free_pins_found_count ?? '--'}
                        </td>

                        {/* 10. Hassle Log */}
                        <td className="p-4">
                          {renderHasslePills(audit.hassle_log)}
                        </td>

                        {/* 11. Date (Always Visible) */}
                        <td className="p-4 text-center font-mono text-xs text-neutral-400 whitespace-nowrap">
                          {formattedDate}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handlePlaceClick(audit.id)}
                              title="View on Map"
                              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                            >
                              <MapPin className="w-3.5 h-3.5 text-red-400" />
                            </button>

                            {audit.story_slug && (
                              <Link
                                to={`/stories/${audit.story_slug}`}
                                title="Read Story"
                                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                              >
                                <BookOpen className="w-3.5 h-3.5 text-neutral-300" />
                              </Link>
                            )}

                            {(audit.youtube_id || audit.video_url) && (
                              <a
                                href={audit.video_url || `https://www.youtube.com/watch?v=${audit.youtube_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Watch on YouTube"
                                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Phase 2 TODO Notice */}
        <div className="mt-8 p-4 rounded-xl border border-neutral-800/80 bg-neutral-950/60 flex items-start gap-3 text-xs font-mono text-neutral-400">
          <Info className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-neutral-300 font-bold">Ledger Rule:</span> Scores and ledger items are strictly historical records from direct on-the-ground visits.
            Clicking any place name deep-links to that location on Prole Control and brings up its field billboard and click-to-play footage.
          </div>
        </div>
      </section>
    </div>
  );
};
