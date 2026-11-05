import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarClock, FileUp, MapPin, Package, Paperclip, Send, Tag, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { browseImportRequests, catalogApi, getCategory, liveApi, searchProducts, USE_MOCK, useImportRequest } from '@/api'
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

      <QuoteSheet open={quoteOpen} onOpenChange={setQuoteOpen} requestId={r.id} buyerOrgId={r.organizationId} to={r.organizationEmail} subject={`Quotation – ${r.requestCode} – ${L(r.requestName)}`} />
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
      setSent(true)
      toast({ kind: 'success', title: t.requests.quoteSent })
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
      <SheetContent title={t.requests.quoteTitle} description={t.requests.quoteDesc} className="max-w-lg">
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
                  <Select id="q-prod" value={productId} onValueChange={setProductId} placeholder="—" options={(products ?? []).map((p) => ({ value: p.id, label: p.productName || p.id }))} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t.requests.quantity} htmlFor="q-qty"><Input id="q-qty" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
                  <Field label={tx('Mã yêu cầu', 'Request code', '요청 코드')} htmlFor="q-rid"><Input id="q-rid" value={requestId} readOnly className="bg-muted" /></Field>
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
                <Field label={t.requests.to} htmlFor="q-to"><Input id="q-to" value={to} readOnly className="bg-muted" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="CC" htmlFor="q-cc"><Input id="q-cc" name="cc" type="email" placeholder="sales@company.vn" /></Field>
                  <Field label="BCC" htmlFor="q-bcc"><Input id="q-bcc" name="bcc" type="email" /></Field>
                </div>
                <Field label={t.requests.subject} htmlFor="q-sub"><Input id="q-sub" name="subject" defaultValue={subject} required /></Field>
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
