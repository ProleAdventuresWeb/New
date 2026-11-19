import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Loader2,
  MapPin,
  Trophy,
  BookOpen,
} from 'lucide-react';
import {
  createAdventure,
  updateAdventure,
  deleteAdventure,
  type SecureAdventure,
  type Adventure
} from '../../lib/supabase';
import { MockAdventureService } from '../../services/mockAdventureService';
import { extractYouTubeId } from '../YouTubeFacade';
import type { Post } from '../../types/post';

interface AuditManagerProps {
  missions: SecureAdventure[];
  posts: Post[];
  onRefresh: () => Promise<void>;
  setError: (msg: string | null) => void;
  setSuccess: (msg: string | null) => void;
}

const EMPTY_AUDIT_FORM = {
  id: '',
  title: '',
  codename: '',
  status: 'complete' as 'scouting' | 'greenlit' | 'active' | 'complete',
  description: '',
  lat: 53.0,
  lng: -1.3,
  bounty_target: 50,
  bounty_current: 50,
  video_url: '',
  thumbnail_url: '',
  // Audit fields
  episode_number: '' as number | '',
  audit_date: new Date().toISOString().split('T')[0],
  youtube_id: '',
  story_slug: '',
  score: '' as number | '',
  verdict_line: '',
  rent_mo: '',
  basket: '',
  safety: '',
  access: '',
  tomato_score: '' as number | '',
  conditions_line: '',
  commissioned: false,
  funder_credit: '',
  commissioning_question: ''
};

export const AuditManager: React.FC<AuditManagerProps> = ({
  missions,
  posts,
  onRefresh,
  setError,
  setSuccess
}) => {
  const [selectedMission, setSelectedMission] = useState<SecureAdventure | null>(null);
  const [form, setForm] = useState(EMPTY_AUDIT_FORM);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const handleEdit = (mission: SecureAdventure) => {
    setSelectedMission(mission);
    setForm({
      id: mission.id,
      title: mission.display_title || mission.codename || '',
      codename: mission.codename || '',
      status: mission.status,
      description: mission.display_description || '',
      lat: mission.lat ?? mission.display_lat,
      lng: mission.lng ?? mission.display_lng,
      bounty_target: mission.bounty_target || 0,
      bounty_current: mission.bounty_current || 0,
      video_url: (mission as any).video_url || '',
      thumbnail_url: (mission as any).thumbnail_url || '',
      episode_number: mission.episode_number ?? '',
      audit_date: mission.audit_date || (mission.created_at ? mission.created_at.split('T')[0] : ''),
      youtube_id: mission.youtube_id || extractYouTubeId((mission as any).video_url) || '',
      story_slug: mission.story_slug || '',
      score: mission.score ?? '',
      verdict_line: mission.verdict_line || '',
      rent_mo: mission.rent_mo || '',
      basket: mission.basket || '',
      safety: mission.safety || '',
      access: mission.access || '',
      tomato_score: mission.tomato_score ?? '',
      conditions_line: mission.conditions_line || '',
      commissioned: !!mission.commissioned,
      funder_credit: mission.funder_credit || '',
      commissioning_question: mission.commissioning_question || ''
    });
    setIsEditorOpen(true);
  };

  const handleNew = () => {
    setSelectedMission(null);
    setForm({
      ...EMPTY_AUDIT_FORM,
      episode_number: missions.filter(m => m.episode_number).length + 1
    });
    setIsEditorOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Place name / title is required.');
      return;
    }

    setSaving(true);
    setError(null);

    const resolvedYtId = form.youtube_id.trim() || extractYouTubeId(form.video_url);

    const payload: Partial<Adventure> = {
      title: form.title.trim(),
      codename: form.codename.trim() || form.title.trim(),
      status: form.status,
      description: form.description,
      lat: Number(form.lat),
      lng: Number(form.lng),
      bounty_target: Number(form.bounty_target) || 0,
      bounty_current: Number(form.bounty_current) || 0,
      video_url: form.video_url.trim() || (resolvedYtId ? `https://www.youtube.com/watch?v=${resolvedYtId}` : undefined),
      thumbnail_url: form.thumbnail_url.trim() || (resolvedYtId ? `https://img.youtube.com/vi/${resolvedYtId}/hqdefault.jpg` : undefined),
      episode_number: form.episode_number !== '' ? Number(form.episode_number) : null,
      audit_date: form.audit_date || null,
      youtube_id: resolvedYtId || null,
      story_slug: form.story_slug.trim() || null,
      score: form.score !== '' ? Number(form.score) : null,
      verdict_line: form.verdict_line.trim() || null,
      place: form.title.trim(),
      rent_mo: form.rent_mo.trim() || null,
      basket: form.basket.trim() || null,
      safety: form.safety.trim() || null,
      access: form.access.trim() || null,
      tomato_score: form.tomato_score !== '' ? Number(form.tomato_score) : null,
      conditions_line: form.conditions_line.trim() || null,
      commissioned: form.commissioned,
      funder_credit: form.commissioned ? form.funder_credit.trim() || null : null,
      commissioning_question: form.commissioned ? form.commissioning_question.trim() || null : null
    };

    try {
      if (selectedMission) {
        // Update existing
        try {
          await updateAdventure(selectedMission.id, payload);
        } catch {
          await MockAdventureService.updateAdventure(selectedMission.id, payload);
        }
        setSuccess(`Audit for "${payload.title}" updated successfully.`);
      } else {
        // Create new
        try {
          await createAdventure(payload as any);
        } catch {
          await MockAdventureService.createAdventure(payload as any);
        }
        setSuccess(`New Audit for "${payload.title}" published successfully.`);
      }

      await onRefresh();
      setIsEditorOpen(false);
    } catch (err: any) {
      console.error('Save audit error:', err);
      setError(`Failed to save audit: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (missionId: string, placeName: string) => {
    if (!window.confirm(`Permanently delete audit/mission for "${placeName}"?`)) return;

    try {
      try {
        await deleteAdventure(missionId);
      } catch {
        await MockAdventureService.deleteAdventure(missionId);
      }
      setSuccess(`Audit for "${placeName}" deleted.`);
      await onRefresh();
      if (selectedMission?.id === missionId) setIsEditorOpen(false);
    } catch (err: any) {
      setError(`Failed to delete: ${err.message || err}`);
    }
  };

  const filteredMissions = filter === 'all'
    ? missions
    : missions.filter(m => m.status === filter);

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2">
          {['all', 'complete', 'active', 'greenlit', 'scouting'].map(st => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
                filter === st
                  ? 'bg-red-600 text-white font-bold'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {st === 'complete' ? 'Completed Audits' : st}
            </button>
          ))}
        </div>

        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-950/40"
        >
          <Plus className="w-4 h-4" />
          New Mission / Audit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Missions & Audits List */}
        <div className={`${isEditorOpen ? 'lg:col-span-1' : 'lg:col-span-3'} space-y-3`}>
          <div className="glass-elevated rounded-2xl border border-neutral-800 p-6 shadow-glass">
            <h2 className="text-xl font-bold text-neutral-50 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-red-500" />
              Missions & Place Audits
              <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full font-mono">
                {filteredMissions.length}
              </span>
            </h2>

            <div className="space-y-3">
              {filteredMissions.length === 0 ? (
                <div className="p-8 text-center text-neutral-500 font-mono text-xs border border-dashed border-neutral-800 rounded-xl">
                  No records found in this category.
                </div>
              ) : (
                filteredMissions.map(m => {
                  const isDone = m.status === 'complete';
                  const latitude = Number(m.display_lat ?? m.lat);
                  const longitude = Number(m.display_lng ?? m.lng);
                  const coordinates = Number.isFinite(latitude) && Number.isFinite(longitude)
                    ? `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`
                    : 'Coordinates unavailable';
                  return (
                    <div
                      key={m.id}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        selectedMission?.id === m.id && isEditorOpen
                          ? 'bg-neutral-900 border-red-500/50 shadow-lg shadow-red-950/20'
                          : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                      }`}
                      onClick={() => handleEdit(m)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            m.status === 'complete' ? 'bg-neutral-800 text-neutral-300 border-neutral-700' :
                            m.status === 'active' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                            m.status === 'greenlit' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}>
                            {m.status.toUpperCase()}
                          </span>
                          {m.episode_number && (
                            <span className="text-xs font-mono font-bold text-neutral-400">
                              #{m.episode_number}
                            </span>
                          )}
                          {isDone && m.score !== null && m.score !== undefined && (
                            <span className="text-xs font-bold font-mono px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-500/30">
                              Score: {m.score}
                            </span>
                          )}
                        </div>

                        <h4 className="font-display font-bold text-base text-neutral-100 truncate">
                          {m.display_title || m.codename}
                        </h4>

                        {m.verdict_line && (
                          <p className="text-xs text-red-400/90 italic truncate">
                            &ldquo;{m.verdict_line}&rdquo;
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-500 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-red-500" />
                            {coordinates}
                          </span>
                          {m.story_slug && (
                            <span className="flex items-center gap-1 text-neutral-400">
                              <BookOpen className="w-3 h-3" />
                              /{m.story_slug}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleEdit(m)}
                          className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(m.id, m.display_title)}
                          className="p-2 rounded-lg bg-neutral-800 hover:bg-red-950 text-neutral-400 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Editor Form Panel */}
        {isEditorOpen && (
          <div className="lg:col-span-2">
            <form onSubmit={handleSave} className="glass-elevated rounded-2xl border border-neutral-800 p-6 md:p-8 shadow-glass space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-red-500" />
                  <h3 className="font-display font-bold text-xl text-neutral-50">
                    {selectedMission ? `Edit: ${form.title}` : 'Publish New Audit / Mission'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="p-2 text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status and Mission Identification */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-neutral-400">Place Name (Canonical)</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Birkbeck Tunnel"
                    required
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-neutral-400">Codename (Public label)</label>
                  <input
                    type="text"
                    value={form.codename}
                    onChange={e => setForm({ ...form, codename: e.target.value })}
                    placeholder="e.g. Target Alpha"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-neutral-400">Mission Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="complete">Complete (Published Audit)</option>
                    <option value="active">Active (In Progress)</option>
                    <option value="greenlit">Greenlit (Confirmed)</option>
                    <option value="scouting">Scouting (Planning/Unfunded)</option>
                  </select>
                </div>
              </div>

              {/* Coordinates & Funding */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-neutral-400">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={form.lat}
                    onChange={e => setForm({ ...form, lat: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-neutral-400">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={form.lng}
                    onChange={e => setForm({ ...form, lng: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-neutral-400">Bounty Target (£)</label>
                  <input
                    type="number"
                    value={form.bounty_target}
                    onChange={e => setForm({ ...form, bounty_target: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-neutral-400">Current Bounty (£)</label>
                  <input
                    type="number"
                    value={form.bounty_current}
                    onChange={e => setForm({ ...form, bounty_current: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Description / Mission Brief */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-neutral-400">Mission Description / Brief</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Summary of the location and what was investigated..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              {/* ─── AUDIT SECTION (Highlighted for Completed Audits) ────────────────── */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-red-950/20 via-neutral-900/60 to-black border border-red-500/30 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-red-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🍅</span>
                    <h4 className="font-display font-bold text-lg text-red-400">
                      Spine Audit Ledger (Spine §15–16)
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-neutral-500">
                    Feeds League Table, Billboard & Story Header
                  </span>
                </div>

                {/* Score, Episode, Date, Verdict */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-amber-400 font-bold">
                      Editorial Score (1–100)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={form.score}
                      onChange={e => setForm({ ...form, score: e.target.value === '' ? '' : parseInt(e.target.value) })}
                      placeholder="e.g. 84 (Never formula)"
                      className="w-full bg-neutral-950 border border-red-500/40 rounded-xl p-3 text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-neutral-400">Episode Number</label>
                    <input
                      type="number"
                      value={form.episode_number}
                      onChange={e => setForm({ ...form, episode_number: e.target.value === '' ? '' : parseInt(e.target.value) })}
                      placeholder="e.g. 1"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-neutral-400">Audit Date</label>
                    <input
                      type="date"
                      value={form.audit_date}
                      onChange={e => setForm({ ...form, audit_date: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-neutral-400">Attach Story Slug</label>
                    <select
                      value={form.story_slug}
                      onChange={e => setForm({ ...form, story_slug: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="">-- No Story Attached --</option>
                      {posts.map(p => (
                        <option key={p.id} value={p.slug}>
                          {p.title} (/{p.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Verdict Line */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-neutral-400">
                    Verdict Line (Short canonical verdict)
                  </label>
                  <input
                    type="text"
                    value={form.verdict_line}
                    onChange={e => setForm({ ...form, verdict_line: e.target.value })}
                    placeholder='e.g. "£11 bought a full day"'
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Media Links: YouTube ID & Thumbnail */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-neutral-400">
                      YouTube Video ID or Full URL
                    </label>
                    <input
                      type="text"
                      value={form.youtube_id}
                      onChange={e => {
                        const val = e.target.value;
                        const extracted = extractYouTubeId(val) || val;
                        setForm({ ...form, youtube_id: extracted });
                      }}
                      placeholder="e.g. b-tJOvF5w-k or https://youtu.be/..."
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono uppercase text-neutral-400">Thumbnail Image URL</label>
                    <input
                      type="text"
                      value={form.thumbnail_url}
                      onChange={e => setForm({ ...form, thumbnail_url: e.target.value })}
                      placeholder="Auto-derived from YouTube if empty"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                {/* League audit fields */}
                <div className="space-y-2">
                  <span className="block text-xs font-mono font-bold uppercase text-neutral-400">
                    League Table Fields
                  </span>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-neutral-500">Rent / Mo</label>
                      <input type="text" value={form.rent_mo} onChange={e => setForm({ ...form, rent_mo: e.target.value })} placeholder="850 GBP 1-bed" className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-2.5 text-xs text-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-neutral-500">Basket</label>
                      <input type="text" value={form.basket} onChange={e => setForm({ ...form, basket: e.target.value })} placeholder="38 GBP weekly basics" className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-2.5 text-xs text-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-neutral-500">Safety</label>
                      <input type="text" value={form.safety} onChange={e => setForm({ ...form, safety: e.target.value })} placeholder="Mixed - avoid late" className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-2.5 text-xs text-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-neutral-500">Access</label>
                      <input type="text" value={form.access} onChange={e => setForm({ ...form, access: e.target.value })} placeholder="Walkable; buses limited" className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-2.5 text-xs text-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-neutral-500">Tomato Score (1-10)</label>
                      <input type="number" min="1" max="10" value={form.tomato_score} onChange={e => setForm({ ...form, tomato_score: e.target.value === '' ? '' : Number(e.target.value) })} placeholder="7" className="w-full rounded-lg border border-neutral-800 bg-neutral-900 p-2.5 text-xs text-white" />
                    </div>
                  </div>
                </div>

                {/* Conditions Line */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase text-neutral-400">
                    Conditions Line (Weather, day, environment)
                  </label>
                  <input
                    type="text"
                    value={form.conditions_line}
                    onChange={e => setForm({ ...form, conditions_line: e.target.value })}
                    placeholder="e.g. Overcast, 9°C, Tuesday morning lull, heavy CCTV density"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* Commissioned Details */}
                <div className="pt-2 border-t border-neutral-800/80 space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="comm-toggle"
                      checked={form.commissioned}
                      onChange={e => setForm({ ...form, commissioned: e.target.checked })}
                      className="w-4 h-4 rounded border-neutral-800 text-red-600 focus:ring-0"
                    />
                    <label htmlFor="comm-toggle" className="text-xs font-mono uppercase text-neutral-300 cursor-pointer">
                      Commissioned by an Operative / Supporter
                    </label>
                  </div>

                  {form.commissioned && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7 pt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-neutral-500">Funder Credit</label>
                        <input
                          type="text"
                          value={form.funder_credit}
                          onChange={e => setForm({ ...form, funder_credit: e.target.value })}
                          placeholder="e.g. Operative @NorthGrit"
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-xs text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase text-neutral-500">Commissioning Question</label>
                        <input
                          type="text"
                          value={form.commissioning_question}
                          onChange={e => setForm({ ...form, commissioning_question: e.target.value })}
                          placeholder='e.g. "What happened to the public commons around the old docks?"'
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Prole Foods Claim ─────────────────────────────────────── */}
              {selectedMission && (
                <div className="space-y-3 pt-4 border-t border-neutral-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">🥪</span>
                    <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                      Prole Foods Slot
                    </h3>
                    {selectedMission.prole_foods_claimed && (
                      <span className="ml-auto bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        CLAIMED
                      </span>
                    )}
                  </div>

                  {selectedMission.prole_foods_claimed ? (
                    <div className="space-y-2 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-neutral-500 uppercase tracking-wider mb-1 font-mono text-[10px]">Donor Name</p>
                          <p className="text-amber-300 font-semibold">{selectedMission.prole_foods_donor_name || '—'}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500 uppercase tracking-wider mb-1 font-mono text-[10px]">Town</p>
                          <p className="text-amber-300 font-semibold">{selectedMission.prole_foods_town || '—'}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500 uppercase tracking-wider mb-1 font-mono text-[10px]">Amount Paid</p>
                          <p className="text-amber-300 font-semibold">
                            {selectedMission.prole_foods_amount
                              ? `£${selectedMission.prole_foods_amount.toFixed(2)}`
                              : '—'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-neutral-500 uppercase tracking-wider mb-1 font-mono text-[10px]">Food Request / Shout-Out Instruction</p>
                        <p className="text-white text-sm leading-relaxed bg-neutral-900 border border-neutral-800 rounded-lg p-3">
                          {selectedMission.prole_foods_instruction || '(no instruction left)'}
                        </p>
                      </div>
                      <p className="text-neutral-600 text-[10px] font-mono">
                        To reset this slot, update directly in Supabase SQL editor.
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-500 text-xs font-mono">
                      <span className="text-neutral-700">🥪</span>
                      No Prole Foods claim on this mission yet.
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-mono text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-500 disabled:bg-neutral-800 text-white rounded-xl font-bold font-mono text-xs uppercase tracking-wider shadow-lg shadow-red-950/40"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Transmitting...' : 'Save Audit Record'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
