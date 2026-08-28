export interface GoogleTrackingSettings {
    readonly gtm_id: string;
    readonly google_ads_id: string;
    readonly ga4_id: string;
    readonly search_console_verification: string;
}

export type ConversionEventName =
    | 'click_whatsapp'
    | 'booking_start'
    | 'booking_submit'
    | 'booking_complete'
    | 'click_phone'
    | 'generate_lead'
    | 'view_price'
    | 'click_google_maps'
    | 'click_email'
    | 'view_service'
    | 'page_view';

export interface ConversionEventParams {
    readonly event_category?: string;
    readonly event_label?: string;
    readonly link_url?: string;
    readonly page_location?: string;
    readonly page_path?: string;
    readonly page_title?: string;
    readonly transport_type?: 'beacon';
    readonly value?: number;
    readonly currency?: 'IDR';
    readonly [key: string]: string | number | undefined;
}

declare global {
    interface Window {
        dataLayer: Array<Record<string, unknown> | IArguments>;
        gtag?: (...args: unknown[]) => void;
    }
}

const PATTERNS = {
    gtm: /^GTM-[A-Z0-9]+$/i,
    googleAds: /^AW-\d+$/i,
    ga4: /^G-[A-Z0-9]+$/i,
} as const;

export const EMPTY_TRACKING_SETTINGS: GoogleTrackingSettings = {
    gtm_id: '',
    google_ads_id: '',
    ga4_id: '',
    search_console_verification: '',
};

function normalizeId(value: unknown): string {
    return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

export function normalizeTrackingSettings(value: Record<string, unknown>): GoogleTrackingSettings {
    const legacyGaId = normalizeId(value.google_analytics_id);
    const ga4Id = normalizeId(value.ga4_id) || legacyGaId;

    return {
        gtm_id: normalizeId(value.gtm_id),
        google_ads_id: normalizeId(value.google_ads_id),
        ga4_id: ga4Id,
        search_console_verification:
            typeof value.search_console_verification === 'string'
                ? value.search_console_verification.trim()
                : '',
    };
}

export function isValidGtmId(value: string): boolean {
    return value === '' || PATTERNS.gtm.test(value);
}

export function isValidGoogleAdsId(value: string): boolean {
    return value === '' || PATTERNS.googleAds.test(value);
}

export function isValidGa4Id(value: string): boolean {
    return value === '' || PATTERNS.ga4.test(value);
}

export function pushDataLayer(
    event: ConversionEventName,
    params: ConversionEventParams = {},
): void {
    window.dataLayer = window.dataLayer || [];

    if (typeof window.gtag === 'function') {
        window.gtag('event', event, params);
        return;
    }

    window.dataLayer.push({ event, ...params });
}
