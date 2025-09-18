import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL || ""}${path}`
}

export function extractCodeFromString(str: string) {
  const codeBlockRegex = /```[\s\S]*?\n([\s\S]*?)```/;
  const match = str.match(codeBlockRegex);
  return match ? match[1].trim() : str;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Resolve canonical site origin for server-side usage (no trailing slash)
export function getSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://xerironx.vercel.app'
  return raw.replace(/\/$/, '')
}

// Build absolute URL safely
export function siteUrl(path: string): string {
  const base = getSiteOrigin()
  if (!path.startsWith('/')) return `${base}/${path}`
  return `${base}${path}`
}
