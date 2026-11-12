/**
 * Số thông báo chưa đọc của tài khoản (menu bánh răng hiện chấm + số). Hỏi lại mỗi 60 giây và khi quay lại tab;
 * trang Thông báo gọi `emitUnreadChange` sau khi đánh dấu đã đọc để số cập nhật ngay.
 */
import { useEffect, useState } from 'react'
import { unreadCount } from '@/api/notificationApi'

const EVENT = 'vcci:unread-change'
const POLL_MS = 60_000

export const emitUnreadChange = (count: number) => window.dispatchEvent(new CustomEvent<number>(EVENT, { detail: count }))

export function useUnreadNotifications(enabled: boolean): number {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!enabled) { setCount(0); return }
    let alive = true
    const refresh = () => unreadCount().then((n) => { if (alive) setCount(n) }, () => undefined)
    refresh()
    const timer = setInterval(refresh, POLL_MS)
    const onChange = (e: Event) => setCount((e as CustomEvent<number>).detail)
    window.addEventListener('focus', refresh)
    window.addEventListener(EVENT, onChange)
    return () => { alive = false; clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener(EVENT, onChange) }
  }, [enabled])
  return count
}
