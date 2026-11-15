import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  BookOpen,
  Layout,
  Type,
  Image as ImageIcon,
  Youtube,
  Twitter as TwitterIcon,
  Heart,
  Lock,
  Key,
  Send,
  RefreshCw,
  Shield,
  Target,
  Trophy
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AuditManager } from '../components/admin/AuditManager';
import {
  getAllPostsAdmin,
  createPost,
  updatePost,
  deletePost
} from '../lib/posts';
import { getAdventures, type SecureAdventure } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { Post, PostCategory, PostLayout, TemplateData } from '../types/post';

const CATEGORIES: PostCategory[] = ['escape', 'prolenomics', 'decline', 'freedom', 'dispatches', 'urban-exploration'];

const EMPTY_TEMPLATE: TemplateData = {
  heroImageUrl: '',
  summary: '',
  affiliateEnabled: false,
  affiliateImageUrl: '',
  textBlockA: '',
  tweetUrl: '',
  textBlockB: '',
  textBlockC: '',
  missionCalloutEnabled: true,
  missionCalloutId: 'auto',
  textBlockD: '',
  youtubeUrl: '',
  closeoutText: ''
};

export const AdminPage: React.FC = () => {
  // Data state
  const [posts, setPosts] = useState<Post[]>([]);
  const [missions, setMissions] = useState<SecureAdventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // UI state
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [readTimeManuallyEdited, setReadTimeManuallyEdited] = useState(false);
  const [adminTab, setAdminTab] = useState<'posts' | 'audits'>('posts');

  // Auth state
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Layout mode state
  const [layoutMode, setLayoutMode] = useState<PostLayout>('template');

  // Form state
  const [formValues, setFormValues] = useState({
    title: '',
    slug: '',
    category: 'dispatches' as PostCategory,
    excerpt: '',
    content: '',
    cover_image_url: '',
    read_time: 5,
    published: false,
    is_gated: false,
    access_code: ''
  });

  const [notifying, setNotifying] = useState(false);

  const generateAccessCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'PROLE-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const [templateData, setTemplateData] = useState<TemplateData>(EMPTY_TEMPLATE);

  const estimateReadTime = (text: string): number => {
    if (!text) return 1;
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 225));
  };

  const calculateTemplateReadTime = useCallback((data: TemplateData): number => {
    const combinedText = [
      data.summary,
      data.textBlockA,
      data.textBlockB,
      data.textBlockC,
      data.textBlockD,
      data.closeoutText
    ].join(' ');
    return estimateReadTime(combinedText);
  }, []);

  const { user, initialized: authInitialized } = useAuth();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const [postsData, missionsData] = await Promise.all([
        getAllPostsAdmin(),
        getAdventures().catch(() => [])
      ]);
      setPosts(postsData);
      setMissions(missionsData);
    } catch (err) {
      setError('Failed to fetch posts from archive.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update authentication status based on the central auth hook
  useEffect(() => {
    if (authInitialized) {
      setIsAuthenticated(user?.email === 'contact@proleadventures.com');
      setAuthLoading(false);
    }
  }, [user, authInitialized]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
    }
  }, [isAuthenticated, fetchPosts]);

  // Clear success/error messages after delay
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Handle selection for edit
  const handleEdit = (post: Post) => {
    setSelectedPost(post);
    setLayoutMode(post.layout || 'template');
    setFormValues({
      title: post.title,
      slug: post.slug,
      category: post.category,
      excerpt: post.excerpt,
      content: post.content || '',
      cover_image_url: post.cover_image_url,
      read_time: post.read_time,
      published: post.published,
      is_gated: post.is_gated || false,
      access_code: post.access_code || ''
    });
    setTemplateData(post.template_data || EMPTY_TEMPLATE);
    setReadTimeManuallyEdited(false);
    setIsSidebarOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNew = () => {
    setSelectedPost(null);
    setLayoutMode('template');
    setFormValues({
      title: '',
      slug: '',
      category: 'urban-exploration',
      excerpt: '',
      content: '',
      cover_image_url: '',
      read_time: 1,
      published: false,
      is_gated: false,
      access_code: generateAccessCode()
    });
    setTemplateData(EMPTY_TEMPLATE);
    setReadTimeManuallyEdited(false);
    setIsSidebarOpen(true);
  };

  const handleSlugGen = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNotifySubscribers = async (postToNotify: { id?: string; slug: string; title: string; excerpt: string; access_code?: string | null }) => {
    if (!window.confirm(`Broadcast notification email to all subscribers/contributors for "${postToNotify.title}"?`)) {
      return;
    }

    setNotifying(true);
    try {
      const { data: sessionData } = await (await import('../lib/supabase')).supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch('/notify-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          postId: postToNotify.id,
          slug: postToNotify.slug,
          title: postToNotify.title,
          excerpt: postToNotify.excerpt,
          accessCode: postToNotify.access_code || undefined
        })
      });

      const result = (await res.json()) as { success?: boolean; count?: number; error?: string };
      if (res.ok && result.success) {
        setSuccess(`Broadcast complete: Sent to ${result.count} subscribers.`);
      } else {
        setError(`Broadcast failed: ${result.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Broadcast error:', err);
      setError(`Failed to send broadcast: ${err.message || err}`);
    } finally {
      setNotifying(false);
    }
  };

  const handleSave = async (e: React.FormEvent, andNotify: boolean = false) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Basic validation
    if (!formValues.title || !formValues.excerpt) {
      setError('Title and excerpt are required.');
      setSaving(false);
      return;
    }

    if (layoutMode === 'markdown' && !formValues.content) {
      setError('Markdown content is required for markdown layout.');
      setSaving(false);
      return;
    }

    let finalSlug = formValues.slug;
    if (!finalSlug) {
      finalSlug = handleSlugGen(formValues.title);
    }

    const payload = {
      ...formValues,
      slug: finalSlug,
      layout: layoutMode,
      template_data: layoutMode === 'template' ? templateData : null,
      content: layoutMode === 'markdown' ? formValues.content : `Template Mode: ${formValues.title}`,
      is_gated: formValues.is_gated,
      access_code: formValues.is_gated ? (formValues.access_code || generateAccessCode()) : null
    };

    try {
      let savedPost: Post | null = null;
      if (selectedPost) {
        // Update
        savedPost = await updatePost(selectedPost.slug, payload);
        if (savedPost) {
          setSuccess(`Story "${savedPost.title}" updated successfully.`);
          await fetchPosts();
        } else {
          setError('Failed to update the story.');
        }
      } else {
        // Create
        savedPost = await createPost(payload);
        if (savedPost) {
          setSuccess(`New story "${savedPost.title}" archived.`);
          await fetchPosts();
        } else {
          setError('Failed to create the new story.');
        }
      }

      if (savedPost && andNotify) {
        await handleNotifySubscribers(savedPost);
      }

      if (savedPost) {
        setIsSidebarOpen(false);
      }
    } catch (err) {
      setError('An unexpected transmission error occurred.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string, title: string) => {
    if (!window.confirm(`Permanently delete "${title}"? This cannot be undone.`)) return;

    try {
      const ok = await deletePost(slug);
      if (ok) {
        setSuccess(`Story "${title}" has been deleted.`);
        await fetchPosts();
        if (selectedPost?.slug === slug) handleNew();
      } else {
        setError('Failed to delete the story.');
      }
    } catch (err) {
      setError('Error during deletion.');
      console.error(err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="glass-elevated p-8 rounded-3xl border border-neutral-800 shadow-glass text-center max-w-sm w-full animate-pulse">
          <Loader2 className="w-12 h-12 text-red-500 mx-auto mb-6 animate-spin" />
          <h2 className="text-2xl font-bold text-neutral-50 mb-2">Checking access...</h2>
          <p className="text-neutral-400 text-sm">Syncing with archive permissions.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="glass-elevated p-10 rounded-3xl border border-red-500/20 shadow-glass text-center max-w-md w-full">
          <div className="w-20 h-20 bg-red-950/20 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-red-500/30">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-3xl font-bold text-neutral-50 mb-4">Restricted Access</h2>
          <p className="text-neutral-400 mb-10 leading-relaxed">
            Archive modifications require authorization. Please sign in to access Adventure Control.
          </p>
          <button
            onClick={() => window.location.href = 'https://proleadventures.com/login'}
            className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-red-900/20"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-black pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-neutral-50 mb-4 tracking-tight">
              ADveNTUre <span className="text-red-500">CoNTRoL</span>
            </h1>
            <p className="text-neutral-400 max-w-xl">
              Central node for archive management. Modifying stories here updates the public feed in real-time.
            </p>
          </div>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-red-900/20"
          >
            <Plus className="w-5 h-5" />
            New Adventure
          </button>
        </header>

        {/* Global Messages */}
        <div className="mb-8 space-y-4">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-500/50 rounded-xl text-red-200 animate-in fade-in slide-in-from-top-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-950/30 border border-green-500/50 rounded-xl text-green-200 animate-in fade-in slide-in-from-top-4">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}
        </div>

        {/* Module Switcher Tabs */}
        <div className="flex border-b border-neutral-800 mb-8 gap-4 font-mono text-sm">
          <button
            type="button"
            onClick={() => setAdminTab('posts')}
            className={`pb-4 px-2 flex items-center gap-2 border-b-2 font-bold transition-all cursor-pointer ${
              adminTab === 'posts'
                ? 'border-red-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-red-500" />
            <span>Stories & Dispatches</span>
            <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full font-mono">
              {posts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAdminTab('audits')}
            className={`pb-4 px-2 flex items-center gap-2 border-b-2 font-bold transition-all cursor-pointer ${
              adminTab === 'audits'
                ? 'border-red-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Missions & Place Audits</span>
            <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full font-mono">
              {missions.length}
            </span>
          </button>
        </div>

        {adminTab === 'audits' ? (
          <AuditManager
            missions={missions}
            posts={posts}
            onRefresh={fetchPosts}
            setError={setError}
            setSuccess={setSuccess}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Posts List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-elevated rounded-2xl border border-neutral-800 p-6 shadow-glass overflow-hidden">
              <h2 className="text-xl font-bold text-neutral-50 mb-6 flex items-center gap-2">
                Active Chronicles
                <span className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full font-mono">
                  {posts.length}
                </span>
              </h2>

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-neutral-500">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <p className="font-mono text-sm">Syncing with archive...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="py-20 text-center text-neutral-500 border-2 border-dashed border-neutral-800 rounded-xl">
                  <p>No stories found in the database.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                        selectedPost?.id === post.id
                          ? 'bg-neutral-900 border-red-500/50 shadow-lg shadow-red-950/20'
                          : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                      }`}
                      onClick={() => handleEdit(post)}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800 border border-neutral-700">
                          <img
                            src={post.cover_image_url}
                            alt=""
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/100')}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-neutral-100 truncate">
                              {post.title}
                            </h3>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-tighter ${
                              post.layout === 'markdown'
                                ? 'bg-neutral-800 text-neutral-400 border-neutral-700'
                                : 'bg-red-950/30 text-red-400 border-red-500/30'
                            }`}>
                              {post.layout || 'Template'}
                            </span>
                            {post.is_gated && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-tighter bg-amber-950/30 text-amber-400 border-amber-500/30 flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> Gated
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500 font-mono">
                            {post.category.replace('-', ' ')} • {new Date(post.created_at).toLocaleDateString()} {post.access_code && `• Code: ${post.access_code}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {post.published && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleNotifySubscribers(post); }}
                            className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-amber-400 transition-colors"
                            title="Broadcast notification email to contributors"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(post); }}
                          className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(post.slug, post.title); }}
                          className="p-2 hover:bg-red-950/50 rounded-lg text-neutral-500 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <a
                          href={`/read/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-red-400 transition-colors"
                          title="View Live"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Editor Form & Preview */}
          <div className={`lg:col-span-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
              {/* Form Pane */}
              <form
                onSubmit={handleSave}
                className="glass-elevated rounded-2xl border border-neutral-800 p-6 shadow-glass sticky top-28"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-neutral-50 flex items-center gap-2">
                    {selectedPost ? <Edit2 className="w-5 h-5 text-red-500" /> : <Plus className="w-5 h-5 text-red-500" />}
                    {selectedPost ? 'Modify Chronicle' : 'New Archive Entry'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 text-neutral-500 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Layout Toggle */}
                <div className="flex p-1 bg-neutral-900 rounded-xl border border-neutral-800 mb-8">
                  <button
                    type="button"
                    onClick={() => setLayoutMode('template')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                      layoutMode === 'template'
                        ? 'bg-neutral-800 text-neutral-50 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    <Layout className="w-4 h-4" />
                    Template
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutMode('markdown')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                      layoutMode === 'markdown'
                        ? 'bg-neutral-800 text-neutral-50 shadow-sm'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    <Type className="w-4 h-4" />
                    Markdown
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Title</label>
                      <input
                        type="text"
                        required
                        value={formValues.title}
                        onChange={(e) => setFormValues({...formValues, title: e.target.value})}
                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-red-500/50 rounded-xl p-3 text-neutral-100 outline-none transition-colors"
                        placeholder="Story title..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Slug</label>
                      <input
                        type="text"
                        value={formValues.slug}
                        onChange={(e) => setFormValues({...formValues, slug: handleSlugGen(e.target.value)})}
                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-red-500/50 rounded-xl p-3 text-neutral-100 outline-none transition-colors font-mono text-sm"
                        placeholder="url-friendly-slug"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Category</label>
                      <select
                        value={formValues.category}
                        onChange={(e) => setFormValues({...formValues, category: e.target.value as PostCategory})}
                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-red-500/50 rounded-xl p-3 text-neutral-100 outline-none transition-colors appearance-none"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat.replace('-', ' ')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Read Time</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formValues.read_time}
                        onChange={(e) => {
                          setFormValues({...formValues, read_time: parseInt(e.target.value)});
                          setReadTimeManuallyEdited(true);
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 focus:border-red-500/50 rounded-xl p-3 text-neutral-100 outline-none transition-colors"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Publish Status</label>
                      <div className="flex items-center justify-between h-[50px] px-4 bg-neutral-900 border border-neutral-800 rounded-xl">
                        <span className="text-xs text-neutral-400 font-mono">{formValues.published ? 'LIVE' : 'DRAFT'}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={formValues.published}
                            onChange={(e) => setFormValues({...formValues, published: e.target.checked})}
                          />
                          <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Gated / Classified Settings */}
                  <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-red-400" />
                        <div>
                          <span className="text-xs font-bold text-neutral-200 uppercase tracking-widest block">Contributor Gated Content</span>
                          <span className="text-[11px] text-neutral-500">Restricts full intelligence to contributors with an access code</span>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={formValues.is_gated}
                          onChange={(e) => setFormValues({...formValues, is_gated: e.target.checked})}
                        />
                        <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>

                    {formValues.is_gated && (
                      <div className="pt-3 border-t border-red-500/10 flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Key className="w-3 h-3 text-red-400" /> Contributor Access Code
                          </label>
                          <input
                            type="text"
                            value={formValues.access_code}
                            onChange={(e) => setFormValues({...formValues, access_code: e.target.value.toUpperCase()})}
                            placeholder="PROLE-XXXX"
                            className="w-full bg-neutral-900 border border-neutral-800 focus:border-red-500/50 rounded-xl p-2.5 text-red-400 font-mono text-sm font-bold tracking-wider outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormValues({...formValues, access_code: generateAccessCode()})}
                          className="mt-4 px-3 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors"
                          title="Generate new access code"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Regen
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Excerpt (Search Result Snippet)</label>
                    <textarea
                      required
                      rows={2}
                      value={formValues.excerpt}
                      onChange={(e) => setFormValues({...formValues, excerpt: e.target.value})}
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-red-500/50 rounded-xl p-3 text-neutral-100 outline-none transition-colors resize-none text-sm"
                      placeholder="One sentence hook..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Discovery Image URL</label>
                    <input
                      type="text"
                      required
                      value={formValues.cover_image_url}
                      onChange={(e) => setFormValues({...formValues, cover_image_url: e.target.value})}
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-red-500/50 rounded-xl p-3 text-neutral-100 outline-none transition-colors font-mono text-xs"
                      placeholder="/images/covers/..."
                    />
                  </div>

                  {/* Layout Dependent Fields */}
                  <div className="pt-4 border-t border-neutral-800">
                    {layoutMode === 'markdown' ? (
                      <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Type className="w-3 h-3" /> Markdown Content
                        </label>
                        <textarea
                          required
                          rows={15}
                          value={formValues.content}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormValues({...formValues, content: val});
                            if (!readTimeManuallyEdited) {
                              setFormValues(prev => ({...prev, read_time: estimateReadTime(val)}));
                            }
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 focus:border-red-500/50 rounded-xl p-4 text-neutral-100 outline-none transition-colors font-mono text-sm leading-relaxed"
                          placeholder="# Write your investigation..."
                        />
                      </div>
                    ) : (
                      <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                        {/* Summary */}
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Narrative Summary</label>
                          <textarea
                            value={templateData.summary}
                            onChange={(e) => setTemplateData({...templateData, summary: e.target.value})}
                            className="w-full bg-neutral-900 border border-neutral-800 focus:border-red-500/50 rounded-xl p-3 text-neutral-100 outline-none text-sm italic"
                            placeholder="Detailed overview under title..."
                          />
                        </div>

                        {/* Hero Image */}
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Hero Section Image URL</label>
                          <input
                            type="text"
                            value={templateData.heroImageUrl}
                            onChange={(e) => setTemplateData({...templateData, heroImageUrl: e.target.value})}
                            className="w-full bg-neutral-900 border border-neutral-800 focus:border-red-500/50 rounded-xl p-3 text-neutral-100 outline-none font-mono text-xs"
                          />
                        </div>

                        {/* Affiliate */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-900/40 p-4 rounded-2xl border border-neutral-800">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-neutral-500 flex items-center gap-2">
                              <ImageIcon className="w-3 h-3" /> Affiliate Gear
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={templateData.affiliateEnabled}
                                onChange={(e) => setTemplateData({...templateData, affiliateEnabled: e.target.checked})}
                              />
                              <div className="w-9 h-5 bg-neutral-700 rounded-full peer peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                          </div>
                          <input
                            type="text"
                            placeholder="Gear Banner Image URL"
                            value={templateData.affiliateImageUrl || ''}
                            onChange={(e) => setTemplateData({...templateData, affiliateImageUrl: e.target.value})}
                            className="bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-[10px] font-mono outline-none"
                            disabled={!templateData.affiliateEnabled}
                          />
                        </div>

                        {/* Block A */}
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Intelligence Block A (Main)</label>
                          <textarea
                            rows={4}
                            value={templateData.textBlockA}
                            onChange={(e) => setTemplateData({...templateData, textBlockA: e.target.value})}
                            className="w-full bg-neutral-900 border border-neutral-800 focus:border-red-500/50 rounded-xl p-3 text-neutral-100 outline-none text-sm"
                          />
                        </div>

                        {/* Tweet & Block B */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="md:col-span-1">
                            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-1"><TwitterIcon className="w-3 h-3" /> Tweet URL</label>
                            <input
                              type="text"
                              value={templateData.tweetUrl || ''}
                              onChange={(e) => setTemplateData({...templateData, tweetUrl: e.target.value})}
                              className="w-full bg-neutral-900 border border-neutral-800 focus:border-red-500/50 rounded-xl p-3 text-neutral-100 outline-none text-[10px] font-mono"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Intelligence Block B</label>
                            <textarea
                              rows={3}
                              value={templateData.textBlockB}
                              onChange={(e) => setTemplateData({...templateData, textBlockB: e.target.value})}
                              className="w-full bg-neutral-900 border border-neutral-800 focus:border-red-500/50 rounded-xl p-3 text-neutral-100 outline-none text-sm"
                            />
                          </div>
                        </div>

                        {/* Block C */}
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Intelligence Block C</label>
                          <textarea
                            rows={3}
                            value={templateData.textBlockC}
                            onChange={(e) => setTemplateData({...templateData, textBlockC: e.target.value})}
                            className="w-full bg-neutral-900 border border-neutral-800 focus:border-red-500/50 rounded-xl p-3 text-neutral-100 outline-none text-sm"
                          />
                        </div>

                        {/* Prole Control Mission Funding Callout */}
                        <div className="bg-red-950/20 p-4 rounded-2xl border border-red-500/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-red-400 flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5" /> Mission Funding Callout (Prole Control)
                              </span>
                              <span className="text-[11px] text-neutral-500">Promotes an active operation with live progress bar to readers</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={templateData.missionCalloutEnabled ?? true}
                                onChange={(e) => setTemplateData({...templateData, missionCalloutEnabled: e.target.checked})}
                              />
                              <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                          </div>

                          {(templateData.missionCalloutEnabled ?? true) && (
                            <div className="pt-2 border-t border-red-500/10 flex flex-col sm:flex-row items-center gap-3">
                              <div className="flex-1 w-full">
                                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                  <Target className="w-3 h-3 text-red-400" /> Target Mission
                                </label>
                                <select
                                  value={templateData.missionCalloutId || 'auto'}
                                  onChange={(e) => setTemplateData({...templateData, missionCalloutId: e.target.value})}
                                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-500/50 rounded-xl p-2.5 text-xs text-neutral-200 outline-none"
                                >
                                  <option value="auto">⚡ Auto: Live Mission Nearest to Funding Goal</option>
                                  {missions.map(m => (
                                    <option key={m.id} value={m.id}>
                                      {m.codename || m.display_title} (£{m.bounty_current} / £{m.bounty_target})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Block D */}
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Intelligence Block D</label>
                          <textarea
                            rows={3}
                            value={templateData.textBlockD}
                            onChange={(e) => setTemplateData({...templateData, textBlockD: e.target.value})}
                            className="w-full bg-neutral-900 border border-neutral-800 focus:border-red-500/50 rounded-xl p-3 text-neutral-100 outline-none text-sm"
                          />
                        </div>

                        {/* YouTube */}
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-1"><Youtube className="w-3 h-3" /> YouTube Investigation URL</label>
                          <input
                            type="text"
                            value={templateData.youtubeUrl || ''}
                            onChange={(e) => setTemplateData({...templateData, youtubeUrl: e.target.value})}
                            className="w-full bg-neutral-900 border border-neutral-800 focus:border-red-500/50 rounded-xl p-3 text-neutral-100 outline-none text-[10px] font-mono text-red-100"
                            placeholder="https://youtube.com/watch?v=..."
                          />
                        </div>

                        {/* Closeout */}
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Final Transmission (Close-out)</label>
                          <textarea
                            rows={3}
                            value={templateData.closeoutText}
                            onChange={(e) => setTemplateData({...templateData, closeoutText: e.target.value})}
                            className="w-full bg-neutral-900 border border-neutral-800 focus:border-red-500/50 rounded-xl p-3 text-neutral-100 outline-none text-sm font-bold opacity-80"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-8">
                    <button
                      type="submit"
                      disabled={saving || notifying}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-4 bg-red-600 hover:bg-red-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-red-900/10 text-sm"
                    >
                      {saving && !notifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Sync Chronicle
                    </button>
                    {formValues.published && (
                      <button
                        type="button"
                        disabled={saving || notifying}
                        onClick={(e) => handleSave(e, true)}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-4 bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-200 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-xl font-bold transition-all duration-300 text-sm"
                        title="Save story and email all subscribers with access code"
                      >
                        {notifying ? <Loader2 className="w-4 h-4 animate-spin text-red-400" /> : <Send className="w-4 h-4 text-red-400" />}
                        Sync & Broadcast
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsSidebarOpen(false)}
                      className="px-5 py-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-bold transition-all duration-300 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>

              {/* Preview Pane */}
              <div className="glass-elevated rounded-2xl border border-neutral-800 p-8 shadow-glass xl:sticky xl:top-28 min-h-[600px] flex flex-col">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-900/20 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-50">Live Intel Preview</h3>
                      <p className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase">{layoutMode} Rendering Enabled</p>
                    </div>
                  </div>
                  <div className="text-[10px] text-neutral-400 font-mono flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    REALTIME_STREAM
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[850px] pr-4 custom-scrollbar">
                  {layoutMode === 'markdown' ? (
                    <div className="prose-custom text-neutral-300 leading-relaxed text-sm">
                      <ReactMarkdown
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-neutral-50 mt-8 mb-4 border-l-4 border-red-600 pl-4" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-xl font-bold text-neutral-50 mt-6 mb-3 pb-2 border-b border-neutral-800" {...props} />,
                          p: ({node, ...props}) => <p className="mb-4" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-red-500 bg-neutral-900/50 p-4 italic mb-4 rounded" {...props} />,
                          img: ({node, ...props}) => <img className="rounded-xl border border-neutral-800 my-6 w-full" {...props} />
                        }}
                      >
                        {formValues.content || '*Archived intelligence pending...*'}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="space-y-8 pb-10">
                      {templateData.heroImageUrl ? (
                        <div className="aspect-video rounded-xl overflow-hidden border border-neutral-800 shadow-lg">
                          <img src={templateData.heroImageUrl} className="w-full h-full object-cover" alt="Hero" />
                        </div>
                      ) : (
                        <div className="aspect-video bg-neutral-900 rounded-xl border-2 border-dashed border-neutral-800 flex items-center justify-center text-neutral-700 uppercase font-bold text-xs tracking-widest"> Hero_Visual_Not_Set </div>
                      )}

                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-neutral-50 mb-3">{formValues.title || 'Draft_Codename'}</h1>
                        <p className="text-sm text-neutral-400 italic px-6">{templateData.summary || 'Summary_Null'}</p>
                      </div>

                      {templateData.affiliateEnabled && templateData.affiliateImageUrl && (
                        <div className="rounded-lg border border-red-500/20 shadow-md">
                           <img src={templateData.affiliateImageUrl} className="w-full h-auto rounded-lg" alt="Affiliate" />
                        </div>
                      )}

                      <div className="space-y-4">
                        <p className="text-sm text-neutral-300 leading-relaxed">{templateData.textBlockA || 'Data_Point_A'}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                           <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-[10px] text-sky-400 font-mono"> {templateData.tweetUrl ? `Twitter_Embed: ${templateData.tweetUrl.split('/').pop()}` : 'Tweet_Gap'} </div>
                           <p className="text-sm text-neutral-300 leading-relaxed">{templateData.textBlockB || 'Data_Point_B'}</p>
                        </div>

                        <p className="text-sm text-neutral-300 leading-relaxed">{templateData.textBlockC || 'Data_Point_C'}</p>
                      </div>

                      {(templateData.missionCalloutEnabled ?? templateData.patreonCtaEnabled) && (
                        <div className="bg-red-950/20 p-6 rounded-2xl border border-red-500/30 text-center">
                          <p className="text-xs font-bold text-neutral-50 mb-4 tracking-tight">Mission Funding Callout</p>
                          <div className="inline-block px-4 py-2 bg-red-600 text-white text-[10px] font-bold rounded uppercase">Secure_Contribution_Callout</div>
                        </div>
                      )}

                      <p className="text-sm text-neutral-300 leading-relaxed">{templateData.textBlockD || 'Data_Point_D'}</p>

                      {templateData.youtubeUrl && (
                        <div className="aspect-video bg-neutral-900 rounded-xl border border-red-500/50 flex items-center justify-center text-[10px] font-mono text-red-500 font-bold uppercase tracking-widest">
                           Video_Intelligence: {templateData.youtubeUrl.split('v=').pop()?.split('&')[0]}
                        </div>
                      )}

                      <p className="text-sm text-neutral-100 font-bold italic pt-6 border-t border-neutral-900">{templateData.closeoutText || 'Final_Transmission'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
};
