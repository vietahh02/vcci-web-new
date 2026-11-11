import { AnimatePresence, motion } from 'motion/react'
import { Award, BadgeCheck, Check, CheckCircle2, ChevronLeft, ChevronRight, MapPin, MessageSquare, Plus, Send, Share2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
import { Badge, Button, Field, Input, Skeleton, Textarea } from '@/components/ui/primitives'
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
  const category = getCategory(product.categoryId)
  const tabsRef = useRef<HTMLDivElement>(null)
  const thumbsRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  // keep the selected thumbnail in view inside its own strip (arrows can jump past the visible ones) without scrolling the page
  useEffect(() => {
    const strip = thumbsRef.current
    const on = strip?.querySelector<HTMLElement>('[aria-current="true"]')
    if (strip && on) strip.scrollTo({ top: on.offsetTop - (strip.clientHeight - on.offsetHeight) / 2, left: on.offsetLeft - (strip.clientWidth - on.offsetWidth) / 2, behavior: 'smooth' })
  }, [active])
  const [tab, setTab] = useState('overview')
  const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 })
  const related = useRelatedProducts(product.id, product.categoryId).data ?? []
  const none = tx('Chưa cung cấp', 'Not provided', '미제공')

  const images = product.productImages
  const go = (d: 1 | -1) => setActive((i) => (i + d + images.length) % images.length)
  const specs = [
    { label: t.common.moq, value: product.moq ? `${formatNumber(product.moq, locale)} ${product.unit}` : '' },
    { label: t.common.origin, value: product.origin },
    { label: t.common.payment, value: product.paymentTerms },
    { label: t.common.certificates, value: product.certificates.join(', ') },
  ].filter((r) => r.value)
  const showSpecs = () => {
    setTab('specs')
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const prices = [
    { label: t.common.fob, value: product.priceFob },
    { label: t.common.cif, value: product.priceCif },
  ]

  return (
    <div className="container-page pt-6">
      <nav aria-label={t.ui.breadcrumb} className="mb-5 flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
        <Link to="/" className="hover:text-foreground">{t.common.home}</Link> /
        <Link to="/search" className="hover:text-foreground">{t.nav.products}</Link> /
        {category && <><Link to={`/search?category=${category.id}`} className="hover:text-foreground">{L(category.categoryName)}</Link> /</>}
        <span className="line-clamp-1 text-foreground">{L(product.productName)}</span>
      </nav>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,580px)_minmax(0,1fr)_300px]">
        {/* gallery: thumbnails on the left, large square image, favourite on the image, share underneath */}
        <Reveal>
          <div className="flex flex-col-reverse gap-3 md:flex-row">
            {images.length > 1 && (
              <div ref={thumbsRef} className="no-scrollbar relative flex shrink-0 gap-2 overflow-x-auto p-1 md:max-h-[560px] md:w-16 md:flex-col md:overflow-y-auto md:overflow-x-hidden">
                {images.map((im, i) => (
                  <button
                    key={im + i}
                    onClick={() => setActive(i)}
                    aria-label={`Image ${i + 1}`}
                    aria-current={active === i}
                    className={cn('size-14 shrink-0 overflow-hidden rounded-md bg-muted ring-2 ring-offset-2 ring-offset-background transition', active === i ? 'ring-primary' : 'ring-transparent opacity-70 hover:opacity-100')}
                  >
                    <img src={img(im, 120, 120)} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div
              className="relative aspect-square min-w-0 flex-1 cursor-zoom-in overflow-hidden rounded-xl bg-muted"
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                setZoom({ on: true, x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
              }}
              onMouseLeave={() => setZoom((z) => ({ ...z, on: false }))}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.img
                  key={active}
                  src={img(images[active]!, 1100, 1100)}
                  alt={L(product.productName)}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: zoom.on ? 1.9 : 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ opacity: { duration: 0.35 }, scale: { duration: 0.35, ease: 'easeOut' } }}
                  style={{ transformOrigin: `${zoom.x}% ${zoom.y}%` }}
                  className="absolute inset-0 size-full object-cover"
                />
              </AnimatePresence>
              <FavoriteButton productId={product.id} className="absolute right-3 top-3 size-10 rounded-full bg-white/90 text-navy shadow-sm backdrop-blur hover:bg-white" />
              {images.length > 1 && (
                <>
                  <button type="button" aria-label="‹" onClick={() => go(-1)} className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-navy shadow-sm backdrop-blur transition hover:bg-white"><ChevronLeft className="size-5" /></button>
                  <button type="button" aria-label="›" onClick={() => go(1)} className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-navy shadow-sm backdrop-blur transition hover:bg-white"><ChevronRight className="size-5" /></button>
                </>
              )}
            </div>
          </div>
          <div className={cn('mt-4 flex items-center gap-2 text-sm text-muted-foreground', images.length > 1 && 'md:pl-[76px]')}>
            <button type="button" onClick={() => void share()} className="inline-flex items-center gap-2 transition-colors hover:text-primary"><Share2 className="size-4" /> {t.product.share}</button>
          </div>
        </Reveal>

        {/* info: compact title, plain price tiers, attribute table, one big call to action */}
        <div className="min-w-0">
          <Reveal>
            <h1 className="text-xl font-semibold leading-snug tracking-tight md:text-[22px]">{L(product.productName)}</h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground">
              {category && <Badge variant="secondary">{L(category.categoryName)}</Badge>}
              <span className="tabular-nums">{t.ui.productCode} {product.productCode}</span>
              {product.origin && <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" /> {product.origin}</span>}
              <span>{formatNumber(product.viewCount, locale)} {t.common.views}</span>
            </div>
          </Reveal>

          <Reveal delay={0.06} className="mt-6">
            <div className="grid grid-cols-2 gap-x-8">
              {prices.map((p) => (
                <div key={p.label}>
                  <p className="text-[13px] font-medium text-muted-foreground">{p.label}</p>
                  {p.value ? (
                    <>
                      <p className="mt-0.5 text-3xl font-bold tracking-tight">{formatMoney(p.value)}</p>
                      <p className="text-[13px] text-muted-foreground">/ {product.unit}</p>
                    </>
                  ) : <p className="mt-1.5 text-base text-muted-foreground">{none}</p>}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {t.product.priceNote}. <Link to="/help#terms" className="font-semibold text-primary hover:underline">{tx('Giải thích FOB/CIF', 'What FOB/CIF mean', 'FOB/CIF 설명')}</Link>
            </p>
          </Reveal>

          {specs.length > 0 && (
            <Reveal delay={0.1} className="mt-6 border-t pt-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-bold">{tx('Thông tin sản phẩm', 'Product information', '상품 정보')}</h2>
                <button type="button" onClick={showSpecs} className="text-sm font-semibold text-primary hover:underline">{tx('Xem thêm', 'View more', '더 보기')}</button>
              </div>
              <dl className="mt-3 divide-y overflow-hidden rounded-lg border">
                {specs.map((r) => (
                  <div key={r.label} className="grid grid-cols-[132px_minmax(0,1fr)] text-sm">
                    <dt className="bg-muted/60 px-3 py-2.5 text-muted-foreground">{r.label}</dt>
                    <dd className="px-3 py-2.5 font-medium">{r.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          )}

          <div className="mt-6"><RfqDialog product={product} /></div>
        </div>

        {/* supplier: sticky card with the actions a buyer takes next */}
        <aside className="lg:col-start-2 xl:col-start-auto">
          <SupplierCard product={product} />
        </aside>
      </div>

      <div ref={tabsRef} className="mt-14 max-w-4xl scroll-mt-28">
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

      <section className="mt-20">
        <SectionHeader title={t.product.related} />
        <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {related.map((p) => <StaggerItem key={p.id}><ProductCard product={p} className="h-full" /></StaggerItem>)}
        </Stagger>
      </section>
    </div>
  )
}

/** Supplier card beside the product: who sells it, how they are verified, and the two things a buyer does next (chat, follow). */
function SupplierCard({ product }: { product: Product }) {
  const { t } = useI18n()
  const toast = useToast()
  const { session } = useProfile()
  const supplier = useBusiness(product.organizationId).data?.business ?? businessStub(product.organizationId, product.organizationName)
  const [following, setFollowing] = useState(false)
  useEffect(() => {
    if (USE_MOCK || !session) return
    let alive = true
    liveApi.isFollowingBusiness(supplier.id).then((v) => { if (alive) setFollowing(v) }, () => undefined)
    return () => { alive = false }
  }, [supplier.id, session])
  const toggleFollow = () => {
    const next = !following
    const done = () => { setFollowing(next); if (next) toast({ kind: 'success', title: t.supplier.follow, description: supplier.name }) }
    if (USE_MOCK) return done()
    liveApi.followBusiness(supplier.id, next).then(done, (err: Error) => toast({ kind: 'info', title: err.message }))
  }
  const type = t.supplier.types[supplier.businessType]
  const facts = [supplier.employees && `${t.common.employees}: ${supplier.employees}`].filter(Boolean) as string[]

  return (
    <div className="rounded-2xl border bg-gradient-to-b from-primary-soft/70 to-card p-5 xl:sticky xl:top-32">
      <p className="text-[13px] font-medium text-muted-foreground">{t.product.supplierCard}</p>
      <div className="mt-3 flex items-start gap-3">
        <CompanyMark name={supplier.nameEn} accent={supplier.accent} className="size-12" />
        <div className="min-w-0">
          <Link to={`/suppliers/${supplier.id}`} className="line-clamp-2 text-base font-bold leading-snug underline-offset-4 hover:text-primary hover:underline">{supplier.name}</Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">{supplier.verified && <VerifiedBadge />}<ReputationStars orgId={supplier.id} legacyScore={supplier.reputationScore} /></div>
        </div>
      </div>
      {supplier.province && <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-4" /> {supplier.province}</p>}
      {facts.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm">
          {facts.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" />{f}</li>)}
        </ul>
      )}
      {type && (
        <div className="mt-5">
          <h3 className="text-sm font-bold">{t.supplier.businessType}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{type}</p>
        </div>
      )}
      <div className="mt-5 grid gap-2.5">
        <Button variant="outline" className="w-full rounded-full" onClick={() => { if (USE_MOCK) toast({ kind: 'info', title: t.product.chatNow, description: supplier.name }); else openBusinessChat(product.organizationId) }}>
          <MessageSquare /> {t.product.chatNow}
        </Button>
        <Button variant="outline" className={cn('w-full rounded-full', following && 'border-primary/40 text-primary')} aria-pressed={following} onClick={toggleFollow}>
          {following ? <BadgeCheck /> : <Plus />} {t.supplier.follow}
        </Button>
      </div>
      <Link to={`/suppliers/${supplier.id}`} className="mt-4 block text-center text-sm font-semibold text-primary hover:underline">{t.product.visitProfile}</Link>
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
        <Button size="lg" className="h-12 w-full rounded-full px-10 text-base sm:w-auto"><Send /> {t.common.sendInquiry}</Button>
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
