/** Trade-show layout: immersive countdown hero + live strip + month-grouped schedule + past recordings. */
import { motion } from 'motion/react'
import { ArrowRight, MapPin, Ticket, Video } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { searchEvents } from '@/api'
import type { EventItem } from '@/data/mock'
import { EventExplorer, formatLabel } from '@/components/event/EventExplorer'
import { LiveDot, useCountdown } from '@/components/effects'
import { HeroSearch } from '@/components/HeroSearch'
import { PageHero } from '@/components/PageHero'
import { ErrorBlock } from '@/components/ui/StateViews'
import { buttonClass, Skeleton } from '@/components/ui/primitives'
import { eventTimeRange, isOnAir } from '@/lib/eventStatus'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'
import { formatDate, img } from '@/lib/utils'

export default function Events() {
  const { lang } = useI18n()
  const [list, setList] = useState<EventItem[] | null>(null)
  const [error, setError] = useState<Error>()
  const [attempt, setAttempt] = useState(0)
  const [q, setQ] = useState('')

  useEffect(() => {
    searchEvents().then((r) => { setError(undefined); setList(r) }, (e: Error) => setError(e))
  }, [lang, attempt])

  // the API failing is not the same as nothing matching
  if (error) return <ErrorBlock error={error} onRetry={() => { setError(undefined); setList(null); setAttempt((n) => n + 1) }} />
  if (!list) return <div className="container-page py-10"><Skeleton className="h-[480px] rounded-3xl" /></div>

  const live = list.find((e) => e.eventStatus === 'ONGOING' && e.eventType === 'LIVESTREAM') ?? list.find((e) => e.eventStatus === 'ONGOING' && e.eventType === 'SHOW')
  const upcoming = list.filter((e) => e.eventStatus === 'UPCOMING').sort((a, b) => a.startDate.localeCompare(b.startDate))
  const next = upcoming[0]

  return (
    <>
      {live && <LiveStrip ev={live} />}
      {next && (
        <CountdownHero
          ev={next}
          search={<HeroSearch value={q} onChange={setQ} onSubmit={() => document.getElementById('explorer')?.scrollIntoView({ behavior: 'smooth' })} label={tx('Tìm sự kiện', 'Search events', '행사 검색')} placeholder={tx('Tìm sự kiện, đơn vị tổ chức, địa điểm…', 'Search events, organizers, venues…', '행사, 주최, 장소 검색…')} />}
        />
      )}

      <EventExplorer list={list} search={next ? { q, setQ } : undefined} />

      <div className="h-16" />
    </>
  )
}

function LiveStrip({ ev }: { ev: EventItem }) {
  const { t, L } = useI18n()
  const show = ev.eventType === 'SHOW'
  return (
    <Link to={show ? `/events/${ev.id}` : `/live/${ev.id}`} className="group block bg-live text-white">
      <div className="container-page flex items-center gap-3 py-2.5 text-sm">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded bg-white/20 px-2 py-0.5 text-xs font-bold"><LiveDot /> {isOnAir(ev) ? t.events.live : t.events.status.ONGOING}</span>
        <span className="min-w-0 flex-1 truncate font-semibold">{L(ev.title)}</span>
        <span className="hidden shrink-0 items-center gap-1 font-semibold sm:inline-flex">{show ? t.common.viewDetail : t.events.watchNow} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
      </div>
    </Link>
  )
}

function CountdownHero({ ev, search }: { ev: EventItem; search: ReactNode }) {
  const { t, L, locale } = useI18n()
  const c = useCountdown(ev.startDate)
  const time = eventTimeRange(ev)
  const parts: [number, string][] = [[c.d, t.common.countdown[0]], [c.h, t.common.countdown[1]], [c.m, t.common.countdown[2]], [c.s, t.common.countdown[3]]]

  return (
    <PageHero
      tone="azure"
      search={search}
      crumbs={[{ label: t.common.home, to: '/' }, { label: t.nav.events }]}
      kicker={
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1 text-[13px] font-bold text-primary ring-1 ring-primary/25 backdrop-blur dark:bg-white/10 dark:text-[#7cc7ee] dark:ring-white/15">
          <span aria-hidden className="size-2 rounded-full bg-primary" />
          {t.home.upcoming} · {t.events.type[ev.eventType]}
        </motion.p>
      }
      title={L(ev.title)}
      titleKey={ev.id}
      subtitle={
        <span className="flex flex-wrap gap-x-5 gap-y-1">
          <span>{formatDate(ev.startDate, locale, { day: '2-digit', month: 'long', year: 'numeric' })}{time && ` · ${time}`}</span>
          {/* online-first: format/platform first, venue secondary and only when set */}
          {ev.format !== 'OFFLINE' && <span className="inline-flex items-center gap-1.5"><Video className="size-4" /> {formatLabel(ev.format)}{ev.platform ? ` · ${ev.platform}` : ''}</span>}
          {L(ev.location) && <span className="inline-flex items-center gap-1.5 opacity-80"><MapPin className="size-4" /> {L(ev.location)}</span>}
        </span>
      }
      aside={
        <Link
          to={`/events/${ev.id}`}
          className="group relative block aspect-[16/10] w-full max-w-[560px] overflow-hidden rounded-3xl bg-muted shadow-[0_30px_60px_-30px_rgba(0,70,110,0.5)] ring-1 ring-white/70 dark:ring-white/10"
        >
          <img src={img(ev.coverImage, 1200, 760)} alt="" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#041a2b]/55 via-transparent to-transparent" />
          <span className="absolute left-4 top-4 grid min-w-14 place-items-center rounded-2xl bg-white/95 px-3 py-2 text-center shadow-md">
            <span className="text-[11px] font-bold uppercase leading-none tracking-wide text-primary">{formatDate(ev.startDate, locale, { month: 'short' })}</span>
            <span className="mt-1 text-2xl font-extrabold leading-none text-[#06344d]">{formatDate(ev.startDate, locale, { day: '2-digit' })}</span>
          </span>
        </Link>
      }
    >
      {/* countdown: four tiles; Be Vietnam Pro has no tabular figures, so each digit gets its own fixed slot */}
      <div className="flex w-full gap-2 md:gap-3">
        {parts.map(([v, label]) => {
          const digits = String(v).padStart(2, '0')
          return (
            <div key={label} className="min-w-0 rounded-2xl bg-white/85 px-3 pb-2.5 pt-3 text-center shadow-[0_14px_30px_-20px_rgba(0,80,125,0.45)] ring-1 ring-primary/15 backdrop-blur md:px-4 dark:bg-white/5 dark:ring-white/10">
              <div className="relative mx-auto h-[36px] overflow-hidden text-[30px] font-extrabold leading-[36px] text-primary md:h-[56px] md:text-[48px] md:leading-[56px] dark:text-[#7cc7ee]" style={{ width: `${digits.length * 0.68}em` }}>
                <motion.span key={v} initial={{ y: '-100%' }} animate={{ y: 0 }} transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }} className="absolute inset-0 flex">
                  {[...digits].map((d, i) => <span key={i} className="flex-1 text-center">{d}</span>)}
                </motion.span>
              </div>
              <p className="mt-0.5 text-[12px] font-semibold text-[#12384d]/75 dark:text-white/70">{label}</p>
            </div>
          )
        })}
      </div>
      <Link to={`/events/${ev.id}`} className={buttonClass('default', 'lg')}><Ticket /> {t.events.register}</Link>
      <Link to={`/events/${ev.id}`} className={buttonClass('ghost', 'lg', 'border border-primary/40 bg-white/70 text-primary hover:bg-white hover:text-primary dark:border-white/25 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:hover:text-white')}>{t.common.viewDetail}</Link>
    </PageHero>
  )
}
