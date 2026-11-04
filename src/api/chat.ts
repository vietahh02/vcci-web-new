/**
 * Chat hỗ trợ doanh nghiệp (ChatWidget) — gọi thẳng dịch vụ chat vcci-livestream-chat:
 *  - REST `/api/business-chat/*` (JSON trần, lỗi `{error}`), Bearer = token portal (cùng Keycloak realm).
 *  - Realtime Socket.IO (netty-socketio) qua WebSocket thuần, giao thức Engine.IO v4 tối thiểu (không thêm thư viện).
 * URL nhúng lúc build: VITE_CHAT_URL (REST) + VITE_CHAT_SOCKET_URL (Socket.IO). Thiếu -> widget báo chưa cấu hình.
 */
import { refreshOnce, tokens } from './http'

const env = import.meta.env as Record<string, string | undefined>
const clean = (v?: string) => (v ?? '').trim().replace(/\/+$/, '')

export const CHAT_URL = clean(env.VITE_CHAT_URL)
export const CHAT_SOCKET_URL = clean(env.VITE_CHAT_SOCKET_URL)
export const chatConfigured = () => CHAT_URL !== '' && CHAT_SOCKET_URL !== ''

export const OPEN_B2B = 'vcci:chat-b2b'
/** Mở ChatWidget ở hội thoại B2B với doanh nghiệp này (khách: widget yêu cầu đăng nhập). */
export const openBusinessChat = (businessId: string) => window.dispatchEvent(new CustomEvent(OPEN_B2B, { detail: businessId }))

export const SUPPORT = 'PORTAL_BUSINESS_SUPPORT'
export const B2B = 'PORTAL_BUSINESS_B2B'

export interface ChatMe {
  principalId: string
  principalIds: string[]
  organizationId?: string | null
  organizationName?: string | null
  displayName?: string | null
  operator: boolean
}

export interface ChatConversation {
  id: string
  businessId: string
  businessName?: string | null
  businessAvatarUrl?: string | null
  channel: string
  status?: string | null
  lastPreviewText?: string | null
  lastActivityAt?: string | null
  updatedAt?: string | null
  unreadCount?: number
  assigneeName?: string | null
  joined?: boolean
}

export interface ChatMessageDto {
  messageId: number
  conversationId: string
  senderKind: string
  principalId?: string | null
  senderName?: string | null
  messageKind?: string | null
  systemEvent?: string | null
  body: string
  seq: number
  createdAtIso: string
  clientMessageId?: string | null
}

export interface BizEnvelope {
  conversationId: string
  serverMessageId?: number | null
  seq?: number
  senderKind: string
  principalId?: string | null
  senderName?: string | null
  messageKind?: string | null
  systemEvent?: string | null
  body: string
  clientMessageId?: string | null
  epochMs: number
  conversationStatus?: string | null
  duplicate?: boolean
}

export class ChatError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ChatError'
    this.status = status
  }
}

async function call<T>(path: string, init: { method?: string; body?: unknown; query?: Record<string, string | number | undefined> } = {}, retried = false): Promise<T> {
  if (!CHAT_URL) throw new ChatError('chat not configured', 0)
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(init.query ?? {})) if (v !== undefined && v !== '') q.set(k, String(v))
  const headers: Record<string, string> = { Accept: 'application/json' }
  const at = tokens.access()
  if (at) headers.Authorization = `Bearer ${at}`
  if (init.body !== undefined) headers['Content-Type'] = 'application/json'
  let res: Response
  try {
    res = await fetch(`${CHAT_URL}${path}${q.toString() ? `?${q}` : ''}`, {
      method: init.method ?? 'GET',
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    })
  } catch {
    throw new ChatError('network', 0)
  }
  if (res.status === 401 && !retried && tokens.refresh() && (await refreshOnce())) return call<T>(path, init, true)
  const data = (await res.json().catch(() => null)) as (T & { error?: string; message?: string }) | null
  if (!res.ok) throw new ChatError(data?.error ?? data?.message ?? `HTTP ${res.status}`, res.status)
  return data as T
}

const conv = (id: string) => `/api/business-chat/conversations/${encodeURIComponent(id)}`

export const chatApi = {
  me: () => call<ChatMe>('/api/business-chat/me'),
  conversations: (channel?: string) => call<ChatConversation[]>('/api/business-chat/conversations', { query: { channel, limit: 50 } }),
  /** Mở (hoặc lấy lại) hội thoại hỗ trợ của DN đang đăng nhập (DN + kênh theo token). */
  ensureSupport: () => call<{ conversationId: string }>('/api/business-chat/conversations/ensure', { method: 'POST', body: {} }),
  /** Mở (hoặc lấy lại) hội thoại B2B giữa DN của mình và DN đối tác. */
  ensureB2b: (businessId: string, otherBusinessId: string, principalId: string) => call<{ conversationId: string }>('/api/business-chat/conversations/b2b', { method: 'POST', body: { businessId, otherBusinessId, channel: B2B, principalId } }),
  join: (id: string) => call<{ participantId: string }>(`${conv(id)}/participants/portal`, { method: 'POST', body: {} }),
  messages: (id: string, limit = 50, beforeSeq?: number) => call<ChatMessageDto[]>(`${conv(id)}/messages`, { query: { limit, beforeSeq } }),
  send: (id: string, body: string, clientMessageId: string) => call<BizEnvelope>(`${conv(id)}/messages`, { method: 'POST', body: { body, clientMessageId } }),
  read: (id: string) => call<{ lastReadSeq: number }>(`${conv(id)}/read`, { method: 'POST', body: {} }),
  unreadCount: () => call<{ total: number; conversations: number }>('/api/business-chat/unread-count'),
}

export const newClientId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `c-${Date.now()}-${Math.random().toString(36).slice(2)}`

/* ------------------------------------------------------------------ Socket.IO tối thiểu */
type Handler = (payload: never) => void
export type SocketState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'closed'

/**
 * Socket.IO v4 qua WebSocket: `0{...}` -> gửi `40{"token":...}` -> `40{...}` = đã vào; `42[ev,payload]`; ping `2`/`3`;
 * `41` = server ngắt. Tự nối lại (1s..15s) với token mới nhất; bị `unauthorized` thì refresh token trước.
 */
export class ChatSocket {
  private ws: WebSocket | null = null
  private handlers: Record<string, Handler[]> = {}
  private retry = 0
  private timer: ReturnType<typeof setTimeout> | null = null
  private stopped = false
  private authFailed = false
  state: SocketState = 'idle'
  private readonly url: string

  constructor(url: string) {
    this.url = url
  }

  get connected() {
    return this.state === 'connected'
  }

  on(event: string, fn: (payload: never) => void) {
    ;(this.handlers[event] ||= []).push(fn)
    return this
  }

  private fire(event: string, payload?: unknown) {
    for (const h of this.handlers[event] ?? []) {
      try {
        h(payload as never)
      } catch {
        /* handler lỗi không làm sập socket */
      }
    }
  }

  private setState(s: SocketState) {
    this.state = s
    this.fire('state', s)
  }

  connect() {
    this.stopped = false
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
    this.setState(this.retry > 0 ? 'reconnecting' : 'connecting')
    let ws: WebSocket
    try {
      ws = new WebSocket(`${this.url.replace(/^http/, 'ws')}/socket.io/?EIO=4&transport=websocket`)
    } catch {
      this.schedule()
      return
    }
    this.ws = ws
    ws.onmessage = (ev) => {
      const d = typeof ev.data === 'string' ? ev.data : ''
      if (d === '2') return ws.send('3')
      if (d.startsWith('0')) return ws.send(`40${JSON.stringify({ token: tokens.access() ?? '' })}`)
      if (d.startsWith('40')) {
        this.retry = 0
        this.authFailed = false
        this.setState('connected')
        this.fire('connect')
        return
      }
      if (d.startsWith('41')) return ws.close()
      if (d.startsWith('42')) {
        try {
          const [ev2, payload] = JSON.parse(d.slice(2)) as [string, unknown]
          if (ev2 === 'unauthorized') this.authFailed = true
          this.fire(ev2, payload)
        } catch {
          /* gói hỏng */
        }
      }
    }
    ws.onclose = () => {
      if (this.ws !== ws) return
      const was = this.state === 'connected'
      this.ws = null
      if (was) this.fire('disconnect')
      if (this.stopped) this.setState('closed')
      else this.schedule()
    }
  }

  private schedule() {
    if (this.stopped) return
    this.retry += 1
    this.setState('reconnecting')
    const needRefresh = this.authFailed
    this.timer = setTimeout(async () => {
      if (needRefresh) await refreshOnce()
      if (!this.stopped && tokens.access()) this.connect()
    }, Math.min(15000, 1000 * 2 ** Math.min(this.retry - 1, 4)))
  }

  emit(event: string, payload: unknown) {
    if (this.ws && this.state === 'connected') {
      this.ws.send(`42${JSON.stringify([event, payload])}`)
      return true
    }
    return false
  }

  close() {
    this.stopped = true
    if (this.timer) clearTimeout(this.timer)
    this.handlers = {}
    try {
      this.ws?.close()
    } catch {
      /* ignore */
    }
    this.ws = null
    this.state = 'closed'
  }
}
