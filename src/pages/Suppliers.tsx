/** Directory layout: light header + business-type tabs + industry rail + horizontal rows. */
import { AnimatePresence, motion } from 'motion/react'
import { LayoutGrid, List } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchBusinessesPage } from '@/api'
import { categories, type Business, type BusinessType } from '@/data/mock'
import { categoryIcons } from '@/components/brand'
import { SupplierCard, SupplierRow } from '@/components/cards'
import { HeroSearch } from '@/components/HeroSearch'
import { PageHero } from '@/components/PageHero'
import { Pagination } from '@/components/Pagination'
import { Skeleton } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'
import { cn, formatNumber } from '@/lib/utils'

const TYPES: ('ALL' | BusinessType)[] = ['ALL', 'VN_EXPORTER', 'FOREIGN_IMPORTER', 'DISTRIBUTION_COMPANY', 'INVESTMENT_CONSULTING', 'LAW_FIRM']
const PAGE_SIZE = 21

export default function Suppliers() {
  const { t, L, lang, locale } = useI18n()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [cat, setCat] = useState('')
  const [type, setType] = useState<string>('ALL')
  const [list, setList] = useState<Business[] | null>(null)
  const [total, setTotal] = useState(0)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const listTop = useRef<HTMLDivElement>(null)

  // paging is done by the BE; the page lives in ?page= so Back and shared links keep it
  const pageNo = Math.max(1, Math.floor(Number(params.get('page'))) || 1)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const goPage = (n: number) => {
    setParams((p) => { const next = new URLSearchParams(p); if (n <= 1) next.delete('page'); else next.set('page', String(n)); return next })
    const el = listTop.current
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 110, behavior: 'smooth' })
  }
  // a new search / category / type restarts from page 1
  const refilter = (apply: () => void) => {
    apply()
    if (params.has('page')) setParams((p) => { const next = new URLSearchParams(p); next.delete('page'); return next }, { replace: true })
  }

  useEffect(() => {
    let alive = true
    setList(null)
    const id = setTimeout(() => searchBusinessesPage(q, cat || undefined, type, pageNo - 1, PAGE_SIZE).then((r) => { if (alive) { setList(r.items); setTotal(r.total) } }, () => { if (alive) { setList([]); setTotal(0) } }), 200)
    return () => {
      alive = false
      clearTimeout(id)
    }
  }, [q, cat, type, lang, pageNo])

  // an old link to a page that no longer exists (fewer businesses now): go to the last page
  useEffect(() => {
    if (list && total > 0 && pageNo > totalPages) goPage(totalPages)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, total, pageNo, totalPages])

  return (
    <>
      <PageHero
        tone="brand"
        crumbs={[{ label: t.common.home, to: '/' }, { label: t.nav.suppliers }]}
        title={t.supplier.directoryTitle}
        subtitle={t.supplier.directorySub}
      >
        <HeroSearch value={q} onChange={(v) => refilter(() => setQ(v))}placeholder={t.search.scopes.suppliers + '…'} label={t.search.scopes.suppliers} />
        <div role="group" aria-label={t.supplier.businessType} className="mt-5 flex flex-wrap gap-x-3 gap-y-2.5">
          {TYPES.map((k) => {
            const on = type === k
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                onClick={() => refilter(() => setType(k))}
                className={cn('h-11 rounded-full border px-5 text-[15px] font-semibold transition-colors', on ? 'border-primary bg-primary text-primary-foreground shadow-[0_8px_18px_-10px_rgba(0,102,153,0.9)]' : 'border-primary/50 bg-white/50 text-primary hover:border-primary hover:bg-white dark:border-white/25 dark:bg-white/5 dark:text-[#cfe9f8] dark:hover:bg-white/10')}
              >
                {k === 'ALL' ? t.searchPage.all : t.supplier.types[k]}
              </button>
            )
          })}
        </div>
      </PageHero>

      <div className="container-page mt-2 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.searchPage.category}</p>
          <ul className="space-y-0.5">
            {[{ id: '', name: t.searchPage.all, icon: null }, ...categories.map((c) => ({ id: c.id, name: L(c.categoryName), icon: categoryIcons[c.icon] }))].map((c) => (
              <li key={c.id}>
                <button onClick={() => refilter(() => setCat(c.id))}className={cn('relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium', cat === c.id ? 'text-primary' : 'text-foreground/75 hover:text-foreground')}>
                  {cat === c.id && <motion.span layoutId="sup-cat" className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary" />}
                  {c.icon && <c.icon className="size-4" />}
                  <span className="truncate">{c.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div ref={listTop}>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{list ? `${formatNumber(total, locale)} ${t.searchPage.results}${totalPages > 1 ? ` · ${tx('trang', 'page', '페이지')} ${formatNumber(pageNo, locale)}/${formatNumber(totalPages, locale)}` : ''}` : t.common.loading}</p>
            <div className="flex rounded-lg border p-0.5">
              {(['grid', 'list'] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className={cn('relative rounded-full p-1.5 transition-colors', view === v ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')} aria-label={v} aria-pressed={view === v}>
                  {view === v && <motion.span layoutId="sup-view" className="absolute inset-0 rounded-md bg-muted" />}
                  {v === 'grid' ? <LayoutGrid className="relative size-4" /> : <List className="relative size-4" />}
                </button>
              ))}
            </div>
          </div>
          {!list ? (
            <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}</div>
          ) : list.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">{t.common.noResults}</p>
          ) : view === 'grid' ? (
            <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {list.map((b, i) => (
                  <motion.div key={b.id} layout initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: Math.min(i, 9) * 0.05, duration: 0.5 } }} exit={{ opacity: 0, scale: 0.95 }}>
                    <SupplierCard business={b} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {list.map((b, i) => (
                <motion.div key={b.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 9) * 0.04 } }} exit={{ opacity: 0 }}>
                  <SupplierRow business={b} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {list && list.length > 0 && totalPages > 1 && <Pagination page={pageNo} pages={totalPages} onChange={goPage} label={tx('Phân trang', 'Pagination', '페이지 이동')} />}
        </div>
      </div>
    </>
  )
}
