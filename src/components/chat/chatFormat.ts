import { tx } from '@/lib/tx'

/** Hai chữ đại diện: chữ đầu của hai từ cuối tên DN ("Gỗ Mỹ Nghệ An Phát" -> "AP"). */
export function initials(name?: string | null) {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean)
  return (words.slice(-2).map((w) => w[0]).join('') || '?').toUpperCase()
}

const pad = (n: number) => String(n).padStart(2, '0')
export const clock = (at: number) => { const d = new Date(at); return `${pad(d.getHours())}:${pad(d.getMinutes())}` }
export const dayKey = (at: number) => new Date(at).toDateString()
const isYesterday = (at: number) => dayKey(at) === new Date(Date.now() - 86400000).toDateString()

/** Vạch ngày trong luồng tin: "Hôm nay, dd/MM/yyyy" | "Hôm qua" | dd/MM/yyyy. */
export function dayLabel(at: number) {
  const d = new Date(at)
  const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
  if (dayKey(at) === new Date().toDateString()) return `${tx('Hôm nay', 'Today', '오늘')}, ${date}`
  if (isYesterday(at)) return tx('Hôm qua', 'Yesterday', '어제')
  return date
}

/** Giờ ngắn cho danh sách hội thoại: hôm nay -> HH:mm, hôm qua -> "Hôm qua", còn lại -> dd/MM. */
export function listTime(iso?: string | null) {
  const at = iso ? Date.parse(iso) : NaN
  if (Number.isNaN(at)) return ''
  if (dayKey(at) === new Date().toDateString()) return clock(at)
  if (isYesterday(at)) return tx('Hôm qua', 'Yesterday', '어제')
  const d = new Date(at)
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
}

export const fmtSize = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)
export const fmtMoney = (n?: number | null) => (n == null ? '—' : new Intl.NumberFormat('en-US').format(n))
