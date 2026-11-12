/** /account/notifications — hộp thư thông báo của tài khoản (BE: GET /api/notifications/my). Có thông báo "doanh nghiệp bạn theo dõi vừa đăng sản phẩm mới". */
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Bell, BellRing, CheckCheck, Inbox, PackagePlus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { tokens, USE_MOCK } from '@/api'
import { markAllRead, markRead, myNotifications, type InboxItem } from '@/api/notificationApi'
import { PageHero } from '@/components/PageHero'
import { ErrorBlock } from '@/components/ui/StateViews'
import { Button, buttonClass, Skeleton } from '@/components/ui/primitives'
import { emitUnreadChange } from '@/lib/notifications'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'
import { cn, formatDate, formatNumber } from '@/lib/utils'

const SIZE = 30

const isProduct = (n: InboxItem) => /^\/products\//.test(n.link ?? '')

export default function Notifications() {
  const { locale } = useI18n()
  const navigate = useNavigate()
  const signedOut = USE_MOCK || !tokens.access()
  const [items, setItems] = useState<InboxItem[] | null>(null)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<Error>()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const load = useCallback(() => {
    setError(undefined)
    myNotifications(SIZE).then((r) => { setItems(r.items); setTotal(r.total) }, (e: Error) => { setError(e); setItems([]) })
  }, [])
  useEffect(() => { if (!signedOut) load(); else setItems([]) }, [signedOut, load])

  const unread = (items ?? []).filter((n) => !n.read).length
  const shown = (items ?? []).filter((n) => filter === 'all' || !n.read)

  const open = (n: InboxItem) => {
    if (!n.read) {
      setItems((list) => list?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? null)
      emitUnreadChange(Math.max(0, unread - 1))
      markRead(n.id).catch(() => load())
    }
    if (n.link) navigate(n.link)
  }
  const readAll = () => {
    setItems((list) => list?.map((x) => ({ ...x, read: true })) ?? null)
    emitUnreadChange(0)
    markAllRead().catch(() => load())
  }

  return (
    <>
      <PageHero
        tone="azure"
        crumbs={[{ label: tx('Trang chủ', 'Home', '홈'), to: '/' }, { label: tx('Thông báo', 'Notifications', '알림') }]}
        title={tx('Thông báo', 'Notifications', '알림')}
        subtitle={tx('Sản phẩm mới từ doanh nghiệp bạn theo dõi và các cập nhật khác cho tài khoản của bạn.', 'New products from businesses you follow and other updates for your account.', '팔로우한 기업의 신제품과 계정 관련 업데이트입니다.')}
      />

      <div className="container-page mt-4 pb-6">
        {signedOut ? (
          <div className="mx-auto grid max-w-lg place-items-center rounded-3xl border bg-card px-6 py-14 text-center shadow-sm">
            <span className="grid size-16 place-items-center rounded-full bg-primary-soft text-primary"><Bell className="size-8" /></span>
            <p className="mt-5 text-xl font-extrabold">{tx('Đăng nhập để xem thông báo', 'Sign in to see your notifications', '로그인하여 알림을 확인하세요')}</p>
            {!USE_MOCK && <Link to="/login?return=/account/notifications" className={buttonClass('default', 'lg', 'mt-6')}>{tx('Đăng nhập', 'Sign in', '로그인')} <ArrowRight /></Link>}
          </div>
        ) : (
          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div role="group" className="relative inline-flex rounded-full bg-muted p-1">
                {([['all', tx('Tất cả', 'All', '전체')], ['unread', `${tx('Chưa đọc', 'Unread', '읽지 않음')}${unread ? ` (${unread})` : ''}`]] as const).map(([k, label]) => (
                  <button key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)} className={cn('relative h-9 rounded-full px-4 text-sm font-semibold transition-colors', filter === k ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>
                    {filter === k && <motion.span layoutId="notif-filter" className="absolute inset-0 rounded-full bg-background shadow-sm" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
                    <span className="relative">{label}</span>
                  </button>
                ))}
              </div>
              {unread > 0 && (
                <Button variant="ghost" className="rounded-full text-primary" onClick={readAll}><CheckCheck /> {tx('Đánh dấu đã đọc tất cả', 'Mark all as read', '모두 읽음으로 표시')}</Button>
              )}
            </div>

            {items === null ? (
              <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
            ) : error ? (
              <ErrorBlock error={error} onRetry={load} />
            ) : shown.length === 0 ? (
              <div className="grid place-items-center rounded-3xl bg-muted/60 px-6 py-14 text-center">
                <motion.span animate={{ rotate: [0, -12, 10, -6, 0] }} transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.8, ease: 'easeInOut' }} className="grid size-20 place-items-center rounded-full bg-white shadow-lg shadow-primary/15 dark:bg-card"><Inbox className="size-9 text-primary" /></motion.span>
                <p className="mt-5 text-xl font-extrabold">{filter === 'unread' && items.length ? tx('Bạn đã đọc hết thông báo', 'You are all caught up', '모든 알림을 읽었습니다') : tx('Chưa có thông báo nào', 'No notifications yet', '알림이 없습니다')}</p>
                <p className="mt-2 max-w-md text-[15px] text-foreground/75">{tx('Theo dõi doanh nghiệp để nhận thông báo khi họ đăng sản phẩm mới.', 'Follow businesses to get notified when they publish new products.', '기업을 팔로우하면 신제품 알림을 받을 수 있습니다.')}</p>
              </div>
            ) : (
              <>
                <ul className="space-y-3">
                  <AnimatePresence initial>
                    {shown.map((n, i) => (
                      <motion.li key={n.id} layout="position" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.035 } }} exit={{ opacity: 0, scale: 0.96 }}>
                        <button type="button" onClick={() => open(n)} className={cn('group flex w-full items-start gap-5 rounded-2xl border p-5 text-left transition-[box-shadow,border-color,translate] duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-navy/10', n.read ? 'bg-card' : 'border-primary/25 bg-primary-soft/50')}>
                          <span className={cn('grid size-12 shrink-0 place-items-center rounded-xl', isProduct(n) ? 'bg-gradient-to-br from-[#1a8cc4] to-primary text-white shadow-md shadow-primary/25' : 'bg-muted text-muted-foreground')}>
                            {isProduct(n) ? <PackagePlus className="size-5" /> : <BellRing className="size-5" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={cn('block text-base leading-snug', n.read ? 'font-medium text-foreground/85' : 'font-bold')}>{n.title || tx('Thông báo', 'Notification', '알림')}</span>
                            {n.content && <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">{n.content}</span>}
                            <span className="mt-1.5 block text-xs text-muted-foreground/80">{n.createdAt ? formatDate(n.createdAt, locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                          </span>
                          {!n.read && <span aria-label={tx('Chưa đọc', 'Unread', '읽지 않음')} className="mt-2 size-2.5 shrink-0 rounded-full bg-primary" />}
                          {n.link && <ArrowRight className="mt-1.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />}
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                {total > items.length && <p className="mt-5 text-center text-sm text-muted-foreground">{tx(`Hiển thị ${formatNumber(items.length, locale)} thông báo mới nhất trong ${formatNumber(total, locale)}`, `Showing the ${formatNumber(items.length, locale)} latest of ${formatNumber(total, locale)}`, `전체 ${formatNumber(total, locale)}건 중 최근 ${formatNumber(items.length, locale)}건`)}</p>}
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}
