/** Đường dẫn và định danh của phòng xem. `/live/l-7`, `/live/w-7`: sự kiện thường. `/live/s-5?session=`, `?launch=`: phiên của Show. */
export type LiveKind = 'LIVESTREAM' | 'WEBINAR'

/** Id catalog `l-7` / `w-7` ra loại và id số của sự kiện gốc; id khác (`g-`, `s-`) thì không có phòng riêng. */
export function parseLiveEventId(id: string): { kind: LiveKind; eventId: string } | null {
  const m = /^([lw])-(\d+)$/.exec(id)
  if (!m) return null
  return { kind: m[1] === 'l' ? 'LIVESTREAM' : 'WEBINAR', eventId: m[2]! }
}

export const toLiveKind = (eventType: string): LiveKind | null => (eventType === 'LIVESTREAM' || eventType === 'WEBINAR' ? eventType : null)

export const showLivePath = (showId: string, ref: { session?: string; launch?: string }) => {
  const q = new URLSearchParams()
  if (ref.session) q.set('session', ref.session)
  if (ref.launch) q.set('launch', ref.launch)
  return `/live/${showId}?${q}`
}

/** Bản ghi nhập tay ở CMS: chỉ nhận http(s) trước khi đưa vào video hoặc link. */
export function safeHttpUrl(url?: string | null): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null
  } catch {
    return null
  }
}
