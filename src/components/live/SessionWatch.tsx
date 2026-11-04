/** Phần xem trong hộp thoại phiên của Show: mở phòng thật, phát bản ghi, hoặc nói rõ là chưa có. */
import { PlayCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { LiveDot } from '@/components/effects'
import { Badge } from '@/components/ui/primitives'
import type { Show, ShowSession } from '@/data/shows'
import { useI18n } from '@/lib/i18n'
import { useShowT } from '@/lib/showText'
import { img } from '@/lib/utils'
import { ReplayPlayer } from './HlsPlayer'
import { safeHttpUrl, showLivePath } from './liveRef'
import { liveText } from './liveText'

export function SessionWatch({ show, session, live }: { show: Show; session: ShowSession; live: boolean }) {
  useI18n()
  const x = useShowT()
  const lt = liveText()
  const recording = safeHttpUrl(session.recordingUrl)

  if (!live && recording) return <div className="relative aspect-video overflow-hidden rounded-xl bg-navy text-white"><ReplayPlayer url={recording} /></div>
  if (!session.live) return <p role="status" className="rounded-xl border border-dashed p-5 text-center text-sm font-medium text-muted-foreground">{live ? lt.noLiveLink : lt.noRecording}</p>

  const label = session.status === 'ENDED' ? x.watchReplay : x.joinLive
  return (
    <Link to={showLivePath(show.id, { session: session.id })} aria-label={label} className="group relative block aspect-video overflow-hidden rounded-xl bg-navy">
      <img src={img(show.cover, 900, 500)} alt="" className="size-full object-cover opacity-50 transition group-hover:opacity-60" />
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
        <span className="grid size-16 place-items-center rounded-full bg-white/90 text-navy"><PlayCircle className="size-9" /></span>
        <span className="text-sm font-bold">{label}</span>
      </span>
      {live && <Badge variant="live" className="absolute left-3 top-3 gap-1.5"><LiveDot /> {x.sessionStatus.LIVE}</Badge>}
      {session.status === 'ENDED' && <Badge variant="secondary" className="absolute left-3 top-3">{x.replayLabel}</Badge>}
    </Link>
  )
}
