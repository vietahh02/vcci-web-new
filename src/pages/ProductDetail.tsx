import { AnimatePresence, motion } from 'motion/react'
import { Award, CheckCircle2, CreditCard, MapPin, MessageSquare, Package, Send, Share2, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getCategory, getProduct, liveApi, USE_MOCK, useBusiness, useRelatedProducts } from '@/api'
import { openBusinessChat } from '@/api/chat'
import { businessStub } from '@/api/adapters/business'
import { type Product } from '@/data/mock'
import { ErrorBlock } from '@/components/ui/StateViews'
import { CompanyMark, SectionHeader, VerifiedBadge } from '@/components/brand'
import { ReputationStars } from '@/components/reputation/Reputation'
import { ProductCard } from '@/components/cards'
import { FavoriteButton } from '@/components/catalog/FavoriteButton'
import { Reveal, Stagger, StaggerItem } from '@/components/effects'
import { Dialog, DialogContent, DialogTrigger, UnderlineTabs, useToast } from '@/components/ui/overlay'
import { Badge, Button, buttonClass, Field, Input, Skeleton, Textarea } from '@/components/ui/primitives'
import NotFound from '@/pages/NotFound'
import { useI18n } from '@/lib/i18n'
import { useProfile } from '@/lib/profile'
import { tx } from '@/lib/tx'
import { cn, formatMoney, formatNumber, img } from '@/lib/utils'

export default function ProductDetail() {
  const { id = '' } = useParams()
  const { lang } = useI18n()
  const [product, setProduct] = useState<Product | null | undefined>(undefined)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setProduct(undefined)
    setError(null)
    getProduct(id).then(setProduct, setError)
  }, [id])

  // refetch BE-localized content on language switch, without the skeleton flash
  useEffect(() => {
    getProduct(id).then(setProduct, () => {})
  }, [lang]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <ErrorBlock error={error} onRetry={() => { setError(null); getProduct(id).then(setProduct, setError) }} />
  if (product === undefined) return <DetailSkeleton />
  if (product === null) return <NotFound />
  return <ProductView product={product} />
}

function ProductView({ product }: { product: Product }) {
  const { t, L, locale } = useI18n()
  const toast = useToast()
  const share = async () => {
    const url = window.location.href
    if (navigator.share) return navigator.share({ title: L(product.productName), url }).catch(() => undefined) // user closed the sheet
    await navigator.clipboard.writeText(url)
    toast({ kind: 'success', title: t.product.share, description: url })
  }
  const supplier = useBusiness(product.organizationId).data?.business ?? businessStub(product.organizationId, product.organizationName)
  const category = getCategory(product.categoryId)
  const [active, setActive] = useState(0)
  const [tab, setTab] = useState('overview')
  const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 })
  const related = useRelatedProducts(product.id, product.categoryId).data ?? []
  const none = tx('Chưa cung cấp', 'Not provided', '미제공')

  return (
    <div className="container-page pt-6">
      <nav aria-label={t.ui.breadcrumb} className="mb-5 flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
        <Link to="/" className="hover:text-foreground">{t.common.home}</Link> /
        <Link to="/search" className="hover:text-foreground">{t.nav.products}</Link> /
        {category && <><Link to={`/search?category=${category.id}`} className="hover:text-foreground">{L(category.categoryName)}</Link> /</>}
        <span className="line-clamp-1 text-foreground">{L(product.productName)}</span>
      </nav>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_280px]">
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
              <span className="text-[13px] tabular-nums text-muted-foreground">{t.ui.productCode} {product.productCode}</span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight md:text-[32px]">{L(product.productName)}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> {product.origin}</span>
              <span>{formatNumber(product.viewCount, locale)} {t.common.views}</span>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="mt-6 overflow-hidden rounded-2xl bg-primary-soft">
            <div className="grid grid-cols-2">
              <div className="p-5">
                <p className="text-[13px] font-semibold text-muted-foreground">{t.common.fob}</p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight text-primary">{product.priceFob ? formatMoney(product.priceFob) : none}</p>
                <p className="text-xs text-muted-foreground">/ {product.unit}</p>
              </div>
              <div className="p-5">
                <p className="text-[13px] font-semibold text-muted-foreground">{t.common.cif}</p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight">{product.priceCif ? formatMoney(product.priceCif) : none}</p>
                <p className="text-xs text-muted-foreground">/ {product.unit}</p>
              </div>
            </div>
            <p className="bg-background/60 px-5 py-3 text-[13px] leading-relaxed text-foreground/80">{t.product.priceNote}. {tx('FOB: giao lên tàu tại cảng xuất. CIF: gồm cước và bảo hiểm tới cảng đích.', 'FOB: loaded on board at the port of export. CIF: includes freight and insurance to the destination port.', 'FOB: 수출항 본선 인도. CIF: 도착항까지 운임·보험 포함.')} <Link to="/help#terms" className="font-semibold text-primary hover:underline">{tx('Giải thích thuật ngữ', 'Glossary', '용어 설명')}</Link></p>
          </Reveal>

          <Stagger className="mt-5 grid grid-cols-2 gap-3">
            {[
              { icon: Package, label: tx('MOQ · đặt tối thiểu', 'MOQ · minimum order', 'MOQ · 최소 주문'), value: product.moq ? `${formatNumber(product.moq, locale)} ${product.unit}` : none },
              { icon: MapPin, label: t.common.origin, value: product.origin || none },
              { icon: CreditCard, label: t.common.payment, value: product.paymentTerms || none },
              { icon: ShieldCheck, label: t.common.certificates, value: product.certificates.join(', ') || none },
            ].map((it) => (
              <StaggerItem key={it.label} className="flex gap-3 rounded-xl bg-muted/60 p-3.5">
                <it.icon className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-[13px] text-muted-foreground">{it.label}</p>
                  <p className={cn('mt-0.5 text-sm font-semibold', it.value === none && 'font-normal text-muted-foreground')}>{it.value}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <RfqDialog product={product} />
            <Button variant="outline" size="lg" onClick={() => { if (USE_MOCK) toast({ kind: 'info', title: t.product.chatNow, description: supplier.name }); else openBusinessChat(product.organizationId) }}>
              <MessageSquare /> {t.product.chatNow}
            </Button>
            <FavoriteButton productId={product.id} className="size-12 rounded-xl" />
            <Button variant="ghost" size="icon" className="size-12 rounded-xl" aria-label={t.product.share} onClick={() => void share()}><Share2 /></Button>
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
                {tab === 'overview' && <p className="leading-relaxed text-foreground/90">{L(product.description) || none}</p>}
                {tab === 'specs' && (
                  <dl className="divide-y rounded-xl border">
                    {[
                      { label: t.ui.productCode, value: product.productCode },
                      { label: t.searchPage.category, value: category ? L(category.categoryName) : product.industry },
                      { label: t.common.origin, value: product.origin || none },
                      { label: t.common.unit, value: product.unit || none },
                      { label: t.common.moq, value: product.moq ? `${formatNumber(product.moq, locale)} ${product.unit}` : none },
                      { label: t.common.payment, value: product.paymentTerms || none },
                    ].map((r) => (
                      <div key={r.label} className="grid grid-cols-[150px_1fr] gap-4 px-4 py-3 text-sm">
                        <dt className="text-muted-foreground">{r.label}</dt>
                        <dd className="font-medium">{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {tab === 'certs' && (
                  product.certificates.length ? <div className="grid gap-3 sm:grid-cols-2">
                    {product.certificates.map((c) => (
                      <div key={c} className="flex items-center gap-3 rounded-xl bg-muted/60 p-4">
                        <div className="grid size-10 place-items-center rounded-lg bg-gold-soft text-gold"><Award className="size-5" /></div>
                        <p className="font-semibold">{c}</p>
                      </div>
                    ))}
                  </div> : <p className="text-muted-foreground">{tx('Nhà cung cấp chưa khai chứng nhận cho sản phẩm này.', 'The supplier has not listed certificates for this product.', '공급업체가 이 상품의 인증을 등록하지 않았습니다.')}</p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* supplier sticky */}
        <aside className="lg:col-start-2 xl:col-start-auto">
          <Reveal className="rounded-2xl bg-muted/60 p-5 xl:sticky xl:top-32">
            <h2 className="text-sm font-bold">{t.product.supplierCard}</h2>
            <div className="mt-4 flex items-start gap-3">
              <CompanyMark name={supplier.nameEn} accent={supplier.accent} className="size-12" />
              <div className="min-w-0">
                <Link to={`/suppliers/${supplier.id}`} className="line-clamp-2 font-bold leading-snug hover:text-primary">{supplier.name}</Link>
                <div className="mt-1.5 flex items-center gap-2">{supplier.verified && <VerifiedBadge />}<ReputationStars orgId={supplier.id} legacyScore={supplier.reputationScore} /></div>
              </div>
            </div>
            <dl className="mt-5 space-y-2.5 text-sm">
              {[
                [t.supplier.businessType, t.supplier.types[supplier.businessType] || none],
                [t.supplier.address, supplier.province || none],
                [t.common.employees, supplier.employees || none],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className={cn('text-right font-semibold', v === none && 'font-normal text-muted-foreground')}>{v}</dd>
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
          {related.map((p) => <StaggerItem key={p.id}><ProductCard product={p} className="h-full" /></StaggerItem>)}
        </Stagger>
      </section>
    </div>
  )
}

function RfqDialog({ product }: { product: Product }) {
  const { t, L } = useI18n()
  // arrived from a show's product list: the quote counts as interest at that show. A plain visit sends nothing.
  const [params, setParams] = useSearchParams()
  const sourceEventPid = /^s-\d+$/.exec(params.get('fromEvent') ?? '')?.[0]
  const toast = useToast()
  const { session } = useProfile()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // ?rfq=1 is the way back from /login: reopen the dialog with what the guest had typed
  const draftKey = `rfq-draft:${product.id}`
  const [draft] = useState<{ quantity?: string; destination?: string; message?: string }>(() => {
    try { return JSON.parse(sessionStorage.getItem(draftKey) ?? '{}') } catch { return {} }
  })
  const [open, setOpen] = useState(() => params.get('rfq') === '1')
  const [sent, setSent] = useState(false)
  const close = (v: boolean) => {
    setOpen(v)
    if (v) return
    setSent(false)
    if (params.has('rfq')) { const n = new URLSearchParams(params); n.delete('rfq'); setParams(n, { replace: true }) }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        <Button size="lg" className="flex-1 sm:flex-none"><Send /> {t.common.sendInquiry}</Button>
      </DialogTrigger>
      <DialogContent title={t.product.rfqTitle} description={session ? tx('Yêu cầu được gửi tới email của nhà cung cấp.', 'The request goes to the supplier by email.', '요청은 공급업체 이메일로 전달됩니다.') : tx('Yêu cầu được gửi tới email của nhà cung cấp. Bạn soạn ngay được; khi gửi, bạn đăng nhập và nội dung đã soạn được giữ nguyên.', 'The request goes to the supplier by email. Write it now; when you send, you sign in and what you wrote is kept.', '요청은 공급업체 이메일로 전달됩니다. 지금 작성하고, 보낼 때 로그인하면 내용이 그대로 유지됩니다.')}>
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
                const fd = new FormData(e.currentTarget)
                const body = { quantity: Number(fd.get('quantity')), destination: String(fd.get('destination') ?? ''), message: String(fd.get('message') ?? '') }
                if (!session && !USE_MOCK) {
                  try { sessionStorage.setItem(draftKey, JSON.stringify({ ...body, quantity: String(body.quantity) })) } catch { /* private mode: the guest retypes */ }
                  const back = new URLSearchParams(params)
                  back.set('rfq', '1')
                  navigate(`/login?return=${encodeURIComponent(`${pathname}?${back}`)}`)
                  return
                }
                const done = () => {
                  try { sessionStorage.removeItem(draftKey) } catch { /* nothing stored */ }
                  setSent(true)
                  toast({ kind: 'success', title: t.product.sent, description: L(product.productName) })
                }
                if (USE_MOCK) {
                  done()
                  return
                }
                liveApi.sendProductRfq(product.id, { ...body, sourceEventPid }).then(
                  done,
                  (err: Error) => toast({ kind: 'info', title: err.message }),
                )
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
                <Field label={t.product.quantity} htmlFor="rfq-q"><Input id="rfq-q" placeholder={tx('VD: 1000', 'e.g. 1000', '예: 1000')} name="quantity" type="number" min={product.moq || 1} defaultValue={draft.quantity ?? (product.moq || '')} required /></Field>
                <Field label={t.product.destination} htmlFor="rfq-d"><Input id="rfq-d" name="destination" placeholder="Busan, KR" defaultValue={draft.destination} required /></Field>
              </div>
              <Field label={t.product.message} htmlFor="rfq-m"><Textarea id="rfq-m" name="message" placeholder={t.product.messagePh} defaultValue={draft.message} required /></Field>
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                {!session && !USE_MOCK && <Link to="/register" className="mr-auto text-sm font-semibold text-primary hover:underline">{tx('Chưa có tài khoản? Đăng ký', 'No account? Register', '계정이 없나요? 등록')}</Link>}
                <Button variant="ghost" onClick={() => close(false)}>{t.common.cancel}</Button>
                <Button type="submit"><Send /> {session || USE_MOCK ? t.common.submit : tx('Đăng nhập để gửi', 'Sign in to send', '로그인 후 보내기')}</Button>
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
