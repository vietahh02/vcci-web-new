/**
 * Khung player của khung ra mắt TỰ CHỨA (CR-2026-015): hỏi trạng thái định kỳ qua /api/public/show-launch/{slotId}.
 * LIVESTREAM: HLS trực tiếp khi LIVE (host phát qua Jibri/SRS). WEBINAR: vào thẳng phòng Jitsi dự thính (OBSERVER),
 * không có khái niệm đăng ký/joinKey/PARTICIPANT như webinar kiến trúc cũ (WebinarStage).
 */
import { CalendarClock, CircleOff, Radio, UserRound, WifiOff } from 'lucide-react'
import { useEffect, useEffectEvent, useRef, useState, type FormEvent } from 'react'
import { ApiError } from '@/api/http'
import { getShowLaunchObserverToken, getShowLaunchRoom, type JitsiToken, type LiveStatus, type ShowLaunchRoomInfo } from '@/api/liveApi'
import { Button } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { HlsPlayer, ReplayPlayer } from './HlsPlayer'
import { JitsiRoom } from './JitsiRoom'
import { liveText } from './liveText'
import { StagePlaceholder } from './StagePlaceholder'

const POLL_LIVE_MS = 15_000
const POLL_WAITING_MS = 10_000
const POLL_ENDED_MS = 30_000
const RETRY_STREAM_MS = 4_000
const MAX_STREAM_FAILS = 5

const inputClass = 'h-10 w-full rounded-lg bg-white/10 px-3 text-sm text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-primary'

export function SelfContainedLaunchStage({ slotId, mode, poster, recordingUrl, onRoom, onRole }: {
  slotId: string
  mode: 'LIVESTREAM' | 'WEBINAR'
  poster?: string
  recordingUrl?: string | null
  onRoom: (room: { status: LiveStatus | null; sessionId: string | null }) => void
  onRole?: (role: 'OBSERVER' | null) => void
}) {
  useI18n()
  const lt = liveText()
  const [info, setInfo] = useState<ShowLaunchRoomInfo | null>(null)
  const [phase, setPhase] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  // chỉ WEBINAR: tên dự thính đã nhập -> xin token -> vào phòng
  const [name, setName] = useState('')
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [token, setToken] = useState<JitsiToken | null>(null)
  const [tokenError, setTokenError] = useState<string>()
  const [jitsiFailed, setJitsiFailed] = useState(false)
  const [left, setLeft] = useState(false)
  // chỉ LIVESTREAM: thử lại khi mất luồng HLS
  const [fails, setFails] = useState(0)
  const [waitRetry, setWaitRetry] = useState(false)
  const [playerKey, setPlayerKey] = useState(0)
  const report = useEffectEvent(onRoom)
  const reportRole = useEffectEvent((r: 'OBSERVER' | null) => onRole?.(r))
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const tick = async () => {
      let next = POLL_WAITING_MS
      try {
        const r = await getShowLaunchRoom(slotId)
        if (stopped) return
        setInfo(r)
        setPhase('ready')
        report({ status: r.status, sessionId: null })
        if (r.status === 'LIVE') next = POLL_LIVE_MS
        if (r.status === 'ENDED') next = POLL_ENDED_MS
      } catch (e) {
        if (stopped) return
        const missing = e instanceof ApiError && e.code === 'E003' && e.status !== 404
        setPhase((p) => (p === 'ready' && !missing ? p : missing ? 'missing' : 'error'))
      }
      timer = setTimeout(() => void tick(), next)
    }
    void tick()
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [slotId, attempt])

  useEffect(() => () => clearTimeout(retryTimer.current), [])
  useEffect(() => {
    if (mode !== 'WEBINAR') return
    reportRole(token ? 'OBSERVER' : null)
  }, [mode, token])

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
  if (phase === 'missing' || !info) return <StagePlaceholder poster={poster} icon={CircleOff} alert title={lt.sessionMissing} />

  if (info.status === 'ENDED') {
    const url = info.vodUrl ?? recordingUrl
    return url ? <ReplayPlayer url={url} /> : <StagePlaceholder poster={poster} icon={CircleOff} title={lt.ended} hint={lt.endedNoVod} />
  }
  if (info.status !== 'LIVE') return <StagePlaceholder poster={poster} icon={CalendarClock} title={lt.notStarted} hint={lt.notStartedHint} />

  if (mode === 'LIVESTREAM') {
    if (!info.watchUrl) return <StagePlaceholder poster={poster} icon={Radio} busy title={lt.waitingHost} hint={lt.waitingHostHint} />
    if (fails >= MAX_STREAM_FAILS) return <StagePlaceholder poster={poster} icon={WifiOff} alert title={lt.streamError} hint={lt.connectErrorHint}>{retryButton}</StagePlaceholder>
    if (waitRetry) return <StagePlaceholder poster={poster} busy title={lt.reconnecting} />
    const onFatal = () => {
      setFails((n) => n + 1)
      setWaitRetry(true)
      retryTimer.current = setTimeout(() => {
        setWaitRetry(false)
        setPlayerKey((k) => k + 1)
      }, RETRY_STREAM_MS)
    }
    return <HlsPlayer key={playerKey} src={info.watchUrl} onFatal={onFatal} onPlaying={() => setFails(0)} />
  }

  // WEBINAR tự chứa: vào thẳng phòng Jitsi dự thính, không cần tài khoản/đăng ký
  if (left) return <StagePlaceholder poster={poster} icon={UserRound} title={lt.leftRoom}><Button variant="white" className="mt-2" onClick={() => { setLeft(false); setToken(null) }}>{lt.rejoin}</Button></StagePlaceholder>
  if (jitsiFailed) return <StagePlaceholder poster={poster} icon={WifiOff} alert title={lt.jitsiLoadError} hint={lt.connectErrorHint}><Button variant="white" className="mt-2" onClick={() => { setJitsiFailed(false); setToken(null) }}>{lt.retry}</Button></StagePlaceholder>
  if (token) return <JitsiRoom roomName={token.roomName} jwt={token.token} role="OBSERVER" displayName={name} onLoadError={() => setJitsiFailed(true)} onLeft={() => setLeft(true)} />

  const join = async (e: FormEvent) => {
    e.preventDefault()
    const n = input.trim()
    if (!n || busy) return
    setBusy(true)
    setTokenError(undefined)
    try {
      setToken(await getShowLaunchObserverToken(slotId, n))
      setName(n)
    } catch (err) {
      setTokenError(err instanceof ApiError ? err.message : undefined)
    } finally {
      setBusy(false)
    }
  }
  return (
    <StagePlaceholder poster={poster} icon={UserRound} title={lt.observerTitle} hint={lt.observerHint}>
      <form onSubmit={(e) => void join(e)} className="mt-2 flex w-full max-w-xs flex-col gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={50} placeholder={lt.observerName} aria-label={lt.observerName} className={inputClass} />
        {tokenError && <p role="alert" className="text-xs text-amber-300">{tokenError}</p>}
        <Button type="submit" variant="gold" disabled={busy || !input.trim()}>{lt.observerJoin}</Button>
      </form>
    </StagePlaceholder>
  )
}
