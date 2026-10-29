import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Unsplash image helper — all ids verified to resolve. */
export function img(id: string, w = 640, h?: number) {
  const size = h ? `&h=${h}&fit=crop` : ''
  return `https://images.unsplash.com/photo-${id}?w=${w}${size}&q=70&auto=format`
}

export function formatMoney(value: number, currency = 'USD', locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: value < 100 ? 2 : 0,
  }).format(value)
}

export function formatNumber(value: number, locale = 'vi-VN') {
  return new Intl.NumberFormat(locale).format(value)
}

export function formatDate(iso: string, locale = 'vi-VN', opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale, opts ?? { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(iso),
  )
}

export function daysLeft(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')
}
