import { supabase } from './supabase';
import type { Post, PostPreview, PostCategory } from '../types/post';

const POST_PREVIEW_SELECT = 'id, slug, title, excerpt, category, cover_image_url, read_time, published_at, layout';

/**
 * Fetches all published posts for catalog display.
 */
export async function getAllPosts(): Promise<PostPreview[]> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(POST_PREVIEW_SELECT)
      .eq('published', true)
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching all posts:', error.message);
      return [];
    }

    return (data as PostPreview[]) || [];
  } catch (err) {
    console.error('Unexpected error fetching all posts:', err);
    return [];
  }
}

/**
 * Fetches published posts within a specific category.
 */
export async function getPostsByCategory(category: PostCategory): Promise<PostPreview[]> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(POST_PREVIEW_SELECT)
      .eq('published', true)
      .eq('category', category)
      .order('published_at', { ascending: false });

    if (error) {
      console.error(`Error fetching posts in category ${category}:`, error.message);
      return [];
    }

    return (data as PostPreview[]) || [];
  } catch (err) {
    console.error(`Unexpected error fetching posts in category ${category}:`, err);
    return [];
  }
}

/**
 * Fetches a single post by its URL-safe slug.
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error(`Error fetching post with slug ${slug}:`, error.message);
      return null;
    }

    return (data as Post) || null;
  } catch (err) {
    console.error(`Unexpected error fetching post with slug ${slug}:`, err);
    return null;
  }
}

/**
 * Fetches a limited list of the most recent published posts.
 */
export async function getRecentPosts(limit: number = 3): Promise<PostPreview[]> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(POST_PREVIEW_SELECT)
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent posts:', error.message);
      return [];
    }

    return (data as PostPreview[]) || [];
  } catch (err) {
    console.error('Unexpected error fetching recent posts:', err);
    return [];
  }
}

/**
 * Fetches all posts (drafts and published) for admin management.
 */
export async function getAllPostsAdmin(): Promise<Post[]> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin posts:', error.message);
      return [];
    }

    return (data as Post[]) || [];
  } catch (err) {
    console.error('Unexpected error fetching admin posts:', err);
    return [];
  }
}

/**
 * Creates a new post record.
 */
export async function createPost(
  post: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'published_at'>
): Promise<Post | null> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        ...post,
        layout: post.layout || 'template'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating post:', error.message);
      return null;
    }

    return (data as Post) || null;
  } catch (err) {
    console.error('Unexpected error creating post:', err);
    return null;
  }
}

/**
 * Updates an existing post identified by slug.
 */
export async function updatePost(
  slug: string,
  updates: Partial<Omit<Post, 'id' | 'created_at' | 'updated_at'>>
): Promise<Post | null> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('slug', slug)
      .select()
      .single();

    if (error) {
      console.error(`Error updating post ${slug}:`, error.message);
      return null;
    }

    return (data as Post) || null;
  } catch (err) {
    console.error(`Unexpected error updating post ${slug}:`, err);
    return null;
  }
}

/**
 * Deletes a post identified by slug.
 */
export async function deletePost(slug: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('slug', slug);

    if (error) {
      console.error(`Error deleting post ${slug}:`, error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`Unexpected error deleting post ${slug}:`, err);
    return false;
  }
}

/**
 * Fetches all published posts associated with a specific tag slug.
 */
export async function getPostsByTagSlug(tagSlug: string): Promise<PostPreview[]> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, slug, title, excerpt, category, cover_image_url, read_time, published_at, layout,
        post_tags!inner(tag_id),
        tags!inner(slug)
      `)
      .eq('published', true)
      .eq('tags.slug', tagSlug)
      .order('published_at', { ascending: false });

    if (error) {
      console.error(`Error fetching posts by tag ${tagSlug}:`, error.message);
      return [];
    }

    return (data as unknown as PostPreview[]) || [];
  } catch (err) {
    console.error(`Unexpected error fetching posts by tag ${tagSlug}:`, err);
    return [];
  }
}
/**
 * Fetches the next and previous posts relative to the current one.
 */
export async function getAdjacentPosts(publishedAt: string): Promise<{ next: PostPreview | null; prev: PostPreview | null }> {
  try {
    // Next post (more recent)
    const { data: nextData } = await supabase
      .from('posts')
      .select(POST_PREVIEW_SELECT)
      .eq('published', true)
      .gt('published_at', publishedAt)
      .order('published_at', { ascending: true })
      .limit(1)
      .single();

    // Previous post (older)
    const { data: prevData } = await supabase
      .from('posts')
      .select(POST_PREVIEW_SELECT)
      .eq('published', true)
      .lt('published_at', publishedAt)
      .order('published_at', { ascending: false })
      .limit(1)
      .single();

    return {
      next: (nextData as PostPreview) || null,
      prev: (prevData as PostPreview) || null
    };
  } catch (err) {
    console.error('Error fetching adjacent posts:', err);
    return { next: null, prev: null };
  }
}
