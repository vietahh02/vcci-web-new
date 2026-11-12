/**
 * Theo dõi doanh nghiệp — phần dùng chung giữa nút Theo dõi, trang "Doanh nghiệp đang theo dõi", số đếm trong menu bánh răng
 * và số người theo dõi trên hồ sơ doanh nghiệp. Live: dữ liệu nằm trên BE theo tài khoản. Mock: lưu trong localStorage để cả luồng thử được.
 * `emitFollowChange` báo cho mọi nơi đang hiển thị biết có thay đổi.
 */
import { useEffect, useState } from 'react'
import { liveApi, tokens, USE_MOCK } from '@/api'

const KEY = 'vcci.mock.follows'
const EVENT = 'vcci:follow-change'

export interface FollowChange { orgId: string; on: boolean }

/* ---------------------------------------------------------------- mock store */
export function mockFollowIds(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown
    return Array.isArray(raw) ? raw.map(String) : []
  } catch { return [] }
}
export function mockSetFollow(orgId: string, on: boolean) {
  try {
    const rest = mockFollowIds().filter((x) => x !== orgId)
    localStorage.setItem(KEY, JSON.stringify(on ? [orgId, ...rest] : rest))
  } catch { /* trình duyệt chặn lưu trữ: trạng thái chỉ sống trong phiên */ }
}

/* ---------------------------------------------------------------- change events */
export function emitFollowChange(change: FollowChange) {
  window.dispatchEvent(new CustomEvent<FollowChange>(EVENT, { detail: change }))
}
export function onFollowChange(fn: (c: FollowChange) => void) {
  const h = (e: Event) => fn((e as CustomEvent<FollowChange>).detail)
  window.addEventListener(EVENT, h)
  return () => window.removeEventListener(EVENT, h)
}

/** Số doanh nghiệp đang theo dõi (null = chưa biết / chưa đăng nhập). Tự cập nhật khi có nút Theo dõi nào được bấm. */
export function useFollowingCount(enabled: boolean): number | null {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    if (!enabled) { setCount(null); return }
    let alive = true
    if (USE_MOCK) setCount(mockFollowIds().length)
    else if (tokens.access()) liveApi.listFollowedBusinesses(0, 1).then((p) => { if (alive) setCount(p.total) }, () => undefined)
    const off = onFollowChange((c) => setCount((n) => (n === null ? n : Math.max(0, n + (c.on ? 1 : -1)))))
    return () => { alive = false; off() }
  }, [enabled])
  return count
}
