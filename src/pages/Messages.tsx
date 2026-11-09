import { BellOff, ChevronLeft, Clock, MoreVertical, Pin, PhoneIncoming, Plus, Search, X, CalendarClock, LogIn, MessagesSquare } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { liveApi } from '@/api'
import { chatApi, chatConfigured, type AppointmentView, type AttachmentView, type ChatConversationDetail, type SearchHit, type SupportStatus } from '@/api/chat'
import { tokens } from '@/api/http'
import { ChatComposer } from '@/components/chat/ChatComposer'
import { AppointmentDialog, ConfirmDialog, ReportDialog } from '@/components/chat/ChatDialogs'
import { ChatAvatar, ChatMessages } from '@/components/chat/ChatMessages'
import { listTime } from '@/components/chat/chatFormat'
import { NewTicketForm, PartnerPanel, StatusPill, SupportPanel, VerifiedChip } from '@/components/chat/MessagesPanels'
import { chatText } from '@/components/layout/chatWidgetText'
import { useBizChat, type WidgetMsg } from '@/components/layout/useBizChat'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/overlay'
import { useI18n } from '@/lib/i18n'
import { useProfile } from '@/lib/profile'
import { dateTime, tx } from '@/lib/tx'
import { cn } from '@/lib/utils'

type Tab = 'b2b' | 'support'
type Filter = 'all' | 'unread' | 'pinned'

const B2B_QUICK = (): [string, string][] => [
  [tx('Gửi hồ sơ năng lực', 'Send company profile', '회사 소개서 보내기'), tx('Em gửi anh/chị hồ sơ năng lực của công ty để tham khảo ạ.', 'Please find our company profile for your reference.', '참고용으로 회사 소개서를 보내드립니다.')],
  [tx('Yêu cầu báo giá', 'Request a quote', '견적 요청'), tx('Anh/chị vui lòng gửi báo giá chi tiết (đơn giá, MOQ, thời gian giao hàng) giúp em ạ.', 'Could you send a detailed quote (unit price, MOQ, lead time)?', '단가, MOQ, 납기를 포함한 상세 견적을 보내주시겠어요?')],
  [tx('Cảm ơn', 'Thanks', '감사합니다'), tx('Cảm ơn anh/chị, em đã nhận được thông tin.', 'Thank you, I have received the information.', '감사합니다. 정보를 잘 받았습니다.')],
]

/** Trang Tin nhắn đầy đủ: chat B2B với DN khác + hỗ trợ từ VCCI (cùng dịch vụ chat với widget). */
export default function Messages() {
  const { t, lang } = useI18n()
  const w = chatText(lang)
  const toast = useToast()
  const { session } = useProfile()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const configured = chatConfigured()
  const loggedIn = !!session && !!tokens.access()
  const chat = useBizChat(configured && loggedIn, true)
  const myOrgId = chat.me?.organizationId
  const ready = configured && loggedIn && !!myOrgId
  const { activate, startB2b, support, activeId, refreshConversation, setError } = chat

  const [tab, setTab] = useState<Tab>(params.get('tab') === 'support' ? 'support' : 'b2b')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [ticketFilter, setTicketFilter] = useState<'OPEN' | 'CLOSED'>('OPEN')
  const [detail, setDetail] = useState<ChatConversationDetail | null>(null)
  const [files, setFiles] = useState<AttachmentView[]>([])
  const [appts, setAppts] = useState<AppointmentView[]>([])
  const [status0, setSupportStatus] = useState<SupportStatus | null>(null)
  const [composeSupport, setComposeSupport] = useState(false)
  const [reply, setReply] = useState<WidgetMsg | null>(null)
  const [followed, setFollowed] = useState(false)
  const [dlg, setDlg] = useState<'report' | 'block' | 'appt' | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const boxRef = useRef<HTMLDivElement>(null)

  const b2bParam = params.get('b2b')
  useEffect(() => {
    if (!ready || !b2bParam) return
    navigate('/messages', { replace: true })
    if (b2bParam !== myOrgId) void startB2b(b2bParam)
  }, [ready, b2bParam, myOrgId, startB2b, navigate])

  useEffect(() => {
    if (ready) chatApi.supportStatus().then(setSupportStatus, () => undefined)
  }, [ready])

  // chi tiết hội thoại, tệp, lịch hẹn của hội thoại đang mở
  const msgCount = chat.messages.length
  useEffect(() => {
    if (!activeId) return
    let alive = true
    chatApi.detail(activeId).then((d) => alive && setDetail(d), () => alive && setDetail(null))
    return () => {
      alive = false
    }
  }, [activeId])
  useEffect(() => {
    if (!activeId || tab !== 'b2b') return
    let alive = true
    chatApi.attachments(activeId).then((r) => alive && setFiles(r), () => undefined)
    chatApi.appointments(activeId).then((r) => alive && setAppts(r), () => undefined)
    return () => {
      alive = false
    }
  }, [activeId, tab, msgCount])
  const partnerId = detail?.conversation.id === activeId && tab === 'b2b' ? detail?.conversation.businessId : null
  useEffect(() => {
    if (partnerId) liveApi.isFollowingBusiness(partnerId).then(setFollowed, () => setFollowed(false))
  }, [partnerId])

  // tab hỗ trợ: tự mở phiếu đang mở gần nhất
  useEffect(() => {
    if (ready && tab === 'support' && support && !activeId && !composeSupport) void activate(support.id)
  }, [ready, tab, support, activeId, composeSupport, activate])

  useLayoutEffect(() => {
    const el = boxRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chat.messages, chat.typing, activeId])

  useEffect(() => {
    if (!searching || !activeId || searchQ.trim().length < 2) return
    const h = setTimeout(() => chatApi.search(activeId, searchQ.trim()).then(setHits, () => setHits([])), 300)
    return () => clearTimeout(h)
  }, [searching, activeId, searchQ])

  const pickTab = (next: Tab) => {
    setTab(next)
    setComposeSupport(false)
    setReply(null)
    setSearching(false)
    void activate(next === 'support' ? support?.id ?? null : null)
  }
  const open = (id: string) => {
    setReply(null)
    setComposeSupport(false)
    setSearching(false)
    void activate(id)
  }
  const back = () => {
    setComposeSupport(false)
    void activate(null)
  }

  const active = chat.convs.find((c) => c.id === activeId) ?? null
  const activeDetail = detail && detail.conversation.id === activeId ? detail : null
  const isSupport = tab === 'support'
  const status = active?.status === 'ARCHIVED' ? 'CLOSED' : active?.status
  const q = query.trim().toLowerCase()
  const list = isSupport
    ? chat.tickets.filter((c) => (ticketFilter === 'CLOSED') === (c.status === 'CLOSED' || c.status === 'ARCHIVED'))
    : chat.b2b.filter((c) => filter === 'all' || (filter === 'unread' ? (c.unreadCount ?? 0) > 0 : !!c.pinned))
  const rows = list.filter((c) => !q || `${c.businessName ?? ''} ${c.businessId} ${c.ticketCode ?? ''} ${c.subject ?? ''}`.toLowerCase().includes(q))
  const unreadIn = (l: typeof chat.convs) => l.reduce((s, c) => s + (c.unreadCount ?? 0), 0)
  const canCompose = ready && status !== 'BLOCKED' && !!activeId && !(active?.blockedByBusinessId)
  const showThread = !!activeId || (isSupport && (composeSupport || chat.tickets.length === 0))
  const mobileThread = !!activeId || (isSupport && composeSupport)

  const act = async (fn: () => Promise<unknown>) => {
    try {
      await fn()
      if (activeId) await refreshConversation(activeId)
      return true
    } catch (e) {
      setError(String((e as Error).message ?? e))
      return false
    }
  }
  const onPinMessage = (m: WidgetMsg) => m.serverId != null && activeId && void act(() => chatApi.pinMessage(activeId, active?.pinnedMessageId === m.serverId ? null : m.serverId!))
  const sendRich = (kind: 'APPOINTMENT') => (p: Record<string, unknown>) => chat.sendRich(kind, p)
  const jumpTo = (hit: SearchHit) => {
    setSearching(false)
    setSearchQ('')
    const el = boxRef.current
    const target = chat.messages.find((m) => m.serverId === hit.messageId)
    if (target && el) {
      const node = el.querySelector(`[data-mid="${hit.messageId}"]`)
      node?.scrollIntoView({ block: 'center' })
    }
  }

  if (!configured || !loggedIn) {
    return (
      <section className="container-page grid min-h-[60vh] place-items-center py-16">
        <div className="max-w-md space-y-3 rounded-2xl border bg-card p-6 text-center">
          <MessagesSquare className="mx-auto size-10 text-primary" />
          <h1 className="text-xl font-bold">{tx('Tin nhắn', 'Messages', '메시지')}</h1>
          <p className="text-sm text-muted-foreground">{configured ? w.loginDesc : w.notConfigured}</p>
          {configured && (
            <button onClick={() => navigate(`/login?return=${encodeURIComponent(location.pathname + location.search)}`)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
              <LogIn className="size-4" /> {w.login}
            </button>
          )}
        </div>
      </section>
    )
  }

  const partner = isSupport ? null : active ? { id: active.businessId, name: active.businessName } : null
  const biz = activeDetail?.business
  const iconBtn = 'grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground'
  const filterBtn = (on: boolean) => cn('h-[30px] rounded-full border px-3 text-[13px]', on ? 'border-primary bg-primary-soft font-semibold text-primary' : 'font-medium text-foreground/80')

  return (
    <section className="flex h-[calc(100dvh-9.5rem)] min-h-[620px] border-t bg-muted/40">
      {/* Cột 1: danh sách hội thoại */}
      <aside className={cn('w-full shrink-0 flex-col border-r bg-card md:flex md:w-[320px]', mobileThread ? 'hidden' : 'flex')} aria-label={tx('Danh sách hội thoại', 'Conversations', '대화 목록')}>
        <div className="space-y-3.5 p-5 pb-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">{tx('Tin nhắn', 'Messages', '메시지')}</h1>
            {!isSupport && (
              <Link to="/suppliers" className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-primary px-3 text-[13px] font-semibold text-primary-foreground hover:bg-primary-hover">
                <Plus className="size-4" /> {tx('Mới', 'New', '새 대화')}
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1" role="tablist">
            {(['b2b', 'support'] as const).map((k) => {
              const n = unreadIn(k === 'support' ? chat.tickets : chat.b2b)
              return (
                <button key={k} role="tab" aria-selected={tab === k} onClick={() => pickTab(k)} className={cn('flex items-center justify-center gap-1.5 rounded-[9px] p-2 text-sm', tab === k ? 'bg-card font-semibold shadow-sm' : 'font-medium text-muted-foreground')}>
                  {k === 'b2b' ? tx('Doanh nghiệp', 'Businesses', '기업') : tx('Hỗ trợ VCCI', 'VCCI support', 'VCCI 지원')}
                  {n > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold leading-5 text-primary-foreground">{n}</span>}
                </button>
              )
            })}
          </div>
          <label className="flex h-10 items-center gap-2 rounded-[10px] border bg-muted/50 px-3 text-muted-foreground">
            <Search className="size-4" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={isSupport ? tx('Tìm mã phiếu, tiêu đề…', 'Search ticket code, subject…', '티켓 코드, 제목 검색…') : tx('Tìm doanh nghiệp…', 'Search businesses…', '기업 검색…')} aria-label={tx('Tìm hội thoại', 'Search conversations', '대화 검색')} className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none" />
          </label>
          {isSupport ? (
            <>
              <div className="flex gap-1.5" role="group" aria-label={tx('Lọc yêu cầu', 'Filter requests', '요청 필터')}>
                {(['OPEN', 'CLOSED'] as const).map((k) => (
                  <button key={k} aria-pressed={ticketFilter === k} onClick={() => setTicketFilter(k)} className={filterBtn(ticketFilter === k)}>{k === 'OPEN' ? tx('Đang mở', 'Open', '진행 중') : tx('Đã đóng', 'Closed', '종료')}</button>
                ))}
              </div>
              <button disabled={!ready} onClick={() => { setComposeSupport(true); void activate(null) }} className="flex h-11 w-full disabled:opacity-50 items-center justify-center gap-2 rounded-xl bg-navy font-semibold text-white">
                <Plus className="size-4" /> {tx('Gửi yêu cầu hỗ trợ mới', 'New support request', '새 지원 요청')}
              </button>
            </>
          ) : (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={tx('Lọc hội thoại', 'Filter', '필터')}>
              {(['all', 'unread', 'pinned'] as const).map((k) => (
                <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)} className={filterBtn(filter === k)}>
                  {k === 'all' ? tx('Tất cả', 'All', '전체') : k === 'unread' ? `${tx('Chưa đọc', 'Unread', '읽지 않음')} (${chat.b2b.filter((c) => (c.unreadCount ?? 0) > 0).length})` : tx('Đã ghim', 'Pinned', '고정됨')}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
          {rows.map((c) => {
            const unread = c.unreadCount ?? 0
            const st = c.status === 'ARCHIVED' ? 'CLOSED' : c.status
            return (
              <button key={c.id} onClick={() => open(c.id)} className={cn('flex w-full items-center gap-3 rounded-xl p-3 text-left transition', c.id === activeId ? 'bg-primary-soft' : 'hover:bg-muted')}>
                <span className="relative">
                  <ChatAvatar id={c.businessId} name={c.businessName} vcci={isSupport} />
                  {!isSupport && c.online && <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card bg-success" aria-label={tx('Đang trực tuyến', 'Online', '온라인')} />}
                </span>
                <span className="min-w-0 flex-1 space-y-0.5">
                  <span className="flex items-center gap-1.5">
                    <span className="flex-1 truncate font-semibold">{isSupport ? c.subject ?? tx('Hỗ trợ từ VCCI', 'VCCI support', 'VCCI 지원') : c.businessName ?? c.businessId}</span>
                    {c.pinned && <Pin className="size-3 shrink-0 text-muted-foreground" aria-label={tx('Đã ghim', 'Pinned', '고정됨')} />}
                    {c.muted && <BellOff className="size-3 shrink-0 text-muted-foreground" aria-label={tx('Đã tắt thông báo', 'Muted', '알림 꺼짐')} />}
                    <span className="shrink-0 text-xs text-muted-foreground">{listTime(c.lastActivityAt)}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className={cn('flex-1 truncate text-[13px]', unread > 0 ? 'font-semibold' : 'text-muted-foreground')}>{isSupport && c.ticketCode ? `${c.ticketCode} · ` : ''}{c.lastPreviewText ?? ''}</span>
                    {isSupport && <StatusPill status={st} />}
                    {unread > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold leading-5 text-primary-foreground">{unread}</span>}
                  </span>
                  {isSupport && (c.categoryLabel || c.department) && <span className="block truncate text-xs text-muted-foreground">{[c.categoryLabel, c.department].filter(Boolean).join(' · ')}</span>}
                </span>
              </button>
            )
          })}
          {ready && rows.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">{q || filter !== 'all' || isSupport ? tx('Không tìm thấy hội thoại phù hợp.', 'No matching conversations.', '해당하는 대화가 없습니다.') : w.b2bEmpty}</p>
          )}
          {chat.me && !chat.me.organizationId && <p className="px-4 py-6 text-center text-sm text-muted-foreground">{w.noOrg}</p>}
        </div>
      </aside>

      {/* Cột 2: khung chat */}
      <main className={cn('min-w-0 flex-1 flex-col', mobileThread ? 'flex' : 'hidden md:flex')}>
        {showThread && !activeId && isSupport ? (
          <div className="flex flex-1 flex-col justify-center overflow-y-auto p-6">
            <button onClick={back} className="mb-3 inline-flex w-fit items-center gap-1 text-sm text-primary md:hidden"><ChevronLeft className="size-4" /> {w.back}</button>
            {!ready ? <p className="text-center text-sm text-muted-foreground">{chat.me ? w.noOrg : ''}</p> : <NewTicketForm status={status0} onCreate={async (r) => { if (await chat.newTicket(r)) { setComposeSupport(false); setTicketFilter('OPEN') } }} />}
          </div>
        ) : showThread ? (
          <>
            <div className="flex h-[72px] shrink-0 items-center gap-3 border-b bg-card px-5">
              <button onClick={back} className="grid size-9 place-items-center rounded-full hover:bg-primary-soft hover:text-primary md:hidden" aria-label={w.back}><ChevronLeft className="size-5" /></button>
              <ChatAvatar id={partner?.id} name={partner?.name} vcci={isSupport} />
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <h2 className="truncate text-base font-bold">{isSupport ? active?.subject ?? tx('Hỗ trợ doanh nghiệp', 'Business support', '기업 지원') : active?.businessName ?? ''}</h2>
                  {isSupport && active?.ticketCode && <span className="shrink-0 rounded bg-muted px-1.5 text-xs font-semibold">{active.ticketCode}</span>}
                  {!isSupport && biz?.vcciVerified && <VerifiedChip />}
                </div>
                <p className="truncate text-[13px] text-muted-foreground">
                  {chat.typing
                    ? `${chat.typing} ${w.typing}`
                    : isSupport
                      ? active?.assigneeName ? `${tx('Phụ trách', 'Assignee', '담당')}: ${active.assigneeName}` : tx('Đang chờ cán bộ VCCI tiếp nhận', 'Waiting for a VCCI officer', 'VCCI 담당자 대기 중')
                      : active?.online ? tx('Đang trực tuyến', 'Online', '온라인') : biz?.province ?? tx('Doanh nghiệp đối tác', 'Partner business', '파트너 기업')}
                </p>
              </div>
              {isSupport && active && status === 'OPEN' && (
                <>
                  <button disabled={!!active.callbackRequestedAt} onClick={() => void act(() => chatApi.callback(active.id).then(() => toast({ kind: 'success', title: tx('Đã gửi yêu cầu gọi lại', 'Callback requested', '콜백 요청됨') })))} className="hidden h-9 items-center gap-1.5 rounded-[10px] border px-3 text-[13px] font-semibold hover:bg-muted disabled:opacity-60 sm:inline-flex">
                    <PhoneIncoming className="size-4" /> {active.callbackRequestedAt ? tx('Đã yêu cầu gọi lại', 'Callback requested', '콜백 요청됨') : tx('Yêu cầu gọi lại', 'Request callback', '콜백 요청')}
                  </button>
                  <button onClick={() => void act(() => chatApi.closeTicket(active.id))} className="h-9 rounded-[10px] border px-3 text-[13px] font-semibold hover:bg-muted">{tx('Đóng yêu cầu', 'Close request', '요청 종료')}</button>
                </>
              )}
              {!isSupport && active && (
                <>
                  <button onClick={() => setSearching((v) => !v)} className={iconBtn} aria-label={tx('Tìm trong hội thoại', 'Search in conversation', '대화 내 검색')} aria-pressed={searching}><Search className="size-4" /></button>
                  <button onClick={() => setDlg('appt')} className={iconBtn} aria-label={tx('Đặt lịch hẹn', 'Schedule an appointment', '약속 잡기')}><CalendarClock className="size-4" /></button>
                  <DropdownMenu>
                    <DropdownMenuTrigger className={iconBtn} aria-label={tx('Thêm', 'More', '더보기')}><MoreVertical className="size-4" /></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => void act(() => chatApi.pin(active.id, !active.pinned))}><Pin /> {active.pinned ? tx('Bỏ ghim hội thoại', 'Unpin conversation', '고정 해제') : tx('Ghim hội thoại', 'Pin conversation', '대화 고정')}</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => void act(() => chatApi.mute(active.id, !active.muted))}><BellOff /> {active.muted ? tx('Bật thông báo', 'Unmute', '알림 켜기') : tx('Tắt thông báo', 'Mute', '알림 끄기')}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Link to={`/suppliers/${active.businessId}`} className="hidden h-10 items-center rounded-[10px] border border-primary/30 bg-card px-3.5 text-[13px] font-semibold text-primary lg:inline-flex">{tx('Xem hồ sơ', 'View profile', '프로필 보기')}</Link>
                </>
              )}
            </div>

            {isSupport && active && status === 'OPEN' && (
              <p className="flex items-center gap-2 border-b bg-gold-soft px-5 py-2 text-xs text-gold">
                <Clock className="size-3.5" />
                {status0 ? tx(`VCCI phản hồi trong vòng ${status0.slaHours} giờ.`, `VCCI replies within ${status0.slaHours} hours.`, `VCCI는 ${status0.slaHours}시간 이내에 답변합니다.`) : ''}
                {active.dueAt && ` ${tx('Hạn xử lý', 'Due', '처리 기한')}: ${dateTime(active.dueAt)}`}
              </p>
            )}
            {searching && (
              <div className="border-b bg-card px-5 py-2">
                <div className="flex items-center gap-2">
                  <input autoFocus value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder={tx('Tìm tin nhắn…', 'Search messages…', '메시지 검색…')} aria-label={tx('Tìm trong hội thoại', 'Search in conversation', '대화 내 검색')} className="h-9 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary" />
                  <button onClick={() => { setSearching(false); setSearchQ('') }} className={iconBtn} aria-label={t.ui.close}><X className="size-4" /></button>
                </div>
                {searchQ.trim().length >= 2 && hits.length > 0 && (
                  <ul className="mt-2 max-h-40 overflow-y-auto">
                    {hits.map((h) => (
                      <li key={h.messageId}><button onClick={() => jumpTo(h)} className="w-full truncate rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"><strong>{h.senderName}</strong> · {h.body}</button></li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {active?.pinnedMessagePreview && (
              <p className="flex items-center gap-2 border-b bg-primary-soft px-5 py-2 text-xs">
                <Pin className="size-3.5 shrink-0 text-primary" /> <span className="min-w-0 flex-1 truncate">{active.pinnedMessagePreview}</span>
                <button onClick={() => void act(() => chatApi.pinMessage(active.id, null))} aria-label={tx('Bỏ ghim tin', 'Unpin message', '메시지 고정 해제')}><X className="size-3.5" /></button>
              </p>
            )}

            <div ref={boxRef} className="flex-1 space-y-2.5 overflow-y-auto px-6 py-5" aria-live="polite">
              {isSupport && !activeId && <p className="mx-auto max-w-md rounded-2xl border bg-card px-4 py-3 text-center text-sm text-muted-foreground">{t.chat.greet}</p>}
              <ChatMessages chat={chat} partner={partner} onReply={setReply} onPin={isSupport ? undefined : onPinMessage} />
              {status === 'CLOSED' && <p className="text-center text-xs text-muted-foreground">{w.closed}</p>}
              {(status === 'BLOCKED' || active?.blockedByBusinessId) && <p className="text-center text-xs text-destructive">{w.blocked}</p>}
              {chat.error && <p className="text-center text-xs text-destructive">{chat.error}</p>}
            </div>

            <ChatComposer
              key={activeId ?? 'new'}
              chat={chat}
              disabled={!canCompose}
              reply={reply}
              onClearReply={() => setReply(null)}
              full={!isSupport}
              chips={isSupport ? undefined : B2B_QUICK()}
              accent={isSupport ? 'bg-navy' : undefined}
              placeholder={isSupport ? tx('Nhập câu hỏi cho cán bộ VCCI…', 'Ask a VCCI officer…', 'VCCI 담당자에게 질문…') : tx('Nhập tin nhắn… (Enter để gửi, Shift+Enter xuống dòng)', 'Type a message… (Enter to send, Shift+Enter for a new line)', '메시지 입력… (Enter 전송, Shift+Enter 줄바꿈)')}
            />
          </>
        ) : (
          <div className="grid flex-1 place-items-center p-6 text-center text-muted-foreground">
            <div className="space-y-2">
              <MessagesSquare className="mx-auto size-12 text-primary/60" />
              <p>{tx('Chọn một cuộc trò chuyện để bắt đầu.', 'Select a conversation to start.', '대화를 선택하세요.')}</p>
            </div>
          </div>
        )}
      </main>

      {/* Cột 3: hồ sơ đối tác / thông tin yêu cầu hỗ trợ */}
      {showThread && (
        <aside className="hidden w-[300px] shrink-0 overflow-y-auto border-l bg-card xl:block" aria-label={isSupport ? tx('Thông tin yêu cầu', 'Request details', '요청 정보') : tx('Thông tin đối tác', 'Partner details', '파트너 정보')}>
          {isSupport ? (
            <SupportPanel conv={active} onRate={async (s, c) => { if (active) await act(() => chatApi.rate(active.id, s, c)) }} />
          ) : (
            active && (
              <PartnerPanel
                conv={active}
                biz={biz}
                files={files}
                appts={appts}
                myOrgId={myOrgId}
                followed={followed}
                onFollow={() => liveApi.followBusiness(active.businessId, !followed).then(() => setFollowed(!followed), (e: Error) => toast({ kind: 'info', title: e.message }))}
                onMute={() => void act(() => chatApi.mute(active.id, !active.muted))}
                onReport={() => setDlg('report')}
                onBlock={() => (active.blockedByBusinessId ? void act(() => chatApi.block(active.id, false)) : setDlg('block'))}
              />
            )
          )}
        </aside>
      )}

      {active && (
        <>
          <ReportDialog open={dlg === 'report'} onOpenChange={(v) => !v && setDlg(null)} onSend={(reason) => act(() => chatApi.report(active.id, reason).then((r) => toast({ kind: 'success', title: tx('Đã gửi báo cáo', 'Report sent', '신고됨'), description: r.ticketCode })))} />
          <ConfirmDialog
            open={dlg === 'block'}
            onOpenChange={(v) => !v && setDlg(null)}
            title={tx('Chặn đối tác này?', 'Block this partner?', '이 파트너를 차단할까요?')}
            description={tx('Hai bên sẽ không nhắn tin được cho nhau. Chỉ doanh nghiệp đã chặn mới bỏ chặn được.', 'Neither side can send messages. Only the blocking business can unblock.', '양쪽 모두 메시지를 보낼 수 없습니다. 차단한 기업만 해제할 수 있습니다.')}
            confirm={tx('Chặn', 'Block', '차단')}
            onConfirm={() => void act(() => chatApi.block(active.id, true))}
          />
          <AppointmentDialog open={dlg === 'appt'} onOpenChange={(v) => !v && setDlg(null)} onSend={sendRich('APPOINTMENT')} />
        </>
      )}
    </section>
  )
}
