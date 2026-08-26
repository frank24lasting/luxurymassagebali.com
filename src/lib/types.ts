// ============================================
// LUXURY MASSAGE BALI - Type Definitions
// ============================================

// Database Tables
export interface SiteSettings {
  id: string;
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface ServicePrice {
  id: string;
  service_id: string;
  duration_minutes: number | null;
  price: number;
  label: string;
  sort_order: number;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  duration_minutes: number | null;
  price: number | null;
  category: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  prices?: ServicePrice[];
}

export interface Appointment {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_id: string;
  service?: Service;
  appointment_date: string;
  appointment_time: string;
  therapist_preference: 'male' | 'female' | 'no_preference';
  special_request: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  admin_notes: string;
  confirmed_at: string | null;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: Record<string, unknown>; // TipTap JSON format
  cover_image: string;
  author: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  seo_title: string;
  seo_description: string;
  og_image: string;
  schema_markup: Record<string, unknown>;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  filename: string;
  url: string;
  cdn_url: string;
  mime_type: string;
  size_bytes: number;
  alt_text: string;
  uploaded_at: string;
}

export interface HeroSlide {
  id: string;
  type: 'image' | 'video';
  media_url: string;
  thumbnail_url: string;
  headline: string;
  subheadline: string;
  cta_text: string;
  cta_link: string;
  sort_order: number;
  is_active: boolean;
  animation_preset: 'kenburns' | 'parallax' | 'zoom' | 'slide' | 'glitch' | 'fade';
}

// SEO Types
export interface SEOSettings {
  siteTitle: string;
  siteDescription: string;
  defaultOgImage: string;
  googleAnalyticsId: string;
  googleSearchConsole: string;
  robotsTxt: string;
  sitemapEnabled: boolean;
  ogSiteName: string;
  ogType: string;
  twitterCard: string;
  twitterHandle: string;
  facebookAppId: string;
  schemaMarkup: Record<string, unknown>;
}

export interface PageSEO {
  path: string;
  title: string;
  description: string;
  ogImage: string;
}

// Animation Presets
export type AnimationPreset = 'kenburns' | 'parallax' | 'zoom' | 'slide' | 'glitch' | 'fade';

export const ANIMATION_VARIANTS = {
  kenburns: {
    initial: { scale: 1.15, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 8, ease: 'easeOut' },
  },
  parallax: {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1, ease: 'easeOut' },
  },
  zoom: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.8, ease: 'backOut' },
  },
  slide: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { duration: 0.6, ease: 'easeOut' },
  },
  glitch: {
    initial: { opacity: 0, filter: 'blur(10px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.6, ease: 'easeOut' },
  },
} as const;

// Appointment Form
export interface AppointmentFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  therapist_preference: 'male' | 'female' | 'no_preference';
  special_request: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Navigation
export interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: number;
}

// Admin Sidebar Items
export interface AdminNavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: AdminNavItem[];
}

// Form Validation
export interface ValidationError {
  field: string;
  message: string;
}

// Time Slot
export interface TimeSlot {
  time: string;
  available: boolean;
}

// Booking Status
export const APPOINTMENT_STATUS = {
  pending: { label: 'Pending', color: 'warning', icon: 'Clock' },
  confirmed: { label: 'Confirmed', color: 'success', icon: 'CheckCircle' },
  cancelled: { label: 'Cancelled', color: 'danger', icon: 'XCircle' },
  completed: { label: 'Completed', color: 'primary', icon: 'Check' },
} as const;

// Article Status
export const ARTICLE_STATUS = {
  draft: { label: 'Draft', color: 'muted' },
  published: { label: 'Published', color: 'success' },
} as const;

// Service Categories
export const SERVICE_CATEGORIES = [
  'Massage',
  'Facial',
  'Body Treatment',
  'Spa Package',
  'Couple Package',
  'Hair Treatment',
  'Nail Care',
  'Wellness',
] as const;

// Therapist Preferences
export const THERAPIST_PREFERENCES = [
  { value: 'no_preference', label: 'No Preference' },
  { value: 'male', label: 'Male Therapist' },
  { value: 'female', label: 'Female Therapist' },
] as const;
