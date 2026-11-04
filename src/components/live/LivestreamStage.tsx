/** Khung player của phiên LIVESTREAM. Hỏi trạng thái phiên định kỳ qua REST; chỉ nạp HLS khi LIVE và đã có tín hiệu từ host. */
import { CalendarClock, CircleOff, Radio, WifiOff } from 'lucide-react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { ApiError } from '@/api/http'
import { getLiveSession, listLiveSessions, pickSession, type LiveSession, type LiveStatus } from '@/api/liveApi'
import { Button } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { HlsPlayer, ReplayPlayer } from './HlsPlayer'
import { liveText } from './liveText'
import { StagePlaceholder } from './StagePlaceholder'

const POLL_LIVE_MS = 15_000
const POLL_WAITING_MS = 10_000
const POLL_ENDED_MS = 30_000
const RETRY_STREAM_MS = 4_000
const MAX_STREAM_FAILS = 3

export function LivestreamStage({ eventId, sessionId, poster, recordingUrl, onRoom }: {
  eventId: string
  sessionId?: string
  poster?: string
  recordingUrl?: string | null
  onRoom: (room: { status: LiveStatus | null; sessionId: string | null }) => void
}) {
  useI18n()
  const lt = liveText()
  const [session, setSession] = useState<LiveSession | null>(null)
  const [phase, setPhase] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const [fails, setFails] = useState(0)
  const [waitRetry, setWaitRetry] = useState(false)
  const [playerKey, setPlayerKey] = useState(0)
  const report = useEffectEvent(onRoom)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const tick = async () => {
      let next = POLL_WAITING_MS
      try {
        const s = sessionId ? await getLiveSession(sessionId) : pickSession(await listLiveSessions(eventId))
        if (stopped) return
        setSession(s)
        setPhase('ready')
        report({ status: s?.status ?? null, sessionId: s?.id ?? null })
        if (s?.status === 'LIVE' && s.ingestActive) next = POLL_LIVE_MS
        if (s?.status === 'ENDED') {
          if (s.vodUrl || recordingUrl) return
          next = POLL_ENDED_MS
        }
      } catch (e) {
        if (stopped) return
        // Đã có dữ liệu thì giữ hình đang phát, lần hỏi sau tự hồi phục
        const missing = e instanceof ApiError && e.code === 'E003'
        setPhase((p) => (p === 'ready' && !missing ? p : missing ? 'missing' : 'error'))
      }
      timer = setTimeout(() => void tick(), next)
    }
    void tick()
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [eventId, sessionId, recordingUrl, attempt])

  useEffect(() => () => clearTimeout(retryTimer.current), [])

  const onFatal = () => {
    setFails((n) => n + 1)
    setWaitRetry(true)
    retryTimer.current = setTimeout(() => {
      setWaitRetry(false)
      setPlayerKey((k) => k + 1)
    }, RETRY_STREAM_MS)
  }
  const retryAll = () => {
    setFails(0)
    setWaitRetry(false)
    setPlayerKey((k) => k + 1)
    setPhase('loading')
    setAttempt((a) => a + 1)
  }
  const retryButton = <Button variant="white" className="mt-2" onClick={retryAll}>{lt.retry}</Button>

  if (phase === 'loading') return <StagePlaceholder poster={poster} busy title={lt.loading} />
  if (phase === 'error') return <StagePlaceholder poster={poster} icon={WifiOff} alert title={lt.connectError} hint={lt.connectErrorHint}>{retryButton}</StagePlaceholder>
  if (phase === 'missing') return <StagePlaceholder poster={poster} icon={CircleOff} alert title={lt.sessionMissing} />

  if (session?.status === 'ENDED') {
    const url = session.vodUrl ?? recordingUrl
    return url ? <ReplayPlayer url={url} /> : <StagePlaceholder poster={poster} icon={CircleOff} title={lt.ended} hint={lt.endedNoVod} />
  }
  if (session?.status !== 'LIVE') return <StagePlaceholder poster={poster} icon={CalendarClock} title={lt.notStarted} hint={lt.notStartedHint} />
  if (!session.ingestActive || !session.watchUrl) return <StagePlaceholder poster={poster} icon={Radio} busy title={lt.waitingHost} hint={lt.waitingHostHint} />
  if (fails >= MAX_STREAM_FAILS) return <StagePlaceholder poster={poster} icon={WifiOff} alert title={lt.streamError} hint={lt.connectErrorHint}>{retryButton}</StagePlaceholder>
  if (waitRetry) return <StagePlaceholder poster={poster} busy title={lt.reconnecting} />
  return <HlsPlayer key={playerKey} src={session.watchUrl} onFatal={onFatal} onPlaying={() => setFails(0)} />
}
