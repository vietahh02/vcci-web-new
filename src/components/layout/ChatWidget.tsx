import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, Bot, Check, CheckCheck, ChevronLeft, Clock, LogIn, MessageCircle, RotateCw, Send, X } from 'lucide-react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { chatConfigured } from '@/api/chat'
import { tokens } from '@/api/http'
import { useI18n } from '@/lib/i18n'
import { useProfile } from '@/lib/profile'
import { cn } from '@/lib/utils'
import { chatText } from './chatWidgetText'
import { useBizChat } from './useBizChat'

/**
 * Floating business chat (channels PORTAL_BUSINESS_SUPPORT / PORTAL_BUSINESS_B2B) — nối dịch vụ chat thật
 * (vcci-livestream-chat: REST + Socket.IO). Doanh nghiệp phải đăng nhập (khách: yêu cầu đăng nhập, xem
 * vcci_docs/docs/dev/impl-chat-ho-tro.md). Giao diện giữ nguyên bản mock.
 */
export function ChatWidget() {
  const { t, lang } = useI18n()
  const tx = chatText(lang)
  const { session } = useProfile()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [channel, setChannel] = useState<'support' | 'b2b'>('support')
  const [text, setText] = useState('')
  const [showTop, setShowTop] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const configured = chatConfigured()
  const loggedIn = !!session && !!tokens.access()
  const chat = useBizChat(configured && loggedIn, open)
  const hasOrg = !!chat.me?.organizationId
  const ready = configured && loggedIn && hasOrg
  const { activate, support, activeId } = chat

  // kênh hỗ trợ: mở widget -> nạp hội thoại hỗ trợ (nếu đã có); kênh B2B: chọn từ danh sách
  useEffect(() => {
    if (!open || !ready) return
    if (channel === 'support' && support && activeId !== support.id) void activate(support.id)
    if (channel === 'b2b' && activeId && activeId === support?.id) void activate(null)
  }, [open, ready, channel, support, activeId, activate])

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

  function send(body: string) {
    if (!body.trim() || !ready) return
    void chat.send(body)
    setText('')
  }

  const active = chat.convs.find((c) => c.id === activeId) ?? null
  const status = active?.status === 'ARCHIVED' ? 'CLOSED' : active?.status
  const lastMineSeq = [...chat.messages].reverse().find((m) => m.mine && m.seq != null)?.seq
  const b2bList = channel === 'b2b' && !activeId
  const statusLine = !ready
    ? t.chat.online
    : chat.typing
      ? `${chat.typing} ${tx.typing}`
      : chat.socketState === 'connected'
        ? t.chat.online
        : chat.socketState === 'connecting'
          ? tx.connecting
          : tx.offline
  const dot = !ready || chat.socketState === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
  const sysText = (code?: string | null, fallback?: string) =>
    code === 'CLOSED' ? tx.sysCLOSED : code === 'REOPENED' ? tx.sysREOPENED : code === 'BLOCKED' ? tx.sysBLOCKED : fallback
  const toLogin = () => {
    setOpen(false)
    navigate(`/login?return=${encodeURIComponent(location.pathname + location.search)}`)
  }

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ type: 'spring', bounce: 0.22, duration: 0.45 }}
            style={{ transformOrigin: 'bottom right' }}
            className="flex h-[min(560px,calc(100dvh-110px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border bg-popover shadow-2xl shadow-navy/25"
          >
            <div className="relative overflow-hidden bg-navy px-4 pb-3 pt-4 text-white">
              <div className="absolute -right-10 -top-10 size-40 rounded-full bg-primary/50 blur-2xl" />
              <div className="relative flex items-center gap-3">
                {channel === 'b2b' && activeId ? (
                  <button onClick={() => void activate(null)} className="grid size-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20 hover:bg-white/20" aria-label={tx.back}>
                    <ChevronLeft className="size-5" />
                  </button>
                ) : (
                  <div className="grid size-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20"><Bot className="size-5" /></div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{channel === 'b2b' && active ? active.businessName ?? t.chat.channels.b2b : t.chat.title}</p>
                  <p className="flex items-center gap-1.5 text-xs text-white/70"><span className={cn('size-1.5 rounded-full', dot)} /> {statusLine}</p>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-md p-1.5 hover:bg-white/10" aria-label={t.ui.close}><X className="size-4" /></button>
              </div>
              <div className="relative mt-3 inline-flex rounded-lg bg-white/10 p-0.5">
                {(['support', 'b2b'] as const).map((c) => (
                  <button key={c} onClick={() => setChannel(c)} className={cn('relative rounded-md px-3 py-1 text-xs font-semibold', channel === c ? 'text-navy' : 'text-white/75')}>
                    {channel === c && <motion.span layoutId="chat-ch" className="absolute inset-0 rounded-md bg-white" />}
                    <span className="relative">{t.chat.channels[c]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-muted/40 p-4">
              {channel === 'support' && (
                <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="max-w-[85%] rounded-2xl rounded-bl-md border bg-card px-3.5 py-2.5 text-[13.5px] leading-relaxed">
                  {t.chat.greet}
                </motion.div>
              )}

              {!configured && <p className="rounded-xl border bg-card px-3 py-2 text-xs text-muted-foreground">{tx.notConfigured}</p>}

              {configured && !loggedIn && (
                <div className="space-y-2 rounded-2xl border bg-card p-3.5 text-[13px]">
                  <p className="font-semibold">{tx.loginTitle}</p>
                  <p className="text-muted-foreground">{tx.loginDesc}</p>
                  <button onClick={toLogin} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover">
                    <LogIn className="size-3.5" /> {tx.login}
                  </button>
                </div>
              )}

              {configured && loggedIn && chat.me && !hasOrg && <p className="rounded-xl border bg-card px-3 py-2 text-xs text-muted-foreground">{tx.noOrg}</p>}

              {ready && b2bList && (
                chat.b2b.length === 0 ? (
                  <p className="rounded-xl border bg-card px-3 py-2 text-xs text-muted-foreground">{tx.b2bEmpty}</p>
                ) : (
                  <div className="space-y-2">
                    {chat.b2b.map((c) => (
                      <button key={c.id} onClick={() => void activate(c.id)} className="flex w-full items-center gap-3 rounded-xl border bg-card px-3 py-2 text-left transition hover:border-primary">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{(c.businessName ?? '?').slice(0, 1)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{c.businessName ?? c.businessId}</span>
                          <span className="block truncate text-xs text-muted-foreground">{c.lastPreviewText}</span>
                        </span>
                        {!!c.unreadCount && <span className="rounded-full bg-destructive px-1.5 text-[11px] font-bold text-white">{c.unreadCount}</span>}
                      </button>
                    ))}
                  </div>
                )
              )}

              {ready && !b2bList && (
                <>
                  {chat.hasOlder && (
                    <button onClick={() => void chat.loadOlder()} className="mx-auto block text-xs font-medium text-primary hover:underline">{tx.loadOlder}</button>
                  )}
                  {chat.loading && <div className="mx-auto size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
                  {chat.messages.map((m) =>
                    m.system ? (
                      <p key={m.key} className="text-center text-[11.5px] text-muted-foreground">{sysText(m.system, m.text)}</p>
                    ) : (
                      <Fragment key={m.key}>
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          onClick={m.state === 'failed' ? () => void chat.send(m.text, m.clientId) : undefined}
                          className={cn(
                            'max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed',
                            m.mine ? 'ml-auto rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md border bg-card',
                            m.state === 'pending' && 'opacity-70',
                            m.state === 'failed' && 'cursor-pointer ring-2 ring-destructive/60',
                          )}
                        >
                          {!m.mine && m.senderKind === 'CMS_OPERATOR' && <span className="mb-0.5 block text-[11px] font-semibold text-primary">{m.senderName ?? tx.staff}</span>}
                          {m.text}
                        </motion.div>
                        {m.mine && (m.state !== 'sent' || m.seq === lastMineSeq) && (
                          <p className={cn('-mt-2 flex items-center justify-end gap-1 text-[11px]', m.state === 'failed' ? 'text-destructive' : 'text-muted-foreground')}>
                            {m.state === 'pending' && (<><Clock className="size-3" /> {tx.sending}</>)}
                            {m.state === 'failed' && (<><RotateCw className="size-3" /> {tx.failed}</>)}
                            {m.state === 'sent' && (m.seq != null && chat.otherReadSeq >= m.seq ? (<><CheckCheck className="size-3 text-primary" /> {tx.seen}</>) : (<><Check className="size-3" /> {tx.sent}</>))}
                          </p>
                        )}
                      </Fragment>
                    ),
                  )}
                  {status === 'CLOSED' && <p className="text-center text-[11.5px] text-muted-foreground">{tx.closed}</p>}
                  {status === 'BLOCKED' && <p className="text-center text-[11.5px] text-destructive">{tx.blocked}</p>}
                </>
              )}

              {chat.error && ready && <p className="text-center text-[11.5px] text-destructive">{chat.error}</p>}

              {chat.typing && (
                <div className="flex w-16 items-center justify-center gap-1 rounded-2xl rounded-bl-md border bg-card py-3">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="size-1.5 rounded-full bg-muted-foreground" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                  ))}
                </div>
              )}
              {ready && channel === 'support' && chat.messages.length === 0 && !chat.loading && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {t.chat.quick.map((q) => (
                    <button key={q} onClick={() => send(q)} className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium transition hover:border-primary hover:text-primary">
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                send(text)
              }}
              className="flex items-center gap-2 border-t p-3"
            >
              <input
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  chat.notifyTyping()
                }}
                disabled={!ready || b2bList || status === 'BLOCKED'}
                maxLength={4000}
                placeholder={configured && !loggedIn ? tx.loginToSend : t.chat.say}
                aria-label={t.chat.say}
                className="h-10 flex-1 rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!ready || b2bList || !text.trim() || status === 'BLOCKED'}
                className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary-hover active:scale-95 disabled:opacity-50"
                aria-label={t.ui.send}
              >
                <Send className="size-4" />
              </button>
            </form>
          </motion.div>
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
          aria-label={t.chat.title}
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

