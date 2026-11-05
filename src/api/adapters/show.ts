/** GET /api/public/shows/{idOrSlug}/full -> FE Show (data/shows.ts). BE sends Bilingual {vi,en,ko} for content fields. */
import { IMG } from '@/data/mock'
import type { Show, ShowBooth, ShowLaunch, ShowSession, ShowSpeaker } from '@/data/shows'
import { arr, biAny, id, num, str, url, type Raw } from './common'

const showKey = (v: unknown) => `s-${String(v).replace(/^s-/, '')}`
/** FE show id (`s-3`) -> numeric BE id used by /api/public/shows/{id}/... and /api/shows/{id}/... */
export const beShowId = (feId: string) => feId.replace(/^s-/, '')
export const isShowId = (feId: string) => /^s-\d+$/.test(feId)

export function toShow(r: Raw): Show {
  const booths: ShowBooth[] = arr(r.booths).map((b) => ({
    id: id(b.id), name: biAny(b.name), org: biAny(b.org), country: str(b.country), pavilionId: id(b.pavilionId), phaseId: id(b.phaseId),
    side: str(b.side, 'SELLER') === 'SUPPORT' ? 'SUPPORT' : 'SELLER', accent: str(b.accent, '#0b4f8a'), cover: url(b.cover, IMG.warehouse),
    tagline: biAny(b.tagline), about: biAny(b.about), verified: Boolean(b.verified), businessId: b.businessId ? id(b.businessId) : undefined,
    website: b.website ? str(b.website) : undefined,
    products: arr(b.products).map((p) => ({ id: id(p.id), name: biAny(p.name), image: url(p.image, IMG.warehouse), blurb: biAny(p.blurb), featured: Boolean(p.featured), moq: p.moq ? str(p.moq) : undefined, linkId: p.linkId ? id(p.linkId) : undefined })),
  }))
  const launches: ShowLaunch[] = arr(r.launches).map((l) => ({ id: id(l.id), boothId: id(l.boothId), productId: id(l.productId), stage: biAny(l.stage), start: str(l.start), end: str(l.end), live: Boolean(l.live), followers: num(l.followers) }))
  const speakers: ShowSpeaker[] = arr(r.speakers).map((s) => ({ id: id(s.id), name: str(s.name), title: biAny(s.title), org: biAny(s.org), country: str(s.country), bio: biAny(s.bio), accent: str(s.accent, '#0b4f8a') }))
  const sessions: ShowSession[] = arr(r.sessions).map((s) => ({
    id: id(s.id), kind: str(s.kind, 'SEMINAR') as ShowSession['kind'], title: biAny(s.title), summary: biAny(s.summary), speakerIds: arr(s.speakerIds).map(id), room: biAny(s.room),
    start: str(s.start), end: str(s.end), capacity: num(s.capacity), booked: num(s.booked), status: str(s.status, 'PUBLISHED') as ShowSession['status'], hasReplay: Boolean(s.hasReplay), phaseId: id(s.phaseId), tags: arr<string>(s.tags),
  }))
  return {
    id: showKey(r.id),
    title: biAny(r.title), tagline: biAny(r.tagline), introduction: biAny(r.introduction), cover: url(r.cover, IMG.handshake),
    status: str(r.status, 'UPCOMING') as Show['status'],
    direction: str(r.direction, 'EXPORT') === 'IMPORT' ? 'IMPORT' : 'EXPORT',
    exhibitorScope: str(r.exhibitorScope, 'DOMESTIC') === 'FOREIGN' ? 'FOREIGN' : 'DOMESTIC',
    targetMarkets: arr<string>(r.targetMarkets), industries: arr<string>(r.industries),
    startDate: str(r.startDate), endDate: str(r.endDate), organizer: biAny(r.organizer), virtualVenue: biAny(r.virtualVenue),
    format: (['ONLINE', 'OFFLINE', 'HYBRID'].includes(str(r.format)) ? str(r.format) : undefined) as Show['format'],
    physicalVenue: r.physicalVenue ? biAny(r.physicalVenue) : undefined,
    boothCapacity: num(r.boothCapacity), visitorTicketFee: num(r.visitorTicketFee), ticketCurrency: str(r.ticketCurrency, 'VND') === 'USD' ? 'USD' : 'VND',
    requireVisitorApproval: Boolean(r.requireVisitorApproval), boothFee: num(r.boothFee), registrationDeadline: str(r.registrationDeadline),
    issuedBadges: num(r.issuedBadges), inquiries: num(r.inquiries),
    phases: arr(r.phases).map((p) => ({ id: id(p.id), name: biAny(p.name), start: str(p.start), end: str(p.end), theme: biAny(p.theme) })),
    pavilions: arr(r.pavilions).map((p) => ({ id: id(p.id), name: biAny(p.name), industry: str(p.industry) })),
    booths, launches, speakers, sessions,
    contact: { name: str(r.contact?.name), email: str(r.contact?.email), phone: str(r.contact?.phone) },
    rules: arr(r.rules).map(biAny),
  }
}
