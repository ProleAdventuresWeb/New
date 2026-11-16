import React from 'react';
import { Camera, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Newsletter } from '../components/Newsletter';
import { Head } from '../components/Head';
import { JsonLd } from '../components/JsonLd';
import { getRecentPosts } from '../lib/posts';
import type { PostPreview } from '../types/post';

export const HomePage: React.FC = () => {
  const [posts, setPosts] = React.useState<PostPreview[] | null>(null);

  React.useEffect(() => {
    getRecentPosts(3).then(setPosts);
  }, []);

  const schemaData = {
    name: "Prole Adventures",
    url: "https://proleadventures.com",
    logo: "https://proleadventures.com/images/hero-logo.webp",
    description: "Exploring what's left of freedom through unfiltered perspective on ordinary life.",
    sameAs: [
      "https://www.youtube.com/@ProleAdventures"
    ]
  };

  return (
    <div className="pt-0">
      <Head
        title="Home"
        description="Exploring what's left of freedom through unfiltered perspective on ordinary life. Authentic adventures, urban exploration, and gear testing."
      />
      <JsonLd type="organization" data={schemaData} />
      {/* Hero Section */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: 'url(/images/prole_adventures_home_hero.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
        role="banner"
        aria-label="Hero section"
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="sr-only">Prole Adventures</h1>
          <img
            src="/images/hero-logo.webp"
            alt="Prole Adventures Logo"
            className="w-full max-w-md mx-auto h-auto"
            width="400"
            height="200"
            loading="eager"
            fetchPriority="high"
          />
        </div>
      </section>

      {/* Adventures Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-5xl md:text-7xl font-bold text-neutral-50 mb-6 uppercase tracking-tight">
              ADVENTURES
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts === null ? (
              // Loading Skeleton
              [1, 2, 3].map((n) => (
                <div key={n} className="glass-base rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-video bg-neutral-800" />
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between">
                      <div className="h-3 w-20 bg-neutral-700 rounded" />
                      <div className="h-3 w-16 bg-neutral-700 rounded" />
                    </div>
                    <div className="h-6 w-3/4 bg-neutral-700 rounded" />
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-neutral-700 rounded" />
                      <div className="h-3 w-5/6 bg-neutral-700 rounded" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/read/${post.slug}`}
                  className="group glass-base rounded-2xl overflow-hidden hover:glass-elevated transition-all duration-300 transform hover:scale-105 shadow-glass shadow-investigation"
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                      width="400"
                      height="225"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-red-400 font-medium uppercase tracking-wide">
                        {post.category.replace('-', ' ')}
                      </span>
                      <span className="text-xs text-neutral-300">
                        {post.published_at 
                          ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                          : 'Pending'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-xl text-neutral-50 mb-3 group-hover:text-red-400 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-neutral-100 text-sm leading-relaxed line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="mt-4 text-xs text-neutral-400 uppercase tracking-tighter">
                      {post.read_time} min read
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/stories"
              className="inline-flex items-center px-8 py-4 glass-subtle hover:glass-base text-neutral-100 hover:text-neutral-50 rounded-xl font-medium uppercase transition-all duration-300 shadow-glass shadow-investigation"
            >
              EXPLORE
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* YouTube Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="">
            <div className="text-center mb-12">
              <h2 className="font-display text-5xl md:text-7xl font-bold text-neutral-50 mb-6 uppercase tracking-tight">
                LATEST VIDEOS
              </h2>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
              {[1, 2, 3].map((num) => (
                <div key={num} className="glass-elevated shadow-glass shadow-investigation rounded-xl overflow-hidden relative group border border-red-500/30">
                  {/* CRT Overlay */}
                  <div className="absolute inset-0 pointer-events-none z-20 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjIiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')] mix-blend-overlay"></div>

                  {/* Scanline Animation */}
                  <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                    <div className="w-full h-8 bg-gradient-to-b from-transparent via-red-500/10 to-transparent opacity-50"></div>
                  </div>

                  {/* Header / Feed Info */}
                  <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-center z-10 bg-black/80 backdrop-blur-sm border-b border-red-500/20">
                    <span className="font-mono text-xs text-red-500 flex items-center drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
                      REC // CAM-0{num}
                    </span>
                    <span className="font-mono text-xs text-neutral-500">
                      SYS_SECURE
                    </span>
                  </div>

                  {/* Camera Feed Area */}
                  <div className="aspect-video mt-10 bg-neutral-900 flex flex-col items-center justify-center relative">
                    <div className="absolute inset-0 bg-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.8)] transform group-hover:scale-110 transition-transform duration-300">
                        <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[14px] border-l-white border-b-8 border-b-transparent ml-1"></div>
                      </div>
                    </div>

                    <Camera className="w-12 h-12 text-neutral-700 group-hover:opacity-0 transition-opacity duration-300 z-10" />
                  </div>

                  {/* Footer Info */}
                  <div className="p-5 bg-black/90 border-t border-red-500/20 relative z-10 flex flex-col items-center">
                    <h3 className="font-display font-medium text-lg text-neutral-300 group-hover:text-red-400 mb-1 text-center uppercase tracking-wider transition-colors">
                      Video Placeholder {num}
                    </h3>
                    <p className="text-red-500/70 text-xs font-mono text-center uppercase">
                      &gt; Signal lost_
                    </p>
                  </div>

                  {/* Corner Brackets */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500/50 z-30 pointer-events-none"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500/50 z-30 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500/50 z-30 pointer-events-none"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500/50 z-30 pointer-events-none"></div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <a
                href="https://www.youtube.com/@ProleAdventures"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 glass-subtle hover:glass-base text-neutral-100 hover:text-neutral-50 rounded-xl font-medium transition-all duration-300 shadow-glass shadow-investigation"
              >
                <Camera className="w-5 h-5 mr-2" />
                Youtube
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup Section */}
      <section className="py-20 px-4 bg-black">
        <Newsletter />
      </section>
    </div>
  );
};