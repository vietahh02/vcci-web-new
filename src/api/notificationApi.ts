/**
 * Hộp thư thông báo của tài khoản đăng nhập (thông báo do CMS gửi / hệ thống sinh, kênh IN_APP).
 * Portal: GET /api/notifications/my?page&size -> {content[], pagination}, GET /my/unread-count -> {unreadCount},
 * PUT /api/notifications/{id}/read (id = dòng người nhận), PUT /api/notifications/my/read-all.
 */
import { apiFetch, toPage } from './http'
import { id, num, str, type Raw } from './adapters/common'

export interface InboxItem {
  /** id dòng người nhận (dùng cho đánh dấu đã đọc) */
  id: string
  title: string
  content: string
  type: string
  read: boolean
  createdAt: string
  /** chỉ giữ đường dẫn nội bộ của portal (bắt đầu bằng "/"), bỏ URL ngoài để tránh chuyển hướng lạ */
  link?: string
}

const internal = (u: unknown) => {
  const s = str(u).trim()
  return s.startsWith('/') && !s.startsWith('//') && !s.startsWith('/\\') ? s : undefined
}

const toItem = (r: Raw): InboxItem => ({
  id: id(r.id), title: str(r.title), content: str(r.content), type: str(r.type),
  read: str(r.readStatus, 'UNREAD') === 'READ', createdAt: str(r.createdDate || r.deliveredAt), link: internal(r.redirectUrl),
})

export async function myNotifications(size = 10) {
  const p = toPage<Raw>(await apiFetch('/api/notifications/my', { query: { page: 0, size } }), size)
  return { items: p.items.map(toItem), total: p.total }
}
export const unreadCount = async () => num((await apiFetch<Raw>('/api/notifications/my/unread-count'))?.unreadCount)
export const markRead = (recipientId: string) => apiFetch(`/api/notifications/${encodeURIComponent(recipientId)}/read`, { method: 'PUT' })
export const markAllRead = () => apiFetch('/api/notifications/my/read-all', { method: 'PUT' })
