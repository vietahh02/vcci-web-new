/** Adapters for the per-event endpoints (programme, products, participants, materials, recap, prep, messages, my registrations). */
import type { EventItem, Product } from '@/data/mock'
import type { Participant, Side } from '@/data/eventParticipants'
import type { Material } from '@/data/eventExtras'
import type { Recap } from '@/data/eventRecap'
import type { EventProgramme } from '@/data/schedules'
import type { TradedProduct } from '@/data/eventProducts'
import { arr, bi, biAny, id, num, str, url, type Raw } from './common'
import { toEvent, toRegistration, type RegistrationResult } from './event'
import { toProduct } from './product'

export interface RegistrationFull extends RegistrationResult {
  eventId: string
  createdAt: string
  rejectReason?: string
  prepPercent: number
  missingPrep: number
  event?: EventItem
}
export const toRegistrationFull = (r: Raw): RegistrationFull => ({
  ...toRegistration(r),
  eventId: id(r.eventId),
  createdAt: str(r.createdAt),
  rejectReason: r.rejectReason ? str(r.rejectReason) : undefined,
  prepPercent: num(r.prepPercent),
  missingPrep: num(r.missingPrep),
  event: r.event ? toEvent(r.event) : undefined,
})

/** Statuses that still hold a place (cancelled / rejected registrations are not "mine" any more). */
export const isActiveRegistration = (status: string) => !['CANCELED', 'CANCELLED', 'REJECTED'].includes(status)

export function toProgramme(r: Raw): EventProgramme | null {
  const phases = arr(r?.phases).map((p) => ({ id: id(p.id), name: biAny(p.name), theme: biAny(p.theme), dates: arr<string>(p.dates).map((d) => str(d).slice(0, 10)), venue: biAny(p.venue), categories: arr<string>(p.categories).map(biAny) }))
  if (!phases.length) return null
  return {
    phases,
    schedule: arr(r.schedule).map((s) => ({ phaseId: id(s.phaseId), date: str(s.date).slice(0, 10), start: str(s.start).slice(0, 5), end: str(s.end).slice(0, 5), company: biAny(s.company), businessId: s.businessId ? id(s.businessId) : undefined, product: biAny(s.product), booth: str(s.booth) })),
    launchZone: biAny(r.launchZone),
  }
}

export const toTradedProduct = (r: Raw): TradedProduct => ({ product: toProduct(r.product ?? r) as Product, quotes: num(r.quotes) })

export const toMaterial = (r: Raw): Material => ({ id: id(r.id), kind: (str(r.kind, 'REPORT') as Material['kind']), title: biAny(r.title), meta: str(r.meta), url: r.url ? url(r.url, '') : undefined })

export function toRecap(r: Raw): Recap {
  return {
    stats: arr(r.stats).map((s) => ({ label: biAny(s.label), value: num(s.value), suffix: s.suffix ? str(s.suffix) : undefined })),
    takeaways: arr<string>(r.takeaways).map(biAny),
    gallery: arr<string>(r.gallery).map((g) => url(g, '')).filter(Boolean),
    video: { title: biAny(r.video?.title), duration: str(r.video?.duration), url: r.video?.url ? url(r.video.url, '') : undefined },
    participants: arr(r.participants).map((p) => ({ name: str(p.name), country: str(p.country) })),
    testimonials: arr(r.testimonials).map((q) => ({ quote: biAny(q.quote), name: str(q.name), org: str(q.org) })),
    next: r.next ? { title: biAny(r.next.title), inDays: num(r.next.inDays) } : undefined,
    rating: r.rating ? { average: num(r.rating.average), count: num(r.rating.count) } : undefined,
  }
}

export const toParticipant = (r: Raw): Participant => ({
  id: id(r.id), name: str(r.name), nameEn: r.nameEn ? str(r.nameEn) : undefined, country: str(r.country), side: (str(r.side, 'SELLER') as Side),
  kind: biAny(r.kind), industries: arr<string>(r.industries), accent: str(r.accent, '#0b4f8a'), businessId: r.businessId ? id(r.businessId) : undefined,
  need: r.need ? biAny(r.need) : undefined, offer: r.offer ? arr<string>(r.offer).map(biAny) : undefined, online: Boolean(r.online), attended: Boolean(r.attended), quotes: num(r.quotes),
})

export interface LiveThreadMsg { id: string; from: 'me' | 'organizer'; text: string; at: string }
export const toThreadMsg = (r: Raw): LiveThreadMsg => ({ id: id(r.id), from: r.from === 'organizer' ? 'organizer' : 'me', text: str(r.text), at: str(r.at) })

export interface LivePrepTask { id: string; title: ReturnType<typeof bi>; hint?: ReturnType<typeof bi>; deadline?: string }
export interface LivePrep { doneTaskIds: string[]; percent: number; tasks: LivePrepTask[] }
export const toPrep = (r: Raw): LivePrep => ({
  doneTaskIds: arr<unknown>(r.doneTaskIds).map(id),
  percent: num(r.percent),
  tasks: arr(r.tasks).map((t) => ({ id: id(t.id), title: biAny(t.title), hint: t.hint ? biAny(t.hint) : undefined, deadline: t.deadline ? str(t.deadline) : undefined })),
})
