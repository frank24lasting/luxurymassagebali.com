import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type JsonLdNode = Record<string, unknown>;

export interface BusinessSchemaSettings {
    name: string;
    legalName: string;
    description: string;
    businessTypes: string[];
    logo: string;
    image: string;
    telephone: string;
    email: string;
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
    latitude: number | null;
    longitude: number | null;
    opens: string;
    closes: string;
    priceRange: string;
    currenciesAccepted: string;
    paymentAccepted: string[];
    areaServed: string[];
    sameAs: string[];
    googleMapsUrl: string;
}

export interface RouteSchemaOverride {
    enabled: boolean;
    mode: 'merge' | 'replace';
    schema: JsonLdNode;
}

export interface SchemaSettings {
    business: BusinessSchemaSettings;
    routeOverrides: Record<string, RouteSchemaOverride>;
}

export const DEFAULT_BUSINESS_SCHEMA: BusinessSchemaSettings = {
    name: 'Luxury Massage Bali',
    legalName: 'Luxury Massage Bali',
    description: 'Premium home massage and wellness service delivered to villas, hotels, apartments, and homes across Bali.',
    businessTypes: ['HealthAndBeautyBusiness', 'DaySpa', 'LocalBusiness'],
    logo: '/logo.png',
    image: '/og-image.jpg',
    telephone: '+6281353681757',
    email: 'hello@luxurymassagebali.com',
    streetAddress: 'Perdana Kampial Cluster, Perdana VI No.3',
    addressLocality: 'Nusa Dua',
    addressRegion: 'Bali',
    postalCode: '',
    addressCountry: 'ID',
    latitude: -8.8039,
    longitude: 115.2149,
    opens: '09:00',
    closes: '21:00',
    priceRange: '$$',
    currenciesAccepted: 'IDR',
    paymentAccepted: ['Cash', 'Bank Transfer'],
    areaServed: ['Bali', 'Nusa Dua', 'Jimbaran', 'Seminyak', 'Canggu', 'Ubud', 'Sanur'],
    sameAs: ['https://wa.me/6281353681757'],
    googleMapsUrl: 'https://maps.app.goo.gl/SbephNzX2QaKfiEB9?g_st=iwb',
};

export const DEFAULT_SCHEMA_SETTINGS: SchemaSettings = {
    business: DEFAULT_BUSINESS_SCHEMA,
    routeOverrides: {},
};

const isRecord = (value: unknown): value is JsonLdNode =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const cleanPath = (path: string): string => {
    const pathOnly = path.trim().split(/[?#]/)[0] || '/';
    const prefixed = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
    return prefixed.length > 1 ? prefixed.replace(/\/+$/, '') : '/';
};

export function normalizeSchemaSettings(value: unknown): SchemaSettings {
    if (!isRecord(value)) return DEFAULT_SCHEMA_SETTINGS;
    const business = isRecord(value.business) ? value.business : {};
    const rawOverrides = isRecord(value.routeOverrides) ? value.routeOverrides : {};
    const routeOverrides = Object.entries(rawOverrides).reduce<Record<string, RouteSchemaOverride>>((result, [path, item]) => {
        if (!isRecord(item) || !isRecord(item.schema)) return result;
        const mode = item.mode === 'replace' ? 'replace' : 'merge';
        result[cleanPath(path)] = { enabled: item.enabled !== false, mode, schema: item.schema };
        return result;
    }, {});

    return {
        business: {
            ...DEFAULT_BUSINESS_SCHEMA,
            ...business,
            businessTypes: Array.isArray(business.businessTypes)
                ? business.businessTypes.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
                : DEFAULT_BUSINESS_SCHEMA.businessTypes,
            paymentAccepted: Array.isArray(business.paymentAccepted)
                ? business.paymentAccepted.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
                : DEFAULT_BUSINESS_SCHEMA.paymentAccepted,
            areaServed: Array.isArray(business.areaServed)
                ? business.areaServed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
                : DEFAULT_BUSINESS_SCHEMA.areaServed,
            sameAs: Array.isArray(business.sameAs)
                ? business.sameAs.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
                : DEFAULT_BUSINESS_SCHEMA.sameAs,
            latitude: typeof business.latitude === 'number' ? business.latitude : DEFAULT_BUSINESS_SCHEMA.latitude,
            longitude: typeof business.longitude === 'number' ? business.longitude : DEFAULT_BUSINESS_SCHEMA.longitude,
        } as BusinessSchemaSettings,
        routeOverrides,
    };
}

export function validateJsonLd(value: unknown): string[] {
    const errors: string[] = [];
    if (!isRecord(value)) return ['JSON-LD harus berupa object.'];

    const context = value['@context'];
    if (context !== undefined && context !== 'https://schema.org') {
        errors.push('@context harus https://schema.org.');
    }

    const graph = value['@graph'];
    const nodes = Array.isArray(graph) ? graph : [value];
    if (Array.isArray(graph) && graph.length === 0) errors.push('@graph tidak boleh kosong.');

    nodes.forEach((node, index) => {
        if (!isRecord(node)) {
            errors.push(`Node ${index + 1} harus berupa object.`);
            return;
        }
        if (!node['@type'] && !node['@id']) errors.push(`Node ${index + 1} memerlukan @type atau @id.`);
    });

    const serialized = JSON.stringify(value);
    if (/localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(serialized)) errors.push('URL localhost tidak boleh dipublish.');
    if (/<\/script/i.test(serialized)) errors.push('Konten script tidak diizinkan.');
    return errors;
}

export function parseJsonLd(source: string): { value: JsonLdNode | null; errors: string[] } {
    try {
        const value = JSON.parse(source) as unknown;
        const errors = validateJsonLd(value);
        return { value: errors.length === 0 ? (value as JsonLdNode) : null, errors };
    } catch (error) {
        return { value: null, errors: [`JSON tidak valid: ${error instanceof Error ? error.message : 'Unknown error'}`] };
    }
}

export async function fetchSchemaSettings(): Promise<SchemaSettings> {
    const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'json_ld')
        .maybeSingle();
    if (error) throw new Error(error.message);
    return normalizeSchemaSettings(data?.value);
}

export function useSchemaSettings() {
    return useQuery({
        queryKey: ['public-json-ld'],
        queryFn: fetchSchemaSettings,
        staleTime: 5 * 60 * 1000,
    });
}

export function getRouteOverride(settings: SchemaSettings, path: string): RouteSchemaOverride | undefined {
    return settings.routeOverrides[cleanPath(path)];
}
