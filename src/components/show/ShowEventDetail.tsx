/** Detail page of a Show Hub event (online trade show). Rendered by EventDetail when the id is a show. */
import { motion } from 'motion/react'
import { Bell, BellRing, Building2, Quote, CalendarDays, CheckCircle2, Clock, Globe2, MapPin, Mic2, PlayCircle, Radio, Search, Send, Store, Ticket, Users, Video } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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

  const tabs: { value: Tab; label: string }[] = [
    { value: 'overview', label: x.tabs.overview },
    ...(online ? [] : [{ value: 'booths' as const, label: `${x.tabs.booths} (${show.booths.length})` }]),
    { value: 'products', label: `${x.tabs.products} (${productCount})` },
    ...(show.launches.length > coorganizerStreams(show).length ? [{ value: 'launches' as const, label: x.tabs.launches }] : []),
    ...(coorganizerStreams(show).length ? [{ value: 'streams' as const, label: `${tx('Phát trực tiếp', 'Live streams', '라이브 방송')} (${coorganizerStreams(show).length})` }] : []),
    { value: 'agenda', label: `${x.tabs.agenda} (${show.sessions.length})` },
    { value: 'speakers', label: x.tabs.speakers },
  ]

  const openInquiry = (b: ShowBooth, p?: ShowProduct) => (hasValidBadge ? setInquiry({ booth: b, product: p }) : setRegOpen(true))
  // ONLINE main button follows the show's state: register before, enter the live session during, replay and highlights after
  const ended = show.status === 'ENDED'
  const recapBanner = useEventRecap(showToEvent(show), ended).data?.banner
  const hasReplay = show.sessions.some((s) => s.status === 'ENDED' && (s.hasReplay || !!s.recordingUrl))
  const goTo = (next: Tab, anchor: string) => {
    setTab(next)
    window.setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' }), 80)
  }
  const enterLive = () => {
    const onAir = show.sessions.find((s) => s.status === 'LIVE')
    if (onAir) setSession(onAir)
    else goTo('agenda', 'show-tabs')
  }

  return (
    <ShowFormatContext.Provider value={show.format}>
      <section className="relative isolate overflow-hidden bg-navy text-white">
        <img src={img((ended && recapBanner) || show.banner || show.cover, 1800, 800)} alt="" className="absolute inset-0 -z-20 size-full animate-kenburns object-cover opacity-40" />
        <div className="absolute inset-0 -z-10 bg-navy/75" />
        <div className="container-page grid gap-8 py-8 md:py-10 lg:grid-cols-[1fr_380px]">
          <Reveal>
            <nav className="mb-5 text-[13px] text-white/60"><Link to="/events" className="hover:text-white">{t.nav.events}</Link> / {t.events.type.SHOW}</nav>
            <div className="flex flex-wrap gap-2">
              <ShowLabelBadge show={show} />
              {show.heroBadge && <Badge variant="outline" className="border-gold-bright/40 text-gold-bright">{L(show.heroBadge)}</Badge>}
              <Badge variant="outline" className="border-white/30 text-white"><Store /> {t.events.type.SHOW}</Badge>
              <Badge variant="outline" className="border-white/30 text-white"><Globe2 /> {!online && show.physicalVenue ? x.onlineFirst : x.online}</Badge>
              {show.industries.slice(0, 4).map((i) => <Badge key={i} variant="outline" className="border-white/20 text-white/80">{i}</Badge>)}
            </div>
            <h1 className="mt-3 max-w-3xl text-2xl font-extrabold leading-tight tracking-tight text-balance md:text-4xl">{L(show.heroTitle ?? show.title)}</h1>
            <p className="mt-2 max-w-2xl text-white/75 md:text-base">{L(show.tagline)}</p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
              <span className="inline-flex items-center gap-2"><CalendarDays className="size-4 text-gold-bright" /> {formatDate(show.startDate, locale, { day: '2-digit', month: 'long' })} – {formatDate(show.endDate, locale, { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              {time && <span className="inline-flex items-center gap-2"><Clock className="size-4 text-gold-bright" /> {time} (GMT+7)</span>}
              <span className="inline-flex items-center gap-2"><Globe2 className="size-4 text-gold-bright" /> {online ? tx('Trực tuyến', 'Online', '온라인') : L(show.virtualVenue)}</span>
              {!online && show.physicalVenue && <span className="inline-flex items-center gap-2 text-white/60"><MapPin className="size-4" /> {x.physicalVenue}: {L(show.physicalVenue)}</span>}
              <span className="inline-flex items-center gap-2"><Building2 className="size-4 text-gold-bright" /> {L(show.organizer)}</span>
            </div>
            <dl className={cn('mt-5 grid max-w-xl gap-4', online ? 'grid-cols-3' : 'grid-cols-4')}>
              {[...(online ? [] : [[show.booths.length, x.stats.booths]]), [productCount, x.stats.products], [show.sessions.length, x.stats.sessions], [show.issuedBadges, x.stats.badges]].map(([n, l]) => (
                <div key={l}><dd className="text-xl font-extrabold tabular-nums md:text-2xl">{formatNumber(Number(n), locale)}</dd><dt className="text-[11px] font-semibold uppercase tracking-wider text-white/60">{l}</dt></div>
              ))}
            </dl>
            <ShareButtons url={`${window.location.origin}/events/${show.id}`} tone="dark" className="mt-5" />
          </Reveal>

          <Reveal delay={0.15} className="h-fit rounded-3xl bg-navy/80 p-6 ring-1 ring-gold-bright/25">
            {show.status === 'UPCOMING' && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/60">{t.events.startsIn}</p>
                <Countdown target={showStartsAt(show)} labels={t.common.countdown} dark className="mt-2" />
              </>
            )}
            {!(online && ended) && <div className="mt-5 flex items-baseline justify-between">
              <span className="text-sm text-white/65">{x.fee}</span>
              <span className="text-2xl font-extrabold">{show.visitorTicketFee ? formatMoney(show.visitorTicketFee, show.ticketCurrency, locale) : x.ticketFree}</span>
            </div>}
            {!ended && show.requireVisitorApproval && <p className="mt-2 text-xs text-gold-bright">{x.needApproval}</p>}
            {!(online && ended) && show.registrationDeadline && <p className="mt-3 text-xs text-white/60">{x.regDeadline}: {formatDate(show.registrationDeadline, locale)}</p>}

            {online && ended ? (
              <div className="space-y-3">
                {hasReplay && <Button variant="gold" size="lg" className="w-full" onClick={() => goTo('agenda', 'show-tabs')}><PlayCircle /> {x.watchReplay}</Button>}
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
              <Button variant="white" size="lg" className="mt-6 w-full" disabled>{show.status === 'CANCELED' ? x.canceledReg : label === 'FULL' || label === 'REG_NOT_OPEN' ? x.label[label] : x.closedReg}</Button>
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
            {!ended && show.status !== 'CANCELED' && <AddToCalendar ev={showToEvent(show)} className="mt-4" />}
          </Reveal>
        </div>
      </section>

      <div id="show-tabs" className="container-page mt-8">
        <UnderlineTabs layoutId="show-tabs" value={tab} onValueChange={(v) => setTab(v as Tab)} items={tabs} />
        <div className="py-8">
          {tab === 'overview' && show.status === 'ENDED' && <div id="show-recap" className="mb-12 space-y-10"><EventRecap ev={showToEvent(show)} /><ShowMaterials show={show} badge={visitor.badge} /></div>}
          {tab === 'overview' && <Overview show={show} />}
          {tab === 'overview' && <div className="-mx-4 sm:mx-0"><EventParticipants ev={showToEvent(show)} listed={online ? showOrganisations(show) : undefined} /></div>}
          {tab === 'booths' && !online && <Booths show={show} onOpen={setBooth} />}
          {tab === 'products' && <ProductsTab show={show} onAsk={openInquiry} onOpenBooth={setBooth} />}
          {tab === 'launches' && <Launches show={show} visitor={visitor} onRegister={() => setRegOpen(true)} onOpenBooth={setBooth} />}
          {tab === 'streams' && <CoorganizerStreams show={show} />}
          {tab === 'agenda' && <Agenda show={show} visitor={visitor} onRegister={() => setRegOpen(true)} onOpen={setSession} />}
          {tab === 'speakers' && <Speakers show={show} />}
        </div>
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
function Overview({ show }: { show: Show }) {
  const { L, locale } = useI18n()
  const x = useShowT()
  const now = new Date().toISOString().slice(0, 10)
  const contact = [show.contact.name, show.contact.email, show.contact.phone].filter(Boolean)
  const online = isOnlineFormat(show.format)
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <div className="space-y-10">
        <section>
          <div className="relative max-w-3xl overflow-hidden rounded-3xl border bg-gradient-to-br from-primary-soft/60 via-background to-gold-soft/40 p-6 md:p-8"><Quote className="absolute right-6 top-6 size-14 text-primary/10" aria-hidden /><p className="relative text-[15px] leading-relaxed text-foreground/85 md:text-base">{L(show.introduction)}</p></div>
          <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-soft px-3 py-2 text-sm font-medium text-primary"><Globe2 className="size-4" /> {x.direction[show.direction]}</p>
        </section>
        <HomeBlocks show={show} />
        <ProductLaunches show={show} />
        {!online && show.phases.length > 0 && <section>
          <h2 className="text-xl font-extrabold">{x.phasesTitle}</h2>
          <ol className="relative mt-5 space-y-4 border-l-2 border-dashed border-border pl-6">
            {show.phases.map((p) => {
              const active = p.start <= now && now <= p.end && show.status === 'ONGOING'
              return (
                <li key={p.id} className={cn('relative rounded-2xl border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg', active && 'border-live/40 bg-live/5')}>
                  <span className={cn('absolute -left-[33px] top-1.5 size-3 rounded-full border-2 border-background', active ? 'bg-live ring-4 ring-live/20' : 'bg-primary')} />
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{L(p.name)}</p>
                    {active && <Badge variant="live" className="gap-1"><LiveDot /> {x.label.LIVE}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{formatDate(p.start, locale, { day: '2-digit', month: '2-digit' })} – {formatDate(p.end, locale, { day: '2-digit', month: '2-digit' })} · {L(p.theme)}</p>
                </li>
              )
            })}
          </ol>
        </section>}
        {!online && show.pavilions.length > 0 && <section>
          <h2 className="text-xl font-extrabold">{x.pavTitle}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {show.pavilions.map((pv) => (
              <div key={pv.id} className="group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"><span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-gold-bright" aria-hidden />
                <p className="font-bold">{L(pv.name)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{show.booths.filter((b) => b.pavilionId === pv.id).length} {x.stats.booths.toLowerCase()}</p>
              </div>
            ))}
          </div>
        </section>}
        <ShowFaqBlock show={show} />
      </div>

      <aside className="space-y-6">
        {show.rules.length > 0 && <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-bold">{x.rulesTitle}</h3>
          <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
            {show.rules.map((r, i) => <li key={i} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> {L(r)}</li>)}
          </ul>
        </div>}
        {(show.targetMarkets.length > 0 || show.industries.length > 0 || contact.length > 0 || (!online && show.boothCapacity > 0)) && <div className="rounded-2xl border bg-card p-5 text-sm">
          <dl className="space-y-3">
            {show.targetMarkets.length > 0 && <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{x.markets}</dt><dd className="mt-1 flex flex-wrap gap-1.5">{show.targetMarkets.map((c) => <CountryChip key={c} code={c} />)}</dd></div>}
            {show.industries.length > 0 && <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{x.industries}</dt><dd className="mt-1 flex flex-wrap gap-1.5">{show.industries.map((i) => <Badge key={i} variant="muted">{i}</Badge>)}</dd></div>}
            {contact.length > 0 && <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{x.contact}</dt><dd className="mt-1">{contact.map((v) => <span key={v} className="block">{v}</span>)}</dd></div>}
          </dl>
          {!online && show.boothCapacity > 0 && <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-xs text-muted-foreground"><span>{x.stats.booths}</span><span>{show.booths.length}/{show.boothCapacity}</span></div>
            <Progress value={(show.booths.length / show.boothCapacity) * 100} />
          </div>}
        </div>}
      </aside>
    </div>
  )
}

/** Show home-page content from the CMS: each block only exists when it has rows, styled like the sections around it. */
function HomeBlocks({ show }: { show: Show }) {
  const { L } = useI18n()
  const { stats = [], whyAttend = [], topics = [], highlights = [] } = show
  const ordered = [...highlights].sort((a, b) => Number(b.hero) - Number(a.hero))
  return (
    <>
      {stats.length > 0 && (
        <section aria-label={tx('Số liệu nổi bật', 'Key figures', '주요 수치')}>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map((s, i) => (
              <div key={i} className="rounded-xl border bg-card p-4">
                <dd className="text-xl font-extrabold tabular-nums text-primary md:text-2xl">{L(s.value)}</dd>
                <dt className="mt-1 text-xs font-semibold text-muted-foreground">{L(s.label)}</dt>
              </div>
            ))}
          </dl>
        </section>
      )}
      {whyAttend.length > 0 && (
        <section>
          <h2 className="text-xl font-extrabold">{tx('Vì sao nên tham dự', 'Why attend', '참가해야 하는 이유')}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {whyAttend.map((w, i) => (
              <div key={i} className="rounded-xl border bg-card p-4">
                <p className="flex gap-2 font-bold"><CheckCircle2 className="mt-1 size-4 shrink-0 text-success" /> {L(w.title)}</p>
                {L(w.text) && <p className="mt-1 text-sm text-muted-foreground">{L(w.text)}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
      {topics.length > 0 && (
        <section>
          <h2 className="text-xl font-extrabold">{tx('Chủ đề', 'Topics', '주제')}</h2>
          <div className="mt-4 flex flex-wrap gap-1.5">{topics.map((t, i) => <Badge key={i} variant="muted">{L(t)}</Badge>)}</div>
        </section>
      )}
      {ordered.length > 0 && (
        <section>
          <h2 className="text-xl font-extrabold">{tx('Điểm nhấn', 'Highlights', '하이라이트')}</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            {ordered.map((h, i) => (
              <div key={i} className={cn('overflow-hidden rounded-2xl border bg-card', h.hero && 'sm:col-span-2')}>
                {h.video ? (
                  <video src={h.video} poster={h.image ? img(h.image, 1000, 560) : undefined} controls preload="metadata" className="aspect-video w-full bg-navy object-cover" />
                ) : h.image && (
                  <div className="aspect-video overflow-hidden bg-muted"><img src={img(h.image, 1000, 560)} alt="" loading="lazy" className="size-full object-cover" /></div>
                )}
                <div className="p-4">
                  <p className="font-bold">{L(h.title)}</p>
                  {L(h.text) && <p className="mt-1 text-sm text-muted-foreground">{L(h.text)}</p>}
                  {h.link && <a href={h.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">{tx('Xem thêm', 'Learn more', '자세히 보기')}</a>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

/** New-product launch calendar from approved participation applications (V85) - date/time marker only, no stage or stream. */
function ProductLaunches({ show }: { show: Show }) {
  const { locale } = useI18n()
  const rows = show.productLaunches ?? []
  if (!rows.length) return null
  return (
    <section>
      <h2 className="text-xl font-extrabold">{tx('Sản phẩm mới ra mắt', 'New product launches', '신제품 출시')}</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
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
  const faq = show.faq ?? []
  if (!faq.length) return null
  return (
    <section>
      <h2 className="text-xl font-extrabold">{tx('Câu hỏi thường gặp', 'Frequently asked questions', '자주 묻는 질문')}</h2>
      <div className="mt-4 divide-y rounded-xl border bg-card px-4">
        {faq.map((f, i) => (
          <details key={i} className="group py-2.5">
            <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden group-open:text-primary">{L(f.q)}</summary>
            <p className="mt-1.5 text-sm text-muted-foreground">{L(f.a)}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------ booths */
function Booths({ show, onOpen }: { show: Show; onOpen: (b: ShowBooth) => void }) {
  const { L } = useI18n()
  const x = useShowT()
  const [phase, setPhase] = useState('ALL')
  const [pav, setPav] = useState('ALL')
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const k = q.trim().toLowerCase()
    return show.booths.filter((b) => (phase === 'ALL' || b.phaseId === phase) && (pav === 'ALL' || b.pavilionId === pav)
      && (!k || [L(b.name), L(b.org), ...b.products.map((p) => L(p.name))].some((s) => s.toLowerCase().includes(k))))
  }, [show, phase, pav, q, L])
  return (
    <>
      <div className={cn('mb-6 grid gap-3', show.phases.length > 0 && show.pavilions.length > 0 ? 'md:grid-cols-[1fr_200px_240px]' : show.phases.length > 0 ? 'md:grid-cols-[1fr_200px]' : show.pavilions.length > 0 && 'md:grid-cols-[1fr_240px]')}>
        <div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input className="pl-9" placeholder={x.search} value={q} onChange={(e) => setQ(e.target.value)} aria-label={x.search} /></div>
        {show.phases.length > 0 && <Select value={phase} onValueChange={setPhase} aria-label={x.filterPhase} options={[{ value: 'ALL', label: `${x.filterPhase}: ${x.all}` }, ...show.phases.map((p) => ({ value: p.id, label: L(p.name) }))]} />}
        {show.pavilions.length > 0 && <Select value={pav} onValueChange={setPav} aria-label={x.filterPav} options={[{ value: 'ALL', label: `${x.filterPav}: ${x.all}` }, ...show.pavilions.map((p) => ({ value: p.id, label: L(p.name) }))]} />}
      </div>
      {list.length === 0 && <p className="text-muted-foreground">{x.noBooth}</p>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((b, i) => (
          <motion.button key={b.id} type="button" onClick={() => onOpen(b)} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="group overflow-hidden rounded-2xl border bg-card text-left transition hover:border-primary/40 hover:shadow-lg">
            <div className="relative aspect-[16/9] overflow-hidden bg-muted">
              <img src={img(b.cover, 700, 400)} alt="" loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <Badge variant={b.side === 'SELLER' ? 'default' : 'gold'} className="absolute left-3 top-3">{b.side === 'SELLER' ? x.sellerSide : x.supportSide}</Badge>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3">
                <CompanyMark name={L(b.org)} accent={b.accent} className="size-10" />
                <div className="min-w-0"><p className="truncate font-bold group-hover:text-primary">{L(b.name)}</p><p className="truncate text-xs text-muted-foreground">{L(b.org)}</p></div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{L(b.tagline)}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><CountryChip code={b.country} /><span>{b.products.length} {x.stats.products.toLowerCase()}</span></div>
            </div>
          </motion.button>
        ))}
      </div>
    </>
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
  if (!all.length) return <p className="text-muted-foreground">{tx('Chưa có sản phẩm nào.', 'No products yet.', '아직 제품이 없습니다.')}</p>
  return (
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {all.map(({ b, p }) => {
        const toProduct = online && p.linkId ? `/products/${p.linkId}?fromEvent=${show.id}` : null
        const picture = (
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            <img src={img(p.image, 500, 500)} alt="" loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
            {p.featured && <Badge variant="gold" className="absolute left-3 top-3">{x.featured}</Badge>}
          </div>
        )
        return (
        <div key={`${b.id}-${p.id}`} className="group">
          <div className="relative">
            {toProduct ? <Link to={toProduct} className="block" aria-label={L(p.name)}>{picture}</Link> : picture}
            {p.linkId && <FavoriteButton productId={p.linkId} initial={favorites?.has(p.linkId) ?? false} className="absolute right-2 top-2 size-9 rounded-full bg-white/90 text-navy shadow hover:bg-white" />}
          </div>
          <p className="mt-3 line-clamp-2 font-semibold leading-snug">{toProduct ? <Link to={toProduct} className="hover:text-primary">{L(p.name)}</Link> : L(p.name)}</p>
          {online ? <OrgName booth={b} /> : <button type="button" onClick={() => onOpenBooth(b)} className="mt-0.5 text-xs text-muted-foreground hover:text-primary">{L(b.org)}</button>}
          <div><BusinessChatButton organizationId={b.businessId} showName={L(show.title)} className="text-xs" /></div>
          <p className="mt-1 text-xs text-muted-foreground">{x.priceOnRequest}{p.moq ? ` · ${x.moq} ${p.moq}` : ''}</p>
          {interestOf(p) > 0 && <Badge variant="secondary" className="mt-1.5">{tx(`${interestOf(p)} doanh nghiệp quan tâm`, `${interestOf(p)} businesses interested`, `${interestOf(p)}개 기업 관심`)}</Badge>}
          {/* DEC-EV8-08: a catalogue product is quoted on its own page (RfqDialog); the booth dialog stays for unlinked products */}
          {p.linkId ? <div><Link to={`/products/${p.linkId}?fromEvent=${show.id}`} className={buttonClass('outline', 'sm', 'mt-2')}>{x.askPrice}</Link></div> : !online && <Button size="sm" variant="outline" className="mt-2" onClick={() => onAsk(b, p)}>{x.askPrice}</Button>}
        </div>
        )
      })}
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
  if (!sorted.length) return <p className="text-muted-foreground">{x.noLaunch}</p>
  return (
    <div>
      <h2 className="text-xl font-extrabold">{x.launchTitle}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{x.launchSub}</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {stages.map((st) => (
          <div key={st}>
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-primary"><Radio className="size-4" /> {x.stage}: {st}</p>
            <ul className="space-y-3">
              {sorted.filter((l) => L(l.stage) === st).map((l) => {
                const b = show.booths.find((bb) => bb.id === l.boothId)
                const p = b?.products.find((pp) => pp.id === l.productId)
                if (!b || !p) return null
                const on = following.has(l.id)
                return (
                  <li key={l.id} className="flex gap-4 rounded-xl border bg-card p-3">
                    <img src={img(p.image, 200, 200)} alt="" className="size-20 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-primary">{fmtDay(l.start, locale)} · {fmtTime(l.start, locale)}–{fmtTime(l.end, locale)}</p>
                      <p className="line-clamp-1 font-bold">{L(p.name)}</p>
                      {isOnlineFormat(show.format) ? <OrgName booth={b} /> : <button type="button" onClick={() => onOpenBooth(b)} className="text-xs text-muted-foreground hover:text-primary">{L(b.org)}</button>}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">{formatNumber(l.followers + (on ? 1 : 0), locale)} {x.followers}</span>
                        <Button size="sm" variant={on ? 'secondary' : 'outline'} onClick={() => toggleFollow(l.id, on)}>{on ? <BellRing /> : <Bell />} {on ? x.following : x.follow}</Button>
                      </div>
                      {!USE_MOCK && l.live && l.streamEventId && <Link to={showLivePath(show.id, { launch: l.id })} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-live hover:underline"><LiveDot /> {x.joinLive}</Link>}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
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

function Agenda({ show, visitor, onRegister, onOpen }: { show: Show; visitor: ReturnType<typeof useShowVisitor>; onRegister: () => void; onOpen: (s: ShowSession) => void }) {
  const { L, locale } = useI18n()
  const x = useShowT()
  const toast = useToast()
  const sessions = [...show.sessions].sort((a, b) => a.start.localeCompare(b.start))
  const byDay = sessions.reduce<Record<string, ShowSession[]>>((acc, s) => { (acc[s.start.slice(0, 10)] ??= []).push(s); return acc }, {})
  const badgeOk = visitor.badge?.status === 'ISSUED'
  // Show Sân chơi: agenda chỉ là lịch chữ do VCCI soạn - không xem live, không đặt chỗ
  const textOnly = show.showType === 'HOSTED'
  if (!sessions.length) return <p className="text-muted-foreground">{x.noSessions}</p>

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
      <h2 className="text-xl font-extrabold">{x.sessionsTitle}</h2>
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
