import React from 'react';
import { Helmet } from 'react-helmet-async';

interface HeadProps {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: string;
  canonicalUrl?: string;
  robots?: string;
}

import { useLocation } from 'react-router-dom';

export const Head: React.FC<HeadProps> = ({
  title,
  description,
  ogTitle,
  ogDescription,
  ogImage = 'https://proleadventures.com/images/og-default.jpg',
  ogUrl,
  twitterCard = 'summary_large_image',
  canonicalUrl,
  robots = 'index, follow',
}) => {
  const { pathname } = useLocation();
  const siteTitle = 'Prole Adventures';
  const baseUrl = 'https://proleadventures.com';
  
  const cleanTitle = title.trim();
  const fullTitle = ogTitle || (cleanTitle ? `${cleanTitle} | ${siteTitle}` : siteTitle);
  
  const fallbackDescription = 'A field guide to places where people can still make a life, based on on-the-ground reporting about cost, safety, access, atmosphere and everyday life.';
  const fullDescription = ogDescription || description || fallbackDescription;
  
  const normaliseUrl = (url: string) => {
    const withoutTrailingSlash = url.replace(/\/$/, '');
    return withoutTrailingSlash === baseUrl ? `${baseUrl}/` : withoutTrailingSlash;
  };
  const computedUrl = `${baseUrl}${pathname === '/' ? '/' : pathname}`;
  const currentUrl = normaliseUrl(canonicalUrl || ogUrl || computedUrl);
  const canonical = currentUrl;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />

      <link rel="canonical" href={canonical} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:locale" content="en_GB" />

      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content="@ProleAdventures" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={ogImage} />

      <meta name="robots" content={robots} />

      {/* Favicon */}
      <link rel="icon" type="image/webp" href="/images/logo-prole.webp" />

      {/* Umami Analytics */}
      <script defer src="https://cloud.umami.is/script.js" data-website-id="0b134b67-faa1-4e3d-82e3-cdfc96edcfec"></script>
    </Helmet>
  );
};
