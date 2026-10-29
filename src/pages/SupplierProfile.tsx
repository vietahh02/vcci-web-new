/** Storefront layout: identity on the cover + the company's own sticky tab bar (mini-site). Fields = BusinessDetail DTO. */
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react'
import { BadgeCheck, Building2, Download, FileText, Globe, Mail, MapPin, MessageSquare, Phone, Plus, Send, Users } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getBusiness, productsOf } from '@/api'
import type { Business } from '@/data/mock'
import { CompanyMark, Stars, VerifiedBadge } from '@/components/brand'
import { ProductCard } from '@/components/cards'
import { Dialog, DialogContent, DialogTrigger, useToast } from '@/components/ui/overlay'
import { Button, Field, Input, Textarea } from '@/components/ui/primitives'
import NotFound from '@/pages/NotFound'
import { SuccessState } from '@/pages/ProductDetail'
import { useI18n } from '@/lib/i18n'
import { cn, formatDate, img } from '@/lib/utils'

type Tab = 'overview' | 'products' | 'capability' | 'contact'

export default function SupplierProfile() {
  const { id = '' } = useParams()
  const { t, L, locale } = useI18n()
  const toast = useToast()
  const b = getBusiness(id)
  const [tab, setTab] = useState<Tab>('overview')
  const [following, setFollowing] = useState(false)
  const coverRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: coverRef, offset: ['start start', 'end start'] })
  const coverY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])

  if (!b) return <NotFound />
  const items = productsOf(b.id)

  return (
    <div>
      {/* cover with identity */}
      <div ref={coverRef} className="relative isolate overflow-hidden bg-navy text-white">
        <motion.img style={{ y: coverY }} src={img(b.coverImage, 1800, 700)} alt="" className="absolute inset-0 -z-20 size-full scale-110 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/80 to-navy/30" />
        <div className="container-page flex min-h-72 flex-col justify-end gap-6 py-10 md:flex-row md:items-end md:justify-between">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-5">
            <CompanyMark name={b.nameEn} accent={b.accent} className="size-20 rounded-2xl text-2xl ring-4 ring-white/15 md:size-24" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {b.verified && <VerifiedBadge className="bg-white/90" />}
                <span className="text-xs text-white/70">{t.supplier.types[b.businessType]}</span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight md:text-4xl">{b.name}</h1>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/75">
                <Stars score={b.reputationScore} className="text-white" />
                <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> {b.province}</span>
                <span className="inline-flex items-center gap-1.5"><Users className="size-4" /> {b.employees}</span>
              </p>
            </div>
          </motion.div>
          <div className="flex gap-2">
            <Button variant="ghost" className="border border-white/25 text-white hover:bg-white/10" onClick={() => { setFollowing((v) => !v); if (!following) toast({ kind: 'success', title: t.supplier.follow, description: b.name }) }}>
              {following ? <BadgeCheck /> : <Plus />} {t.supplier.follow}
            </Button>
            <ContactDialog name={b.name} email={b.email} />
          </div>
        </div>
      </div>

      {/* storefront nav */}
      <div className="sticky top-[112px] z-30 border-b bg-background/95 backdrop-blur max-lg:top-[68px]">
        <div className="container-page flex items-center gap-6">
          <span className="hidden shrink-0 items-center gap-2 py-3 lg:flex">
            <CompanyMark name={b.nameEn} accent={b.accent} className="size-7 rounded-md text-[10px]" />
            <span className="max-w-56 truncate text-sm font-bold">{b.name}</span>
          </span>
          <div className="no-scrollbar flex gap-1 overflow-x-auto">
            {(Object.keys(t.supplier.tabs) as Tab[]).map((k) => (
              <button key={k} onClick={() => setTab(k)} className={cn('relative shrink-0 px-3 py-4 text-sm font-semibold transition-colors', tab === k ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>
                {t.supplier.tabs[k]}
                {tab === k && <motion.span layoutId="store-tab" className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-page">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="py-10">
            {tab === 'overview' && (
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div>
                  <h2 className="text-xl font-bold">{t.supplier.about}</h2>
                  <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-foreground/85">{L(b.description)}</p>
                  <div className="mt-10 flex items-end justify-between">
                    <h3 className="text-xl font-bold">{t.nav.products}</h3>
                    {items.length > 3 && <button onClick={() => setTab('products')} className="text-sm font-semibold text-primary">{t.common.viewAll}</button>}
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3">
                    {items.slice(0, 3).map((p) => <ProductCard key={p.id} product={p} />)}
                  </div>
                </div>
                <InfoCard b={b} />
              </div>
            )}
            {tab === 'products' && (
              <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
                {items.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
            {tab === 'capability' && (
              <div className="max-w-3xl">
                <h2 className="text-xl font-bold">{t.supplier.documents}</h2>
                <div className="mt-4 divide-y border-y">
                  {b.documents.map((d) => (
                    <div key={d.id} className="flex items-center gap-4 py-4">
                      <FileText className="size-6 shrink-0 text-red-600" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.type} · {formatDate(d.uploadedAt, locale)}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => toast({ kind: 'info', title: t.supplier.download, description: d.name })}><Download /> {t.supplier.download}</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab === 'contact' && <div className="max-w-xl"><InfoCard b={b} /></div>}
          </motion.div>
        </AnimatePresence>
        <Link to="/suppliers" className="text-sm font-semibold text-primary">← {t.supplier.directoryTitle}</Link>
      </div>
    </div>
  )
}

function InfoCard({ b }: { b: Business }) {
  const { t } = useI18n()
  return (
    <dl className="h-fit space-y-4 rounded-2xl bg-muted/50 p-6 text-sm">
      {[
        { icon: Building2, k: t.supplier.taxCode, v: b.taxCode },
        { icon: MapPin, k: t.supplier.address, v: `${b.address}, ${b.province}` },
        { icon: Globe, k: t.supplier.website, v: b.website },
        { icon: Mail, k: t.supplier.email, v: b.email },
        { icon: Phone, k: t.supplier.phone, v: b.phone },
      ].map((r) => (
        <div key={r.k} className="flex gap-3">
          <r.icon className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">{r.k}</dt>
            <dd className="break-words font-medium">{r.v}</dd>
          </div>
        </div>
      ))}
    </dl>
  )
}

/** POST /api/business/{businessId}/rfq/email */
function ContactDialog({ name, email }: { name: string; email: string }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSent(false) }}>
      <DialogTrigger asChild>
        <Button variant="gold"><MessageSquare /> {t.supplier.contactSupplier}</Button>
      </DialogTrigger>
      <DialogContent title={t.supplier.contactSupplier} description={name}>
        {sent ? (
          <SuccessState title={t.product.sent} desc={t.product.sentDesc} onClose={() => setOpen(false)} />
        ) : (
          <form className="space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
            <Field label={t.requests.to} htmlFor="c-to"><Input id="c-to" value={email} readOnly className="bg-muted" /></Field>
            <Field label={t.requests.subject} htmlFor="c-sub"><Input id="c-sub" required placeholder="RFQ – …" /></Field>
            <Field label={t.product.message} htmlFor="c-msg"><Textarea id="c-msg" required placeholder={t.product.messagePh} /></Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>{t.common.cancel}</Button>
              <Button type="submit"><Send /> {t.common.submit}</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
