/** Marketplace listing: short video strip + category icon rail + filter sidebar + product grid. */
import { AnimatePresence, motion } from 'motion/react'
import { SearchX, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { searchProducts, type ProductQuery } from '@/api'
import { categories, products, type Product } from '@/data/mock'
import { categoryIcons } from '@/components/brand'
import { ProductCard } from '@/components/cards'
import { Badge, Button, Select, Skeleton } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { cn, formatNumber } from '@/lib/utils'

const ALL_CERTS = Array.from(new Set(products.flatMap((p) => p.certificates))).slice(0, 12)
const MOQ_STEPS = [0, 50, 500, 2000, 5000]

export default function SearchPage() {
  const { t, L, locale } = useI18n()
  const [params, setParams] = useSearchParams()
  const keyword = params.get('q') ?? ''
  const categoryId = params.get('category') ?? ''
  const [maxMoq, setMaxMoq] = useState(0)
  const [certs, setCerts] = useState<string[]>([])
  const [sort, setSort] = useState<NonNullable<ProductQuery['sort']>>('popular')
  const [results, setResults] = useState<Product[] | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    let alive = true
    setResults(null)
    searchProducts({ keyword, categoryId: categoryId || undefined, maxMoq: maxMoq || undefined, certificates: certs, sort }).then((r) => alive && setResults(r))
    return () => {
      alive = false
    }
  }, [keyword, categoryId, maxMoq, certs, sort])

  const cat = categories.find((c) => c.id === categoryId)
  const activeFilters = useMemo(() => [maxMoq ? `MOQ ≤ ${formatNumber(maxMoq, locale)}` : null, ...certs].filter(Boolean) as string[], [maxMoq, certs, locale])

  const setCategory = (id: string) => {
    const next = new URLSearchParams(params)
    if (id) next.set('category', id)
    else next.delete('category')
    setParams(next)
  }
  const clearAll = () => {
    setMaxMoq(0)
    setCerts([])
  }

  const filters = (
    <div className="space-y-7">
      <div>
        <p className="mb-3 text-sm font-bold">{t.searchPage.maxMoq}</p>
        <div className="flex flex-wrap gap-2">
          {MOQ_STEPS.map((m) => (
            <button key={m} onClick={() => setMaxMoq(m)} className={cn('rounded-full border px-3 py-1.5 text-xs font-semibold transition', maxMoq === m ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/50')}>
              {m === 0 ? t.searchPage.any : `≤ ${formatNumber(m, locale)}`}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-bold">{t.searchPage.certs}</p>
        <div className="space-y-2">
          {ALL_CERTS.map((c) => {
            const on = certs.includes(c)
            return (
              <label key={c} className="flex cursor-pointer items-center gap-2.5 text-[13px]">
                <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={on} onChange={() => setCerts((v) => (on ? v.filter((x) => x !== c) : [...v, c]))} />
                {c}
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* video strip */}
      <section className="relative isolate h-44 overflow-hidden bg-navy text-white md:h-52">
        <video className="absolute inset-0 -z-20 size-full object-cover" src="/video/product_search.mp4" poster="/video/product_search-poster.jpg" autoPlay muted loop playsInline aria-hidden />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/80 to-navy/20" />
        <div className="container-page flex h-full flex-col justify-center">
          <nav aria-label="Breadcrumb" className="text-[13px] text-white/60">
            <Link to="/" className="hover:text-white">{t.common.home}</Link> / {t.nav.products}{cat && ` / ${L(cat.categoryName)}`}
          </nav>
          <motion.h1 key={keyword + categoryId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
            {keyword ? `“${keyword}”` : cat ? L(cat.categoryName) : t.nav.products}
          </motion.h1>
          <p className="mt-1 text-sm text-white/70">{results ? `${results.length} ${t.searchPage.results}` : t.common.loading}</p>
        </div>
      </section>

      {/* category rail */}
      <div className="sticky top-[112px] z-30 border-b bg-background/90 backdrop-blur max-lg:top-[68px]">
        <div className="container-page no-scrollbar flex gap-1 overflow-x-auto py-2">
          {[{ id: '', name: t.searchPage.all, Icon: null }, ...categories.map((c) => ({ id: c.id, name: L(c.categoryName), Icon: categoryIcons[c.icon] }))].map(({ id, name, Icon }) => (
            <button key={id} onClick={() => setCategory(id)} className={cn('relative flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors', categoryId === id ? 'text-primary-foreground' : 'text-foreground/70 hover:text-foreground')}>
              {categoryId === id && <motion.span layoutId="search-cat" className="absolute inset-0 rounded-full bg-primary" transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />}
              {Icon && <Icon className="relative size-4" />}
              <span className="relative">{name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="container-page mt-8 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-48">
            <p className="mb-5 flex items-center gap-2 font-bold"><SlidersHorizontal className="size-4" /> {t.searchPage.filters}</p>
            {filters}
          </div>
        </aside>

        <div>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setFiltersOpen(true)}><SlidersHorizontal /> {t.searchPage.filters}</Button>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              {activeFilters.map((f) => <Badge key={f} variant="secondary" className="py-1">{f}</Badge>)}
              {activeFilters.length > 0 && <button onClick={clearAll} className="text-xs font-semibold text-muted-foreground hover:text-foreground">{t.searchPage.clear}</button>}
            </div>
            <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-9 w-auto min-w-44 text-[13px]" aria-label={t.searchPage.sort}>
              {(Object.keys(t.searchPage.sorts) as (keyof typeof t.searchPage.sorts)[]).map((k) => <option key={k} value={k}>{t.searchPage.sorts[k]}</option>)}
            </Select>
          </div>

          {!results ? (
            <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <div key={i}><Skeleton className="aspect-square" /><Skeleton className="mt-3 h-4" /><Skeleton className="mt-2 h-5 w-1/2" /></div>)}
            </div>
          ) : results.length === 0 ? (
            <div className="grid place-items-center py-20 text-center">
              <SearchX className="size-10 text-muted-foreground" />
              <p className="mt-4 font-bold">{t.common.noResults}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.common.noResultsHint}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
              {results.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.035 } }}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div className="fixed inset-0 z-[80] bg-navy/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setFiltersOpen(false)} />
            <motion.div className="fixed inset-x-0 bottom-0 z-[81] max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-popover p-5" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', bounce: 0.1, duration: 0.45 }}>
              <div className="mb-4 flex items-center justify-between">
                <p className="font-extrabold">{t.searchPage.filters}</p>
                <button onClick={() => setFiltersOpen(false)} className="rounded-md p-1.5 hover:bg-muted" aria-label="Close"><X className="size-4" /></button>
              </div>
              {filters}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
