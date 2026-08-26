// ============================================
// SEO UTILITIES - Schema Markup Builders
// ============================================

import type { SEOSettings, PageSEO } from './types';

const PRODUCTION_URL = 'https://luxurymassagebali.com';
const LOCAL_HOSTNAME_PATTERN = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i;
const LOCAL_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i;

const normalizeSiteUrl = (value?: string) => {
  if (!value) return PRODUCTION_URL;

  try {
    const parsed = new URL(value);
    if (LOCAL_HOSTNAME_PATTERN.test(parsed.host)) return PRODUCTION_URL;
    return parsed.origin.replace(/\/$/, '');
  } catch {
    const cleaned = value.replace(/\/$/, '');
    return LOCAL_ORIGIN_PATTERN.test(cleaned) ? PRODUCTION_URL : cleaned || PRODUCTION_URL;
  }
};

const BASE_URL = normalizeSiteUrl(import.meta.env.VITE_SITE_URL);

/** Get the site URL - always returns production URL in SSR/schema contexts */
export function getSiteUrl(): string {
  return BASE_URL;
}

/** Build absolute URL for a path - replaces localhost with production URL */
export function buildAbsoluteUrl(path: string): string {
  if (path.startsWith('http')) {
    // If it's a full URL, normalize it
    if (LOCAL_ORIGIN_PATTERN.test(path)) {
      return path.replace(LOCAL_ORIGIN_PATTERN, BASE_URL);
    }
    return path;
  }
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

const BUSINESS = {
  name: 'Luxury Massage Bali',
  description: 'Premium home massage and wellness service delivered to villas, hotels, apartments, and homes across Bali.',
  phoneDisplay: '+62 813 5368 1757',
  phoneSchema: '+6281353681757',
  email: 'hello@luxurymassagebali.com',
  streetAddress: 'Perdana Kampial Cluster, Perdana VI No.3',
  locality: 'Nusa Dua',
  region: 'Bali',
  country: 'ID',
  countryName: 'Indonesia',
  addressText: 'Perdana Kampial Cluster, Perdana VI No.3, Nusa Dua, Bali - Indonesia',
  latitude: -8.8039,
  longitude: 115.2149,
  whatsapp: 'https://wa.me/6281353681757',
};

const absoluteUrl = (url?: string, fallbackPath = '') => {
  if (!url) return `${BASE_URL}${fallbackPath}`;
  if (LOCAL_ORIGIN_PATTERN.test(url)) {
    return url.replace(LOCAL_ORIGIN_PATTERN, BASE_URL);
  }
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
};

const organizationId = `${BASE_URL}/#organization`;
const websiteId = `${BASE_URL}/#website`;
const businessId = `${BASE_URL}/#localbusiness`;

export function buildBusinessSchema(settings?: Partial<SEOSettings>) {
  return {
    '@type': ['HealthAndBeautyBusiness', 'LocalBusiness'],
    '@id': businessId,
    name: settings?.siteTitle || BUSINESS.name,
    url: BASE_URL,
    logo: absoluteUrl(settings?.defaultOgImage, '/logo.png'),
    image: [absoluteUrl(settings?.defaultOgImage, '/og-image.jpg')],
    description: settings?.siteDescription || BUSINESS.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.streetAddress,
      addressLocality: BUSINESS.locality,
      addressRegion: BUSINESS.region,
      addressCountry: BUSINESS.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: BUSINESS.latitude,
      longitude: BUSINESS.longitude,
    },
    telephone: BUSINESS.phoneSchema,
    email: BUSINESS.email,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '09:00',
        closes: '21:00',
      },
    ],
    priceRange: '$$',
    sameAs: [BUSINESS.whatsapp],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Luxury Massage Bali Treatment Menu',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Massage', url: `${BASE_URL}/massage` } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Facial', url: `${BASE_URL}/facial` } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Body Treatment', url: `${BASE_URL}/body-treatment` } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Spa Package', url: `${BASE_URL}/spa-package` } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Couple Package', url: `${BASE_URL}/couple-package` } },
      ],
    },
  };
}

export function buildLocalBusinessSchema() {
  return buildBusinessSchema();
}

export function buildArticleSchema(article: {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    url: `${BASE_URL}/blog/${article.slug}`,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: { '@type': 'Person', name: article.author, url: BASE_URL },
    publisher: { '@id': organizationId },
    image: { '@type': 'ImageObject', url: absoluteUrl(article.coverImage), width: 1200, height: 630 },
    description: article.excerpt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}/blog/${article.slug}` },
  };
}

export function buildServiceSchema(service: {
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string;
  duration?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${BASE_URL}/services/${service.slug}#service`,
    name: service.name,
    description: service.description,
    url: `${BASE_URL}/services/${service.slug}`,
    image: absoluteUrl(service.imageUrl),
    provider: { '@id': businessId },
    areaServed: { '@type': 'AdministrativeArea', name: 'Bali, Indonesia' },
    offers: {
      '@type': 'Offer',
      price: service.price,
      priceCurrency: 'IDR',
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: 'https://schema.org/InStock',
      url: `${BASE_URL}/services/${service.slug}`,
    },
  };
}

export function buildBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

export function buildFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

export function buildOrganizationSchema() {
  return {
    '@type': 'Organization',
    '@id': organizationId,
    name: BUSINESS.name,
    url: BASE_URL,
    logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png`, width: 512, height: 512 },
    description: BUSINESS.description,
    foundingDate: '2020',
    sameAs: [BUSINESS.whatsapp],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: BUSINESS.phoneSchema,
      contactType: 'customer service',
      availableLanguage: ['Indonesian', 'English'],
      areaServed: BUSINESS.country,
    },
  };
}

export function buildWebSiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': websiteId,
    name: BUSINESS.name,
    url: BASE_URL,
    description: BUSINESS.description,
    publisher: { '@id': organizationId },
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/appointment`,
        actionPlatform: ['https://schema.org/DesktopWebPlatform', 'https://schema.org/MobileWebPlatform'],
      },
      object: { '@type': 'Service', name: 'Spa Services', provider: { '@id': businessId } },
    },
  };
}

export function buildVideoSchema(video: { url: string; title: string; description: string; thumbnail: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.description,
    thumbnailUrl: absoluteUrl(video.thumbnail),
    uploadDate: new Date().toISOString(),
    contentUrl: absoluteUrl(video.url),
    embedUrl: absoluteUrl(video.url),
    duration: 'PT30S',
    width: 1920,
    height: 1080,
  };
}

export function buildCompleteSchema(settings?: Partial<SEOSettings>) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildOrganizationSchema(),
      buildWebSiteSchema(),
      buildBusinessSchema(settings),
    ],
  };
}

export function buildMetaTags(pageSEO?: PageSEO, globalSEO?: Partial<SEOSettings>) {
  const title = pageSEO?.title || globalSEO?.siteTitle || 'Luxury Massage Bali — Premium Home Massage';
  const description = pageSEO?.description || globalSEO?.siteDescription || BUSINESS.description;
  const image = absoluteUrl(pageSEO?.ogImage || globalSEO?.defaultOgImage, '/og-image.jpg');
  const path = pageSEO?.path || '';
  const url = path ? `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}` : BASE_URL;

  return {
    title,
    description,
    keywords: 'luxury massage bali, home massage bali, balinese massage, out call massage bali, facial bali, body treatment bali, couple massage bali',
    author: BUSINESS.name,
    robots: 'index, follow',
    canonical: url,
    og: { title, description, image, url, type: 'website', siteName: globalSEO?.ogSiteName || BUSINESS.name },
    twitter: { card: globalSEO?.twitterCard || 'summary_large_image', title, description, image, site: globalSEO?.twitterHandle || undefined },
  };
}

export function generateRobotsTxt(sitemapUrl?: string) {
  return `# Luxury Massage Bali - robots.txt
User-agent: *
Allow: /

# Disallow admin
Disallow: /langitdewata/

# Sitemap
Sitemap: ${sitemapUrl || `${BASE_URL}/sitemap.xml`}
`;
}

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export function buildSitemap(urls: SitemapUrl[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
      .map(
        (url) => `  <url>
    <loc>${absoluteUrl(url.loc)}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`
      )
      .join('\n')}
</urlset>`;
}

export const DEFAULT_SCHEMA = buildCompleteSchema();
