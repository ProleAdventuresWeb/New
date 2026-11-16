import React, { useEffect, useState } from 'react';
import { Calendar, Clock, ArrowRight, Search, XCircle, Lock } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Newsletter } from '../components/Newsletter';
import { Head } from '../components/Head';
import { getAllPosts, getPostsByCategory, getPostsByTagSlug } from '../lib/posts';
import type { PostPreview, PostCategory } from '../types/post';
import { BLOG_CATEGORIES } from '../config/categories';

export const StoriesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<PostPreview[] | null>(null);
  const [allPostsForCounts, setAllPostsForCounts] = useState<PostPreview[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const activeTag = searchParams.get('tag');

  // Fetch all posts once for counts and initial view
  useEffect(() => {
    const init = async () => {
      const data = await getAllPosts();
      setAllPostsForCounts(data);
    };
    init();
  }, []);

  // Main data fetcher based on category or tag
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      if (activeTag) {
        setSelectedCategory('tag'); // Special state for tag view
        const data = await getPostsByTagSlug(activeTag);
        setPosts(data);
      } else if (selectedCategory === 'all') {
        const data = await getAllPosts();
        setPosts(data);
      } else {
        // Find the category in our dynamic config
        const category = BLOG_CATEGORIES.find(c => c.id === selectedCategory);
        if (category) {
          const data = await getPostsByCategory(category.id as PostCategory);
          setPosts(data);
        }
      }
      setLoading(false);
    };
    
    fetchData();
  }, [selectedCategory, activeTag]);

  const handleCategoryChange = (categoryId: string) => {
    if (activeTag) {
      searchParams.delete('tag');
      setSearchParams(searchParams);
    }
    setSelectedCategory(categoryId);
    setSearchTerm(''); // Clear search when changing category for clean view
  };

  const categoriesList = [
    { id: 'all', name: 'All Stories', count: allPostsForCounts.length, icon: 'ðŸŒ' },
    ...BLOG_CATEGORIES.map(cat => ({
      id: cat.id,
      name: cat.name,
      count: allPostsForCounts.filter(s => s.category === cat.id).length,
      icon: cat.icon
    }))
  ];

  // Client-side filtration by Search Term
  const filteredPosts = posts?.filter(post => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      post.title.toLowerCase().includes(s) || 
      post.excerpt.toLowerCase().includes(s)
    );
  }) || [];

  const featuredPost = filteredPosts[0];
  const otherPosts = filteredPosts.slice(1);

  return (
    <div className="pt-16 min-h-screen bg-black">
      <Head 
        title={selectedCategory === 'all' ? 'Stories & Chronicles' : BLOG_CATEGORIES.find(c => c.id === selectedCategory)?.seoTitle || 'Stories'} 
        description={selectedCategory === 'all' 
          ? 'Read the latest authentic adventure stories and urban explorations from around the world.' 
          : BLOG_CATEGORIES.find(c => c.id === selectedCategory)?.description}
      />
      
      {/* Hero Header */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="font-display text-5xl md:text-7xl font-bold text-neutral-50 mb-6 uppercase tracking-tight">
              {selectedCategory === 'all' ? 'PROLE JOURNAL' : BLOG_CATEGORIES.find(c => c.id === selectedCategory)?.name}
            </h1>
            <p className="text-xl text-neutral-100 max-w-3xl mx-auto leading-relaxed">
              {selectedCategory === 'all' 
                ? 'Archive'
                : BLOG_CATEGORIES.find(c => c.id === selectedCategory)?.description}
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            {categoriesList.map(category => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2 ${selectedCategory === category.id && !activeTag
                    ? 'glass-elevated shadow-glass shadow-investigation text-neutral-50'
                    : 'glass-subtle shadow-glass shadow-investigation text-neutral-100 hover:glass-base'
                  }`}
              >
                <span className="text-lg">{category.icon}</span>
                <span>{category.name}</span>
                <span className="text-sm opacity-75">({category.count})</span>
              </button>
            ))}
          </div>

          {/* Search & Tag Indicator Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-1">
            <div className="relative w-full md:max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-red-400 transition-colors" />
              <input
                type="text"
                placeholder="Search titles or excerpts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-neutral-900/50 border border-neutral-800 focus:border-red-500/50 rounded-full text-neutral-100 outline-none transition-all duration-300 glass-subtle focus:glass-base shadow-glass"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {activeTag && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-950/30 border border-red-500/30 rounded-full text-red-100 text-sm">
                  <span>Trip: {activeTag.replace(/-/g, ' ')}</span>
                  <button onClick={() => { searchParams.delete('tag'); setSearchParams(searchParams); setSelectedCategory('all'); }}>
                    <XCircle className="w-4 h-4 hover:text-red-400 transition-colors" />
                  </button>
                </div>
              )}
              
              {!loading && (
                <div className="text-sm text-neutral-400 font-mono flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  Showing {filteredPosts.length} adventures
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        {loading ? (
          /* Loading Skeleton */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-12">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="glass-base rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-neutral-800" />
                <div className="p-6 space-y-4">
                  <div className="h-4 w-1/4 bg-neutral-700 rounded" />
                  <div className="h-6 w-3/4 bg-neutral-700 rounded" />
                  <div className="h-4 w-full bg-neutral-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          /* Empty State */
          <div className="py-20 text-center animate-in fade-in slide-in-from-bottom-4">
            <div className="max-w-md mx-auto glass-base p-12 rounded-3xl border border-neutral-800 shadow-glass">
              <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-neutral-600" />
              </div>
              <h2 className="text-xl font-bold text-neutral-50 mb-2">No stories found</h2>
              <p className="text-neutral-400 text-sm mb-8">
                {searchTerm 
                  ? `We couldn't find any matches for "${searchTerm}". Try different keywords.`
                  : "The archive is currently empty for this specific filter."}
              </p>
              <button 
                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); searchParams.delete('tag'); setSearchParams(searchParams); }}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all duration-300"
              >
                Clear all filters
              </button>
            </div>
          </div>
        ) : (
          /* Results Display */
          <>
            {/* Featured Story (only show when no specific search is active or if it's the top result) */}
            {featuredPost && (
              <section className="py-12 animate-in fade-in duration-500">
                <h2 className="font-display text-3xl font-bold text-neutral-50 mb-8 flex items-center gap-3">
                  <span className="w-8 h-px bg-red-500"></span>
                  {searchTerm ? 'Top Result' : 'Featured'}
                </h2>

                <Link 
                  to={`/read/${featuredPost.slug}`}
                  className="block glass-base shadow-glass shadow-investigation rounded-2xl overflow-hidden hover:glass-elevated transition-all duration-300 group"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="aspect-video lg:aspect-square overflow-hidden">
                      <img
                        src={featuredPost.cover_image_url}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        width="600"
                        height="600"
                      />
                    </div>

                    <div className="p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-md text-sm font-medium uppercase tracking-wide inline-block">
                          {featuredPost.category.replace(/-/g, ' ')}
                        </span>
                        {featuredPost.is_gated && (
                          <span className="px-2.5 py-1 bg-amber-950/40 text-amber-400 border border-amber-500/30 rounded-md text-xs font-mono uppercase tracking-wider flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Classified
                          </span>
                        )}
                        <span className="text-neutral-500 text-sm font-mono">{featuredPost.read_time} MIN</span>
                      </div>

                      <h3 className="font-display text-2xl lg:text-3xl font-bold text-neutral-50 mb-4 group-hover:text-red-400 transition-colors">
                        {featuredPost.title}
                      </h3>

                      <p className="text-neutral-50 text-lg leading-relaxed mb-6 line-clamp-3">
                        {featuredPost.excerpt}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-neutral-400 text-sm">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {featuredPost.published_at 
                              ? new Date(featuredPost.published_at).toLocaleDateString()
                              : 'Recent'}
                          </div>
                        </div>

                        <div className="inline-flex items-center text-red-400 font-medium">
                          Inspect Entry
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </section>
            )}

            {/* Sub-grid (More Stories) */}
            {otherPosts.length > 0 && (
              <section className="py-12 animate-in fade-in duration-700">
                <h2 className="font-display text-3xl font-bold text-neutral-50 mb-8 flex items-center gap-3">
                  <span className="w-8 h-px bg-neutral-800"></span>
                  {searchTerm ? 'Additional Matches' : 'Archive Highlights'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {otherPosts.map(post => (
                    <Link
                      key={post.id}
                      to={`/read/${post.slug}`}
                      className="glass-elevated shadow-glass shadow-investigation rounded-2xl overflow-hidden hover:glass-elevated transition-all duration-300 transform hover:scale-105 group backdrop-blur-xl"
                    >
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={post.cover_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                          width="400"
                          height="225"
                        />
                      </div>

                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[10px] font-bold uppercase tracking-widest">
                              {post.category.replace(/-/g, ' ')}
                            </span>
                            {post.is_gated && (
                              <span className="px-1.5 py-0.5 bg-amber-950/40 text-amber-400 border border-amber-500/30 rounded text-[9px] font-mono uppercase tracking-tighter flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> Gated
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-neutral-500 font-mono tracking-tighter flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {post.read_time}M
                          </span>
                        </div>

                        <h3 className="font-semibold text-xl text-neutral-50 mb-3 group-hover:text-red-400 transition-colors">
                          {post.title}
                        </h3>

                        <p className="text-neutral-400 text-sm leading-relaxed mb-4 line-clamp-2">
                          {post.excerpt}
                        </p>

                        <div className="flex items-center justify-between text-neutral-500 text-xs mt-auto pt-4 border-t border-neutral-800/50">
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {post.published_at 
                              ? new Date(post.published_at).toLocaleDateString()
                              : 'Entry'}
                          </div>
                          <div className="text-red-500 font-mono group-hover:underline">
                            GOTO_
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Newsletter Signup */}
      <section className="py-12 px-4 border-t border-neutral-900 bg-neutral-950/20">
        <Newsletter title="Stay Connected" subtitle="Subscribe to receive the latest adventure stories and updates" />
      </section>
    </div>
  );
};