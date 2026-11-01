import { motion } from 'motion/react'
import { Building2, CalendarDays, Check, Clock, MapPin, PlayCircle, Radio, Rocket, Ticket, Users, Video } from 'lucide-react'
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
import { registrationState } from '@/lib/eventStatus'
import { isRegistered } from '@/lib/eventUser'
import { useProfile } from '@/lib/profile'
import { tx } from '@/lib/tx'
import { formatDate, formatMoney, formatNumber, img } from '@/lib/utils'

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
    { value: 'program', label: `${tx('Chương trình', 'Programme', '프로그램')}${programme ? '' : ` (${ev.agendaOptions.length})`}` },
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
      <section className="relative isolate overflow-hidden bg-navy text-white">
        <img src={img(ev.coverImage, 1800, 800)} alt="" className="absolute inset-0 -z-20 size-full animate-kenburns object-cover opacity-40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/85 to-navy/40" />
        <div className="container-page grid gap-10 py-12 md:py-20 lg:grid-cols-[1fr_380px]">
          <Reveal>
            <nav className="mb-5 text-[13px] text-white/60"><Link to="/events" className="hover:text-white">{t.nav.events}</Link> / {t.events.type[ev.eventType]}</nav>
            <div className="flex flex-wrap gap-2">
              {ev.eventStatus === 'ONGOING' ? (
                <Badge variant="live" className="gap-1.5"><LiveDot /> {t.events.live}</Badge>
              ) : (
                <Badge variant="outline" className="border-white/30 text-white">{t.events.status[ev.eventStatus]}</Badge>
              )}
              <Badge variant="outline" className="border-white/30 text-white">{ev.eventType === 'LIVESTREAM' ? <Radio /> : <Video />} {t.events.type[ev.eventType]}</Badge>
              <Badge variant="outline" className="border-white/30 text-white">{formatLabel(ev.format)}{ev.platform ? ` · ${ev.platform}` : ''}</Badge>
              <RegBadge ev={ev} />
              {programme?.phases.map((p) => <Badge key={p.id} variant="outline" className="border-gold-bright/40 text-gold-bright">{L(p.name)} · {L(p.theme)}</Badge>)}
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-balance md:text-5xl">{L(ev.title)}</h1>
            <p className="mt-4 max-w-2xl text-white/75 md:text-lg">{L(ev.introduction)}</p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-4 text-gold-bright" />
                {formatDate(ev.startDate, locale, { day: '2-digit', month: 'long', year: 'numeric' })}
                {ev.endDate.slice(0, 10) !== ev.startDate.slice(0, 10) && ` – ${formatDate(ev.endDate, locale, { day: '2-digit', month: 'long', year: 'numeric' })}`}
              </span>
              <span className="inline-flex items-center gap-2"><Clock className="size-4 text-gold-bright" /> {ev.startTime} – {ev.endTime} (GMT+7)</span>
              {/* online-first (Leader 01/11/2026): joining online is the main path, the venue is secondary and only shown when set */}
              {ev.format !== 'OFFLINE' && <span className="inline-flex items-center gap-2 font-semibold text-white"><Video className="size-4 text-gold-bright" /> {formatLabel(ev.format)}{ev.platform ? ` · ${ev.platform}` : ` · ${tx('trên hệ thống VCCI', 'on the VCCI platform', 'VCCI 플랫폼')}`}</span>}
              {L(ev.location) && <span className={ev.format === 'OFFLINE' ? 'inline-flex items-center gap-2' : 'inline-flex items-center gap-2 text-xs text-white/60'}><MapPin className={ev.format === 'OFFLINE' ? 'size-4 text-gold-bright' : 'size-3.5'} /> {L(ev.location)}</span>}
            </div>
          </Reveal>

          <Reveal delay={0.15} className="glass-dark h-fit rounded-2xl p-6">
            {ev.eventStatus === 'UPCOMING' && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/60">{t.events.startsIn}</p>
                <Countdown target={ev.startDate} labels={t.common.countdown} dark className="mt-2" />
              </>
            )}
            <div className="mt-5 flex items-baseline justify-between">
              <span className="text-sm text-white/65">{t.events.fee}</span>
              <span className="text-2xl font-extrabold">{ev.participationFee ? formatMoney(ev.participationFee, ev.participationFeeCurrency, locale) : t.common.free}</span>
            </div>
            {ev.eventStatus !== 'ENDED' && <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs text-white/70">
                <span className="inline-flex items-center gap-1.5"><Users className="size-3.5" /> {formatNumber(ev.registeredSlots, locale)}/{formatNumber(ev.maxSlots, locale)} {t.events.slots}</span>
                <span>{Math.round(pct)}%</span>
              </div>
              <Progress value={pct} className="bg-white/15" barClassName="bg-gradient-to-r from-gold-bright to-amber-400" />
            </div>}
            {ev.eventStatus === 'ENDED' && <p className="mt-4 flex items-center gap-2 text-sm text-white/80"><Users className="size-4" /> {formatNumber(Math.round(ev.registeredSlots * 0.85), locale)} {tx('người đã tham dự', 'attended', '명 참석')}</p>}
            {ev.eventStatus === 'ONGOING' && canJoinOnline && (registered || ev.eventType === 'LIVESTREAM') ? (
              <Link to={`/live/${ev.id}`} className={buttonClass('default', 'lg', 'mt-6 w-full bg-live hover:bg-live/90')}><LiveDot /> {t.events.watchNow}</Link>
            ) : ev.eventStatus === 'ENDED' ? (
              <a href="#materials" onClick={goJourney('materials')} className={buttonClass('white', 'lg', 'mt-6 w-full')}><PlayCircle /> {t.events.watchRecording}</a>
            ) : registered ? (
              <a href="#prep" onClick={goJourney('prep')} className={buttonClass('gold', 'lg', 'mt-6 w-full')}><Check /> {tx('Đã đăng ký — Chuẩn bị của tôi', 'Registered — My preparation', '등록 완료 — 내 준비')}</a>
            ) : regState === 'FULL' || regState === 'CLOSED' ? (
              <Button variant="white" size="lg" className="mt-6 w-full" disabled>{regState === 'FULL' ? tx('Đã hết chỗ', 'Fully booked', '정원 마감') : tx('Đã đóng đăng ký', 'Registration closed', '등록 마감')}</Button>
            ) : (
              <Link to={`/events/${ev.id}/register`} className={buttonClass('gold', 'lg', 'mt-6 w-full')}><Ticket /> {ev.eventType === 'SUPPORT_1TO1' ? tx('Đặt lịch hỗ trợ', 'Book support', '지원 예약') : t.events.register}</Link>
            )}
            {canJoinOnline && ev.eventStatus === 'UPCOMING' && (
              <p className="mt-3 flex items-start gap-2 text-xs text-white/70">
                <Video className="mt-0.5 size-3.5 shrink-0 text-gold-bright" />
                {ev.eventType === 'WEBINAR' && !registered
                  ? tx('Đăng ký để nhận nút "Xem trực tiếp" — tham gia ngay trên hệ thống VCCI khi sự kiện bắt đầu.', 'Register to get the "Watch live" button — join right here on the VCCI platform when the event starts.', '등록하면 행사 시작 시 VCCI 플랫폼에서 바로 "라이브 시청"할 수 있습니다.')
                  : tx('Nút "Xem trực tiếp" mở tại đây khi sự kiện bắt đầu — không cần cài đặt phần mềm.', 'The "Watch live" button opens here when the event starts — nothing to install.', '행사가 시작되면 여기에서 "라이브 시청" 버튼이 열립니다 — 설치 불필요.')}
              </p>
            )}
            {!USE_MOCK && registered && <MyRegistrationActions ev={ev} />}
            {!USE_MOCK && !registered && <RejectedRegistrationNotice eventId={ev.id} />}
            {ev.eventStatus !== 'ENDED' && <AddToCalendar ev={ev} className="mt-3" />}
            <p className="mt-4 flex items-center gap-2 text-xs text-white/60"><Building2 className="size-3.5" /> {t.events.organizer}: {L(ev.organizedBy)}</p>
          </Reveal>
        </div>
      </section>

      <div className="container-page mt-8">
        <UnderlineTabs layoutId="ev-tabs" value={tab} onValueChange={(v) => setTab(v as DetailTab)} items={tabs} />
      </div>

      {tab === 'overview' && (
        <div className="container-page mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
          <section>
            <ProgramInfo ev={ev} part="overview" />
            {!hasProgramInfo(ev) && <p className="text-muted-foreground">{L(ev.introduction)}</p>}
          </section>
          <aside className="space-y-4">
            <SponsorVerticalBanner className="lg:sticky lg:top-32" />
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
        <div className="container-page mt-10 max-w-3xl">
        <h2 className="text-xl font-extrabold">{t.events.agenda}</h2>
        <ol className="relative mt-6 space-y-4 border-l-2 border-dashed border-border pl-6">
          {ev.agendaOptions.map((a, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative rounded-xl border bg-card p-4"
            >
              <span className="absolute -left-[33px] top-5 grid size-4 place-items-center rounded-full bg-background ring-2 ring-primary">
                <span className="size-1.5 rounded-full bg-primary" />
              </span>
              <p className="font-mono text-xs font-semibold text-primary">{a.agendaStartTime}{a.agendaEndTime && ` – ${a.agendaEndTime}`}</p>
              <p className="mt-1 font-semibold">{L(a.agendaTitle)}</p>
              {a.speaker && <p className="mt-1 text-sm text-muted-foreground">{L(a.speaker)}</p>}
            </motion.li>
          ))}
        </ol>
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

const hasProgramInfo = (ev: EventItem) => !!(ev.series || ev.partner || ev.targetMarket || ev.registrationDeadline || ev.quota || ev.speakers || ev.eligibility || ev.topics || ev.contact)

/** B2B programme details sourced from VCCI event forms: series, partner, market, eligibility, deadline, speakers, contact. */
function ProgramInfo({ ev, part }: { ev: EventItem; part: 'overview' | 'speakers' }) {
  const { L, locale } = useI18n()
  const facts = [
    ev.series && { k: tx('Chuỗi chương trình', 'Series', '프로그램 시리즈'), v: L(ev.series) },
    ev.partner && { k: tx('Đơn vị phối hợp', 'In partnership with', '협력 기관'), v: L(ev.partner) },
    ev.targetMarket && { k: tx('Thị trường mục tiêu', 'Target market', '목표 시장'), v: L(ev.targetMarket) },
    ev.registrationDeadline && { k: tx('Hạn đăng ký', 'Registration deadline', '신청 마감'), v: `${formatDate(ev.registrationDeadline, locale)} ${tx('(đóng sớm khi đủ chỉ tiêu)', '(may close early)', '(정원 마감 시 조기 종료)')}` },
    ev.quota && { k: tx('Chỉ tiêu', 'Quota', '모집 정원'), v: `${formatNumber(ev.quota, locale)} ${tx('doanh nghiệp', 'companies', '개사')}` },
  ].filter(Boolean) as { k: string; v: string }[]
  const info = part === 'overview'
  if (!facts.length && !ev.speakers && !ev.eligibility && !ev.topics && !ev.contact) return null

  return (
    <div className="mb-12 space-y-10">
      {info && facts.length > 0 && (
        <dl className="grid gap-x-8 gap-y-5 border-y py-6 sm:grid-cols-2">
          {facts.map((f) => (
            <div key={f.k}>
              <dt className="text-xs text-muted-foreground">{f.k}</dt>
              <dd className="mt-1 font-semibold">{f.v}</dd>
            </div>
          ))}
        </dl>
      )}
      {info && ev.eligibility && (
        <div>
          <h2 className="text-xl font-extrabold">{tx('Đối tượng & tiêu chí tham gia', 'Who should apply', '참가 대상 및 기준')}</h2>
          <ul className="mt-4 space-y-2.5">
            {ev.eligibility.map((e) => <li key={e.en} className="flex gap-2.5 text-[15px]"><Check className="mt-0.5 size-4 shrink-0 text-success" /> {L(e)}</li>)}
          </ul>
        </div>
      )}
      {info && ev.topics && (
        <div>
          <h2 className="text-xl font-extrabold">{tx('Nội dung chính', 'Key topics', '주요 내용')}</h2>
          <ul className="mt-4 space-y-2.5">
            {ev.topics.map((e) => <li key={e.en} className="flex gap-2.5 text-[15px]"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" /> {L(e)}</li>)}
          </ul>
        </div>
      )}
      {!info && ev.speakers && (
        <div>
          <h2 className="text-xl font-extrabold">{tx('Diễn giả', 'Speakers', '연사')}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {ev.speakers.map((s) => (
              <div key={s.name} className="flex gap-4 rounded-2xl border p-4">
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
      )}
      {info && ev.contact && (
        <div className="rounded-2xl bg-muted/60 p-5 text-sm">
          <p className="font-semibold">{tx('Thông tin liên hệ', 'Contact', '문의처')}</p>
          <p className="mt-1.5 text-muted-foreground">{ev.contact.name} · {tx('ĐT/Zalo', 'Phone/Zalo', '전화/Zalo')}: {ev.contact.phone} · {ev.contact.email}</p>
        </div>
      )}
    </div>
  )
}
