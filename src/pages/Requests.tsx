/** RFQ layout: split header (pitch + inline post form) + tabular board. */
import { motion } from 'motion/react'
import { ArrowUpRight, FilePlus2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { browseImportRequests, getCategory } from '@/api'
import { categories, type ImportRequest } from '@/data/mock'
import { CountryChip } from '@/components/brand'
import { useToast } from '@/components/ui/overlay'
import { Button, Field, Input, Select, Skeleton, Textarea } from '@/components/ui/primitives'
import { SuccessState } from '@/pages/ProductDetail'
import { useI18n } from '@/lib/i18n'
import { cn, daysLeft, formatDate, formatMoney, formatNumber } from '@/lib/utils'

export default function Requests() {
  const { t, L, locale } = useI18n()
  const [params] = useSearchParams()
  const [cat, setCat] = useState('')
  const [list, setList] = useState<ImportRequest[] | null>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const q = (params.get('q') ?? '').toLowerCase()

  useEffect(() => {
    let alive = true
    setList(null)
    browseImportRequests(cat || undefined).then((r) => alive && setList(r))
    return () => {
      alive = false
    }
  }, [cat])

  useEffect(() => {
    if (params.get('post') === '1') setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400)
  }, [params])

  const filtered = list?.filter((r) => !q || L(r.requestName).toLowerCase().includes(q) || r.productType.toLowerCase().includes(q))

  return (
    <>
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-gold-soft/80 via-background to-primary-soft/60">
        <div className="container-page grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_460px] lg:py-16">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="lg:pt-6">
            <nav aria-label="Breadcrumb" className="text-[13px] text-muted-foreground">
              <Link to="/" className="hover:text-foreground">{t.common.home}</Link> / <span className="text-foreground">{t.nav.requests}</span>
            </nav>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-balance md:text-5xl">{t.requests.title}</h1>
            <p className="mt-4 max-w-lg text-lg text-muted-foreground">{t.requests.sub}</p>
            <ol className="mt-10 grid gap-6 sm:grid-cols-2">
              {t.home.steps.map((s, i) => (
                <motion.li key={s.t} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }} className="flex gap-3">
                  <span className="text-3xl font-extrabold leading-none text-gold/50">{i + 1}</span>
                  <div>
                    <p className="font-bold">{s.t}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{s.d}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </motion.div>
          <motion.div ref={formRef} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <PostForm />
          </motion.div>
        </div>
      </section>

      <section className="container-page mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-extrabold tracking-tight">{t.home.requestsTitle}</h2>
          <Select value={cat} onChange={(e) => setCat(e.target.value)} className="h-9 w-auto min-w-52 text-[13px]" aria-label={t.requests.category}>
            <option value="">{t.requests.allCats}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{L(c.categoryName)}</option>)}
          </Select>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border">
          <div className="hidden grid-cols-[minmax(0,2.4fr)_1fr_1fr_1.1fr_0.9fr_40px] gap-4 bg-muted/60 px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground md:grid">
            <span>{t.requests.name}</span>
            <span>{t.requests.quantity}</span>
            <span>{t.requests.targetPrice}</span>
            <span>{t.requests.buyer}</span>
            <span>{t.requests.deadline}</span>
            <span />
          </div>
          {!filtered ? (
            <div className="space-y-px">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-none" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="py-14 text-center text-muted-foreground">{t.common.noResults}</p>
          ) : (
            filtered.map((r, i) => {
              const left = daysLeft(r.endTime)
              const c = getCategory(r.categoryId)
              return (
                <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: i * 0.04 } }}>
                  <Link
                    to={`/requests/${r.id}`}
                    className="group grid gap-2 border-t px-5 py-4 transition-colors hover:bg-primary-soft/50 md:grid-cols-[minmax(0,2.4fr)_1fr_1fr_1.1fr_0.9fr_40px] md:items-center md:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold group-hover:text-primary">{L(r.requestName)}</p>
                      <p className="text-xs text-muted-foreground">{c ? L(c.categoryName) : r.productType}</p>
                    </div>
                    <span className="text-sm">{formatNumber(r.quantity, locale)} {r.unit}</span>
                    <span className="text-sm font-semibold">{formatMoney(r.price)}/{r.unit}</span>
                    <CountryChip code={r.country} label={r.organizationName} className="min-w-0 truncate" />
                    <span className={cn('text-sm', left <= 7 && 'font-semibold text-amber-600 dark:text-amber-400')}>{formatDate(r.endTime, locale)}</span>
                    <ArrowUpRight className="hidden size-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary md:block" />
                  </Link>
                </motion.div>
              )
            })
          )}
        </div>
      </section>
    </>
  )
}

/** POST /api/portal/import-requests */
function PostForm() {
  const { t, L } = useI18n()
  const toast = useToast()
  const [sent, setSent] = useState(false)

  return (
    <div className="rounded-2xl border bg-card shadow-2xl shadow-navy/10">
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <span className="grid size-9 place-items-center rounded-lg bg-gold-soft text-gold"><FilePlus2 className="size-4" /></span>
        <div>
          <p className="font-bold">{t.requests.postTitle}</p>
          <p className="text-xs text-muted-foreground">{t.requests.postDesc}</p>
        </div>
      </div>
      {sent ? (
        <SuccessState title={t.requests.posted} desc={t.requests.postedDesc} onClose={() => setSent(false)} />
      ) : (
        <form
          className="grid gap-4 p-6 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            setSent(true)
            toast({ kind: 'success', title: t.requests.posted })
          }}
        >
          <Field label={t.requests.name} htmlFor="pr-name" className="sm:col-span-2"><Input id="pr-name" required placeholder="Frozen shrimp HOSO 26/30" /></Field>
          <Field label={t.requests.category} htmlFor="pr-cat">
            <Select id="pr-cat" required defaultValue="">
              <option value="" disabled>—</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{L(c.categoryName)}</option>)}
            </Select>
          </Field>
          <Field label={t.requests.address} htmlFor="pr-addr"><Input id="pr-addr" required placeholder="Busan Port" /></Field>
          <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-2">
            <Field label={t.requests.quantity} htmlFor="pr-qty"><Input id="pr-qty" type="number" min={1} required /></Field>
            <Field label={t.requests.unit} htmlFor="pr-unit"><Select id="pr-unit" defaultValue="MT"><option>MT</option><option>kg</option><option>pcs</option><option>set</option></Select></Field>
          </div>
          <Field label={t.requests.price} htmlFor="pr-price"><Input id="pr-price" type="number" min={0} step="0.01" required /></Field>
          <Field label={t.requests.start} htmlFor="pr-start"><Input id="pr-start" type="date" required /></Field>
          <Field label={t.requests.end} htmlFor="pr-end"><Input id="pr-end" type="date" required /></Field>
          <Field label={t.requests.description} htmlFor="pr-desc" className="sm:col-span-2"><Textarea id="pr-desc" className="min-h-20" placeholder={t.product.messagePh} /></Field>
          <Button type="submit" variant="gold" size="lg" className="sm:col-span-2"><FilePlus2 /> {t.requests.post}</Button>
        </form>
      )}
    </div>
  )
}
