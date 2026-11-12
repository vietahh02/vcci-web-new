/**
 * Yêu thích sản phẩm — phần dùng chung giữa nút tim, trang "Sản phẩm yêu thích" và nút tim trên header.
 * Live: dữ liệu nằm trên BE theo tài khoản. Mock (chạy giao diện không backend): lưu trong localStorage để cả luồng vẫn thử được.
 * `emitFavoriteChange` báo cho mọi nơi đang hiển thị (đếm trên header, danh sách) biết có thay đổi.
 */
import { useEffect, useState } from 'react'
import { catalogApi, tokens, USE_MOCK } from '@/api'

const KEY = 'vcci.mock.favorites'
const EVENT = 'vcci:favorite-change'

export interface FavoriteChange { productId: string; on: boolean }

/* ---------------------------------------------------------------- mock store */
export function mockFavoriteIds(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown
    return Array.isArray(raw) ? raw.map(String) : []
  } catch { return [] }
}
export function mockSetFavorite(productId: string, on: boolean) {
  try {
    const rest = mockFavoriteIds().filter((x) => x !== productId)
    localStorage.setItem(KEY, JSON.stringify(on ? [productId, ...rest] : rest))
  } catch { /* trình duyệt chặn lưu trữ: bỏ qua, trạng thái chỉ sống trong phiên */ }
}

/* ---------------------------------------------------------------- change events */
export function emitFavoriteChange(change: FavoriteChange) {
  window.dispatchEvent(new CustomEvent<FavoriteChange>(EVENT, { detail: change }))
}
export function onFavoriteChange(fn: (c: FavoriteChange) => void) {
  const h = (e: Event) => fn((e as CustomEvent<FavoriteChange>).detail)
  window.addEventListener(EVENT, h)
  return () => window.removeEventListener(EVENT, h)
}

/** Tổng số sản phẩm đã lưu (null = chưa biết / chưa đăng nhập). Tự cập nhật khi có nút tim nào được bấm. */
export function useFavoriteCount(enabled: boolean): number | null {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    if (!enabled) { setCount(null); return }
    let alive = true
    if (USE_MOCK) setCount(mockFavoriteIds().length)
    else if (tokens.access()) catalogApi.listFavorites(0, 1).then((p) => { if (alive) setCount(p.total) }, () => undefined)
    const off = onFavoriteChange((c) => setCount((n) => (n === null ? n : Math.max(0, n + (c.on ? 1 : -1)))))
    return () => { alive = false; off() }
  }, [enabled])
  return count
}
