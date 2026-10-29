/** Trade-show layout: immersive countdown hero + live strip + month-grouped schedule + past recordings. */
import { motion } from 'motion/react'
import { ArrowRight, ArrowUpRight, MapPin, Radio, Ticket, Video } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { searchEvents } from '@/api'
import type { EventItem, EventType } from '@/data/mock'
import { EventCard } from '@/components/cards'
import { LiveDot, useCountdown } from '@/components/effects'
import { Tabs } from '@/components/ui/overlay'
import { buttonClass, Skeleton } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { formatDate, formatMoney, img } from '@/lib/utils'

export default function Events() {
  const { t, lang } = useI18n()
  const [list, setList] = useState<EventItem[] | null>(null)
  const [type, setType] = useState<'ALL' | EventType>('ALL')

  useEffect(() => {
    searchEvents().then(setList)
  }, [lang])

  if (!list) return <div className="container-page py-10"><Skeleton className="h-[480px] rounded-3xl" /></div>

  const live = list.find((e) => e.eventStatus === 'ONGOING')
  const upcoming = list.filter((e) => e.eventStatus === 'UPCOMING').sort((a, b) => a.startDate.localeCompare(b.startDate))
  const next = upcoming[0]
  const schedule = upcoming.filter((e) => type === 'ALL' || e.eventType === type)
  const past = list.filter((e) => e.eventStatus === 'ENDED')
  const byMonth = schedule.reduce<Record<string, EventItem[]>>((acc, e) => {
    const k = e.startDate.slice(0, 7)
    ;(acc[k] ??= []).push(e)
    return acc
  }, {})

  return (
    <>
      {live && <LiveStrip ev={live} />}
      {next && <CountdownHero ev={next} />}

      <section className="container-page mt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl font-extrabold tracking-tight">{t.events.viewCalendar}</h2>
          <Tabs
            layoutId="ev-type"
            size="sm"
            value={type}
            onValueChange={(v) => setType(v as typeof type)}
            items={[
              { value: 'ALL', label: t.searchPage.all },
              { value: 'WEBINAR', label: t.events.type.WEBINAR },
              { value: 'LIVESTREAM', label: t.events.type.LIVESTREAM },
            ]}
          />
        </div>
        <div className="mt-8 space-y-10">
          {Object.entries(byMonth).map(([month, items]) => (
            <MonthGroup key={month} month={month} items={items} />
          ))}
          {schedule.length === 0 && <p className="text-muted-foreground">{t.common.noResults}</p>}
        </div>
      </section>

      {past.length > 0 && (
        <section className="container-page mt-20">
          <h2 className="text-2xl font-extrabold tracking-tight">{t.events.status.ENDED}</h2>
          <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}
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
          <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> {L(ev.location)}</span>
        </p>
        <div className="mt-10 flex flex-wrap items-end justify-between gap-8">
          <div className="flex gap-3 md:gap-6">
            {parts.map(([v, label]) => (
              <div key={label} className="text-center">
                <div className="relative h-[56px] w-[64px] overflow-hidden md:h-[88px] md:w-[104px]">
                  <motion.span key={v} initial={{ y: '-100%' }} animate={{ y: 0 }} transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }} className="absolute inset-0 text-5xl font-extrabold tabular-nums tracking-tighter md:text-[84px] md:leading-[88px]">
                    {String(v).padStart(2, '0')}
                  </motion.span>
                </div>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/55">{label}</p>
              </div>
            ))}
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

function MonthGroup({ month, items }: { month: string; items: EventItem[] }) {
  const { t, L, locale } = useI18n()
  const label = formatDate(`${month}-01T00:00:00`, locale, { month: 'long', year: 'numeric' })
  return (
    <div className="grid gap-4 md:grid-cols-[200px_minmax(0,1fr)]">
      <p className="text-lg font-extrabold capitalize text-primary md:sticky md:top-36 md:self-start">{label}</p>
      <ol className="divide-y border-y">
        {items.map((e, i) => {
          const d = new Date(e.startDate)
          return (
            <motion.li key={e.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
              <Link to={`/events/${e.id}`} className="group grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-5 py-5">
                <div className="text-center">
                  <p className="text-3xl font-extrabold leading-none">{String(d.getDate()).padStart(2, '0')}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase text-muted-foreground">{formatDate(e.startDate, locale, { weekday: 'short' })}</p>
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    {e.eventType === 'LIVESTREAM' ? <Radio className="size-3.5" /> : <Video className="size-3.5" />}
                    {t.events.type[e.eventType]} · {e.startTime}–{e.endTime} · {L(e.location)}
                  </p>
                  <p className="mt-1 text-lg font-bold leading-snug transition-colors group-hover:text-primary">{L(e.title)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {L(e.organizedBy)} · {e.participationFee ? formatMoney(e.participationFee, e.participationFeeCurrency, locale) : t.common.free}
                  </p>
                </div>
                <span className="grid size-11 place-items-center rounded-full border transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                  <ArrowUpRight className="size-4" />
                </span>
              </Link>
            </motion.li>
          )
        })}
      </ol>
    </div>
  )
}
