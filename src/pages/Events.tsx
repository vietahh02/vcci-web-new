/** Trade-show layout: immersive countdown hero + live strip + month-grouped schedule + past recordings. */
import { motion } from 'motion/react'
import { ArrowRight, MapPin, Ticket, Video } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { searchEvents } from '@/api'
import type { EventItem } from '@/data/mock'
import { EventExplorer, formatLabel } from '@/components/event/EventExplorer'
import { LiveDot, useCountdown } from '@/components/effects'
import { buttonClass, Skeleton } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { formatDate, img } from '@/lib/utils'

export default function Events() {
  const { lang } = useI18n()
  const [list, setList] = useState<EventItem[] | null>(null)

  useEffect(() => {
    searchEvents().then(setList, () => setList([]))
  }, [lang])

  if (!list) return <div className="container-page py-10"><Skeleton className="h-[480px] rounded-3xl" /></div>

  const live = list.find((e) => e.eventStatus === 'ONGOING' && e.eventType === 'LIVESTREAM')
  const upcoming = list.filter((e) => e.eventStatus === 'UPCOMING').sort((a, b) => a.startDate.localeCompare(b.startDate))
  const next = upcoming[0]

  return (
    <>
      {live && <LiveStrip ev={live} />}
      {next && <CountdownHero ev={next} />}

      <EventExplorer list={list} />

      <div className="h-16" />
    </>
  )
}

function LiveStrip({ ev }: { ev: EventItem }) {
  const { t, L } = useI18n()
  return (
    <Link to={`/live/${ev.id}`} className="group block bg-live text-white">
      <div className="container-page flex items-center gap-3 py-2.5 text-sm">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded bg-white/20 px-2 py-0.5 text-xs font-bold"><LiveDot /> {t.events.live}</span>
        <span className="min-w-0 flex-1 truncate font-semibold">{L(ev.title)}</span>
        <span className="hidden shrink-0 items-center gap-1 font-semibold sm:inline-flex">{t.events.watchNow} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
      </div>
    </Link>
  )
}

function CountdownHero({ ev }: { ev: EventItem }) {
  const { t, L, locale } = useI18n()
  const c = useCountdown(ev.startDate)
  const parts: [number, string][] = [[c.d, t.common.countdown[0]], [c.h, t.common.countdown[1]], [c.m, t.common.countdown[2]], [c.s, t.common.countdown[3]]]

  return (
    <section className="relative isolate overflow-hidden bg-navy text-white">
      <img src={img(ev.coverImage, 1920, 1000)} alt="" className="absolute inset-0 -z-20 size-full animate-kenburns object-cover opacity-45" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy via-navy/60 to-navy/30" />
      <div className="container-page flex min-h-[560px] flex-col justify-end py-14">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[13px] font-semibold uppercase tracking-[0.18em] text-gold-bright">
          {t.home.upcoming} · {t.events.type[ev.eventType]}
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mt-3 max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight text-balance md:text-6xl">
          {L(ev.title)}
        </motion.h1>
        <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-white/75">
          <span>{formatDate(ev.startDate, locale, { day: '2-digit', month: 'long', year: 'numeric' })} · {ev.startTime}–{ev.endTime}</span>
          {/* online-first: format/platform first, venue secondary and only when set */}
          {ev.format !== 'OFFLINE' && <span className="inline-flex items-center gap-1.5"><Video className="size-4" /> {formatLabel(ev.format)}{ev.platform ? ` · ${ev.platform}` : ''}</span>}
          {L(ev.location) && <span className="inline-flex items-center gap-1.5 text-white/60"><MapPin className="size-4" /> {L(ev.location)}</span>}
        </p>
        <div className="mt-10 flex flex-wrap items-end justify-between gap-8">
          <div className="flex flex-wrap gap-3 md:gap-6">
            {parts.map(([v, label]) => {
              const digits = String(v).padStart(2, '0')
              return (
                <div key={label} className="text-center">
                  {/* Be Vietnam Pro has no tabular figures, so each digit gets its own fixed slot */}
                  <div className="relative h-[56px] overflow-hidden text-[44px] font-extrabold leading-[56px] md:h-[88px] md:text-[84px] md:leading-[88px]" style={{ width: `${digits.length * 0.68}em` }}>
                    <motion.span key={v} initial={{ y: '-100%' }} animate={{ y: 0 }} transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }} className="absolute inset-0 flex">
                      {[...digits].map((d, i) => <span key={i} className="flex-1 text-center">{d}</span>)}
                    </motion.span>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/55">{label}</p>
                </div>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={`/events/${ev.id}`} className={buttonClass('gold', 'lg')}><Ticket /> {t.events.register}</Link>
            <Link to={`/events/${ev.id}`} className={buttonClass('ghost', 'lg', 'border border-white/25 text-white hover:bg-white/10')}>{t.common.viewDetail}</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
