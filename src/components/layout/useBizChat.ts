import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { B2B, CHAT_SOCKET_URL, ChatSocket, SUPPORT, chatApi, newClientId } from '@/api/chat'
import type { BizEnvelope, ChatConversation, ChatMe, ChatMessageDto, SocketState } from '@/api/chat'

/** Tin trên widget (gộp lịch sử REST + realtime + bong bóng tạm). */
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
}

const PAGE = 50
const ACK_TIMEOUT = 8000

const fromDto = (m: ChatMessageDto, ids: Set<string>): WidgetMsg => ({
  key: `s-${m.messageId}`,
  serverId: m.messageId,
  seq: m.seq,
  clientId: m.clientMessageId ?? undefined,
  text: m.body,
  at: Date.parse(m.createdAtIso) || Date.now(),
  mine: !!m.principalId && ids.has(m.principalId) && m.senderKind !== 'SYSTEM',
  senderKind: m.senderKind,
  senderName: m.senderName,
  system: m.senderKind === 'SYSTEM' ? m.systemEvent ?? 'INFO' : null,
  state: 'sent',
})

const fromEnv = (e: BizEnvelope, ids: Set<string>): WidgetMsg => ({
  key: e.serverMessageId != null ? `s-${e.serverMessageId}` : `e-${e.epochMs}`,
  serverId: e.serverMessageId ?? undefined,
  seq: e.seq,
  clientId: e.clientMessageId ?? undefined,
  text: e.body,
  at: e.epochMs || Date.now(),
  mine: !!e.principalId && ids.has(e.principalId) && e.senderKind !== 'SYSTEM',
  senderKind: e.senderKind,
  senderName: e.senderName,
  system: e.senderKind === 'SYSTEM' ? e.systemEvent ?? 'INFO' : null,
  state: 'sent',
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

/**
 * Trạng thái chat thật của ChatWidget cho doanh nghiệp đã đăng nhập. Một socket cho cả phiên (vào room biz:<orgId>
 * để nhận bizInbox -> badge chưa đọc kể cả khi widget đóng); hội thoại đang mở thì bizJoin.
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

  const support = convs.find((c) => c.channel === SUPPORT) ?? null
  const b2b = convs.filter((c) => c.channel === B2B)

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
        setConvs((rows) => rows.map((r) => (r.id === String(e.conversationId) ? { ...r, status: e.status } : r)))
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
  }, [enabled, me?.organizationId, markRead, settle])

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

  /** Gửi tin; kênh hỗ trợ chưa có hội thoại thì tạo (ensure) trước. */
  const send = useCallback(
    async (body: string, retryId?: string) => {
      const text = body.trim()
      if (!text) return
      let cid = activeRef.current
      const clientId = retryId ?? newClientId()
      setMessages((l) =>
        retryId
          ? l.map((m) => (m.clientId === retryId && m.serverId == null ? { ...m, state: 'pending' } : m))
          : [...l, { key: `t-${clientId}`, clientId, text, at: Date.now(), mine: true, senderKind: 'PORTAL_BUSINESS_USER', state: 'pending' }],
      )
      try {
        if (!cid) {
          const { conversationId } = await chatApi.ensureSupport()
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
    [restSend],
  )

  const notifyTyping = useCallback(() => {
    const cid = activeRef.current
    const now = Date.now()
    if (!cid || now - lastTyping.current < 2500) return
    lastTyping.current = now
    sockRef.current?.emit('bizTyping', { conversationId: cid })
  }, [])

  return { me, convs, support, b2b, activeId, activate, messages, hasOlder, loadOlder, loading, error, setError, socketState, typing, otherReadSeq, unread, send, notifyTyping }
}
