/** RFQ layout: split header (pitch + inline post form) + tabular board. */
import { motion } from 'motion/react'
import { ArrowUpRight, ChevronDown, FilePlus2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { browseImportRequests, getCategory, liveApi, tokens, USE_MOCK } from '@/api'
import { useProfile } from '@/lib/profile'
import { ConfirmDialog } from '@/components/chat/ChatDialogs'
import { categories, type ImportRequest } from '@/data/mock'
import { CountryChip } from '@/components/brand'
import { useToast } from '@/components/ui/overlay'
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
  const [params] = useSearchParams()
  const [cat, setCat] = useState('')
  const [list, setList] = useState<ImportRequest[] | null>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const q = (params.get('q') ?? '').toLowerCase()
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
    else if (canPost) setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, authed, canPost])

  const filtered = list?.filter((r) => !q || L(r.requestName).toLowerCase().includes(q) || r.productType.toLowerCase().includes(q))

  return (
    <>
      {/* 1. intro: compact, with a jump to the form below */}
      <section className="relative overflow-hidden bg-gold-soft">
        <div className="container-page py-8 md:py-10">
          <nav aria-label={t.ui.breadcrumb} className="text-[13px] text-muted-foreground">
            <Link to="/" className="hover:text-foreground">{t.common.home}</Link> / <span className="text-foreground">{t.nav.requests}</span>
          </nav>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <h1 className="text-4xl font-extrabold tracking-tight text-balance md:text-5xl">{t.requests.title}</h1>
              <p className="mt-3 max-w-2xl text-foreground/85 md:text-lg">{t.requests.sub}</p>
            </div>
            {!authed ? (
              <button type="button" onClick={() => setAskLogin(true)} className={buttonClass('gold', 'lg')}><FilePlus2 /> {t.nav.postRequest}</button>
            ) : canPost && (
              <a href="#post-request" className={buttonClass('gold', 'lg')}><FilePlus2 /> {t.nav.postRequest}</a>
            )}
          </motion.div>
          {/* the how-to folds away so the list starts on the first screen */}
          <details className="group mt-6">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full bg-background/70 px-4 text-sm font-semibold transition hover:bg-background [&::-webkit-details-marker]:hidden">
              {t.home.howItWorks} · {t.home.steps.length} {tx('bước', 'steps', '단계')} <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
            </summary>
            <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {t.home.steps.map((s, i) => (
                <li key={s.t} className="flex items-start gap-3 rounded-2xl bg-background/80 p-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gold-bright text-sm font-extrabold text-[#2b1d00]">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold">{s.t}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-foreground/80">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </details>
        </div>
      </section>

      <section className="container-page mt-8 md:mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-extrabold tracking-tight">{t.home.requestsTitle}</h2>
          <Select value={cat} onValueChange={setCat} className="h-11 w-full text-[13px] sm:h-10 sm:w-auto sm:min-w-52" aria-label={t.requests.category} options={[{ value: '', label: t.requests.allCats }, ...categories.map((c) => ({ value: c.id, label: L(c.categoryName) }))]} />
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

      {/* 2. post form: below the list, same page; only for accounts allowed to post */}
      {canPost ? (
        <section id="post-request" ref={formRef} className="container-page mt-16 scroll-mt-32 pb-16">
          <div className="mx-auto max-w-3xl">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{t.nav.postRequest}</p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight">{t.requests.postTitle}</h2>
            </div>
            <PostForm need={params.get('need') ?? ''} qty={params.get('qty') ?? ''} unit={params.get('unit') ?? ''} />
          </div>
        </section>
      ) : (
        <div className="pb-16" />
      )}

      <ConfirmDialog
        open={askLogin}
        onOpenChange={setAskLogin}
        title={tx('Cần đăng nhập', 'Sign in required', '로그인이 필요합니다')}
        description={tx('Vui lòng đăng nhập bằng tài khoản doanh nghiệp để đăng yêu cầu nhập khẩu.', 'Please sign in with your business account to post an import request.', '수입 요청을 등록하려면 기업 계정으로 로그인하세요.')}
        confirm={tx('Đăng nhập', 'Sign in', '로그인')}
        onConfirm={toLogin}
      />
    </>
  )
}

/** POST /api/portal/import-requests */
function PostForm({ need, qty, unit }: { need: string; qty: string; unit: string }) {
  const { t, L } = useI18n()
  const toast = useToast()
  const [sent, setSent] = useState(false)
  const [dates, setDates] = useState({ startTime: '', endTime: '' })

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
    </div>
  )
}
