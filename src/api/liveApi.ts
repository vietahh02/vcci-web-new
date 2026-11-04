/**
 * Dữ liệu phòng xem trực tiếp, gọi ba dịch vụ khác nhau:
 *  - vcci-live-service (VITE_LIVE_URL): phiên livestream, đọc công khai. portal-apis đã tắt lớp này (`app.live.legacy.enabled=false`).
 *  - vcci-portal-apis (API_BASE): hội thảo, token Jitsi.
 *  - vcci-livestream-chat (VITE_CHAT_URL): chat phiên. Phiên webinar không có chat ở đây vì id trùng dải với phiên livestream.
 * Hai dịch vụ ngoài API_BASE cũng dùng phong bì CommonResponse (lỗi nghiệp vụ trả HTTP 400 kèm errorCode).
 */
import { CHAT_URL } from './chat'
import { API_BASE } from './config'
import { ApiError, apiFetch, refreshOnce, tokens } from './http'

const env = import.meta.env as Record<string, string | undefined>
const clean = (v?: string) => (v ?? '').trim().replace(/\/+$/, '')

/** Để trống khi nginx gom route phiên live về cùng host với portal. */
export const LIVE_URL = clean(env.VITE_LIVE_URL) || API_BASE
const VALID_DOMAIN = /^[a-z0-9.-]+(:\d{1,5})?$/i
const domain = clean(env.VITE_JITSI_DOMAIN)
/** Domain Jitsi (cùng giá trị với NEXT_PUBLIC_VCCI_JITSI_DOMAIN của CMS). Rỗng hoặc sai dạng: phòng hội thảo báo chưa cấu hình. */
export const JITSI_DOMAIN = VALID_DOMAIN.test(domain) ? domain : ''

export type LiveStatus = 'SCHEDULED' | 'READY' | 'LIVE' | 'ENDED'

export interface LiveSession {
  id: string
  status: LiveStatus
  watchUrl: string | null
  vodUrl: string | null
  ingestActive: boolean
}

export interface WebinarInfo {
  status: string
  roomOpened: boolean
  roomClosed: boolean
  vodUrl: string | null
  registrationStatus: string | null
}

export type JitsiRole = 'PARTICIPANT' | 'OBSERVER'
export interface JitsiToken { token: string; roomName: string; role: JitsiRole }

export interface LiveChatMessage {
  id: string
  senderName: string
  message: string
  timestampMs: number
  clientMessageId?: string
  /** Tin do chính phiên trình duyệt này gửi (lịch sử không mang danh tính người gửi). */
  mine?: boolean
}

type Raw = Record<string, unknown>
const text = (v: unknown) => (v === null || v === undefined || v === '' ? null : String(v))

async function call<T>(base: string, path: string, init: { method?: string; json?: unknown; auth?: boolean } = {}, retried = false): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const at = init.auth ? tokens.access() : null
  if (at) headers.Authorization = `Bearer ${at}`
  if (init.json !== undefined) headers['Content-Type'] = 'application/json'
  let res: Response
  try {
    res = await fetch(`${base}${path}`, { method: init.method ?? 'GET', headers, body: init.json === undefined ? undefined : JSON.stringify(init.json) })
  } catch (e) {
    throw new ApiError('NETWORK', e instanceof Error ? e.message : 'network error', 0)
  }
  if (res.status === 401 && init.auth && !retried && tokens.refresh() && (await refreshOnce())) return call<T>(base, path, init, true)
  const data = (await res.json().catch(() => null)) as { errorCode?: string; message?: string; result?: T } | null
  if (!res.ok || !data || data.errorCode !== '00000') {
    throw new ApiError(data?.errorCode ?? String(res.status), data?.message ?? `HTTP ${res.status}`, res.status)
  }
  return data.result as T
}

/* ------------------------------------------------------------------ phiên livestream */
const toSession = (r: Raw): LiveSession => ({
  id: String(r.id),
  status: String(r.status) as LiveStatus,
  watchUrl: text(r.watchUrl),
  vodUrl: text(r.vodUrl),
  ingestActive: r.ingestActive === true,
})

export const getLiveSession = async (sessionId: string) => toSession(await call<Raw>(LIVE_URL, `/api/event/livestream-session/${encodeURIComponent(sessionId)}`))

const RANK: Record<LiveStatus, number> = { LIVE: 0, READY: 1, SCHEDULED: 2, ENDED: 3 }
/** Sự kiện có nhiều phiên: đang phát > sẵn sàng > đã lên lịch > đã kết thúc (ưu tiên phiên có bản ghi, rồi phiên mới nhất). */
export function pickSession(list: LiveSession[]): LiveSession | null {
  const rank = (s: LiveSession) => RANK[s.status] * 2 + (s.status === 'ENDED' && !s.vodUrl ? 1 : 0)
  return [...list].sort((a, b) => rank(a) - rank(b) || Number(b.id) - Number(a.id))[0] ?? null
}

/** Livestream không tự có phiên lúc duyệt: danh sách rỗng nghĩa là host chưa mở, không phải lỗi. */
export const listLiveSessions = async (eventId: string) => {
  const rows = await call<Raw[] | null>(LIVE_URL, `/api/event/livestream-session/event/${encodeURIComponent(eventId)}`)
  return (rows ?? []).map(toSession)
}

/* ------------------------------------------------------------------ hội thảo + token Jitsi */
export async function getWebinar(eventId: string): Promise<WebinarInfo> {
  const r = await apiFetch<Raw>(`/api/event/webinar/${encodeURIComponent(eventId)}`)
  return {
    status: String(r.eventStatus ?? ''),
    roomOpened: r.roomOpened === true,
    roomClosed: r.roomClosed === true,
    vodUrl: text(r.vodUrl),
    registrationStatus: text(r.registrationStatus),
  }
}

const toToken = (r: Raw): JitsiToken => ({ token: String(r.token), roomName: String(r.roomName), role: r.role === 'PARTICIPANT' ? 'PARTICIPANT' : 'OBSERVER' })

/** Đã đăng nhập: có đăng ký APPROVED thì PARTICIPANT (joinKey phải khớp nếu đã đặt), còn lại OBSERVER. */
export const getJoinToken = async (eventId: string, joinKey?: string) =>
  toToken(await apiFetch<Raw>(`/api/event/webinar/${encodeURIComponent(eventId)}/join-token`, { query: { joinKey } }))

/** Khách: token dự thính, tên hiển thị 1-50 ký tự. */
export const getObserverToken = async (eventId: string, displayName: string) =>
  toToken(await apiFetch<Raw>(`/api/event/webinar/${encodeURIComponent(eventId)}/observer-token`, { method: 'POST', anon: true, json: { displayName } }))

/* ------------------------------------------------------------------ chat phiên */
export const toChatMessage = (r: Raw): LiveChatMessage => ({
  id: String(r.id),
  senderName: String(r.senderName ?? ''),
  message: String(r.message ?? ''),
  timestampMs: Number(r.timestampMs) || Date.now(),
  clientMessageId: r.clientMessageId ? String(r.clientMessageId) : undefined,
})

export const liveChatHistory = async (sessionId: string) =>
  ((await call<Raw[] | null>(CHAT_URL, `/api/public/livestream-chat/${encodeURIComponent(sessionId)}`)) ?? []).map(toChatMessage)

export const sendLiveChat = async (sessionId: string, message: string, clientMessageId: string) =>
  toChatMessage(await call<Raw>(CHAT_URL, '/api/public/livestream-chat/send', { method: 'POST', auth: true, json: { sessionId, message, clientMessageId } }))

/** Số người xem đang subscribe kênh của phiên. Service chat bản cũ chưa có API này: trả null, chỉ dùng số từ kênh STOMP. */
export async function liveViewerCount(sessionId: string): Promise<number | null> {
  try {
    const r = await call<Raw>(CHAT_URL, `/api/public/livestream-chat/${encodeURIComponent(sessionId)}/viewers`)
    return typeof r.viewerCount === 'number' ? r.viewerCount : null
  } catch {
    return null
  }
}
