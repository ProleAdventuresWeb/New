import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  MapPin,
  Search,
} from 'lucide-react';
import { Head } from '../components/Head';
import { PageLoader } from '../components/PageLoader';
import { getCompletedAudits, type SecureAdventure } from '../lib/supabase';
import { AdventureService } from '../services/adventureService';
import { MockAdventureService } from '../services/mockAdventureService';
import { LEAGUE_COLUMNS } from '../types/audit';

type SortDirection = 'asc' | 'desc';

const getPlace = (audit: SecureAdventure) =>
  audit.place || audit.display_title || audit.codename || 'UNNAMED PLACE';

export const LeaguePage: React.FC = () => {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<SecureAdventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    let isMounted = true;

    const loadAudits = async () => {
      try {
        const data = await getCompletedAudits();
        if (!isMounted) return;

        if (data.length > 0) {
          setAudits(data);
          return;
        }

        const all = await AdventureService.getSecureAdventures();
        setAudits(all.filter(a => a.status === 'complete'));
      } catch (error) {
        console.warn('Falling back to mock adventures for league table:', error);
        const mock = await MockAdventureService.getSecureAdventures();
        if (isMounted) setAudits(mock.filter(a => a.status === 'complete'));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadAudits();
    return () => { isMounted = false; };
  }, []);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(direction => (direction === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection(['place', 'rent_mo', 'basket', 'safety', 'access'].includes(key) ? 'asc' : 'desc');
  };

  const processedAudits = useMemo(() => {
    const filtered = audits.filter(audit =>
      getPlace(audit).toLowerCase().includes(searchTerm.trim().toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      let valueA: string | number = '';
      let valueB: string | number = '';

      if (sortKey === 'place') {
        valueA = getPlace(a);
        valueB = getPlace(b);
      } else if (sortKey === 'audit_date') {
        valueA = new Date(a.audit_date || a.created_at || 0).getTime();
        valueB = new Date(b.audit_date || b.created_at || 0).getTime();
      } else {
        valueA = (a[sortKey as keyof SecureAdventure] ?? '') as string | number;
        valueB = (b[sortKey as keyof SecureAdventure] ?? '') as string | number;
      }

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      const numberA = typeof valueA === 'number' ? valueA : Number.NEGATIVE_INFINITY;
      const numberB = typeof valueB === 'number' ? valueB : Number.NEGATIVE_INFINITY;
      return sortDirection === 'asc' ? numberA - numberB : numberB - numberA;
    });
  }, [audits, searchTerm, sortDirection, sortKey]);

  const getScoreBadge = (score?: number | null) => {
    if (score === null || score === undefined) return '--';

    const color = score >= 80
      ? 'text-emerald-400 bg-emerald-950/50 border-emerald-500/40'
      : score >= 60
        ? 'text-amber-400 bg-amber-950/50 border-amber-500/40'
        : 'text-red-400 bg-red-950/50 border-red-500/30';

    return (
      <span className={`inline-flex min-w-12 items-center justify-center rounded-lg border px-2.5 py-1 font-display text-base font-black ${color}`}>
        {score}
      </span>
    );
  };

  if (loading) {
    return <div className="min-h-screen bg-black pt-24"><PageLoader /></div>;
  }

  return (
    <div className="min-h-screen bg-black pb-24 pt-20 text-white">
      <Head
        title="Proletariat League Table | Place Audits Ranked"
        description="A public index of real-world place audits, covering rent, everyday costs, safety, car-free access, and the final Prole verdict."
      />

      <section className="mx-auto max-w-7xl border-b border-neutral-800/80 px-4 py-12">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-950/80 px-3 py-1 font-mono text-xs uppercase tracking-widest text-red-400">
              ?? PLACE AUDIT INDEX
            </div>
            <h1 className="font-display text-5xl font-black uppercase tracking-tight text-neutral-50 md:text-7xl">
              The League Table
            </h1>
            <p className="text-base leading-relaxed text-neutral-400 md:text-lg">
              Real-world location audits: rent, everyday costs, safety, car-free access, and the final Prole verdict.
            </p>
          </div>

          <Link
            to="/prole-control"
            className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 px-5 py-3 font-mono text-xs uppercase tracking-wider text-neutral-200 transition-all hover:border-red-500/50 hover:bg-neutral-800 hover:text-white"
          >
            <MapPin className="h-4 w-4 text-red-500" />
            Open Prole Control
          </Link>
        </div>

        <div className="mt-8 max-w-xl">
          <label htmlFor="league-place-search" className="sr-only">Search by place</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              id="league-place-search"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="SEARCH PLACE..."
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950 py-3 pl-11 pr-4 font-mono text-sm text-neutral-100 outline-none transition-colors placeholder:text-neutral-600 focus:border-red-500/70"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-4 flex items-center justify-between gap-4 font-mono text-xs text-neutral-500">
          <span>{processedAudits.length} AUDIT{processedAudits.length === 1 ? '' : 'S'}</span>
          <span className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> SORTABLE FIELD LEDGER</span>
        </div>

        <div className="max-h-[70vh] overflow-x-auto overflow-y-auto rounded-2xl border border-white/10 bg-neutral-950">
          <table className="w-full min-w-[1180px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-neutral-950 shadow-[0_1px_0_rgba(255,255,255,0.12)]">
              <tr>
                {LEAGUE_COLUMNS.map(column => {
                  const isActive = sortKey === column.key;
                  return (
                    <th
                      key={column.key}
                      scope="col"
                      className={`border-b border-r border-white/10 p-3 text-left last:border-r-0 ${column.align === 'center' ? 'text-center' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort(column.key)}
                        className={`flex w-full items-center gap-1.5 font-mono text-[11px] font-bold tracking-wider transition-colors hover:text-white ${column.align === 'center' ? 'justify-center' : ''} ${isActive ? 'text-red-400' : 'text-neutral-400'}`}
                      >
                        {column.label}
                        {isActive ? (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />}
                      </button>
                    </th>
                  );
                })}
                <th scope="col" className="border-b border-white/10 p-3 text-center font-mono text-[11px] font-bold tracking-wider text-neutral-400">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {processedAudits.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center font-mono text-sm text-neutral-500">NO MATCHING PLACE AUDITS FOUND.</td>
                </tr>
              ) : processedAudits.map(audit => {
                const formattedDate = audit.audit_date
                  ? new Date(audit.audit_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '--';

                return (
                  <tr key={audit.id} className="transition-colors hover:bg-white/[0.025]">
                    <td className="border-b border-r border-white/10 p-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/prole-control?pin=${audit.id}`)}
                        className="text-left font-bold text-neutral-100 transition-colors hover:text-red-400"
                      >
                        {getPlace(audit)}
                      </button>
                    </td>
                    <td className="border-b border-r border-white/10 p-4 text-center font-mono text-neutral-300">{audit.episode_number ?? '--'}</td>
                    <td className="border-b border-r border-white/10 p-4 text-neutral-300">{audit.rent_mo || '--'}</td>
                    <td className="border-b border-r border-white/10 p-4 text-neutral-300">{audit.basket || '--'}</td>
                    <td className="border-b border-r border-white/10 p-4 text-neutral-300">{audit.safety || '--'}</td>
                    <td className="border-b border-r border-white/10 p-4 text-neutral-300">{audit.access || '--'}</td>
                    <td className="border-b border-r border-white/10 p-4 text-center">{getScoreBadge(audit.score)}</td>
                    <td className="border-b border-r border-white/10 p-4 text-center font-mono font-bold text-red-400">{audit.tomato_score ? `${audit.tomato_score}/10` : '--'}</td>
                    <td className="border-b border-r border-white/10 p-4 text-center font-mono text-xs text-neutral-400 whitespace-nowrap">{formattedDate}</td>
                    <td className="border-b border-white/10 p-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/prole-control?pin=${audit.id}`)}
                          title="Open on Prole Control"
                          className="rounded-lg bg-neutral-800 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white"
                        >
                          <MapPin className="h-3.5 w-3.5 text-red-400" />
                        </button>
                        {audit.story_slug && (
                          <Link to={`/stories/${audit.story_slug}`} title="Read story" className="rounded-lg bg-neutral-800 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white">
                            <BookOpen className="h-3.5 w-3.5" />
                          </Link>
                        )}
                        {(audit.youtube_id || audit.video_url) && (
                          <a href={audit.video_url || `https://www.youtube.com/watch?v=${audit.youtube_id}`} target="_blank" rel="noopener noreferrer" title="Watch on YouTube" className="rounded-lg bg-neutral-800 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-white">
                            <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-neutral-800/80 bg-neutral-950/60 p-4 font-mono text-xs text-neutral-400">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
          <div><span className="font-bold text-neutral-300">LEAGUE RULE:</span> Every entry is a dated, on-the-ground audit. Select a place to open its mission on Prole Control.</div>
        </div>
      </section>
    </div>
  );
};
