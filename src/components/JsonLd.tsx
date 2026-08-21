import React from 'react';

interface OrganizationSchema {
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs?: string[];
}

interface ProductSchema {
  name: string;
  description: string;
  image: string;
  brand?: string;
  offers?: {
    price: string;
    priceCurrency: string;
    availability: string;
    hasMerchantReturnPolicy?: {
      applicableCountry: string;
      returnPolicyCategory: string;
      merchantReturnDays: number;
      returnMethod: string;
      returnFees: string;
    };
    shippingDetails?: {
      shippingDestination: {
        addressCountry: string;
      };
      shippingRate: {
        value: string;
        currency: string;
      };
      deliveryTime: {
        handlingTimeMin: number;
        handlingTimeMax: number;
        transitTimeMin: number;
        transitTimeMax: number;
      };
    };
  };
  aggregateRating?: {
    ratingValue: string;
    reviewCount: string;
  };
  review?: {
    author: string;
    ratingValue: string;
    reviewBody?: string;
  }[];
}

interface ArticleSchema {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: {
    name: string;
  };
  publisher: {
    name: string;
    logo: string;
  };
}

type SchemaType = 
  | { type: 'organization'; data: OrganizationSchema }
  | { type: 'product'; data: ProductSchema }
  | { type: 'article'; data: ArticleSchema };

export const JsonLd: React.FC<SchemaType> = ({ type, data }) => {
  const getSchema = () => {
    switch (type) {
      case 'organization':
        return {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: (data as OrganizationSchema).name,
          url: (data as OrganizationSchema).url,
          logo: (data as OrganizationSchema).logo,
          description: (data as OrganizationSchema).description,
          sameAs: (data as OrganizationSchema).sameAs || [],
        };
      case 'product':
        return {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: (data as ProductSchema).name,
          description: (data as ProductSchema).description,
          image: (data as ProductSchema).image,
          brand: (data as ProductSchema).brand ? {
            '@type': 'Brand',
            name: (data as ProductSchema).brand,
          } : undefined,
          offers: (data as ProductSchema).offers ? {
            '@type': 'Offer',
            price: (data as ProductSchema).offers?.price,
            priceCurrency: (data as ProductSchema).offers?.priceCurrency,
            availability: (data as ProductSchema).offers?.availability,
            hasMerchantReturnPolicy: (data as ProductSchema).offers?.hasMerchantReturnPolicy ? {
              '@type': 'MerchantReturnPolicy',
              applicableCountry: (data as ProductSchema).offers?.hasMerchantReturnPolicy?.applicableCountry,
              returnPolicyCategory: (data as ProductSchema).offers?.hasMerchantReturnPolicy?.returnPolicyCategory,
              merchantReturnDays: (data as ProductSchema).offers?.hasMerchantReturnPolicy?.merchantReturnDays,
              returnMethod: (data as ProductSchema).offers?.hasMerchantReturnPolicy?.returnMethod,
              returnFees: (data as ProductSchema).offers?.hasMerchantReturnPolicy?.returnFees,
            } : undefined,
            shippingDetails: (data as ProductSchema).offers?.shippingDetails ? {
              '@type': 'OfferShippingDetails',
              shippingDestination: {
                '@type': 'DefinedRegion',
                addressCountry: (data as ProductSchema).offers?.shippingDetails?.shippingDestination.addressCountry,
              },
              shippingRate: {
                '@type': 'MonetaryAmount',
                value: (data as ProductSchema).offers?.shippingDetails?.shippingRate.value,
                currency: (data as ProductSchema).offers?.shippingDetails?.shippingRate.currency,
              },
              deliveryTime: {
                '@type': 'ShippingDeliveryTime',
                handlingTime: {
                  '@type': 'QuantitativeValue',
                  minValue: (data as ProductSchema).offers?.shippingDetails?.deliveryTime.handlingTimeMin,
                  maxValue: (data as ProductSchema).offers?.shippingDetails?.deliveryTime.handlingTimeMax,
                  unitCode: 'DAY',
                },
                transitTime: {
                  '@type': 'QuantitativeValue',
                  minValue: (data as ProductSchema).offers?.shippingDetails?.deliveryTime.transitTimeMin,
                  maxValue: (data as ProductSchema).offers?.shippingDetails?.deliveryTime.transitTimeMax,
                  unitCode: 'DAY',
                },
              },
            } : undefined,
          } : undefined,
          aggregateRating: (data as ProductSchema).aggregateRating ? {
            '@type': 'AggregateRating',
            ratingValue: (data as ProductSchema).aggregateRating?.ratingValue,
            reviewCount: (data as ProductSchema).aggregateRating?.reviewCount,
          } : undefined,
          review: (data as ProductSchema).review ? (data as ProductSchema).review?.map(r => ({
            '@type': 'Review',
            reviewRating: {
              '@type': 'Rating',
              ratingValue: r.ratingValue,
            },
            author: {
              '@type': 'Person',
              name: r.author,
            },
            reviewBody: r.reviewBody,
          })) : undefined,
        };
      case 'article':
        return {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: (data as ArticleSchema).headline,
          description: (data as ArticleSchema).description,
          image: (data as ArticleSchema).image,
          datePublished: (data as ArticleSchema).datePublished,
          dateModified: (data as ArticleSchema).dateModified || (data as ArticleSchema).datePublished,
          author: {
            '@type': 'Person',
            name: (data as ArticleSchema).author.name,
          },
          publisher: {
            '@type': 'Organization',
            name: (data as ArticleSchema).publisher.name,
            logo: {
              '@type': 'ImageObject',
              url: (data as ArticleSchema).publisher.logo,
            },
          },
        };
      default:
        return null;
    }
  };

  const schema = getSchema();
  if (!schema) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
