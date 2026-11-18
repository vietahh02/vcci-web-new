import { motion } from 'motion/react'
import { ArrowRight, Building2, CalendarClock, CalendarDays, Check, Clock, Globe2, Handshake, Layers, ListOrdered, MapPin, Phone, PlayCircle, Radio, Rocket, Ticket, Users, Video } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { USE_MOCK, useEvent, useEvents, useShow } from '@/api'
import { isShowId } from '@/api/adapters/show'
import { ErrorBlock, LoadingBlock } from '@/components/ui/StateViews'
import { type EventItem } from '@/data/mock'
import { useEventProducts, useEventProgramme } from '@/api/eventApi'
import { MyRegistrationActions } from '@/components/event/MyRegistrationActions'
import { RejectedRegistrationNotice } from '@/components/event/RejectedRegistrationNotice'
import { getShow } from '@/data/shows'
import { ShowEventDetail } from '@/components/show/ShowEventDetail'
import { SectionHeader } from '@/components/brand'
import { PageHero } from '@/components/PageHero'
import { RichText } from '@/components/RichText'
import { SponsorVerticalBanner } from '@/components/sponsor'
import { ScheduleGrid } from '@/components/event/ScheduleGrid'
import { AddToCalendar } from '@/components/event/AddToCalendar'
import { formatLabel, RegBadge } from '@/components/event/EventExplorer'
import { EventJourney } from '@/components/event/EventJourney'
import { EventProducts } from '@/components/event/EventProducts'
import { EventParticipants } from '@/components/event/EventParticipants'
import { EventCard } from '@/components/cards'
import { Countdown, LiveDot, Reveal } from '@/components/effects'
import { UnderlineTabs } from '@/components/ui/overlay'
import { Badge, Button, buttonClass, Progress } from '@/components/ui/primitives'
import NotFound from '@/pages/NotFound'
import { useI18n } from '@/lib/i18n'
import { eventTimeRange, registrationState } from '@/lib/eventStatus'
import { isRegistered } from '@/lib/eventUser'
import { OPTIONS, useProfile } from '@/lib/profile'
import { tx } from '@/lib/tx'
import { cn, formatDate, formatMoney, formatNumber } from '@/lib/utils'

type DetailTab = 'overview' | 'program' | 'speakers' | 'products' | 'participants' | 'journey'

export default function EventDetail() {
  const { id = '' } = useParams()
  const mockShow = USE_MOCK ? getShow(id) : null
  if (mockShow) return <ShowEventDetail show={mockShow} />
  if (!USE_MOCK && isShowId(id)) return <LiveShowDetail id={id} />
  return <WebinarDetail id={id} />
}

/** Show Hub in live mode: GET /api/public/shows/{id}/full */
function LiveShowDetail({ id }: { id: string }) {
  const { data, loading, error, reload } = useShow(id, true)
  if (loading) return <LoadingBlock />
  if (error) return <ErrorBlock error={error} onRetry={reload} />
  if (!data) return <NotFound />
  return <ShowEventDetail show={data} />
}

function WebinarDetail({ id }: { id: string }) {
  const { data: ev, loading, error, reload } = useEvent(id)
  if (loading) return <LoadingBlock />
  if (error) return <ErrorBlock error={error} onRetry={reload} />
  if (!ev) return <NotFound />
  return <WebinarView ev={ev} />
}

function WebinarView({ ev }: { ev: EventItem }) {
  const { t, L, locale } = useI18n()
  const { registrations } = useProfile()
  const allEvents = useEvents().data ?? []
  // live: the BE says whether this organisation holds an active registration; mock: local markers
  const registered = USE_MOCK ? isRegistered(ev.id) || registrations.some((r) => r.eventId === ev.id) : !!ev.myRegistration
  const regState = registrationState(ev).state
  const canJoinOnline = (ev.eventType === 'LIVESTREAM' || ev.eventType === 'WEBINAR') && ev.format !== 'OFFLINE'
  const programme = useEventProgramme(ev).data ?? null
  const pct = ev.maxSlots ? (ev.registeredSlots / ev.maxSlots) * 100 : 0
  const [tab, setTab] = useState<DetailTab>('overview')
  const productCount = useEventProducts(ev).data?.length ?? 0
  const ended = ev.eventStatus === 'ENDED'
  const tabs: { value: DetailTab; label: string }[] = [
    { value: 'overview', label: tx('Tổng quan', 'Overview', '개요') },
    { value: 'program', label: `${tx('Chương trình', 'Programme', '프로그램')}${programme || !ev.agendaOptions.length ? '' : ` (${ev.agendaOptions.length})`}` },
    ...(ev.speakers ? [{ value: 'speakers' as const, label: `${tx('Diễn giả', 'Speakers', '연사')} (${ev.speakers.length})` }] : []),
    ...(productCount ? [{ value: 'products' as const, label: `${tx('Sản phẩm', 'Products', '제품')} (${productCount})` }] : []),
    { value: 'participants', label: tx('Đơn vị nổi bật', 'Featured organisations', '주요 참가 기관') },
    { value: 'journey', label: ended ? tx('Sau sự kiện', 'After the event', '행사 후') : registered ? tx('Chuẩn bị của tôi', 'My preparation', '내 준비') : tx('Hướng dẫn tham dự', 'How to take part', '참가 안내') },
  ]
  /** Hero shortcuts to a block inside the journey tab. */
  const goJourney = (anchor: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setTab('journey')
    window.setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' }), 80)
  }
  const others = allEvents.filter((e) => e.id !== ev.id && e.eventStatus !== 'ENDED').slice(0, 3)

  return (
    <>
      <PageHero
        tone="azure"
        crumbs={[{ label: t.common.home, to: '/' }, { label: t.nav.events, to: '/events' }, { label: t.events.type[ev.eventType] }]}
        kicker={
          <div className="mb-3 flex flex-wrap gap-2">
            {ev.eventStatus === 'ONGOING' ? (
              <Badge variant="live" className="gap-1.5"><LiveDot /> {t.events.live}</Badge>
            ) : (
              <Badge variant="outline" className="border-primary/25 bg-white/80 text-primary dark:bg-white/10">{t.events.status[ev.eventStatus]}</Badge>
            )}
            <Badge variant="outline" className="border-primary/25 bg-white/80 text-primary dark:bg-white/10">{ev.eventType === 'LIVESTREAM' ? <Radio /> : <Video />} {t.events.type[ev.eventType]}</Badge>
            {ev.format && ev.format !== 'ONLINE' && <Badge variant="outline" className="border-primary/25 bg-white/80 text-primary dark:bg-white/10">{formatLabel(ev.format)}</Badge>}
            <RegBadge ev={ev} />
            {programme?.phases.map((p) => <Badge key={p.id} variant="outline" className="border-[#d9a62a]/50 bg-[#fff6dc] text-[#8a5a00]">{L(p.name)} · {L(p.theme)}</Badge>)}
          </div>
        }
        title={L(ev.title)}
        titleKey={ev.id}
        subtitle={L(ev.introduction).split(/\n\s*\n/)[0]}
        aside={
          <Reveal delay={0.15} className="h-fit w-full max-w-[400px] rounded-3xl bg-white/90 p-6 shadow-[0_30px_60px_-34px_rgba(0,70,110,0.55)] ring-1 ring-primary/15 backdrop-blur dark:bg-white/5 dark:ring-white/10">
            {ev.eventStatus === 'UPCOMING' && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.events.startsIn}</p>
                <Countdown target={ev.startDate} labels={t.common.countdown} className="mt-2" />
              </>
            )}
            <div className="mt-5 flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">{t.events.fee}</span>
              <span className="text-2xl font-extrabold">{ev.participationFee ? formatMoney(ev.participationFee, ev.participationFeeCurrency, locale) : t.common.free}</span>
            </div>
            {ev.eventStatus !== 'ENDED' && (ev.maxSlots > 0 || ev.registeredSlots > 0) && <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Users className="size-3.5" /> {formatNumber(ev.registeredSlots, locale)}{ev.maxSlots > 0 && `/${formatNumber(ev.maxSlots, locale)}`} {t.events.slots}</span>
                {ev.maxSlots > 0 && <span>{Math.round(pct)}%</span>}
              </div>
              {ev.maxSlots > 0 && <Progress value={pct} barClassName="bg-gradient-to-r from-[#1a8cc4] to-primary" />}
            </div>}
            {ev.eventStatus === 'ENDED' && <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Users className="size-4" /> {USE_MOCK ? <>{formatNumber(Math.round(ev.registeredSlots * 0.85), locale)} {tx('người đã tham dự', 'attended', '명 참석')}</> : <>{formatNumber(ev.registeredSlots, locale)} {tx('đơn vị đăng ký', 'registrations', '등록')}</>}</p>}
            {ev.eventStatus === 'ONGOING' && canJoinOnline && (registered || ev.eventType === 'LIVESTREAM') ? (
              <Link to={`/live/${ev.id}`} className={buttonClass('default', 'lg', 'mt-6 w-full bg-live hover:bg-live/90')}><LiveDot /> {t.events.watchNow}</Link>
            ) : ev.eventStatus === 'ENDED' ? (
              <a href="#materials" onClick={goJourney('materials')} className={buttonClass('default', 'lg', 'mt-6 w-full')}><PlayCircle /> {t.events.watchRecording}</a>
            ) : registered ? (
              <a href="#prep" onClick={goJourney('prep')} className={buttonClass('default', 'lg', 'mt-6 w-full')}><Check /> {tx('Đã đăng ký — Chuẩn bị của tôi', 'Registered — My preparation', '등록 완료 — 내 준비')}</a>
            ) : regState === 'FULL' || regState === 'CLOSED' ? (
              <Button variant="outline" size="lg" className="mt-6 w-full" disabled>{regState === 'FULL' ? tx('Đã hết chỗ', 'Fully booked', '정원 마감') : tx('Đã đóng đăng ký', 'Registration closed', '등록 마감')}</Button>
            ) : (
              <Link to={`/events/${ev.id}/register`} className={buttonClass('default', 'lg', 'mt-6 w-full')}><Ticket /> {ev.eventType === 'SUPPORT_1TO1' ? tx('Đặt lịch hỗ trợ', 'Book support', '지원 예약') : t.events.register}</Link>
            )}
            {canJoinOnline && ev.eventStatus === 'UPCOMING' && (
              <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                <Video className="mt-0.5 size-3.5 shrink-0 text-primary" />
                {ev.eventType === 'WEBINAR' && !registered
                  ? tx('Đăng ký để nhận nút "Xem trực tiếp" — tham gia ngay trên hệ thống VCCI khi sự kiện bắt đầu.', 'Register to get the "Watch live" button — join right here on the VCCI platform when the event starts.', '등록하면 행사 시작 시 VCCI 플랫폼에서 바로 "라이브 시청"할 수 있습니다.')
                  : tx('Nút "Xem trực tiếp" mở tại đây khi sự kiện bắt đầu — không cần cài đặt phần mềm.', 'The "Watch live" button opens here when the event starts — nothing to install.', '행사가 시작되면 여기에서 "라이브 시청" 버튼이 열립니다 — 설치 불필요.')}
              </p>
            )}
            {!USE_MOCK && registered && <MyRegistrationActions ev={ev} />}
            {!USE_MOCK && !registered && <RejectedRegistrationNotice eventId={ev.id} />}
            {ev.eventStatus !== 'ENDED' && <AddToCalendar ev={ev} tone="light" className="mt-4" />}
            <p className="mt-4 flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground"><Building2 className="size-3.5" /> {t.events.organizer}: {L(ev.organizedBy)}</p>
          </Reveal>
        }
      >
        <div className="flex w-full flex-wrap gap-x-6 gap-y-2 text-sm text-[#12384d]/85 dark:text-white/80">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            {formatDate(ev.startDate, locale, { day: '2-digit', month: 'long', year: 'numeric' })}
            {ev.endDate.slice(0, 10) !== ev.startDate.slice(0, 10) && ` – ${formatDate(ev.endDate, locale, { day: '2-digit', month: 'long', year: 'numeric' })}`}
          </span>
          {eventTimeRange(ev) && <span className="inline-flex items-center gap-2"><Clock className="size-4 text-primary" /> {eventTimeRange(ev)} (GMT+7)</span>}
          {/* online-first (Leader 01/11/2026): joining online is the main path, the venue is secondary and only shown when set */}
          {L(ev.location) && <span className={ev.format === 'OFFLINE' ? 'inline-flex items-center gap-2' : 'inline-flex items-center gap-2 text-xs opacity-70'}><MapPin className={ev.format === 'OFFLINE' ? 'size-4 text-primary' : 'size-3.5'} /> {L(ev.location)}</span>}
        </div>
      </PageHero>

      <div className="container-page mt-8">
        <UnderlineTabs layoutId="ev-tabs" value={tab} onValueChange={(v) => setTab(v as DetailTab)} items={tabs} />
      </div>

      {tab === 'overview' && (
        <div className="container-page mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0 space-y-8">
            {(() => {
              // the first paragraph is the hero subtitle; the rest is the body (a one-paragraph intro is shown again here rather than leaving the tab empty)
              const paras = L(ev.introduction).split(/\n\s*\n/)
              const text = paras.length > 1 ? paras.slice(1).join('\n\n') : paras[0] ?? ''
              return text.trim() ? (
                <div className="rounded-3xl border bg-card p-6 md:p-8">
                  <h2 className="text-xl font-extrabold tracking-tight">{tx('Giới thiệu chương trình', 'About the programme', '프로그램 소개')}</h2>
                  <RichText text={text} className="mt-4 text-[15px] leading-relaxed text-muted-foreground" />
                </div>
              ) : null
            })()}
            <ProgramInfo ev={ev} part="overview" />
            <IndustryList ev={ev} />
            {ev.agendaOptions.length > 0 && !programme && <AgendaPreview ev={ev} onOpen={() => setTab('program')} />}
          </section>
          <aside className="space-y-4 lg:sticky lg:top-28">
            <EventFacts ev={ev} />
            <SponsorVerticalBanner />
          </aside>
        </div>
      )}

      {tab === 'program' && (programme ? (
        <>
          <div className="border-b bg-gold-soft/50">
            <div className="container-page flex flex-wrap items-center justify-between gap-3 py-4">
              <p className="flex items-center gap-2.5 text-sm">
                <Rocket className="size-5 text-gold" />
                <span className="font-semibold">{tx('Ra mắt sản phẩm mới', 'New Product Launch', '신제품 런칭')}</span>
                <span className="text-muted-foreground">· {L(programme.launchZone)}</span>
              </p>
              {ev.eventStatus === 'UPCOMING' && (
                <Link to={`/events/${ev.id}/register`} className={buttonClass('default', 'sm')}>{tx('Đăng ký tham quan', 'Register to visit', '참관 등록')}</Link>
              )}
            </div>
          </div>
          <div className="container-page mt-10">
            <ScheduleGrid programme={programme} />
          </div>
        </>
      ) : (
        <div className="container-page mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-2xl font-extrabold tracking-tight">{t.events.agenda}</h2>
              {ev.agendaOptions.length > 0 && <p className="text-sm text-muted-foreground">{ev.agendaOptions.length} {tx('phần', 'parts', '개 세션')}</p>}
            </div>
            {ev.agendaOptions.length === 0 ? (
              <p className="mt-6 rounded-2xl border border-dashed bg-muted/30 px-5 py-10 text-center text-sm text-muted-foreground">{tx('Ban Tổ chức sẽ cập nhật chương trình chi tiết.', 'The organisers will publish the detailed programme.', '세부 프로그램은 추후 공개됩니다.')}</p>
            ) : (
              <AgendaList ev={ev} />
            )}
          </section>
          <aside className="space-y-4 lg:sticky lg:top-28">
            <ProgrammeSummary ev={ev} onGuide={() => { setTab('journey'); window.scrollTo({ top: document.querySelector('[role=tablist]')!.getBoundingClientRect().top + window.scrollY - 140, behavior: 'smooth' }) }} />
            <SponsorVerticalBanner />
          </aside>
        </div>
      ))}

      {tab === 'speakers' && <div className="container-page mt-10"><ProgramInfo ev={ev} part="speakers" /></div>}
      {tab === 'products' && <EventProducts ev={ev} />}
      {tab === 'participants' && <EventParticipants ev={ev} onRegister={`/events/${ev.id}/register`} />}
      {tab === 'journey' && <EventJourney ev={ev} />}

      {others.length > 0 && (
        <section className="container-page mt-16">
          <SectionHeader title={t.home.eventsTitle} action={{ to: '/events', label: t.common.viewAll }} />
          <div className="grid gap-5 md:grid-cols-3">{others.map((e) => <EventCard key={e.id} event={e} />)}</div>
        </section>
      )}
    </>
  )
}


type Fact = { icon: typeof CalendarDays; k: string; v: string; note?: string }

/** Icon + label + value rows shared by the side cards of the overview and programme tabs. */
function FactList({ rows }: { rows: (Fact | false | '' | null | undefined)[] }) {
  return (
    <dl className="mt-4 space-y-4">
      {(rows.filter(Boolean) as Fact[]).map((r) => (
        <div key={r.k} className="flex gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><r.icon className="size-4" /></span>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">{r.k}</dt>
            <dd className="mt-0.5 break-words text-sm font-semibold leading-snug">
              {r.v}
              {r.note && <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{r.note}</span>}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  )
}

const dateRange = (ev: EventItem, locale: string) => {
  const full = { day: '2-digit', month: '2-digit', year: 'numeric' } as const
  return ev.endDate.slice(0, 10) === ev.startDate.slice(0, 10)
    ? formatDate(ev.startDate, locale, full)
    : `${formatDate(ev.startDate, locale, full)} – ${formatDate(ev.endDate, locale, full)}`
}

/** Online is the default and is not restated; only an in-person or hybrid event gets a format row. */
const formatRow = (ev: EventItem): Fact | false => !!ev.format && ev.format !== 'ONLINE' && { icon: Video, k: tx('Hình thức', 'Format', '형식'), v: formatLabel(ev.format) }

/** Overview side card: the event's key facts, only the fields the event really has. */
function EventFacts({ ev }: { ev: EventItem }) {
  const { t, L, locale } = useI18n()
  const time = eventTimeRange(ev)
  return (
    <div className="rounded-3xl border bg-card p-6">
      <h2 className="text-base font-extrabold">{tx('Thông tin chung', 'Key details', '기본 정보')}</h2>
      <FactList rows={[
        { icon: CalendarDays, k: tx('Thời gian', 'Date', '일정'), v: dateRange(ev, locale) },
        time && { icon: Clock, k: tx('Giờ', 'Time', '시간'), v: `${time} (GMT+7)` },
        formatRow(ev),
        ev.format !== 'ONLINE' && L(ev.location) && { icon: MapPin, k: tx('Địa điểm', 'Venue', '장소'), v: L(ev.location) },
        L(ev.organizedBy) && { icon: Building2, k: t.events.organizer, v: L(ev.organizedBy) },
        ev.partner && { icon: Handshake, k: tx('Đơn vị phối hợp', 'In partnership with', '협력 기관'), v: L(ev.partner) },
        ev.targetMarket && { icon: Globe2, k: tx('Thị trường mục tiêu', 'Target market', '목표 시장'), v: L(ev.targetMarket) },
        ev.series && { icon: Layers, k: tx('Chuỗi chương trình', 'Series', '프로그램 시리즈'), v: L(ev.series) },
        ev.registrationDeadline && ev.eventStatus !== 'ENDED' && { icon: CalendarClock, k: tx('Hạn đăng ký', 'Registration deadline', '신청 마감'), v: formatDate(ev.registrationDeadline, locale), note: tx('Có thể đóng sớm khi đủ chỉ tiêu', 'May close early once full', '정원 마감 시 조기 종료') },
        !!ev.quota && { icon: Users, k: tx('Chỉ tiêu', 'Quota', '모집 정원'), v: `${formatNumber(ev.quota, locale)} ${tx('doanh nghiệp', 'companies', '개사')}` },
        { icon: Ticket, k: t.events.fee, v: ev.participationFee ? formatMoney(ev.participationFee, ev.participationFeeCurrency, locale) : t.common.free },
      ]} />
      {ev.contact && (
        <div className="mt-5 border-t pt-4 text-sm">
          <p className="flex items-center gap-2 font-semibold"><Phone className="size-4 text-primary" /> {tx('Liên hệ', 'Contact', '문의처')}</p>
          <p className="mt-1.5 text-muted-foreground">{ev.contact.name}</p>
          <p className="text-muted-foreground">{tx('ĐT/Zalo', 'Phone/Zalo', '전화/Zalo')}: {ev.contact.phone}</p>
          <p className="break-all text-muted-foreground">{ev.contact.email}</p>
        </div>
      )}
    </div>
  )
}

/** Sectors the event is aimed at (industry codes from the event form, shown with their labels). */
function IndustryList({ ev }: { ev: EventItem }) {
  const { L } = useI18n()
  const items = ev.industry.filter(Boolean)
  if (!items.length) return null
  const label = (code: string) => { const o = OPTIONS.industries.find((x) => x.value === code); return o ? L(o) : code }
  return (
    <div className="rounded-3xl border bg-card p-6 md:p-8">
      <h2 className="text-lg font-extrabold">{tx('Lĩnh vực liên quan', 'Related sectors', '관련 분야')}</h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {items.map((c) => <li key={c} className="rounded-full border bg-muted/40 px-3.5 py-1.5 text-sm font-medium">{label(c)}</li>)}
      </ul>
    </div>
  )
}

/** First parts of the agenda on the overview, with a jump to the programme tab. */
function AgendaPreview({ ev, onOpen }: { ev: EventItem; onOpen: () => void }) {
  const { L } = useI18n()
  const items = ev.agendaOptions.slice(0, 3)
  const more = ev.agendaOptions.length - items.length
  return (
    <div className="rounded-3xl border bg-card p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">{tx('Chương trình tóm tắt', 'Programme at a glance', '프로그램 요약')}</h2>
        <button type="button" onClick={onOpen} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          {tx('Xem đầy đủ', 'See full programme', '전체 보기')} <ArrowRight className="size-4" />
        </button>
      </div>
      <ol className="mt-3 divide-y">
        {items.map((a, i) => (
          <li key={i} className="flex gap-4 py-3">
            <span className="w-12 shrink-0 font-mono text-sm font-semibold text-primary">{a.agendaStartTime || String(i + 1).padStart(2, '0')}</span>
            <span className="text-sm font-medium leading-snug">{L(a.agendaTitle)}</span>
          </li>
        ))}
      </ol>
      {more > 0 && <p className="mt-1 text-xs text-muted-foreground">{tx(`và ${more} phần nữa`, `and ${more} more`, `외 ${more}개`)}</p>}
    </div>
  )
}

/** Programme tab: time (or step number) | rail | card. */
function AgendaList({ ev }: { ev: EventItem }) {
  const { L } = useI18n()
  const timed = ev.agendaOptions.some((a) => a.agendaStartTime)
  const n = ev.agendaOptions.length
  return (
    <ol className="mt-6">
      {ev.agendaOptions.map((a, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: Math.min(i, 6) * 0.06 }}
          className="grid grid-cols-[52px_20px_minmax(0,1fr)] gap-x-3 sm:grid-cols-[72px_20px_minmax(0,1fr)] sm:gap-x-4"
        >
          <div className="pt-4 text-right">
            {timed ? (
              <>
                <p className="font-mono text-sm font-bold text-primary">{a.agendaStartTime || '—'}</p>
                {a.agendaEndTime && <p className="font-mono text-xs text-muted-foreground">{a.agendaEndTime}</p>}
              </>
            ) : (
              <p className="pt-0.5 text-2xl font-extrabold leading-none tabular-nums text-primary/35">{String(i + 1).padStart(2, '0')}</p>
            )}
          </div>
          <div className="relative flex justify-center" aria-hidden>
            <span className={cn('absolute w-px bg-border', i === 0 ? 'top-6' : 'top-0', i === n - 1 ? 'h-6' : 'bottom-0')} />
            <span className="relative mt-[18px] grid size-3.5 place-items-center rounded-full bg-background ring-2 ring-primary"><span className="size-1.5 rounded-full bg-primary" /></span>
          </div>
          <div className="pb-4">
            <div className="rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{tx('Phần', 'Part', '세션')} {i + 1}</p>
              <p className="mt-1 font-semibold leading-snug">{L(a.agendaTitle)}</p>
              {a.speaker && <p className="mt-1.5 text-sm text-muted-foreground">{L(a.speaker)}</p>}
            </div>
          </div>
        </motion.li>
      ))}
    </ol>
  )
}

/**
 * Programme tab side card. The hero card above already holds the register and add-to-calendar buttons,
 * so this card adds what the hero does not say: the deadline with days left and the way to the guide.
 */
function ProgrammeSummary({ ev, onGuide }: { ev: EventItem; onGuide: () => void }) {
  const { locale } = useI18n()
  const time = eventTimeRange(ev)
  const reg = registrationState(ev)
  const ended = ev.eventStatus === 'ENDED'
  const left = Math.max(reg.daysLeft, 0)
  return (
    <div className="rounded-3xl border bg-card p-6">
      <h2 className="text-base font-extrabold">{tx('Tóm tắt chương trình', 'Programme summary', '프로그램 요약')}</h2>
      <FactList rows={[
        { icon: CalendarDays, k: tx('Thời gian', 'Date', '일정'), v: dateRange(ev, locale) },
        time && { icon: Clock, k: tx('Giờ', 'Time', '시간'), v: `${time} (GMT+7)` },
        ev.agendaOptions.length > 0 && { icon: ListOrdered, k: tx('Số phần', 'Parts', '세션 수'), v: `${ev.agendaOptions.length} ${tx('phần', 'parts', '개')}` },
        formatRow(ev),
        !ended && ev.registrationDeadline && {
          icon: CalendarClock, k: tx('Hạn đăng ký', 'Registration deadline', '신청 마감'), v: formatDate(ev.registrationDeadline, locale),
          note: reg.state === 'OPEN' || reg.state === 'CLOSING' ? tx(`Còn ${left} ngày`, `${left} days left`, `${left}일 남음`) : undefined,
        },
      ]} />
      <button type="button" onClick={onGuide} className="mt-6 flex w-full items-center justify-between gap-3 rounded-2xl bg-muted/50 px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-primary-soft hover:text-primary">
        {ended ? tx('Xem bản ghi & tài liệu', 'Recording & materials', '녹화 및 자료') : tx('Xem hướng dẫn tham dự', 'How to take part', '참가 안내 보기')}
        <ArrowRight className="size-4 shrink-0" />
      </button>
    </div>
  )
}

/** Eligibility and key topics (overview) or speakers (speakers tab), from the VCCI event form. The key facts live in the side card. */
function ProgramInfo({ ev, part }: { ev: EventItem; part: 'overview' | 'speakers' }) {
  const { L } = useI18n()
  if (part === 'speakers') {
    if (!ev.speakers?.length) return null
    return (
      <div>
        <h2 className="text-xl font-extrabold">{tx('Diễn giả', 'Speakers', '연사')}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ev.speakers.map((s) => (
            <div key={s.name} className="flex gap-4 rounded-2xl border bg-card p-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-navy text-base font-bold text-white">{s.name.split(' ').slice(-2).map((w) => w[0]).join('')}</span>
              <div className="min-w-0">
                <p className="font-bold">{s.name}</p>
                <p className="text-sm text-primary">{L(s.title)}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{L(s.org)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  const elig = ev.eligibility ?? []
  const topics = ev.topics ?? []
  if (!elig.length && !topics.length) return null
  return (
    <div className={cn('grid gap-5', elig.length > 0 && topics.length > 0 && 'md:grid-cols-2')}>
      {elig.length > 0 && (
        <div className="rounded-3xl border bg-card p-6">
          <h2 className="text-lg font-extrabold">{tx('Đối tượng & tiêu chí tham gia', 'Who should apply', '참가 대상 및 기준')}</h2>
          <ul className="mt-4 space-y-2.5">
            {elig.map((e) => <li key={e.en} className="flex gap-2.5 text-[15px]"><Check className="mt-0.5 size-4 shrink-0 text-success" /> {L(e)}</li>)}
          </ul>
        </div>
      )}
      {topics.length > 0 && (
        <div className="rounded-3xl border bg-card p-6">
          <h2 className="text-lg font-extrabold">{tx('Nội dung chính', 'Key topics', '주요 내용')}</h2>
          <ul className="mt-4 space-y-2.5">
            {topics.map((e) => <li key={e.en} className="flex gap-2.5 text-[15px]"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" /> {L(e)}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
