import { AnimatePresence, motion } from 'motion/react'
import { Award, CheckCircle2, CreditCard, Heart, MapPin, MessageSquare, Package, Send, Share2, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getBusiness, getCategory, getProduct } from '@/api'
import { products, type Product } from '@/data/mock'
import { CompanyMark, SectionHeader, Stars, VerifiedBadge } from '@/components/brand'
import { ProductCard } from '@/components/cards'
import { Reveal, Stagger, StaggerItem } from '@/components/effects'
import { Dialog, DialogContent, DialogTrigger, UnderlineTabs, useToast } from '@/components/ui/overlay'
import { Badge, Button, buttonClass, Field, Input, Skeleton, Textarea } from '@/components/ui/primitives'
import NotFound from '@/pages/NotFound'
import { useI18n } from '@/lib/i18n'
import { cn, formatMoney, formatNumber, img } from '@/lib/utils'

export default function ProductDetail() {
  const { id = '' } = useParams()
  const [product, setProduct] = useState<Product | null | undefined>(undefined)

  useEffect(() => {
    setProduct(undefined)
    getProduct(id).then(setProduct)
  }, [id])

  if (product === undefined) return <DetailSkeleton />
  if (product === null) return <NotFound />
  return <ProductView product={product} />
}

function ProductView({ product }: { product: Product }) {
  const { t, L, locale } = useI18n()
  const toast = useToast()
  const supplier = getBusiness(product.organizationId)!
  const category = getCategory(product.categoryId)
  const [active, setActive] = useState(0)
  const [tab, setTab] = useState('overview')
  const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 })
  const related = products.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 5)
  const more = related.length < 4 ? products.filter((p) => p.id !== product.id && !related.includes(p)).slice(0, 5 - related.length) : []

  return (
    <div className="container-page pt-6">
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
        <Link to="/" className="hover:text-foreground">{t.common.home}</Link> /
        <Link to="/search" className="hover:text-foreground">{t.nav.products}</Link> /
        {category && <><Link to={`/search?category=${category.id}`} className="hover:text-foreground">{L(category.categoryName)}</Link> /</>}
        <span className="line-clamp-1 text-foreground">{L(product.productName)}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] xl:grid-cols-[560px_1fr_300px]">
        {/* gallery */}
        <Reveal className="lg:sticky lg:top-32 lg:self-start">
          <div
            className="relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl border bg-muted"
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              setZoom({ on: true, x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
            }}
            onMouseLeave={() => setZoom((z) => ({ ...z, on: false }))}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.img
                key={active}
                src={img(product.productImages[active]!, 1100, 1100)}
                alt={L(product.productName)}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: zoom.on ? 1.9 : 1 }}
                exit={{ opacity: 0 }}
                transition={{ opacity: { duration: 0.35 }, scale: { duration: 0.35, ease: 'easeOut' } }}
                style={{ transformOrigin: `${zoom.x}% ${zoom.y}%` }}
                className="absolute inset-0 size-full object-cover"
              />
            </AnimatePresence>
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              {product.certificates.map((c) => (
                <Badge key={c} variant="outline" className="border-white/40 bg-black/40 text-white backdrop-blur-md"><Award /> {c}</Badge>
              ))}
            </div>
          </div>
          <div className="mt-3 flex gap-2.5">
            {product.productImages.map((im, i) => (
              <button key={im + i} onClick={() => setActive(i)} className="relative size-20 overflow-hidden rounded-xl bg-muted" aria-label={`Image ${i + 1}`}>
                <img src={img(im, 200, 200)} alt="" className={cn('size-full object-cover transition', active !== i && 'opacity-60 hover:opacity-100')} />
                {active === i && <motion.span layoutId="thumb-ring" className="absolute inset-0 rounded-xl ring-2 ring-primary ring-inset" />}
              </button>
            ))}
          </div>
        </Reveal>

        {/* info */}
        <div>
          <Reveal>
            <div className="flex flex-wrap items-center gap-2">
              {category && <Badge variant="secondary">{L(category.categoryName)}</Badge>}
              <span className="font-mono text-xs text-muted-foreground">{product.productCode}</span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight md:text-[32px]">{L(product.productName)}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> {product.origin}</span>
              <span>{formatNumber(product.viewCount, locale)} {t.common.views}</span>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="mt-6 overflow-hidden rounded-2xl border bg-gradient-to-br from-primary-soft/70 via-card to-card">
            <div className="grid grid-cols-2 divide-x">
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.common.fob}</p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-primary">{formatMoney(product.priceFob)}</p>
                <p className="text-xs text-muted-foreground">/ {product.unit}</p>
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.common.cif}</p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight">{formatMoney(product.priceCif)}</p>
                <p className="text-xs text-muted-foreground">/ {product.unit}</p>
              </div>
            </div>
            <p className="border-t bg-muted/40 px-5 py-2.5 text-xs text-muted-foreground">{t.product.priceNote}</p>
          </Reveal>

          <Stagger className="mt-5 grid grid-cols-2 gap-3">
            {[
              { icon: Package, label: t.common.moq, value: `${formatNumber(product.moq, locale)} ${product.unit}` },
              { icon: MapPin, label: t.common.origin, value: product.origin },
              { icon: CreditCard, label: t.common.payment, value: product.paymentTerms },
              { icon: ShieldCheck, label: t.common.certificates, value: product.certificates.join(', ') },
            ].map((it) => (
              <StaggerItem key={it.label} className="flex gap-3 rounded-xl border p-3.5">
                <it.icon className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{it.label}</p>
                  <p className="mt-0.5 text-sm font-semibold">{it.value}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <RfqDialog product={product} />
            <Button variant="outline" size="lg" onClick={() => toast({ kind: 'info', title: t.product.chatNow, description: supplier.name })}>
              <MessageSquare /> {t.product.chatNow}
            </Button>
            <Button variant="ghost" size="icon" className="size-12 rounded-xl" aria-label={t.product.addFav} onClick={() => toast({ kind: 'success', title: t.product.addFav })}><Heart /></Button>
            <Button variant="ghost" size="icon" className="size-12 rounded-xl" aria-label={t.product.share} onClick={() => toast({ kind: 'info', title: t.product.share })}><Share2 /></Button>
          </div>

          <div className="mt-10">
            <UnderlineTabs
              layoutId="pd-tabs"
              value={tab}
              onValueChange={setTab}
              items={[
                { value: 'overview', label: t.product.overview },
                { value: 'specs', label: t.product.specs },
                { value: 'certs', label: t.product.certs },
              ]}
            />
            <AnimatePresence mode="wait">
              <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="py-5">
                {tab === 'overview' && <p className="leading-relaxed text-foreground/85">{L(product.description)}</p>}
                {tab === 'specs' && (
                  <dl className="divide-y rounded-xl border">
                    {[
                      { label: 'Mã sản phẩm / Code', value: product.productCode },
                      { label: t.searchPage.category, value: category ? L(category.categoryName) : product.industry },
                      { label: t.common.origin, value: product.origin },
                      { label: t.common.unit, value: product.unit },
                      { label: t.common.moq, value: `${formatNumber(product.moq, locale)} ${product.unit}` },
                      { label: t.common.payment, value: product.paymentTerms },
                    ].map((r) => (
                      <div key={r.label} className="grid grid-cols-[150px_1fr] gap-4 px-4 py-3 text-sm">
                        <dt className="text-muted-foreground">{r.label}</dt>
                        <dd className="font-medium">{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {tab === 'certs' && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {product.certificates.map((c) => (
                      <div key={c} className="flex items-center gap-3 rounded-xl border p-4">
                        <div className="grid size-10 place-items-center rounded-lg bg-gold-soft text-gold"><Award className="size-5" /></div>
                        <div>
                          <p className="font-semibold">{c}</p>
                          <p className="text-xs text-muted-foreground">PDF · 2026</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* supplier sticky */}
        <aside className="lg:col-span-2 xl:col-span-1">
          <Reveal className="rounded-2xl border bg-card p-5 xl:sticky xl:top-32">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.product.supplierCard}</p>
            <div className="mt-4 flex items-start gap-3">
              <CompanyMark name={supplier.nameEn} accent={supplier.accent} className="size-12" />
              <div className="min-w-0">
                <Link to={`/suppliers/${supplier.id}`} className="line-clamp-2 font-bold leading-snug hover:text-primary">{supplier.name}</Link>
                <div className="mt-1.5 flex items-center gap-2"><VerifiedBadge /><Stars score={supplier.reputationScore} /></div>
              </div>
            </div>
            <dl className="mt-5 space-y-2.5 text-sm">
              {[
                [t.supplier.businessType, t.supplier.types[supplier.businessType]],
                [t.supplier.address, supplier.province],
                [t.common.employees, supplier.employees],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <Link to={`/suppliers/${supplier.id}`} className={buttonClass('outline', 'md', 'mt-5 w-full')}>{t.product.visitProfile}</Link>
          </Reveal>
        </aside>
      </div>

      <section className="mt-20">
        <SectionHeader title={t.product.related} />
        <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {[...related, ...more].map((p) => <StaggerItem key={p.id}><ProductCard product={p} className="h-full" /></StaggerItem>)}
        </Stagger>
      </section>
    </div>
  )
}

function RfqDialog({ product }: { product: Product }) {
  const { t, L } = useI18n()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSent(false) }}>
      <DialogTrigger asChild>
        <Button size="lg" className="flex-1 sm:flex-none"><Send /> {t.common.sendInquiry}</Button>
      </DialogTrigger>
      <DialogContent title={t.product.rfqTitle} description={t.product.rfqDesc}>
        <AnimatePresence mode="wait">
          {sent ? (
            <SuccessState key="ok" title={t.product.sent} desc={t.product.sentDesc} onClose={() => setOpen(false)} />
          ) : (
            <motion.form
              key="form"
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 p-6"
              onSubmit={(e) => {
                e.preventDefault()
                setSent(true)
                toast({ kind: 'success', title: t.product.sent, description: L(product.productName) })
              }}
            >
              <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
                <img src={img(product.productImages[0]!, 120, 120)} alt="" className="size-12 rounded-lg object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{L(product.productName)}</p>
                  <p className="text-xs text-muted-foreground">{t.common.moq}: {product.moq} {product.unit} · FOB {formatMoney(product.priceFob)}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t.product.quantity} htmlFor="rfq-q"><Input id="rfq-q" type="number" min={product.moq} defaultValue={product.moq} required /></Field>
                <Field label={t.product.destination} htmlFor="rfq-d"><Input id="rfq-d" placeholder="Busan, KR" required /></Field>
              </div>
              <Field label={t.product.message} htmlFor="rfq-m"><Textarea id="rfq-m" placeholder={t.product.messagePh} required /></Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>{t.common.cancel}</Button>
                <Button type="submit"><Send /> {t.common.submit}</Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

export function SuccessState({ title, desc, onClose }: { title: string; desc: string; onClose: () => void }) {
  const { t } = useI18n()
  return (
    <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center px-6 py-10 text-center">
      <div className="relative">
        <motion.span className="absolute inset-0 rounded-full bg-success/25" initial={{ scale: 0.6, opacity: 1 }} animate={{ scale: 2.2, opacity: 0 }} transition={{ duration: 1.2, repeat: 2 }} />
        <motion.div initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="relative grid size-16 place-items-center rounded-full bg-success text-white">
          <CheckCircle2 className="size-8" />
        </motion.div>
      </div>
      <p className="mt-5 text-lg font-bold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{desc}</p>
      <Button className="mt-6" onClick={onClose}>{t.common.done}</Button>
    </motion.div>
  )
}

function DetailSkeleton() {
  return (
    <div className="container-page grid gap-8 pt-12 lg:grid-cols-2">
      <Skeleton className="aspect-square rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      </div>
    </div>
  )
}
