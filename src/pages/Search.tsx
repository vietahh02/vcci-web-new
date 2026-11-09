/** Marketplace listing: short video strip + category icon rail + filter sidebar + product grid. */
import { AnimatePresence, motion } from 'motion/react'
import { Infinity as InfinityIcon, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { catalogApi, searchProductsPage, USE_MOCK, type ProductQuery } from '@/api'
import { ErrorBlock } from '@/components/ui/StateViews'
import { categories, products, type Product } from '@/data/mock'
import { categoryIcons } from '@/components/brand'
import { ProductCard } from '@/components/cards'
import { Badge, Button, buttonClass, Skeleton } from '@/components/ui/primitives'
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
  // filters and sort live in the URL, so reload, Back and shared links keep them
  const patch = (fn: (n: URLSearchParams) => void) => { const n = new URLSearchParams(params); fn(n); setParams(n, { replace: true }) }
  const moqParam = Number(params.get('moq'))
  const maxMoq = MOQ_STEPS.includes(moqParam) ? moqParam : 0
  const setMaxMoq = (v: number) => patch((n) => (v ? n.set('moq', String(v)) : n.delete('moq')))
  const certsKey = params.getAll('cert').join('|')
  const certs = useMemo(() => (certsKey ? certsKey.split('|') : []), [certsKey])
  const setCerts = (next: string[]) => patch((n) => { n.delete('cert'); next.forEach((c) => n.append('cert', c)) })
  const sorts = Object.keys(t.searchPage.sorts) as NonNullable<ProductQuery['sort']>[]
  const sortParam = params.get('sort') as NonNullable<ProductQuery['sort']> | null
  const sort = sortParam && sorts.includes(sortParam) ? sortParam : 'popular'
  const setSort = (v: NonNullable<ProductQuery['sort']>) => patch((n) => (v === 'popular' ? n.delete('sort') : n.set('sort', v)))
  const [results, setResults] = useState<Product[] | null>(null)
  const [loadError, setLoadError] = useState<Error>()
  const [attempt, setAttempt] = useState(0)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [facetCerts, setFacetCerts] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const rail = useRef<HTMLDivElement>(null)
  const query = (pg: number): ProductQuery => ({ keyword, categoryId: categoryId || undefined, maxMoq: maxMoq || undefined, certificates: certs, sort, page: pg, size: 24 })

  // filters, sorting and paging are all applied by the BE; a new filter restarts from page 0
  useEffect(() => {
    let alive = true
    setResults(null)
    setPage(0)
    setLoadError(undefined)
    searchProductsPage(query(0)).then((r) => { if (alive) { setResults(r.items); setTotal(r.total) } }, (e: Error) => { if (alive) { setLoadError(e); setResults([]) } })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, categoryId, maxMoq, certsKey, sort, lang, attempt])

  useEffect(() => {
    if (!USE_MOCK) catalogApi.popularCertificates(12).then(setFacetCerts, () => undefined)
  }, [lang])

  // mobile: danh mục đang chọn luôn nằm trong vùng nhìn thấy; chờ font vì font tải muộn làm chip rộng ra
  useEffect(() => {
    document.fonts.ready.then(() => {
      const el = rail.current
      const chip = el?.querySelector<HTMLElement>('[aria-pressed="true"]')
      if (el && chip) el.scrollTo({ left: chip.offsetLeft - (el.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' })
    })
  }, [categoryId])

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
  const clearAll = () => patch((n) => { n.delete('moq'); n.delete('cert') })

  // the BE total, not the page size: "215 results · showing 24"
  const countLabel = total > (results?.length ?? 0)
    ? `${formatNumber(total, locale)} ${t.searchPage.results} · ${tx('đang hiển thị', 'showing', '표시 중')} ${formatNumber(results?.length ?? 0, locale)}`
    : `${formatNumber(results?.length ?? 0, locale)} ${t.searchPage.results}`

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
                <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={on} onChange={() => setCerts(on ? certs.filter((x) => x !== c) : [...certs, c])} />
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
      <section className="relative isolate overflow-hidden bg-navy py-6 text-white md:py-8">
        <video className="absolute inset-0 -z-20 size-full object-cover" src="/video/product_search.mp4" poster="/video/product_search-poster.jpg" autoPlay muted loop playsInline aria-hidden />
        <div className="absolute inset-0 -z-10 bg-navy/80" />
        <div className="container-page">
          <div className="min-w-0">
            <nav aria-label={t.ui.breadcrumb} className="text-[13px] text-white/70">
              <Link to="/" className="hover:text-white">{t.common.home}</Link> / {t.nav.products}{cat && ` / ${L(cat.categoryName)}`}
            </nav>
            <motion.h1 key={keyword + categoryId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 line-clamp-2 text-3xl font-extrabold tracking-tight md:text-4xl">
              {keyword ? `“${keyword}”` : cat ? L(cat.categoryName) : t.nav.products}
            </motion.h1>
            <p className="mt-1 text-[15px] text-white/85" aria-live="polite">{loadError ? '' : !results ? t.common.loading : countLabel}</p>
          </div>
        </div>
      </section>

      {/* category rail */}
      <div className="sticky top-[68px] z-30 bg-background lg:static lg:bg-transparent">
        {/* Desktop xuống hàng để thấy đủ danh mục trong khung nội dung; mobile cuộn ngang để không đẩy sản phẩm xuống */}
        <div ref={rail} className="container-page no-scrollbar relative flex gap-2 overflow-x-auto py-2.5 lg:flex-wrap lg:overflow-visible lg:pb-0 lg:pt-6">
          {[{ id: '', name: t.searchPage.all, Icon: null }, ...categories.map((c) => ({ id: c.id, name: L(c.categoryName), Icon: categoryIcons[c.icon] }))].map(({ id, name, Icon }) => (
            <button key={id} aria-pressed={categoryId === id} onClick={() => setCategory(id)} className={cn('relative flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 lg:h-9 lg:px-3.5 text-[13px] font-semibold transition-colors', categoryId === id ? 'border-transparent text-primary-foreground' : 'bg-card text-foreground/75 hover:border-primary/40 hover:text-foreground')}>
              {categoryId === id && <motion.span layoutId="search-cat" className="absolute -inset-px rounded-full bg-primary" transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />}
              {Icon && <Icon className="relative size-4" />}
              <span className="relative">{name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="container-page mt-6 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-32 rounded-2xl bg-muted/60 p-5">
            <p className="mb-5 flex items-center gap-2 font-bold"><SlidersHorizontal className="size-4" /> {t.searchPage.filters}</p>
            {filters}
          </div>
        </aside>

        <div>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Button variant="outline" className="h-11 lg:hidden" onClick={() => setFiltersOpen(true)}><SlidersHorizontal /> {t.searchPage.filters}{activeFilters.length > 0 && ` (${activeFilters.length})`}</Button>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              {activeFilters.map((f) => <Badge key={f} variant="secondary" className="py-1">{f}</Badge>)}
              {activeFilters.length > 0 && <button onClick={clearAll} className="min-h-9 px-1 text-[13px] font-semibold text-primary hover:underline">{t.searchPage.clear}</button>}
            </div>
            <Select value={sort} onValueChange={setSort} className="h-11 w-auto min-w-44 text-[13px] lg:h-9" aria-label={t.searchPage.sort} options={(Object.keys(t.searchPage.sorts) as (keyof typeof t.searchPage.sorts)[]).map((k) => ({ value: k, label: t.searchPage.sorts[k] }))} />
          </div>

          {!results ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="overflow-hidden rounded-2xl border bg-card"><Skeleton className="aspect-square rounded-none" /><div className="p-3.5"><Skeleton className="h-4" /><Skeleton className="mt-2 h-5 w-1/2" /></div></div>)}
            </div>
          ) : loadError ? (
            <ErrorBlock error={loadError} onRetry={() => setAttempt((n) => n + 1)} />
          ) : results.length === 0 ? (
            <div className="grid place-items-center rounded-3xl bg-muted/60 px-6 py-16 text-center">
              <SearchX className="size-10 text-muted-foreground" />
              <p className="mt-4 text-lg font-bold">{t.common.noResults}</p>
              <p className="mt-1 max-w-md text-[15px] text-foreground/80">{tx('Sửa từ khoá ở ô tìm kiếm phía trên, hoặc:', 'Edit the keyword in the search field above, or:', '위 검색창에서 검색어를 고치거나:')}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {(activeFilters.length > 0 || categoryId) && <Button variant="outline" onClick={() => patch((n) => { n.delete('moq'); n.delete('cert'); n.delete('category') })}>{tx('Xoá bộ lọc và danh mục', 'Clear filters and category', '필터·카테고리 지우기')}</Button>}
                {keyword && <Link to={categoryId ? `/search?category=${categoryId}` : '/search'} className={buttonClass('outline')}>{tx('Bỏ từ khoá', 'Drop the keyword', '검색어 지우기')}</Link>}
                <Link to="/requests?post=1" className={buttonClass('default')}>{tx('Đăng yêu cầu nhập khẩu', 'Post an import request', '수입 요청 등록')}</Link>
              </div>
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
              <Button variant="outline" disabled={loadingMore} onClick={loadMore}>{tx('Xem thêm', 'Load more', '더 보기')} · {formatNumber(results.length, locale)}/{formatNumber(total, locale)}</Button>
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
                <button onClick={() => setFiltersOpen(false)} className="grid size-11 place-items-center rounded-full hover:bg-primary-soft hover:text-primary" aria-label={t.ui.close}><X className="size-4" /></button>
              </div>
              {filters}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
