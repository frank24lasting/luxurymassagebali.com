import { Helmet } from 'react-helmet-async';
import {
  buildBreadcrumbSchema,
  buildCompleteSchema,
  buildMetaTags,
  serializeJsonLd,
  type ArticleSchemaData,
  type ServiceSchemaData,
} from '@/lib/seo';
import { useSchemaSettings, type JsonLdNode } from '@/lib/schema-settings';
import type { SEOSettings, PageSEO } from '@/lib/types';

interface SEOHeadProps {
  pageSEO?: PageSEO;
  globalSEO?: Partial<SEOSettings>;
  schemaType?: 'default' | 'article' | 'service';
  pageType?: 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage';
  articleData?: ArticleSchemaData;
  serviceData?: ServiceSchemaData;
  breadcrumbItems?: Array<{ name: string; url: string }>;
  faqData?: Array<{ question: string; answer: string }>;
  itemList?: { name: string; items: Array<{ name: string; url: string; image?: string }> };
  schemaOverride?: JsonLdNode;
}

export function SEOHead({
  pageSEO,
  globalSEO,
  schemaType = 'default',
  pageType,
  articleData,
  serviceData,
  breadcrumbItems,
  faqData,
  itemList,
  schemaOverride,
}: SEOHeadProps) {
  const meta = buildMetaTags(pageSEO, globalSEO);
  const { data: schemaSettings } = useSchemaSettings();
  const effectivePageSEO = pageSEO || {
    path: '/',
    title: meta.title,
    description: meta.description,
    ogImage: meta.og.image,
  };
  const resolvedPageType = pageType || (itemList ? 'CollectionPage' : 'WebPage');
  const schema = buildCompleteSchema({
    settings: schemaSettings,
    globalSEO,
    pageSEO: effectivePageSEO,
    pageType: resolvedPageType,
    articleData: schemaType === 'article' ? articleData : undefined,
    serviceData: schemaType === 'service' ? serviceData : undefined,
    breadcrumbItems,
    faqData,
    itemList,
    explicitOverride: schemaOverride,
  });

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta name="keywords" content={meta.keywords} />
      <meta name="author" content={meta.author} />
      <meta name="robots" content={meta.robots} />
      <link rel="canonical" href={meta.canonical} />
      <meta name="googlebot" content={meta.robots} />
      <meta name="bingbot" content={meta.robots} />

      <meta property="og:title" content={meta.og.title} />
      <meta property="og:description" content={meta.og.description} />
      <meta property="og:image" content={meta.og.image} />
      <meta property="og:image:secure_url" content={meta.og.image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={meta.og.title} />
      <meta property="og:url" content={meta.og.url} />
      <meta property="og:type" content={schemaType === 'article' ? 'article' : meta.og.type} />
      <meta property="og:site_name" content={meta.og.siteName} />
      <meta property="og:locale" content="id_ID" />

      <meta name="twitter:card" content={meta.twitter.card} />
      <meta name="twitter:title" content={meta.twitter.title} />
      <meta name="twitter:description" content={meta.twitter.description} />
      <meta name="twitter:image" content={meta.twitter.image} />
      <meta name="twitter:image:alt" content={meta.twitter.title} />
      {meta.twitter.site && <meta name="twitter:site" content={meta.twitter.site} />}

      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="theme-color" content="#19322c" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

      <script id="page-json-ld" type="application/ld+json">
        {serializeJsonLd(schema)}
      </script>
    </Helmet>
  );
}

interface SchemaScriptProps {
  schema: JsonLdNode;
}

export function SchemaScript({ schema }: SchemaScriptProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}

interface BreadcrumbJsonLDProps {
  items: Array<{ name: string; url: string }>;
}

export function BreadcrumbJsonLD({ items }: BreadcrumbJsonLDProps) {
  return <SchemaScript schema={buildBreadcrumbSchema(items)} />;
}

interface DefaultSchemaProps {
  settings?: Partial<SEOSettings>;
}

export function DefaultSchema({ settings }: DefaultSchemaProps) {
  return <SchemaScript schema={buildCompleteSchema(settings)} />;
}

// ============================================
// NOINDEX COMPONENT (for admin pages)
// ============================================

export function NoIndex() {
  return (
    <Helmet>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
  );
}

// ============================================
// PRECONNECT COMPONENT (for performance)
// ============================================

interface PreconnectProps {
  domains?: string[];
}

export function Preconnect({ domains = [] }: PreconnectProps) {
  const defaults = ['https://res.cloudinary.com'];

  const allDomains = [...new Set([...defaults, ...domains])];

  return (
    <Helmet>
      {allDomains.map((domain) => (
        <>
          <link rel="preconnect" href={domain} crossOrigin="anonymous" key={domain} />
          <link rel="dns-prefetch" href={domain} key={`dns-${domain}`} />
        </>
      ))}
    </Helmet>
  );
}
