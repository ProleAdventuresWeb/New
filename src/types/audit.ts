// Single source of truth for Audit schema and definitions per Spine §15-16

export type HassleIncidentType =
  | 'scoped'
  | 'stopped'
  | 'fined'
  | 'moved_on'
  | 'id_demanded'
  | 'cash_refused';

export interface HassleIncident {
  type: HassleIncidentType;
  note?: string;
  amount?: number; // for fines, also included in actual_spend_gbp
}

export const HASSLE_LABELS: Record<HassleIncidentType, { label: string; short: string; color: string; badge: string }> = {
  scoped: { label: 'Scoped / Surveilled', short: 'Scoped', color: '#eab308', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  stopped: { label: 'Stopped & Questioned', short: 'Stopped', color: '#f97316', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  fined: { label: 'Fined', short: 'Fined', color: '#ef4444', badge: 'bg-red-500/10 text-red-400 border-red-500/30' },
  moved_on: { label: 'Moved On', short: 'Moved On', color: '#f43f5e', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  id_demanded: { label: 'ID Demanded', short: 'ID Demanded', color: '#a855f7', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  cash_refused: { label: 'Cash Refused', short: 'Cash Refused', color: '#06b6d4', badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
};

export interface AuditRecord {
  id: string;
  episode_number?: number | null;
  place_name: string; // Canonical label used everywhere on-site (adventures.title)
  codename?: string;
  lat: number;
  lng: number;
  audit_date?: string | null;
  status: 'scouting' | 'greenlit' | 'active' | 'complete';
  youtube_id?: string | null;
  story_slug?: string | null;

  // Funding fields (for mission state machine)
  bounty_target?: number;
  bounty_current?: number;
  commissioned?: boolean;
  funder_credit?: string | null;
  commissioning_question?: string | null;

  // Prole Foods one-shot bounty
  prole_foods_claimed?: boolean;
  prole_foods_donor_name?: string | null;
  prole_foods_town?: string | null;
  prole_foods_instruction?: string | null;
  prole_foods_amount?: number | null;

  // Editorial score (1-100, nullable until completed - editorially entered, NEVER computed)
  score?: number | null;
  verdict_line?: string | null;

  // Evidence ledger (all nullable)
  actual_spend_gbp?: number | null;
  kebab_index_gbp?: number | null;
  tomato_index_gbp?: number | null;
  exchanges_count?: number | null;
  free_pins_found_count?: number | null;

  // Hassle log
  hassle_log?: HassleIncident[] | null;

  // Context line
  conditions_line?: string | null;

  // Media / metadata
  description?: string | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
  created_at: string;
  updated_at: string;
}

// Column definition interface for League Table
export interface LeagueColumn {
  key: string;
  label: string;
  shortLabel?: string;
  sortable: boolean;
  align?: 'left' | 'center' | 'right';
  description?: string;
}

export const LEAGUE_COLUMNS: LeagueColumn[] = [
  { key: 'place_name', label: 'Place', sortable: true, align: 'left', description: 'Canonical location audited' },
  { key: 'episode_number', label: '#', sortable: true, align: 'center', description: 'Episode number' },
  { key: 'score', label: 'Score', sortable: true, align: 'center', description: 'Editorial score (1-100, spine §16)' },
  { key: 'verdict_line', label: 'Verdict', sortable: false, align: 'left', description: 'Audit verdict line' },
  { key: 'actual_spend_gbp', label: 'Spend', shortLabel: 'Spend (£)', sortable: true, align: 'right', description: 'Actual spend (£)' },
  { key: 'kebab_index_gbp', label: 'Kebab', shortLabel: 'Kebab (£)', sortable: true, align: 'right', description: 'Standard donor/kebab index (£)' },
  { key: 'tomato_index_gbp', label: 'Tomato', shortLabel: 'Tomato (£)', sortable: true, align: 'right', description: 'Single loose tomato index (£)' },
  { key: 'exchanges_count', label: 'Exchanges', sortable: true, align: 'center', description: 'Human interactions / exchanges' },
  { key: 'free_pins_found_count', label: 'Free Finds', sortable: true, align: 'center', description: 'Free utility / survival resources found' },
  { key: 'hassle', label: 'Hassle', sortable: true, align: 'left', description: 'Recorded friction incidents' },
  { key: 'audit_date', label: 'Date', sortable: true, align: 'center', description: 'Audit date (always visible)' },
];
