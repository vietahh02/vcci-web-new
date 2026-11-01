/** Adapts a Show Hub show to the generic EventItem so it lists next to webinars and livestreams. */
import type { EventItem, EventStatus } from '@/data/mock'
import type { Show } from '@/data/shows'
import { withComputedStatus } from '@/lib/eventStatus'

const hhmm = (iso: string) => new Date(iso).toTimeString().slice(0, 5)

export function showToEvent(s: Show): EventItem {
  const status: EventStatus = s.status === 'CANCELED' ? 'ENDED' : s.status
  return withComputedStatus({
    id: s.id,
    format: 'ONLINE',
    eventType: 'SHOW',
    title: s.title,
    introduction: s.introduction,
    coverImage: s.cover,
    startDate: `${s.startDate}T00:00:00`,
    endDate: `${s.endDate}T23:59:59`,
    startTime: '00:00',
    endTime: '23:59',
    eventStatus: status,
    industry: s.industries,
    participationFee: s.visitorTicketFee,
    participationFeeCurrency: 'VND',
    registeredSlots: s.issuedBadges,
    maxSlots: Math.round(s.issuedBadges * 1.4),
    organizedBy: s.organizer,
    location: s.virtualVenue,
    agendaOptions: s.sessions.map((x) => ({ agendaStartTime: hhmm(x.start), agendaEndTime: hhmm(x.end), agendaTitle: x.title })),
    registrationDeadline: s.registrationDeadline,
  })
}
