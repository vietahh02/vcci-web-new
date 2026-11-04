/**
 * Khung player của phiên WEBINAR. Vai do server quyết: đăng nhập gọi join-token (đăng ký APPROVED thành PARTICIPANT, còn lại OBSERVER);
 * khách nhập tên rồi gọi observer-token. Luồng clone từ webinar-room của Portal cũ, nhưng phân loại lỗi theo mã thay vì dò chữ trong message.
 */
import { CalendarClock, CircleOff, KeyRound, Settings2, UserRound, WifiOff, X } from 'lucide-react'
import { useEffect, useEffectEvent, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ApiError, tokens } from '@/api/http'
import { JITSI_DOMAIN, getJoinToken, getObserverToken, getWebinar, type JitsiRole, type JitsiToken, type LiveStatus, type WebinarInfo } from '@/api/liveApi'
import { Button } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { useProfile } from '@/lib/profile'
import { ReplayPlayer } from './HlsPlayer'
import { JitsiRoom } from './JitsiRoom'
import { liveText } from './liveText'
import { StagePlaceholder } from './StagePlaceholder'

const POLL_MS = 15_000
const POLL_ENDED_MS = 30_000

type View =
  | { k: 'loading' }
  | { k: 'config' }
  | { k: 'name'; error?: string }
  | { k: 'key'; error?: string }
  | { k: 'not-started' }
  | { k: 'ended' }
  | { k: 'room'; token: JitsiToken; name?: string }
  | { k: 'jitsi-error' }
  | { k: 'error'; message?: string }

const isEnded = (w: WebinarInfo) => w.status === 'ENDED' || w.roomClosed
const inputClass = 'h-10 w-full rounded-lg bg-white/10 px-3 text-sm text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-primary'

const REPORT: Partial<Record<View['k'], LiveStatus>> = { room: 'LIVE', 'not-started': 'SCHEDULED', ended: 'ENDED' }

export function WebinarStage({ eventId, poster, recordingUrl, onRole, onRoom }: {
  eventId: string
  poster?: string
  recordingUrl?: string | null
  onRole: (role: JitsiRole | null) => void
  onRoom: (room: { status: LiveStatus | null; sessionId: string | null }) => void
}) {
  useI18n()
  const lt = liveText()
  const { session } = useProfile()
  const location = useLocation()
  const loggedIn = !!session && !!tokens.access()
  const [view, setView] = useState<View>({ k: 'loading' })
  const [vod, setVod] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [input, setInput] = useState('')
  const [insecureSeen, setInsecureSeen] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const registration = useRef<string | null>(null)
  const reportRoom = useEffectEvent(onRoom)
  const reportRole = useEffectEvent(onRole)
  const companyName = session?.companyName

  useEffect(() => {
    reportRoom({ status: REPORT[view.k] ?? null, sessionId: null })
    reportRole(view.k === 'room' ? view.token.role : null)
  }, [view])

  const classify = (e: unknown, guest: boolean) => {
    const code = e instanceof ApiError ? e.code : ''
    const message = e instanceof ApiError ? e.message : undefined
    if (code === 'E007' || code === 'E003') return setView({ k: 'not-started' })
    if (!guest && (code === 'E004' || (e instanceof ApiError && e.status === 401))) return setView({ k: 'name' }) // tài khoản không thuộc tổ chức nào: chỉ dự thính
    if (code === 'E002' && !guest && registration.current === 'APPROVED') return setView({ k: 'key', error: message })
    if (code === 'E002') return setView(guest ? { k: 'name', error: message } : { k: 'error', message })
    return setView({ k: 'error' })
  }

  /** silent: lần hỏi định kỳ gặp lỗi mạng thì giữ nguyên màn đang hiện, không đá người xem khỏi màn chờ. */
  const enter = useEffectEvent(async (silent: boolean) => {
    let info: WebinarInfo
    try {
      info = await getWebinar(eventId)
    } catch (e) {
      if (e instanceof ApiError && e.code === 'E003') return setView({ k: 'error', message: lt.sessionMissing })
      if (!silent) setView({ k: 'error' })
      return
    }
    registration.current = info.registrationStatus
    setVod(info.vodUrl)
    if (isEnded(info)) return setView({ k: 'ended' })
    if (!JITSI_DOMAIN) return setView({ k: 'config' })
    if (!loggedIn) return setView(info.status === 'ONGOING' || info.roomOpened ? { k: 'name' } : { k: 'not-started' })
    try {
      setView({ k: 'room', token: await getJoinToken(eventId), name: companyName })
    } catch (e) {
      classify(e, false)
    }
  })

  useEffect(() => {
    void enter(false)
  }, [eventId, loggedIn, attempt])

  const retry = () => {
    setView({ k: 'loading' })
    setAttempt((a) => a + 1)
  }

  // Trong phòng: BTC đóng phòng thì rời. Chưa bắt đầu: tự vào khi phòng mở. Đã kết thúc: chờ bản ghi.
  useEffect(() => {
    if (view.k !== 'room' && view.k !== 'not-started' && !(view.k === 'ended' && !vod)) return
    const id = setInterval(() => {
      if (view.k === 'not-started') return void enter(true)
      getWebinar(eventId).then((w) => {
        setVod(w.vodUrl)
        if (view.k === 'room' && isEnded(w)) setView({ k: 'ended' })
      }, () => undefined)
    }, view.k === 'ended' ? POLL_ENDED_MS : POLL_MS)
    return () => clearInterval(id)
  }, [view.k, vod, eventId])

  const joinAsObserver = async (e: FormEvent) => {
    e.preventDefault()
    const name = input.trim()
    if (!name || busy) return
    setBusy(true)
    try {
      setView({ k: 'room', token: await getObserverToken(eventId, name), name })
    } catch (err) {
      classify(err, true)
    } finally {
      setBusy(false)
    }
  }

  const joinWithKey = async (e: FormEvent) => {
    e.preventDefault()
    const key = input.trim()
    if (!key || busy) return
    setBusy(true)
    try {
      setView({ k: 'room', token: await getJoinToken(eventId, key), name: companyName })
    } catch (err) {
      classify(err, false)
    } finally {
      setBusy(false)
    }
  }

  const replay = vod ?? recordingUrl
  switch (view.k) {
    case 'loading':
      return <StagePlaceholder poster={poster} busy title={lt.loading} />
    case 'config':
      return <StagePlaceholder poster={poster} icon={Settings2} alert title={lt.jitsiMissing} />
    case 'not-started':
      return <StagePlaceholder poster={poster} icon={CalendarClock} title={lt.notStarted} hint={lt.notStartedHint} />
    case 'ended':
      return replay ? <ReplayPlayer url={replay} /> : <StagePlaceholder poster={poster} icon={CircleOff} title={lt.ended} hint={lt.endedNoVod} />
    case 'jitsi-error':
      return <StagePlaceholder poster={poster} icon={WifiOff} alert title={lt.jitsiLoadError} hint={lt.connectErrorHint}><Button variant="white" className="mt-2" onClick={retry}>{lt.retry}</Button></StagePlaceholder>
    case 'error':
      return <StagePlaceholder poster={poster} icon={WifiOff} alert title={lt.connectError} hint={view.message ?? lt.connectErrorHint}><Button variant="white" className="mt-2" onClick={retry}>{lt.retry}</Button></StagePlaceholder>
    case 'name':
      return (
        <StagePlaceholder poster={poster} icon={UserRound} title={lt.observerTitle} hint={lt.observerHint}>
          <form onSubmit={(e) => void joinAsObserver(e)} className="mt-2 flex w-full max-w-xs flex-col gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={50} placeholder={lt.observerName} aria-label={lt.observerName} className={inputClass} />
            {view.error && <p role="alert" className="text-xs text-amber-300">{view.error}</p>}
            <Button type="submit" variant="gold" disabled={busy || !input.trim()}>{lt.observerJoin}</Button>
          </form>
          {!loggedIn && <Link to={`/login?return=${encodeURIComponent(location.pathname + location.search)}`} className="mt-1 text-xs font-semibold text-white/80 underline hover:text-white">{lt.orLogin}</Link>}
        </StagePlaceholder>
      )
    case 'key':
      return (
        <StagePlaceholder poster={poster} icon={KeyRound} title={lt.joinKeyTitle} hint={lt.joinKeyHint}>
          <form onSubmit={(e) => void joinWithKey(e)} className="mt-2 flex w-full max-w-xs flex-col gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} autoComplete="off" placeholder={lt.joinKeyLabel} aria-label={lt.joinKeyLabel} className={inputClass} />
            {view.error && <p role="alert" className="text-xs text-amber-300">{view.error}</p>}
            <Button type="submit" variant="gold" disabled={busy || !input.trim()}>{lt.observerJoin}</Button>
          </form>
        </StagePlaceholder>
      )
    case 'room':
      return (
        <>
          <JitsiRoom roomName={view.token.roomName} jwt={view.token.token} role={view.token.role} displayName={view.name} onLoadError={() => setView({ k: 'jitsi-error' })} />
          {view.token.role === 'PARTICIPANT' && !window.isSecureContext && !insecureSeen && (
            <div role="status" className="absolute inset-x-3 top-3 flex items-start gap-2 rounded-lg bg-amber-500/90 px-3 py-2 text-xs font-medium text-black">
              <span className="flex-1">{lt.insecureMedia}</span>
              <button type="button" onClick={() => setInsecureSeen(true)} aria-label={lt.dismiss}><X className="size-4" /></button>
            </div>
          )}
        </>
      )
  }
}
