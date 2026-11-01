/** Small helpers shared by all BE -> FE adapters. BE content arrives already localised, so it is wrapped to Bilingual. */
import { IMG } from '@/data/mock'
import type { Bilingual } from '@/lib/i18n'
import { API_BASE } from '../config'

export type Raw = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

export const bi = (s: unknown): Bilingual => {
  const v = s == null ? '' : typeof s === 'string' ? s : String(s)
  return { vi: v, en: v, ko: v }
}
/** BE may return {vi,en,ko} (Show Hub /full) or a plain string (everything else). */
export const biAny = (s: unknown): Bilingual => {
  if (s && typeof s === 'object' && 'vi' in (s as object)) {
    const o = s as Raw
    return { vi: String(o.vi ?? ''), en: String(o.en ?? o.vi ?? ''), ko: String(o.ko ?? o.en ?? o.vi ?? '') }
  }
  return bi(s)
}
export const str = (v: unknown, d = '') => (v == null ? d : String(v))
export const num = (v: unknown, d = 0) => {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : d
}
export const arr = <T = Raw>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])
export const id = (v: unknown) => (v == null ? '' : String(v))

/** Relative storage paths are resolved against the API origin; absolute URLs and unsplash ids pass through. */
export const url = (v: unknown, fallback: string = IMG.warehouse): string => {
  const s = str(v)
  if (!s) return fallback
  if (/^(https?:|data:|blob:)/.test(s)) return s
  if (s.startsWith('/')) return API_BASE + s
  return s // legacy mock image id
}
