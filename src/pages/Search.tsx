/** Marketplace listing: short video strip + category icon rail + filter sidebar + product grid. */
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Infinity as InfinityIcon, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { catalogApi, searchProductsPage, USE_MOCK, type ProductQuery } from '@/api'
import { categories, products, type Product } from '@/data/mock'
import { categoryIcons } from '@/components/brand'
import { ProductCard } from '@/components/cards'
import { Badge, Button, Skeleton } from '@/components/ui/primitives'
import { Select } from '@/components/ui/select'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'
import { cn, formatNumber } from '@/lib/utils'

const MOCK_CERTS = Array.from(new Set(products.flatMap((p) => p.certificates))).slice(0, 12)
// 0 = không giới hạn, nằm ở đầu phải của thanh gạt
const MOQ_STEPS = [50, 500, 2000, 5000, 0]

export default function SearchPage() {
  const { t, L, lang, locale } = useI18n()
  const [params, setParams] = useSearchParams()
  const keyword = params.get('q') ?? ''
  const categoryId = params.get('category') ?? ''
  const [maxMoq, setMaxMoq] = useState(0)
  const [certs, setCerts] = useState<string[]>([])
  const [sort, setSort] = useState<NonNullable<ProductQuery['sort']>>('popular')
  const [results, setResults] = useState<Product[] | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [facetCerts, setFacetCerts] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const rail = useRef<HTMLDivElement>(null)
  const [railEdge, setRailEdge] = useState({ start: false, end: false })
  const query = (pg: number): ProductQuery => ({ keyword, categoryId: categoryId || undefined, maxMoq: maxMoq || undefined, certificates: certs, sort, page: pg, size: 24 })

  // filters, sorting and paging are all applied by the BE; a new filter restarts from page 0
  useEffect(() => {
    let alive = true
    setResults(null)
    setPage(0)
    searchProductsPage(query(0)).then((r) => { if (alive) { setResults(r.items); setTotal(r.total) } }, () => alive && setResults([]))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, categoryId, maxMoq, certs, sort, lang])

  useEffect(() => {
    if (!USE_MOCK) catalogApi.popularCertificates(12).then(setFacetCerts, () => undefined)
  }, [lang])

  const syncRail = () => {
    const el = rail.current
    if (el) setRailEdge({ start: el.scrollLeft > 4, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 })
  }
  useEffect(() => {
    if (!rail.current) return
    const observer = new ResizeObserver(syncRail)
    observer.observe(rail.current)
    return () => observer.disconnect()
  }, [])
  // danh mục đang chọn luôn nằm trong vùng nhìn thấy; chờ font vì font tải muộn làm chip rộng ra
  useEffect(() => {
    document.fonts.ready.then(() => {
      const el = rail.current
      const chip = el?.querySelector<HTMLElement>('[aria-pressed="true"]')
      if (el && chip) el.scrollTo({ left: chip.offsetLeft - (el.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' })
      syncRail()
    })
  }, [categoryId])
  const scrollRail = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.6, behavior: 'smooth' })

  const loadMore = () => {
    setLoadingMore(true)
    searchProductsPage(query(page + 1)).then(
      (r) => { setResults((prev) => [...(prev ?? []), ...r.items]); setPage(page + 1); setTotal(r.total) },
      () => undefined,
    ).finally(() => setLoadingMore(false))
  }

  const cat = categories.find((c) => c.id === categoryId)
  // live mode: certificate facets are the most used labels in the public catalogue (GET /api/products/certificates)
  const ALL_CERTS = USE_MOCK ? MOCK_CERTS : facetCerts
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

  const moqIndex = MOQ_STEPS.indexOf(maxMoq)
  const moqLabel = maxMoq ? `≤ ${formatNumber(maxMoq, locale)}` : t.searchPage.any

  const filters = (
    <div className="space-y-7">
      <div>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="text-sm font-bold">{t.searchPage.maxMoq}</p>
          <output className="text-xs font-semibold text-primary">{moqLabel}</output>
        </div>
        <input
          type="range"
          min={0}
          max={MOQ_STEPS.length - 1}
          value={moqIndex}
          aria-label={t.searchPage.maxMoq}
          aria-valuetext={moqLabel}
          onChange={(e) => setMaxMoq(MOQ_STEPS[Number(e.target.value)]!)}
          className="range-input"
          style={{ '--fill': `${(moqIndex / (MOQ_STEPS.length - 1)) * 100}%` } as CSSProperties}
        />
        <div aria-hidden className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
          {MOQ_STEPS.map((m) => (m ? <span key={m}>{formatNumber(m, locale)}</span> : <InfinityIcon key={m} className="size-3.5" />))}
        </div>
      </div>
      {ALL_CERTS.length > 0 && <div>
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
      </div>}
    </div>
  )

  return (
    <>
      {/* video strip */}
      <section className="relative isolate h-44 overflow-hidden bg-navy text-white md:h-52">
        <video className="absolute inset-0 -z-20 size-full object-cover" src="/video/product_search.mp4" poster="/video/product_search-poster.jpg" autoPlay muted loop playsInline aria-hidden />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/80 to-navy/20" />
        <div className="container-page flex h-full flex-col justify-center">
          <nav aria-label={t.ui.breadcrumb} className="text-[13px] text-white/60">
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
        <div className="relative">
          {/* Vùng cuộn tràn hết bề ngang và canh lề bằng padding, để chip không bị cắt giữa màn hình ở mép container */}
          <div ref={rail} onScroll={syncRail} className="no-scrollbar relative flex gap-1 overflow-x-auto px-4 py-2 md:px-[max(28px,calc((100%-1320px)/2+28px))]">
          {[{ id: '', name: t.searchPage.all, Icon: null }, ...categories.map((c) => ({ id: c.id, name: L(c.categoryName), Icon: categoryIcons[c.icon] }))].map(({ id, name, Icon }) => (
            <button key={id} aria-pressed={categoryId === id} onClick={() => setCategory(id)} className={cn('relative flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors', categoryId === id ? 'text-primary-foreground' : 'text-foreground/70 hover:text-foreground')}>
              {categoryId === id && <motion.span layoutId="search-cat" className="absolute inset-0 rounded-full bg-primary" transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />}
              {Icon && <Icon className="relative size-4" />}
              <span className="relative">{name}</span>
            </button>
          ))}
          </div>
          {railEdge.start && (
            <div className="absolute inset-y-0 left-0 hidden w-16 items-center bg-gradient-to-r from-background via-background to-transparent pl-2 md:flex">
              <button onClick={() => scrollRail(-1)} aria-label={t.ui.previous} className="grid size-8 place-items-center rounded-full border bg-card shadow-sm transition hover:border-primary/50"><ChevronLeft className="size-4" /></button>
            </div>
          )}
          {railEdge.end && (
            <div className="absolute inset-y-0 right-0 hidden w-16 items-center justify-end bg-gradient-to-l from-background via-background to-transparent pr-2 md:flex">
              <button onClick={() => scrollRail(1)} aria-label={t.ui.next} className="grid size-8 place-items-center rounded-full border bg-card shadow-sm transition hover:border-primary/50"><ChevronRight className="size-4" /></button>
            </div>
          )}
        </div>
      </div>

      <div className="container-page mt-8 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-48 rounded-2xl border bg-card p-4 shadow-sm">
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
            <Select value={sort} onValueChange={setSort} className="h-9 w-auto min-w-44 text-[13px]" aria-label={t.searchPage.sort} options={(Object.keys(t.searchPage.sorts) as (keyof typeof t.searchPage.sorts)[]).map((k) => ({ value: k, label: t.searchPage.sorts[k] }))} />
          </div>

          {!results ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="overflow-hidden rounded-2xl border bg-card"><Skeleton className="aspect-square rounded-none" /><div className="p-3.5"><Skeleton className="h-4" /><Skeleton className="mt-2 h-5 w-1/2" /></div></div>)}
            </div>
          ) : results.length === 0 ? (
            <div className="grid place-items-center py-20 text-center">
              <SearchX className="size-10 text-muted-foreground" />
              <p className="mt-4 font-bold">{t.common.noResults}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.common.noResultsHint}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
              {results.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.035 } }}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          )}
          {results && results.length > 0 && results.length < total && (
            <div className="mt-10 flex justify-center">
              <Button variant="outline" disabled={loadingMore} onClick={loadMore}>{tx('Xem thêm', 'Load more', '더 보기')} ({results.length}/{total})</Button>
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
                <button onClick={() => setFiltersOpen(false)} className="rounded-md p-1.5 hover:bg-muted" aria-label={t.ui.close}><X className="size-4" /></button>
              </div>
              {filters}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
