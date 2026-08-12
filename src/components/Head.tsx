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
}) => {
  const { pathname } = useLocation();
  const siteTitle = 'Prole Adventures';
  const baseUrl = 'https://proleadventures.com';
  
  // Requirement: One format (without trailing slash) consistently
  const cleanTitle = title.trim();
  const fullTitle = ogTitle || (cleanTitle ? `${cleanTitle} | ${siteTitle}` : siteTitle);
  
  // Requirement: Default meta description fallback
  const fallbackDescription = "Prole Adventures — budget travel, social commentary, and life beyond the system. Real adventures, real talk.";
  const fullDescription = ogDescription || description || fallbackDescription;
  
  // Requirement: Full HTTPS URL (self-referencing canonical)
  // Ensure no trailing slash inconsistencies
  const computedUrl = `${baseUrl}${pathname === '/' ? '' : pathname}`;
  const currentUrl = (canonicalUrl || ogUrl || computedUrl).replace(/\/$/, "");
  const canonical = currentUrl;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />

      {/* Requirement: Task 1 - Canonical URL */}
      <link rel="canonical" href={canonical} />

      {/* Requirement: Task 3 - Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={siteTitle} />

      {/* Requirement: Task 4 - Twitter/X Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content="@ProleAdventures" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* Robots */}
      <meta name="robots" content="index, follow" />

      {/* Favicon */}
      <link rel="icon" type="image/webp" href="/images/logo-prole.webp" />

      {/* Umami Analytics */}
      <script defer src="https://cloud.umami.is/script.js" data-website-id="0b134b67-faa1-4e3d-82e3-cdfc96edcfec"></script>
    </Helmet>
  );
};
