import type { SEOSettings, PageSEO, ServicePrice } from './types';
import {
  DEFAULT_BUSINESS_SCHEMA,
  DEFAULT_SCHEMA_SETTINGS,
  getRouteOverride,
  normalizeSchemaSettings,
  validateJsonLd,
  type BusinessSchemaSettings,
  type JsonLdNode,
  type SchemaSettings,
} from './schema-settings';

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
const organizationId = `${BASE_URL}/#organization`;
const websiteId = `${BASE_URL}/#website`;
const businessId = `${BASE_URL}/#localbusiness`;

export function getSiteUrl(): string {
  return BASE_URL;
}

export function buildAbsoluteUrl(path: string): string {
  if (!path) return BASE_URL;
  if (path.startsWith('http')) {
    return LOCAL_ORIGIN_PATTERN.test(path) ? path.replace(LOCAL_ORIGIN_PATTERN, BASE_URL) : path;
  }
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

const canonicalPath = (path = '/') => {
  const cleaned = path.trim().split(/[?#]/)[0] || '/';
  const prefixed = cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
  return prefixed.length > 1 ? prefixed.replace(/\/+$/, '') : '/';
};

const absoluteUrl = (url?: string, fallbackPath = '') => buildAbsoluteUrl(url || fallbackPath);
const entityId = (path: string, fragment: string) => `${buildAbsoluteUrl(canonicalPath(path))}#${fragment}`;

function cleanJsonLdValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    const cleaned = value.map(cleanJsonLdValue).filter((item) => item !== undefined);
    return cleaned.length > 0 ? cleaned : undefined;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as JsonLdNode)
      .map(([key, item]) => [key, cleanJsonLdValue(item)] as const)
      .filter(([, item]) => item !== undefined);
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  if (value === null || value === undefined || Number.isNaN(value)) return undefined;
  return value;
}

export function sanitizeJsonLd<T extends JsonLdNode>(schema: T): T {
  return (cleanJsonLdValue(schema) || {}) as T;
}

export function serializeJsonLd(schema: JsonLdNode): string {
  return JSON.stringify(sanitizeJsonLd(schema)).replace(/</g, '\\u003c');
}

const businessSettings = (settings?: SchemaSettings) =>
  normalizeSchemaSettings(settings || DEFAULT_SCHEMA_SETTINGS).business;

export function buildOrganizationSchema(business: BusinessSchemaSettings = DEFAULT_BUSINESS_SCHEMA): JsonLdNode {
  return sanitizeJsonLd({
    '@type': 'Organization',
    '@id': organizationId,
    name: business.name,
    legalName: business.legalName,
    url: BASE_URL,
    logo: { '@type': 'ImageObject', '@id': `${BASE_URL}/#logo`, url: absoluteUrl(business.logo), width: 512, height: 512 },
    image: { '@id': `${BASE_URL}/#logo` },
    description: business.description,
    email: business.email,
    telephone: business.telephone,
    sameAs: business.sameAs,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: business.telephone,
      contactType: 'reservations',
      availableLanguage: ['Indonesian', 'English'],
      areaServed: 'ID',
    },
  });
}

export function buildWebSiteSchema(business: BusinessSchemaSettings = DEFAULT_BUSINESS_SCHEMA): JsonLdNode {
  return sanitizeJsonLd({
    '@type': 'WebSite',
    '@id': websiteId,
    name: business.name,
    url: BASE_URL,
    description: business.description,
    inLanguage: ['id-ID', 'en'],
    publisher: { '@id': organizationId },
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/appointment`,
        actionPlatform: ['https://schema.org/DesktopWebPlatform', 'https://schema.org/MobileWebPlatform'],
      },
      object: { '@type': 'Service', name: 'Home Massage and Spa Services', provider: { '@id': businessId } },
    },
  });
}

export function buildBusinessSchema(
  seo?: Partial<SEOSettings>,
  business: BusinessSchemaSettings = DEFAULT_BUSINESS_SCHEMA
): JsonLdNode {
  const types = business.businessTypes.length > 0 ? business.businessTypes : DEFAULT_BUSINESS_SCHEMA.businessTypes;
  return sanitizeJsonLd({
    '@type': types,
    '@id': businessId,
    name: business.name || seo?.siteTitle,
    description: business.description || seo?.siteDescription,
    url: BASE_URL,
    logo: { '@id': `${BASE_URL}/#logo` },
    image: [absoluteUrl(business.image || seo?.defaultOgImage, '/og-image.jpg')],
    telephone: business.telephone,
    email: business.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.streetAddress,
      addressLocality: business.addressLocality,
      addressRegion: business.addressRegion,
      postalCode: business.postalCode,
      addressCountry: business.addressCountry,
    },
    geo: business.latitude !== null && business.longitude !== null ? {
      '@type': 'GeoCoordinates', latitude: business.latitude, longitude: business.longitude,
    } : undefined,
    hasMap: business.googleMapsUrl,
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: business.opens,
      closes: business.closes,
    }],
    priceRange: business.priceRange,
    currenciesAccepted: business.currenciesAccepted,
    paymentAccepted: business.paymentAccepted.join(', '),
    areaServed: business.areaServed.map((name) => ({ '@type': 'AdministrativeArea', name })),
    sameAs: business.sameAs,
    parentOrganization: { '@id': organizationId },
  });
}

export function buildLocalBusinessSchema(): JsonLdNode {
  return buildBusinessSchema();
}

export interface ArticleSchemaData {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  category?: string;
  tags?: string[];
}

export function buildArticleSchema(article: ArticleSchemaData): JsonLdNode {
  const path = `/${article.slug}`;
  const url = buildAbsoluteUrl(path);
  return sanitizeJsonLd({
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: article.title,
    name: article.title,
    description: article.excerpt,
    url,
    mainEntityOfPage: { '@id': `${url}#webpage` },
    image: { '@type': 'ImageObject', url: absoluteUrl(article.coverImage, '/og-image.jpg'), width: 1200, height: 630 },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: { '@type': 'Person', name: article.author || 'Luxury Massage Bali Editorial Team' },
    publisher: { '@id': organizationId },
    articleSection: article.category,
    keywords: article.tags,
    inLanguage: 'id-ID',
    isPartOf: { '@id': websiteId },
  });
}

export interface ServiceSchemaData {
  name: string;
  slug: string;
  description: string;
  price?: number;
  imageUrl: string;
  duration?: string;
  category?: string;
  prices?: Array<Pick<ServicePrice, 'label' | 'duration_minutes' | 'price'>>;
}

export function buildServiceSchema(service: ServiceSchemaData): JsonLdNode {
  const path = `/services/${service.slug}`;
  const url = buildAbsoluteUrl(path);
  const priceOptions = service.prices?.filter((item) => item.price > 0) || [];
  const fallbackOffers = service.price && service.price > 0
    ? [{ label: service.duration || service.name, duration_minutes: null, price: service.price }]
    : [];
  const offers = (priceOptions.length > 0 ? priceOptions : fallbackOffers).map((item) => sanitizeJsonLd({
    '@type': 'Offer',
    name: `${service.name} — ${item.label || (item.duration_minutes ? `${item.duration_minutes} Minutes` : 'Treatment')}`,
    price: item.price,
    priceCurrency: 'IDR',
    availability: 'https://schema.org/InStock',
    url,
    eligibleRegion: { '@type': 'AdministrativeArea', name: 'Bali, Indonesia' },
    itemOffered: { '@id': `${url}#service` },
  }));

  return sanitizeJsonLd({
    '@type': 'Service',
    '@id': `${url}#service`,
    name: service.name,
    serviceType: service.category || 'Massage and wellness treatment',
    description: service.description,
    url,
    image: absoluteUrl(service.imageUrl, '/og-image.jpg'),
    provider: { '@id': businessId },
    areaServed: { '@type': 'AdministrativeArea', name: 'Bali, Indonesia' },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: `${BASE_URL}/appointment`,
      serviceLocation: { '@type': 'Place', name: 'Customer villa, hotel, apartment, or home in Bali' },
    },
    offers,
  });
}

export function buildBreadcrumbSchema(items: Array<{ name: string; url: string }>): JsonLdNode {
  const normalized = items.map((item) => ({ ...item, url: absoluteUrl(item.url) }));
  const pageUrl = normalized.at(-1)?.url || BASE_URL;
  return sanitizeJsonLd({
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: normalized.map((item, index) => ({
      '@type': 'ListItem', position: index + 1, name: item.name, item: item.url,
    })),
  });
}

export function buildFAQSchema(faqs: Array<{ question: string; answer: string }>, path = '/faq'): JsonLdNode {
  return sanitizeJsonLd({
    '@type': 'FAQPage',
    '@id': entityId(path, 'faq'),
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question', name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  });
}

export function buildPageSchema(
  page: PageSEO,
  pageType: 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage' = 'WebPage',
  breadcrumbId?: string
): JsonLdNode {
  const url = buildAbsoluteUrl(canonicalPath(page.path));
  return sanitizeJsonLd({
    '@type': pageType,
    '@id': `${url}#webpage`,
    url,
    name: page.title,
    description: page.description,
    isPartOf: { '@id': websiteId },
    about: { '@id': businessId },
    primaryImageOfPage: page.ogImage ? { '@type': 'ImageObject', url: absoluteUrl(page.ogImage) } : undefined,
    breadcrumb: breadcrumbId ? { '@id': breadcrumbId } : undefined,
    inLanguage: 'id-ID',
  });
}

export function buildItemListSchema(
  path: string,
  name: string,
  items: Array<{ name: string; url: string; image?: string }>
): JsonLdNode {
  const url = buildAbsoluteUrl(path);
  return sanitizeJsonLd({
    '@type': 'ItemList',
    '@id': `${url}#itemlist`,
    name,
    numberOfItems: items.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem', position: index + 1, url: absoluteUrl(item.url), name: item.name,
      image: item.image ? absoluteUrl(item.image) : undefined,
    })),
  });
}

const mergeNodes = (base: JsonLdNode[], additions: JsonLdNode[]) => {
  const result = [...base];
  additions.forEach((addition) => {
    const id = typeof addition['@id'] === 'string' ? addition['@id'] : undefined;
    const index = id ? result.findIndex((node) => node['@id'] === id) : -1;
    if (index >= 0) result[index] = sanitizeJsonLd({ ...result[index], ...addition });
    else result.push(addition);
  });
  return result;
};

function extractOverrideNodes(override: JsonLdNode): JsonLdNode[] {
  if (Array.isArray(override['@graph'])) {
    return override['@graph'].filter((item): item is JsonLdNode => Boolean(item) && typeof item === 'object' && !Array.isArray(item));
  }
  const { ['@context']: _context, ...node } = override;
  return [node];
}

export interface CompleteSchemaOptions {
  settings?: SchemaSettings;
  globalSEO?: Partial<SEOSettings>;
  pageSEO?: PageSEO;
  pageType?: 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage';
  articleData?: ArticleSchemaData;
  serviceData?: ServiceSchemaData;
  breadcrumbItems?: Array<{ name: string; url: string }>;
  faqData?: Array<{ question: string; answer: string }>;
  itemList?: { name: string; items: Array<{ name: string; url: string; image?: string }> };
  explicitOverride?: JsonLdNode;
}

export function buildCompleteSchema(options: CompleteSchemaOptions | Partial<SEOSettings> = {}): JsonLdNode {
  const isLegacyCall = !('settings' in options) && !('pageSEO' in options) && !('globalSEO' in options);
  const config = (isLegacyCall ? { globalSEO: options as Partial<SEOSettings> } : options) as CompleteSchemaOptions;
  const settings = normalizeSchemaSettings(config.settings || DEFAULT_SCHEMA_SETTINGS);
  const business = businessSettings(settings);
  const page = config.pageSEO || {
    path: '/', title: config.globalSEO?.siteTitle || business.name,
    description: config.globalSEO?.siteDescription || business.description,
    ogImage: config.globalSEO?.defaultOgImage || business.image,
  };
  const path = canonicalPath(page.path);
  const breadcrumbs = config.breadcrumbItems?.length
    ? config.breadcrumbItems
    : path === '/' ? [{ name: 'Home', url: '/' }] : [{ name: 'Home', url: '/' }, { name: page.title, url: path }];
  const breadcrumb = buildBreadcrumbSchema(breadcrumbs);
  const pageNode = buildPageSchema(page, config.pageType, breadcrumb['@id'] as string);

  let nodes: JsonLdNode[] = [
    buildOrganizationSchema(business),
    buildWebSiteSchema(business),
    buildBusinessSchema(config.globalSEO, business),
    pageNode,
    breadcrumb,
  ];
  if (config.articleData) nodes.push(buildArticleSchema(config.articleData));
  if (config.serviceData) nodes.push(buildServiceSchema(config.serviceData));
  if (config.faqData?.length) nodes.push(buildFAQSchema(config.faqData, path));
  if (config.itemList?.items.length) nodes.push(buildItemListSchema(path, config.itemList.name, config.itemList.items));

  const routeOverride = getRouteOverride(settings, path);
  if (routeOverride?.enabled && validateJsonLd(routeOverride.schema).length === 0) {
    const overrideNodes = extractOverrideNodes(routeOverride.schema);
    nodes = routeOverride.mode === 'replace' ? overrideNodes : mergeNodes(nodes, overrideNodes);
  }
  if (config.explicitOverride && validateJsonLd(config.explicitOverride).length === 0) {
    nodes = mergeNodes(nodes, extractOverrideNodes(config.explicitOverride));
  }

  return sanitizeJsonLd({ '@context': 'https://schema.org', '@graph': nodes });
}

export function buildMetaTags(pageSEO?: PageSEO, globalSEO?: Partial<SEOSettings>) {
  const business = DEFAULT_BUSINESS_SCHEMA;
  const title = pageSEO?.title || globalSEO?.siteTitle || 'Luxury Massage Bali — Premium Home Massage';
  const description = pageSEO?.description || globalSEO?.siteDescription || business.description;
  const image = absoluteUrl(pageSEO?.ogImage || globalSEO?.defaultOgImage, '/og-image.jpg');
  const path = pageSEO?.path || '';
  const url = path ? buildAbsoluteUrl(path) : BASE_URL;
  return {
    title, description,
    keywords: 'luxury massage bali, home massage bali, balinese massage, out call massage bali, facial bali, body treatment bali, couple massage bali',
    author: business.name,
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    canonical: url,
    og: { title, description, image, url, type: pageSEO ? 'website' : 'website', siteName: globalSEO?.ogSiteName || business.name },
    twitter: { card: globalSEO?.twitterCard || 'summary_large_image', title, description, image, site: globalSEO?.twitterHandle || undefined },
  };
}

export function generateRobotsTxt(sitemapUrl?: string) {
  return `# Luxury Massage Bali - robots.txt\nUser-agent: *\nAllow: /\n\nDisallow: /langitdewata/\n\nSitemap: ${sitemapUrl || `${BASE_URL}/sitemap.xml`}\n`;
}

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export function buildSitemap(urls: SitemapUrl[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url>\n    <loc>${absoluteUrl(url.loc)}</loc>\n    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}\n    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}\n    ${url.priority ? `<priority>${url.priority}</priority>` : ''}\n  </url>`).join('\n')}\n</urlset>`;
}

export const DEFAULT_SCHEMA = buildCompleteSchema();
