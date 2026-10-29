import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { vi, en, type Dict } from './dict'

export type Lang = 'vi' | 'en'
export type Bilingual = { vi: string; en: string }

type Ctx = {
  lang: Lang
  setLang: (l: Lang) => void
  t: Dict
  /** Pick the localized variant of a bilingual content field. */
  L: (text: Bilingual) => string
  locale: string
}

const I18nContext = createContext<Ctx | null>(null)
const STORAGE_KEY = 'vcci.lang'

function readLang(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'vi' || v === 'en') return v
  } catch {
    /* storage unavailable */
  }
  return 'vi'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang: (l) => {
        setLangState(l)
        try {
          localStorage.setItem(STORAGE_KEY, l)
        } catch {
          /* ignore */
        }
      },
      t: lang === 'vi' ? vi : en,
      L: (text) => text[lang],
      locale: lang === 'vi' ? 'vi-VN' : 'en-US',
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
