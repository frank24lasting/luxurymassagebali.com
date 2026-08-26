import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ContactSettings {
    readonly phone?: string;
    readonly whatsapp?: string;
    readonly email?: string;
    readonly address?: string;
    readonly google_maps_url?: string;
    readonly open_hour?: string;
    readonly close_hour?: string;
    readonly timezone?: string;
}

export const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
    phone: '+6281353681757',
    whatsapp: '+6281353681757',
    email: 'hello@luxurymassagebali.com',
    address: 'Bali, Indonesia',
    google_maps_url: 'https://maps.app.goo.gl/SbephNzX2QaKfiEB9?g_st=iwb',
    open_hour: '09:00',
    close_hour: '21:00',
    timezone: 'Asia/Makassar',
};

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

    return {
        phone,
        whatsapp,
        cleanWhatsApp,
        email: contact.email || DEFAULT_CONTACT_SETTINGS.email!,
        address: contact.address || DEFAULT_CONTACT_SETTINGS.address!,
        googleMapsUrl: contact.google_maps_url || DEFAULT_CONTACT_SETTINGS.google_maps_url!,
        openHour: contact.open_hour || DEFAULT_CONTACT_SETTINGS.open_hour!,
        closeHour: contact.close_hour || DEFAULT_CONTACT_SETTINGS.close_hour!,
        timezone: contact.timezone || DEFAULT_CONTACT_SETTINGS.timezone!,
        getWhatsAppUrl: (message?: string) => formatWhatsAppUrl(whatsapp, message),
    };
}
