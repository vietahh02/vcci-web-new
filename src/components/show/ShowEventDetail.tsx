/** Detail page of a Show Hub event (online trade show). Rendered by EventDetail when the id is a show. */
import { motion } from 'motion/react'
import { ArrowUpRight, Bell, BellRing, CalendarDays, CheckCircle2, ChevronDown, Clock, Globe2, ImageIcon, MapPin, Mic2, PlayCircle, Radio, Search, Send, Store, Ticket, Users, Video, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CompanyMark, CountryChip } from '@/components/brand'
import { useEventProducts, useEventRecap } from '@/api/eventApi'
import { Countdown, LiveDot, Reveal } from '@/components/effects'
import { EventParticipants } from '@/components/event/EventParticipants'
import { AddToCalendar } from '@/components/event/AddToCalendar'
import { EventRecap } from '@/components/event/EventRecap'
import { ShareButtons } from '@/components/event/ShareButtons'
import { useCancelRegistration } from '@/components/show/useCancelRegistration'
import { FavoriteButton } from '@/components/catalog/FavoriteButton'
import { eventTimeRange, isOnlineFormat } from '@/lib/eventStatus'
import { showOrganisations, showStartsAt, showToEvent } from '@/lib/showEvent'
import { tx } from '@/lib/tx'
import { ShowFeedbackDialog } from '@/components/show/ShowFeedback'
import { ShowMaterials } from '@/components/show/ShowMaterials'
import { BusinessChatButton } from '@/components/chat/BusinessChatButton'
import { showLivePath } from '@/components/live/liveRef'
import { SessionWatch } from '@/components/live/SessionWatch'
import { BadgeCard, VisitorRegistration } from '@/components/show/VisitorRegistration'
import { Dialog, DialogContent, UnderlineTabs, useToast } from '@/components/ui/overlay'
import { Badge, Button, buttonClass, Field, Input, Progress, Textarea } from '@/components/ui/primitives'
import { Select } from '@/components/ui/select'
import { showLabel, type Show, type ShowBooth, type ShowLabel, type ShowProduct, type ShowSession } from '@/data/shows'
import { useI18n } from '@/lib/i18n'
import { catalogApi, liveApi, tokens, USE_MOCK } from '@/api'
import { useAccountVisit, useMailLinkRestore } from '@/components/show/useVisitorRecovery'
import { useShowVisitor, type VisitorBadge } from '@/lib/showReg'
import { ShowFormatContext, useShowT } from '@/lib/showText'
import { cn, formatDate, formatMoney, formatNumber, img } from '@/lib/utils'

type Tab = 'overview' | 'booths' | 'products' | 'launches' | 'streams' | 'agenda' | 'speakers'

/** Show Sân chơi: the co-organisers' day slots (no product) are the show's live sessions. */
const coorganizerStreams = (show: Show) => (show.showType === 'HOSTED' ? show.launches.filter((l) => !l.productId) : [])
const fmtTime = (iso: string, locale: string) => new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })
const fmtDay = (iso: string, locale: string) => formatDate(iso, locale, { weekday: 'short', day: '2-digit', month: '2-digit' })

/** Anchor right above the sticky tab bar: scrolling to it lands the bar where it sticks. */
const TABS_TOP = 'show-tabs-top'

/** CMS rows are sometimes saved twice; show each title once. */
const uniqBy = <T,>(rows: T[], key: (r: T) => string) => rows.filter((r, i) => rows.findIndex((o) => key(o) === key(r)) === i)
/** "12/11 – 13/11", or one date when both ends fall on the same day. */
const dayRange = (start: string, end: string, locale: string, opts: Intl.DateTimeFormatOptions) =>
  start.slice(0, 10) === end.slice(0, 10) ? formatDate(start, locale, opts) : `${formatDate(start, locale, opts)} – ${formatDate(end, locale, opts)}`

/** Tab label with its item count as a pill; a zero count shows no pill. */
const tabLabel = (text: string, n = 0): ReactNode => (n > 0
  ? <span className="inline-flex items-center gap-2">{text}<span className="rounded-full bg-muted px-1.5 py-px text-[11px] font-bold tabular-nums text-muted-foreground">{n}</span></span>
  : text)

/** One hero line: the gold icon carries what the line is, so it needs no label. */
function HeroLine({ icon: Icon, main, rest }: { icon: LucideIcon; main: string; rest?: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-[18px] shrink-0 text-gold-bright" aria-hidden />
      <span><span className="font-semibold">{main}</span>{rest && <span className="text-white/75"> · {rest}</span>}</span>
    </li>
  )
}

/** Introduction from the CMS: short lines without end punctuation are sub-headings, the rest paragraphs. */
function IntroText({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  // the lead paragraph only (with any heading above it); the rest is one click away
  const lead = lines.findIndex((l) => !(l.length <= 40 && !/[.:;!?)]$/.test(l))) + 1 || 1
  const more = lines.length > lead
  const cut = more && !open ? lead : lines.length
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-foreground/85 md:text-base">
      {lines.slice(0, cut).map((l, i) => (l.length <= 40 && !/[.:;!?)]$/.test(l)
        ? <h3 key={i} className="pt-3 text-base font-bold text-foreground">{l}</h3>
        : <p key={i}>{l}</p>))}
      {more && (
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          {open ? tx('Thu gọn', 'Show less', '접기') : tx('Xem đầy đủ', 'Read more', '더 보기')}
          <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden />
        </button>
      )}
    </div>
  )
}

/** Card grid whose column count leaves no card alone on the last row where it can. */
const cardGrid = (n: number) => cn('grid gap-4', n > 1 && 'sm:grid-cols-2', n % 3 === 0 && 'xl:grid-cols-3')

const labelVariant: Record<ShowLabel, 'live' | 'success' | 'gold' | 'muted' | 'secondary'> = {
  LIVE: 'live', ONGOING: 'success', REG_OPEN: 'success', REG_NOT_OPEN: 'secondary', REG_CLOSED: 'muted', REPLAY: 'secondary', FULL: 'gold', ENDED: 'muted', CANCELED: 'muted', UPCOMING: 'secondary',
}

export function ShowLabelBadge({ show, className }: { show: Show; className?: string }) {
  const x = useShowT()
  const label = showLabel(show)
  return (
    <Badge variant={labelVariant[label]} className={cn('gap-1.5', className)}>
      {label === 'LIVE' && <LiveDot />} {x.label[label]}
    </Badge>
  )
}

export function ShowEventDetail({ show }: { show: Show }) {
  const { t, L, locale } = useI18n()
  const x = useShowT(show)
  const visitor = useShowVisitor(show.id)
  const cancelRegistration = useCancelRegistration(visitor)
  // registered from another browser, or approved since: the account's registration or the mail link brings the state here
  useAccountVisit(show.id, visitor)
  useMailLinkRestore(show.id, visitor)
  // ONLINE: products go straight into the show, so nothing about booths exists on this page (EV8-16). OFFLINE/HYBRID keep all of it.
  const online = isOnlineFormat(show.format)
  const [tab, setTab] = useState<Tab>('overview')
  const [regOpen, setRegOpen] = useState(false)
  const [booth, setBooth] = useState<ShowBooth | null>(null)
  const [inquiry, setInquiry] = useState<{ booth: ShowBooth; product?: ShowProduct } | null>(null)
  const [session, setSession] = useState<ShowSession | null>(null)
  const label = showLabel(show)
  const productCount = show.booths.reduce((n, b) => n + b.products.length, 0)
  // the API's label also closes registration while the show is upcoming (mock data computes FULL from booths, which says nothing about visitors)
  const regClosed = show.status === 'ENDED' || show.status === 'CANCELED' || show.displayLabel === 'FULL' || show.displayLabel === 'REG_NOT_OPEN' || show.displayLabel === 'REG_CLOSED'
    || (show.registrationState != null && show.registrationState !== 'OPEN')
  const hasValidBadge = visitor.badge?.status === 'ISSUED'
  const time = eventTimeRange({ startTime: show.startTime ?? '00:00', endTime: show.endTime ?? '23:59' })

  const streamCount = coorganizerStreams(show).length
  const launchCount = show.launches.length - streamCount
  const tabs: { value: Tab; label: ReactNode }[] = [
    { value: 'overview', label: x.tabs.overview },
    ...(online ? [] : [{ value: 'booths' as const, label: tabLabel(x.tabs.booths, show.booths.length) }]),
    { value: 'products', label: tabLabel(x.tabs.products, productCount) },
    ...(launchCount > 0 ? [{ value: 'launches' as const, label: tabLabel(x.tabs.launches, launchCount) }] : []),
    ...(streamCount ? [{ value: 'streams' as const, label: tabLabel(tx('Phát trực tiếp', 'Live streams', '라이브 방송'), streamCount) }] : []),
    { value: 'agenda', label: tabLabel(x.tabs.agenda, show.sessions.length) },
    // an empty speakers tab was a blank page: it only exists when there are speakers
    ...(show.speakers.length ? [{ value: 'speakers' as const, label: tabLabel(x.tabs.speakers, show.speakers.length) }] : []),
  ]
  // booths tab opened from a pavilion card on the overview starts filtered on it
  const [boothPav, setBoothPav] = useState('ALL')
  const openPavilion = (id: string) => { setBoothPav(id); goTo('booths') }
  const venue = L(show.virtualVenue)
  const address = show.physicalVenue ? L(show.physicalVenue) : ''

  const openInquiry = (b: ShowBooth, p?: ShowProduct) => (hasValidBadge ? setInquiry({ booth: b, product: p }) : setRegOpen(true))
  // ONLINE main button follows the show's state: register before, enter the live session during, replay and highlights after
  const ended = show.status === 'ENDED'
  const recapBanner = useEventRecap(showToEvent(show), ended).data?.banner
  const hasReplay = show.sessions.some((s) => s.status === 'ENDED' && (s.hasReplay || !!s.recordingUrl))
  /** Brings the start of the tab content under the sticky bars; `onlyIfPast` leaves the page alone while the hero is still in view. */
  const scrollToTabs = (onlyIfPast: boolean) => {
    const el = document.getElementById(TABS_TOP)
    if (!el) return
    const past = el.getBoundingClientRect().top < parseFloat(getComputedStyle(el).scrollMarginTop)
    if (!onlyIfPast || past) el.scrollIntoView({ behavior: 'smooth' })
  }
  const goTo = (next: Tab, anchor: string = TABS_TOP) => {
    setTab(next)
    window.setTimeout(() => (anchor === TABS_TOP ? scrollToTabs(false) : document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' })), 80)
  }
  // a sticky bar cannot be scrolled "into view": switching tabs deep in a long one jumps back to the top of the new tab instead
  const switchTab = (next: Tab) => { setTab(next); window.setTimeout(() => scrollToTabs(true), 0) }
  const enterLive = () => {
    const onAir = show.sessions.find((s) => s.status === 'LIVE')
    if (onAir) setSession(onAir)
    else goTo('agenda')
  }

  return (
    <ShowFormatContext.Provider value={show.format}>
      <section className="relative isolate overflow-hidden bg-navy text-white">
        <img src={img((ended && recapBanner) || show.banner || show.cover, 1800, 800)} alt="" className="absolute inset-0 -z-20 size-full animate-kenburns object-cover opacity-40" />
        <div className="absolute inset-0 -z-10 bg-navy/75" />
        <div className="container-page grid gap-8 py-8 md:py-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
          <Reveal className="flex min-w-0 flex-col gap-5">
            <nav className="text-[13px] text-white/60"><Link to="/events" className="hover:text-white">{t.nav.events}</Link> / {t.events.type.SHOW}</nav>
            <div className="flex flex-wrap gap-2">
              <ShowLabelBadge show={show} />
              <Badge variant="outline" className="border-white/30 text-white"><Globe2 /> {!online && show.physicalVenue ? x.onlineFirst : x.online}</Badge>
              {/* a CMS nudge such as "closing soon" contradicts a closed registration */}
              {show.heroBadge && !regClosed && <Badge variant="outline" className="border-gold-bright/40 text-gold-bright">{L(show.heroBadge)}</Badge>}
            </div>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-2xl font-extrabold leading-tight tracking-tight text-balance md:text-4xl">{L(show.heroTitle ?? show.title)}</h1>
              <p className="max-w-2xl text-white/75 md:text-base">{L(show.tagline)}</p>
            </div>
            <ul className="space-y-2.5 text-[15px]">
              <HeroLine icon={CalendarDays} main={dayRange(show.startDate, show.endDate, locale, { day: '2-digit', month: '2-digit', year: 'numeric' })} rest={time ? `${time} (GMT+7)` : undefined} />
              {online
                ? <HeroLine icon={Globe2} main={tx('Trực tuyến trên hệ thống VCCI', 'Online on the VCCI platform', 'VCCI 플랫폼 온라인')} />
                : (venue || address) && <HeroLine icon={MapPin} main={venue || address} rest={show.physicalVenue ? tx('kèm gian ảo', 'plus virtual booths', '가상 부스 포함') : undefined} />}
            </ul>
          </Reveal>

          <Reveal delay={0.15} className="h-fit rounded-3xl bg-navy-2/90 p-6 ring-1 ring-gold-bright/25">
            {show.status === 'UPCOMING' && (
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/60">{t.events.startsIn}</p>
                <Countdown target={showStartsAt(show)} labels={t.common.countdown} dark className="mt-2" />
              </div>
            )}
            {!(online && ended) && (
              <dl className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-sm text-white/70">{x.fee}</dt>
                  <dd className="text-2xl font-extrabold">{show.visitorTicketFee ? formatMoney(show.visitorTicketFee, show.ticketCurrency, locale) : x.ticketFree}</dd>
                </div>
                {show.registrationDeadline && !regClosed && (
                  <div className="flex items-baseline justify-between gap-3 text-[13px]">
                    <dt className="text-white/70">{x.regDeadline}</dt>
                    <dd className="font-semibold text-white/90">{formatDate(show.registrationDeadline, locale)}</dd>
                  </div>
                )}
                {!ended && show.requireVisitorApproval && <p className="text-xs text-gold-bright">{x.needApproval}</p>}
              </dl>
            )}

            {online && ended ? (
              <div className="mt-5 space-y-3">
                {hasReplay && <Button variant="gold" size="lg" className="w-full" onClick={() => goTo('agenda')}><PlayCircle /> {x.watchReplay}</Button>}
                <Button variant="white" size="lg" className="w-full" onClick={() => goTo('overview', 'show-recap')}>{tx('Xem tổng kết', 'View highlights', '하이라이트 보기')}</Button>
              </div>
            ) : visitor.badge ? (
              <div className="mt-5 space-y-3">
                <Badge variant={visitor.badge.status === 'ISSUED' ? 'success' : 'gold'} className="gap-1.5">
                  {visitor.badge.status === 'ISSUED' ? <CheckCircle2 /> : <Clock />}
                  {visitor.badge.status === 'ISSUED' ? x.badgeIssued : visitor.badge.status === 'PENDING_PAYMENT' ? x.badgePendingPay : x.badgePendingApprove}
                </Badge>
                {visitor.badge.status === 'ISSUED' && <BadgeCard show={show} badge={visitor.badge} />}
                <Button variant="white" className="w-full" onClick={() => setRegOpen(true)}>{x.myBadge}</Button>
                {!ended && show.status !== 'CANCELED' && <button type="button" className="block w-full text-center text-xs font-semibold text-white/70 hover:text-white hover:underline" onClick={() => void cancelRegistration()}>{x.reg.cancelReg}</button>}
              </div>
            ) : regClosed ? (
              <Button variant="white" size="lg" className="mt-6 w-full" disabled>{show.status === 'CANCELED' ? x.canceledReg : label === 'FULL' || label === 'REG_NOT_OPEN' ? x.label[label] : x.closedReg}{label !== 'REG_NOT_OPEN' && show.status !== 'CANCELED' && !ended && show.registrationDeadline ? ` · ${formatDate(show.registrationDeadline, locale)}` : ''}</Button>
            ) : (
              <Button variant="gold" size="lg" className="mt-6 w-full" onClick={() => setRegOpen(true)}><Ticket /> {x.registerVisit}</Button>
            )}
            {(online ? show.status === 'ONGOING' && hasValidBadge : label === 'LIVE') && (
              <Button variant="default" size="lg" className="mt-3 w-full bg-live hover:bg-live/90" onClick={online ? enterLive : () => setSession(show.sessions.find((s) => s.status === 'LIVE') ?? null)}>
                <LiveDot /> {x.joinLive}
              </Button>
            )}
            {show.showType === 'HOSTED' && !ended && show.status !== 'CANCELED' && (
              <div className="mt-5 space-y-3 rounded-2xl bg-white/5 p-4 text-xs leading-relaxed text-white/75 ring-1 ring-white/10" data-testid="hosted-ways">
                <p className="text-sm font-bold text-white">{tx('Hai cách tham gia Show Sân chơi', 'Two ways to join this open-platform show', '오픈 플랫폼 쇼 참여 방법 두 가지')}</p>
                <div>
                  <p className="font-semibold text-white">{tx('Chỉ xem', 'Watch only', '시청만')}</p>
                  <p>{tx(`Đăng ký một lần với VCCI bằng nút "${x.registerVisit}" ở trên. Khi được xác nhận, bạn xem được mọi phiên live trong Show, kể cả phiên do doanh nghiệp đồng tổ chức phát, không cần đăng ký từng phiên.`, `Register once with VCCI using "${x.registerVisit}" above. Once confirmed you can watch every live session in the show, including those streamed by co-organisers, with no per-session sign-up.`, `위의 "${x.registerVisit}" 버튼으로 VCCI에 한 번만 등록하세요. 확인되면 공동 주최 기업의 방송을 포함한 모든 라이브 세션을 세션별 신청 없이 시청할 수 있습니다.`)}</p>
                </div>
                <div>
                  <p className="font-semibold text-white">{tx('Đồng tổ chức - phát live', 'Co-organise - stream live', '공동 주최 - 라이브 방송')}</p>
                  <p>{tx('Doanh nghiệp đăng ký theo ngày, có phí đồng tổ chức do VCCI quy định. VCCI duyệt đơn và xác nhận phí thì doanh nghiệp tự phát live trong các ngày đã đăng ký.', 'Businesses apply by day and pay the co-organiser fee set by VCCI. Once VCCI approves and confirms the fee, you stream live on your chosen days.', '기업은 일자별로 신청하며 VCCI가 정한 공동 주최 비용을 냅니다. VCCI가 승인하고 비용을 확인하면 선택한 날에 직접 라이브 방송합니다.')}</p>
                  <Link to="/account/catalog?tab=booths" className="mt-1.5 inline-block font-semibold text-gold-bright hover:underline">{tx('Đăng ký đồng tổ chức', 'Apply to co-organise', '공동 주최 신청')} →</Link>
                </div>
              </div>
            )}
            {/* secondary actions sit below the main button, never beside it */}
            <div className={cn('mt-3 grid gap-2', !ended && show.status !== 'CANCELED' && 'grid-cols-2')}>
              {!ended && show.status !== 'CANCELED' && <AddToCalendar ev={showToEvent(show)} menu />}
              <ShareButtons url={`${window.location.origin}/events/${show.id}`} tone="dark" menu />
            </div>
          </Reveal>
        </div>
      </section>

      {/* tabs stay under the sticky site header (its visible height: 69px below lg, 113px from lg where the category row shows) */}
      <div id={TABS_TOP} className="scroll-mt-[69px] lg:scroll-mt-[113px]" aria-hidden />
      <div id="show-tabs" className="sticky top-[69px] z-30 border-b bg-background/95 backdrop-blur lg:top-[113px]">
        <div className="container-page pt-4">
          <UnderlineTabs layoutId="show-tabs" className="border-b-0" value={tab} onValueChange={(v) => switchTab(v as Tab)} items={tabs} />
        </div>
      </div>
      <div className="container-page pb-20 pt-10">
        {tab === 'overview' && show.status === 'ENDED' && <div id="show-recap" className="mb-14 space-y-10"><EventRecap ev={showToEvent(show)} /><ShowMaterials show={show} badge={visitor.badge} /></div>}
        {tab === 'overview' && <Overview show={show} onOpenPavilion={online ? undefined : openPavilion} />}
        {tab === 'overview' && <div className="-mx-4 mt-14 empty:hidden sm:mx-0"><EventParticipants ev={showToEvent(show)} listed={online ? showOrganisations(show) : undefined} /></div>}
        {tab === 'booths' && !online && <Booths key={boothPav} show={show} initialPav={boothPav} onOpen={setBooth} />}
        {tab === 'products' && <ProductsTab show={show} onAsk={openInquiry} onOpenBooth={setBooth} />}
        {tab === 'launches' && <Launches show={show} visitor={visitor} onRegister={() => setRegOpen(true)} onOpenBooth={setBooth} />}
        {tab === 'streams' && <CoorganizerStreams show={show} />}
        {tab === 'agenda' && <Agenda show={show} visitor={visitor} onRegister={() => setRegOpen(true)} onOpen={setSession} onShowLaunches={launchCount > 0 ? () => goTo('launches') : undefined} />}
        {tab === 'speakers' && <Speakers show={show} />}
      </div>

      <VisitorRegistration show={show} open={regOpen} onOpenChange={setRegOpen} visitor={visitor} />
      <ShowFeedbackDialog show={show} visitor={visitor} />
      {!online && <BoothDialog show={show} booth={booth} onClose={() => setBooth(null)} onAsk={openInquiry} />}
      {!online && <InquiryDialog show={show} ctx={inquiry} badge={visitor.badge} onClose={() => setInquiry(null)} onSent={(id) => visitor.addInquiry(id)} />}
      <SessionDialog show={show} session={session} badgeOk={hasValidBadge} onClose={() => setSession(null)} onRegister={() => { setSession(null); setRegOpen(true) }} />
    </ShowFormatContext.Provider>
  )
}

/* ------------------------------------------------------------ overview */
const sectionTitle = 'text-xl font-extrabold tracking-tight md:text-2xl'
const eyebrow = 'text-[11px] font-bold uppercase tracking-wider text-muted-foreground'

function Overview({ show, onOpenPavilion }: { show: Show; onOpenPavilion?: (id: string) => void }) {
  const { t, L, locale } = useI18n()
  const x = useShowT()
  const now = new Date().toISOString().slice(0, 10)
  const online = isOnlineFormat(show.format)
  const venue = L(show.virtualVenue)
  const address = show.physicalVenue ? L(show.physicalVenue) : ''
  const addressRest = venue && address.startsWith(venue) ? address.slice(venue.length).replace(/^[\s,·-]+/, '') : address
  const { name, email, phone } = show.contact
  const organizer = L(show.organizer)
  const hasFacts = !!organizer || show.targetMarkets.length > 0 || show.industries.length > 0
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-14">
        <section className="space-y-3">
          <h2 className={sectionTitle}>{tx('Giới thiệu', 'About the show', '소개')}</h2>
          <IntroText text={L(show.introduction)} />
        </section>

        <KeyFigures show={show} />

        {!online && show.phases.length > 0 && (
          <section className="space-y-5">
            <h2 className={sectionTitle}>{x.phasesTitle}</h2>
            <ol className="grid gap-4 sm:grid-cols-2">
              {show.phases.map((p) => {
                const active = p.start <= now && now <= p.end && show.status === 'ONGOING'
                return (
                  <li key={p.id} className={cn('flex flex-col gap-2 rounded-2xl border bg-card p-5', active && 'border-success/40 bg-success-soft/50')}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px] font-bold tabular-nums text-primary">{dayRange(p.start, p.end, locale, { day: '2-digit', month: '2-digit' })}</span>
                      {/* a physical phase is "ongoing", not "streaming live" */}
                      {active ? <Badge variant="success" className="gap-1.5"><span className="size-1.5 rounded-full bg-current" aria-hidden /> {x.label.ONGOING}</Badge> : p.end < now && <Badge variant="muted">{x.label.ENDED}</Badge>}
                    </div>
                    <p className="font-bold">{L(p.name)}</p>
                    {L(p.theme) && <p className="text-sm leading-relaxed text-muted-foreground">{L(p.theme)}</p>}
                  </li>
                )
              })}
            </ol>
          </section>
        )}

        <WhyAttend show={show} />
        <ProductLaunches show={show} />

        {!online && show.pavilions.length > 0 && (
          <section className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className={sectionTitle}>{x.pavTitle}</h2>
              {show.boothCapacity > 0 && (
                <div className="w-full max-w-60">
                  <div className="mb-1.5 flex justify-between text-xs text-muted-foreground"><span>{x.stats.booths}</span><span className="font-bold tabular-nums text-foreground">{show.booths.length}/{show.boothCapacity}</span></div>
                  <Progress value={(show.booths.length / show.boothCapacity) * 100} />
                </div>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {show.pavilions.map((pv) => {
                const n = show.booths.filter((b) => b.pavilionId === pv.id).length
                const body = <><span className="font-bold">{L(pv.name)}</span><span className="text-sm text-muted-foreground">{n} {x.stats.booths.toLowerCase()}</span></>
                return n > 0 && onOpenPavilion
                  ? <button key={pv.id} type="button" onClick={() => onOpenPavilion(pv.id)} className="flex flex-col gap-1.5 rounded-2xl border border-t-[3px] border-t-primary bg-card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg">{body}</button>
                  : <div key={pv.id} className="flex flex-col gap-1.5 rounded-2xl border border-t-[3px] bg-muted/40 p-5">{body}</div>
              })}
            </div>
          </section>
        )}

        <Highlights show={show} />
        <ShowFaqBlock show={show} />
      </div>

      <aside className="no-scrollbar space-y-4 lg:sticky lg:top-[180px] lg:max-h-[calc(100vh-200px)] lg:self-start lg:overflow-y-auto">
        {!online && address && (
          <div className="rounded-2xl border bg-card p-5">
            <p className={eyebrow}>{tx('Địa điểm', 'Venue', '장소')}</p>
            <p className="mt-2 font-bold">{venue || address}</p>
            {venue && addressRest && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{addressRest}</p>}
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              {tx('Chỉ đường', 'Directions', '길찾기')} <ArrowUpRight className="size-4" aria-hidden />
            </a>
          </div>
        )}
        {hasFacts && (
          <dl className="space-y-4 rounded-2xl border bg-card p-5 text-sm">
            {organizer && <div><dt className={eyebrow}>{t.events.organizer}</dt><dd className="mt-1.5 font-semibold">{organizer}</dd></div>}
            {show.targetMarkets.length > 0 && <div><dt className={eyebrow}>{x.markets}</dt><dd className="mt-2 flex flex-wrap gap-1.5">{show.targetMarkets.map((c) => <CountryChip key={c} code={c} />)}</dd></div>}
            {show.industries.length > 0 && <div><dt className={eyebrow}>{x.industries}</dt><dd className="mt-2 flex flex-wrap gap-1.5">{show.industries.map((i) => <Badge key={i} variant="muted">{i}</Badge>)}</dd></div>}
          </dl>
        )}
        {show.rules.length > 0 && (
          <div className="rounded-2xl border bg-card p-5">
            <p className={eyebrow}>{x.rulesTitle}</p>
            <ul className="mt-3 space-y-2.5 text-sm text-foreground/80">
              {show.rules.map((r, i) => <li key={i} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> {L(r)}</li>)}
            </ul>
          </div>
        )}
        {(name || email || phone) && (
          <div className="rounded-2xl border bg-card p-5 text-sm">
            <p className={eyebrow}>{x.contact}</p>
            {name && <p className="mt-2 font-bold">{name}</p>}
            {email && <a href={`mailto:${email}`} className="mt-1 flex min-h-9 items-center break-all text-primary hover:underline">{email}</a>}
            {phone && <a href={`tel:${phone.replace(/\s+/g, '')}`} className="flex min-h-9 items-center text-primary hover:underline">{phone}</a>}
          </div>
        )}
      </aside>
    </div>
  )
}

/** Key figures from the CMS as one band; the column count follows the number of figures so none is left alone on a row. */
const figureCols: Record<number, string> = { 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4', 5: 'md:grid-cols-5' }
function KeyFigures({ show }: { show: Show }) {
  const { L } = useI18n()
  const stats = show.stats ?? []
  if (!stats.length) return null
  return (
    <section aria-label={tx('Số liệu nổi bật', 'Key figures', '주요 수치')}>
      <dl className={cn('grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border', figureCols[stats.length] ?? 'md:grid-cols-3')}>
        {stats.map((s, i) => (
          <div key={i} className={cn('bg-card p-5', stats.length % 2 === 1 && i === stats.length - 1 && 'col-span-2 md:col-span-1')}>
            <dd className="text-2xl font-extrabold tabular-nums text-primary md:text-[28px]">{L(s.value)}</dd>
            <dt className="mt-1 text-[13px] text-muted-foreground">{L(s.label)}</dt>
          </div>
        ))}
      </dl>
    </section>
  )
}

function WhyAttend({ show }: { show: Show }) {
  const { L } = useI18n()
  const rows = uniqBy(show.whyAttend ?? [], (w) => L(w.title))
  if (!rows.length) return null
  return (
    <section className="space-y-5">
      <h2 className={sectionTitle}>{tx('Vì sao nên tham dự', 'Why attend', '참가해야 하는 이유')}</h2>
      <div className={cardGrid(rows.length)}>
        {rows.map((w, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
            <span className="grid size-10 place-items-center rounded-xl bg-success-soft text-success"><CheckCircle2 className="size-5" aria-hidden /></span>
            <p className="font-bold">{L(w.title)}</p>
            {L(w.text) && <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground" title={L(w.text)}>{L(w.text)}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}

/** Highlights from the CMS: equal cards; a missing or broken picture falls back to a quiet placeholder, never an empty frame. */
function Highlights({ show }: { show: Show }) {
  const { L } = useI18n()
  const rows = uniqBy(show.highlights ?? [], (h) => L(h.title)).sort((a, b) => Number(b.hero) - Number(a.hero))
  if (!rows.length) return null
  return (
    <section className="space-y-5">
      <h2 className={sectionTitle}>{tx('Điểm nhấn', 'Highlights', '하이라이트')}</h2>
      <div className={cardGrid(rows.length)}>
        {rows.map((h, i) => (
          <article key={i} className="flex flex-col overflow-hidden rounded-2xl border bg-card">
            {h.video ? (
              <video src={h.video} poster={h.image ? img(h.image, 800, 500) : undefined} controls preload="metadata" className="aspect-[16/10] w-full bg-navy object-cover" />
            ) : (
              <div className="relative grid aspect-[16/10] place-items-center bg-primary-soft text-primary/40">
                <ImageIcon className="size-7" aria-hidden />
                {h.image && <img src={img(h.image, 800, 500)} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} className="absolute inset-0 size-full object-cover" />}
              </div>
            )}
            <div className="flex flex-1 flex-col gap-1.5 p-5">
              <h3 className="font-bold">{L(h.title)}</h3>
              {L(h.text) && <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground" title={L(h.text)}>{L(h.text)}</p>}
              {h.link && <a href={h.link} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-primary hover:underline">{tx('Xem thêm', 'Learn more', '자세히 보기')} <ArrowUpRight className="size-4" aria-hidden /></a>}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

/** New-product launch calendar from approved participation applications (V85) - date/time marker only, no stage or stream. */
function ProductLaunches({ show }: { show: Show }) {
  const { locale } = useI18n()
  const rows = show.productLaunches ?? []
  if (!rows.length) return null
  return (
    <section className="space-y-5">
      <h2 className={sectionTitle}>{tx('Sản phẩm mới ra mắt', 'New product launches', '신제품 출시')}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {rows.map((p, i) => (
          <li key={`${p.productId}-${i}`} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
            {p.productImage ? (
              <img src={img(p.productImage, 160, 160)} alt="" loading="lazy" className="size-14 shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-muted"><Store className="size-5 text-muted-foreground" aria-hidden /></div>
            )}
            <div className="min-w-0">
              <p className="truncate font-bold">{p.productName}</p>
              {p.organizationName && <p className="truncate text-sm text-muted-foreground">{p.organizationName}</p>}
              <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-primary"><CalendarDays className="size-3.5" aria-hidden /> {formatDate(p.launchDate, locale, { day: '2-digit', month: '2-digit' })} · {p.startTime}–{p.endTime}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ShowFaqBlock({ show }: { show: Show }) {
  const { L } = useI18n()
  const faq = uniqBy(show.faq ?? [], (f) => L(f.q))
  if (!faq.length) return null
  return (
    <section className="space-y-5">
      <h2 className={sectionTitle}>{tx('Câu hỏi thường gặp', 'Frequently asked questions', '자주 묻는 질문')}</h2>
      <div className="divide-y rounded-2xl border bg-card px-5">
        {faq.map((f, i) => (
          <details key={i} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold marker:hidden group-open:text-primary [&::-webkit-details-marker]:hidden">
              {L(f.q)}
              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{L(f.a)}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------ booths */
/** Pill filter with its count; the selected one is filled. */
function FilterChip({ active, count, onClick, children }: { active: boolean; count?: number; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={cn('inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold transition', active ? 'border-navy bg-navy text-white dark:border-primary dark:bg-primary' : 'bg-card text-foreground/80 hover:border-foreground/25')}>
      {children}{count != null && <span className="text-xs font-bold tabular-nums opacity-65">{count}</span>}
    </button>
  )
}

function SearchBox({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="relative w-full sm:w-72"><Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" aria-hidden /><Input type="search" className="h-10 pl-10" placeholder={label} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} /></div>
  )
}

function PanelHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h2 className={sectionTitle}>{title}</h2>{sub && <p className="mt-1.5 text-sm text-muted-foreground">{sub}</p>}</div>
      {children && <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">{children}</div>}
    </div>
  )
}

function Booths({ show, initialPav = 'ALL', onOpen }: { show: Show; initialPav?: string; onOpen: (b: ShowBooth) => void }) {
  const { L } = useI18n()
  const x = useShowT()
  const [phase, setPhase] = useState('ALL')
  const [pav, setPav] = useState(initialPav)
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const k = q.trim().toLowerCase()
    return show.booths.filter((b) => (phase === 'ALL' || b.phaseId === phase) && (pav === 'ALL' || b.pavilionId === pav)
      && (!k || [L(b.name), L(b.org), ...b.products.map((p) => L(p.name))].some((s) => s.toLowerCase().includes(k))))
  }, [show, phase, pav, q, L])
  const pavName = (id?: string) => { const pv = show.pavilions.find((p) => p.id === id); return pv ? L(pv.name) : '' }
  return (
    <div className="space-y-6">
      <PanelHead title={x.tabs.booths} sub={show.boothCapacity > 0 ? `${show.booths.length}/${show.boothCapacity} ${x.stats.booths.toLowerCase()}` : undefined}>
        {show.phases.length > 0 && <div className="w-full sm:w-52"><Select value={phase} onValueChange={setPhase} aria-label={x.filterPhase} options={[{ value: 'ALL', label: `${x.filterPhase}: ${x.all}` }, ...show.phases.map((p) => ({ value: p.id, label: L(p.name) }))]} /></div>}
        <SearchBox value={q} onChange={setQ} label={x.search} />
      </PanelHead>
      {show.pavilions.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label={x.filterPav}>
          <FilterChip active={pav === 'ALL'} count={show.booths.length} onClick={() => setPav('ALL')}>{x.all}</FilterChip>
          {show.pavilions.map((p) => {
            const n = show.booths.filter((b) => b.pavilionId === p.id).length
            return n > 0 && <FilterChip key={p.id} active={pav === p.id} count={n} onClick={() => setPav(p.id)}>{L(p.name)}</FilterChip>
          })}
        </div>
      )}
      {list.length === 0 && <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">{x.noBooth}</p>}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((b, i) => (
          <motion.button key={b.id} type="button" onClick={() => onOpen(b)} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="group flex flex-col overflow-hidden rounded-2xl border bg-card text-left transition hover:border-primary/40 hover:shadow-lg">
            <div className="relative aspect-[16/9] overflow-hidden bg-muted">
              <img src={img(b.cover, 700, 400)} alt="" loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <Badge variant={b.side === 'SELLER' ? 'default' : 'gold'} className="absolute left-3 top-3">{b.side === 'SELLER' ? x.sellerSide : x.supportSide}</Badge>
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="flex items-center gap-3">
                <CompanyMark name={L(b.org)} accent={b.accent} className="size-10" />
                <div className="min-w-0">
                  <p className="line-clamp-2 font-bold leading-snug group-hover:text-primary">{L(b.name)}</p>
                  {/* the booth name is usually the company name: say it once, then where the booth is */}
                  <p className="truncate text-xs text-muted-foreground">{L(b.org) !== L(b.name) ? L(b.org) : pavName(b.pavilionId)}</p>
                </div>
              </div>
              {L(b.tagline) && <p className="line-clamp-2 text-sm text-muted-foreground">{L(b.tagline)}</p>}
              <div className="mt-auto flex items-center justify-between border-t pt-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-2"><CountryChip code={b.country} /> {b.products.length} {x.stats.products.toLowerCase()}</span><span className="font-bold text-primary">{tx('Xem gian', 'View booth', '부스 보기')} →</span></div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function BoothDialog({ show, booth, onClose, onAsk }: { show: Show; booth: ShowBooth | null; onClose: () => void; onAsk: (b: ShowBooth, p?: ShowProduct) => void }) {
  const { L } = useI18n()
  const x = useShowT()
  if (!booth) return null
  const pav = show.pavilions.find((p) => p.id === booth.pavilionId)
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl" title={L(booth.name)} description={`${L(booth.org)}${pav ? ` · ${L(pav.name)}` : ''}`}>
        <img src={img(booth.cover, 1000, 360)} alt="" className="h-44 w-full object-cover" />
        <div className="space-y-5 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={booth.side === 'SELLER' ? 'default' : 'gold'}>{booth.side === 'SELLER' ? x.sellerSide : x.supportSide}</Badge>
            <CountryChip code={booth.country} />
            {booth.businessId && <Link to={`/suppliers/${booth.businessId}`} className="text-sm font-semibold text-primary hover:underline">{x.viewCompany}</Link>}
            <BusinessChatButton organizationId={booth.businessId} showName={L(show.title)} onOpen={onClose} />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{L(booth.about)}</p>
          <h3 className="font-bold">{x.products}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {booth.products.map((p) => (
              <div key={p.id} className="flex gap-3 rounded-xl border p-3">
                <img src={img(p.image, 160, 160)} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold">{L(p.name)} {p.featured && <Badge variant="gold" className="ml-1">{x.featured}</Badge>}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{L(p.blurb)}{p.moq ? ` · ${x.moq} ${p.moq}` : ''}</p>
                  <div className="mt-1.5 flex gap-3 text-xs font-semibold">
                    {p.linkId ? <Link to={`/products/${p.linkId}?fromEvent=${show.id}`} className="text-primary hover:underline">{x.askPrice}</Link> : <button type="button" className="text-primary hover:underline" onClick={() => onAsk(booth, p)}>{x.askPrice}</button>}
                    {p.linkId && <Link to={`/products/${p.linkId}`} className="text-muted-foreground hover:text-foreground">{x.viewProduct}</Link>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button size="lg" className="w-full" onClick={() => onAsk(booth)}><Send /> {x.askPrice}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InquiryDialog({ show, ctx, badge, onClose, onSent }: { show: Show; ctx: { booth: ShowBooth; product?: ShowProduct } | null; badge?: VisitorBadge; onClose: () => void; onSent: (boothId: string) => void }) {
  const { L } = useI18n()
  const x = useShowT()
  const toast = useToast()
  const [product, setProduct] = useState('')
  const [qty, setQty] = useState('')
  const [msg, setMsg] = useState('')
  if (!ctx) return null
  const { booth } = ctx
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={`${x.inquiryTitle} — ${L(booth.name)}`} description={L(show.title)}>
        <form className="space-y-4 p-6" onSubmit={(e) => {
          e.preventDefault()
          const done = () => { onSent(booth.id); toast({ title: x.inquirySent, description: x.inquirySentDesc, kind: 'success' }); onClose() }
          if (USE_MOCK) return done()
          if (!badge) return toast({ title: x.reg.required, kind: 'info' })
          liveApi.showInquiry(booth.id, { email: badge.email, badgeCode: badge.code, productId: product || ctx.product?.id, quantity: qty, message: msg }).then(done, (err: Error) => toast({ title: err.message, kind: 'info' }))
        }}>
          <Field label={x.inquiryProduct} htmlFor="iq-p">
            <Select id="iq-p" placeholder={tx('Chọn sản phẩm', 'Choose a product', '제품 선택')} value={product || ctx.product?.id || ''} onValueChange={setProduct} options={[{ value: '', label: tx('Không chọn', 'None', '선택 안 함') }, ...booth.products.map((p) => ({ value: p.id, label: L(p.name) }))]} />
          </Field>
          <Field label={x.inquiryQty} htmlFor="iq-q"><Input id="iq-q" placeholder={tx('VD: 500 kg', 'e.g. 500 kg', '예: 500 kg')} value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
          <Field label={x.inquiryMsg} htmlFor="iq-m" hint={x.inquiryDaily}><Textarea id="iq-m" required placeholder={x.inquiryMsgPh} value={msg} onChange={(e) => setMsg(e.target.value)} /></Field>
          <Button type="submit" size="lg" className="w-full"><Send /> {x.inquirySend}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------ products */
function ProductsTab({ show, onAsk, onOpenBooth }: { show: Show; onAsk: (b: ShowBooth, p?: ShowProduct) => void; onOpenBooth: (b: ShowBooth) => void }) {
  const { L } = useI18n()
  const x = useShowT()
  const online = isOnlineFormat(show.format)
  // how many businesses asked about each product (public count, never who): featured first, then the most asked about
  const traded = useEventProducts(showToEvent(show)).data
  const interest = useMemo(() => new Map((traded ?? []).map((t) => [t.product.id, t.quotes])), [traded])
  const interestOf = (p: ShowProduct) => (p.linkId ? interest.get(p.linkId) ?? 0 : 0)
  const all = show.booths.flatMap((b) => b.products.map((p) => ({ b, p }))).sort((a, c) => Number(!!c.p.featured) - Number(!!a.p.featured) || interestOf(c.p) - interestOf(a.p))
  // favourites of the whole tab in one request; a guest has none and is sent to sign in on click
  const [favorites, setFavorites] = useState<Set<string> | null>(null)
  const favoriteKey = all.map(({ p }) => p.linkId).filter(Boolean).join(',')
  useEffect(() => {
    if (USE_MOCK || !tokens.access() || !favoriteKey) return
    catalogApi.favoriteIds(favoriteKey.split(',')).then(setFavorites, () => undefined)
  }, [favoriteKey])
  const [org, setOrg] = useState('ALL')
  const [q, setQ] = useState('')
  if (!all.length) return <EmptyPanel icon={Store} title={tx('Chưa có sản phẩm nào', 'No products yet', '아직 제품이 없습니다')} text={tx('Sản phẩm sẽ xuất hiện khi doanh nghiệp tham gia được duyệt.', 'Products appear once exhibitors are approved.', '참가 기업이 승인되면 제품이 표시됩니다.')} />
  const orgs = uniqBy(all.map(({ b }) => b), (b) => L(b.org))
  const k = q.trim().toLowerCase()
  const shown = all.filter(({ b, p }) => (org === 'ALL' || L(b.org) === org) && (!k || L(p.name).toLowerCase().includes(k)))
  return (
    <div className="space-y-6">
      <PanelHead title={x.tabs.products} sub={`${all.length} ${x.stats.products.toLowerCase()} · ${x.priceOnRequest.toLowerCase()}`}>
        <SearchBox value={q} onChange={setQ} label={tx('Tìm sản phẩm', 'Search products', '제품 검색')} />
      </PanelHead>
      {orgs.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label={tx('Lọc theo doanh nghiệp', 'Filter by company', '기업별 필터')}>
          <FilterChip active={org === 'ALL'} count={all.length} onClick={() => setOrg('ALL')}>{x.all}</FilterChip>
          {orgs.map((b) => <FilterChip key={b.id} active={org === L(b.org)} count={all.filter((r) => L(r.b.org) === L(b.org)).length} onClick={() => setOrg(L(b.org))}>{L(b.org)}</FilterChip>)}
        </div>
      )}
      {shown.length === 0 && <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">{tx('Không tìm thấy sản phẩm phù hợp.', 'No matching products.', '일치하는 제품이 없습니다.')}</p>}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map(({ b, p }) => {
          const toProduct = online && p.linkId ? `/products/${p.linkId}?fromEvent=${show.id}` : null
          const picture = (
            <div className="relative grid aspect-square place-items-center overflow-hidden bg-muted text-muted-foreground/40">
              <ImageIcon className="size-8" aria-hidden />
              <img src={img(p.image, 500, 500)} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105" />
              {p.featured && <Badge variant="gold" className="absolute left-3 top-3">{x.featured}</Badge>}
            </div>
          )
          return (
            <article key={`${b.id}-${p.id}`} className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition hover:border-primary/35 hover:shadow-lg">
              <div className="relative">
                {toProduct ? <Link to={toProduct} className="block" aria-label={L(p.name)}>{picture}</Link> : picture}
                {p.linkId && <FavoriteButton productId={p.linkId} initial={favorites?.has(p.linkId) ?? false} className="absolute right-2.5 top-2.5 size-9 rounded-full bg-white/90 text-navy shadow hover:bg-white" />}
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-4">
                <h3 className="line-clamp-2 min-h-[2.75rem] font-bold leading-snug">{toProduct ? <Link to={toProduct} className="hover:text-primary">{L(p.name)}</Link> : L(p.name)}</h3>
                {online ? <OrgName booth={b} /> : <button type="button" onClick={() => onOpenBooth(b)} className="truncate text-left text-xs text-muted-foreground hover:text-primary">{L(b.org)}</button>}
                {p.moq && <p className="text-xs text-muted-foreground">{x.moq} {p.moq}</p>}
                {interestOf(p) > 0 && <Badge variant="secondary" className="self-start">{tx(`${interestOf(p)} doanh nghiệp quan tâm`, `${interestOf(p)} businesses interested`, `${interestOf(p)}개 기업 관심`)}</Badge>}
                {/* actions pinned to the bottom so every card lines up */}
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                  {/* DEC-EV8-08: a catalogue product is quoted on its own page (RfqDialog); the booth dialog stays for unlinked products */}
                  {p.linkId ? <Link to={`/products/${p.linkId}?fromEvent=${show.id}`} className={buttonClass('outline', 'sm', 'flex-1')}>{x.askPrice}</Link> : !online && <Button size="sm" variant="outline" className="flex-1" onClick={() => onAsk(b, p)}>{x.askPrice}</Button>}
                  <BusinessChatButton organizationId={b.businessId} showName={L(show.title)} className="text-xs" />
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function EmptyPanel({ icon: Icon, title, text, children }: { icon: LucideIcon; title: string; text: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed bg-muted/30 px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary"><Icon className="size-6" aria-hidden /></span>
      <p className="text-lg font-bold">{title}</p>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{text}</p>
      {children && <div className="mt-2 flex flex-wrap justify-center gap-2.5">{children}</div>}
    </div>
  )
}

/** The business behind a product of an ONLINE show: its public profile when known. */
function OrgName({ booth }: { booth: ShowBooth }) {
  const { L } = useI18n()
  return booth.businessId
    ? <Link to={`/suppliers/${booth.businessId}`} className="mt-0.5 block text-xs text-muted-foreground hover:text-primary">{L(booth.org)}</Link>
    : <p className="mt-0.5 text-xs text-muted-foreground">{L(booth.org)}</p>
}

/* ------------------------------------------------------------ launches */
function Launches({ show, visitor, onRegister, onOpenBooth }: { show: Show; visitor: ReturnType<typeof useShowVisitor>; onRegister: () => void; onOpenBooth: (b: ShowBooth) => void }) {
  const { L, locale } = useI18n()
  const x = useShowT()
  const toast = useToast()
  // shortcut: followed slots are remembered for this page view only, the BE has no "my follows by badge" read; add one to survive a reload
  const [following, setFollowing] = useState<Set<string>>(new Set())
  const toggleFollow = (id: string, on: boolean) => {
    const apply = () => {
      setFollowing((s) => { const n = new Set(s); if (on) n.delete(id); else n.add(id); return n })
      if (!on) toast({ title: x.following, description: x.followDesc, kind: 'success' })
    }
    if (USE_MOCK) return apply()
    if (!visitor.badge) return onRegister()
    liveApi.showLaunchFollow(id, !on, visitor.badge.email, visitor.badge.code).then(apply, (e: Error) => toast({ title: e.message, kind: 'info' }))
  }
  const sorted = [...show.launches].sort((a, b) => a.start.localeCompare(b.start))
  const stages = [...new Set(sorted.map((l) => L(l.stage)))]
  if (!sorted.length) return <EmptyPanel icon={Radio} title={x.noLaunch} text={x.launchSub} />
  return (
    <div className="space-y-6">
      <PanelHead title={x.launchTitle} />
      {/* one stage takes the full width; two columns only when there really are several stages */}
      <div className={cn('grid gap-8', stages.length > 1 && 'lg:grid-cols-2')}>
        {stages.map((st) => {
          const rows = sorted.filter((l) => L(l.stage) === st)
          const days = [...new Set(rows.map((l) => l.start.slice(0, 10)))]
          return (
            <div key={st} className="space-y-4">
              <p className="flex items-center gap-2 text-sm font-bold text-primary"><Radio className="size-4" aria-hidden /> {x.stage}: {st}</p>
              {days.map((day) => (
                <div key={day} className="space-y-2.5">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">{formatDate(day, locale, { weekday: 'long', day: '2-digit', month: '2-digit' })}</p>
                  <ul className="divide-y rounded-2xl border bg-card">
                    {rows.filter((l) => l.start.slice(0, 10) === day).map((l) => {
                      const b = show.booths.find((bb) => bb.id === l.boothId)
                      const p = b?.products.find((pp) => pp.id === l.productId)
                      if (!b || !p) return null
                      const on = following.has(l.id)
                      return (
                        <li key={l.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 p-4 sm:grid-cols-[120px_auto_minmax(0,1fr)_auto]">
                          <span className="col-span-2 whitespace-nowrap text-sm font-extrabold tabular-nums sm:col-span-1">{fmtTime(l.start, locale)} – {fmtTime(l.end, locale)}</span>
                          <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted text-muted-foreground/40">
                            <ImageIcon className="size-5" aria-hidden />
                            <img src={img(p.image, 200, 200)} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} className="absolute inset-0 size-full object-cover" />
                          </span>
                          <div className="min-w-0">
                            <p className="line-clamp-2 font-bold leading-snug">{L(p.name)}</p>
                            {isOnlineFormat(show.format) ? <OrgName booth={b} /> : <button type="button" onClick={() => onOpenBooth(b)} className="text-left text-xs text-muted-foreground hover:text-primary">{L(b.org)}</button>}
                            {!USE_MOCK && l.live && l.streamEventId && <Link to={showLivePath(show.id, { launch: l.id })} className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-live hover:underline"><LiveDot /> {x.joinLive}</Link>}
                          </div>
                          <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:justify-end">
                            <span className="text-xs text-muted-foreground">{formatNumber(l.followers + (on ? 1 : 0), locale)} {x.followers}</span>
                            <Button size="sm" variant={on ? 'secondary' : 'outline'} aria-pressed={on} onClick={() => toggleFollow(l.id, on)}>{on ? <BellRing /> : <Bell />} {on ? x.following : x.follow}</Button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ co-organiser streams (HOSTED) */
function CoorganizerStreams({ show }: { show: Show }) {
  const { L, locale } = useI18n()
  const x = useShowT()
  const now = new Date().toISOString()
  const slots = coorganizerStreams(show).sort((a, b) => Number(b.live) - Number(a.live) || a.start.localeCompare(b.start))
  return (
    <div>
      <h2 className="text-xl font-extrabold">{tx('Phát trực tiếp của doanh nghiệp đồng tổ chức', 'Live streams by co-organisers', '공동 주최 기업 라이브 방송')}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{tx('Đã đăng ký tham gia với VCCI thì bấm vào phiên đang phát để xem, không cần đăng ký từng phiên.', 'Registered with VCCI? Click a session that is live to watch, no per-session sign-up.', 'VCCI에 등록했다면 방송 중인 세션을 눌러 바로 시청하세요. 세션별 신청은 필요 없습니다.')}</p>
      <ul className="mt-6 divide-y rounded-2xl border bg-card" data-testid="coorganizer-streams">
        {slots.map((l) => {
          const org = l.organizationName ?? (() => { const b = show.booths.find((bb) => bb.id === l.boothId); return b ? L(b.org) : undefined })()
          const ended = !l.live && l.end < now
          return (
            <li key={l.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-primary">{fmtDay(l.start, locale)} · {fmtTime(l.start, locale)}–{fmtTime(l.end, locale)}</p>
                <p className="mt-0.5 line-clamp-1 font-bold">{org ?? tx('Doanh nghiệp đồng tổ chức', 'Co-organiser', '공동 주최 기업')}</p>
              </div>
              {l.live && l.streamEventId
                ? <Link to={showLivePath(show.id, { launch: l.id })} className={buttonClass('default', 'sm', 'bg-live hover:bg-live/90')}><LiveDot /> {x.joinLive}</Link>
                : <Badge variant="outline">{ended ? x.sessionStatus.ENDED : x.sessionStatus.PUBLISHED}</Badge>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------ agenda */
/** Capacity 0 means no seat limit was set, not a full session. */
const isFull = (s: ShowSession) => s.capacity > 0 && s.booked >= s.capacity

function Agenda({ show, visitor, onRegister, onOpen, onShowLaunches }: { show: Show; visitor: ReturnType<typeof useShowVisitor>; onRegister: () => void; onOpen: (s: ShowSession) => void; onShowLaunches?: () => void }) {
  const { L, locale } = useI18n()
  const x = useShowT()
  const toast = useToast()
  const sessions = [...show.sessions].sort((a, b) => a.start.localeCompare(b.start))
  const byDay = sessions.reduce<Record<string, ShowSession[]>>((acc, s) => { (acc[s.start.slice(0, 10)] ??= []).push(s); return acc }, {})
  const badgeOk = visitor.badge?.status === 'ISSUED'
  // Show Sân chơi: agenda chỉ là lịch chữ do VCCI soạn - không xem live, không đặt chỗ
  const textOnly = show.showType === 'HOSTED'
  if (!sessions.length) {
    return (
      <EmptyPanel icon={CalendarDays} title={x.noSessions} text={tx('Ban tổ chức sẽ cập nhật lịch các phiên tại đây.', 'The organiser will publish the session schedule here.', '주최 측이 이곳에 세션 일정을 게시합니다.')}>
        {onShowLaunches && <Button onClick={onShowLaunches}><Radio /> {x.launchTitle}</Button>}
      </EmptyPanel>
    )
  }

  const book = (s: ShowSession) => {
    if (!badgeOk) return onRegister()
    const full = isFull(s)
    const apply = (waitlist: boolean) => {
      visitor.setBooking(s.id, waitlist ? 'WAITLIST' : 'BOOKED')
      toast({ title: waitlist ? x.waitlistToast : x.bookedToast, kind: 'success' })
    }
    if (USE_MOCK || !visitor.badge) return apply(full)
    liveApi.showBook(s.id, visitor.badge.email, visitor.badge.code).then(
      (r) => apply(String((r as { bookingStatus?: string }).bookingStatus ?? (full ? 'WAITLIST' : '')).toUpperCase().includes('WAIT')),
      (err: Error) => toast({ title: err.message, kind: 'info' }),
    )
  }

  return (
    <div className="space-y-10">
      <PanelHead title={x.sessionsTitle} />
      {Object.entries(byDay).map(([day, list]) => (
        <section key={day}>
          <p className="mb-3 text-sm font-extrabold uppercase tracking-wider text-primary">{formatDate(day, locale, { weekday: 'long', day: '2-digit', month: 'long' })}</p>
          <ul className="divide-y rounded-2xl border bg-card">
            {list.map((s) => {
              const mine = visitor.bookings[s.id]
              const full = isFull(s)
              const speakers = s.speakerIds.map((id) => show.speakers.find((sp) => sp.id === id)).filter((v) => v !== undefined)
              const canceled = s.status === 'CANCELED'
              return (
                <li key={s.id} className={cn('grid gap-4 p-4 md:grid-cols-[110px_1fr_auto] md:items-center', canceled && 'opacity-60')}>
                  <div className="text-sm font-bold tabular-nums">{fmtTime(s.start, locale)}–{fmtTime(s.end, locale)}</div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{x.kind[s.kind]}</Badge>
                      {textOnly ? <Badge variant={canceled ? 'muted' : 'outline'}>{s.status === 'LIVE' ? x.label.ONGOING : x.sessionStatus[s.status]}</Badge>
                        : s.status === 'LIVE' ? <Badge variant="live" className="gap-1"><LiveDot /> {x.sessionStatus.LIVE}</Badge> : <Badge variant={canceled ? 'muted' : 'outline'}>{x.sessionStatus[s.status]}</Badge>}
                      {!textOnly && s.hasReplay && s.status === 'ENDED' && <Badge variant="success"><Video /> {x.label.REPLAY}</Badge>}
                    </div>
                    <button type="button" onClick={() => onOpen(s)} className={cn('mt-1.5 text-left font-bold leading-snug hover:text-primary', canceled && 'line-through')}>{L(s.title)}</button>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {x.room}: {L(s.room)}{speakers.length ? ` · ${speakers.map((sp) => sp.name).join(', ')}` : ''}
                    </p>
                    {!canceled && s.status !== 'ENDED' && s.capacity > 0 && (
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="size-3.5" /> {s.booked}/{s.capacity} {x.seats}{full ? ` · ${x.waitlist}` : ` · ${x.left} ${s.capacity - s.booked}`}</p>
                    )}
                  </div>
                  {!textOnly && <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    {s.status === 'LIVE' && <Button size="sm" className="bg-live hover:bg-live/90" onClick={() => onOpen(s)}><LiveDot /> {x.joinLive}</Button>}
                    {s.status === 'ENDED' && (s.hasReplay || s.recordingUrl) && <Button size="sm" variant="outline" onClick={() => onOpen(s)}><PlayCircle /> {x.watchReplay}</Button>}
                    {s.status === 'PUBLISHED' && (mine ? (
                      <>
                        <Badge variant={mine === 'BOOKED' ? 'success' : 'gold'}>{mine === 'BOOKED' ? x.booked : x.onWaitlist}</Badge>
                        <Button size="sm" variant="ghost" onClick={() => {
                          const done = () => { visitor.setBooking(s.id, null); toast({ title: x.cancelToast, kind: 'info' }) }
                          if (USE_MOCK || !visitor.badge) return done()
                          liveApi.showUnbook(s.id, visitor.badge.email, visitor.badge.code).then(done, (err: Error) => toast({ title: err.message, kind: 'info' }))
                        }}>{x.cancelBooking}</Button>
                      </>
                    ) : (
                      <Button size="sm" variant={full ? 'outline' : 'default'} onClick={() => book(s)} title={badgeOk ? undefined : x.needBadgeBook}>{full ? x.joinWaitlist : x.book}</Button>
                    ))}
                  </div>}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------ speakers */
function Speakers({ show }: { show: Show }) {
  const { L } = useI18n()
  const x = useShowT()
  if (!show.speakers.length) return <EmptyPanel icon={Mic2} title={x.tabs.speakers} text={tx('Danh sách diễn giả đang được cập nhật.', 'Speakers will be announced soon.', '연사 명단을 준비 중입니다.')} />
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {show.speakers.map((sp) => {
        const sessions = show.sessions.filter((s) => s.speakerIds.includes(sp.id) && s.status !== 'CANCELED')
        return (
          <div key={sp.id} className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-3">
              <CompanyMark name={sp.name} accent={sp.accent} className="size-14 rounded-full text-lg" />
              <div className="min-w-0"><p className="truncate font-bold">{sp.name}</p><p className="line-clamp-2 text-xs text-muted-foreground">{L(sp.title)} · {L(sp.org)}</p></div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{L(sp.bio)}</p>
            {sessions.length > 0 && (
              <div className="mt-3 border-t pt-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"><Mic2 className="size-3.5" /> {x.speakerAt}</p>
                <ul className="space-y-1 text-sm">{sessions.map((s) => <li key={s.id} className="line-clamp-1">{L(s.title)}</li>)}</ul>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------ live / replay */
function SessionDialog({ show, session, badgeOk, onClose, onRegister }: { show: Show; session: ShowSession | null; badgeOk: boolean; onClose: () => void; onRegister: () => void }) {
  const { L, locale } = useI18n()
  const x = useShowT()
  if (!session) return null
  const live = session.status === 'LIVE'
  const replay = session.status === 'ENDED' && (session.hasReplay || !!session.recordingUrl)
  // status của /full tính theo giờ Timeline; có phòng phát thì vẫn cho vào, phòng xem hiện trạng thái thật của phiên
  // Show Sân chơi: agenda chỉ là lịch chữ, không có phòng xem; phiên live là của DN đồng tổ chức
  const textOnly = show.showType === 'HOSTED'
  const watchable = !textOnly && (live || replay || (!!session.live && session.status !== 'CANCELED'))
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl" title={L(session.title)} description={`${fmtDay(session.start, locale)} · ${fmtTime(session.start, locale)}–${fmtTime(session.end, locale)} · ${L(session.room)}`}>
        <div className="space-y-4 p-6">
          <p className="text-sm text-muted-foreground">{L(session.summary)}</p>
          {watchable && !badgeOk && (
            <div className="rounded-xl border border-dashed p-5 text-center">
              <Ticket className="mx-auto size-8 text-primary" />
              <p className="mt-2 text-sm font-semibold">{x.needBadgeBook}</p>
              <Button className="mt-3" onClick={onRegister}>{x.registerVisit}</Button>
            </div>
          )}
          {watchable && badgeOk && (
            <>
              <p className="flex items-center gap-2 text-sm font-semibold text-success"><CheckCircle2 className="size-4" /> {x.verified}</p>
              {USE_MOCK ? (
                <>
                  <div className="relative aspect-video overflow-hidden rounded-xl bg-navy">
                    <img src={img(show.cover, 900, 500)} alt="" className="size-full object-cover opacity-50" />
                    <div className="absolute inset-0 grid place-items-center">
                      <span className="grid size-16 place-items-center rounded-full bg-white/90 text-navy"><PlayCircle className="size-9" /></span>
                    </div>
                    <Badge variant={live ? 'live' : 'secondary'} className="absolute left-3 top-3 gap-1.5">{live ? <><LiveDot /> {x.sessionStatus.LIVE}</> : x.replayLabel}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{x.demoPlayer}</p>
                </>
              ) : <SessionWatch show={show} session={session} live={live} />}
            </>
          )}
          {!watchable && !textOnly && <p className="text-sm font-medium text-muted-foreground">{session.status === 'CANCELED' ? x.sessionStatus.CANCELED : x.notStarted}</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
