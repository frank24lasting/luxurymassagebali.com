import { createClient } from '@supabase/supabase-js';

// ============================================
// SUPABASE CLIENT CONFIGURATION
// ============================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ============================================
// SUPABASE STORAGE BUCKETS
// ============================================

export const STORAGE_BUCKETS = {
  HERO_MEDIA: 'hero-media',
  ARTICLE_IMAGES: 'article-images',
  SERVICE_IMAGES: 'service-images',
  MEDIA_LIBRARY: 'media-library',
  GENERAL: 'general',
} as const;

// ============================================
// FILE UPLOAD HELPERS
// ============================================

export interface UploadResult {
  url: string;
  path: string;
  error: string | null;
}

export async function uploadFile(
  bucket: string,
  file: File,
  folder: string = ''
): Promise<UploadResult> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    return { url: '', path: '', error: error.message };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return { url: urlData.publicUrl, path: data.path, error: null };
}

export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return !error;
}

// ============================================
// CDN URL TRANSFORMER
// ============================================

export function getCDNUrl(url: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
}): string {
  if (!url) return '';

  // If using Cloudflare Images
  const cdnUrl = import.meta.env.VITE_CDN_URL;
  if (cdnUrl) {
    const params = new URLSearchParams();
    if (options?.width) params.set('width', options.width.toString());
    if (options?.height) params.set('height', options.height.toString());
    if (options?.quality) params.set('quality', options.quality.toString());
    if (options?.format) params.set('format', options.format);
    
    const queryString = params.toString();
    return queryString ? `${cdnUrl}/${url}?${queryString}` : `${cdnUrl}/${url}`;
  }

  // Supabase built-in image transformation
  if (url.includes('supabase') && options) {
    const transforms: string[] = [];
    if (options.width) transforms.push(`width=${options.width}`);
    if (options.height) transforms.push(`height=${options.height}`);
    if (options.quality) transforms.push(`quality=${options.quality}`);
    if (options.format) transforms.push(`format=${options.format}`);
    
    if (transforms.length > 0) {
      return `${url}?${transforms.join('&')}`;
    }
  }

  return url;
}

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

export function subscribeToAppointments(callback: (payload: unknown) => void) {
  return supabase
    .channel('appointments-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'appointments' },
      callback
    )
    .subscribe();
}

export function subscribeToArticles(callback: (payload: unknown) => void) {
  return supabase
    .channel('articles-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'articles' },
      callback
    )
    .subscribe();
}

export function subscribeToHeroSlides(callback: (payload: unknown) => void) {
  return supabase
    .channel('hero-slides-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'hero_slides' },
      callback
    )
    .subscribe();
}
