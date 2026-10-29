import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarClock, FileUp, MapPin, Package, Paperclip, Send, Tag, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCategory, getImportRequest, searchProducts } from '@/api'
import { importRequests, type Product } from '@/data/mock'
import { CountryChip, SectionHeader } from '@/components/brand'
import { ProductCard, RequestCard } from '@/components/cards'
import { Countdown, Reveal } from '@/components/effects'
import { SheetContent, useToast } from '@/components/ui/overlay'
import { Badge, Button, Field, Input, Textarea } from '@/components/ui/primitives'
import NotFound from '@/pages/NotFound'
import { SuccessState } from '@/pages/ProductDetail'
import { useI18n } from '@/lib/i18n'
import { formatDate, formatMoney, formatNumber } from '@/lib/utils'

export default function RequestDetail() {
  const { id = '' } = useParams()
  const { t, L, lang, locale } = useI18n()
  const r = getImportRequest(id)
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [matches, setMatches] = useState<Product[]>([])

  useEffect(() => {
    if (r) searchProducts({ categoryId: r.categoryId }).then((p) => setMatches(p.slice(0, 4)))
  }, [r, lang])

  if (!r) return <NotFound />
  const cat = getCategory(r.categoryId)
  const others = importRequests.filter((x) => x.id !== r.id).slice(0, 4)

  return (
    <div className="container-page pt-6">
      <nav aria-label={t.ui.breadcrumb} className="mb-5 flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
        <Link to="/" className="hover:text-foreground">{t.common.home}</Link> / <Link to="/requests" className="hover:text-foreground">{t.nav.requests}</Link> / <span className="text-foreground">{r.requestCode}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <Reveal>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success"><span className="size-1.5 rounded-full bg-success" /> {t.requests.open}</Badge>
            {cat && <Badge variant="muted">{L(cat.categoryName)}</Badge>}
            <span className="font-mono text-xs text-muted-foreground">{r.requestCode}</span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight md:text-4xl">{L(r.requestName)}</h1>

          <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { icon: Package, k: t.requests.quantity, v: `${formatNumber(r.quantity, locale)} ${r.unit}` },
              { icon: Tag, k: t.requests.targetPrice, v: `${formatMoney(r.price)}/${r.unit}` },
              { icon: MapPin, k: t.requests.destination, v: r.address },
              { icon: CalendarClock, k: t.requests.deadline, v: formatDate(r.endTime, locale) },
            ].map((s) => (
              <div key={s.k} className="rounded-xl border p-4">
                <s.icon className="size-4 text-primary" />
                <p className="mt-2 text-xs text-muted-foreground">{s.k}</p>
                <p className="mt-0.5 font-bold">{s.v}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-8 text-lg font-bold">{t.requests.detail}</h2>
          <p className="mt-2 leading-relaxed text-foreground/85">{L(r.description)}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            {t.requests.start}: {formatDate(r.startTime, locale)} · {t.requests.end}: {formatDate(r.endTime, locale)} · {r.productType}
          </p>
        </Reveal>

        <aside>
          <Reveal className="space-y-4 lg:sticky lg:top-32">
            <div className="overflow-hidden rounded-2xl border bg-card">
              <div className="bg-navy p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/60">{t.requests.deadline}</p>
                <Countdown target={r.endTime} labels={t.common.countdown} dark className="mt-2" />
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.requests.buyer}</p>
                <p className="mt-2 font-bold">{r.organizationName}</p>
                <CountryChip code={r.country} label={L(r.countryName)} className="mt-1" />
                <Button size="lg" className="mt-5 w-full" onClick={() => setQuoteOpen(true)}><Send /> {t.requests.sendQuote}</Button>
              </div>
            </div>
          </Reveal>
        </aside>
      </div>

      {matches.length > 0 && (
        <section className="mt-16">
          <SectionHeader title={t.product.related} />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{matches.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      )}
      <section className="mt-16">
        <SectionHeader title={t.home.requestsTitle} action={{ to: '/requests', label: t.common.viewAll }} />
        <div className="grid gap-4 md:grid-cols-2">{others.map((o) => <RequestCard key={o.id} request={o} />)}</div>
      </section>

      <QuoteSheet open={quoteOpen} onOpenChange={setQuoteOpen} to={r.organizationEmail} subject={`Quotation – ${r.requestCode} – ${L(r.requestName)}`} />
    </div>
  )
}

/** POST /api/portal/import-requests/{id}/quotes/email (multipart) */
function QuoteSheet({ open, onOpenChange, to, subject }: { open: boolean; onOpenChange: (v: boolean) => void; to: string; subject: string }) {
  const { t } = useI18n()
  const toast = useToast()
  const [files, setFiles] = useState<string[]>([])
  const [drag, setDrag] = useState(false)
  const [sent, setSent] = useState(false)

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSent(false); setFiles([]) } }}>
      <SheetContent title={t.requests.quoteTitle} description={t.requests.quoteDesc} className="max-w-lg">
        {sent ? (
          <SuccessState title={t.requests.quoteSent} desc={t.requests.quoteSentDesc} onClose={() => onOpenChange(false)} />
        ) : (
          <form className="space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); setSent(true); toast({ kind: 'success', title: t.requests.quoteSent }) }}>
            <Field label={t.requests.to} htmlFor="q-to"><Input id="q-to" value={to} readOnly className="bg-muted" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="CC" htmlFor="q-cc"><Input id="q-cc" type="email" placeholder="sales@company.vn" /></Field>
              <Field label="BCC" htmlFor="q-bcc"><Input id="q-bcc" type="email" /></Field>
            </div>
            <Field label={t.requests.subject} htmlFor="q-sub"><Input id="q-sub" defaultValue={subject} required /></Field>
            <Field label={t.requests.content} htmlFor="q-body"><Textarea id="q-body" className="min-h-36" required placeholder={t.ui.quotePh} /></Field>
            <div>
              <p className="mb-1.5 text-[13px] font-semibold">{t.requests.attachments}</p>
              <label
                onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); setFiles((f) => [...f, ...Array.from(e.dataTransfer.files).map((x) => x.name)]) }}
                className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition ${drag ? 'scale-[1.02] border-primary bg-primary-soft' : 'hover:border-primary/50 hover:bg-muted/50'}`}
              >
                <motion.div animate={drag ? { y: [0, -6, 0] } : { y: 0 }} transition={{ repeat: drag ? Infinity : 0, duration: 0.8 }}>
                  <FileUp className="size-7 text-primary" />
                </motion.div>
                <span className="text-xs text-muted-foreground">{t.requests.attachHint}</span>
                <input type="file" multiple className="sr-only" onChange={(e) => setFiles((f) => [...f, ...Array.from(e.target.files ?? []).map((x) => x.name)])} />
              </label>
              <ul className="mt-2 space-y-1.5">
                <AnimatePresence>
                  {files.map((f, i) => (
                    <motion.li key={f + i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs">
                      <Paperclip className="size-3.5" /> <span className="flex-1 truncate">{f}</span>
                      <button type="button" onClick={() => setFiles((x) => x.filter((_, k) => k !== i))} aria-label={t.ui.remove}><X className="size-3.5" /></button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
            <Button type="submit" size="lg" className="w-full"><Send /> {t.requests.sendQuote}</Button>
          </form>
        )}
      </SheetContent>
    </DialogPrimitive.Root>
  )
}
