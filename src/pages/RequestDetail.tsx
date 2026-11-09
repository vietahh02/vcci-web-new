import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarClock, FileUp, MapPin, Package, Paperclip, Send, Tag, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { browseImportRequests, catalogApi, getCategory, liveApi, searchProducts, tokens, USE_MOCK, useImportRequest } from '@/api'
import { LoginRequiredDialog } from '@/components/auth/LoginRequiredDialog'
import { useProfile } from '@/lib/profile'
import type { MyProduct } from '@/api/catalogApi'
import { chatApi, chatConfigured } from '@/api/chat'
import { Select } from '@/components/ui/select'
import { type ImportRequest, type Product } from '@/data/mock'
import { ErrorBlock, LoadingBlock } from '@/components/ui/StateViews'
import { CountryChip, SectionHeader } from '@/components/brand'
import { ProductCard, RequestCard } from '@/components/cards'
import { Countdown, Reveal } from '@/components/effects'
import { SheetContent, useToast } from '@/components/ui/overlay'
import { Badge, Button, Field, Input, Textarea } from '@/components/ui/primitives'
import NotFound from '@/pages/NotFound'
import { SuccessState } from '@/pages/ProductDetail'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'
import { cn, formatDate, formatMoney, formatNumber } from '@/lib/utils'

export default function RequestDetail() {
  const { id = '' } = useParams()
  const { t, L, lang, locale } = useI18n()
  const { data: r, loading, error, reload } = useImportRequest(id)
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [matches, setMatches] = useState<Product[]>([])
  const [others, setOthers] = useState<ImportRequest[]>([])
  const catId = r?.categoryId
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { session } = useProfile()
  // live: the token is there before /api/auth/me answers, so a signed-in user is never asked to sign in again
  const authed = USE_MOCK ? !!session : !!tokens.access()
  const [askLogin, setAskLogin] = useState(false)
  const openQuote = () => (authed ? setQuoteOpen(true) : setAskLogin(true))

  // Same rules as the BE (QuotationServiceImpl + ImportRequestAccessPolicy.assertCanQuote): the request is open,
  // the sender is signed in with an organisation, and it is not the organisation that posted the request.
  // Business type is not checked: app.import-request.quote-allowed-business-types is empty (= every type).
  // BR-TRD-15: the sender's company needs at least one visible (ACTIVE) product.
  const isOpen = r?.status === 'OPEN'
  const isOwn = !!session?.organizationId && !!r?.organizationId && session.organizationId === r.organizationId
  const noOrg = !USE_MOCK && !!session && !session.organizationId
  const [hasProducts, setHasProducts] = useState<boolean | null>(null)
  const checkProducts = isOpen && authed && !!session && !isOwn && !noOrg && !USE_MOCK
  useEffect(() => {
    if (!checkProducts) return
    // on error let the button show: the BE still refuses a company without products
    catalogApi.myProducts('', 'visible', 0, 1).then((p) => setHasProducts(p.total > 0), () => setHasProducts(true))
  }, [checkProducts])
  // signed in but /api/auth/me (or the product check) not answered yet: wait rather than flash the button
  const quoteBlock: 'closed' | 'own' | 'noOrg' | 'noProduct' | 'loading' | null =
    !isOpen ? 'closed' : !authed ? null : !session ? 'loading' : isOwn ? 'own' : noOrg ? 'noOrg'
      : !checkProducts ? null : hasProducts === null ? 'loading' : hasProducts ? null : 'noProduct'

  // back from /login with ?quote=1: reopen the quote sheet the user was heading to
  useEffect(() => {
    if (r && authed && quoteBlock === null && params.get('quote') === '1') setQuoteOpen(true)
  }, [r, authed, quoteBlock, params])

  useEffect(() => {
    if (!r) return
    searchProducts({ categoryId: catId }).then((p) => setMatches(p.slice(0, 4)), () => setMatches([]))
    browseImportRequests().then((l) => setOthers(l.filter((x) => x.id !== r.id).slice(0, 4)), () => setOthers([]))
  }, [r, catId, lang])

  if (loading) return <LoadingBlock />
  if (error) return <ErrorBlock error={error} onRetry={reload} />
  if (!r) return <NotFound />
  const cat = getCategory(r.categoryId)

  return (
    <div className="container-page pt-6">
      <nav aria-label={t.ui.breadcrumb} className="mb-5 flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
        <Link to="/" className="hover:text-foreground">{t.common.home}</Link> / <Link to="/requests" className="hover:text-foreground">{t.nav.requests}</Link> / <span className="text-foreground">{r.requestCode}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <Reveal>
          <div className="flex flex-wrap items-center gap-2">
            {isOpen
              ? <Badge variant="success"><span className="size-1.5 rounded-full bg-success" /> {t.requests.open}</Badge>
              : <Badge variant="muted">{tx('Đã đóng', 'Closed', '마감')}</Badge>}
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
                {quoteBlock === null ? (
                  <Button size="lg" className="mt-5 w-full" onClick={openQuote}><Send /> {t.requests.sendQuote}</Button>
                ) : quoteBlock === 'loading' ? (
                  <div className="mt-5 h-12 w-full animate-pulse rounded-full bg-muted" />
                ) : quoteBlock === 'noProduct' ? (
                  <div className="mt-5 rounded-xl bg-muted px-4 py-3 text-sm leading-relaxed text-foreground/85">
                    {tx('Chỉ doanh nghiệp đã có sản phẩm đang hiển thị mới được gửi báo giá.', 'Only companies with at least one listed product can send quotes.', '게시된 제품이 있는 기업만 견적을 보낼 수 있습니다.')}{' '}
                    <Link to="/account/catalog/products/new" className="font-semibold text-primary underline-offset-4 hover:underline">
                      {tx('Thêm sản phẩm', 'Add a product', '제품 등록')}
                    </Link>
                  </div>
                ) : (
                  <p className="mt-5 rounded-xl bg-muted px-4 py-3 text-sm leading-relaxed text-foreground/85">
                    {quoteBlock === 'closed'
                      ? tx('Yêu cầu này đã đóng, không nhận thêm báo giá.', 'This request is closed and no longer takes quotes.', '이 요청은 마감되어 더 이상 견적을 받지 않습니다.')
                      : quoteBlock === 'own'
                        ? tx('Đây là yêu cầu của doanh nghiệp bạn. Báo giá từ nhà cung cấp sẽ gửi về email của doanh nghiệp.', 'This is your company\'s request. Supplier quotes arrive at your company email.', '귀사의 요청입니다. 공급업체 견적은 회사 이메일로 도착합니다.')
                        : tx('Tài khoản cần được gắn với một doanh nghiệp để gửi báo giá.', 'Your account must belong to a company to send quotes.', '견적을 보내려면 계정이 기업에 연결되어 있어야 합니다.')}
                  </p>
                )}
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

      <QuoteSheet open={quoteOpen} onOpenChange={setQuoteOpen} requestId={r.id} buyerOrgId={r.organizationId} to={r.organizationEmail} subject={`Quotation – ${r.requestCode} – ${L(r.requestName)}`} />
      <LoginRequiredDialog
        open={askLogin}
        onOpenChange={setAskLogin}
        onLogin={() => navigate(`/login?return=${encodeURIComponent(`/requests/${id}?quote=1`)}`)}
        title={tx('Đăng nhập để gửi báo giá', 'Sign in to send a quote', '로그인하고 견적 보내기')}
        description={tx(`Báo giá tới ${r.organizationName} được gửi từ tài khoản doanh nghiệp của bạn.`, `Quotes to ${r.organizationName} are sent from your business account.`, `${r.organizationName}에 보내는 견적은 귀사 기업 계정에서 전송됩니다.`)}
        points={[
          tx('Gửi báo giá qua email, kèm tệp đính kèm', 'Send your quote by email, with attachments', '첨부 파일과 함께 이메일로 견적 전송'),
          tx('Đăng nhập xong, bạn quay lại đúng yêu cầu này', 'After signing in you come straight back to this request', '로그인 후 바로 이 요청으로 돌아옵니다'),
        ]}
      />
    </div>
  )
}

/** POST /api/portal/import-requests/{id}/quotes/email (multipart) */
function QuoteSheet({ open, onOpenChange, requestId, to, subject, buyerOrgId }: { open: boolean; onOpenChange: (v: boolean) => void; requestId: string; to: string; subject: string; buyerOrgId?: string }) {
  const { t } = useI18n()
  const toast = useToast()
  const [files, setFiles] = useState<File[]>([])
  const [drag, setDrag] = useState(false)
  const [sent, setSent] = useState(false)
  const [channel, setChannel] = useState<'email' | 'chat'>('email')
  const [products, setProducts] = useState<MyProduct[] | null>(null)
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  // chat channel: the supplier pins one of its own products to this request
  useEffect(() => {
    if (channel !== 'chat' || products || USE_MOCK) return
    catalogApi.myProducts('', 'all', 0).then((r) => setProducts(r.items), () => setProducts([]))
  }, [channel, products])

  const sendChat = async () => {
    if (!chatConfigured()) return toast({ kind: 'info', title: tx('Chưa cấu hình dịch vụ chat', 'Chat service is not configured', '채팅 서비스가 구성되지 않았습니다') })
    if (!productId) return toast({ kind: 'info', title: tx('Chọn sản phẩm để báo giá', 'Pick a product to quote', '견적할 제품을 선택하세요') })
    if (!buyerOrgId) return toast({ kind: 'info', title: tx('Không xác định được doanh nghiệp mua', 'Buyer company unknown', '구매 기업을 확인할 수 없습니다') })
    const p = products?.find((x) => x.id === productId)
    setBusy(true)
    try {
      const me = await chatApi.me()
      if (!me.organizationId) throw new Error(tx('Tài khoản chưa gắn doanh nghiệp', 'Account has no company', '계정에 기업이 없습니다'))
      const conv = await chatApi.ensureB2b(me.organizationId, buyerOrgId, me.principalId)
      await chatApi.sendRich(conv.conversationId, {
        kind: 'RFQ',
        body: note,
        payload: { requestId, productId, item: p ? (p.productName || '') : productId, quantity: qty, note },
      })
      toast({ kind: 'success', title: t.requests.quoteSent })
      // báo giá qua chat: mở luôn hội thoại B2B với DN mua trên website (không phải màn "đã gửi email")
      onOpenChange(false)
      navigate(`/messages?b2b=${encodeURIComponent(buyerOrgId)}`)
    } catch (err) {
      toast({ kind: 'info', title: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  const channelBtn = (k: 'email' | 'chat', label: string) => (
    <button type="button" onClick={() => setChannel(k)} className={cn('flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200', channel === k ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30' : 'bg-muted text-muted-foreground hover:bg-primary-soft hover:text-primary')}>{label}</button>
  )

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSent(false); setFiles([]); setChannel('email') } }}>
      <SheetContent title={channel === 'chat' ? tx('Gửi báo giá qua chat B2B', 'Send quote via B2B chat', 'B2B 채팅으로 견적 보내기') : t.requests.quoteTitle} description={channel === 'chat' ? tx('Báo giá được gửi vào chat B2B với người mua ngay trên website.', 'Your quote is posted in the B2B chat with the buyer, right on the website.', '견적은 웹사이트의 B2B 채팅으로 바이어에게 전송됩니다.') : t.requests.quoteDesc} className="max-w-lg">
        {sent ? (
          <SuccessState title={t.requests.quoteSent} desc={t.requests.quoteSentDesc} onClose={() => onOpenChange(false)} />
        ) : (
          <div className="space-y-4 p-6">
            <div className="flex gap-2 rounded-full bg-muted p-1">
              {channelBtn('email', tx('Gửi qua email', 'By email', '이메일'))}
              {channelBtn('chat', tx('Gửi qua chat B2B', 'Via B2B chat', 'B2B 채팅'))}
            </div>

            {channel === 'chat' ? (
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void sendChat() }}>
                <Field label={tx('Sản phẩm báo giá', 'Product to quote', '견적 제품')} htmlFor="q-prod">
                  <Select id="q-prod" value={productId} onValueChange={setProductId} placeholder={tx('Chọn sản phẩm', 'Choose a product', '제품 선택')} options={(products ?? []).map((p) => ({ value: p.id, label: p.productName || p.id }))} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t.requests.quantity} htmlFor="q-qty"><Input id="q-qty" placeholder={tx('VD: 1000', 'e.g. 1000', '예: 1000')} type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
                  <Field label={tx('Mã yêu cầu', 'Request code', '요청 코드')} htmlFor="q-rid"><Input id="q-rid" placeholder={tx('Chưa cung cấp', 'Not provided', '미제공')} value={requestId} readOnly className="bg-muted" /></Field>
                </div>
                <Field label={t.requests.content} htmlFor="q-note"><Textarea id="q-note" className="min-h-28" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.ui.quotePh} /></Field>
                <p className="rounded-2xl bg-primary-soft p-3 text-xs text-primary">{tx('Báo giá sẽ được gửi vào hội thoại B2B với doanh nghiệp mua, kèm mã yêu cầu và thẻ sản phẩm.', 'The quote is posted in the B2B conversation with the buyer, with the request code and product card.', '견적은 구매 기업과의 B2B 대화에 요청 코드와 제품 카드와 함께 전송됩니다.')}</p>
                <Button type="submit" size="lg" className="w-full" disabled={busy}><Send /> {busy ? '…' : t.requests.sendQuote}</Button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault()
                if (USE_MOCK) { setSent(true); toast({ kind: 'success', title: t.requests.quoteSent }); return }
                const g = (k: string) => String(new FormData(e.currentTarget).get(k) ?? '')
                liveApi.sendQuote(requestId, { cc: g('cc'), bcc: g('bcc'), subject: g('subject'), content: g('content'), files }).then(
                  () => { setSent(true); toast({ kind: 'success', title: t.requests.quoteSent }) },
                  (err: Error) => toast({ kind: 'info', title: err.message }),
                )
              }}>
                <Field label={t.requests.to} htmlFor="q-to"><Input id="q-to" placeholder={tx('Chưa cung cấp', 'Not provided', '미제공')} value={to} readOnly className="bg-muted" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="CC" htmlFor="q-cc"><Input id="q-cc" name="cc" type="email" placeholder="sales@company.vn" /></Field>
                  <Field label="BCC" htmlFor="q-bcc"><Input id="q-bcc" placeholder={tx('Email nhận bản sao (không bắt buộc)', 'Copy to this email (optional)', '사본 받을 이메일(선택)')} name="bcc" type="email" /></Field>
                </div>
                <Field label={t.requests.subject} htmlFor="q-sub"><Input id="q-sub" placeholder={tx('Tiêu đề email báo giá', 'Quotation email subject', '견적 이메일 제목')} name="subject" defaultValue={subject} required /></Field>
                <Field label={t.requests.content} htmlFor="q-body"><Textarea id="q-body" name="content" className="min-h-36" required placeholder={t.ui.quotePh} /></Field>
                <div>
                  <p className="mb-1.5 text-[13px] font-semibold">{t.requests.attachments}</p>
                  <label
                    onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={(e) => { e.preventDefault(); setDrag(false); setFiles((f) => [...f, ...Array.from(e.dataTransfer.files)]) }}
                    className={`flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 border-dashed p-6 text-center transition ${drag ? 'scale-[1.02] border-primary bg-primary-soft' : 'hover:border-primary/50 hover:bg-muted/50'}`}
                  >
                    <motion.div animate={drag ? { y: [0, -6, 0] } : { y: 0 }} transition={{ repeat: drag ? Infinity : 0, duration: 0.8 }}>
                      <FileUp className="size-7 text-primary" />
                    </motion.div>
                    <span className="text-xs text-muted-foreground">{t.requests.attachHint}</span>
                    <input type="file" multiple className="sr-only" onChange={(e) => setFiles((f) => [...f, ...Array.from(e.target.files ?? [])])} />
                  </label>
                  <ul className="mt-2 space-y-1.5">
                    <AnimatePresence>
                      {files.map((f, i) => (
                        <motion.li key={f.name + i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-xs">
                          <Paperclip className="size-3.5" /> <span className="flex-1 truncate">{f.name}</span>
                          <button type="button" onClick={() => setFiles((x) => x.filter((_, k) => k !== i))} aria-label={t.ui.remove}><X className="size-3.5" /></button>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
                <Button type="submit" size="lg" className="w-full"><Send /> {t.requests.sendQuote}</Button>
              </form>
            )}
          </div>
        )}
      </SheetContent>
    </DialogPrimitive.Root>
  )
}
