/** Phòng xem trực tiếp. Giữ bố cục Portal, dữ liệu thật: HLS hoặc Jitsi, chat phiên, số người xem. Chế độ mock dùng LiveRoomDemo. */
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, CircleOff, Heart, MessageSquare, Mic2, ThumbsUp, Ticket, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { USE_MOCK, useEvent, useShow } from '@/api'
import { isShowId } from '@/api/adapters/show'
import { CHAT_URL } from '@/api/chat'
import type { JitsiRole, LiveStatus } from '@/api/liveApi'
import { CompanyMark, CountryChip, VerifiedBadge } from '@/components/brand'
import { LiveDot } from '@/components/effects'
import { openB2bChat } from '@/components/layout/useBizChat'
import { ChatNotice, LiveChatPanel } from '@/components/live/LiveChatPanel'
import { LivestreamStage } from '@/components/live/LivestreamStage'
import { parseLiveEventId, safeHttpUrl, toLiveKind, type LiveKind } from '@/components/live/liveRef'
import { liveText } from '@/components/live/liveText'
import { ReplayPlayer } from '@/components/live/HlsPlayer'
import { SelfContainedLaunchStage } from '@/components/live/SelfContainedLaunchStage'
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
import { tx } from '@/lib/tx'
import { cn, formatNumber, img } from '@/lib/utils'
import NotFound from '@/pages/NotFound'
import LiveRoomDemo from '@/pages/LiveRoomDemo'

interface LiveTarget {
  title: Bilingual
  org?: Bilingual
  cover: string
  /** Có phòng phát. Không có mà có recordingUrl thì chỉ xem lại. Khung ra mắt tự chứa (CR-2026-015) không có eventId/sessionId, chỉ có slotId riêng. */
  stream?: { kind: LiveKind; eventId: string; sessionId?: string } | { kind: LiveKind; selfContainedSlotId: string }
  recordingUrl?: string | null
  /** Id gốc để giữ state phòng theo đúng phiên khi đổi đường dẫn. */
  key: string
}

/** Chọn phiên của Show theo tham số đường dẫn; không chỉ định thì lấy phiên đang phát, rồi đến khung ra mắt đang phát. */
function showTarget(show: Show, sessionParam: string | null, launchParam: string | null, stream?: { eventId: string; sessionId: string | null }): LiveTarget {
  const base = { org: show.organizer, cover: show.cover }
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
    // Khung tự chứa (CR-2026-015): không có streamEventId, trạng thái phát nằm ngay trên khung (broadcastMode/broadcastStatus).
    const selfContainedKind = !launch.streamEventId ? toLiveKind(launch.broadcastMode ?? '') : null
    return {
      ...base, key: `l${launch.id}`, title: product?.name ?? show.title, org: booth?.org ?? show.title,
      recordingUrl: !launch.streamEventId ? safeHttpUrl(launch.replayUrl) : undefined,
      stream: launch.streamEventId
        ? { kind: 'LIVESTREAM', eventId: launch.streamEventId, sessionId: launch.streamSessionId }
        : selfContainedKind ? { kind: selfContainedKind, selfContainedSlotId: launch.id } : undefined,
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

const HEART_COLORS = ['fill-live text-live', 'fill-gold-bright text-gold-bright', 'fill-white text-white']

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
  const [hearts, setHearts] = useState<
    { id: number; sway: number[]; rotate: number[]; scale: number; duration: number; color: string }[]
  >([])
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
    const h = {
      id: Date.now() + Math.random(),
      // đường bay lắc qua lại kiểu TikTok, không chỉ đi thẳng lên
      sway: [0, (Math.random() - 0.5) * 70, (Math.random() - 0.5) * 90, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 30],
      rotate: [0, Math.random() > 0.5 ? 18 : -18, Math.random() > 0.5 ? -14 : 14, 0],
      scale: 0.85 + Math.random() * 0.5,
      duration: 2.6 + Math.random() * 1.2,
      color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)]!,
    }
    setHearts((list) => [...list, h])
    setTimeout(() => setHearts((list) => list.filter((x) => x.id !== h.id)), 4000)
  }

  const speakerById = new Map((show?.speakers ?? []).map((sp) => [sp.id, sp]))
  const agenda = show
    ? [...show.sessions].filter((s) => s.status !== 'CANCELED').sort((a, b) => a.start.localeCompare(b.start)).slice(0, 8).map((s) => ({
        key: s.id,
        time: `${new Date(s.start).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })}–${new Date(s.end).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false })}`,
        title: L(s.title),
        now: s.status === 'LIVE',
        speakers: s.speakerIds
          .map((id) => speakerById.get(id))
          .filter((sp): sp is NonNullable<typeof sp> => !!sp)
          .map((sp) => ({ name: sp.name, title: L(sp.title), accent: sp.accent })),
      }))
    : (ev?.agendaOptions ?? []).map((a, i) => ({
        key: String(i),
        time: `${a.agendaStartTime}–${a.agendaEndTime}`,
        title: L(a.agendaTitle),
        now: !!ev && inToday(ev.startDate, ev.endDate, now) && a.agendaStartTime <= hm(now) && hm(now) < a.agendaEndTime,
        speakers: a.speaker ? [{ name: L(a.speaker), title: undefined as string | undefined, accent: undefined as string | undefined }] : [],
      }))
  // Doanh nghiệp tham gia lấy từ /full, mỗi doanh nghiệp một dòng; Show ONLINE không có khái niệm gian
  const companies = [...new Map((show?.booths ?? []).map((b) => [b.businessId ?? L(b.org), b])).values()].slice(0, 6)
  // Sản phẩm trưng bày: gộp từ products của từng gian (booth), kèm theo doanh nghiệp sở hữu để nhắn tin được
  const products = (show?.booths ?? [])
    .flatMap((b) => b.products.map((p) => ({ ...p, org: b.org, businessId: b.businessId, accent: b.accent })))
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 8)
  const online = isOnlineFormat(show?.format)

  const stage = needBadge && checking ? (
    <StagePlaceholder poster={poster} busy title={lt.checkingRegistration} />
  ) : needBadge ? (
    <StagePlaceholder poster={poster} icon={Ticket} title={online ? lt.needRegister : lt.needBadge} hint={online ? lt.needRegisterHint : lt.needBadgeHint}>
      <Link to={backTo} className={buttonClass('gold', 'md', 'mt-2')}>{lt.backToEvent}</Link>
    </StagePlaceholder>
  ) : stream && 'selfContainedSlotId' in stream ? (
    <SelfContainedLaunchStage key={target.key} slotId={stream.selfContainedSlotId} mode={stream.kind} poster={poster} recordingUrl={target.recordingUrl} onRoom={setRoom} onRole={setRole} />
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
    <div className="bg-[#141b33] pb-16 text-white">
      <div className="container-page">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 pt-3">
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
            {isLivestream && room.status === 'LIVE' && (
              <Button variant="ghost" className="bg-white/10 text-white hover:bg-white/15" aria-label={t.ui.react} onClick={react}><ThumbsUp /></Button>
            )}
          </div>
        </div>

        <div className="mb-4 max-w-2xl">
          <h1 className="text-xl font-extrabold leading-snug md:text-2xl">{L(target.title)}</h1>
          {target.org && <p className="mt-1 text-sm text-white/60">{L(target.org)}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* player */}
          <div>
            <div className="group relative aspect-video overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
              {stage}
              {/* reactions: chỉ là hiệu ứng tại máy người xem, không gửi đi; neo bên phải, tránh đè thanh điều khiển Jitsi ở giữa-dưới */}
              <div className="pointer-events-none absolute inset-y-4 right-4 w-24 sm:w-32">
                <AnimatePresence>
                  {hearts.map((h) => (
                    <motion.span
                      key={h.id}
                      className="absolute bottom-0 right-2"
                      initial={{ y: 0, opacity: 1, scale: 0.6, x: 0, rotate: 0 }}
                      animate={{ y: -320, opacity: [1, 1, 0], scale: h.scale, x: h.sway, rotate: h.rotate }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: h.duration, ease: 'easeOut' }}
                    >
                      <Heart className={`size-7 drop-shadow ${h.color}`} />
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {needBadge && !checking && <RestoreVisitorForm showId={id} visitor={visitor} online={online} />}

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="flex min-w-0 flex-col gap-4">
                {companies.length > 0 && (
                  <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
                    <p className="text-sm font-bold">{t.live.exhibitors}</p>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {companies.map((b) => (
                        <div key={b.id} className="relative rounded-2xl bg-card p-4 text-center text-foreground shadow-sm">
                          {b.businessId && (
                            <button
                              type="button"
                              title={tx('Nhắn tin với', 'Message', '메시지 보내기')}
                              aria-label={tx(`Nhắn tin với ${L(b.org)}`, `Message ${L(b.org)}`, `${L(b.org)}에 메시지 보내기`)}
                              onClick={() => openB2bChat(b.businessId!)}
                              className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#38b6f0] to-[#1d82b8] text-white shadow-md transition-transform hover:scale-110"
                            >
                              <MessageSquare className="size-3.5" />
                            </button>
                          )}
                          <CompanyMark name={L(b.org)} accent={b.accent} className="mx-auto size-14 rounded-2xl text-base" />
                          <Link
                            to={b.businessId ? `/suppliers/${b.businessId}` : '#'}
                            className={cn('mt-3 block line-clamp-2 text-[13px] font-bold leading-snug', b.businessId && 'hover:text-primary')}
                          >
                            {L(b.org)}
                          </Link>
                          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
                            {b.verified && <VerifiedBadge compact />}
                            {b.country && <CountryChip code={b.country} className="text-[11px]" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {products.length > 0 && (
                  <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold">{t.live.products}</p>
                      <span className="text-xs text-white/50">{products.length} {tx('sản phẩm', 'products', '개 제품')}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {products.map((p) => (
                        <div key={p.id} className="group relative">
                          <Link to={p.linkId ? `/products/${p.linkId}` : '#'} className="block overflow-hidden rounded-2xl bg-card shadow-sm transition-transform duration-300 hover:-translate-y-0.5">
                            <div className="aspect-square overflow-hidden bg-muted">
                              <img src={img(p.image, 240, 240)} alt={L(p.name)} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            </div>
                            <div className="p-2.5">
                              <p className="line-clamp-2 text-[12.5px] font-semibold leading-snug text-foreground">{L(p.name)}</p>
                              <p className="mt-1 truncate text-[11px] text-muted-foreground">{L(p.org)}</p>
                            </div>
                          </Link>
                          {p.businessId && (
                            <button
                              type="button"
                              title={tx('Nhắn tin với', 'Message', '메시지 보내기')}
                              aria-label={tx(`Nhắn tin với ${L(p.org)}`, `Message ${L(p.org)}`, `${L(p.org)}에 메시지 보내기`)}
                              onClick={() => openB2bChat(p.businessId!)}
                              className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#38b6f0] to-[#1d82b8] text-white shadow-md transition-transform hover:scale-110"
                            >
                              <MessageSquare className="size-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {agenda.length > 0 && (
                <div className="h-fit rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
                  <p className="text-sm font-bold">{t.live.agenda}</p>
                  <ol className="relative mt-4 space-y-4 border-l-2 border-dashed border-white/15 pl-5">
                    {agenda.map((a) => (
                      <li key={a.key} className="relative">
                        <span
                          className={cn(
                            'absolute -left-[25px] top-0.5 size-2.5 rounded-full',
                            a.now ? 'bg-live shadow-[0_0_0_4px_rgba(225,29,72,0.25)]' : 'border-2 border-white/30 bg-[#141b33]',
                          )}
                        />
                        {a.now && (
                          <p className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide text-live">
                            <LiveDot /> {t.events.live}
                          </p>
                        )}
                        <p className="font-mono text-[10.5px] text-white/40">{a.time}</p>
                        <p className={cn('mt-0.5 text-sm leading-snug', a.now ? 'text-white' : 'text-white/70')}>{a.title}</p>
                        {a.speakers.length > 0 && (
                          <div className="mt-1.5 flex flex-col gap-1.5">
                            {a.speakers.map((sp, i) =>
                              sp.accent ? (
                                <div key={i} className="flex items-center gap-2">
                                  <CompanyMark name={sp.name} accent={sp.accent} className="size-7 shrink-0 rounded-full text-[11px]" />
                                  <div className="min-w-0 leading-tight">
                                    <p className="truncate text-[13px] font-bold text-gold-bright">{sp.name}</p>
                                    {sp.title && <p className="truncate text-[11px] text-white/50">{sp.title}</p>}
                                  </div>
                                </div>
                              ) : (
                                <p key={i} className="flex items-center gap-1.5 truncate text-[13px] font-bold text-gold-bright">
                                  <Mic2 className="size-3.5 shrink-0" /> {sp.name}
                                </p>
                              ),
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <SponsorVerticalBanner dark className="lg:col-span-2" />
            </div>
          </div>

          {/* chat */}
          {chat}
        </div>
      </div>
    </div>
  )
}
