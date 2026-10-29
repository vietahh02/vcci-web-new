/** Directory layout: light header + business-type tabs + industry rail + horizontal rows. */
import { AnimatePresence, motion } from 'motion/react'
import { LayoutGrid, List, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { searchBusinesses } from '@/api'
import { categories, type Business, type BusinessType } from '@/data/mock'
import { categoryIcons } from '@/components/brand'
import { SupplierCard, SupplierRow } from '@/components/cards'
import { UnderlineTabs } from '@/components/ui/overlay'
import { Skeleton } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const TYPES: ('ALL' | BusinessType)[] = ['ALL', 'VN_EXPORTER', 'FOREIGN_IMPORTER', 'DISTRIBUTION_COMPANY', 'INVESTMENT_CONSULTING', 'LAW_FIRM']

export default function Suppliers() {
  const { t, L } = useI18n()
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [cat, setCat] = useState('')
  const [type, setType] = useState<string>('ALL')
  const [list, setList] = useState<Business[] | null>(null)
  const [view, setView] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    let alive = true
    setList(null)
    const id = setTimeout(() => searchBusinesses(q, cat || undefined).then((r) => alive && setList(r.filter((b) => type === 'ALL' || b.businessType === type))), 200)
    return () => {
      alive = false
      clearTimeout(id)
    }
  }, [q, cat, type])

  return (
    <div className="container-page pt-8">
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted-foreground">
        <Link to="/" className="hover:text-foreground">{t.common.home}</Link> / <span className="text-foreground">{t.nav.suppliers}</span>
      </nav>
      <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,1fr)_420px] md:items-end">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-[40px]">{t.supplier.directoryTitle}</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">{t.supplier.directorySub}</p>
        </motion.div>
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.search.scopes.suppliers + '…'}
            aria-label={t.search.scopes.suppliers}
            className="h-12 w-full rounded-full border-2 border-input bg-background pl-12 pr-4 outline-none transition focus:border-primary"
          />
        </label>
      </div>

      <UnderlineTabs
        className="mt-8"
        layoutId="sup-type"
        value={type}
        onValueChange={setType}
        items={TYPES.map((k) => ({ value: k, label: k === 'ALL' ? t.searchPage.all : t.supplier.types[k] }))}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
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
                <button key={v} onClick={() => setView(v)} className={cn('relative rounded-md p-1.5 transition-colors', view === v ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')} aria-label={v} aria-pressed={view === v}>
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
    </div>
  )
}
