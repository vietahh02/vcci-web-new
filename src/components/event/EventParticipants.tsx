/** Participants of an event in three columns — domestic businesses, foreign businesses, sponsors — for every state: not open yet → live → ended. */
import { ArrowRightLeft, CalendarClock, Globe2, Handshake, Landmark, MapPin, MessageSquare, Radio } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BusinessChatButton } from '@/components/chat/BusinessChatButton'
import { CompanyMark, CountryChip, VerifiedBadge } from '@/components/brand'
import { LiveDot, Tilt } from '@/components/effects'
import { useToast } from '@/components/ui/overlay'
import { Badge, Button, buttonClass } from '@/components/ui/primitives'
import { tokens, USE_MOCK, useBusinessDirectory } from '@/api'
import { connectParticipant, useEventParticipants, type ConnectionType } from '@/api/eventApi'
import type { Participant, Side } from '@/data/eventParticipants'
import { businesses, type EventItem } from '@/data/mock'
import { useI18n } from '@/lib/i18n'
import { OPTIONS } from '@/lib/profile'
import { cn, img } from '@/lib/utils'
import { tx } from '@/lib/tx'
import { isOnlineShowEvent } from '@/lib/eventStatus'

/** Seller → domestic business, Buyer → foreign business, Support service → sponsor. */
const COLUMNS: { side: Side; icon: typeof MapPin; tone: string; chip: string; title: () => string; hint: () => string }[] = [
  { side: 'SELLER', icon: MapPin, tone: 'bg-primary', chip: 'bg-primary-soft text-primary', title: () => tx('Doanh nghiệp trong nước', 'Domestic businesses', '국내 기업'), hint: () => tx('Nhà xuất khẩu Việt Nam, cung ứng sản phẩm', 'Vietnamese exporters supplying products', '제품을 공급하는 베트남 수출기업') },
  { side: 'BUYER', icon: Globe2, tone: 'bg-gold', chip: 'bg-gold-soft text-gold', title: () => tx('Doanh nghiệp nước ngoài', 'Foreign businesses', '해외 기업'), hint: () => tx('Nhà nhập khẩu, phân phối, thu mua', 'Importers, distributors, sourcing offices', '수입·유통·소싱 기업') },
  { side: 'SUPPORT', icon: Landmark, tone: 'bg-navy', chip: 'bg-navy/10 text-navy dark:text-white', title: () => tx('Nhà tài trợ', 'Sponsors', '후원사'), hint: () => tx('Đơn vị đồng hành và hỗ trợ sự kiện', 'Organisations backing and supporting the event', '행사를 후원하고 지원하는 기관') },
]

/** Featured organisations shown per column before "view all". */
const FEATURED = 3
/** Cards shown on the event page before "view more" (3 columns × 3 rows). */
const GRID = 9

const verifiedIds = new Set(businesses.filter((x) => x.verified).map((x) => x.id))

/** `embedded`: rendered inside a page block that already provides the page container (the Show overview). */
export function EventParticipants({ ev, onRegister, listed, embedded }: { ev: EventItem; onRegister?: string; listed?: Participant[]; embedded?: boolean }) {
  const { L, lang, t } = useI18n()
  // The API lists every event registrant as BUYER; the columns are domestic vs foreign, so a registrant from Viet Nam goes in the domestic column.
  const columnOf = (p: Participant): Side => (p.side === 'BUYER' && p.country === 'VN' ? 'SELLER' : p.side)
  // business type and industry arrive as codes (VN_EXPORTER, FOOD_DRINK): show their labels
  const kindLabel = (p: Participant) => { const k = L(p.kind); return (t.supplier.types as Record<string, string>)[k] ?? k }
  const industryLabel = (code: string) => { const o = OPTIONS.industries.find((x) => x.value === code); return o ? L(o) : code }
  const toast = useToast()
  const remote = useEventParticipants(ev).data ?? []
  // `listed`: the businesses from the show's own payload, used until the API has a participant list for this show
  const all = remote.length ? remote : listed ?? []
  const onlineShow = isOnlineShowEvent(ev)
  // the participants API gives a company name, not the business: match it to the directory for the cover and logo shown on the card
  const directory = useBusinessDirectory().data
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
  const bizOf = (p: Participant) =>
    (p.businessId ? businesses.find((b) => b.id === p.businessId) ?? directory?.find((b) => b.id === p.businessId) : undefined) ??
    directory?.find((b) => norm(b.name) === norm(p.name) || (!!p.nameEn && norm(b.nameEn) === norm(p.nameEn)))
  const { pathname } = useLocation()
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [showAll, setShowAll] = useState<Partial<Record<Side, boolean>>>({})
  // event page (not embedded): one grid filtered by side instead of three fixed columns
  const [pick, setPick] = useState<'ALL' | Side>('ALL')
  const [gridAll, setGridAll] = useState(false)
  const live = ev.eventStatus === 'ONGOING'
  const ended = ev.eventStatus === 'ENDED'
  const onlineNow = all.filter((p) => p.online).length
  const attended = all.filter((p) => p.attended).length
  // presence is only claimed when the API reports it: with no data nobody is "not in the room" or a "no-show"
  const hasPresence = live && onlineNow > 0
  const hasAttendance = ended && attended > 0

  const demo = (title: string) => toast({ kind: 'info', title, description: tx('Bản mẫu — chưa nối hệ thống họp trực tuyến.', 'Prototype — not yet connected to the online meeting system.', '프로토타입 — 온라인 미팅 시스템 미연결.') })
  /** Live: POST /api/event/{id}/connections (needs sign-in + a registration); mock: toast only. */
  const [sent, setSent] = useState<Set<string>>(new Set())
  const connect = (p: Participant, type: ConnectionType, done: string) => {
    if (USE_MOCK) return demo(done)
    connectParticipant(ev.id, p.id, type).then(
      () => { setSent((s) => new Set(s).add(`${p.id}:${type}`)); toast({ kind: 'success', title: done }) },
      (e: Error) => toast({ kind: 'info', title: e.message }),
    )
  }

  const status = (p: Participant) => {
    if (hasPresence) return p.online ? <Badge variant="live" className="gap-1.5"><LiveDot /> {tx('Đang trực tuyến', 'Online now', '접속 중')}</Badge> : <Badge variant="muted">{tx('Chưa vào phòng', 'Not in room', '미접속')}</Badge>
    if (ended) return hasAttendance ? (p.attended ? <Badge variant="success">{tx('Đã tham dự', 'Attended', '참석')}</Badge> : <Badge variant="muted">{tx('Không tham dự', 'No-show', '불참')}</Badge>) : null
    return <Badge variant="success">{p.side === 'BUYER' ? tx('Đã đăng ký', 'Registered', '등록됨') : tx('Đã xác nhận tham gia', 'Confirmed', '참가 확정')}</Badge>
  }

  /** Show, live mode: contact records the connection (mail to the business, no contact details shown) and opens the B2B chat; a guest signs in first. */
  const contactShow = (p: Participant) => {
    if (!p.businessId) return null
    if (!tokens.access()) return <Link to={`/login?return=${encodeURIComponent(pathname)}`} className={buttonClass('outline', 'sm')}><MessageSquare /> {tx('Liên hệ', 'Contact', '연락')}</Link>
    return <BusinessChatButton organizationId={p.businessId} showName={L(ev.title)} label={tx('Liên hệ', 'Contact', '연락')} onOpen={() => { connectParticipant(ev.id, p.id, 'CONNECT').catch((e: Error) => console.warn(`[show] connection not recorded: ${e.message}`)) }} />
  }

  const action = (p: Participant) => {
    if (live) return p.online ? <Button size="sm" className="bg-live hover:bg-live/90" disabled={sent.has(`${p.id}:MEET_NOW`)} onClick={() => connect(p, 'MEET_NOW', tx('Đã mời gặp ngay', 'Meet-now invitation sent', '지금 미팅 요청 전송'))}><Radio /> {tx('Gặp ngay', 'Meet now', '지금 미팅')}</Button> : <Button size="sm" variant="outline" disabled={sent.has(`${p.id}:PRE_MEETING`)} onClick={() => connect(p, 'PRE_MEETING', tx('Đã gửi yêu cầu đặt lịch', 'Meeting request sent', '미팅 예약 요청 전송'))}><CalendarClock /> {tx('Đặt lịch', 'Book', '예약')}</Button>
    if (ended) return <Button size="sm" variant="outline" disabled={sent.has(`${p.id}:CONNECT`)} onClick={() => connect(p, 'CONNECT', tx('Đã gửi yêu cầu kết nối', 'Connection request sent', '연결 요청 전송'))}><Handshake /> {tx('Kết nối tiếp', 'Reconnect', '다시 연결')}</Button>
    return <Button size="sm" variant="outline" disabled={sent.has(`${p.id}:PRE_MEETING`)} onClick={() => connect(p, 'PRE_MEETING', tx('Đã gửi lời hẹn gặp trước', 'Pre-meeting request sent', '사전 미팅 요청 전송'))}><CalendarClock /> {tx('Hẹn gặp trước', 'Pre-book', '사전 예약')}</Button>
  }

  const row = (p: Participant) => <li key={p.id} className="flex flex-col gap-3 border-b p-4 last:border-b-0">{body(p)}</li>

  const body = (p: Participant, card = false) => {
    const biz = card ? bizOf(p) : undefined
    const bid = p.businessId ?? biz?.id
    return (
    <>
      <div className={card ? 'flex flex-col gap-2.5' : 'flex items-start gap-3'}>
        {card
          ? <CompanyMark name={p.nameEn ?? p.name} accent={p.accent} logo={biz?.logoUrl} className="-mt-9 size-16 rounded-full border-4 border-card text-lg shadow-md" />
          : <CompanyMark name={p.nameEn ?? p.name} accent={p.accent} className="size-11 shrink-0" />}
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-bold leading-snug">
            <span className="min-w-0 break-words transition-colors group-hover:text-primary">{lang === 'vi' ? p.name : p.nameEn ?? p.name}</span>
            {!card && bid && verifiedIds.has(bid) && <VerifiedBadge compact />}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"><CountryChip code={p.country} /> {kindLabel(p)}</p>
        </div>
      </div>
      {p.industries.filter(Boolean).length > 0 && <div className="flex flex-wrap gap-1.5">{p.industries.filter(Boolean).slice(0, 3).map((i) => <Badge key={i} variant="muted">{industryLabel(i)}</Badge>)}</div>}
      {p.side === 'SELLER' && p.offer && p.offer.length > 0 && (
        <p className="text-sm"><span className="inline-flex items-center gap-1.5 font-semibold text-primary"><ArrowRightLeft className="size-3.5" /> {tx('Cung ứng', 'Supplies', '공급')}:</span> <span className="text-muted-foreground">{p.offer.map((o) => L(o)).join(' · ')}</span></p>
      )}
      {p.side === 'BUYER' && p.need && (
        <p className="text-sm"><span className="inline-flex items-center gap-1.5 font-semibold text-gold"><ArrowRightLeft className="size-3.5" /> {tx('Nhu cầu', 'Looking for', '수요')}:</span> <span className="text-muted-foreground">{L(p.need)}</span></p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {status(p)}
        {(live || ended) && p.side === 'SELLER' && p.quotes > 0 && <Badge variant="secondary">{p.quotes} {tx('báo giá', 'quotes', '견적')}</Badge>}
      </div>
      <div className={cn('flex flex-wrap items-center gap-2', card && 'mt-auto border-t pt-3')}>
        {bid && <Link to={`/suppliers/${bid}`} className={buttonClass('ghost', 'sm', 'text-primary')}>{tx('Hồ sơ', 'Profile', '프로필')}</Link>}
        {ev.eventType === 'SHOW' && !USE_MOCK ? contactShow(p) : p.side !== 'SUPPORT' && action(p)}
      </div>
    </>
    )
  }

  const columns = onlineShow ? COLUMNS.filter((c) => all.some((p) => columnOf(p) === c.side)) : COLUMNS
  // Show overview: no block without data. Webinar tab (onRegister set) keeps its "no organisations yet" columns and register prompt.
  if (!all.length && !onRegister) return null

  const subtitle = hasPresence ? tx(`${onlineNow} đơn vị đang trực tuyến lúc này.`, `${onlineNow} organisations are online right now.`, `현재 ${onlineNow}개 기관이 접속 중입니다.`)
    : hasAttendance ? tx(`${attended} đơn vị đã tham dự.`, `${attended} organisations attended.`, `${attended}개 기관이 참석했습니다.`)
    : onlineShow ? tx('Doanh nghiệp tham gia Show này.', 'Businesses taking part in this show.', '이 쇼에 참가하는 기업입니다.')
    : tx('Một số đơn vị tiêu biểu tham gia sự kiện. Danh sách cập nhật khi đơn vị được duyệt.', 'A selection of organisations taking part. The list updates as organisations are approved.', '참가 기관 일부입니다. 승인되는 대로 업데이트됩니다.')

  const registerCta = !ended && onRegister && (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-primary-soft px-6 py-5">
      <p className="max-w-3xl text-sm font-medium text-primary">{tx('Bạn là doanh nghiệp trong nước hay nước ngoài? Đăng ký để tên và nhu cầu của bạn được công khai trong danh sách này và đặt lịch gặp đối tác.', 'Are you a domestic or a foreign business? Register to appear here and book meetings.', '국내 또는 해외 기업이신가요? 등록하고 미팅을 예약하세요.')}</p>
      <Link to={onRegister} className={buttonClass('default', 'sm')}>{tx('Đăng ký tham gia', 'Register', '등록')}</Link>
    </div>
  )
  const disclaimer = <p className="mt-3 text-[11px] text-muted-foreground">{tx('Tên doanh nghiệp, nhu cầu và năng lực cung ứng được công khai cho mọi người xem; thông tin liên hệ chỉ mở sau khi hai bên kết nối. '+(USE_MOCK ? 'Danh sách là dữ liệu minh hoạ.' : '')+'', 'Company names, needs and supply are public to everyone; contact details open only after both sides connect.'+(USE_MOCK ? ' The list is sample data.' : ''), '기업명, 수요, 공급 정보는 모두에게 공개되며 연락처는 연결 후에만 공개됩니다.'+(USE_MOCK ? ' 샘플 데이터입니다.' : ''))}</p>

  if (!embedded) {
    const visible = all.filter((p) => !onlineOnly || p.online)
    const counts = COLUMNS.map((c) => ({ ...c, n: visible.filter((p) => columnOf(p) === c.side).length }))
    const chosen = visible.filter((p) => pick === 'ALL' || columnOf(p) === pick)
    const shown = gridAll ? chosen : chosen.slice(0, GRID)
    // same pill look as the Businesses directory filter
    const chip = (key: 'ALL' | Side, label: string, n: number, Icon?: typeof MapPin) => (
      <button key={key} type="button" aria-pressed={pick === key}
        onClick={() => { setPick(key); setGridAll(false) }}
        className={cn('inline-flex h-11 items-center gap-2 rounded-full border px-5 text-[15px] font-semibold transition-colors', n === 0 && pick !== key && 'opacity-60',
          pick === key ? 'border-primary bg-primary text-primary-foreground shadow-[0_8px_18px_-10px_rgba(0,102,153,0.9)]' : 'border-primary/50 bg-card text-primary hover:border-primary hover:bg-primary-soft dark:border-white/25 dark:text-[#cfe9f8] dark:hover:bg-white/10')}>
        {Icon && <Icon className="size-4" />} {label}
        <span className={cn('rounded-full px-1.5 text-xs tabular-nums', pick === key ? 'bg-white/20' : 'bg-primary/10 dark:bg-white/10')}>{n}</span>
      </button>
    )
    return (
      <section className="container-page mt-10" aria-label="participants">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">{tx('Đơn vị nổi bật', 'Featured organisations', '주요 참가 기관')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {hasPresence && <label className="flex w-fit items-center gap-2 text-sm font-medium"><input type="checkbox" checked={onlineOnly} onChange={(e) => { setOnlineOnly(e.target.checked); setGridAll(false) }} /> {tx('Chỉ hiện đơn vị đang trực tuyến', 'Show only organisations online now', '접속 중인 기관만 보기')}</label>}
        </div>

        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label={tx('Lọc theo nhóm', 'Filter by group', '그룹별 보기')}>
          {chip('ALL', tx('Tất cả', 'All', '전체'), visible.length)}
          {counts.map((c) => chip(c.side, c.title(), c.n, c.icon))}
        </div>

        {shown.length === 0 ? (
          <div className="mt-6 grid place-items-center gap-2 rounded-3xl border border-dashed bg-muted/30 px-6 py-14 text-center">
            <Handshake className="size-7 text-muted-foreground/50" />
            <p className="font-semibold">{pick === 'ALL' ? tx('Chưa có đơn vị nào', 'No organisations yet', '아직 없습니다') : tx('Chưa có đơn vị nào trong nhóm này', 'No organisations in this group yet', '이 그룹에는 아직 없습니다')}</p>
            <p className="max-w-md text-sm text-muted-foreground">{tx('Danh sách hiển thị khi đơn vị được duyệt tham gia.', 'Organisations appear here once approved.', '참가가 승인되면 표시됩니다.')}</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {shown.map((p, i) => (
                <motion.div key={p.id} layout initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: Math.min(i, 9) * 0.05, duration: 0.5 } }} exit={{ opacity: 0, scale: 0.95 }}>
                  {/* hover feel of the Businesses card: tilt, border + shadow, name picks up the brand colour */}
                  <Tilt className="h-full rounded-3xl" max={6}>
                    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-primary/30 hover:shadow-2xl hover:shadow-navy/12">
                      {(() => {
                        const biz = bizOf(p)
                        return (
                          <div className="relative h-28 shrink-0 overflow-hidden">
                            {biz && biz.hasCover !== false && biz.coverImage
                              ? <img src={img(biz.coverImage, 640, 300)} alt="" loading="lazy" className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
                              : <div className="size-full transition-transform duration-700 ease-out group-hover:scale-110" style={{ background: `radial-gradient(120% 140% at 85% 0%, color-mix(in oklab, ${p.accent} 70%, white) 0%, ${p.accent} 45%, color-mix(in oklab, ${p.accent} 55%, #08082e) 100%)` }} />}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                            {biz?.verified && <VerifiedBadge className="absolute right-3 top-3 bg-white/90 dark:bg-black/50" />}
                          </div>
                        )
                      })()}
                      <div className="relative flex flex-1 flex-col gap-3 px-4 pb-4">{body(p, true)}</div>
                    </div>
                  </Tilt>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        {chosen.length > GRID && (
          <div className="mt-5 text-center">
            <Button variant="outline" size="sm" onClick={() => setGridAll((v) => !v)}>
              {gridAll ? tx('Thu gọn', 'Show less', '접기') : tx(`Xem thêm ${chosen.length - GRID} đơn vị`, `Show ${chosen.length - GRID} more`, `${chosen.length - GRID}개 더 보기`)}
            </Button>
          </div>
        )}
        {registerCta}
        {disclaimer}
      </section>
    )
  }

  return (
    <section className={cn('mt-10', embedded ? 'mt-14 w-full px-4 sm:px-6 lg:px-10' : 'container-page')} aria-label="participants">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">{tx('Đơn vị nổi bật', 'Featured organisations', '주요 참가 기관')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasPresence ? tx(`${onlineNow} đơn vị đang trực tuyến lúc này.`, `${onlineNow} organisations are online right now.`, `현재 ${onlineNow}개 기관이 접속 중입니다.`)
              : hasAttendance ? tx(`${attended} đơn vị đã tham dự.`, `${attended} organisations attended.`, `${attended}개 기관이 참석했습니다.`)
              : onlineShow ? tx('Doanh nghiệp tham gia Show này.', 'Businesses taking part in this show.', '이 쇼에 참가하는 기업입니다.')
              : tx('Một số đơn vị tiêu biểu tham gia sự kiện. Danh sách cập nhật khi đơn vị được duyệt.', 'A selection of organisations taking part. The list updates as organisations are approved.', '참가 기관 일부입니다. 승인되는 대로 업데이트됩니다.')}
          </p>
        </div>
        {hasPresence && <label className="flex w-fit items-center gap-2 text-sm font-medium"><input type="checkbox" checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} /> {tx('Chỉ hiện đơn vị đang trực tuyến', 'Show only organisations online now', '접속 중인 기관만 보기')}</label>}
      </div>

      <div className={cn('mt-6 grid items-start gap-5', columns.length === 3 ? 'lg:grid-cols-3' : columns.length === 2 && 'lg:grid-cols-2')}>
        {columns.map(({ side, icon: Icon, tone, chip, title, hint }) => {
          const total = all.filter((p) => columnOf(p) === side)
          const matched = total.filter((p) => !onlineOnly || p.online)
          const expanded = !!showAll[side]
          const list = expanded ? matched : matched.slice(0, FEATURED)
          const hidden = matched.length - list.length
          return (
            <div key={side} className="relative flex min-w-0 flex-col overflow-hidden rounded-3xl border bg-card shadow-[0_18px_40px_-30px_rgba(0,70,110,0.45)]">
              <span aria-hidden className={cn('absolute inset-x-0 top-0 h-1', tone)} />
              <div className={cn('flex items-start gap-3.5 p-5 pt-6', list.length > 0 && 'border-b')}>
                <span className={cn('grid size-11 shrink-0 place-items-center rounded-2xl', chip)}><Icon className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[17px] font-extrabold leading-snug">{title()}</h3>
                  <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{onlineShow && side === 'BUYER' ? tx('Doanh nghiệp nước ngoài tham gia Show', 'Foreign businesses taking part', '참가 해외 기업') : onlineShow && side === 'SELLER' ? tx('Doanh nghiệp Việt Nam tham gia Show', 'Vietnamese businesses taking part', '참가 베트남 기업') : hint()}</p>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-sm font-bold tabular-nums">{total.length}</span>
              </div>
              {list.length === 0 ? (
                <div className="mx-5 mb-5 grid flex-1 place-items-center gap-1.5 rounded-2xl border border-dashed bg-muted/30 px-4 py-9 text-center">
                  <Icon className="size-6 text-muted-foreground/50" />
                  <p className="text-sm font-semibold">{tx('Chưa có đơn vị nào', 'No organisations yet', '아직 없습니다')}</p>
                  <p className="text-xs text-muted-foreground">{tx('Hiển thị khi đơn vị được duyệt tham gia.', 'Shown once organisations are approved.', '참가가 승인되면 표시됩니다.')}</p>
                </div>
              ) : (
                <ul>{list.map(row)}</ul>
              )}
              {(hidden > 0 || expanded) && matched.length > FEATURED && (
                <div className="border-t p-3 text-center">
                  <Button size="sm" variant="ghost" onClick={() => setShowAll((v) => ({ ...v, [side]: !expanded }))}>
                    {expanded ? tx('Thu gọn', 'Show less', '접기') : tx(`Xem thêm ${hidden} đơn vị`, `Show ${hidden} more`, `${hidden}개 더 보기`)}
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!ended && onRegister && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-primary-soft px-6 py-5">
          <p className="text-sm font-medium text-primary">{tx('Bạn là doanh nghiệp trong nước hay nước ngoài? Đăng ký để tên và nhu cầu của bạn được công khai trong danh sách này và đặt lịch gặp đối tác.', 'Are you a domestic or a foreign business? Register to appear here and book meetings.', '국내 또는 해외 기업이신가요? 등록하고 미팅을 예약하세요.')}</p>
          <Link to={onRegister} className={buttonClass('default', 'sm')}>{tx('Đăng ký tham gia', 'Register', '등록')}</Link>
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">{tx('Tên doanh nghiệp, nhu cầu và năng lực cung ứng được công khai cho mọi người xem; thông tin liên hệ chỉ mở sau khi hai bên kết nối. '+(USE_MOCK ? 'Danh sách là dữ liệu minh hoạ.' : '')+'', 'Company names, needs and supply are public to everyone; contact details open only after both sides connect.'+(USE_MOCK ? ' The list is sample data.' : ''), '기업명, 수요, 공급 정보는 모두에게 공개되며 연락처는 연결 후에만 공개됩니다.'+(USE_MOCK ? ' 샘플 데이터입니다.' : ''))}</p>
    </section>
  )
}
