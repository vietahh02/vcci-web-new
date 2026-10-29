/** Phase → day-column → time-slot grid, modelled on the Global Sources "New Product Launch" schedule. */
import { motion } from 'motion/react'
import { CalendarDays, MapPin } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { EventProgramme, ScheduleSlot } from '@/data/schedules'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'
import { cn, formatDate } from '@/lib/utils'

export function ScheduleGrid({ programme }: { programme: EventProgramme }) {
  const { L, locale } = useI18n()
  const [phaseId, setPhaseId] = useState(programme.phases[0]!.id)
  const phase = programme.phases.find((p) => p.id === phaseId)!
  const [mobileDay, setMobileDay] = useState(0)
  const byDate = phase.dates.map((d) => programme.schedule.filter((s) => s.phaseId === phase.id && s.date === d).sort((a, b) => a.start.localeCompare(b.start)))
  const rows = Math.max(...byDate.map((l) => l.length))
  const dayLabel = (d: string) => formatDate(`${d}T12:00:00`, locale, { day: 'numeric', month: 'long', year: 'numeric' }) + ` (${formatDate(`${d}T12:00:00`, locale, { weekday: 'long' })})`

  return (
    <section>
      {programme.phases.length > 1 && (
        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          {programme.phases.map((p) => {
            const on = p.id === phaseId
            return (
              <button
                key={p.id}
                onClick={() => { setPhaseId(p.id); setMobileDay(0) }}
                className={cn('relative overflow-hidden rounded-2xl border p-5 text-left transition', on ? 'border-primary bg-primary-soft/60 shadow-sm' : 'hover:border-primary/40')}
              >
                <p className={cn('text-sm font-bold', on ? 'text-primary' : 'text-muted-foreground')}>{L(p.name)}</p>
                <p className="mt-1 text-[17px] font-bold leading-snug">{L(p.theme)}</p>
                <p className="mt-2 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <CalendarDays className="size-3.5" />
                  {p.dates.map((d) => formatDate(`${d}T12:00:00`, locale, { day: '2-digit', month: '2-digit', year: 'numeric' })).join(' – ')}
                </p>
                {on && <motion.span layoutId="phase-bar" className="absolute inset-x-0 bottom-0 h-1 bg-primary" />}
              </button>
            )
          })}
        </div>
      )}

      <h2 className="text-center text-2xl font-extrabold text-primary">
        {tx('Lịch trình', 'Schedule', '일정')} {L(phase.name)}
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">
        {L(phase.theme)} · <MapPin className="inline size-3.5" /> {L(phase.venue)}
      </p>

      {/* desktop: day columns */}
      <div className="mt-6 hidden overflow-hidden rounded-lg border md:block">
        <table className="w-full table-fixed border-collapse text-center text-[14px]">
          <thead>
            <tr className="bg-muted/70">
              {phase.dates.map((d) => (
                <th key={d} className="border-b border-r px-4 py-3.5 text-[13.5px] font-bold last:border-r-0">{dayLabel(d)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {byDate.map((list, c) => (
                  <td key={c} className="border-b border-r px-4 py-4 align-middle last:border-r-0">
                    {list[r] ? <SlotCell s={list[r]!} /> : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* mobile: day tabs */}
      <div className="mt-6 md:hidden">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
          {phase.dates.map((d, i) => (
            <button key={d} onClick={() => setMobileDay(i)} className={cn('shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-semibold', mobileDay === i ? 'border-primary bg-primary text-primary-foreground' : '')}>
              {formatDate(`${d}T12:00:00`, locale, { weekday: 'short', day: 'numeric', month: 'numeric' })}
            </button>
          ))}
        </div>
        <ul className="mt-2 divide-y rounded-lg border">
          {byDate[mobileDay]?.map((s) => <li key={s.start} className="px-4 py-4 text-center"><SlotCell s={s} /></li>)}
        </ul>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[13px]">
        <span className="text-muted-foreground">{tx('Ngành hàng', 'Categories', '품목')}:</span>
        {phase.categories.map((c) => <span key={c.en} className="rounded-full bg-muted px-3 py-1 font-medium">{L(c)}</span>)}
      </div>
    </section>
  )
}

function SlotCell({ s }: { s: ScheduleSlot }) {
  const { L } = useI18n()
  return (
    <div className="leading-relaxed">
      <p className="font-bold">{s.start}–{s.end}</p>
      {s.businessId ? (
        <Link to={`/suppliers/${s.businessId}`} className="text-foreground/85 hover:text-primary hover:underline">{L(s.company)}</Link>
      ) : (
        <p className="text-foreground/85">{L(s.company)}</p>
      )}
      <p className="text-foreground/75">
        {L(s.product)} <span className="text-muted-foreground">|</span> {tx('Gian hàng', 'Booth No.', '부스 번호')}: <span className="font-semibold text-foreground">{s.booth}</span>
      </p>
    </div>
  )
}
