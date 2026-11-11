import type { EventFormat, EventItem, EventStatus, EventType } from '@/data/mock'
import { IMG } from '@/data/mock'
import { isOnlineFormat, withComputedStatus } from '@/lib/eventStatus'
import type { SectionKey } from '@/lib/profile'
import { arr, bi, id, num, str, url, type Raw } from './common'
import { toShowLabel } from './show'

const hhmm = (s: unknown) => {
  const v = str(s)
  return /^\d{2}:\d{2}/.test(v) ? v.slice(0, 5) : v ? new Date(v).toTimeString().slice(0, 5) : ''
}

/** EventItemDto (GET /api/event/search, /api/event/{id}) -> FE EventItem. Status is computed by BE (clock); FE recomputes the same way. */
export function toEvent(r: Raw): EventItem {
  const fee = r.participationFee == null ? 0 : num(r.participationFee)
  const ev: EventItem = {
    id: id(r.id),
    showId: r.showId ? str(r.showId) : undefined,
    eventType: str(r.eventType, 'WEBINAR') as EventType,
    title: bi(r.title),
    introduction: bi(r.introduction),
    coverImage: url(r.coverImage, IMG.videoCall),
    startDate: str(r.startDate),
    endDate: str(r.endDate || r.startDate),
    startTime: hhmm(r.startTime || r.startDate),
    endTime: hhmm(r.endTime || r.endDate),
    eventStatus: str(r.eventStatus, 'UPCOMING') as EventStatus,
    industry: arr<string>(r.industry),
    participationFee: fee,
    participationFeeCurrency: str(r.participationFeeCurrency, 'VND') === 'USD' ? 'USD' : 'VND',
    registeredSlots: num(r.registeredSlots),
    maxSlots: num(r.maxSlots),
    organizedBy: bi(r.organizedBy),
    // an ONLINE show has no address, whatever is left in the catalog row: the UI says "Online"
    location: bi(str(r.eventType) === 'SHOW' && isOnlineFormat(str(r.format)) ? '' : r.location),
    format: (str(r.format, 'ONLINE') || 'ONLINE') as EventFormat,
    // SRS / Jitsi are our own streaming back ends: to the visitor that is simply "on the VCCI platform"
    platform: r.platform && !/^(srs|jitsi)$/i.test(str(r.platform)) ? str(r.platform) : undefined,
    // BE contract: {startTime,endTime,title,description}; the older FE-shaped keys are still accepted
    agendaOptions: arr(r.agendaOptions).map((a) => ({
      agendaStartTime: hhmm(a.startTime ?? a.agendaStartTime),
      agendaEndTime: hhmm(a.endTime ?? a.agendaEndTime),
      agendaTitle: bi(a.title ?? a.agendaTitle),
      speaker: a.speaker ? bi(a.speaker) : a.description ? bi(a.description) : undefined,
    })),
    series: r.series ? bi(r.series) : undefined,
    partner: r.partner ? bi(r.partner) : undefined,
    targetMarket: r.targetMarket ? bi(r.targetMarket) : undefined,
    eligibility: r.eligibility ? arr<string>(r.eligibility).map(bi) : undefined,
    requiredSections: r.requiredSections ? (arr<string>(r.requiredSections) as SectionKey[]) : undefined,
    registrationDeadline: r.registrationDeadline ? str(r.registrationDeadline) : undefined,
    quota: r.quota == null ? undefined : num(r.quota),
    contact: r.contact ? { name: str(r.contact.name), phone: str(r.contact.phone), email: str(r.contact.email) } : undefined,
    speakers: r.speakers ? arr(r.speakers).map((s) => ({ name: str(s.name), title: bi(s.title), org: bi(s.org) })) : undefined,
    topics: r.topics ? arr<string>(r.topics).map(bi) : undefined,
    bankInfo: r.bankInfo ? { bank: str(r.bankInfo.bank), accountNo: str(r.bankInfo.accountNo), accountName: str(r.bankInfo.accountName), qrContent: r.bankInfo.qrContent ? str(r.bankInfo.qrContent) : undefined } : undefined,
    myRegistration: r.myRegistration ? { id: id(r.myRegistration.id), status: str(r.myRegistration.status) } : undefined,
    questions: r.questions ? arr(r.questions).map((q) => ({ id: str(q.id), label: bi(q.label), options: q.options ? arr<string>(q.options).map(bi) : undefined })) : undefined,
  }
  return withComputedStatus(ev)
}

/** ShowCard (GET /api/public/shows) -> EventItem of type SHOW so shows list next to webinars. id = `s-{showId}`. */
export function showCardToEvent(r: Raw): EventItem {
  const status = str(r.status, 'UPCOMING')
  return withComputedStatus({
    id: `s-${r.id}`,
    eventType: 'SHOW',
    format: (str(r.format, 'ONLINE') || 'ONLINE') as EventFormat,
    title: bi(r.name),
    introduction: bi(r.shortDescription),
    coverImage: url(r.coverImage, IMG.handshake),
    startDate: `${str(r.startDate)}T00:00:00`,
    endDate: `${str(r.endDate || r.startDate)}T23:59:59`,
    startTime: '00:00',
    endTime: '23:59',
    eventStatus: (status === 'CANCELED' ? 'ENDED' : status) as EventStatus,
    displayLabel: toShowLabel(r.displayLabel),
    industry: [],
    participationFee: num(r.visitorTicketFee),
    participationFeeCurrency: str(r.ticketCurrency, 'VND') === 'USD' ? 'USD' : 'VND',
    registeredSlots: num(r.visitorCount),
    maxSlots: 0,
    organizedBy: bi('VCCI'),
    location: bi(isOnlineFormat(str(r.format)) ? '' : str(r.venueName || r.city)),
    agendaOptions: [],
  })
}

/** FE RegistrationFormDto (mode FORM) -> body of POST /api/event/registrations. */
export interface RegistrationResult {
  id: string; regCode: string; status: string; needPayment: boolean; amount: number; currency: string
  badge?: { qrToken: string; name: string; jobTitle: string; company: string; dates: string[]; meetings: number }
  accessToken?: string
}
export const toRegistration = (r: Raw): RegistrationResult => ({
  id: id(r.id), regCode: str(r.regCode), status: str(r.status), needPayment: Boolean(r.needPayment), amount: num(r.amount), currency: str(r.currency),
  badge: r.badge ? { qrToken: str(r.badge.qrToken), name: str(r.badge.name), jobTitle: str(r.badge.jobTitle), company: str(r.badge.company), dates: arr<string>(r.badge.dates), meetings: num(r.badge.meetings) } : undefined,
  accessToken: r.accessToken ? str(r.accessToken) : undefined,
})
