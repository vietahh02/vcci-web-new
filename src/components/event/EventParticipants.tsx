/** Participants of an event in three columns — domestic businesses, foreign businesses, sponsors — for every state: not open yet → live → ended. */
import { ArrowRightLeft, CalendarClock, Globe2, Handshake, Landmark, MapPin, Radio } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CompanyMark, CountryChip, VerifiedBadge } from '@/components/brand'
import { LiveDot } from '@/components/effects'
import { useToast } from '@/components/ui/overlay'
import { Badge, Button, buttonClass } from '@/components/ui/primitives'
import { USE_MOCK } from '@/api'
import { connectParticipant, useEventParticipants, type ConnectionType } from '@/api/eventApi'
import type { Participant, Side } from '@/data/eventParticipants'
import { businesses, type EventItem } from '@/data/mock'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { tx } from '@/lib/tx'

/** Seller → domestic business, Buyer → foreign business, Support service → sponsor. */
const COLUMNS: { side: Side; icon: typeof MapPin; tone: string; title: () => string; hint: () => string }[] = [
  { side: 'SELLER', icon: MapPin, tone: 'border-t-primary', title: () => tx('Doanh nghiệp trong nước', 'Domestic businesses', '국내 기업'), hint: () => tx('Nhà xuất khẩu Việt Nam, cung ứng sản phẩm', 'Vietnamese exporters supplying products', '제품을 공급하는 베트남 수출기업') },
  { side: 'BUYER', icon: Globe2, tone: 'border-t-gold', title: () => tx('Doanh nghiệp nước ngoài', 'Foreign businesses', '해외 기업'), hint: () => tx('Nhà nhập khẩu, phân phối, thu mua', 'Importers, distributors, sourcing offices', '수입·유통·소싱 기업') },
  { side: 'SUPPORT', icon: Landmark, tone: 'border-t-navy', title: () => tx('Nhà tài trợ', 'Sponsors', '후원사'), hint: () => tx('Đơn vị đồng hành và hỗ trợ sự kiện', 'Organisations backing and supporting the event', '행사를 후원하고 지원하는 기관') },
]

/** Featured organisations shown per column before "view all". */
const FEATURED = 3

const verifiedIds = new Set(businesses.filter((x) => x.verified).map((x) => x.id))

export function EventParticipants({ ev, onRegister }: { ev: EventItem; onRegister?: string }) {
  const { L, lang } = useI18n()
  const toast = useToast()
  const all = useEventParticipants(ev).data ?? []
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [showAll, setShowAll] = useState<Partial<Record<Side, boolean>>>({})
  const live = ev.eventStatus === 'ONGOING'
  const ended = ev.eventStatus === 'ENDED'
  const onlineNow = all.filter((p) => p.online).length
  const attended = all.filter((p) => p.attended).length

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
    if (live) return p.online ? <Badge variant="live" className="gap-1.5"><LiveDot /> {tx('Đang trực tuyến', 'Online now', '접속 중')}</Badge> : <Badge variant="muted">{tx('Chưa vào phòng', 'Not in room', '미접속')}</Badge>
    if (ended) return p.attended ? <Badge variant="success">{tx('Đã tham dự', 'Attended', '참석')}</Badge> : <Badge variant="muted">{tx('Không tham dự', 'No-show', '불참')}</Badge>
    return <Badge variant="success">{p.side === 'BUYER' ? tx('Đã đăng ký', 'Registered', '등록됨') : tx('Đã xác nhận tham gia', 'Confirmed', '참가 확정')}</Badge>
  }

  const action = (p: Participant) => {
    if (live) return p.online ? <Button size="sm" className="bg-live hover:bg-live/90" disabled={sent.has(`${p.id}:MEET_NOW`)} onClick={() => connect(p, 'MEET_NOW', tx('Đã mời gặp ngay', 'Meet-now invitation sent', '지금 미팅 요청 전송'))}><Radio /> {tx('Gặp ngay', 'Meet now', '지금 미팅')}</Button> : <Button size="sm" variant="outline" disabled={sent.has(`${p.id}:PRE_MEETING`)} onClick={() => connect(p, 'PRE_MEETING', tx('Đã gửi yêu cầu đặt lịch', 'Meeting request sent', '미팅 예약 요청 전송'))}><CalendarClock /> {tx('Đặt lịch', 'Book', '예약')}</Button>
    if (ended) return <Button size="sm" variant="outline" disabled={sent.has(`${p.id}:CONNECT`)} onClick={() => connect(p, 'CONNECT', tx('Đã gửi yêu cầu kết nối', 'Connection request sent', '연결 요청 전송'))}><Handshake /> {tx('Kết nối tiếp', 'Reconnect', '다시 연결')}</Button>
    return <Button size="sm" variant="outline" disabled={sent.has(`${p.id}:PRE_MEETING`)} onClick={() => connect(p, 'PRE_MEETING', tx('Đã gửi lời hẹn gặp trước', 'Pre-meeting request sent', '사전 미팅 요청 전송'))}><CalendarClock /> {tx('Hẹn gặp trước', 'Pre-book', '사전 예약')}</Button>
  }

  const row = (p: Participant) => (
    <li key={p.id} className="flex flex-col gap-3 border-b p-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <CompanyMark name={p.nameEn ?? p.name} accent={p.accent} className="size-11 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-bold leading-snug">
            <span className="min-w-0 break-words">{lang === 'vi' ? p.name : p.nameEn ?? p.name}</span>
            {p.businessId && verifiedIds.has(p.businessId) && <VerifiedBadge compact />}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"><CountryChip code={p.country} /> {L(p.kind)}</p>
        </div>
      </div>
      {p.industries.filter(Boolean).length > 0 && <div className="flex flex-wrap gap-1.5">{p.industries.filter(Boolean).slice(0, 3).map((i) => <Badge key={i} variant="muted">{i}</Badge>)}</div>}
      {p.side === 'SELLER' && p.offer && p.offer.length > 0 && (
        <p className="text-sm"><span className="inline-flex items-center gap-1.5 font-semibold text-primary"><ArrowRightLeft className="size-3.5" /> {tx('Cung ứng', 'Supplies', '공급')}:</span> <span className="text-muted-foreground">{p.offer.map((o) => L(o)).join(' · ')}</span></p>
      )}
      {p.side === 'BUYER' && p.need && (
        <p className="text-sm"><span className="inline-flex items-center gap-1.5 font-semibold text-gold"><ArrowRightLeft className="size-3.5" /> {tx('Nhu cầu', 'Looking for', '수요')}:</span> <span className="text-muted-foreground">{L(p.need)}</span></p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {status(p)}
        {(live || ended) && p.side === 'SELLER' && <Badge variant="secondary">{p.quotes} {tx('báo giá', 'quotes', '견적')}</Badge>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {p.businessId && <Link to={`/suppliers/${p.businessId}`} className={buttonClass('ghost', 'sm', 'text-primary')}>{tx('Hồ sơ', 'Profile', '프로필')}</Link>}
        {p.side !== 'SUPPORT' && action(p)}
      </div>
    </li>
  )

  return (
    <section className="mt-14 w-full px-4 sm:px-6 lg:px-10" aria-label="participants">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">{tx('Đơn vị nổi bật', 'Featured organisations', '주요 참가 기관')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {live ? tx(`${onlineNow} đơn vị đang trực tuyến lúc này.`, `${onlineNow} organisations are online right now.`, `현재 ${onlineNow}개 기관이 접속 중입니다.`)
              : ended ? tx(`${attended} đơn vị đã tham dự.`, `${attended} organisations attended.`, `${attended}개 기관이 참석했습니다.`)
              : tx('Một số đơn vị tiêu biểu tham gia sự kiện. Danh sách cập nhật khi đơn vị được duyệt.', 'A selection of organisations taking part. The list updates as organisations are approved.', '참가 기관 일부입니다. 승인되는 대로 업데이트됩니다.')}
          </p>
        </div>
        {live && <label className="flex w-fit items-center gap-2 text-sm font-medium"><input type="checkbox" checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} /> {tx('Chỉ hiện đơn vị đang trực tuyến', 'Show only organisations online now', '접속 중인 기관만 보기')}</label>}
      </div>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-3">
        {COLUMNS.map(({ side, icon: Icon, tone, title, hint }) => {
          const total = all.filter((p) => p.side === side)
          const matched = total.filter((p) => !onlineOnly || p.online)
          const expanded = !!showAll[side]
          const list = expanded ? matched : matched.slice(0, FEATURED)
          const hidden = matched.length - list.length
          return (
            <div key={side} className={cn('min-w-0 overflow-hidden rounded-2xl border border-t-4 bg-card', tone)}>
              <div className="flex items-start justify-between gap-3 border-b bg-muted/40 p-4">
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2 text-lg font-extrabold"><Icon className="size-5 shrink-0" /> {title()}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{hint()}</p>
                </div>
                <span className="shrink-0 rounded-full bg-background px-3 py-1 text-sm font-bold tabular-nums ring-1 ring-border">{total.length}</span>
              </div>
              {list.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">{tx('Chưa có đơn vị nào.', 'No organisations yet.', '아직 없습니다.')}</p>
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
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-primary-soft p-4">
          <p className="text-sm font-medium text-primary">{tx('Bạn là doanh nghiệp trong nước hay nước ngoài? Đăng ký để tên và nhu cầu của bạn được công khai trong danh sách này và đặt lịch gặp đối tác.', 'Are you a domestic or a foreign business? Register to appear here and book meetings.', '국내 또는 해외 기업이신가요? 등록하고 미팅을 예약하세요.')}</p>
          <Link to={onRegister} className={buttonClass('default', 'sm')}>{tx('Đăng ký tham gia', 'Register', '등록')}</Link>
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">{tx('Tên doanh nghiệp, nhu cầu và năng lực cung ứng được công khai cho mọi người xem; thông tin liên hệ chỉ mở sau khi hai bên kết nối. '+(USE_MOCK ? 'Danh sách là dữ liệu minh hoạ.' : '')+'', 'Company names, needs and supply are public to everyone; contact details open only after both sides connect.'+(USE_MOCK ? ' The list is sample data.' : ''), '기업명, 수요, 공급 정보는 모두에게 공개되며 연락처는 연결 후에만 공개됩니다.'+(USE_MOCK ? ' 샘플 데이터입니다.' : ''))}</p>
    </section>
  )
}
