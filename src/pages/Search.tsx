/** Marketplace listing: video hero + category tab bar overlapping its edge + filter sidebar + product grid. */
import { AnimatePresence, motion } from 'motion/react'
import { Infinity as InfinityIcon, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { catalogApi, searchProductsPage, tokens, USE_MOCK, type ProductQuery } from '@/api'
import { ErrorBlock } from '@/components/ui/StateViews'
import { categories, products, type Product } from '@/data/mock'
import { ProductCard } from '@/components/cards'
import { CategoryTabs, PageHero } from '@/components/PageHero'
import { Pagination } from '@/components/Pagination'
import { Badge, Button, buttonClass, Skeleton } from '@/components/ui/primitives'
import { Select } from '@/components/ui/select'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'
import { formatNumber } from '@/lib/utils'

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
  // đổi bộ lọc thì quay về trang 1
  const patchFilter = (fn: (n: URLSearchParams) => void) => patch((n) => { fn(n); n.delete('page') })
  const setMaxMoq = (v: number) => patchFilter((n) => (v ? n.set('moq', String(v)) : n.delete('moq')))
  const certsKey = params.getAll('cert').join('|')
  const certs = useMemo(() => (certsKey ? certsKey.split('|') : []), [certsKey])
  const setCerts = (next: string[]) => patchFilter((n) => { n.delete('cert'); next.forEach((c) => n.append('cert', c)) })
  const sorts = Object.keys(t.searchPage.sorts) as NonNullable<ProductQuery['sort']>[]
  const sortParam = params.get('sort') as NonNullable<ProductQuery['sort']> | null
  const sort = sortParam && sorts.includes(sortParam) ? sortParam : 'popular'
  const setSort = (v: NonNullable<ProductQuery['sort']>) => patchFilter((n) => (v === 'popular' ? n.delete('sort') : n.set('sort', v)))
  const [results, setResults] = useState<Product[] | null>(null)
  const [loadError, setLoadError] = useState<Error>()
  const [attempt, setAttempt] = useState(0)
  const [total, setTotal] = useState(0)
  const [facetCerts, setFacetCerts] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const listTop = useRef<HTMLDivElement>(null)
  // mỗi trang đúng 2 hàng: số sản phẩm = số cột của lưới x 2
  const cols = useGridCols()
  const pageSize = cols * 2
  const pageNo = Math.max(1, Math.floor(Number(params.get('page'))) || 1)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const query = (): ProductQuery => ({ keyword, categoryId: categoryId || undefined, maxMoq: maxMoq || undefined, certificates: certs, sort, page: pageNo - 1, size: pageSize })
  const goPage = (n: number) => {
    const next = new URLSearchParams(params)
    if (n <= 1) next.delete('page')
    else next.set('page', String(n))
    setParams(next)
    const el = listTop.current
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 110, behavior: 'smooth' })
  }

  // filters, sorting and paging are all applied by the BE; a new filter restarts from page 1
  useEffect(() => {
    let alive = true
    setResults(null)
    setLoadError(undefined)
    searchProductsPage(query()).then((r) => { if (alive) { setResults(r.items); setTotal(r.total) } }, (e: Error) => { if (alive) { setLoadError(e); setResults([]) } })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, categoryId, maxMoq, certsKey, sort, lang, attempt, pageNo, pageSize])

  // link cũ trỏ tới trang không còn tồn tại (số sản phẩm giảm): về trang cuối
  useEffect(() => {
    if (results && total > 0 && pageNo > totalPages) goPage(totalPages)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, total, pageNo, totalPages])

  useEffect(() => {
    if (!USE_MOCK) catalogApi.popularCertificates(12).then(setFacetCerts, () => undefined)
  }, [lang])

  // trạng thái tim của cả trang lấy bằng một request; khách chưa đăng nhập thì không gọi (nút vẫn bấm được, sẽ chuyển tới đăng nhập)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const idsKey = results?.map((p) => p.id).join(',') ?? ''
  useEffect(() => {
    if (USE_MOCK || !idsKey || !tokens.access()) { setFavorites(new Set()); return }
    let alive = true
    catalogApi.favoriteIds(idsKey.split(',')).then((s) => { if (alive) setFavorites(s) }, () => undefined)
    return () => { alive = false }
  }, [idsKey])

  const cat = categories.find((c) => c.id === categoryId)
  // live mode: certificate facets are the most used labels in the public catalogue (GET /api/products/certificates)
  const ALL_CERTS = USE_MOCK ? MOCK_CERTS : facetCerts
  const activeFilters = useMemo(() => [maxMoq ? `MOQ ≤ ${formatNumber(maxMoq, locale)}` : null, ...certs].filter(Boolean) as string[], [maxMoq, certs, locale])

  const setCategory = (id: string) => {
    const next = new URLSearchParams(params)
    if (id) next.set('category', id)
    else next.delete('category')
    next.delete('page')
    setParams(next)
  }
  const clearAll = () => patchFilter((n) => { n.delete('moq'); n.delete('cert') })

  // the BE total, not the page size: "215 results · page 2/27"
  const countLabel = totalPages > 1
    ? `${formatNumber(total, locale)} ${t.searchPage.results} · ${tx('trang', 'page', '페이지')} ${formatNumber(pageNo, locale)}/${formatNumber(totalPages, locale)}`
    : `${formatNumber(total, locale)} ${t.searchPage.results}`

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
      <PageHero
        titleKey={keyword + categoryId}
        crumbs={[
          { label: t.common.home, to: '/' },
          { label: t.nav.products, to: '/search' },
          ...(cat ? [{ label: L(cat.categoryName) }] : []),
        ]}
        title={keyword ? `“${keyword}”` : cat ? L(cat.categoryName) : t.nav.products}
        subtitle={loadError ? '' : !results ? t.common.loading : countLabel}
        tabs={
          <CategoryTabs
            label={t.searchPage.all}
            value={categoryId}
            onChange={setCategory}
            items={[{ id: '', name: t.searchPage.all }, ...categories.map((c) => ({ id: c.id, name: L(c.categoryName) }))]}
          />
        }
      />

      <div className="container-page mt-2 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-32 rounded-2xl bg-muted/60 p-5">
            <p className="mb-5 flex items-center gap-2 font-bold"><SlidersHorizontal className="size-4" /> {t.searchPage.filters}</p>
            {filters}
          </div>
        </aside>

        <div>
          <div ref={listTop} className="mb-6 flex flex-wrap items-center gap-3">
            <Button variant="outline" className="h-11 lg:hidden" onClick={() => setFiltersOpen(true)}><SlidersHorizontal /> {t.searchPage.filters}{activeFilters.length > 0 && ` (${activeFilters.length})`}</Button>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              {activeFilters.map((f) => <Badge key={f} variant="secondary" className="py-1">{f}</Badge>)}
              {activeFilters.length > 0 && <button onClick={clearAll} className="min-h-9 px-1 text-[13px] font-semibold text-primary hover:underline">{t.searchPage.clear}</button>}
            </div>
            <Select value={sort} onValueChange={setSort} className="h-11 w-auto min-w-44 text-[13px] lg:h-9" aria-label={t.searchPage.sort} options={(Object.keys(t.searchPage.sorts) as (keyof typeof t.searchPage.sorts)[]).map((k) => ({ value: k, label: t.searchPage.sorts[k] }))} />
          </div>

          {!results ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
              {Array.from({ length: pageSize }).map((_, i) => <div key={i} className="overflow-hidden rounded-2xl border bg-card"><Skeleton className="aspect-square rounded-none" /><div className="p-3.5"><Skeleton className="h-4" /><Skeleton className="mt-2 h-5 w-1/2" /></div></div>)}
            </div>
          ) : loadError ? (
            <ErrorBlock error={loadError} onRetry={() => setAttempt((n) => n + 1)} />
          ) : results.length === 0 ? (
            <div className="grid place-items-center rounded-3xl bg-muted/60 px-6 py-16 text-center">
              <SearchX className="size-10 text-muted-foreground" />
              <p className="mt-4 text-lg font-bold">{t.common.noResults}</p>
              <p className="mt-1 max-w-md text-[15px] text-foreground/80">{tx('Sửa từ khoá ở ô tìm kiếm phía trên, hoặc:', 'Edit the keyword in the search field above, or:', '위 검색창에서 검색어를 고치거나:')}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {(activeFilters.length > 0 || categoryId) && <Button variant="outline" onClick={() => patchFilter((n) => { n.delete('moq'); n.delete('cert'); n.delete('category') })}>{tx('Xoá bộ lọc và danh mục', 'Clear filters and category', '필터·카테고리 지우기')}</Button>}
                {keyword && <Link to={categoryId ? `/search?category=${categoryId}` : '/search'} className={buttonClass('outline')}>{tx('Bỏ từ khoá', 'Drop the keyword', '검색어 지우기')}</Link>}
                <Link to="/requests?post=1" className={buttonClass('default')}>{tx('Đăng yêu cầu nhập khẩu', 'Post an import request', '수입 요청 등록')}</Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
              {results.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.035 } }}>
                  <ProductCard product={p} favorite={favorites.has(p.id)} />
                </motion.div>
              ))}
            </div>
          )}
          {results && results.length > 0 && totalPages > 1 && <Pagination page={pageNo} pages={totalPages} onChange={goPage} label={tx('Phân trang', 'Pagination', '페이지 이동')} />}
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

/** Số cột của lưới sản phẩm (khớp grid-cols-2 / md:3 / xl:4) để mỗi trang luôn đúng 2 hàng. */
function useGridCols() {
  const read = () => (window.matchMedia('(min-width: 1280px)').matches ? 4 : window.matchMedia('(min-width: 768px)').matches ? 3 : 2)
  const [cols, setCols] = useState(read)
  useEffect(() => {
    const queries = [window.matchMedia('(min-width: 1280px)'), window.matchMedia('(min-width: 768px)')]
    const on = () => setCols(read())
    queries.forEach((q) => q.addEventListener('change', on))
    return () => queries.forEach((q) => q.removeEventListener('change', on))
  }, [])
  return cols
}

