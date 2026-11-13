/** Add an event to a personal calendar: Google link and downloadable .ics (works for Outlook / Apple). */
import { CalendarPlus, Download } from 'lucide-react'
import type { EventItem } from '@/data/mock'
import { Button } from '@/components/ui/primitives'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'
import { cn } from '@/lib/utils'

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')

export function eventIcs(ev: EventItem, title: string, where: string, description: string, url: string) {
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//VCCI//Events//VI', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:${ev.id}@vcci.example`, `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(new Date(ev.startDate))}`, `DTEND:${stamp(new Date(ev.endDate))}`,
    `SUMMARY:${esc(title)}`, `LOCATION:${esc(where)}`, `DESCRIPTION:${esc(description)}`, `URL:${url}`,
    'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', `DESCRIPTION:${esc(title)}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
}

/** `menu`: one button opening the choices, where space is tight. */
export function AddToCalendar({ ev, className, tone = 'dark', menu }: { ev: EventItem; className?: string; tone?: 'dark' | 'light'; menu?: boolean }) {
  const { L } = useI18n()
  const title = L(ev.title)
  const where = L(ev.location)
  const url = `${window.location.origin}/events/${ev.id}`
  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${stamp(new Date(ev.startDate))}/${stamp(new Date(ev.endDate))}&location=${encodeURIComponent(where)}&details=${encodeURIComponent(`${L(ev.introduction)}\n${url}`)}`
  const download = () => {
    const blob = new Blob([eventIcs(ev, title, where, L(ev.introduction), url)], { type: 'text/calendar;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${ev.id}.ics`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  // the outline Button paints a light background: on dark it must be transparent or the white label disappears
  const cls = tone === 'dark' ? 'border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white' : ''
  if (menu) return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={cn('inline-flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-2 text-[13px] font-semibold transition sm:text-sm', tone === 'dark' ? 'border-white/25 text-white hover:bg-white/10' : 'hover:bg-muted', className)}><CalendarPlus className="size-4" aria-hidden /> {tx('Thêm vào lịch', 'Add to calendar', '캘린더에 추가')}</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem asChild><a href={google} target="_blank" rel="noreferrer">Google Calendar</a></DropdownMenuItem>
        <DropdownMenuItem onSelect={download}>Outlook / Apple (.ics)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <a href={google} target="_blank" rel="noreferrer" className={cn('inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-[13px] font-semibold transition hover:bg-muted', cls)}>
        <CalendarPlus className="size-4" /> {tx('Google Calendar', 'Google Calendar', 'Google 캘린더')}
      </a>
      <Button variant="outline" size="sm" className={cls} onClick={download}><Download /> {tx('Tệp .ics (Outlook, Apple)', '.ics file (Outlook, Apple)', '.ics 파일 (Outlook, Apple)')}</Button>
    </div>
  )
}
