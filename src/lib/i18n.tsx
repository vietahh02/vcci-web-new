import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { vi, en, ko, type Dict } from './dict'

export type Lang = 'vi' | 'en' | 'ko'
/** Web-side copy in every language. `ko` is optional on mock BE data and falls back to `en`. */
export type Bilingual = { vi: string; en: string; ko?: string }

export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: 'vi', label: 'Tiếng Việt', short: 'VI' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ko', label: '한국어', short: 'KO' },
]

const DICTS: Record<Lang, Dict> = { vi, en, ko }
const LOCALES: Record<Lang, string> = { vi: 'vi-VN', en: 'en-US', ko: 'ko-KR' }

type Ctx = {
  lang: Lang
  setLang: (l: Lang) => void
  t: Dict
  /**
   * Pick the localized variant of a content field. BE data arrives as a plain
   * string already localized via the Accept-Language header and passes through.
   */
  L: (text: Bilingual | string) => string
  locale: string
}

const I18nContext = createContext<Ctx | null>(null)
const STORAGE_KEY = 'vcci.lang'

let current: Lang = readLang()
/** Active language for non-React code (the api layer's Accept-Language header). */
export const currentLang = () => current

function readLang(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v && v in DICTS) return v as Lang
  } catch {
    /* storage unavailable */
  }
  return 'vi'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(current)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang: (l) => {
        current = l
        setLangState(l)
        try {
          localStorage.setItem(STORAGE_KEY, l)
        } catch {
          /* ignore */
        }
      },
      t: DICTS[lang],
      L: (text) => (typeof text === 'string' ? text : lang === 'ko' ? text.ko ?? text.en : text[lang]),
      locale: LOCALES[lang],
    }),
    [lang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
