import { Helmet } from 'react-helmet-async';
import { buildMetaTags, buildCompleteSchema, buildArticleSchema, buildServiceSchema, buildBreadcrumbSchema, buildFAQSchema } from '@/lib/seo';
import type { SEOSettings, PageSEO } from '@/lib/types';

// ============================================
// SEO HEAD COMPONENT
// ============================================

interface SEOHeadProps {
  pageSEO?: PageSEO;
  globalSEO?: Partial<SEOSettings>;
  schemaType?: 'default' | 'article' | 'service';
  articleData?: {
    title: string;
    slug: string;
    excerpt: string;
    coverImage: string;
    author: string;
    publishedAt: string;
    updatedAt: string;
  };
  serviceData?: {
    name: string;
    slug: string;
    description: string;
    price: number;
    imageUrl: string;
    duration?: string;
  };
  breadcrumbItems?: Array<{ name: string; url: string }>;
  faqData?: Array<{ question: string; answer: string }>;
}

export function SEOHead({
  pageSEO,
  globalSEO,
  schemaType = 'default',
  articleData,
  serviceData,
  breadcrumbItems,
  faqData,
}: SEOHeadProps) {
  const meta = buildMetaTags(pageSEO, globalSEO);

  // Build schema based on type
  const getSchema = () => {
    switch (schemaType) {
      case 'article':
        if (articleData) {
          return [
            buildArticleSchema(articleData),
            ...(breadcrumbItems ? [buildBreadcrumbSchema(breadcrumbItems)] : []),
          ];
        }
        break;
      case 'service':
        if (serviceData) {
          return [
            buildServiceSchema(serviceData),
            ...(breadcrumbItems ? [buildBreadcrumbSchema(breadcrumbItems)] : []),
          ];
        }
        break;
      case 'default':
      default:
        return buildCompleteSchema(globalSEO);
    }
    return null;
  };

  const schema = getSchema();

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta name="keywords" content={meta.keywords} />
      <meta name="author" content={meta.author} />
      <meta name="robots" content={meta.robots} />
      <link rel="canonical" href={meta.canonical} />

      <meta name="googlebot" content={meta.robots} />
      <meta name="bingbot" content={meta.robots} />

      {/* Open Graph */}
      <meta property="og:title" content={meta.og.title} />
      <meta property="og:description" content={meta.og.description} />
      <meta property="og:image" content={meta.og.image} />
      <meta property="og:image:secure_url" content={meta.og.image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={meta.og.title} />
      <meta property="og:url" content={meta.og.url} />
      <meta property="og:type" content={meta.og.type} />
      <meta property="og:site_name" content={meta.og.siteName} />
      <meta property="og:locale" content="id_ID" />

      {/* Twitter */}
      <meta name="twitter:card" content={meta.twitter.card} />
      <meta name="twitter:title" content={meta.twitter.title} />
      <meta name="twitter:description" content={meta.twitter.description} />
      <meta name="twitter:image" content={meta.twitter.image} />
      <meta name="twitter:image:alt" content={meta.twitter.title} />
      {meta.twitter.site && <meta name="twitter:site" content={meta.twitter.site} />}

      {/* Mobile Specific */}
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="theme-color" content="#19322c" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

      {/* JSON-LD Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}

      {/* FAQ Schema */}
      {faqData && faqData.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify(buildFAQSchema(faqData))}
        </script>
      )}
    </Helmet>
  );
}

// ============================================
// SCHEMA SCRIPT COMPONENT (Standalone JSON-LD)
// ============================================

interface SchemaScriptProps {
  schema: Record<string, unknown>;
}

export function SchemaScript({ schema }: SchemaScriptProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ============================================
// BREADCRUMB JSON-LD COMPONENT
// ============================================

interface BreadcrumbJsonLDProps {
  items: Array<{ name: string; url: string }>;
}

export function BreadcrumbJsonLD({ items }: BreadcrumbJsonLDProps) {
  const schema = buildBreadcrumbSchema(items);
  return <SchemaScript schema={schema} />;
}

// ============================================
// DEFAULT SCHEMA INJECTOR
// ============================================

interface DefaultSchemaProps {
  settings?: Partial<SEOSettings>;
}

export function DefaultSchema({ settings }: DefaultSchemaProps) {
  const schemas = buildCompleteSchema(settings);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
    />
  );
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
