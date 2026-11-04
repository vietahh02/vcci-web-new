/**
 * Event status is COMPUTED from the clock, never typed by hand (CR-2026-002 EV-02).
 * The VCCI site shows stale hand-typed labels; here a stored `eventStatus` is only a fallback seed.
 */
import type { EventItem, EventStatus } from '@/data/mock'

export type RegState = 'OPEN' | 'CLOSING' | 'FULL' | 'CLOSED' | 'NOT_OPEN' | 'NONE'

/** "09:00–17:00", or '' for an all-day event: the catalog encodes "no time" as 00:00–23:59, which must never reach the screen. */
export function eventTimeRange(ev: Pick<EventItem, 'startTime' | 'endTime'>): string {
  const start = ev.startTime === '00:00' && (!ev.endTime || ev.endTime === '23:59') ? '' : ev.startTime
  const end = ev.endTime === '23:59' ? '' : ev.endTime
  return start && end ? `${start}–${end}` : start || end
}
/** Start time for one-line date labels, '' for an all-day event. */
export const eventStartTime = (ev: Pick<EventItem, 'startTime' | 'endTime'>) => (eventTimeRange(ev) ? ev.startTime : '')

const endOfDay = (iso: string) => {
  const d = new Date(iso)
  if (iso.length <= 10) d.setHours(23, 59, 59, 999)
  return d
}

export function computeStatus(ev: Pick<EventItem, 'startDate' | 'endDate' | 'eventStatus'>, now = new Date()): EventStatus {
  const start = new Date(ev.startDate)
  const end = new Date(ev.endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return ev.eventStatus
  if (now < start) return 'UPCOMING'
  if (now > end) return 'ENDED'
  return 'ONGOING'
}

export const withComputedStatus = (ev: EventItem): EventItem => ({ ...ev, eventStatus: computeStatus(ev) })

/** Registration badge shown next to the time-based status. */
export function registrationState(ev: EventItem, now = new Date()): { state: RegState; daysLeft: number } {
  if (ev.eventStatus === 'ENDED') return { state: 'NONE', daysLeft: 0 }
  // no explicit deadline: single-day events close at start; multi-day programmes stay open until they end
  const multiDay = ev.endDate.slice(0, 10) !== ev.startDate.slice(0, 10)
  const deadline = endOfDay(ev.registrationDeadline ?? (multiDay ? ev.endDate : ev.startDate))
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / 86_400_000)
  // Show: the API's label decides, so the list agrees with the detail page; the clock only says how soon it closes
  if (ev.displayLabel === 'FULL') return { state: 'FULL', daysLeft }
  if (ev.displayLabel === 'REG_NOT_OPEN') return { state: 'NOT_OPEN', daysLeft }
  if (ev.displayLabel === 'REG_CLOSED') return { state: 'CLOSED', daysLeft }
  if (ev.displayLabel === 'REG_OPEN') return { state: daysLeft <= 3 ? 'CLOSING' : 'OPEN', daysLeft }
  if (ev.maxSlots > 0 && ev.registeredSlots >= ev.maxSlots) return { state: 'FULL', daysLeft }
  if (now > deadline) return { state: 'CLOSED', daysLeft }
  return { state: daysLeft <= 3 ? 'CLOSING' : 'OPEN', daysLeft }
}
