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
  createdAt?: string | null
  closedAt?: string | null
  joined?: boolean
  // phiếu hỗ trợ
  ticketCode?: string | null
  subject?: string | null
  category?: string | null
  categoryLabel?: string | null
  department?: string | null
  priority?: string | null
  dueAt?: string | null
  firstResponseAt?: string | null
  dueSoon?: boolean
  callbackRequestedAt?: string | null
  rating?: number | null
  ratingComment?: string | null
  labels?: string[] | null
  // tuỳ chọn của người xem + trạng thái hội thoại
  pinned?: boolean
  muted?: boolean
  pinnedMessageId?: number | null
  pinnedMessagePreview?: string | null
  blockedByBusinessId?: string | null
  online?: boolean | null
}

/** Loại tin (payload riêng theo loại — xem vcci-livestream-chat ChatMessageKind). */
export type MessageKind = 'TEXT' | 'SYSTEM_NOTICE' | 'ATTACHMENT' | 'PRODUCT' | 'RFQ' | 'CHECKLIST' | 'LINK' | 'CALL' | 'APPOINTMENT' | 'INTERNAL_NOTE'
export type Payload = Record<string, unknown>
export interface ReplyRef { messageId: number; senderName?: string | null; messageKind?: string | null; body?: string | null }
export interface Reaction { emoji: string; principalIds: string[] }
export const REACTIONS = ['👍', '❤️', '😂', '😮', '🙏', '✅', '😍', '🥰', '😆', '😅', '😢', '😡', '🤔', '👀', '👏', '🙌', '👌', '🤝', '🎉', '🔥', '💯', '🚀'] as const

export interface TicketCategory { code: string; label: string; department?: string | null }
export interface SupportStatus { onlineOperators: number; avgFirstResponseMinutes?: number | null; slaHours: number; categories: TicketCategory[] }
export interface AttachmentView { messageId: number; name: string; size: number; contentType: string; createdAtIso: string; senderName?: string | null }
export interface AppointmentView { messageId: number; title: string; startAt: string; endAt?: string | null; location?: string | null }
export interface SearchHit { messageId: number; seq: number; body: string; createdAtIso: string; senderName?: string | null }

/** Thông tin cơ bản của DN (hội thoại B2B: DN đối tác; hội thoại hỗ trợ: DN mình). */
export interface ChatBusiness {
  id: string
  name?: string | null
  nameEn?: string | null
  taxCode?: string | null
  businessType?: string | null
  address?: string | null
  province?: string | null
  website?: string | null
  logoUrl?: string | null
  contactName?: string | null
  contactPhone?: string | null
  contactEmail?: string | null
  vcciVerified?: boolean | null
}

export interface ChatConversationDetail {
  conversation: ChatConversation
  business?: ChatBusiness | null
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
  payload?: Payload | null
  replyTo?: ReplyRef | null
  reactions?: Reaction[] | null
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
  payload?: Payload | null
  replyTo?: ReplyRef | null
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
const post = <T,>(path: string, body: unknown = {}) => call<T>(path, { method: 'POST', body })

/** Tải tệp (multipart) — cùng xử lý token / lỗi như call(). */
async function upload<T>(path: string, form: FormData, retried = false): Promise<T> {
  if (!CHAT_URL) throw new ChatError('chat not configured', 0)
  const at = tokens.access()
  let res: Response
  try {
    res = await fetch(`${CHAT_URL}${path}`, { method: 'POST', headers: at ? { Authorization: `Bearer ${at}` } : {}, body: form })
  } catch {
    throw new ChatError('network', 0)
  }
  if (res.status === 401 && !retried && tokens.refresh() && (await refreshOnce())) return upload<T>(path, form, true)
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null
  if (!res.ok) throw new ChatError(data?.error ?? `HTTP ${res.status}`, res.status)
  return data as T
}

export const chatApi = {
  me: () => call<ChatMe>('/api/business-chat/me'),
  conversations: (channel?: string) => call<ChatConversation[]>('/api/business-chat/conversations', { query: { channel, limit: 50 } }),
  /** Mở (hoặc lấy lại) hội thoại hỗ trợ của DN đang đăng nhập (DN + kênh theo token). */
  ensureSupport: () => call<{ conversationId: string }>('/api/business-chat/conversations/ensure', { method: 'POST', body: {} }),
  /** Mở (hoặc lấy lại) hội thoại B2B giữa DN đang đăng nhập và DN khác; hai bên dùng chung một hội thoại. */
  ensureB2b: (businessId: string, otherBusinessId: string, principalId: string) =>
    call<{ conversationId: string }>('/api/business-chat/conversations/b2b', { method: 'POST', body: { businessId, otherBusinessId, channel: B2B, principalId } }),
  detail: (id: string) => call<ChatConversationDetail>(`${conv(id)}/detail`),
  join: (id: string) => call<{ participantId: string }>(`${conv(id)}/participants/portal`, { method: 'POST', body: {} }),
  messages: (id: string, limit = 50, beforeSeq?: number) => call<ChatMessageDto[]>(`${conv(id)}/messages`, { query: { limit, beforeSeq } }),
  send: (id: string, body: string, clientMessageId: string) => call<BizEnvelope>(`${conv(id)}/messages`, { method: 'POST', body: { body, clientMessageId } }),
  read: (id: string) => call<{ lastReadSeq: number }>(`${conv(id)}/read`, { method: 'POST', body: {} }),
  unreadCount: () => call<{ total: number; conversations: number }>('/api/business-chat/unread-count'),
  conversation: (id: string) => call<ChatConversation>(conv(id)),

  // ---- tin nhiều dạng
  sendRich: (id: string, r: { kind: MessageKind; body?: string; payload?: Payload; replyToMessageId?: number | null; clientMessageId?: string }) =>
    post<BizEnvelope>(`${conv(id)}/messages/rich`, r),
  uploadFile: (id: string, file: Blob, name: string, opts: { caption?: string; clientMessageId?: string; replyToMessageId?: number | null } = {}) => {
    const fd = new FormData()
    fd.append('file', file, name)
    if (opts.caption) fd.append('caption', opts.caption)
    if (opts.clientMessageId) fd.append('clientMessageId', opts.clientMessageId)
    if (opts.replyToMessageId) fd.append('replyToMessageId', String(opts.replyToMessageId))
    return upload<BizEnvelope>(`${conv(id)}/attachments`, fd)
  },
  attachmentUrl: (id: string, messageId: number) => call<{ url: string }>(`${conv(id)}/attachments/${messageId}/url`),
  attachments: (id: string) => call<AttachmentView[]>(`${conv(id)}/attachments`),
  appointments: (id: string) => call<AppointmentView[]>(`${conv(id)}/appointments`),
  search: (id: string, q: string) => call<SearchHit[]>(`${conv(id)}/search`, { query: { q } }),
  react: (id: string, messageId: number, emoji: string) => post<{ reactions: Reaction[] }>(`${conv(id)}/messages/${messageId}/reactions`, { emoji }),
  checklist: (id: string, messageId: number, index: number, done: boolean) =>
    post<{ payload: Payload }>(`${conv(id)}/messages/${messageId}/checklist`, { index, done }),

  // ---- tuỳ chọn hội thoại
  pin: (id: string, value: boolean) => post<ChatConversation>(`${conv(id)}/pin`, { value }),
  mute: (id: string, value: boolean) => post<ChatConversation>(`${conv(id)}/mute`, { value }),
  pinMessage: (id: string, messageId: number | null) => post<ChatConversation>(`${conv(id)}/pinned-message`, { messageId }),
  block: (id: string, value: boolean) => post<ChatConversation>(`${conv(id)}/block`, { value }),
  report: (id: string, reason: string) => post<{ conversationId: string; ticketCode: string }>(`${conv(id)}/report`, { reason }),

  // ---- phiếu hỗ trợ
  createTicket: (r: { subject: string; category?: string; priority?: string; body?: string }) =>
    post<{ conversationId: string; ticketCode: string }>('/api/business-chat/tickets', r),
  callback: (id: string) => post<ChatConversation>(`${conv(id)}/callback`),
  closeTicket: (id: string) => post<ChatConversation>(`${conv(id)}/close`),
  rate: (id: string, score: number, comment?: string) => post<ChatConversation>(`${conv(id)}/rating`, { score, comment }),
  supportStatus: () => call<SupportStatus>('/api/business-chat/support/status'),
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

/**
 * Chatbot tư vấn pháp luật: POST /api/chat?message= của vcci-livestream-chat (chuyển tiếp sang vcci-legal-ai).
 * Cần đăng nhập (Bearer token portal). 429 = hỏi quá nhanh, 503 = admin đang tắt, 502 = dịch vụ không khả dụng.
 */
export interface LegalAiSource { title?: string | null; sectionTitle?: string | null; fileName?: string | null; similarity?: number | null }
export interface LegalAiAnswer { answer: string; sources?: LegalAiSource[] | null }

export const legalAiApi = {
  /** language: ngôn ngữ người dùng đang chọn trên hệ thống, câu trả lời sẽ theo ngôn ngữ này. */
  ask: (message: string, language: string) => call<LegalAiAnswer>('/api/chat', { method: 'POST', query: { message, language } }),
}
