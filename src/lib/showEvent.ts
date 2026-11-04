/** Adapts a Show Hub show to the generic EventItem so it lists next to webinars and livestreams. */
import type { EventItem, EventStatus } from '@/data/mock'
import type { Show } from '@/data/shows'
import { withComputedStatus } from '@/lib/eventStatus'

const hhmm = (iso: string) => new Date(iso).toTimeString().slice(0, 5)

/** Show times are Vietnam time. No time means all day: 00:00–23:59, which eventTimeRange never displays. */
export const showStartsAt = (s: Show) => `${s.startDate}T${s.startTime ?? '00:00'}:00+07:00`
export const showEndsAt = (s: Show) => `${s.endDate}T${s.endTime ?? '23:59'}:59+07:00`

export function showToEvent(s: Show): EventItem {
  const status: EventStatus = s.status === 'CANCELED' ? 'ENDED' : s.status
  return withComputedStatus({
    id: s.id,
    format: 'ONLINE',
    eventType: 'SHOW',
    title: s.title,
    introduction: s.introduction,
    coverImage: s.cover,
    startDate: showStartsAt(s),
    endDate: showEndsAt(s),
    startTime: s.startTime ?? '00:00',
    endTime: s.endTime ?? '23:59',
    eventStatus: status,
    displayLabel: s.displayLabel,
    industry: s.industries,
    participationFee: s.visitorTicketFee,
    participationFeeCurrency: s.ticketCurrency,
    registeredSlots: s.issuedBadges,
    // the /full payload has no visitor capacity; 0 means "no limit shown"
    maxSlots: 0,
    organizedBy: s.organizer,
    location: s.virtualVenue,
    agendaOptions: s.sessions.map((x) => ({ agendaStartTime: hhmm(x.start), agendaEndTime: hhmm(x.end), agendaTitle: x.title })),
    registrationDeadline: s.registrationDeadline || undefined,
  })
}
