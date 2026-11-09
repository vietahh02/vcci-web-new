/** RFQ layout: split header (pitch + inline post form) + tabular board. */
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { ArrowUpRight, ChevronDown, FilePlus2, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { browseImportRequests, getCategory, liveApi, tokens, USE_MOCK } from '@/api'
import { useProfile } from '@/lib/profile'
import { LoginRequiredDialog } from '@/components/auth/LoginRequiredDialog'
import { categories, type ImportRequest } from '@/data/mock'
import { CountryChip } from '@/components/brand'
import { Dialog, DialogContent, useToast } from '@/components/ui/overlay'
import { buttonClass, Button, Field, Input, Skeleton, Textarea } from '@/components/ui/primitives'
import { DateField } from '@/components/ui/DateField'
import { Select } from '@/components/ui/select'
import { SuccessState } from '@/pages/ProductDetail'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'
import { cn, daysLeft, formatDate, formatMoney, formatNumber } from '@/lib/utils'

const UNITS = ['MT', 'kg', 'pcs', 'set']

export default function Requests() {
  const { t, L, lang, locale } = useI18n()
  const [params, setParams] = useSearchParams()
  const [cat, setCat] = useState('')
  const [list, setList] = useState<ImportRequest[] | null>(null)
  const [postOpen, setPostOpen] = useState(false)
  const q = (params.get('q') ?? '').trim()
  const [text, setText] = useState(q)
  // keep the box in step when ?q= changes from outside (header search, back button)
  useEffect(() => setText(q), [q])
  // type -> ?q= after a short pause; the browse API does the (accent-insensitive) matching
  useEffect(() => {
    const next = text.trim()
    if (next === q) return
    const h = setTimeout(() => setParams((p) => { const n = new URLSearchParams(p); if (next) n.set('q', next); else n.delete('q'); return n }, { replace: true }), 300)
    return () => clearTimeout(h)
  }, [text, q, setParams])
  const navigate = useNavigate()
  const { session, profile } = useProfile()
  // live: the token is there before /api/auth/me answers, so a signed-in user is never sent to /login
  const authed = USE_MOCK ? !!session : !!tokens.access()
  // BE (ImportRequestAccessPolicy) only lets FOREIGN_IMPORTER post; others get no button and no form
  const canPost = !!session && profile.registration.businessType === 'FOREIGN_IMPORTER'
  const [askLogin, setAskLogin] = useState(false)
  const toLogin = () => navigate(`/login?return=${encodeURIComponent('/requests?post=1')}`)

  useEffect(() => {
    let alive = true
    setList(null)
    browseImportRequests(cat || undefined, q || undefined).then((r) => alive && setList(r), () => alive && setList([]))
    return () => {
      alive = false
    }
  }, [cat, lang, q])

  useEffect(() => {
    if (params.get('post') !== '1') return
    if (!authed) setAskLogin(true)
    else if (canPost) setPostOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, authed, canPost])

  const filtered = list

  return (
    <>
      {/* 1. intro: harbour photo on navy (same language as the Events hero) + live figures from the open requests */}
      <RequestsHero
        action={!authed ? (
          <button type="button" onClick={() => setAskLogin(true)} className={buttonClass('gold', 'lg')}><FilePlus2 /> {t.nav.postRequest}</button>
        ) : canPost ? (
          <button type="button" onClick={() => setPostOpen(true)} className={buttonClass('gold', 'lg')}><FilePlus2 /> {t.nav.postRequest}</button>
        ) : null}
      />

      <section className="container-page mt-8 md:mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-extrabold tracking-tight">{t.home.requestsTitle}</h2>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <form role="search" className="relative w-full sm:w-72" onSubmit={(e) => e.preventDefault()}>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-label={tx('Tìm yêu cầu nhập khẩu', 'Search import requests', '수입 요청 검색')}
                placeholder={tx('Tìm tên hàng, loại sản phẩm', 'Search goods, product type', '상품명, 제품 유형 검색')}
                className="h-11 pl-10 pr-10 text-[14px] sm:h-10 [&::-webkit-search-cancel-button]:hidden"
              />
              {text && (
                <button type="button" onClick={() => setText('')} aria-label={tx('Xoá từ khoá', 'Clear search', '검색어 지우기')} className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground">
                  <X className="size-4" />
                </button>
              )}
            </form>
            <Select value={cat} onValueChange={setCat} className="h-11 w-full text-[13px] sm:h-10 sm:w-auto sm:min-w-52" aria-label={t.requests.category} options={[{ value: '', label: t.requests.allCats }, ...categories.map((c) => ({ value: c.id, label: L(c.categoryName) }))]} />
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border">
          <div className="hidden grid-cols-[minmax(0,2.4fr)_1fr_1fr_1.1fr_0.9fr_40px] gap-4 bg-muted/60 px-5 py-3 text-[13px] font-bold text-muted-foreground lg:grid">
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
                    className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 border-t px-4 py-4 transition-colors hover:bg-primary-soft/50 sm:px-5 lg:grid-cols-[minmax(0,2.4fr)_1fr_1fr_1.1fr_0.9fr_40px] lg:gap-4"
                  >
                    <div className="col-span-2 min-w-0 lg:col-span-1">
                      <p className="truncate font-semibold group-hover:text-primary">{L(r.requestName)}</p>
                      <p className="text-xs text-muted-foreground">{c ? L(c.categoryName) : r.productType}</p>
                    </div>
                    <span className="text-sm">{formatNumber(r.quantity, locale)} {r.unit}</span>
                    <span className="text-sm font-semibold max-lg:text-right">{formatMoney(r.price)}/{r.unit}</span>
                    <CountryChip code={r.country} label={r.organizationName} className="min-w-0 truncate" />
                    <span className={cn('whitespace-nowrap text-sm max-lg:text-right', left <= 7 && 'font-semibold text-amber-600 dark:text-amber-400')}><span className="font-normal text-muted-foreground lg:hidden">{t.requests.deadline}: </span>{formatDate(r.endTime, locale)}</span>
                    <ArrowUpRight className="hidden size-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary lg:block" />
                  </Link>
                </motion.div>
              )
            })
          )}
        </div>
      </section>

      <div className="pb-16" />

      {/* 2. post form: a dialog over the list, only for accounts allowed to post */}
      {canPost && (
        <Dialog open={postOpen} onOpenChange={setPostOpen}>
          <DialogContent title={t.requests.postTitle} description={t.requests.postDesc} className="max-w-2xl">
            <PostForm need={params.get('need') ?? ''} qty={params.get('qty') ?? ''} unit={params.get('unit') ?? ''} onDone={() => setPostOpen(false)} />
          </DialogContent>
        </Dialog>
      )}

      <LoginRequiredDialog open={askLogin} onOpenChange={setAskLogin} onLogin={toLogin} />
    </>
  )
}

/** Page intro. The figures are counted from the open requests (browse API, unfiltered), never typed in. */
function RequestsHero({ action }: { action: ReactNode }) {
  const { t, lang, locale } = useI18n()
  const [all, setAll] = useState<ImportRequest[] | null>(null)
  const [howOpen, setHowOpen] = useState(false)

  useEffect(() => {
    let alive = true
    browseImportRequests().then((r) => alive && setAll(r), () => alive && setAll([]))
    return () => {
      alive = false
    }
  }, [lang])

  // browse returns at most 100 rows, so a full page reads "100+"
  const count = (n: number, cap = false) => (cap && n >= 100 ? '100+' : formatNumber(n, locale))
  const figures = all && all.length > 0 ? [
    { v: count(all.length, true), k: tx('yêu cầu đang mở nhận báo giá', 'requests open for quotes', '견적 접수 중인 요청') },
    { v: count(new Set(all.map((r) => r.country).filter(Boolean)).size), k: tx('quốc gia người mua', 'buyer countries', '구매자 국가') },
  ] : null

  return (
    <section className="relative isolate overflow-hidden bg-navy text-white">
      {/* fixed height (taller than the hero with the steps open), so opening the steps never rescales the photo */}
      <img src="/imgs/cang-bien.jpg" alt="" className="absolute inset-x-0 top-0 -z-20 h-[max(100%,72rem)] w-full animate-kenburns object-cover opacity-50" />
      {/* flat scrim so white type reads on the photo */}
      <div className="absolute inset-0 -z-10 bg-navy/65" />

      <div className="container-page pb-8 pt-6 md:pb-12 md:pt-8">
        <nav aria-label={t.ui.breadcrumb} className="text-[13px] text-white/70">
          <Link to="/" className="hover:text-white">{t.common.home}</Link> / <span className="text-white">{t.nav.requests}</span>
        </nav>

        <div className="mt-10 grid items-end gap-10 md:mt-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="min-w-0">
            <h1 className="text-[34px] font-extrabold leading-[1.05] tracking-tight text-balance md:text-6xl">{t.requests.title}</h1>
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-white/90 md:text-lg">{t.requests.sub}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              {action}
              <button
                type="button"
                aria-expanded={howOpen}
                aria-controls="requests-how"
                onClick={() => setHowOpen((v) => !v)}
                className={buttonClass('ghost', 'lg', 'bg-white/10 text-white hover:bg-white/20 hover:text-white')}
              >
                {t.home.howItWorks} <ChevronDown className={cn('transition-transform', howOpen && 'rotate-180')} />
              </button>
            </div>
          </motion.div>

          {/* live figures: bottom-aligned with the title block */}
          <dl className="grid grid-cols-2 gap-6 md:gap-12 lg:justify-self-end">
            {(figures ?? [null, null]).map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }} className="min-w-0">
                <dd className="whitespace-nowrap text-[26px] font-extrabold sm:text-[30px] leading-none tracking-tight text-gold-bright md:text-5xl">
                  {f ? f.v : <span className="inline-block h-[0.9em] w-[1.6em] animate-pulse rounded bg-white/15 align-middle" />}
                </dd>
                <dt className="mt-1.5 text-[13px] leading-snug text-white/85 md:text-[15px]">{f ? f.k : ' '}</dt>
              </motion.div>
            ))}
          </dl>
        </div>

        {/* grid rows 0fr -> 1fr animates height and padding together, so nothing pops; inert keeps hidden steps out of tab order */}
        <div id="requests-how" inert={!howOpen} className={cn('grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(.16,1,.3,1)] motion-reduce:transition-none', howOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
          <div className="min-h-0 overflow-hidden">
            <ol className="grid gap-3 pt-8 sm:grid-cols-2 lg:grid-cols-4">
              {t.home.steps.map((s, i) => (
                <li key={s.t} className="flex items-start gap-3 rounded-2xl bg-navy-2/90 p-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gold-bright text-sm font-extrabold text-[#2b1d00]">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold">{s.t}</p>
                    <p className="mt-0.5 text-[14px] leading-relaxed text-white/80">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

/** POST /api/portal/import-requests */
function PostForm({ need, qty, unit, onDone }: { need: string; qty: string; unit: string; onDone: () => void }) {
  const { t, L } = useI18n()
  const toast = useToast()
  const [sent, setSent] = useState(false)
  const [dates, setDates] = useState({ startTime: '', endTime: '' })

  // the dialog (DialogContent) carries the title and description; this is only the body
  return (
    <>
      {sent ? (
        <SuccessState title={t.requests.posted} desc={t.requests.postedDesc} onClose={onDone} />
      ) : (
        <form
          className="grid gap-4 p-6 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (USE_MOCK) {
              setSent(true)
              toast({ kind: 'success', title: t.requests.posted })
              return
            }
            const g = (k: string) => String(new FormData(e.currentTarget).get(k) ?? '')
            liveApi.postImportRequest({
              requestName: g('requestName'), categoryId: g('categoryId'), address: g('address'), quantity: Number(g('quantity')), unit: g('unit'),
              price: Number(g('price')), startTime: g('startTime'), endTime: g('endTime'), description: g('description'),
            }).then(
              () => { setSent(true); toast({ kind: 'success', title: t.requests.posted }) },
              (err: Error) => toast({ kind: 'info', title: err.message }),
            )
          }}
        >
          <Field label={t.requests.name} htmlFor="pr-name" className="sm:col-span-2"><Input id="pr-name" name="requestName" required defaultValue={need} placeholder={t.ui.requestNamePh} /></Field>
          <Field label={t.requests.category} htmlFor="pr-cat">
            <Select id="pr-cat" name="categoryId" required defaultValue="" placeholder={tx('Chọn danh mục', 'Choose a category', '카테고리 선택')} options={categories.map((c) => ({ value: c.id, label: L(c.categoryName) }))} />
          </Field>
          <Field label={t.requests.address} htmlFor="pr-addr"><Input id="pr-addr" name="address" required placeholder={t.ui.addressPh} /></Field>
          <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-2">
            <Field label={t.requests.quantity} htmlFor="pr-qty"><Input id="pr-qty" placeholder={tx('VD: 1000', 'e.g. 1000', '예: 1000')} name="quantity" type="number" min={1} required defaultValue={qty} /></Field>
            <Field label={t.requests.unit} htmlFor="pr-unit"><Select id="pr-unit" name="unit" defaultValue={UNITS.includes(unit) ? unit : 'MT'} options={UNITS.map((u) => ({ value: u, label: u }))} /></Field>
          </div>
          <Field label={t.requests.price} htmlFor="pr-price"><Input id="pr-price" placeholder={tx('VD: 4.50', 'e.g. 4.50', '예: 4.50')} name="price" type="number" min={0} step="0.01" required /></Field>
          <Field label={t.requests.start} htmlFor="pr-start"><DateField id="pr-start" name="startTime" value={dates.startTime} onChange={(e) => setDates((d) => ({ ...d, startTime: e.target.value }))} required /></Field>
          <Field label={t.requests.end} htmlFor="pr-end"><DateField id="pr-end" name="endTime" value={dates.endTime} min={dates.startTime} onChange={(e) => setDates((d) => ({ ...d, endTime: e.target.value }))} required /></Field>
          <Field label={t.requests.description} htmlFor="pr-desc" className="sm:col-span-2"><Textarea id="pr-desc" name="description" className="min-h-20" placeholder={t.product.messagePh} /></Field>
          <Button type="submit" variant="gold" size="lg" className="sm:col-span-2"><FilePlus2 /> {t.requests.post}</Button>
        </form>
      )}
    </>
  )
}
