/**
 * STOMP của chat phiên (vcci-livestream-chat `/ws/livestream-chat`). Dùng đường WebSocket thuần `/websocket` của endpoint SockJS
 * nên không cần sockjs-client. Không token hoặc token hỏng thì server coi là khách: vẫn nhận tin, không gửi được.
 * Trạng thái phiên KHÔNG có ở đây: `/topic/livestream-status` do live-service phát trên endpoint `/ws` riêng, phòng xem hỏi REST định kỳ.
 */
import type { Client, IMessage } from '@stomp/stompjs'
import { useEffect, useEffectEvent, useState } from 'react'
import { CHAT_URL } from '@/api/chat'
import { refreshOnce, tokens } from '@/api/http'
import { toChatMessage, type LiveChatMessage } from '@/api/liveApi'

export type StompState = 'idle' | 'connecting' | 'connected' | 'reconnecting'

export interface LiveStompHandlers {
  onMessage: (m: LiveChatMessage) => void
  onDeleted: (messageId: string) => void
  onViewers: (count: number) => void
  onBanned: () => void
  /** Mỗi lần nối (kể cả nối lại): nạp lại lịch sử để bù tin và tin bị xoá trong lúc mất kết nối. */
  onConnected: () => void
}

function stompUrl() {
  // Trang HTTPS không được nối ws:// (BR-LIVE-04 của Portal cũ)
  const base = typeof location !== 'undefined' && location.protocol === 'https:' ? CHAT_URL.replace(/^http:/, 'https:') : CHAT_URL
  return `${base.replace(/^http/, 'ws')}/ws/livestream-chat/websocket`
}

function expiresSoon(jwt: string) {
  try {
    const part = jwt.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/')
    const exp = (JSON.parse(atob(part)) as { exp?: number }).exp
    return typeof exp === 'number' && exp * 1000 < Date.now() + 30_000
  } catch {
    return false
  }
}

export function useLivestreamStomp(sessionId: string | null, loggedIn: boolean, handlers: LiveStompHandlers): StompState {
  const [state, setState] = useState<StompState>('connecting')
  const onMessage = useEffectEvent(handlers.onMessage)
  const onDeleted = useEffectEvent(handlers.onDeleted)
  const onViewers = useEffectEvent(handlers.onViewers)
  const onBanned = useEffectEvent(handlers.onBanned)
  const onConnected = useEffectEvent(handlers.onConnected)

  useEffect(() => {
    if (!sessionId || !CHAT_URL) return
    let stopped = false
    let client: Client | null = null

    void import('@stomp/stompjs').then(({ Client: StompClient, ReconnectionTimeMode }) => {
      if (stopped) return
      const json = (m: IMessage) => JSON.parse(m.body) as Record<string, unknown>
      let everConnected = false
      const c = new StompClient({
        brokerURL: stompUrl(),
        reconnectDelay: 3000,
        reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
        maxReconnectDelay: 30_000,
        heartbeatIncoming: 10_000,
        heartbeatOutgoing: 10_000,
        beforeConnect: async (cl) => {
          let at = tokens.access()
          if (at && expiresSoon(at) && (await refreshOnce())) at = tokens.access()
          cl.connectHeaders = at ? { Authorization: `Bearer ${at}` } : {}
        },
        onConnect: () => {
          everConnected = true
          setState('connected')
          c.subscribe(`/topic/livestream-chat/${sessionId}`, (m) => onMessage(toChatMessage(json(m))))
          c.subscribe(`/topic/livestream-chat-moderation/${sessionId}`, (m) => {
            const e = json(m)
            if (e.type === 'MESSAGE_DELETED') onDeleted(String(e.messageId))
          })
          c.subscribe(`/topic/livestream-viewers/${sessionId}`, (m) => {
            const n = json(m).viewerCount
            if (typeof n === 'number') onViewers(n)
          })
          if (loggedIn) {
            c.subscribe('/user/queue/livestream-chat/notices', (m) => {
              const e = json(m)
              if (e.type === 'BANNED' && String(e.sessionId) === sessionId) onBanned()
            })
          }
          onConnected()
        },
        onWebSocketClose: () => {
          if (!stopped) setState(everConnected ? 'reconnecting' : 'connecting')
        },
      })
      client = c
      c.activate()
    })

    return () => {
      stopped = true
      void client?.deactivate()
    }
  }, [sessionId, loggedIn])

  return sessionId && CHAT_URL ? state : 'idle'
}
