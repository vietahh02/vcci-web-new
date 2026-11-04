import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, ChevronLeft, ChevronRight, Handshake, Headset, LogIn, MessageCircle, Minus, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { WidgetMsg } from './useBizChat'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { SUPPORT, chatApi, chatConfigured, type SupportStatus } from '@/api/chat'
import { tokens } from '@/api/http'
import { ChatComposer } from '@/components/chat/ChatComposer'
import { ChatAvatar, ChatMessages } from '@/components/chat/ChatMessages'
import { listTime } from '@/components/chat/chatFormat'
import { useI18n } from '@/lib/i18n'
import { useProfile } from '@/lib/profile'
import { tx } from '@/lib/tx'
import { cn } from '@/lib/utils'
import { chatText } from './chatWidgetText'
import { onOpenB2bChat, useBizChat } from './useBizChat'

/**
 * Widget chat nổi (kênh PORTAL_BUSINESS_SUPPORT / PORTAL_BUSINESS_B2B) — nối dịch vụ chat thật
 * (vcci-livestream-chat: REST + Socket.IO). Mở ra là màn chính (hỗ trợ VCCI + hội thoại gần đây), chọn một hội thoại
 * để chat; trang /messages là bản đầy đủ. Doanh nghiệp phải đăng nhập (xem vcci_docs/docs/dev/impl-chat-ho-tro.md).
 */
export function ChatWidget() {
  const { t, lang } = useI18n()
  const tx2 = chatText(lang)
  const { session } = useProfile()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  // màn chính (hub) hay đang trong một hội thoại; kênh của hội thoại đang mở
  const [inConv, setInConv] = useState(false)
  const [channel, setChannel] = useState<'support' | 'b2b'>('support')
  const [reply, setReply] = useState<WidgetMsg | null>(null)
  const [supportStatus, setSupportStatus] = useState<SupportStatus | null>(null)
  const [showTop, setShowTop] = useState(false)
  // DN cần mở chat B2B (từ openB2bChat) khi chưa sẵn sàng: chờ đăng nhập + nạp danh tính xong mới tạo hội thoại
  const pendingB2b = useRef<{ id: string; draft?: string } | null>(null)
  // câu mở đầu điền sẵn cho hội thoại vừa mở từ openBusinessChat; rời hội thoại đó thì bỏ
  const [opener, setOpener] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const configured = chatConfigured()
  const loggedIn = !!session && !!tokens.access()
  const chat = useBizChat(configured && loggedIn, open)
  const hasOrg = !!chat.me?.organizationId
  const ready = configured && loggedIn && hasOrg
  const { activate, startB2b, setError, support, activeId } = chat
  const myOrgId = chat.me?.organizationId

  const openSupport = useCallback(() => {
    setOpener('')
    setChannel('support')
    setInConv(true)
    setReply(null)
    void activate(support?.id ?? null)
  }, [activate, support])

  const openConv = (id: string, ch: 'support' | 'b2b' = 'b2b') => {
    setOpener('')
    setReply(null)
    setChannel(ch)
    setInConv(true)
    void activate(id)
  }

  const backToHub = () => {
    setOpener('')
    setInConv(false)
    void activate(null)
  }

  const openB2b = useCallback(
    (businessId: string, draft?: string) => {
      setOpen(true)
      if (businessId === myOrgId) {
        setInConv(false)
        setError(tx2.b2bSelf)
        return
      }
      setOpener(draft ?? '')
      setChannel('b2b')
      setInConv(true)
      void startB2b(businessId)
    },
    [myOrgId, setError, startB2b, tx2.b2bSelf],
  )

  useEffect(
    () =>
      onOpenB2bChat((businessId, draft) => {
        if (ready) return openB2b(businessId, draft)
        pendingB2b.current = { id: businessId, draft }
        setOpen(true)
      }),
    [ready, openB2b],
  )

  // vừa đăng nhập / nạp xong danh tính -> mở yêu cầu chat B2B còn chờ
  useEffect(() => {
    const pending = pendingB2b.current
    if (!ready || !pending) return
    pendingB2b.current = null
    openB2b(pending.id, pending.draft)
  }, [ready, openB2b])

  // vừa mở widget / đổi hội thoại: nhảy ngay xuống cuối (đợi khung render xong); tin mới: cuộn mượt
  const lastOpenKey = useRef('')
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const key = `${open}|${chat.activeId}`
    const jump = lastOpenKey.current !== key
    lastOpenKey.current = key
    const id = requestAnimationFrame(() => el.scrollTo({ top: el.scrollHeight, behavior: jump ? 'auto' : 'smooth' }))
    return () => cancelAnimationFrame(id)
  }, [chat.messages, chat.typing, open, chat.activeId])

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 900)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (open && ready) chatApi.supportStatus().then(setSupportStatus, () => undefined)
  }, [open, ready])

  // đang ở trang nhà cung cấp -> gợi ý chat thẳng với DN đó
  const supplierId = /^\/suppliers\/([^/]+)/.exec(location.pathname)?.[1]

  const active = chat.convs.find((c) => c.id === activeId) ?? null
  const isSupport = channel === 'support'
  const status = active?.status === 'ARCHIVED' ? 'CLOSED' : active?.status
  const statusLine = chat.typing
    ? `${chat.typing} ${tx2.typing}`
    : chat.socketState === 'connecting'
      ? tx2.connecting
      : chat.socketState !== 'connected' && ready
        ? tx2.offline
        : isSupport ? tx2.online : tx('Doanh nghiệp đối tác', 'Partner business', '파트너 기업')
  const dot = !ready || chat.socketState === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
  const recent = [...chat.b2b, ...chat.tickets].sort((a, b) => (Date.parse(b.lastActivityAt ?? '') || 0) - (Date.parse(a.lastActivityAt ?? '') || 0)).slice(0, 5)
  const greetName = chat.me?.displayName || session?.companyName
  const toLogin = () => {
    setOpen(false)
    navigate(`/login?return=${encodeURIComponent(location.pathname + location.search)}`)
  }
  const iconBtn = 'grid size-9 place-items-center rounded-[10px] bg-white/10 transition hover:bg-white/20'

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open && (
          <motion.section
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ type: 'spring', bounce: 0.22, duration: 0.45 }}
            style={{ transformOrigin: 'bottom right' }}
            aria-label={tx('Chat với VCCI và đối tác', 'Chat with VCCI and partners', 'VCCI 및 파트너와 채팅')}
            className="flex h-[min(600px,calc(100dvh-110px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-[20px] border bg-popover shadow-2xl shadow-navy/25"
          >
            {!inConv ? (
              <>
                {/* Màn chính */}
                <div className="flex shrink-0 flex-col gap-1.5 bg-navy px-5 pb-14 pt-5 text-white">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-navy">VCCI</span>
                    <button onClick={() => setOpen(false)} className={iconBtn} aria-label={tx('Thu nhỏ', 'Minimize', '최소화')}><Minus className="size-4" /></button>
                  </div>
                  <strong className="mt-2 text-xl">{greetName ? `${tx('Xin chào', 'Hello', '안녕하세요')}, ${greetName}` : t.chat.title}</strong>
                  <span className="text-[13px] text-white/70">{tx('Trao đổi với nhà cung cấp hoặc nhận hỗ trợ từ VCCI.', 'Talk to suppliers or get help from VCCI.', '공급업체와 대화하거나 VCCI의 지원을 받으세요.')}</span>
                </div>
                <div className="-mt-10 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 pb-4">
                  {!configured && <p className="rounded-[14px] border bg-card p-3.5 text-xs text-muted-foreground">{tx2.notConfigured}</p>}
                  {configured && !loggedIn && (
                    <div className="space-y-2 rounded-[14px] border bg-card p-3.5 text-[13px] shadow-sm">
                      <p className="font-semibold">{tx2.loginTitle}</p>
                      <p className="text-muted-foreground">{tx2.loginDesc}</p>
                      <button onClick={toLogin} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover">
                        <LogIn className="size-3.5" /> {tx2.login}
                      </button>
                    </div>
                  )}
                  {configured && loggedIn && chat.me && !hasOrg && <p className="rounded-[14px] border bg-card p-3.5 text-xs text-muted-foreground">{tx2.noOrg}</p>}
                  {ready && (
                    <>
                      <button onClick={openSupport} className="flex items-center gap-2.5 rounded-[14px] border bg-card p-3.5 text-left shadow-sm transition hover:border-primary">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-soft text-gold"><Headset className="size-5" /></span>
                        <span className="min-w-0 flex-1">
                          <strong className="block">{tx('Hỗ trợ từ VCCI', 'Support from VCCI', 'VCCI 지원')}</strong>
                          <span className="block truncate text-xs text-muted-foreground">
                            {supportStatus
                              ? `${supportStatus.onlineOperators} ${tx('cán bộ trực tuyến', 'officers online', '명 온라인')}${supportStatus.avgFirstResponseMinutes != null ? ` · ${tx('phản hồi ~', 'reply ~', '응답 ~')}${supportStatus.avgFirstResponseMinutes} ${tx('phút', 'min', '분')}` : ''}`
                              : support?.lastPreviewText ?? tx('Đặt câu hỏi cho cán bộ VCCI', 'Ask a VCCI officer', 'VCCI 담당자에게 질문')}
                          </span>
                        </span>
                        {!!support?.unreadCount && <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold leading-5 text-white">{support.unreadCount}</span>}
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </button>
                      {supplierId && supplierId !== myOrgId && (
                        <button onClick={() => openB2b(supplierId)} className="flex items-center gap-2.5 rounded-[14px] border bg-card p-3.5 text-left shadow-sm transition hover:border-primary">
                          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><Handshake className="size-5" /></span>
                          <span className="min-w-0 flex-1"><strong className="block">{tx('Chat với nhà cung cấp', 'Chat with this supplier', '공급업체와 채팅')}</strong><span className="block truncate text-xs text-muted-foreground">{tx('Nhắn tin trực tiếp với doanh nghiệp đang xem', 'Message the business you are viewing', '보고 있는 기업에 메시지 보내기')}</span></span>
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </button>
                      )}
                      <h3 className="mx-1 mt-2 text-[13px] font-semibold text-muted-foreground">{tx('Gần đây', 'Recent', '최근')}</h3>
                      {recent.length === 0 && <p className="mx-1 text-xs text-muted-foreground">{tx2.b2bEmpty}</p>}
                      {recent.map((c) => (
                        <button key={c.id} onClick={() => openConv(c.id, c.channel === SUPPORT ? 'support' : 'b2b')} className="flex items-center gap-2.5 rounded-xl px-1 py-2 text-left transition hover:bg-muted">
                          <ChatAvatar id={c.businessId} name={c.businessName} vcci={c.channel === SUPPORT} size={36} />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <strong className="flex-1 truncate text-[13px]">{c.channel === SUPPORT ? c.subject ?? tx('Hỗ trợ từ VCCI', 'Support from VCCI', 'VCCI 지원') : c.businessName ?? c.businessId}</strong>
                              <span className="shrink-0 text-[11px] text-muted-foreground">{listTime(c.lastActivityAt)}</span>
                            </span>
                            <span className={cn('block truncate text-xs', c.unreadCount ? 'font-semibold' : 'text-muted-foreground')}>{c.lastPreviewText ?? ''}</span>
                          </span>
                          {!!c.unreadCount && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label={tx('Chưa đọc', 'Unread', '읽지 않음')} />}
                        </button>
                      ))}
                      {chat.error && <p className="text-center text-[11.5px] text-destructive">{chat.error}</p>}
                    </>
                  )}
                </div>
                <Link to="/messages" onClick={() => setOpen(false)} className="shrink-0 border-t p-3.5 text-center text-[13px] font-semibold text-primary hover:bg-muted">
                  {tx('Mở trang Tin nhắn đầy đủ', 'Open the full Messages page', '전체 메시지 페이지 열기')}
                </Link>
              </>
            ) : (
              <>
                {/* Trong một hội thoại */}
                <div className="flex shrink-0 items-center gap-3 bg-navy px-4 py-3.5 text-white">
                  <button onClick={backToHub} className={iconBtn} aria-label={tx2.back}><ChevronLeft className="size-5" /></button>
                  <ChatAvatar id={active?.businessId} name={active?.businessName} vcci={isSupport} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{isSupport ? tx('Hỗ trợ từ VCCI', 'Support from VCCI', 'VCCI 지원') : active?.businessName ?? t.chat.channels.b2b}</p>
                    <p className="flex items-center gap-1.5 truncate text-xs text-white/70"><span className={cn('size-1.5 shrink-0 rounded-full', dot)} /> {statusLine}</p>
                  </div>
                  <button onClick={() => setOpen(false)} className={iconBtn} aria-label={t.ui.close}><X className="size-4" /></button>
                </div>

                <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-muted/40 p-4">
                  {isSupport && (
                    <div className="max-w-[85%] rounded-[16px_16px_16px_4px] border bg-card px-3.5 py-2.5 text-[13.5px] leading-relaxed">{t.chat.greet}</div>
                  )}
                  <ChatMessages chat={chat} partner={isSupport ? null : active ? { id: active.businessId, name: active.businessName } : null} compact onReply={setReply} />
                  {status === 'CLOSED' && <p className="text-center text-[11.5px] text-muted-foreground">{tx2.closed}</p>}
                  {status === 'BLOCKED' && <p className="text-center text-[11.5px] text-destructive">{tx2.blocked}</p>}
                  {chat.error && <p className="text-center text-[11.5px] text-destructive">{chat.error}</p>}
                  {isSupport && chat.messages.length === 0 && !chat.loading && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {t.chat.quick.map((q) => (
                        <button key={q} onClick={() => void chat.send(q)} className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium transition hover:border-primary hover:text-primary">{q}</button>
                      ))}
                    </div>
                  )}
                </div>

                <ChatComposer
                  key={activeId ?? 'new'}
                  chat={chat}
                  compact
                  initialDraft={opener}
                  disabled={!ready || (!isSupport && !activeId) || status === 'BLOCKED'}
                  reply={reply}
                  onClearReply={() => setReply(null)}
                  placeholder={t.chat.say}
                />
              </>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        <AnimatePresence>
          {showTop && !open && (
            <motion.button
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="grid size-11 place-items-center rounded-full border bg-background shadow-lg transition hover:-translate-y-0.5"
              aria-label={t.ui.backToTop}
            >
              <ArrowUp className="size-4" />
            </motion.button>
          )}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setOpen((v) => !v)}
          className="relative grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/40"
          aria-label={chat.unread > 0 ? `${t.chat.title}, ${chat.unread} ${tx('tin chưa đọc', 'unread', '읽지 않음')}` : t.chat.title}
          aria-expanded={open}
        >
          {!open && <span className="absolute inset-0 animate-ping rounded-full bg-primary/40 [animation-duration:2.4s]" />}
          {!open && chat.unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 z-10 grid min-w-5 place-items-center rounded-full bg-destructive px-1 text-[11px] font-bold leading-5 text-white ring-2 ring-background">
              {chat.unread > 99 ? '99+' : chat.unread}
            </span>
          )}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={String(open)} initial={{ rotate: -90, scale: 0.5 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: 90, scale: 0.5 }} transition={{ duration: 0.2 }}>
              {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  )
}
