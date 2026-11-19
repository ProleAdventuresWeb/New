import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define the root for file operations
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Basic character escaping for XML
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return c;
    }
  });
}

// Format date in RFC1123 / GMT format
function toRfc1123(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toUTCString();
}

async function generateRss() {
  console.log('--- RSS GENESIS INITIATED ---');

  // Load environment variables
  // In Node, we use process.env.
  // Note: Vite's VITE_ variables are often accessible here during build depending on the environment.
  const siteUrl = process.env.RSS_SITE_URL || 'https://proleadventures.example';
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('CRITICAL ERROR: Supabase configuration missing from environment.');
    console.error('Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`Connecting to archive: ${supabaseUrl}`);

  // Fetch published posts
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, slug, title, excerpt, published_at')
    .eq('published', true)
    .order('published_at', { ascending: false });

  if (error) {
    console.warn('Warning: Could not retrieve chronicles from archive during build:', error.message);
    console.warn('Proceeding with empty RSS feed generation.');
  }

  const items = posts || [];
  console.log(`Retrieved ${items.length} chronicles for the feed.`);

  const lastBuildDate = new Date().toUTCString();

  // Construct RSS 2.0 XML
  let rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Prole Adventures</title>
    <link>${siteUrl}</link>
    <description>Things that happened: adventures, trips, and investigations from Prole Adventures.</description>
    <language>en-gb</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
`;

  for (const post of items) {
    if (!post.published_at) continue;

    const postUrl = `${siteUrl}/stories/${post.slug}`;
    const pubDate = toRfc1123(post.published_at);
    
    rssXml += `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${post.excerpt}]]></description>
    </item>`;
  }

  rssXml += `
  </channel>
</rss>`;

  // Write to public/rss.xml
  const outputPath = path.join(PROJECT_ROOT, 'public', 'rss.xml');
  
  // Ensure public directory exists
  const publicDir = path.dirname(outputPath);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, rssXml, 'utf8');
  
  console.log(`SUCCESS: Feed archived at ${outputPath}`);
  console.log('--- RSS GENESIS COMPLETE ---');
}

generateRss().catch(err => {
  console.error('Unexpected failure during RSS genesis:', err);
  process.exit(1);
});
