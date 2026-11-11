/** Directory layout: light header + business-type tabs + industry rail + horizontal rows. */
import { AnimatePresence, motion } from 'motion/react'
import { LayoutGrid, List } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchBusinesses } from '@/api'
import { categories, type Business, type BusinessType } from '@/data/mock'
import { categoryIcons } from '@/components/brand'
import { SupplierCard, SupplierRow } from '@/components/cards'
import { HeroSearch } from '@/components/HeroSearch'
import { PageHero } from '@/components/PageHero'
import { Skeleton } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const TYPES: ('ALL' | BusinessType)[] = ['ALL', 'VN_EXPORTER', 'FOREIGN_IMPORTER', 'DISTRIBUTION_COMPANY', 'INVESTMENT_CONSULTING', 'LAW_FIRM']

export default function Suppliers() {
  const { t, L, lang } = useI18n()
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [cat, setCat] = useState('')
  const [type, setType] = useState<string>('ALL')
  const [list, setList] = useState<Business[] | null>(null)
  const [view, setView] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    let alive = true
    setList(null)
    const id = setTimeout(() => searchBusinesses(q, cat || undefined, type).then((r) => alive && setList(r.filter((b) => type === 'ALL' || b.businessType === type)), () => alive && setList([])), 200)
    return () => {
      alive = false
      clearTimeout(id)
    }
  }, [q, cat, type, lang])

  return (
    <>
      <PageHero
        tone="brand"
        crumbs={[{ label: t.common.home, to: '/' }, { label: t.nav.suppliers }]}
        title={t.supplier.directoryTitle}
        subtitle={t.supplier.directorySub}
      >
        <HeroSearch value={q} onChange={setQ} placeholder={t.search.scopes.suppliers + '…'} label={t.search.scopes.suppliers} />
        <div role="group" aria-label={t.supplier.businessType} className="mt-5 flex flex-wrap gap-x-3 gap-y-2.5">
          {TYPES.map((k) => {
            const on = type === k
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                onClick={() => setType(k)}
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
                <button onClick={() => setCat(c.id)} className={cn('relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium', cat === c.id ? 'text-primary' : 'text-foreground/75 hover:text-foreground')}>
                  {cat === c.id && <motion.span layoutId="sup-cat" className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary" />}
                  {c.icon && <c.icon className="size-4" />}
                  <span className="truncate">{c.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{list ? `${list.length} ${t.searchPage.results}` : t.common.loading}</p>
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
                  <motion.div key={b.id} layout initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.05, duration: 0.5 } }} exit={{ opacity: 0, scale: 0.95 }}>
                    <SupplierCard business={b} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {list.map((b, i) => (
                <motion.div key={b.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }} exit={{ opacity: 0 }}>
                  <SupplierRow business={b} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </>
  )
}
