import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { B2B, CHAT_SOCKET_URL, ChatSocket, SUPPORT, chatApi, newClientId } from '@/api/chat'
import type { BizEnvelope, ChatConversation, ChatMe, ChatMessageDto, MessageKind, Payload, Reaction, ReplyRef, SocketState } from '@/api/chat'

/** Tin trên widget / trang Tin nhắn (gộp lịch sử REST + realtime + bong bóng tạm). */
export interface WidgetMsg {
  key: string
  serverId?: number
  seq?: number
  clientId?: string
  text: string
  at: number
  mine: boolean
  senderKind: string
  senderName?: string | null
  system?: string | null
  state: 'pending' | 'sent' | 'failed'
  kind: MessageKind
  payload?: Payload | null
  replyTo?: ReplyRef | null
  reactions?: Reaction[]
}

const PAGE = 50
const ACK_TIMEOUT = 8000
const OPEN_B2B = 'vcci:chat-b2b'

/** Mở widget chat ở kênh B2B với doanh nghiệp `businessId` (nút "Chat ngay" / "Nhắn tin" ở trang sản phẩm, nhà cung cấp). */
export const openB2bChat = (businessId: string) => window.dispatchEvent(new CustomEvent(OPEN_B2B, { detail: businessId }))

export function onOpenB2bChat(fn: (businessId: string, draft?: string) => void) {
  const h = (e: Event) => {
    const d = (e as CustomEvent<string | { businessId: string; draft?: string }>).detail
    if (typeof d === 'string') fn(d)
    else fn(d.businessId, d.draft)
  }
  window.addEventListener(OPEN_B2B, h)
  return () => window.removeEventListener(OPEN_B2B, h)
}

const kindOf = (k?: string | null): MessageKind => (k ?? 'TEXT') as MessageKind

const fromDto = (m: ChatMessageDto, ids: Set<string>): WidgetMsg => ({
  key: `s-${m.messageId}`,
  serverId: m.messageId,
  seq: m.seq,
  clientId: m.clientMessageId ?? undefined,
  text: m.body ?? '',
  at: Date.parse(m.createdAtIso) || Date.now(),
  mine: !!m.principalId && ids.has(m.principalId) && m.senderKind !== 'SYSTEM',
  senderKind: m.senderKind,
  senderName: m.senderName,
  system: m.senderKind === 'SYSTEM' ? m.systemEvent ?? 'INFO' : null,
  state: 'sent',
  kind: kindOf(m.messageKind),
  payload: m.payload,
  replyTo: m.replyTo,
  reactions: m.reactions ?? [],
})

const fromEnv = (e: BizEnvelope, ids: Set<string>): WidgetMsg => ({
  key: e.serverMessageId != null ? `s-${e.serverMessageId}` : `e-${e.epochMs}`,
  serverId: e.serverMessageId ?? undefined,
  seq: e.seq,
  clientId: e.clientMessageId ?? undefined,
  text: e.body ?? '',
  at: e.epochMs || Date.now(),
  mine: !!e.principalId && ids.has(e.principalId) && e.senderKind !== 'SYSTEM',
  senderKind: e.senderKind,
  senderName: e.senderName,
  system: e.senderKind === 'SYSTEM' ? e.systemEvent ?? 'INFO' : null,
  state: 'sent',
  kind: kindOf(e.messageKind),
  payload: e.payload,
  replyTo: e.replyTo,
  reactions: [],
})

function merge(list: WidgetMsg[], m: WidgetMsg): WidgetMsg[] {
  if (m.serverId != null && list.some((x) => x.serverId === m.serverId)) {
    return m.clientId ? list.filter((x) => !(x.serverId == null && x.clientId === m.clientId)) : list
  }
  if (m.clientId) {
    const ix = list.findIndex((x) => x.clientId === m.clientId && x.serverId == null)
    if (ix >= 0) {
      const next = [...list]
      next[ix] = { ...m, mine: true }
      return next
    }
  }
  return [...list, m].sort((a, b) => (a.seq ?? Number.MAX_SAFE_INTEGER) - (b.seq ?? Number.MAX_SAFE_INTEGER) || a.at - b.at)
}

const byActivity = (a: ChatConversation, b: ChatConversation) =>
  (Date.parse(b.lastActivityAt ?? b.createdAt ?? '') || 0) - (Date.parse(a.lastActivityAt ?? a.createdAt ?? '') || 0)

/**
 * Trạng thái chat thật cho doanh nghiệp đã đăng nhập (widget + trang Tin nhắn). Một socket cho cả phiên (vào room
 * biz:<orgId> để nhận bizInbox -> badge chưa đọc kể cả khi đóng); hội thoại đang mở thì bizJoin.
 */
export function useBizChat(enabled: boolean, open: boolean) {
  const [me, setMe] = useState<ChatMe | null>(null)
  const [convs, setConvs] = useState<ChatConversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<WidgetMsg[]>([])
  const [hasOlder, setHasOlder] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [socketState, setSocketState] = useState<SocketState>('idle')
  const [typing, setTyping] = useState<string | null>(null)
  const [otherReadSeq, setOtherReadSeq] = useState(0)
  const [unread, setUnread] = useState(0)

  const sockRef = useRef<ChatSocket | null>(null)
  const idsRef = useRef<Set<string>>(new Set())
  const activeRef = useRef<string | null>(null)
  const openRef = useRef(open)
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTyping = useRef(0)

  useEffect(() => {
    openRef.current = open
  }, [open])
  useEffect(() => {
    activeRef.current = activeId
  }, [activeId])

  const ids = useMemo(() => new Set(me?.principalIds ?? []), [me])
  useEffect(() => {
    idsRef.current = ids
  }, [ids])

  // phiếu hỗ trợ (mới trước); "support" = phiếu đang mở gần nhất
  const tickets = useMemo(() => convs.filter((c) => c.channel === SUPPORT).sort(byActivity), [convs])
  const support = tickets.find((c) => c.status === 'OPEN') ?? null
  const b2b = useMemo(() => convs.filter((c) => c.channel === B2B).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || byActivity(a, b)), [convs])

  // ---- danh tính + danh sách + số chưa đọc ban đầu
  // đăng xuất -> xoá trạng thái chat của phiên trước (chỉ khi chuyển enabled true -> false)
  const [wasEnabled, setWasEnabled] = useState(enabled)
  if (wasEnabled !== enabled) {
    setWasEnabled(enabled)
    if (!enabled) {
      setMe(null)
      setConvs([])
      setMessages([])
      setActiveId(null)
      setUnread(0)
    }
  }

  useEffect(() => {
    if (!enabled) return
    let alive = true
    chatApi
      .me()
      .then(async (m) => {
        if (!alive) return
        setMe(m)
        if (!m.organizationId) return
        const [rows, u] = await Promise.all([chatApi.conversations(), chatApi.unreadCount().catch(() => ({ total: 0 }))])
        if (!alive) return
        setConvs(rows)
        setUnread(u.total)
      })
      .catch((e) => alive && setError(String((e as Error).message ?? e)))
    return () => {
      alive = false
    }
  }, [enabled])

  const markRead = useCallback((cid: string) => {
    chatApi
      .read(cid)
      .then(() => chatApi.unreadCount().then((u) => setUnread(u.total)))
      .catch(() => undefined)
  }, [])

  /** Nạp lại tóm tắt một hội thoại (sau ghim / chặn / đánh giá / đổi trạng thái). */
  const refreshConversation = useCallback(async (cid: string) => {
    try {
      const c = await chatApi.conversation(cid)
      setConvs((rows) => (rows.some((r) => r.id === cid) ? rows.map((r) => (r.id === cid ? c : r)) : [c, ...rows]))
      return c
    } catch {
      return null
    }
  }, [])

  const settle = useCallback((env: BizEnvelope) => {
    const c = env.clientMessageId ?? ''
    if (c && timers.current[c]) {
      clearTimeout(timers.current[c])
      delete timers.current[c]
    }
    if (String(env.conversationId) === activeRef.current) setMessages((l) => merge(l, fromEnv(env, idsRef.current)))
    if (env.conversationStatus) setConvs((rows) => rows.map((r) => (r.id === String(env.conversationId) ? { ...r, status: env.conversationStatus } : r)))
  }, [])

  // ---- socket
  useEffect(() => {
    if (!enabled || !me?.organizationId || !CHAT_SOCKET_URL) return
    const s = new ChatSocket(CHAT_SOCKET_URL)
    let first = true
    s.on('state', ((st: SocketState) => setSocketState(st)) as never)
      .on('connect', () => {
        const cid = activeRef.current
        if (cid) s.emit('bizJoin', { conversationId: cid })
        if (!first && cid) {
          chatApi
            .messages(cid, PAGE)
            .then((rows) => setMessages((l) => rows.reduce((acc, m) => merge(acc, fromDto(m, idsRef.current)), l)))
            .catch(() => undefined)
        }
        first = false
      })
      .on('bizAck', ((env: BizEnvelope) => settle(env)) as never)
      .on('bizMessage', ((env: BizEnvelope) => {
        const cid = String(env.conversationId)
        if (cid !== activeRef.current) return
        setMessages((l) => merge(l, fromEnv(env, idsRef.current)))
        if (env.senderKind !== 'SYSTEM') setTyping(null)
        if (env.conversationStatus) setConvs((rows) => rows.map((r) => (r.id === cid ? { ...r, status: env.conversationStatus } : r)))
        if (openRef.current && env.principalId && !idsRef.current.has(env.principalId)) markRead(cid)
      }) as never)
      .on('bizReaction', ((e: { conversationId: string; messageId: number; reactions: Reaction[] }) => {
        if (String(e.conversationId) !== activeRef.current) return
        setMessages((l) => l.map((m) => (m.serverId === e.messageId ? { ...m, reactions: e.reactions } : m)))
      }) as never)
      .on('bizMessageUpdated', ((e: { conversationId: string; messageId: number; payload: Payload }) => {
        if (String(e.conversationId) !== activeRef.current) return
        setMessages((l) => l.map((m) => (m.serverId === e.messageId ? { ...m, payload: e.payload } : m)))
      }) as never)
      .on('bizInbox', ((e: { conversationId: string; principalId?: string; preview?: string; epochMs: number; status?: string }) => {
        const cid = String(e.conversationId)
        const fromMe = !!e.principalId && idsRef.current.has(e.principalId)
        setConvs((rows) => {
          if (!rows.some((r) => r.id === cid)) {
            chatApi.conversations().then(setConvs).catch(() => undefined)
            return rows
          }
          return rows.map((r) => (r.id === cid ? { ...r, lastPreviewText: e.preview ?? r.lastPreviewText, lastActivityAt: new Date(e.epochMs).toISOString(), status: e.status ?? r.status } : r))
        })
        if (!fromMe && !(openRef.current && cid === activeRef.current)) setUnread((u) => u + 1)
      }) as never)
      .on('bizConversation', ((e: { conversationId: string; status: string }) => {
        const cid = String(e.conversationId)
        setConvs((rows) => rows.map((r) => (r.id === cid ? { ...r, status: e.status } : r)))
        void refreshConversation(cid)
      }) as never)
      .on('bizRead', ((e: { conversationId: string; principalId: string; lastReadSeq: number }) => {
        if (String(e.conversationId) !== activeRef.current || idsRef.current.has(e.principalId)) return
        setOtherReadSeq((v) => Math.max(v, e.lastReadSeq ?? 0))
      }) as never)
      .on('bizTyping', ((e: { conversationId: string; principalId: string; name?: string }) => {
        if (String(e.conversationId) !== activeRef.current || idsRef.current.has(e.principalId)) return
        setTyping(e.name || '…')
        if (typingTimer.current) clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => setTyping(null), 3500)
      }) as never)
      .on('bizError', ((p: { message?: string; clientMessageId?: string }) => {
        const c = p?.clientMessageId
        if (c) {
          if (timers.current[c]) clearTimeout(timers.current[c])
          delete timers.current[c]
          setMessages((l) => l.map((m) => (m.clientId === c && m.serverId == null ? { ...m, state: 'failed' } : m)))
        }
        setError(p?.message ?? null)
      }) as never)
    s.connect()
    sockRef.current = s
    const pending = timers.current
    return () => {
      s.close()
      sockRef.current = null
      Object.values(pending).forEach(clearTimeout)
    }
  }, [enabled, me?.organizationId, markRead, settle, refreshConversation])

  // ---- mở hội thoại
  const activate = useCallback(
    async (cid: string | null) => {
      const prev = activeRef.current
      if (prev && prev !== cid) sockRef.current?.emit('bizLeave', { conversationId: prev })
      activeRef.current = cid
      setActiveId(cid)
      setMessages([])
      setOtherReadSeq(0)
      setTyping(null)
      setHasOlder(false)
      if (!cid) return
      setLoading(true)
      setError(null)
      try {
        await chatApi.join(cid)
        const rows = await chatApi.messages(cid, PAGE)
        if (activeRef.current !== cid) return
        setMessages(rows.map((m) => fromDto(m, idsRef.current)))
        setHasOlder(rows.length >= PAGE)
        sockRef.current?.emit('bizJoin', { conversationId: cid })
        if (openRef.current) markRead(cid)
      } catch (e) {
        setError(String((e as Error).message ?? e))
      } finally {
        setLoading(false)
      }
    },
    [markRead],
  )

  /** Mở (hoặc tạo) hội thoại B2B với DN khác rồi chuyển vào hội thoại đó. */
  const startB2b = useCallback(
    async (otherBusinessId: string) => {
      if (!me?.organizationId) return
      setError(null)
      try {
        const { conversationId } = await chatApi.ensureB2b(me.organizationId, otherBusinessId, me.principalId)
        setConvs(await chatApi.conversations())
        await activate(conversationId)
      } catch (e) {
        setError(String((e as Error).message ?? e))
      }
    },
    [me, activate],
  )

  /** Phiếu hỗ trợ mới (tiêu đề + lĩnh vực + nội dung đầu tiên) rồi mở phiếu đó. */
  const newTicket = useCallback(
    async (r: { subject: string; category?: string; body?: string }) => {
      setError(null)
      try {
        const { conversationId } = await chatApi.createTicket(r)
        setConvs(await chatApi.conversations())
        await activate(conversationId)
        return conversationId
      } catch (e) {
        setError(String((e as Error).message ?? e))
        return null
      }
    },
    [activate],
  )

  // mở widget -> đánh dấu đã đọc hội thoại đang xem
  useEffect(() => {
    if (open && activeId) markRead(activeId)
  }, [open, activeId, markRead])

  const loadOlder = useCallback(async () => {
    const cid = activeRef.current
    const first = messages.find((m) => m.seq != null)?.seq
    if (!cid || !first) return
    const rows = await chatApi.messages(cid, PAGE, first)
    setMessages((l) => rows.reduce((acc, m) => merge(acc, fromDto(m, idsRef.current)), l))
    setHasOlder(rows.length >= PAGE)
  }, [messages])

  const restSend = useCallback(
    (cid: string, body: string, clientId: string) => {
      chatApi
        .send(cid, body, clientId)
        .then(settle)
        .catch(() => setMessages((l) => l.map((m) => (m.clientId === clientId && m.serverId == null ? { ...m, state: 'failed' } : m))))
    },
    [settle],
  )

  /** Bong bóng tạm khi chờ server (tin chữ / tệp đang tải). */
  const pendingBubble = (clientId: string, text: string, kind: MessageKind = 'TEXT', payload?: Payload, replyTo?: ReplyRef | null): WidgetMsg => ({
    key: `t-${clientId}`, clientId, text, at: Date.now(), mine: true, senderKind: 'PORTAL_BUSINESS_USER', state: 'pending', kind, payload, replyTo, reactions: [],
  })

  /**
   * Gửi tin chữ; chưa có hội thoại (kênh hỗ trợ) thì mở phiếu mới lấy câu đầu làm tiêu đề. Có trích dẫn thì đi REST
   * (socket chỉ nhận tin chữ thường).
   */
  const send = useCallback(
    async (body: string, retryId?: string, reply?: ReplyRef | null) => {
      const text = body.trim()
      if (!text) return
      let cid = activeRef.current
      const clientId = retryId ?? newClientId()
      setMessages((l) =>
        retryId ? l.map((m) => (m.clientId === retryId && m.serverId == null ? { ...m, state: 'pending' } : m)) : [...l, pendingBubble(clientId, text, 'TEXT', undefined, reply)],
      )
      try {
        if (!cid) {
          const subject = text.length > 80 ? `${text.slice(0, 77)}…` : text
          const { conversationId } = await chatApi.createTicket({ subject, category: 'OTHER' })
          cid = conversationId
          activeRef.current = cid
          setActiveId(cid)
          setConvs(await chatApi.conversations())
          sockRef.current?.emit('bizJoin', { conversationId: cid })
        }
      } catch (e) {
        setError(String((e as Error).message ?? e))
        setMessages((l) => l.map((m) => (m.clientId === clientId ? { ...m, state: 'failed' } : m)))
        return
      }
      if (reply) {
        chatApi
          .sendRich(cid, { kind: 'TEXT', body: text, replyToMessageId: reply.messageId, clientMessageId: clientId })
          .then(settle)
          .catch((e) => {
            setError(String((e as Error).message ?? e))
            setMessages((l) => l.map((m) => (m.clientId === clientId && m.serverId == null ? { ...m, state: 'failed' } : m)))
          })
        return
      }
      const s = sockRef.current
      if (s?.connected && s.emit('bizSend', { conversationId: cid, body: text, clientMessageId: clientId })) {
        const target = cid
        timers.current[clientId] = setTimeout(() => {
          delete timers.current[clientId]
          restSend(target, text, clientId)
        }, ACK_TIMEOUT)
      } else {
        restSend(cid, text, clientId)
      }
    },
    [restSend, settle],
  )

  /** Tin nhiều dạng (thẻ sản phẩm, RFQ, lịch hẹn, liên kết) vào hội thoại đang mở. */
  const sendRich = useCallback(
    async (kind: MessageKind, payload: Payload, body?: string, reply?: ReplyRef | null) => {
      const cid = activeRef.current
      if (!cid) return false
      setError(null)
      try {
        settle(await chatApi.sendRich(cid, { kind, payload, body, replyToMessageId: reply?.messageId ?? null, clientMessageId: newClientId() }))
        return true
      } catch (e) {
        setError(String((e as Error).message ?? e))
        return false
      }
    },
    [settle],
  )

  /** Gửi tệp / ảnh / ghi âm vào hội thoại đang mở. */
  const sendFile = useCallback(
    async (file: Blob, name: string, reply?: ReplyRef | null) => {
      const cid = activeRef.current
      if (!cid) return
      const clientId = newClientId()
      setMessages((l) => [...l, pendingBubble(clientId, '', 'ATTACHMENT', { name, size: file.size, contentType: file.type }, reply)])
      try {
        settle(await chatApi.uploadFile(cid, file, name, { clientMessageId: clientId, replyToMessageId: reply?.messageId ?? null }))
      } catch (e) {
        setError(String((e as Error).message ?? e))
        setMessages((l) => l.filter((m) => m.clientId !== clientId))
      }
    },
    [settle],
  )

  const react = useCallback(async (messageId: number, emoji: string) => {
    const cid = activeRef.current
    if (!cid) return
    try {
      const r = await chatApi.react(cid, messageId, emoji)
      setMessages((l) => l.map((m) => (m.serverId === messageId ? { ...m, reactions: r.reactions } : m)))
    } catch (e) {
      setError(String((e as Error).message ?? e))
    }
  }, [])

  const toggleChecklist = useCallback(async (messageId: number, index: number, done: boolean) => {
    const cid = activeRef.current
    if (!cid) return
    try {
      const r = await chatApi.checklist(cid, messageId, index, done)
      setMessages((l) => l.map((m) => (m.serverId === messageId ? { ...m, payload: r.payload } : m)))
    } catch (e) {
      setError(String((e as Error).message ?? e))
    }
  }, [])

  const notifyTyping = useCallback(() => {
    const cid = activeRef.current
    const now = Date.now()
    if (!cid || now - lastTyping.current < 2500) return
    lastTyping.current = now
    sockRef.current?.emit('bizTyping', { conversationId: cid })
  }, [])

  return {
    me, convs, tickets, support, b2b, activeId, activate, startB2b, newTicket, refreshConversation, messages, hasOlder, loadOlder,
    loading, error, setError, socketState, typing, otherReadSeq, unread, send, sendRich, sendFile, react, toggleChecklist,
    notifyTyping,
  }
}

export type BizChat = ReturnType<typeof useBizChat>
