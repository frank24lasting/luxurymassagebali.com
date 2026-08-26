// ============================================
// UTILITY FUNCTIONS
// ============================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn — Tailwind class merger (clsx + tailwind-merge)
 * Merge multiple className strings conditionally, resolve conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// CLOUDINARY — SEO IMAGE NAMING UTILITIES
// ============================================

/**
 * Sanitize original filename → kebab-case.webp
 * Contoh: "IMG_20241201_083244.jpg" → "img-20241201-083244.webp"
 */
export function sanitizeImageName(original: string): string {
  return (
    original
      .toLowerCase()
      // Replace semua karakter non-alphanumeric dengan dash
      .replace(/[^a-z0-9]+/g, '-')
      // Trim leading/trailing dashes
      .replace(/(^-|-$)/g, '')
      // Remove extension
      .replace(/\.\w+$/, '')
    // Append webp
    + '.webp'
  );
}

/**
 * Generate readable alt text from filename
 * Contoh: "massage-balinese-full-body.webp" → "Massage Balinese Full Body"
 */
export function generateAltText(filename: string): string {
  return filename
    .replace(/\.webp$/i, '')
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================
// URL & STRING UTILITIES
// ============================================

/**
 * Format slug from any string
 */
export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  );
}

/**
 * Format currency (IDR)
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date (Indonesian locale)
 */
export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  return new Intl.DateTimeFormat('id-ID', options ?? defaultOptions).format(
    new Date(date)
  );
}

/**
 * Format time (24h format)
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Generate SEO-friendly filename dengan prefix
 */
export function generateSeoFilename(
  prefix: 'hero' | 'service' | 'article' | 'blog' | 'facility' | 'staff',
  slug: string,
  descriptor?: string
): string {
  const parts = [prefix, slug, descriptor].filter(Boolean);
  return parts.join('-') + '.webp';
}

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate phone (Indonesian format)
 */
export function isValidPhone(phone: string): boolean {
  // Accepts: 08xx, +62xx, 62xx, 8xx
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^(?:\+?62|0)[2-9]\d{7,11}$/.test(cleaned);
}

/**
 * Format phone to standard format
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('62')) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('0')) {
    return `+62${cleaned.slice(1)}`;
  }
  return `+62${cleaned}`;
}

// ============================================
// DATE & TIME UTILITIES
// ============================================

/**
 * Get today's date as YYYY-MM-DD
 */
export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get date string N days from now
 */
export function getFutureDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Check if date is in the past
 */
export function isPastDate(date: string): boolean {
  return new Date(date) < new Date(getToday());
}

/**
 * Get available time slots for a given date
 */
export function getTimeSlots(
  startHour = 9,
  endHour = 21,
  intervalMinutes = 60
): string[] {
  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += intervalMinutes) {
      slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`);
    }
  }
  return slots;
}

// ============================================
// ARRAY UTILITIES
// ============================================

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Unique array by key
 */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
  const seen = new Set();
  return array.filter((item) => {
    const val = item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}

/**
 * Sort array by multiple keys
 */
export function sortBy<T>(array: T[], ...keys: Array<keyof T>): T[] {
  return [...array].sort((a, b) => {
    for (const key of keys) {
      const aVal = a[key];
      const bVal = b[key];
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
    }
    return 0;
  });
}

// ============================================
// OBJECT UTILITIES
// ============================================

/**
 * Pick specific keys from object
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Omit specific keys from object
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return structuredClone(obj);
}

// ============================================
// BROWSER UTILITIES
// ============================================

/**
 * Check if running on client
 */
export const isClient = typeof window !== 'undefined';

/**
 * Check if device is mobile
 */
export function isMobile(): boolean {
  if (!isClient) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Scroll to element smoothly
 */
export function scrollToElement(selector: string): void {
  if (!isClient) return;
  const element = document.querySelector(selector);
  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!isClient) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// STORAGE UTILITIES
// ============================================

/**
 * Safe localStorage get
 */
export function getStorageItem<T>(key: string, fallback: T): T {
  if (!isClient) return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Safe localStorage set
 */
export function setStorageItem<T>(key: string, value: T): boolean {
  if (!isClient) return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove localStorage item
 */
export function removeStorageItem(key: string): void {
  if (!isClient) return;
  localStorage.removeItem(key);
}

// ============================================
// CONSTANTS
// ============================================

export const APPOINTMENT_HOURS = {
  START: 9,
  END: 21,
  INTERVAL: 60, // minutes
} as const;

export const MAX_FILE_SIZE = {
  IMAGE: 20 * 1024 * 1024, // 20MB
  VIDEO: 200 * 1024 * 1024, // 200MB (MP4)
} as const;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export const SEO_LIMITS = {
  TITLE: 70,
  DESCRIPTION: 160,
} as const;

// ============================================
// CLOUDINARY UPLOAD UTILITY
// ============================================

export async function uploadToCloudinary(file: File, folder: string = 'luxury-massage-bali'): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !preset) {
    throw new Error('Cloudinary not configured');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', preset);
  formData.append('folder', folder);

  const resourceType = file.type.startsWith('video/') ? 'video' : 'image';

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Upload failed');
  }

  return data.secure_url;
}
