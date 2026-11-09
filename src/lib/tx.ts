import { currentLang } from '@/lib/i18n'
import { KO } from '@/lib/ko-profile'

/**
 * Inline copy for the profile screens: `tx(vi, en, ko?)`. Korean falls back to the KO map keyed by
 * the English string, then to English. Components calling it also read `useI18n()`, so they re-render on language change.
 */
export function tx(vi: string, en: string, ko?: string): string {
  const lang = currentLang()
  if (lang === 'vi') return vi
  if (lang === 'ko') return ko ?? KO[en] ?? en
  return en
}

/** Date + time in the UI language (a bare toLocaleString() follows the browser, e.g. "11/12/2026, 2:19 PM" in a vi page). */
export const dateTime = (iso: string | number | Date) =>
  new Date(iso).toLocaleString(tx('vi-VN', 'en-US', 'ko-KR'), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })

/** Attach Korean (from the KO map) to a bilingual `{ vi, en }` object. */
export const withKo = <T extends { vi: string; en: string }>(b: T): T & { ko?: string } => ({ ...b, ko: KO[b.en] })
