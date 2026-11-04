/** GET /api/public/shows/{idOrSlug}/full -> FE Show (data/shows.ts). BE sends Bilingual {vi,en,ko} for content fields. */
import { IMG } from '@/data/mock'
import type { Show, ShowBooth, ShowFaq, ShowHighlight, ShowLaunch, ShowSession, ShowSpeaker, ShowStat, ShowWhyAttend } from '@/data/shows'
import type { Bilingual } from '@/lib/i18n'
import { arr, biAny, id, num, str, url, type Raw } from './common'

const showKey = (v: unknown) => `s-${String(v).replace(/^s-/, '')}`
/** FE show id (`s-3`) -> numeric BE id used by /api/public/shows/{id}/... and /api/shows/{id}/... */
export const beShowId = (feId: string) => feId.replace(/^s-/, '')
export const isShowId = (feId: string) => /^s-\d+$/.test(feId)

const filled = (b: Bilingual) => !!(b.vi || b.en || b.ko)
/** Optional content field: missing or blank stays undefined so the UI falls back to what it shows today. */
const optText = (v: unknown) => {
  if (v == null) return undefined
  const b = biAny(v)
  return filled(b) ? b : undefined
}
const optUrl = (v: unknown) => url(v, '') || undefined
/** CMS-entered link: only http(s) and same-site paths may become an href. */
const safeLink = (v: unknown) => {
  const s = str(v).trim()
  return /^(https?:\/\/|\/(?!\/))/i.test(s) ? s : undefined
}

export function toShow(r: Raw): Show {
  const booths: ShowBooth[] = arr(r.booths).map((b) => ({
    id: id(b.id), name: biAny(b.name), org: biAny(b.org), country: str(b.country), pavilionId: id(b.pavilionId), phaseId: id(b.phaseId),
    side: str(b.side, 'SELLER') === 'SUPPORT' ? 'SUPPORT' : 'SELLER', accent: str(b.accent, '#0b4f8a'), cover: url(b.cover, IMG.warehouse),
    tagline: biAny(b.tagline), about: biAny(b.about), verified: Boolean(b.verified), businessId: b.businessId ? id(b.businessId) : undefined,
    website: b.website ? str(b.website) : undefined,
    products: arr(b.products).map((p) => ({ id: id(p.id), name: biAny(p.name), image: url(p.image, IMG.warehouse), blurb: biAny(p.blurb), featured: Boolean(p.featured), moq: p.moq ? str(p.moq) : undefined, linkId: p.linkId ? id(p.linkId) : undefined })),
  }))
  const launches: ShowLaunch[] = arr(r.launches).map((l) => ({ id: id(l.id), boothId: id(l.boothId), productId: id(l.productId), stage: biAny(l.stage), start: str(l.start), end: str(l.end), live: Boolean(l.live), followers: num(l.followers),
    streamEventId: l.streamEventId != null ? id(l.streamEventId) : undefined, streamSessionId: l.streamSessionId != null ? id(l.streamSessionId) : undefined }))
  const speakers: ShowSpeaker[] = arr(r.speakers).map((s) => ({ id: id(s.id), name: str(s.name), title: biAny(s.title), org: biAny(s.org), country: str(s.country), bio: biAny(s.bio), accent: str(s.accent, '#0b4f8a') }))
  const sessions: ShowSession[] = arr(r.sessions).map((s) => ({
    id: id(s.id), kind: str(s.kind, 'SEMINAR') as ShowSession['kind'], title: biAny(s.title), summary: biAny(s.summary), speakerIds: arr(s.speakerIds).map(id), room: biAny(s.room),
    start: str(s.start), end: str(s.end), capacity: num(s.capacity), booked: num(s.booked), status: str(s.status, 'PUBLISHED') as ShowSession['status'], hasReplay: Boolean(s.hasReplay), phaseId: id(s.phaseId), tags: arr<string>(s.tags),
    live: s.live?.eventId != null ? { eventType: str(s.live.eventType), eventId: id(s.live.eventId), sessionId: id(s.live.sessionId) } : undefined,
    recordingUrl: optUrl(s.recordingUrl),
  }))
  const stats: ShowStat[] = arr(r.stats).map((x) => ({ label: biAny(x.label), value: biAny(x.value) })).filter((x) => filled(x.label) && filled(x.value))
  const whyAttend: ShowWhyAttend[] = arr(r.whyAttend).map((x) => ({ title: biAny(x.title), text: biAny(x.text) })).filter((x) => filled(x.title))
  const topics: Bilingual[] = arr(r.topics).map((x) => biAny(typeof x === 'string' ? x : x?.title)).filter(filled)
  const highlights: ShowHighlight[] = arr(r.highlights).map((x) => ({ title: biAny(x.title), text: biAny(x.text), image: optUrl(x.image), video: optUrl(x.video), link: safeLink(x.link), hero: x.kind === 'hero' })).filter((x) => filled(x.title))
  const faq: ShowFaq[] = arr(r.faq).map((x) => ({ q: biAny(x.q), a: biAny(x.a) })).filter((x) => filled(x.q) && filled(x.a))
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
    minAge: num(r.minAge) || undefined,
    boothCapacity: num(r.boothCapacity), visitorTicketFee: num(r.visitorTicketFee), ticketCurrency: str(r.ticketCurrency, 'VND') === 'USD' ? 'USD' : 'VND',
    requireVisitorApproval: Boolean(r.requireVisitorApproval), boothFee: num(r.boothFee), registrationDeadline: str(r.registrationDeadline),
    issuedBadges: num(r.issuedBadges), inquiries: num(r.inquiries),
    phases: arr(r.phases).map((p) => ({ id: id(p.id), name: biAny(p.name), start: str(p.start), end: str(p.end), theme: biAny(p.theme) })),
    pavilions: arr(r.pavilions).map((p) => ({ id: id(p.id), name: biAny(p.name), industry: str(p.industry) })),
    booths, launches, speakers, sessions,
    contact: { name: str(r.contact?.name), email: str(r.contact?.email), phone: str(r.contact?.phone) },
    rules: arr(r.rules).map(biAny),
    heroTitle: optText(r.heroTitle), heroBadge: optText(r.heroBadge), banner: optUrl(r.banner ?? r.bannerImage),
    stats, whyAttend, topics, highlights, faq,
  }
}
