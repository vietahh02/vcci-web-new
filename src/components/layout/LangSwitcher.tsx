import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { LANGS, useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function LangSwitcher({ className }: { className?: string }) {
  const { t, lang, setLang } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn('inline-flex items-center gap-1 rounded-lg p-2.5 text-[13px] font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground', className)}
        aria-label={t.ui.language}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="size-[18px]" /> {LANGS.find((l) => l.code === lang)?.short}
        <ChevronDown className={cn('size-3.5 transition', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-1 min-w-40 overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg"
          >
            {LANGS.map((l) => (
              <li key={l.code}>
                <button
                  role="option"
                  aria-selected={l.code === lang}
                  onClick={() => {
                    setLang(l.code)
                    setOpen(false)
                  }}
                  className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted', l.code === lang && 'font-semibold text-primary')}
                >
                  <span className="w-6 text-xs font-bold text-muted-foreground">{l.short}</span>
                  <span className="flex-1">{l.label}</span>
                  {l.code === lang && <Check className="size-4" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
