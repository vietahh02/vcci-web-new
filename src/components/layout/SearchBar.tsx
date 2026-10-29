import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, Flame, Search, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { categories, products, trendingKeywords } from '@/data/mock'
import { categoryIcons } from '@/components/brand'
import { Kbd } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { cn, img } from '@/lib/utils'

export type Scope = 'products' | 'suppliers' | 'requests'

export function SearchBar({ size = 'md', className, autoFocusKey }: { size?: 'md' | 'lg'; className?: string; autoFocusKey?: boolean }) {
  const { t, L } = useI18n()
  const navigate = useNavigate()
  const [scope, setScope] = useState<Scope>('products')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [phIndex, setPhIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const lg = size === 'lg'

  // rotating placeholder
  useEffect(() => {
    const id = setInterval(() => setPhIndex((i) => (i + 1) % t.search.placeholders.length), 3200)
    return () => clearInterval(id)
  }, [t.search.placeholders.length])

  // "/" focuses search
  useEffect(() => {
    if (!autoFocusKey) return
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [autoFocusKey])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const matches = useMemo(() => {
    if (!q.trim()) return []
    const n = q.toLowerCase()
    return products.filter((p) => L(p.productName).toLowerCase().includes(n) || p.industry.toLowerCase().includes(n)).slice(0, 4)
  }, [q, L])

  function submit(term = q) {
    setOpen(false)
    const path = scope === 'suppliers' ? '/suppliers' : scope === 'requests' ? '/requests' : '/search'
    navigate(`${path}?q=${encodeURIComponent(term.trim())}`)
    inputRef.current?.blur()
  }

  const scopes: Scope[] = ['products', 'suppliers', 'requests']

  return (
    <div ref={wrapRef} className={cn('relative w-full', className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className={cn(
          'flex items-center rounded-2xl border-2 bg-background transition-[border,box-shadow] duration-300',
          open ? 'border-primary shadow-[0_0_0_5px_color-mix(in_oklab,var(--primary)_14%,transparent)]' : 'border-primary/80',
          lg ? 'h-[60px] p-1.5 shadow-2xl shadow-black/25' : 'h-12 p-1',
        )}
        role="search"
      >
        {!lg && (
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as Scope)}
            aria-label="Scope"
            className="mr-1 hidden h-full shrink-0 cursor-pointer rounded-xl bg-muted pl-3 pr-2 text-xs font-semibold text-foreground outline-none md:block"
          >
            {scopes.map((s) => (
              <option key={s} value={s}>{t.search.scopes[s]}</option>
            ))}
          </select>
        )}
        <div className={cn('hidden shrink-0 items-center rounded-xl bg-muted p-0.5', lg && 'mr-2 md:flex')}>
          {scopes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={cn('relative rounded-[10px] px-3 font-semibold transition-colors', lg ? 'py-2 text-[13px]' : 'py-1.5 text-xs', scope === s ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              {scope === s && <motion.span layoutId={`scope-pill-${size}`} className="absolute inset-0 rounded-[10px] bg-primary" transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }} />}
              <span className="relative">{t.search.scopes[s]}</span>
            </button>
          ))}
        </div>
        <div className="relative flex min-w-0 flex-1 items-center">
          <Search className={cn('ml-2 shrink-0 text-muted-foreground md:hidden', lg ? 'size-5' : 'size-4')} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setOpen(true)}
            aria-label={t.search.submit}
            className={cn('peer h-full w-full min-w-0 bg-transparent px-2 text-foreground outline-none placeholder:text-transparent focus-visible:outline-none', lg ? 'text-base' : 'text-sm')}
            placeholder={t.search.placeholders[phIndex]}
          />
          {!q && (
            <div className="pointer-events-none absolute inset-y-0 left-2 right-2 flex items-center overflow-hidden max-md:left-9">
              <AnimatePresence mode="wait">
                <motion.span
                  key={phIndex + t.search.placeholders[0]!}
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -14, opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className={cn('block min-w-0 truncate text-muted-foreground', lg ? 'text-base' : 'text-sm')}
                >
                  {t.search.placeholders[phIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          )}
          {autoFocusKey && lg && !q && <span className="mr-2 hidden lg:block"><Kbd>/</Kbd></span>}
        </div>
        <button
          type="submit"
          className={cn(
            'inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground transition hover:bg-primary-hover active:scale-[0.97]',
            lg ? 'h-full px-6 text-[15px]' : 'h-full px-4 text-sm',
          )}
        >
          <Search className={lg ? 'size-5' : 'size-4'} />
          <span className="hidden sm:inline">{t.search.submit}</span>
        </button>
      </form>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.985 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl shadow-navy/15"
          >
            {matches.length > 0 ? (
              <ul className="p-2">
                {matches.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false)
                        navigate(`/products/${p.id}`)
                      }}
                      className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-muted"
                    >
                      <img src={img(p.productImages[0]!, 96, 96)} alt="" className="size-10 rounded-lg object-cover" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{L(p.productName)}</span>
                      <ArrowUpRight className="size-4 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="grid gap-5 p-4 md:grid-cols-[1.2fr_1fr]">
                <div>
                  <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Flame className="size-3.5 text-live" /> {t.search.trending}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {trendingKeywords.map((k, i) => (
                      <motion.button
                        key={k.en}
                        type="button"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => {
                          setQ(L(k))
                          submit(L(k))
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition hover:border-primary hover:bg-primary-soft hover:text-primary"
                      >
                        <TrendingUp className="size-3.5" /> {L(k)}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.search.recent}</p>
                  <div className="grid grid-cols-2 gap-1">
                    {categories.slice(0, 6).map((c) => {
                      const Icon = categoryIcons[c.icon]
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setOpen(false)
                            navigate(`/search?category=${c.id}`)
                          }}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition hover:bg-muted"
                        >
                          <Icon className="size-4 shrink-0 text-primary" />
                          <span className="truncate">{L(c.categoryName)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
