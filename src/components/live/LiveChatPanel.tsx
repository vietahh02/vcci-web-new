/**
 * Khung chat bên phải phòng xem. Lịch sử qua REST, tin mới và kiểm duyệt qua STOMP.
 * Gửi tin bằng REST `/send` thay vì STOMP publish: lỗi (bị cấm, gửi quá nhanh, phiên đã kết thúc) trả về ngay và token hết hạn tự làm mới.
 */
import { AnimatePresence, motion } from 'motion/react'
import { ArrowDown, Heart, LogIn, Send } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CHAT_URL, newClientId } from '@/api/chat'
import { ApiError, tokens } from '@/api/http'
import { liveChatHistory, liveViewerCount, sendLiveChat, type LiveChatMessage, type LiveStatus } from '@/api/liveApi'
import { mainSponsor, SponsorMark } from '@/components/sponsor'
import { buttonClass } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { useProfile } from '@/lib/profile'
import { cn } from '@/lib/utils'
import { liveText } from './liveText'
import { useLivestreamStomp } from './useLivestreamStomp'

const MAX_KEPT = 500
const MAX_LENGTH = 2000
const VIEWER_POLL_MS = 30_000
/** Server phát số người xem ngay lúc SUBSCRIBE, có thể trước khi chính người đó vào danh sách nhận, nên hỏi lại sau một nhịp. */
const VIEWER_SETTLE_MS = 800

const merge = (list: LiveChatMessage[], incoming: LiveChatMessage[]) => {
  const byId = new Map(list.map((m) => [m.id, m]))
  for (const m of incoming) byId.set(m.id, { ...byId.get(m.id), ...m })
  return [...byId.values()].sort((a, b) => a.timestampMs - b.timestampMs).slice(-MAX_KEPT)
}

function ChatShell({ count, children, footer }: { count?: number; children: ReactNode; footer?: ReactNode }) {
  const { t } = useI18n()
  return (
    <aside className="flex h-[620px] flex-col overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/10 lg:sticky lg:top-32">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <p className="text-sm font-bold">{t.live.chat}</p>
        {count !== undefined && <span className="text-xs text-white/50">{count}</span>}
      </div>
      {children}
      {(mainSponsor || footer) && <div className="border-t border-white/10 p-3">
        {mainSponsor && (
          <div className={cn('flex items-center gap-2 rounded-lg px-2 py-1.5', footer && 'mb-2')} style={{ background: `linear-gradient(90deg, ${mainSponsor.color}, transparent)` }}>
            <SponsorMark mark={mainSponsor.mark} color="#ffffff22" className="size-6 rounded-md text-[9px]" />
            <span className="text-[11px] font-semibold">{t.home.sponsorMain}: {mainSponsor.name}</span>
          </div>
        )}
        {footer}
      </div>}
    </aside>
  )
}

/** Khung chat khi không có chat phiên để nối (hội thảo, chưa có phiên, chưa cấu hình). */
export function ChatNotice({ text }: { text: string }) {
  return (
    <ChatShell>
      <div className="grid flex-1 place-items-center p-6 text-center text-sm text-white/60"><p>{text}</p></div>
    </ChatShell>
  )
}

export function LiveChatPanel({ sessionId, status, onViewers, onReact }: { sessionId: string; status: LiveStatus | null; onViewers: (count: number) => void; onReact: () => void }) {
  const { t, locale } = useI18n()
  const lt = liveText()
  const { session } = useProfile()
  const location = useLocation()
  const loggedIn = !!session && !!tokens.access()
  const [msgs, setMsgs] = useState<LiveChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [banned, setBanned] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [scrolledUp, setScrolledUp] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const scrolledRef = useRef(false)
  const refreshViewers = useCallback(() => {
    void liveViewerCount(sessionId).then((n) => { if (n !== null) onViewers(n) })
  }, [sessionId, onViewers])

  const loadHistory = useCallback(() => {
    liveChatHistory(sessionId).then(
      (rows) => {
        // Danh sách server là chuẩn (đã bỏ tin bị xoá); chỉ giữ thêm tin vừa nhận mới hơn tin cuối của nó
        const last = rows[rows.length - 1]?.timestampMs ?? 0
        setMsgs((cur) => {
          const own = new Set(cur.filter((m) => m.mine).map((m) => m.id))
          return merge(rows.map((m) => (own.has(m.id) ? { ...m, mine: true } : m)), cur.filter((m) => m.timestampMs > last))
        })
        setLoadFailed(false)
        setLoading(false)
      },
      () => {
        setLoadFailed(true)
        setLoading(false)
      },
    )
  }, [sessionId])

  const stomp = useLivestreamStomp(sessionId, loggedIn, {
    onMessage: (m) => setMsgs((cur) => merge(cur, [m])),
    onDeleted: (id) => setMsgs((cur) => cur.filter((m) => m.id !== id)),
    onViewers,
    onBanned: () => setBanned(true),
    onConnected: () => {
      loadHistory()
      setTimeout(refreshViewers, VIEWER_SETTLE_MS)
    },
  })

  useEffect(() => {
    loadHistory()
    const id = setInterval(refreshViewers, VIEWER_POLL_MS)
    return () => clearInterval(id)
  }, [loadHistory, refreshViewers])

  useEffect(() => {
    if (!scrolledRef.current) listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs])

  const onScroll = () => {
    const el = listRef.current
    if (!el) return
    const up = el.scrollHeight - el.scrollTop - el.clientHeight > 100
    scrolledRef.current = up
    setScrolledUp(up)
  }

  const submit = async () => {
    const message = text.trim()
    if (!message || sending) return
    setSending(true)
    setSendError(null)
    try {
      const saved = await sendLiveChat(sessionId, message, newClientId())
      setMsgs((cur) => merge(cur, [{ ...saved, mine: true }]))
      setText('')
      scrolledRef.current = false
      setScrolledUp(false)
    } catch (e) {
      const code = e instanceof ApiError ? e.code : ''
      if (code === 'E005') setBanned(true)
      else setSendError(code === 'E002' ? lt.chatTooFast : code === 'E007' ? lt.chatEnded : lt.chatSendError)
    } finally {
      setSending(false)
    }
  }

  if (!CHAT_URL) return <ChatNotice text={lt.chatMissing} />

  const footer = !loggedIn ? (
    <Link to={`/login?return=${encodeURIComponent(location.pathname + location.search)}`} className={buttonClass('default', 'md', 'w-full')}><LogIn /> {lt.chatLogin}</Link>
  ) : banned ? (
    <p role="status" className="rounded-lg bg-white/5 p-2.5 text-center text-xs text-white/70">{lt.chatBanned}</p>
  ) : status !== 'LIVE' ? (
    <p role="status" className="rounded-lg bg-white/5 p-2.5 text-center text-xs text-white/70">{status === 'ENDED' ? lt.chatEnded : lt.chatNotLive}</p>
  ) : (
    <>
      {sendError && <p role="alert" className="mb-2 text-xs text-amber-300">{sendError}</p>}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={MAX_LENGTH} placeholder={t.live.say} aria-label={t.live.say} className="h-10 min-w-0 flex-1 rounded-lg bg-white/10 px-3 text-sm text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-primary" />
        <button type="button" onClick={onReact} className="grid size-10 place-items-center rounded-lg bg-white/10 text-live hover:bg-white/15" aria-label={t.ui.react}><Heart className="size-4" /></button>
        <button type="submit" disabled={sending || !text.trim()} className="grid size-10 place-items-center rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50" aria-label={t.ui.send}><Send className="size-4" /></button>
      </form>
    </>
  )

  return (
    <ChatShell count={msgs.length} footer={footer}>
      {stomp === 'reconnecting' && <p role="status" className="bg-amber-500/15 px-4 py-1.5 text-center text-xs text-amber-200">{lt.chatReconnecting}</p>}
      <div className="relative min-h-0 flex-1">
        <div ref={listRef} onScroll={onScroll} className="h-full space-y-2.5 overflow-y-auto p-4">
          {!loading && msgs.length === 0 && <p className="pt-8 text-center text-sm text-white/50">{loadFailed ? lt.chatLoadError : lt.chatEmpty}</p>}
          <AnimatePresence initial={false}>
            {msgs.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cn('text-[13px] leading-relaxed', m.mine && 'rounded-lg bg-primary/20 p-2')}>
                <span className="mr-1.5 rounded bg-white/10 px-1 font-mono text-[10px] font-bold">{new Date(m.timestampMs).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                <span className={cn('mr-1.5 font-semibold', m.mine ? 'text-gold-bright' : 'text-sky-300')}>{m.senderName}</span>
                <span className="break-words text-white/85">{m.message}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {scrolledUp && (
          <button
            type="button"
            onClick={() => {
              scrolledRef.current = false
              setScrolledUp(false)
              listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
            }}
            className="absolute bottom-3 right-3 grid size-8 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25"
            aria-label={lt.chatToBottom}
          >
            <ArrowDown className="size-4" />
          </button>
        )}
      </div>
    </ChatShell>
  )
}
