/**
 * Documents after a show (CR-2026-008 EV8-22), in the "Recording & materials" list style of EventJourney.
 * A badge held in this browser is passed along; a signed-in account goes with the token as usual. A restricted document comes without a link, so it gets no download button.
 */
import { Download, FileText, Image as ImageIcon, PlayCircle, Video } from 'lucide-react'
import { USE_MOCK, useRemote } from '@/api'
import { fetchShowMaterials } from '@/api/eventApi'
import { Button } from '@/components/ui/primitives'
import type { Material } from '@/data/eventExtras'
import type { Show } from '@/data/shows'
import { useI18n } from '@/lib/i18n'
import type { VisitorBadge } from '@/lib/showReg'
import { tx } from '@/lib/tx'

const ICONS: Partial<Record<Material['kind'], typeof Video>> = { RECORDING: Video, PHOTOS: ImageIcon }

export function ShowMaterials({ show, badge }: { show: Show; badge?: VisitorBadge }) {
  const { L } = useI18n()
  const held = badge?.status === 'ISSUED' ? badge : undefined
  const list = useRemote<Material[]>(USE_MOCK ? null : `showmat:${show.id}:${held?.code ?? ''}`, () => fetchShowMaterials(show.id, held?.email, held?.code)).data ?? []
  if (!list.length) return null
  return (
    <section className="rounded-2xl border bg-card p-5" aria-label="materials">
      <h3 className="text-xl font-extrabold">{tx('Tài liệu', 'Materials', '자료')}</h3>
      <ul className="mt-4 divide-y">
        {list.map((m) => {
          const Icon = ICONS[m.kind] ?? FileText
          return (
            <li key={m.id} className="flex items-center gap-3 py-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"><Icon className="size-5" /></span>
              <div className="min-w-0 flex-1"><p className="font-semibold">{L(m.title)}</p>{m.meta && <p className="text-xs text-muted-foreground">{m.meta}</p>}</div>
              {m.url && <Button size="sm" variant={m.kind === 'RECORDING' ? 'default' : 'outline'} onClick={() => window.open(m.url, '_blank', 'noopener,noreferrer')}>{m.kind === 'RECORDING' ? <><PlayCircle /> {tx('Xem lại', 'Watch', '다시보기')}</> : <><Download /> {tx('Tải', 'Download', '다운로드')}</>}</Button>}
            </li>
          )
        })}
      </ul>
      {list.some((m) => !m.url) && <p className="mt-3 text-sm text-muted-foreground">{tx('Một số tài liệu chỉ dành cho người đã đăng ký tham gia.', 'Some materials are for registered participants only.', '일부 자료는 참가 등록자에게만 제공됩니다.')}</p>}
    </section>
  )
}
