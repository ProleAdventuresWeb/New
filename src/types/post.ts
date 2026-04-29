export type PostCategory = 'escape' | 'prolenomics' | 'decline' | 'freedom' | 'dispatches';

export type PostLayout = 'template' | 'markdown';

export interface TemplateData {
  heroImageUrl: string;
  summary: string;
  affiliateEnabled: boolean;
  affiliateImageUrl: string | null;
  textBlockA: string;
  tweetUrl: string | null;
  textBlockB: string;
  textBlockC: string;
  patreonCtaEnabled: boolean;
  patreonUrl: string | null;
  textBlockD: string;
  youtubeUrl: string | null;
  closeoutText: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: PostCategory;
  cover_image_url: string;
  read_time: number;
  published: boolean;
  published_at: string | null;
  layout: PostLayout;
  template_data: TemplateData | null;
  created_at: string;
  updated_at: string;
}

export type PostPreview = Pick<
  Post,
  | 'id'
  | 'slug'
  | 'title'
  | 'excerpt'
  | 'category'
  | 'cover_image_url'
  | 'read_time'
  | 'published_at'
  | 'layout'
>;
