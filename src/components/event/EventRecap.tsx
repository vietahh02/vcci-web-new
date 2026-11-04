/** "Event highlights" block for ended events — headline numbers, video, takeaways, sessions with replay, gallery, participants, testimonials. */
import { motion } from 'motion/react'
import { BellRing, Building2, Camera, Heart, PlayCircle, Quote, Star } from 'lucide-react'
import { useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { CountryChip } from '@/components/brand'
import { CountUp } from '@/components/effects'
import { Dialog, DialogContent, useToast } from '@/components/ui/overlay'
import { Badge, Button } from '@/components/ui/primitives'
import { API_BASE, USE_MOCK } from '@/api'
import { safeHttpUrl } from '@/components/live/liveRef'
import { useEventRecap } from '@/api/eventApi'
import type { RecapProduct } from '@/data/eventRecap'
import type { EventItem } from '@/data/mock'
import { useI18n } from '@/lib/i18n'
import { isOnlineShowEvent } from '@/lib/eventStatus'
import { tx } from '@/lib/tx'
import { formatDate, formatNumber, img } from '@/lib/utils'

/** A file we can play on the page: our own storage or a video extension. Anything else (YouTube, Vimeo…) opens in a new tab. */
const isVideoFile = (u: string) => u.startsWith(API_BASE) || u.includes('/api/files/') || /\.(mp4|webm|ogv|ogg|mov|m4v)(\?|#|$)/i.test(u)

/** Photos shown before "+N"; the first is the large tile. */
const GALLERY_PREVIEW = 5
/** One photo fills the row, two split it, three or more lead with a large photo, on any count and on a phone. */
function galleryTile(i: number, n: number) {
  if (n === 1) return 'col-span-2 aspect-[2/1] md:col-span-4 md:aspect-[3/1]'
  if (n === 2) return 'aspect-[4/3] md:col-span-2 md:aspect-[2/1]'
  if (i === 0) return 'col-span-2 aspect-[4/3] md:row-span-2 md:aspect-auto'
  if (n === 3) return 'aspect-[4/3] md:col-span-2 md:aspect-[2/1]'
  if (n === 4 && i === 1) return 'col-span-2 aspect-[2/1]'
  return 'aspect-[4/3]'
}

/** A ranking of products in the recap: same picture-and-name card as the Show product tab, counts only. */
function RecapProducts({ ev, title, icon: Icon, items, wide, count }: { ev: EventItem; title: string; icon: ComponentType<{ className?: string }>; items: RecapProduct[]; wide: boolean; count: (n: number) => string }) {
  const { L } = useI18n()
  const from = /^s-\d+$/.test(ev.id) ? `?fromEvent=${ev.id}` : ''
  return (
    <div>
      <h3 className="flex items-center gap-2 text-xl font-extrabold"><Icon className="size-5 text-primary" /> {title}</h3>
      <div className={`mt-3 grid grid-cols-2 gap-x-4 gap-y-6 ${wide ? 'md:grid-cols-4' : 'sm:grid-cols-3'}`}>
        {items.map((p) => (
          <Link key={p.id} to={`/products/${p.id}${from}`} className="group block min-w-0">
            <div className="aspect-square overflow-hidden rounded-xl bg-muted"><img src={img(p.image, 400, 400)} alt="" loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" /></div>
            <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary">{L(p.name)}</p>
            {p.org && <p className="mt-0.5 truncate text-xs text-muted-foreground">{p.org}</p>}
            {p.count > 0 && <Badge variant="secondary" className="mt-1.5">{count(p.count)}</Badge>}
          </Link>
        ))}
      </div>
    </div>
  )
}

export function EventRecap({ ev }: { ev: EventItem }) {
  const { L, locale } = useI18n()
  const toast = useToast()
  const { data: r } = useEventRecap(ev)
  const [photo, setPhoto] = useState<string | null>(null)
  const [notify, setNotify] = useState(false)
  const [allPhotos, setAllPhotos] = useState(false)
  const next = new Date(); next.setDate(next.getDate() + (r?.next?.inDays ?? 0))
  const demo = () => toast({ kind: 'info', title: tx('Bản mẫu', 'Prototype', '프로토타입'), description: tx('Trình phát bản ghi sẽ nối với hạ tầng livestream của hệ thống.', 'The player connects to the platform’s livestream infrastructure.', '플레이어는 플랫폼 라이브 인프라와 연동됩니다.') })

  if (!r) return null
  const playVideo = () => {
    if (!r.video.url) return demo()
    const link = safeHttpUrl(r.video.url)
    if (link) window.open(link, '_blank', 'noopener,noreferrer')
  }
  const sample = USE_MOCK
  const hasVideo = sample || !!r.video.url
  const hasSessions = ev.agendaOptions.length > 0
  const rating = r.rating && r.rating.count > 0 ? r.rating : null
  const favorites = r.favoriteProducts ?? []
  // API failed or nothing recorded yet: no empty headings on the page
  if (!r.stats.length && !hasVideo && !r.takeaways.length && !hasSessions && !r.gallery.length && !r.participants.length && !r.testimonials.length && !rating && !r.next && !favorites.length) return null
  return (
    <section aria-label="recap" className="space-y-10">
      {r.stats.length > 0 && <div>
        <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-primary">{tx('Tổng kết sự kiện', 'Event highlights', '행사 하이라이트')}</p>
        <dl className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
          {r.stats.map((s) => (
            <div key={s.label.en} className="rounded-2xl border bg-card p-4">
              <dd className="text-3xl font-extrabold tabular-nums tracking-tight text-primary"><CountUp to={s.value} format={(n) => formatNumber(Math.round(n), locale)} />{s.suffix}</dd>
              <dt className="mt-1 text-xs font-semibold text-muted-foreground">{L(s.label)}</dt>
            </div>
          ))}
        </dl>
        {sample && <p className="mt-2 text-[11px] text-muted-foreground">{tx('Số liệu minh hoạ trong bản mẫu.', 'Sample figures in this prototype.', '프로토타입 샘플 수치입니다.')}</p>}
      </div>}

      {(hasVideo || r.takeaways.length > 0) && <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {hasVideo && (r.video.url && isVideoFile(r.video.url) ? <figure>
          <video src={r.video.url} poster={img(ev.coverImage, 1200, 680)} controls playsInline preload="metadata" className="aspect-video w-full rounded-2xl bg-navy" />
          {L(r.video.title) && <figcaption className="mt-2 font-bold">{L(r.video.title)}</figcaption>}
        </figure> : <button type="button" onClick={playVideo} className="group relative aspect-video overflow-hidden rounded-2xl bg-navy text-left" aria-label={L(r.video.title) || tx('Xem video', 'Watch video', '영상 보기')}>
          <img src={img(ev.coverImage, 1200, 680)} alt="" className="size-full object-cover opacity-60 transition duration-700 group-hover:scale-105 group-hover:opacity-75" />
          <span className="absolute inset-0 grid place-items-center"><span className="grid size-16 place-items-center rounded-full bg-white/95 text-navy shadow-xl transition group-hover:scale-110"><PlayCircle className="size-9" /></span></span>
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent p-4 text-white"><span className="font-bold">{L(r.video.title)}</span>{r.video.duration && <span className="rounded bg-black/50 px-2 py-0.5 text-xs font-semibold">{r.video.duration}</span>}</span>
        </button>)}
        {r.takeaways.length > 0 && <div className="rounded-2xl border bg-card p-5">
          <h3 className="text-lg font-extrabold">{tx('Điểm nhấn nội dung', 'Key takeaways', '주요 내용')}</h3>
          <ul className="mt-3 space-y-3">
            {r.takeaways.map((k, i) => <li key={i} className="flex gap-3 text-[15px]"><span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">{i + 1}</span>{L(k)}</li>)}
          </ul>
        </div>}
      </div>}

      {hasSessions && <div>
        <h3 className="text-xl font-extrabold">{tx('Các phiên & xem lại', 'Sessions & replays', '세션 및 다시보기')}</h3>
        <ul className="mt-3 divide-y rounded-2xl border bg-card">
          {ev.agendaOptions.map((a, i) => (
            <li key={i} className="flex items-center gap-4 p-4">
              <span className="w-24 shrink-0 font-mono text-xs font-semibold text-primary">{a.agendaStartTime}{a.agendaEndTime && `–${a.agendaEndTime}`}</span>
              <span className="min-w-0 flex-1"><span className="block font-semibold">{L(a.agendaTitle)}</span>{a.speaker && <span className="text-sm text-muted-foreground">{L(a.speaker)}</span>}</span>
              {/* the BE has no per-session recording yet */}
              {sample && <Badge variant="success" className="hidden sm:inline-flex">{tx('Có bản ghi', 'Recorded', '녹화됨')}</Badge>}
              {sample && <Button size="sm" variant="outline" onClick={demo}><PlayCircle /> {tx('Xem lại', 'Watch', '다시보기')}</Button>}
            </li>
          ))}
        </ul>
        {ev.speakers && (
          <div className="mt-4 flex flex-wrap gap-3">
            {ev.speakers.map((s) => <span key={s.name} className="rounded-full border px-3 py-1.5 text-sm"><b>{s.name}</b> · <span className="text-muted-foreground">{L(s.title)}</span></span>)}
          </div>
        )}
      </div>}

      {favorites.length > 0 && <div className="grid gap-8">
        <RecapProducts ev={ev} title={tx('Sản phẩm được yêu thích', 'Most favourited products', '인기 즐겨찾기 제품')} icon={Heart} items={favorites} wide count={(n) => tx(`${n} lượt yêu thích`, `${n} favourites`, `즐겨찾기 ${n}회`)} />
      </div>}

      {r.gallery.length > 0 && <div>
        <h3 className="flex items-center gap-2 text-xl font-extrabold"><Camera className="size-5 text-primary" /> {tx('Hình ảnh sự kiện', 'Photo gallery', '행사 사진')}</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          {(allPhotos ? r.gallery : r.gallery.slice(0, GALLERY_PREVIEW)).map((g, i) => {
            const more = !allPhotos && i === GALLERY_PREVIEW - 1 ? r.gallery.length - GALLERY_PREVIEW : 0
            return (
              <motion.button key={`${g}-${i}`} type="button" onClick={() => (more > 0 ? setAllPhotos(true) : setPhoto(g))} whileHover={{ scale: 1.02 }} aria-label={more > 0 ? tx(`Xem thêm ${more} ảnh`, `Show ${more} more photos`, `사진 ${more}장 더 보기`) : tx('Xem ảnh', 'View photo', '사진 보기')} className={`relative overflow-hidden rounded-xl bg-muted ${galleryTile(i, r.gallery.length)}`}>
                <img src={img(g, i === 0 ? 900 : 480, i === 0 ? 700 : 360)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
                {more > 0 && <span className="absolute inset-0 grid place-items-center bg-navy/60 text-2xl font-extrabold text-white">+{more}</span>}
              </motion.button>
            )
          })}
        </div>
      </div>}

      <div className="grid gap-6 lg:grid-cols-2">
        {r.participants.length > 0 && <div>
          <h3 className="flex items-center gap-2 text-xl font-extrabold"><Building2 className="size-5 text-primary" /> {tx('Đơn vị tham gia', 'Participating organisations', '참가 기관')}</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {r.participants.map((p) => <li key={p.name} className="flex items-center justify-between gap-2 rounded-xl border p-3 text-sm"><span className="truncate font-semibold">{p.name}</span><CountryChip code={p.country} /></li>)}
          </ul>
        </div>}
        {(r.testimonials.length > 0 || rating) && <div>
          <h3 className="flex items-center gap-2 text-xl font-extrabold"><Quote className="size-5 text-primary" /> {tx('Cảm nhận người tham dự', 'What attendees said', '참가자 후기')}</h3>
          {rating && <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"><Star className="size-4 fill-gold-bright text-gold-bright" /> <b className="text-foreground">{rating.average.toLocaleString(locale, { maximumFractionDigits: 1 })}/5</b> · {formatNumber(rating.count, locale)} {tx('đánh giá', 'ratings', '개 평가')}</p>}
          <div className="mt-3 space-y-3">
            {r.testimonials.map((q, i) => (
              <figure key={`${q.name}-${i}`} className="rounded-2xl bg-muted/60 p-4">
                <blockquote className="text-[15px] italic">“{L(q.quote)}”</blockquote>
                <figcaption className="mt-2 text-xs text-muted-foreground"><b className="text-foreground">{q.name}</b>{q.org && ` · ${q.org}`}</figcaption>
              </figure>
            ))}
          </div>
        </div>}
      </div>

      {r.next && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-navy to-navy-2 p-6 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-bright">{isOnlineShowEvent(ev) ? tx('Sự kiện tiếp theo (dự kiến)', 'Next event (planned)', '다음 행사 (예정)') : tx('Kỳ tiếp theo (dự kiến)', 'Next edition (planned)', '다음 회차 (예정)')} · {formatDate(next.toISOString(), locale, { month: 'long', year: 'numeric' })}</p>
            <p className="mt-1 text-lg font-bold">{L(r.next.title)}</p>
          </div>
          {USE_MOCK && <Button variant={notify ? 'secondary' : 'gold'} onClick={() => { setNotify(true); toast({ kind: 'success', title: tx('Sẽ báo cho bạn khi mở đăng ký', 'We will notify you when registration opens', '등록이 열리면 알려드립니다') }) }} disabled={notify}><BellRing /> {notify ? tx('Đã đăng ký nhận tin', 'You will be notified', '알림 신청됨') : tx('Báo cho tôi', 'Notify me', '알림 받기')}</Button>}
        </div>
      )}

      <Dialog open={!!photo} onOpenChange={(o) => !o && setPhoto(null)}>
        <DialogContent className="max-w-3xl" title={L(ev.title)}>
          {photo && <img src={img(photo, 1400, 900)} alt="" className="max-h-[75vh] w-full object-contain" />}
        </DialogContent>
      </Dialog>
    </section>
  )
}
