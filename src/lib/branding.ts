import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface BrandingSettings {
  readonly site_name?: string;
  readonly logo_text?: string;
  readonly logo_url?: string;
  readonly logo_mode?: 'image' | 'text';
  readonly favicon_url?: string;
  readonly tagline?: string;
  readonly logo_size_nav?: string | number;
  readonly logo_size_mobile?: string | number;
  readonly logo_size_admin?: string | number;
  readonly logo_size_footer?: string | number;
  readonly logo_size_loader?: string | number;
  readonly logo_scale_nav?: string | number;
  readonly logo_scale_mobile?: string | number;
  readonly logo_scale_admin?: string | number;
  readonly logo_scale_footer?: string | number;
}

function toSize(value: string | number | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 32), 260);
}

function toScale(value: string | number | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 0.5), 4);
}

function normalizeBrand(value: string | undefined, fallback: string): string {
  if (!value || /spa[\s-]?jimbaran/i.test(value)) return fallback;
  return value;
}

async function fetchBranding(): Promise<BrandingSettings> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'branding')
    .maybeSingle();

  if (error) throw new Error(error.message);
  const settings = (data?.value as BrandingSettings | null) ?? {};
  return {
    ...settings,
    site_name: normalizeBrand(settings.site_name, 'Luxury Massage Bali'),
    logo_text: normalizeBrand(settings.logo_text, 'Luxury Massage Bali'),
    tagline: normalizeBrand(settings.tagline, 'Premium Massage, Delivered in Bali'),
    logo_url: settings.logo_url?.includes('spa-jimbaran') ? '' : settings.logo_url,
    favicon_url: settings.favicon_url?.includes('spa-jimbaran') ? '/favicon.svg' : settings.favicon_url,
  };
}

export function useBrandingSettings() {
  const { data: branding = {} } = useQuery({
    queryKey: ['public-branding'],
    queryFn: fetchBranding,
    staleTime: 5 * 60 * 1000,
  });

  return {
    siteName: branding.site_name || branding.logo_text || 'Luxury Massage Bali',
    tagline: branding.tagline || 'Premium Massage, Delivered in Bali',
    logoUrl: branding.logo_url || '',
    logoSizeNav: toSize(branding.logo_size_nav, 140),
    logoSizeMobile: toSize(branding.logo_size_mobile, 120),
    logoSizeAdmin: toSize(branding.logo_size_admin, 100),
    logoSizeFooter: toSize(branding.logo_size_footer, 150),
    logoSizeLoader: toSize(branding.logo_size_loader, 150),
    logoScaleNav: toScale(branding.logo_scale_nav, 1.8),
    logoScaleMobile: toScale(branding.logo_scale_mobile, 1.5),
    logoScaleAdmin: toScale(branding.logo_scale_admin, 1.4),
    logoScaleFooter: toScale(branding.logo_scale_footer, 1.4),
    faviconUrl: branding.favicon_url || '/favicon.svg',
  };
}
