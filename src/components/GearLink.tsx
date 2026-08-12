import React from 'react';
import { ArrowRight, ExternalLink } from 'lucide-react';

export interface GearLinkProps {
  /** Target destination URL (affiliate or standard) */
  url?: string;
  /** Primary affiliate link URL */
  affiliateUrl?: string;
  /** Legacy JSON field fallback for affiliate links */
  affiliate_link?: string;
  /** Non-affiliate external resource URL */
  externalUrl?: string;
  /** Explicit override flag to force affiliate or non-affiliate mode */
  isAffiliate?: boolean;
  /** Item name for analytics tracking */
  itemName?: string;
  /** Custom CSS classes */
  className?: string;
  /** Custom button text or icon children */
  children?: React.ReactNode;
}

/**
 * GearLink Component
 * Automatically applies Google SEO compliant `rel="sponsored noopener noreferrer"`
 * for affiliate links, and `rel="noopener noreferrer"` for standard external links.
 */
export const GearLink: React.FC<GearLinkProps> = ({
  url,
  affiliateUrl,
  affiliate_link,
  externalUrl,
  isAffiliate,
  itemName = 'gear_item',
  className,
  children,
}) => {
  // Determine canonical destination URL
  const targetUrl = affiliateUrl || affiliate_link || url || externalUrl;

  if (!targetUrl) return null;

  // Determine if link is sponsored/affiliate
  const isAffiliateLink =
    isAffiliate !== undefined
      ? isAffiliate
      : Boolean(affiliateUrl || affiliate_link || (url && !externalUrl));

  // Enforce Google SEO & security link attributes
  const relAttribute = isAffiliateLink
    ? 'sponsored noopener noreferrer'
    : 'noopener noreferrer';

  const defaultClasses = `
    w-full py-4 px-6 rounded-xl flex items-center justify-center gap-3
    bg-neutral-900 border border-red-500/20 text-red-400 font-bold
    hover:bg-red-600 hover:text-white hover:border-red-600
    transition-all duration-300 transform hover:scale-[1.02]
  `;

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel={relAttribute}
      data-umami-event={isAffiliateLink ? 'affiliate_click' : 'external_link_click'}
      data-umami-event-item={itemName}
      className={className || defaultClasses}
    >
      {children || (
        <>
          {isAffiliateLink ? 'INVESTIGATE GEAR' : 'LEARN MORE'}
          {isAffiliateLink ? <ArrowRight className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
        </>
      )}
    </a>
  );
};
