import { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
    EMPTY_TRACKING_SETTINGS,
    isValidGa4Id,
    isValidGoogleAdsId,
    isValidGtmId,
    normalizeTrackingSettings,
    pushDataLayer,
    type ConversionEventName,
    type ConversionEventParams,
    type GoogleTrackingSettings,
} from '@/lib/analytics';

async function fetchTrackingSettings(): Promise<GoogleTrackingSettings> {
    const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'analytics')
        .maybeSingle();

    if (error) throw new Error(error.message);
    const value = data?.value;
    return normalizeTrackingSettings(
        value && typeof value === 'object' && !Array.isArray(value)
            ? (value as Record<string, unknown>)
            : {},
    );
}

function findInteractiveTarget(target: EventTarget | null): HTMLElement | null {
    return target instanceof Element
        ? target.closest<HTMLElement>('a, button, [role="button"], [data-conversion]')
        : null;
}

function classifyClick(element: HTMLElement): {
    readonly event: ConversionEventName;
    readonly params: ConversionEventParams;
} | null {
    const anchor = element.closest<HTMLAnchorElement>('a');
    const href = anchor?.href ?? '';
    const rawHref = anchor?.getAttribute('href') ?? '';
    const label = [
        element.dataset.conversion,
        element.getAttribute('aria-label'),
        element.getAttribute('title'),
        element.textContent,
    ]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 180);
    const searchable = `${rawHref} ${href} ${label}`.toLowerCase();
    const params = {
        event_category: 'engagement',
        event_label: label || rawHref || 'unknown',
        link_url: href || undefined,
        page_location: window.location.href,
    } satisfies ConversionEventParams;

    if (/wa\.me|whatsapp\.com|whatsapp/.test(searchable)) return { event: 'click_whatsapp', params };
    if (/^tel:/i.test(rawHref)) return { event: 'click_phone', params };
    if (/^mailto:/i.test(rawHref)) return { event: 'click_email', params };
    if (/google\.[^/]+\/maps|maps\.google|maps\.app\.goo\.gl|google maps|lokasi|location/.test(searchable)) {
        return { event: 'click_google_maps', params };
    }
    if (/harga|price|pricing|lihat tarif|view rate/.test(searchable)) return { event: 'view_price', params };
    if (/appointment|booking|book now|book appointment|pesan sekarang|reservasi/.test(searchable)) {
        return { event: 'booking_start', params };
    }
    if (/\/services\/|data-conversion=["']?view_service/.test(searchable)) return { event: 'view_service', params };
    if (/contact|kontak|hubungi|consult|konsultasi|inquiry|enquiry/.test(searchable)) {
        return { event: 'generate_lead', params };
    }

    return null;
}

export function GoogleTracking() {
    const location = useLocation();
    const lastPageRef = useRef('');
    const { data: settings = EMPTY_TRACKING_SETTINGS } = useQuery({
        queryKey: ['public-google-tracking'],
        queryFn: fetchTrackingSettings,
        staleTime: 5 * 60 * 1000,
    });

    const gtmId = isValidGtmId(settings.gtm_id) ? settings.gtm_id : '';
    const ga4Id = isValidGa4Id(settings.ga4_id) ? settings.ga4_id : '';
    const googleAdsId = isValidGoogleAdsId(settings.google_ads_id) ? settings.google_ads_id : '';
    const googleTagId = gtmId ? '' : (ga4Id || googleAdsId);

    useEffect(() => {
        const pagePath = `${location.pathname}${location.search}`;
        if (lastPageRef.current === pagePath) return;
        lastPageRef.current = pagePath;

        pushDataLayer('page_view', {
            page_location: window.location.href,
            page_path: pagePath,
            page_title: document.title,
        });

        if (location.pathname === '/appointment/confirmation') {
            pushDataLayer('booking_complete', {
                event_category: 'conversion',
                page_location: window.location.href,
                value: 1,
                currency: 'IDR',
            });
        }
    }, [location.pathname, location.search]);

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            const target = findInteractiveTarget(event.target);
            if (!target) return;
            const conversion = classifyClick(target);
            if (conversion) pushDataLayer(conversion.event, conversion.params);
        };

        const handleSubmit = (event: SubmitEvent) => {
            const form = event.target instanceof HTMLFormElement ? event.target : null;
            if (!form) return;
            const formLabel = `${form.id} ${form.getAttribute('name') ?? ''} ${form.textContent ?? ''}`.toLowerCase();
            const isBooking = /booking|appointment|reservasi|jadwal/.test(formLabel);
            pushDataLayer(isBooking ? 'booking_submit' : 'generate_lead', {
                event_category: 'conversion',
                event_label: form.id || form.getAttribute('name') || 'website_form',
                page_location: window.location.href,
                value: 1,
                currency: 'IDR',
            });
        };

        document.addEventListener('click', handleClick, { capture: true });
        document.addEventListener('submit', handleSubmit, { capture: true });
        return () => {
            document.removeEventListener('click', handleClick, { capture: true });
            document.removeEventListener('submit', handleSubmit, { capture: true });
        };
    }, []);

    return (
        <Helmet>
            {settings.search_console_verification && (
                <meta name="google-site-verification" content={settings.search_console_verification} />
            )}
            {gtmId && (
                <script>{`
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
          (function(w,d,s,l,i){var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');
        `}</script>
            )}
            {googleTagId && (
                <script async src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`} />
            )}
            {googleTagId && (
                <script>{`
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
          window.gtag('js', new Date());
          ${!gtmId && ga4Id ? `window.gtag('config', '${ga4Id}', { send_page_view: false });` : ''}
          ${!gtmId && googleAdsId ? `window.gtag('config', '${googleAdsId}');` : ''}
        `}</script>
            )}
        </Helmet>
    );
}
