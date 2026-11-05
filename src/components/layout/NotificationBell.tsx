/**
 * Chuông thông báo ở Header. Chế độ thật: số chưa đọc (hỏi lại mỗi 60 giây và khi quay lại tab), bảng 10 thông báo mới nhất,
 * đánh dấu đã đọc từng cái / tất cả, bấm vào thì mở đường dẫn nội bộ (nếu có). Chưa đăng nhập: gợi ý đăng nhập.
 * Chế độ mock giữ nguyên nút tĩnh của prototype.
 */
import { AnimatePresence, motion } from 'motion/react'
import { Bell, CheckCheck, Inbox } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { USE_MOCK } from '@/api'
import { markAllRead, markRead, myNotifications, unreadCount, type InboxItem } from '@/api/notificationApi'
import { Tooltip } from '@/components/ui/overlay'
import { buttonClass } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { useProfile } from '@/lib/profile'
import { tx } from '@/lib/tx'
import { cn, formatDate } from '@/lib/utils'

const POLL_MS = 60_000
const btn = 'relative rounded-full p-2.5 text-muted-foreground transition-all duration-200 hover:bg-primary-soft hover:text-primary hover:shadow-sm'

export function NotificationBell() {
  return USE_MOCK ? <StaticBell /> : <LiveBell />
}

function StaticBell() {
  const { t } = useI18n()
  return (
    <Tooltip content={t.nav.notifications}>
      <button className={cn(btn, 'hidden sm:block')} aria-label={t.nav.notifications}>
        <Bell className="size-[18px]" />
        <span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-background" />
      </button>
    </Tooltip>
  )
}

function when(iso: string, locale: string) {
  const d = new Date(iso)
  if (!iso || Number.isNaN(d.getTime())) return ''
  return formatDate(iso, locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function LiveBell() {
  const { t, locale } = useI18n()
  const { session } = useProfile()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)
  const [items, setItems] = useState<InboxItem[] | null>(null)
  const [error, setError] = useState('')
  const box = useRef<HTMLDivElement>(null)

  const refreshCount = useCallback(() => {
    if (!session) return
    unreadCount().then(setCount, () => undefined)
  }, [session])

  // số chưa đọc: lúc đăng nhập, mỗi 60 giây, và khi người dùng quay lại tab
  useEffect(() => {
    if (!session) return
    refreshCount()
    const id = setInterval(refreshCount, POLL_MS)
    const onFocus = () => refreshCount()
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus) }
  }, [session, refreshCount])

  const loadList = useCallback(() => {
    setError('')
    setItems(null)
    myNotifications(10).then((r) => setItems(r.items), (e: Error) => { setItems([]); setError(e.message) })
  }, [])
  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next && session) { loadList(); refreshCount() }
  }
  const shown = session ? count : 0

  // đóng khi bấm ra ngoài / nhấn Esc
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  const openItem = (n: InboxItem) => {
    if (!n.read) {
      setItems((list) => list?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? null)
      setCount((c) => Math.max(0, c - 1))
      markRead(n.id).catch(() => refreshCount())
    }
    if (n.link) { setOpen(false); navigate(n.link) }
  }
  const readAll = () => {
    setItems((list) => list?.map((x) => ({ ...x, read: true })) ?? null)
    setCount(0)
    markAllRead().catch(() => refreshCount())
  }

  return (
    <div ref={box} className="relative hidden sm:block">
      <Tooltip content={t.nav.notifications}>
        <button className={btn} aria-label={shown ? `${t.nav.notifications} (${shown})` : t.nav.notifications} aria-expanded={open} aria-haspopup="dialog" onClick={toggle} data-testid="notification-bell">
          <Bell className="size-[18px]" />
          {shown > 0 && (
            <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold leading-4 text-primary-foreground ring-2 ring-background">{shown > 99 ? '99+' : shown}</span>
          )}
        </button>
      </Tooltip>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={t.nav.notifications}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full z-50 mt-2 w-[min(360px,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl shadow-navy/15"
          >
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <p className="text-sm font-bold">{t.nav.notifications}</p>
              {shown > 0 && (
                <button onClick={readAll} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  <CheckCheck className="size-3.5" /> {tx('Đánh dấu đã đọc tất cả', 'Mark all as read', '모두 읽음으로 표시')}
                </button>
              )}
            </div>
            {!session ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                <p>{tx('Đăng nhập để xem thông báo của doanh nghiệp.', 'Sign in to see your company notifications.', '기업 알림을 보려면 로그인하세요.')}</p>
                <Link to="/login" onClick={() => setOpen(false)} className={buttonClass('default', 'sm', 'mt-4 h-9')}>{t.nav.login}</Link>
              </div>
            ) : items === null ? (
              <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}</div>
            ) : error ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">{error} <button onClick={loadList} className="font-semibold text-primary hover:underline">{tx('Thử lại', 'Retry', '다시 시도')}</button></p>
            ) : items.length === 0 ? (
              <p className="flex flex-col items-center gap-2 px-4 py-10 text-sm text-muted-foreground"><Inbox className="size-6" />{tx('Chưa có thông báo nào.', 'No notifications yet.', '알림이 없습니다.')}</p>
            ) : (
              <ul className="max-h-[420px] divide-y overflow-y-auto" data-testid="notification-list">
                {items.map((n) => (
                  <li key={n.id}>
                    <button onClick={() => openItem(n)} className={cn('flex w-full gap-3 px-4 py-3 text-left transition hover:bg-muted/60', !n.read && 'bg-primary-soft/40')}>
                      <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-primary')} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className={cn('block text-[13px] leading-snug', n.read ? 'font-medium text-foreground/80' : 'font-semibold')}>{n.title || tx('Thông báo', 'Notification', '알림')}</span>
                        {n.content && <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{n.content}</span>}
                        <span className="mt-1 block text-[11px] text-muted-foreground/80">{when(n.createdAt, locale)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
