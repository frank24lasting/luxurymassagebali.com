import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ContactSettings {
    readonly phone?: string;
    readonly whatsapp?: string;
    readonly email?: string;
    readonly address?: string;
    readonly google_maps_url?: string;
    readonly google_maps_embed?: string;
    readonly open_hour?: string;
    readonly close_hour?: string;
    readonly timezone?: string;
}

export const DEFAULT_MAP_EMBED_SRC = 'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3942.976923860157!2d115.197574!3d-8.78823776!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd24321c5693ed1%3A0x55ba65069c0c437f!2sNADEVA%20TRANS!5e0!3m2!1sen!2sid!4v1787732333494!5m2!1sen!2sid';

export const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
    phone: '+6281353681757',
    whatsapp: '+6281353681757',
    email: 'hello@luxurymassagebali.com',
    address: 'Bali, Indonesia',
    google_maps_url: 'https://maps.app.goo.gl/SbephNzX2QaKfiEB9?g_st=iwb',
    google_maps_embed: DEFAULT_MAP_EMBED_SRC,
    open_hour: '09:00',
    close_hour: '21:00',
    timezone: 'Asia/Makassar',
};

export function extractMapEmbedSrc(rawHtmlOrUrl: string | undefined): string {
    if (!rawHtmlOrUrl || !rawHtmlOrUrl.trim()) return DEFAULT_MAP_EMBED_SRC;
    const trimmed = rawHtmlOrUrl.trim();
    // Check if it is an iframe with src="..."
    const match = trimmed.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) {
        return match[1];
    }
    // If it is a raw URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    return DEFAULT_MAP_EMBED_SRC;
}

export function cleanPhoneDigits(raw: string | undefined): string {
    if (!raw) return '6281353681757';
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('0')) {
        digits = `62${digits.slice(1)}`;
    } else if (!digits.startsWith('62')) {
        digits = `62${digits}`;
    }
    return digits || '6281353681757';
}

export function formatWhatsAppUrl(number: string | undefined, message?: string): string {
    const clean = cleanPhoneDigits(number);
    const text = message ? `?text=${encodeURIComponent(message)}` : '';
    return `https://wa.me/${clean}${text}`;
}

async function fetchContactSettings(): Promise<ContactSettings> {
    const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'contact_info')
        .maybeSingle();

    if (error) throw new Error(error.message);
    return { ...DEFAULT_CONTACT_SETTINGS, ...((data?.value as ContactSettings | null) ?? {}) };
}

export function useContactSettings() {
    const { data: contact = DEFAULT_CONTACT_SETTINGS } = useQuery({
        queryKey: ['public-contact-info'],
        queryFn: fetchContactSettings,
        staleTime: 5 * 60 * 1000,
    });

    const phone = contact.phone || DEFAULT_CONTACT_SETTINGS.phone!;
    const whatsapp = contact.whatsapp || contact.phone || DEFAULT_CONTACT_SETTINGS.whatsapp!;
    const cleanWhatsApp = cleanPhoneDigits(whatsapp);
    const googleMapsEmbedSrc = extractMapEmbedSrc(contact.google_maps_embed);

    return {
        phone,
        whatsapp,
        cleanWhatsApp,
        email: contact.email || DEFAULT_CONTACT_SETTINGS.email!,
        address: contact.address || DEFAULT_CONTACT_SETTINGS.address!,
        googleMapsUrl: contact.google_maps_url || DEFAULT_CONTACT_SETTINGS.google_maps_url!,
        googleMapsEmbed: contact.google_maps_embed || DEFAULT_MAP_EMBED_SRC,
        googleMapsEmbedSrc,
        openHour: contact.open_hour || DEFAULT_CONTACT_SETTINGS.open_hour!,
        closeHour: contact.close_hour || DEFAULT_CONTACT_SETTINGS.close_hour!,
        timezone: contact.timezone || DEFAULT_CONTACT_SETTINGS.timezone!,
        getWhatsAppUrl: (message?: string) => formatWhatsAppUrl(whatsapp, message),
    };
}
