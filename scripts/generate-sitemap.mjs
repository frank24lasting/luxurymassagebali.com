import { config } from 'dotenv';
import { writeFile } from 'node:fs/promises';

config({ path: '.env.local' });
config({ path: '.env' });

const SITE_URL = (process.env.VITE_SITE_URL || 'https://luxurymassagebali.com').replace(/\/$/, '');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const fixedRoutes = [
    ['/', '1.0', 'daily'],
    ['/services', '0.9', 'weekly'],
    ['/appointment', '0.9', 'monthly'],
    ['/blog', '0.8', 'daily'],
    ['/about', '0.7', 'monthly'],
    ['/contact', '0.7', 'monthly'],
    ['/gallery', '0.6', 'weekly'],
    ['/massage', '0.9', 'weekly'],
    ['/facial', '0.9', 'weekly'],
    ['/body-treatment', '0.9', 'weekly'],
    ['/spa-package', '0.9', 'weekly'],
    ['/couple-package', '0.9', 'weekly'],
];

function escapeXml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;');
}

async function fetchRows(table, query) {
    if (!SUPABASE_URL || !SUPABASE_KEY) return [];
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
        headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
        },
    });
    if (!response.ok) throw new Error(`${table}: ${response.status} ${response.statusText}`);
    return response.json();
}

async function generateSitemap() {
    const urls = fixedRoutes.map(([path, priority, changefreq]) => ({ path, priority, changefreq }));

    try {
        const articles = await fetchRows('articles', 'select=slug,updated_at&status=eq.published&slug=not.is.null');
        for (const article of articles) {
            urls.push({ path: `/${article.slug}`, priority: '0.8', changefreq: 'weekly', lastmod: article.updated_at });
        }
    } catch (error) {
        console.warn(`[sitemap] Article URLs skipped: ${error.message}`);
    }

    try {
        const services = await fetchRows('services', 'select=slug&is_active=eq.true&slug=not.is.null');
        for (const service of services) {
            urls.push({ path: `/services/${service.slug}`, priority: '0.8', changefreq: 'weekly' });
        }
    } catch (error) {
        console.warn(`[sitemap] Service URLs skipped: ${error.message}`);
    }

    const uniqueUrls = [...new Map(urls.map((item) => [item.path, item])).values()];
    const entries = uniqueUrls.map((item) => {
        const lastmod = item.lastmod ? `\n    <lastmod>${escapeXml(new Date(item.lastmod).toISOString())}</lastmod>` : '';
        return `  <url>\n    <loc>${escapeXml(`${SITE_URL}${item.path}`)}</loc>${lastmod}\n    <changefreq>${item.changefreq}</changefreq>\n    <priority>${item.priority}</priority>\n  </url>`;
    });
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

    await writeFile('public/sitemap.xml', xml, 'utf8');
    console.log(`[sitemap] Generated ${uniqueUrls.length} URLs.`);
}

generateSitemap().catch((error) => {
    console.error(`[sitemap] Failed: ${error.message}`);
    process.exitCode = 1;
});
