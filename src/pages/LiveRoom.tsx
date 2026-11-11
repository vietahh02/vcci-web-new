/** Phòng xem trực tiếp. Giữ bố cục Portal, dữ liệu thật: HLS hoặc Jitsi, chat phiên, số người xem. Chế độ mock dùng LiveRoomDemo. */
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, CircleOff, Heart, ThumbsUp, Ticket, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { USE_MOCK, useEvent, useShow } from '@/api'
import { isShowId } from '@/api/adapters/show'
import { CHAT_URL } from '@/api/chat'
import type { JitsiRole, LiveStatus } from '@/api/liveApi'
import { CompanyMark, VerifiedBadge } from '@/components/brand'
import { LiveDot } from '@/components/effects'
import { ChatNotice, LiveChatPanel } from '@/components/live/LiveChatPanel'
import { LivestreamStage } from '@/components/live/LivestreamStage'
import { parseLiveEventId, safeHttpUrl, toLiveKind, type LiveKind } from '@/components/live/liveRef'
import { liveText } from '@/components/live/liveText'
import { ReplayPlayer } from '@/components/live/HlsPlayer'
import { StagePlaceholder } from '@/components/live/StagePlaceholder'
import { RestoreVisitorForm } from '@/components/show/RestoreVisitorForm'
import { useAccountVisit } from '@/components/show/useVisitorRecovery'
import { WebinarStage } from '@/components/live/WebinarStage'
import { SponsorVerticalBanner } from '@/components/sponsor'
import { ErrorBlock, LoadingBlock } from '@/components/ui/StateViews'
import { Badge, Button, buttonClass } from '@/components/ui/primitives'
import type { EventItem } from '@/data/mock'
import type { Show } from '@/data/shows'
import { useI18n, type Bilingual } from '@/lib/i18n'
import { isOnlineFormat } from '@/lib/eventStatus'
import { useShowVisitor } from '@/lib/showReg'
import { cn, formatNumber, img } from '@/lib/utils'
import NotFound from '@/pages/NotFound'
import LiveRoomDemo from '@/pages/LiveRoomDemo'

interface LiveTarget {
  title: Bilingual
  org?: Bilingual
  cover: string
  /** Có phòng phát. Không có mà có recordingUrl thì chỉ xem lại. */
  stream?: { kind: LiveKind; eventId: string; sessionId?: string }
  recordingUrl?: string | null
  /** Id gốc để giữ state phòng theo đúng phiên khi đổi đường dẫn. */
  key: string
}

/** Chọn phiên của Show theo tham số đường dẫn; không chỉ định thì lấy phiên đang phát, rồi đến khung ra mắt đang phát. */
function showTarget(show: Show, sessionParam: string | null, launchParam: string | null, stream?: { eventId: string; sessionId: string | null }): LiveTarget {
  const base = { org: show.title, cover: show.cover }
  // came from an event link (/live/l-7?session=9): find the Show's session or launch slot that streams it
  const hit = (eventId?: string, sessionId?: string) => !!stream && eventId === stream.eventId && (!stream.sessionId || sessionId === stream.sessionId)
  const session = stream ? show.sessions.find((s) => hit(s.live?.eventId, s.live?.sessionId))
    : sessionParam ? show.sessions.find((s) => s.id === sessionParam) : launchParam ? undefined : show.sessions.find((s) => s.status === 'LIVE' && s.live)
  const launch = stream ? (session ? undefined : show.launches.find((l) => hit(l.streamEventId, l.streamSessionId)))
    : launchParam ? show.launches.find((l) => l.id === launchParam) : session ? undefined : show.launches.find((l) => l.live && l.streamEventId)
  if (session) {
    const kind = session.live && toLiveKind(session.live.eventType)
    return {
      ...base, key: `s${session.id}`, title: session.title, recordingUrl: safeHttpUrl(session.recordingUrl),
      stream: kind && session.live ? { kind, eventId: session.live.eventId, sessionId: session.live.sessionId } : undefined,
    }
  }
  if (launch) {
    const booth = show.booths.find((b) => b.id === launch.boothId)
    const product = booth?.products.find((p) => p.id === launch.productId)
    return {
      ...base, key: `l${launch.id}`, title: product?.name ?? show.title, org: booth?.org ?? show.title,
      stream: launch.streamEventId ? { kind: 'LIVESTREAM', eventId: launch.streamEventId, sessionId: launch.streamSessionId } : undefined,
    }
  }
  return { ...base, key: 'show', title: show.title }
}

function eventTarget(ev: EventItem, sessionParam: string | null): LiveTarget {
  const ref = parseLiveEventId(ev.id)
  return {
    key: ev.id, title: ev.title, org: ev.organizedBy, cover: ev.coverImage,
    stream: ref ? { ...ref, sessionId: ref.kind === 'LIVESTREAM' ? sessionParam ?? undefined : undefined } : undefined,
  }
}

const hm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
const inToday = (start: string, end: string, now: Date) => {
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return start.slice(0, 10) <= day && day <= end.slice(0, 10)
}

export default function LiveRoom() {
  return USE_MOCK ? <LiveRoomDemo /> : <RealLiveRoom />
}

function RealLiveRoom() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const { t, L, locale } = useI18n()
  const lt = liveText()
  const isShow = isShowId(id)
  const showR = useShow(id, isShow)
  const evR = useEvent(isShow ? '' : id)
  const remote = isShow ? showR : evR
  const visitor = useShowVisitor(id)
  // another browser or device: the account's registration comes from the server; a guest restores it below with the code from the mail
  const { checking } = useAccountVisit(id, visitor, isShow)

  const [room, setRoom] = useState<{ status: LiveStatus | null; sessionId: string | null }>({ status: null, sessionId: null })
  const [role, setRole] = useState<JitsiRole | null>(null)
  const [viewers, setViewers] = useState<number | null>(null)
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([])
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(clock)
  }, [])

  const show = showR.data ?? null
  const ev = evR.data ?? null
  const target = useMemo<LiveTarget | null>(() => {
    const from = params.get('ev')
    if (isShow) return show ? showTarget(show, params.get('session'), params.get('launch'), from ? { eventId: from, sessionId: params.get('ls') } : undefined) : null
    return ev ? eventTarget(ev, params.get('session')) : null
  }, [isShow, show, ev, params])

  if (remote.loading) return <div className="bg-[#05061c] text-white"><LoadingBlock /></div>
  if (remote.error) return <ErrorBlock error={remote.error} onRetry={remote.reload} />
  // a session of a Show is watched only with the Show's visitor badge (registered once with VCCI), even when opened by its event link
  const owner = !isShow && ev?.showId ? parseLiveEventId(ev.id) : null
  if (owner && ev?.showId) {
    const q = new URLSearchParams({ ev: owner.eventId })
    const ls = params.get('session')
    if (ls) q.set('ls', ls)
    return <Navigate to={`/live/${ev.showId}?${q}`} replace />
  }
  if (!target) return <NotFound />

  const poster = target.cover ? img(target.cover, 1400, 790) : undefined
  const backTo = `/events/${id}`
  const needBadge = isShow && visitor.badge?.status !== 'ISSUED'
  const stream = target.stream
  const isLivestream = stream?.kind === 'LIVESTREAM' && !needBadge

  const react = () => {
    const h = { id: Date.now() + Math.random(), x: (Math.random() - 0.5) * 60 }
    setHearts((list) => [...list, h])
    setTimeout(() => setHearts((list) => list.filter((x) => x.id !== h.id)), 2200)
  }

  const agenda = show
    ? [...show.sessions].filter((s) => s.status !== 'CANCELED').sort((a, b) => a.start.localeCompare(b.start)).slice(0, 8).map((s) => ({
        key: s.id,
        time: `${new Date(s.start).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })}–${new Date(s.end).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })}`,
        title: L(s.title),
        now: s.status === 'LIVE',
      }))
    : (ev?.agendaOptions ?? []).map((a, i) => ({
        key: String(i),
        time: `${a.agendaStartTime}–${a.agendaEndTime}`,
        title: L(a.agendaTitle),
        now: !!ev && inToday(ev.startDate, ev.endDate, now) && a.agendaStartTime <= hm(now) && hm(now) < a.agendaEndTime,
      }))
  // Doanh nghiệp tham gia lấy từ /full, mỗi doanh nghiệp một dòng; Show ONLINE không có khái niệm gian
  const companies = [...new Map((show?.booths ?? []).map((b) => [b.businessId ?? L(b.org), b])).values()].slice(0, 6)
  const online = isOnlineFormat(show?.format)

  const stage = needBadge && checking ? (
    <StagePlaceholder poster={poster} busy title={lt.checkingRegistration} />
  ) : needBadge ? (
    <StagePlaceholder poster={poster} icon={Ticket} title={online ? lt.needRegister : lt.needBadge} hint={online ? lt.needRegisterHint : lt.needBadgeHint}>
      <Link to={backTo} className={buttonClass('gold', 'md', 'mt-2')}>{lt.backToEvent}</Link>
    </StagePlaceholder>
  ) : stream?.kind === 'LIVESTREAM' ? (
    <LivestreamStage key={target.key} eventId={stream.eventId} sessionId={stream.sessionId} poster={poster} recordingUrl={target.recordingUrl} onRoom={setRoom} />
  ) : stream?.kind === 'WEBINAR' ? (
    <WebinarStage key={target.key} eventId={stream.eventId} poster={poster} recordingUrl={target.recordingUrl} onRole={setRole} onRoom={setRoom} />
  ) : target.recordingUrl ? (
    <ReplayPlayer url={target.recordingUrl} />
  ) : (
    <StagePlaceholder poster={poster} icon={CircleOff} title={lt.noStream} hint={lt.noStreamHint}>
      <Link to={backTo} className={buttonClass('white', 'md', 'mt-2')}>{lt.backToEvent}</Link>
    </StagePlaceholder>
  )

  const chat = isLivestream && room.sessionId ? (
    <LiveChatPanel key={room.sessionId} sessionId={room.sessionId} status={room.status} onViewers={setViewers} onReact={react} />
  ) : stream?.kind === 'WEBINAR' && !needBadge ? (
    <ChatNotice text={role === 'OBSERVER' ? lt.webinarChatObserver : lt.webinarChatParticipant} />
  ) : (
    <ChatNotice text={CHAT_URL ? lt.chatWaiting : lt.chatMissing} />
  )

  return (
    <div className="bg-[#05061c] pb-16 pt-5 text-white">
      <div className="container-page">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link to={backTo} className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"><ArrowLeft className="size-4" /> {t.live.back}</Link>
          <div className="flex items-center gap-2">
            {room.status === 'LIVE' && <Badge variant="live" className="gap-1.5 px-2.5 py-1"><LiveDot /> {t.events.live}</Badge>}
            {room.status === 'ENDED' && <Badge variant="secondary" className="px-2.5 py-1">{lt.ended}</Badge>}
            {(room.status === 'SCHEDULED' || room.status === 'READY') && <Badge variant="secondary" className="px-2.5 py-1">{lt.notStarted}</Badge>}
            {isLivestream && viewers !== null && room.status !== 'ENDED' && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold tabular-nums">
                <Users className="size-3.5" /> {formatNumber(viewers, locale)} {t.events.viewers}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* player */}
          <div>
            <div className="group relative aspect-video overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
              {stage}
              {/* reactions: chỉ là hiệu ứng tại máy người xem, không gửi đi */}
              <div className="pointer-events-none absolute bottom-16 right-6 h-64 w-16">
                <AnimatePresence>
                  {hearts.map((h) => (
                    <motion.span
                      key={h.id}
                      className="absolute bottom-0 left-1/2"
                      initial={{ y: 0, opacity: 1, scale: 0.6, x: 0 }}
                      animate={{ y: -220, opacity: 0, scale: 1.3, x: h.x }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 2, ease: 'easeOut' }}
                    >
                      <Heart className="size-7 fill-live text-live drop-shadow" />
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {needBadge && !checking && <RestoreVisitorForm showId={id} visitor={visitor} online={online} />}

            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <h1 className="text-xl font-extrabold leading-snug md:text-2xl">{L(target.title)}</h1>
                {target.org && <p className="mt-1 text-sm text-white/60">{L(target.org)}</p>}
              </div>
              {isLivestream && room.status === 'LIVE' && (
                <Button variant="ghost" className="bg-white/10 text-white hover:bg-white/15" aria-label={t.ui.react} onClick={react}><ThumbsUp /></Button>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {agenda.length > 0 && (
                <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
                  <p className="text-sm font-bold">{t.live.agenda}</p>
                  <ol className="mt-3 space-y-2">
                    {agenda.map((a) => (
                      <li key={a.key} className={cn('flex gap-3 rounded-lg p-2.5 text-sm', a.now ? 'bg-live/15 ring-1 ring-live/40' : 'text-white/70')}>
                        <span className="w-24 shrink-0 font-mono text-xs leading-5">{a.time}</span>
                        <span className="flex-1">{a.title}</span>
                        {a.now && <LiveDot className="mt-1.5 text-live" />}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {companies.length > 0 && (
                <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
                  <p className="text-sm font-bold">{t.live.exhibitors}</p>
                  <ul className="mt-3 space-y-2">
                    {companies.map((b) => {
                      const row = (
                        <>
                          <CompanyMark name={L(b.org)} accent={b.accent} className="size-8 rounded-lg text-[10px]" />
                          <span className="min-w-0 flex-1 truncate text-sm">{L(b.org)}</span>
                          {b.verified && <VerifiedBadge compact />}
                        </>
                      )
                      return (
                        <li key={b.id}>
                          {b.businessId
                            ? <Link to={`/suppliers/${b.businessId}`} className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-white/5">{row}</Link>
                            : <div className="flex items-center gap-3 rounded-lg p-2">{row}</div>}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
              <SponsorVerticalBanner dark className="md:col-span-2" />
            </div>
          </div>

          {/* chat */}
          {chat}
        </div>
      </div>
    </div>
  )
}
