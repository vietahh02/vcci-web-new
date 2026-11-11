/**
 * Events explorer (CR-2026-002 EV-03/EV-04): filters + list/calendar views.
 * Guests: three time groups (upcoming / ongoing / ended).
 * Signed-in users get a "Mine" lens grouped by what they need to do next.
 */
import { motion } from 'motion/react'
import { AlertCircle, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Globe2, List, MapPin, Search, Sparkles, Ticket, Users } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { USE_MOCK } from '@/api'
import { useEventOptions, useMyRegistrations, useMyShowVisits, visitBadgeStatus } from '@/api/eventApi'
import { isActiveRegistration } from '@/api/adapters/eventExtra'
import { AddToCalendar } from '@/components/event/AddToCalendar'
import { LiveDot } from '@/components/effects'
import { Tabs } from '@/components/ui/overlay'
import { Badge, buttonClass, Input } from '@/components/ui/primitives'
import { Select } from '@/components/ui/select'
import { prepTasks } from '@/data/eventExtras'
import { getRecap } from '@/data/eventRecap'
import type { EventFormat, EventItem, EventStatus, EventType } from '@/data/mock'
import { eventTimeRange, registrationState } from '@/lib/eventStatus'
import { isRegistered, readPrepDone } from '@/lib/eventUser'
import { useI18n } from '@/lib/i18n'
import { useProfile } from '@/lib/profile'
import { readShowBadge, type BadgeStatus } from '@/lib/showReg'
import { tx } from '@/lib/tx'
import { cn, formatDate, formatMoney, formatNumber } from '@/lib/utils'

const TYPES: EventType[] = ['WEBINAR', 'LIVESTREAM', 'CONFERENCE', 'TRADE_MISSION', 'TRAINING', 'MATCHMAKING', 'SUPPORT_1TO1', 'SHOW']
const typeTone: Record<EventType, string> = {
  WEBINAR: 'bg-sky-500', LIVESTREAM: 'bg-rose-500', CONFERENCE: 'bg-indigo-500', TRADE_MISSION: 'bg-amber-500',
  TRAINING: 'bg-emerald-500', MATCHMAKING: 'bg-violet-500', SUPPORT_1TO1: 'bg-teal-500', SHOW: 'bg-fuchsia-500',
}
const SECTOR_KEYWORDS: Record<string, string[]> = {
  FOOD_DRINK: ['Food', 'Seafood', 'Coffee', 'Spices'], AGRICULTURE: ['Food', 'Coffee', 'Spices'], HOME_LIVING: ['Furniture', 'Handicraft'],
  INDUSTRIAL_MANUFACTURING: ['Machinery'], ELECTRONICS_TECH: ['Electronics'], PACKAGING_PRINTING: ['Packaging'], FASHION_BEAUTY: ['Textiles', 'Fashion', 'Cosmetics'],
}

export const formatLabel = (f: EventFormat | undefined) =>
  f === 'OFFLINE' ? tx('Trực tiếp', 'In person', '오프라인') : f === 'HYBRID' ? tx('Kết hợp', 'Hybrid', '하이브리드') : tx('Trực tuyến', 'Online', '온라인')

export function RegBadge({ ev }: { ev: EventItem }) {
  const { state, daysLeft } = registrationState(ev)
  if (state === 'NONE') return null
  const map = {
    OPEN: { v: 'success' as const, l: tx('Đang mở đăng ký', 'Registration open', '등록 중') },
    CLOSING: { v: 'gold' as const, l: tx(`Sắp hết hạn · còn ${Math.max(daysLeft, 0)} ngày`, `Closing · ${Math.max(daysLeft, 0)}d left`, `마감 임박 · ${Math.max(daysLeft, 0)}일`) },
    FULL: { v: 'muted' as const, l: tx('Hết chỗ', 'Full', '정원 마감') },
    CLOSED: { v: 'muted' as const, l: tx('Đã đóng đăng ký', 'Registration closed', '등록 마감') },
    NOT_OPEN: { v: 'secondary' as const, l: tx('Chưa mở đăng ký', 'Registration not open yet', '등록 오픈 전') },
  }[state]
  return <Badge variant={map.v}>{map.l}</Badge>
}

const span = (ev: EventItem) => ev.endDate.slice(0, 10) !== ev.startDate.slice(0, 10)

/* ---------------------------------------------------------------- one event row */
export function EventRow({ ev, hint, i = 0 }: { ev: EventItem; hint?: ReactNode; i?: number }) {
  const { t, L, locale } = useI18n()
  const d = new Date(ev.startDate)
  const live = ev.eventStatus === 'ONGOING'
  const reg = registrationState(ev)
  const canRegister = ev.eventStatus !== 'ENDED' && (reg.state === 'OPEN' || reg.state === 'CLOSING')
  return (
    <motion.li initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i, 6) * 0.04 }}>
      <Link to={`/events/${ev.id}`} className="group grid grid-cols-[56px_minmax(0,1fr)_auto] items-start gap-4 py-5 md:gap-5">
        <div className="text-center">
          <p className="text-3xl font-extrabold leading-none">{String(d.getDate()).padStart(2, '0')}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase text-muted-foreground">{formatDate(ev.startDate, locale, { month: 'short' })}</p>
          {span(ev) && <p className="mt-1 text-[10px] text-muted-foreground">→ {formatDate(ev.endDate, locale, { day: '2-digit', month: '2-digit' })}</p>}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {live ? <Badge variant="live" className="gap-1.5"><LiveDot /> {t.events.status.ONGOING}</Badge> : <Badge variant={ev.eventStatus === 'ENDED' ? 'muted' : 'outline'}>{t.events.status[ev.eventStatus]}</Badge>}
            <Badge variant="secondary"><span className={cn('size-2 rounded-full', typeTone[ev.eventType])} /> {t.events.type[ev.eventType]}</Badge>
            <Badge variant="outline"><Globe2 /> {formatLabel(ev.format)}{ev.platform ? ` · ${ev.platform}` : ''}</Badge>
            <RegBadge ev={ev} />
          </div>
          <p className="mt-1.5 text-lg font-bold leading-snug transition-colors group-hover:text-primary">{L(ev.title)}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {eventTimeRange(ev) && <span>{eventTimeRange(ev)}</span>}
            {/* online-first: the venue is secondary and only shown when the event has one */}
            {L(ev.location) && <span className="inline-flex items-center gap-1 text-xs"><MapPin className="size-3.5" /> {L(ev.location)}</span>}
            <span>{L(ev.organizedBy)}</span>
            <span className="font-medium text-foreground">{ev.participationFee ? formatMoney(ev.participationFee, ev.participationFeeCurrency, locale) : t.common.free}</span>
          </p>
          {ev.eventStatus === 'ENDED' && <RecapLine ev={ev} />}
          {hint && <div className="mt-2">{hint}</div>}
        </div>
        <span className={cn('hidden size-11 shrink-0 place-items-center rounded-full border transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground sm:grid', canRegister && 'border-primary/40 text-primary')}>
          {canRegister ? <Ticket className="size-4" /> : <ArrowUpRight className="size-4" />}
        </span>
      </Link>
    </motion.li>
  )
}

function RecapLine({ ev }: { ev: EventItem }) {
  const { locale } = useI18n()
  if (!USE_MOCK) {
    // live: real counts only (attendance statistics come from the recap endpoint on the detail page)
    return <p className="mt-2 text-sm"><span className="font-semibold text-foreground">{formatNumber(ev.registeredSlots, locale)} <span className="font-normal text-muted-foreground">{ev.eventType === 'SHOW' ? tx('người đăng ký', 'registered', '명 등록') : tx('đơn vị đăng ký', 'registrations', '등록')}</span></span></p>
  }
  const r = getRecap(ev)
  const [att, ctry] = r.stats
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <span className="font-semibold text-foreground">{formatNumber(att!.value, locale)} <span className="font-normal text-muted-foreground">{tx('người tham dự', 'attendees', '참석자')}</span></span>
      <span className="font-semibold text-foreground">{ctry!.value} <span className="font-normal text-muted-foreground">{tx('quốc gia', 'countries', '개국')}</span></span>
      <Badge variant="success">{tx('Bản ghi · Tài liệu · Ảnh', 'Replay · Materials · Photos', '다시보기 · 자료 · 사진')}</Badge>
    </p>
  )
}

function Group({ title, count, tone, children, sub }: { title: string; count: number; tone?: string; sub?: string; children: ReactNode }) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-3 border-b-2 pb-2" style={tone ? { borderColor: tone } : undefined}>
        <h3 className="text-xl font-extrabold tracking-tight">{title}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">{count}</span>
        {sub && <p className="w-full text-sm text-muted-foreground sm:ml-auto sm:w-auto">{sub}</p>}
      </div>
      <ol className="divide-y">{children}</ol>
    </section>
  )
}

/* ---------------------------------------------------------------- explorer */
/** `search`: when the page header already hosts the search box it passes the state in and the explorer hides its own box. */
export function EventExplorer({ list, search }: { list: EventItem[]; search?: { q: string; setQ: (v: string) => void } }) {
  const { t, L } = useI18n()
  const { session, registrations, profile } = useProfile()
  const { offlineFormatsEnabled } = useEventOptions()
  const [ownQ, setOwnQ] = useState('')
  const q = search ? search.q : ownQ
  const setQ = search ? search.setQ : setOwnQ
  const [type, setType] = useState<'ALL' | EventType>('ALL')
  const [format, setFormat] = useState<'ALL' | EventFormat>('ALL')
  const [free, setFree] = useState(false)
  const [view, setView] = useState<'LIST' | 'CAL'>('LIST')
  const [scope, setScope] = useState<'ALL' | 'MINE'>('ALL')

  // live: GET /api/event/registrations/my (status already mapped by the BE); mock: local markers
  const myReg = useMyRegistrations(!!session).data
  const myActive = useMemo(() => (myReg ?? []).filter((r) => isActiveRegistration(r.status)), [myReg])
  // Shows: what this browser holds (guest with a confirmation), then what the account has on the BE, which is the fresher of the two
  const myVisits = useMyShowVisits(!!session).data
  const showStates = useMemo(() => {
    const states = new Map<string, BadgeStatus>()
    list.filter((e) => e.eventType === 'SHOW').forEach((e) => { const b = readShowBadge(e.id); if (b) states.set(e.id, b.status) })
    myVisits?.forEach((v) => { const s = visitBadgeStatus(v.status); if (s) states.set(v.showId, s) })
    return states
  }, [list, myVisits])
  const regIds = useMemo(() => new Set([...showStates.keys(), ...(USE_MOCK
    ? [...registrations.map((r) => r.eventId), ...list.filter((e) => isRegistered(e.id)).map((e) => e.id)]
    : [...myActive.map((r) => r.eventId), ...list.filter((e) => e.myRegistration).map((e) => e.id)])]), [registrations, list, myActive, showStates])
  const hasMine = !!session || regIds.size > 0

  /*
   * Online-first (Leader 01/11/2026, Q19 option B): the format filter only exists when the BE flag
   * app.event.offline-formats-enabled is on (GET /api/event/options) AND the data has non-online events.
   * Flag off: no ALL/OFFLINE/HYBRID choice, every event is treated as online (legacy rows still show their own badge).
   */
  const hasFormats = offlineFormatsEnabled && list.some((e) => (e.format ?? 'ONLINE') !== 'ONLINE')
  const fmt = hasFormats ? format : 'ALL'
  // The BE decides which kinds are listed (vcci.event.visible-source-kinds); with one kind left a type filter has nothing to choose.
  const types = useMemo(() => TYPES.filter((x) => list.some((e) => e.eventType === x)), [list])
  const hasTypes = types.length > 1
  const typeFilter = hasTypes ? type : 'ALL'
  // the wording follows what is listed: only shows, and an address only when some event has one
  const onlyShows = types.length === 1 && types[0] === 'SHOW'
  const hasVenue = list.some((e) => L(e.location))

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase()
    return list.filter((e) => (typeFilter === 'ALL' || e.eventType === typeFilter) && (fmt === 'ALL' || (e.format ?? 'ONLINE') === fmt)
      && (!free || !e.participationFee) && (!k || [L(e.title), L(e.organizedBy), L(e.location)].some((s) => s.toLowerCase().includes(k))))
  }, [list, typeFilter, fmt, free, q, L])

  const byStatus = (s: EventStatus) => filtered.filter((e) => e.eventStatus === s)
  const upcoming = byStatus('UPCOMING').sort((a, b) => a.startDate.localeCompare(b.startDate))
  const ongoing = byStatus('ONGOING').sort((a, b) => a.endDate.localeCompare(b.endDate))
  const ended = byStatus('ENDED').sort((a, b) => b.startDate.localeCompare(a.startDate))

  /* "Mine" lens — grouped by what the participant must do next */
  const mine = useMemo(() => {
    const keywords = new Set(profile.registration.industries.flatMap((c) => SECTOR_KEYWORDS[c] ?? []))
    const todo = (e: EventItem) => { if (!USE_MOCK) return myActive.find((r) => r.eventId === e.id)?.missingPrep ?? 0; const ts = prepTasks(e); const done = readPrepDone(e.id); return ts.filter((x) => !done.includes(x.id)).length }
    const reg = filtered.filter((e) => regIds.has(e.id))
    const soonest = (a: EventItem, b: EventItem) => a.startDate.localeCompare(b.startDate)
    const toPay = (e: EventItem) => showStates.get(e.id) === 'PENDING_PAYMENT' && e.eventStatus !== 'ENDED'
    const needsAction = reg.filter((e) => (e.eventStatus === 'UPCOMING' && todo(e) > 0) || toPay(e)).sort(soonest)
    const na = new Set(needsAction.map((e) => e.id))
    const pending = reg.filter((e) => (e.eventType === 'MATCHMAKING' || showStates.get(e.id) === 'PENDING_APPROVAL') && e.eventStatus !== 'ENDED' && !na.has(e.id)).sort(soonest)
    const pd = new Set(pending.map((e) => e.id))
    const rec = filtered.filter((e) => !regIds.has(e.id) && e.eventStatus !== 'ENDED').map((e) => ({ e, score: e.industry.filter((i) => keywords.has(i)).length * 2 + (e.industry.includes('Multi-industry') ? 1 : 0) }))
      .filter((x) => x.score > 0 && ['OPEN', 'CLOSING'].includes(registrationState(x.e).state) || (x.score > 0 && x.e.eventStatus === 'ONGOING')).sort((a, b) => b.score - a.score).slice(0, 4).map((x) => x.e)
    return {
      needsAction, todo,
      attending: reg.filter((e) => e.eventStatus === 'ONGOING' && !na.has(e.id) && !pd.has(e.id)).sort((a, b) => a.endDate.localeCompare(b.endDate)),
      soon: reg.filter((e) => e.eventStatus === 'UPCOMING' && !na.has(e.id) && !pd.has(e.id)).sort(soonest),
      pending,
      attended: reg.filter((e) => e.eventStatus === 'ENDED' && (!showStates.has(e.id) || showStates.get(e.id) === 'ISSUED')).sort((a, b) => b.startDate.localeCompare(a.startDate)),
      rec,
    }
  }, [filtered, regIds, profile, myActive, showStates])

  const empty = filtered.length === 0

  return (
    <section className="container-page mt-16" id="explorer">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-3xl font-extrabold tracking-tight">{onlyShows ? tx('Tất cả hội chợ', 'All trade shows', '전체 박람회') : tx('Tất cả sự kiện', 'All events', '전체 행사')}</h2>
        <div className="flex flex-wrap gap-2">
          {hasMine && (
            <Tabs layoutId="ev-scope" size="sm" value={scope} onValueChange={(v) => setScope(v as typeof scope)}
              items={[{ value: 'ALL', label: tx('Tất cả', 'All', '전체') }, { value: 'MINE', label: <><Sparkles className="size-3.5" /> {tx('Của tôi', 'Mine', '내 행사')}</> }]} />
          )}
          <Tabs layoutId="ev-view" size="sm" value={view} onValueChange={(v) => setView(v as typeof view)}
            items={[{ value: 'LIST', label: <><List className="size-3.5" /> {tx('Danh sách', 'List', '목록')}</> }, { value: 'CAL', label: <><CalendarDays className="size-3.5" /> {tx('Lịch', 'Calendar', '캘린더')}</> }]} />
        </div>
      </div>

      <div className={cn('mt-5 grid gap-3', search ? (hasTypes && hasFormats ? 'md:grid-cols-[220px_160px_auto]' : hasTypes ? 'md:grid-cols-[220px_auto]' : hasFormats ? 'md:grid-cols-[160px_auto]' : 'md:grid-cols-[auto]') : hasTypes && hasFormats ? 'md:grid-cols-[1fr_220px_160px_auto]' : hasTypes ? 'md:grid-cols-[1fr_220px_auto]' : hasFormats ? 'md:grid-cols-[1fr_160px_auto]' : 'md:grid-cols-[1fr_auto]')}>
        {!search && <div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder={onlyShows
          ? (hasVenue ? tx('Tìm hội chợ, đơn vị tổ chức, địa điểm…', 'Search trade shows, organizers, venues…', '박람회, 주최, 장소 검색…') : tx('Tìm hội chợ, đơn vị tổ chức…', 'Search trade shows, organizers…', '박람회, 주최 검색…'))
          : (hasVenue ? tx('Tìm sự kiện, đơn vị tổ chức, địa điểm…', 'Search events, organizers, venues…', '행사, 주최, 장소 검색…') : tx('Tìm sự kiện, đơn vị tổ chức…', 'Search events, organizers…', '행사, 주최 검색…'))} aria-label="search" /></div>}
        {hasTypes && <Select value={type} onValueChange={setType} aria-label={tx('Loại sự kiện', 'Event type', '행사 유형')} options={[{ value: 'ALL', label: tx('Mọi loại sự kiện', 'All event types', '모든 유형') }, ...TYPES.map((x) => ({ value: x, label: t.events.type[x] }))]} />}
        {hasFormats && <Select value={fmt} onValueChange={setFormat} aria-label={tx('Hình thức', 'Format', '형식')} options={[{ value: 'ALL', label: tx('Mọi hình thức', 'Any format', '모든 형식') }, ...(['ONLINE', 'OFFLINE', 'HYBRID'] as const).map((x) => ({ value: x, label: formatLabel(x) }))]} />}
        <label className="flex h-10 items-center gap-2 whitespace-nowrap text-sm font-medium"><input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} /> {tx('Miễn phí', 'Free only', '무료만')}</label>
      </div>

      <div className="mt-8">
        {view === 'CAL' ? (
          <CalendarView list={filtered} types={types} />
        ) : empty ? (
          <p className="text-muted-foreground">{t.common.noResults}</p>
        ) : scope === 'MINE' && hasMine ? (
          <div className="space-y-10">
            {mine.needsAction.length > 0 && (
              <Group title={tx('Cần làm ngay', 'Needs your action', '지금 해야 할 일')} count={mine.needsAction.length} tone="#dc2626" sub={tx('Hoàn tất việc chuẩn bị trước ngày diễn ra', 'Finish preparation before the event', '행사 전 준비를 완료하세요')}>
                {mine.needsAction.map((e, i) => <EventRow key={e.id} ev={e} i={i} hint={<span className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive"><AlertCircle className="size-4" /> {showStates.get(e.id) === 'PENDING_PAYMENT' ? tx('Cần nộp biên lai để hoàn tất đăng ký', 'Upload your receipt to complete registration', '등록을 완료하려면 영수증을 제출하세요') : <>{mine.todo(e)} {tx('việc chuẩn bị chưa xong', 'prep tasks open', '개 준비 항목 남음')}</>}</span>} />)}
              </Group>
            )}
            {mine.attending.length > 0 && <Group title={tx('Đang tham gia', 'Happening now', '진행 중')} count={mine.attending.length} tone="#e11d48">{mine.attending.map((e, i) => <EventRow key={e.id} ev={e} i={i} />)}</Group>}
            {mine.soon.length > 0 && <Group title={tx('Sắp tham dự', 'Coming up', '참석 예정')} count={mine.soon.length} tone="#006699">{mine.soon.map((e, i) => <EventRow key={e.id} ev={e} i={i} hint={<AddToCalendar ev={e} tone="light" />} />)}</Group>}
            {mine.pending.length > 0 && <Group title={tx('Chờ duyệt / xét chọn', 'Pending review', '심사 대기')} count={mine.pending.length} tone="#d4af37">{mine.pending.map((e, i) => <EventRow key={e.id} ev={e} i={i} />)}</Group>}
            {mine.rec.length > 0 && <Group title={tx('Gợi ý cho bạn', 'Recommended for you', '추천 행사')} count={mine.rec.length} sub={tx('Theo ngành hàng trong hồ sơ doanh nghiệp', 'Based on your company profile sectors', '회사 프로필 업종 기준')}>{mine.rec.map((e, i) => <EventRow key={e.id} ev={e} i={i} />)}</Group>}
            {mine.attended.length > 0 && <Group title={onlyShows ? t.events.status.ENDED : tx('Đã tham dự', 'Attended', '참석 완료')} count={mine.attended.length} sub={tx('Tài liệu, bản ghi và đánh giá', 'Materials, recordings and feedback', '자료, 녹화, 평가')}>{mine.attended.map((e, i) => <EventRow key={e.id} ev={e} i={i} />)}</Group>}
            {mine.needsAction.length + mine.attending.length + mine.soon.length + mine.pending.length + mine.attended.length === 0 && (
              <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground"><Users className="mx-auto mb-2 size-6" />{tx('Bạn chưa đăng ký sự kiện nào. Xem các gợi ý ở trên hoặc chuyển sang "Tất cả".', 'You have not registered for any event yet. See the recommendations above or switch to "All".', '아직 등록한 행사가 없습니다.')}</p>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {ongoing.length > 0 && <Group title={t.events.status.ONGOING} count={ongoing.length} tone="#e11d48">{ongoing.map((e, i) => <EventRow key={e.id} ev={e} i={i} hint={regIds.has(e.id) ? <Badge variant="success">{tx('Bạn đã đăng ký', 'You are registered', '등록 완료')}</Badge> : undefined} />)}</Group>}
            {upcoming.length > 0 && <Group title={t.events.status.UPCOMING} count={upcoming.length} tone="#006699">{upcoming.map((e, i) => <EventRow key={e.id} ev={e} i={i} hint={regIds.has(e.id) ? <Badge variant="success">{tx('Bạn đã đăng ký', 'You are registered', '등록 완료')}</Badge> : undefined} />)}</Group>}
            {ended.length > 0 && <Group title={t.events.status.ENDED} count={ended.length} tone="#94a3b8" sub={tx('Xem lại bản ghi, tài liệu và báo cáo', 'Replays, materials and reports', '다시보기, 자료, 보고서')}>{ended.map((e, i) => <EventRow key={e.id} ev={e} i={i} />)}</Group>}
          </div>
        )}
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- month calendar */
function CalendarView({ list, types }: { list: EventItem[]; types: EventType[] }) {
  const { t, L, locale } = useI18n()
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d })
  const [selected, setSelected] = useState<string>(() => new Date().toDateString())

  const first = new Date(month)
  const offset = (first.getDay() + 6) % 7 // Monday first
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells = Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, i) => { const n = i - offset + 1; return n >= 1 && n <= days ? new Date(month.getFullYear(), month.getMonth(), n) : null })
  const onDay = (d: Date) => {
    const s = new Date(d); s.setHours(0, 0, 0, 0)
    const e = new Date(d); e.setHours(23, 59, 59, 999)
    return list.filter((ev) => new Date(ev.startDate) <= e && new Date(ev.endDate) >= s)
  }
  const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1))
  const weekdays = Array.from({ length: 7 }, (_, i) => formatDate(new Date(2024, 0, 1 + i).toISOString(), locale, { weekday: 'short' }))
  const selDate = new Date(selected)
  const selEvents = onDay(selDate)

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-lg font-extrabold capitalize">{formatDate(month.toISOString(), locale, { month: 'long', year: 'numeric' })}</p>
          <div className="flex gap-1">
            <button type="button" aria-label="prev" onClick={() => shift(-1)} className="grid size-9 place-items-center rounded-full border hover:bg-primary-soft hover:text-primary"><ChevronLeft className="size-4" /></button>
            <button type="button" onClick={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); setSelected(d.toDateString()) }} className="rounded-lg border px-3 text-sm font-semibold hover:bg-muted">{tx('Hôm nay', 'Today', '오늘')}</button>
            <button type="button" aria-label="next" onClick={() => shift(1)} className="grid size-9 place-items-center rounded-full border hover:bg-primary-soft hover:text-primary"><ChevronRight className="size-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 overflow-hidden rounded-xl border text-xs">
          {weekdays.map((w) => <div key={w} className="bg-muted px-2 py-2 text-center font-semibold uppercase text-muted-foreground">{w}</div>)}
          {cells.map((d, i) => {
            const evs = d ? onDay(d) : []
            const isSel = d?.toDateString() === selected
            const today = d?.toDateString() === new Date().toDateString()
            return (
              <button key={i} type="button" disabled={!d} onClick={() => d && setSelected(d.toDateString())}
                className={cn('min-h-20 border-l border-t p-1.5 text-left align-top transition hover:bg-muted/60 md:min-h-24', !d && 'bg-muted/30', isSel && 'bg-primary-soft ring-2 ring-inset ring-primary')}>
                {d && <span className={cn('inline-grid size-6 place-items-center rounded-full text-[12px] font-bold', today && 'bg-primary text-primary-foreground')}>{d.getDate()}</span>}
                <span className="mt-1 hidden flex-col gap-0.5 md:flex">
                  {evs.slice(0, 2).map((e) => <span key={e.id} className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10.5px] font-medium leading-tight"><span className={cn('size-1.5 shrink-0 rounded-full', typeTone[e.eventType])} /><span className="truncate">{L(e.title)}</span></span>)}
                  {evs.length > 2 && <span className="px-1 text-[10px] font-semibold text-muted-foreground">+{evs.length - 2}</span>}
                </span>
                {evs.length > 0 && <span className="mt-1 flex gap-0.5 md:hidden">{evs.slice(0, 4).map((e) => <span key={e.id} className={cn('size-1.5 rounded-full', typeTone[e.eventType])} />)}</span>}
              </button>
            )
          })}
        </div>
        {types.length > 1 && <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {types.map((x) => <span key={x} className="inline-flex items-center gap-1.5"><span className={cn('size-2 rounded-full', typeTone[x])} /> {t.events.type[x]}</span>)}
        </div>}
      </div>

      <aside className="rounded-2xl border bg-card p-4">
        <p className="font-extrabold capitalize">{formatDate(selDate.toISOString(), locale, { weekday: 'long', day: '2-digit', month: 'long' })}</p>
        {selEvents.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">{tx('Không có sự kiện trong ngày này.', 'No events on this day.', '이 날 행사가 없습니다.')}</p> : (
          <ul className="mt-3 space-y-3">
            {selEvents.map((e) => (
              <li key={e.id} className="rounded-xl border p-3">
                <div className="flex flex-wrap gap-1.5"><Badge variant="secondary"><span className={cn('size-2 rounded-full', typeTone[e.eventType])} /> {t.events.type[e.eventType]}</Badge><Badge variant="outline">{formatLabel(e.format)}</Badge><RegBadge ev={e} /></div>
                <Link to={`/events/${e.id}`} className="mt-1.5 block font-bold leading-snug hover:text-primary">{L(e.title)}</Link>
                {(eventTimeRange(e) || L(e.location)) && <p className="mt-0.5 text-xs text-muted-foreground">{[eventTimeRange(e), L(e.location)].filter(Boolean).join(' · ')}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <AddToCalendar ev={e} tone="light" />
                  <Link to={`/events/${e.id}`} className={buttonClass('default', 'sm')}>{t.common.viewDetail}</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  )
}
