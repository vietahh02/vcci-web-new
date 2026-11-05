/**
 * LIVE data access layer: portal backend (vcci-portal-apis). Paths/params follow docs/dev/impl-*.md.
 * Public reads marked `orMock` serve sample data when the call fails, and only then: an empty response stays empty.
 */
import type { RestoredVisitor } from '@/lib/showReg'
import type { Business, Category, EventItem, ImportRequest, Product, SponsorTier } from '@/data/mock'
import type { PublicProfile } from '@/data/capability'
import type { Show } from '@/data/shows'
import { showToEvent } from '@/lib/showEvent'
import type { CompanyProfile, SectionKey } from '@/lib/profile'
import { initials } from '@/lib/utils'
import { arr, bi, id, num, str, type Raw } from './adapters/common'
import { toBusiness, toPublicProfile } from './adapters/business'
import { toCategory } from './adapters/category'
import { showCardToEvent, toEvent, toRegistration } from './adapters/event'
import { toRemoteProfile, type RemoteProfile } from './adapters/profile'
import { toProduct } from './adapters/product'
import { fromImportRequestInput, toImportRequest, type ImportRequestInput } from './adapters/request'
import { beShowId, isShowId, toShow, toShowLabel } from './adapters/show'
import { mockFallback } from './config'
import { registerUploadToken, fileIdOf } from './uploads'
import { ApiError, apiFetch, apiUnavailable, toPage, type Page } from './http'
import * as mock from './mockApi'

export type { ImportRequestInput }
export interface ProductQuery {
  keyword?: string
  categoryId?: string
  verifiedOnly?: boolean
  maxMoq?: number
  certificates?: string[]
  sort?: 'popular' | 'newest' | 'priceAsc' | 'priceDesc'
  page?: number
  size?: number
}

/** Run the live call; if it fails use the mock and log it. */
async function orMock<T>(endpoint: string, live: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
  try {
    return await live()
  } catch (e) {
    if (!apiUnavailable(e)) throw e
    mockFallback(endpoint, e instanceof Error ? e.message : 'unavailable')
    return fallback()
  }
}
const listOf = <T>(r: unknown) => (Array.isArray(r) ? (r as T[]) : toPage<T>(r).items)

/* ------------------------------------------------------------- categories */
/** Category id -> BE IndustryEnum, needed by POST /api/business/register (industry[]). */
export const categoryIndustry = new Map<string, string>()
export async function loadCategories(): Promise<Category[]> {
  // /api/categories/options carries the IndustryEnum needed by business registration. It needs a JWT on the portal (403 for
  // guests), so it must not block the public category list: guests register with industryIds (the BE maps them to IndustryEnum).
  await apiFetch('/api/categories/options').then(
    (r) => listOf<Raw>(r).forEach((x) => x.industry && categoryIndustry.set(id(x.id), str(x.industry))),
    (e) => mockFallback('GET /api/categories/options (industry map)', e instanceof Error ? e.message : 'unavailable'),
  )
  // one request per UI language so the category list can switch language without refetching
  const get = async (lang: string) => listOf<Raw>(await apiFetch('/api/public/home/categories', { headers: { 'Accept-Language': lang } }))
  const [vi, en, ko] = await Promise.all([get('vi'), get('en'), get('ko').catch(() => [] as Raw[])])
  const nm = (list: Raw[], r: Raw) => str(list.find((x) => id(x.id) === id(r.id))?.categoryName)
  return vi.map((r) => toCategory(r, { vi: str(r.categoryName), en: nm(en, r) || str(r.categoryName), ko: nm(ko, r) || nm(en, r) || str(r.categoryName) }, { en: arr<string>(en.find((x) => id(x.id) === id(r.id))?.sub), vi: arr<string>(r.sub), ko: arr<string>(ko.find((x) => id(x.id) === id(r.id))?.sub) }))
}

/* --------------------------------------------------------------- products */
/** GET /api/products/search: keyword, categoryId, maxMoq, certificates, sort and page/size are all applied by the BE (paged in the DB). */
export async function searchProductsPage(q: ProductQuery = {}): Promise<Page<Product>> {
  const size = q.size ?? 24
  const page = toPage<Raw>(await apiFetch('/api/products/search', {
    query: { keyword: q.keyword, categoryId: q.categoryId, maxMoq: q.maxMoq, certificates: q.certificates, sort: q.sort, page: q.page ?? 0, size },
  }), size)
  return { ...page, items: page.items.map(toProduct) }
}
export async function searchProducts(q: ProductQuery = {}): Promise<Product[]> {
  return (await searchProductsPage(q)).items
}
/** GET /api/products/{id} (null on 404) */
export async function getProduct(pid: string): Promise<Product | null> {
  try {
    return toProduct(await apiFetch<Raw>(`/api/products/${encodeURIComponent(pid)}`))
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.code === 'E003')) return null
    throw e
  }
}
/** GET /api/products/search?organizationId= */
export const fetchOrgProducts = async (orgId: string) => embeddedProducts.get(orgId) ?? toPage<Raw>(await apiFetch('/api/products/search', { query: { organizationId: orgId, page: 0, size: 50 } }), 50).items.map(toProduct)
/** POST /api/products/{id}/rfq with {quantity, destination, message} (stored on the quotation and put in the seller's email). `sourceEventPid`: the show the buyer came from, counted as interest there. */
export async function sendProductRfq(pid: string, body: { quantity: number | string; destination: string; message: string; sourceEventPid?: string }) {
  return apiFetch(`/api/products/${encodeURIComponent(pid)}/rfq`, {
    method: 'POST',
    json: { quantity: String(body.quantity), destination: body.destination, message: body.message, sourceEventPid: body.sourceEventPid },
  })
}

/* ------------------------------------------------------------ businesses */
/** GET /api/business/search?keyword&categoryId&businessType&page&size */
export async function searchBusinesses(keyword = '', categoryId?: string, businessType?: string): Promise<Business[]> {
  const page = toPage<Raw>(await apiFetch('/api/business/search', { query: { keyword, categoryId, businessType: businessType && businessType !== 'ALL' ? businessType : undefined, page: 0, size: 100 } }), 100)
  // directory cards embed their top products (read-only view of the product service): no per-card request
  page.items.forEach((r) => { if (Array.isArray(r.products)) embeddedProducts.set(id(r.id), arr(r.products).map((p) => toProduct({ ...p, organizationId: r.id }))) })
  return page.items.map(toBusiness)
}
/** true when a list response already carried this business' products (cards then skip the extra request) */
export const hasEmbeddedProducts = (bid: string) => embeddedProducts.has(bid)
/** GET /api/business/featured */
const embeddedProducts = new Map<string, Product[]>() // featured businesses embed their top products: avoids one request per business
export async function fetchFeaturedBusinesses() {
  const raw = listOf<Raw>(await apiFetch('/api/public/home/featured-businesses'))
  raw.forEach((r) => embeddedProducts.set(id(r.id), arr(r.products).map((p) => toProduct({ ...p, organizationId: r.id }))))
  return raw.map(toBusiness)
}
/** GET /api/business/{id} — returns the Business and its flat PublicProfile block. */
export async function fetchBusiness(bid: string): Promise<{ business: Business | null; profile: PublicProfile | null }> {
  try {
    const raw = await apiFetch<Raw>(`/api/business/${encodeURIComponent(bid)}`)
    const business = toBusiness(raw)
    return { business, profile: toPublicProfile(raw, business) }
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.code === 'E003')) return { business: null, profile: null }
    throw e
  }
}
/** POST /api/business/{id}/rfq/email (multipart: cc, bcc, subject, content, files) */
export function sendBusinessRfq(bid: string, f: { subject: string; content: string }) {
  const fd = new FormData()
  fd.set('subject', f.subject)
  fd.set('content', f.content)
  return apiFetch(`/api/business/${encodeURIComponent(bid)}/rfq/email`, { method: 'POST', form: fd })
}
/** GET /api/me/follows/businesses/{id}: does the signed-in caller follow this business? (the public detail carries no per-user flag) */
export const isFollowingBusiness = async (bid: string) => Boolean((await apiFetch<Raw>(`/api/me/follows/businesses/${encodeURIComponent(bid)}`)).following)
/** POST/DELETE /api/me/follows/businesses/{id} */
export const followBusiness = (bid: string, on: boolean) => apiFetch(`/api/me/follows/businesses/${encodeURIComponent(bid)}`, { method: on ? 'POST' : 'DELETE' })

/* --------------------------------------------------------- import requests */
/** GET /api/portal/import-requests/browse?categoryId&keyword&sort&page&size */
export async function browseImportRequests(categoryId?: string, keyword?: string, size = 100): Promise<ImportRequest[]> {
  const page = toPage<Raw>(await apiFetch('/api/portal/import-requests/browse', { query: { categoryId, keyword, sort: 'newest', page: 0, size } }), size)
  return page.items.map(toImportRequest)
}
export async function fetchImportRequest(rid: string): Promise<ImportRequest | null> {
  try {
    return toImportRequest(await apiFetch<Raw>(`/api/portal/import-requests/browse/${encodeURIComponent(rid)}`))
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.code === 'E003')) return null
    throw e
  }
}
/** POST /api/portal/import-requests (needs login + organization) */
export const postImportRequest = (f: ImportRequestInput) => apiFetch('/api/portal/import-requests', { method: 'POST', json: fromImportRequestInput(f) })
/** POST /api/portal/import-requests/{id}/quotes/email (multipart; `to` is resolved by the BE from the request) */
export function sendQuote(rid: string, f: { cc: string; bcc: string; subject: string; content: string; files: File[] }) {
  const fd = new FormData()
  if (f.cc) fd.set('cc', f.cc)
  if (f.bcc) fd.set('bcc', f.bcc)
  fd.set('subject', f.subject)
  fd.set('content', f.content)
  f.files.forEach((x) => fd.append('files', x))
  return apiFetch(`/api/portal/import-requests/${encodeURIComponent(rid)}/quotes/email`, { method: 'POST', form: fd })
}

/* ----------------------------------------------------------------- events */
/**
 * GET /api/event/search. The BE catalog merges Shows (ids `s-N`) and filters by its source-kind flag, so the FE never filters by kind.
 * GET /api/public/shows supplies the one thing the catalog lacks, `displayLabel`, so the list and the detail page show the same label;
 * it is also the safety net when the catalog returned no Show. If it fails, the list still works with labels computed from the dates.
 */
export async function searchEvents(): Promise<EventItem[]> {
  const ev = toPage<Raw>(await apiFetch<unknown>('/api/event/search', { query: { page: 0, size: 100 } }), 100).items.map(toEvent)
  const cards = await apiFetch<unknown>('/api/public/shows', { query: { page: 0, size: 100 } }).then((r) => toPage<Raw>(r, 100).items).catch(() => [] as Raw[])
  if (!ev.some((e) => e.id.startsWith('s-'))) return [...ev, ...cards.map(showCardToEvent)]
  const labels = new Map(cards.map((c) => [`s-${c.id}`, toShowLabel(c.displayLabel)]))
  return ev.map((e) => (labels.get(e.id) ? { ...e, displayLabel: labels.get(e.id) } : e))
}
/** GET /api/event/{id}; Show ids (`s-3`) load the full show and adapt it. */
export async function fetchEvent(eid: string): Promise<EventItem | null> {
  try {
    if (isShowId(eid)) {
      const s = await fetchShow(eid)
      return s ? showToEvent(s) : null
    }
    return toEvent(await apiFetch<Raw>(`/api/event/${encodeURIComponent(eid)}`))
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.code === 'E003')) return null
    throw e
  }
}
/** GET /api/public/shows/{id}/full */
export async function fetchShow(feId: string): Promise<Show | null> {
  try {
    return toShow(await apiFetch<Raw>(`/api/public/shows/${beShowId(feId)}/full`))
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.code === 'E003')) return null
    throw e
  }
}

/** POST /api/event/registrations */
export async function registerForEvent(body: { eventId: string; mode: 'PROFILE' | 'FORM'; form?: Raw; answers?: Record<string, string>; attendeeIds?: string[]; idempotencyKey?: string }) {
  return toRegistration(await apiFetch<Raw>('/api/event/registrations', { method: 'POST', json: body }))
}
export const getRegistration = async (rid: string, token?: string) => toRegistration(await apiFetch<Raw>(`/api/event/registrations/${rid}`, { headers: token ? { 'X-Registration-Token': token } : undefined }))
export const cancelRegistration = (rid: string, token?: string) => apiFetch(`/api/event/registrations/${rid}/cancel`, { method: 'POST', headers: token ? { 'X-Registration-Token': token } : undefined })
/** POST /api/event/registrations/{id}/payment (multipart `file`) */
export function uploadRegistrationPayment(rid: string, file: File, token?: string) {
  const fd = new FormData()
  fd.set('file', file)
  return apiFetch(`/api/event/registrations/${rid}/payment`, { method: 'POST', form: fd, headers: token ? { 'X-Registration-Token': token } : undefined })
}
/** GET /api/event/registrations/my (raw page items; the typed version is eventApi.fetchMyRegistrations) */
export const myRegistrations = async () => listOf<Raw>(await apiFetch('/api/event/registrations/my'))

/* ------------------------------------------------------------ show visitors */
export interface VisitorResult { visitorId: string; status: string; badgeStatus?: string; resendAfterSeconds: number; maxOtpAttempts: number; otpRequired: boolean }
const toVisitor = (r: Raw): VisitorResult => ({ visitorId: id(r.visitorId), status: str(r.status), badgeStatus: r.badgeStatus ? str(r.badgeStatus) : undefined, resendAfterSeconds: num(r.resendAfterSeconds, 30), maxOtpAttempts: num(r.maxOtpAttempts, 5), otpRequired: r.otpRequired !== false })
export interface VisitorForm { name: string; email: string; phone: string; company: string; country: string; visitorType: string; businessType: string; share: boolean; consent: boolean; adult?: boolean; phaseIds?: string[] }
/** POST /api/public/shows/{id}/visitors (sends the OTP email) */
export async function showRegisterVisitor(feId: string, f: VisitorForm) {
  const [firstName, ...rest] = f.name.trim().split(/\s+/)
  return toVisitor(await apiFetch<Raw>(`/api/public/shows/${beShowId(feId)}/visitors`, {
    method: 'POST',
    json: { fullName: f.name.trim(), firstName, lastName: rest.join(' '), email: f.email, phone: f.phone, companyName: f.company, country: f.country, visitorType: f.visitorType, businessType: f.businessType, consentTerms: f.consent, consentShareExhibitors: f.share, ageConfirmed: f.adult === true, phaseIds: f.phaseIds?.map(Number) },
  }))
}
export async function showVerifyOtp(feId: string, email: string, otp: string) {
  const r = await apiFetch<Raw>(`/api/public/shows/${beShowId(feId)}/visitors/verify`, { method: 'POST', json: { email, otp } })
  return { ...toVisitor(r), badgeCode: str(r.badgeCode || r.code) }
}
export const showResendOtp = async (feId: string, email: string) => toVisitor(await apiFetch<Raw>(`/api/public/shows/${beShowId(feId)}/visitors/resend-otp`, { method: 'POST', json: { email } }))
/** POST /api/public/shows/{id}/visitors/restore (a registration made on another device: email + the code from the mail; every failure is the same error) */
export async function showRestoreVisitor(feId: string, email: string, badgeCode: string): Promise<RestoredVisitor> {
  const r = await apiFetch<Raw>(`/api/public/shows/${beShowId(feId)}/visitors/restore`, { method: 'POST', json: { email, badgeCode } })
  return {
    badge: { visitorId: id(r.visitorId), code: str(r.badgeCode), name: str(r.fullName), email: str(r.email), company: str(r.companyName), visitorType: str(r.visitorType), status: 'ISSUED', issuedAt: str(r.issuedAt) || new Date().toISOString() },
    bookings: (r.bookings ?? {}) as RestoredVisitor['bookings'],
  }
}
/** GET /api/public/shows/visitors/badge/{code} */
export async function showBadge(code: string) {
  const r = await apiFetch<Raw>(`/api/public/shows/visitors/badge/${encodeURIComponent(code)}`)
  return { code, name: str(r.fullName), company: str(r.companyName), status: str(r.badgeStatus || 'ISSUED'), visitorType: str(r.visitorType) }
}
/** POST /api/public/shows/booths/{boothId}/inquiries (badge holder: email + badgeCode) */
export const showInquiry = (boothId: string, b: { email: string; badgeCode: string; productId?: string; quantity?: string; message: string }) =>
  apiFetch(`/api/public/shows/booths/${boothId}/inquiries`, { method: 'POST', json: { ...b, productId: b.productId ? Number(b.productId) : undefined } })
/** POST /api/shows/visitors/{visitorId}/payment (multipart, signed-in users only: no anonymous receipt endpoint yet) */
export function showUploadReceipt(visitorId: string, file: File) {
  const fd = new FormData()
  fd.set('billImage', file)
  return apiFetch(`/api/shows/visitors/${visitorId}/payment`, { method: 'POST', form: fd })
}
/** POST/DELETE /api/public/shows/launch-slots/{id}/follow (badge holder: email + badgeCode) */
export const showLaunchFollow = (slotId: string, on: boolean, email: string, badgeCode: string) => apiFetch(`/api/public/shows/launch-slots/${slotId}/follow`, on ? { method: 'POST', json: { email, badgeCode } } : { method: 'DELETE', query: { email, badgeCode } })
/** DELETE /api/shows/visitors/{id} (signed in, own registration) */
export const showCancelVisit = (visitorId: string) => apiFetch(`/api/shows/visitors/${encodeURIComponent(visitorId)}`, { method: 'DELETE' })
/** POST /api/public/shows/visitors/cancel (guest: email + badgeCode) */
export const showCancelByBadge = (email: string, badgeCode: string) => apiFetch('/api/public/shows/visitors/cancel', { method: 'POST', json: { email, badgeCode } })
/* Post-show feedback (CR-2026-008 §4.2). */
export interface ShowFeedbackInput { rating: number; comment?: string; consentPublic: boolean }
export interface ShowFeedbackMine { submitted: boolean; canSubmit: boolean; closedReason?: string }
const toFeedbackMine = (r: Raw): ShowFeedbackMine => ({ submitted: r?.submitted === true, canSubmit: r?.canSubmit === true, closedReason: r?.closedReason ? str(r.closedReason) : undefined })
/** GET /api/public/shows/{id}/feedback/mine. Wrong email or badge is refused (E005); `canSubmit` is false once sent or past the window. */
export const showFeedbackMine = async (feId: string, email: string, badgeCode: string) => toFeedbackMine(await apiFetch<Raw>(`/api/public/shows/${beShowId(feId)}/feedback/mine`, { query: { email, badgeCode } }))
/** GET /api/shows/{id}/feedback/mine (signed in). A business without an approved booth at this show is refused (E005). */
export const showOrgFeedbackMine = async (feId: string) => toFeedbackMine(await apiFetch<Raw>(`/api/shows/${beShowId(feId)}/feedback/mine`))
/** POST /api/public/shows/{id}/feedback (badge holder: email + badgeCode) */
export const showVisitorFeedback = (feId: string, b: ShowFeedbackInput & { email: string; badgeCode: string }) => apiFetch(`/api/public/shows/${beShowId(feId)}/feedback`, { method: 'POST', json: b })
/** POST /api/shows/{id}/feedback (signed-in business with an approved booth) */
export const showOrgFeedback = (feId: string, b: ShowFeedbackInput) => apiFetch(`/api/shows/${beShowId(feId)}/feedback`, { method: 'POST', json: b })
export const showBook = (sessionId: string, email: string, badgeCode: string) => apiFetch<Raw>(`/api/public/shows/agenda/${sessionId}/book`, { method: 'POST', json: { email, badgeCode } })
export const showUnbook = (sessionId: string, email: string, badgeCode: string) => apiFetch(`/api/public/shows/agenda/${sessionId}/book`, { method: 'DELETE', query: { email, badgeCode } })

/* ---------------------------------------------------------- business register */
export interface RegisterInput {
  nameVi: string; nameEn: string; taxCode: string; businessForm: string; businessType: string; industries: string[]
  charterCapital: string; charterCurrency: string; totalRevenue: string; reportYear: string; employees: string; website: string; fax: string
  country: string; province: string; address: string; email: string; phone: string; repName: string; repTitle: string; repEmail: string; repPhone: string
  /** Phase 2: login email, logo path (`/api/files/{id}/content`), legal files (uploaded through `uploadFile`) */
  loginEmail?: string; logo?: string; legalDocs?: { license?: { fileId?: string } | null; tax?: { fileId?: string } | null }
  /** V70: tên viết tắt, đăng ký kinh doanh, tổng tài sản, "Lãnh đạo chủ chốt", chi nhánh, hồ sơ yêu cầu (≤ 5 file/nhóm) */
  shortName?: string; otherBusinessForm?: string; businessRegNo?: string; businessRegDate?: string; businessRegPlace?: string; totalAssets?: string
  leaders?: KeyLeaders; branches?: Branch[]; docs?: Partial<Record<RegDocGroup, { fileId?: string }[]>>
}
export interface LeaderPerson { fullName: string; gender: string; landline: string; mobile: string; email: string }
export type KeyLeaders = Record<'chairman' | 'ceo' | 'chiefOfOffice' | 'contact1' | 'contact2', LeaderPerson>
export interface Branch { name: string; address: string }
export type RegDocGroup = 'application' | 'license' | 'finance' | 'payment' | 'other'
const fileIds = (xs?: { fileId?: string }[]) => (xs ?? []).map((x) => x.fileId).filter((x): x is string => !!x)
/** POST /api/business/register. Files must be uploaded first (`uploadFile`, anonymous token is sent back as `uploadToken`). The account is created after approval (activation link). */
export const registerBusiness = (r: RegisterInput) => apiFetch('/api/business/register', {
  method: 'POST', anon: true,
  json: {
    name: r.nameVi, nameEn: r.nameEn, taxCode: r.taxCode, businessForm: r.businessForm, businessType: r.businessType,
    industry: Array.from(new Set(r.industries.map((c) => categoryIndustry.get(c)).filter(Boolean))),
    industryIds: r.industries.map(Number).filter((n) => Number.isFinite(n)),
    loginEmail: r.loginEmail || undefined,
    uploadToken: registerUploadToken() ?? undefined,
    logoFileId: fileIdOf(r.logo),
    ...(r.docs
      ? { applicationFileIds: fileIds(r.docs.application), licenseFileIds: fileIds(r.docs.license), financeFileIds: fileIds(r.docs.finance), paymentFileIds: fileIds(r.docs.payment), otherFileIds: fileIds(r.docs.other) }
      : { licenseFileId: r.legalDocs?.license?.fileId, taxFileId: r.legalDocs?.tax?.fileId }),
    shortName: r.shortName || undefined, otherBusinessForm: r.businessForm === 'OTHER' ? r.otherBusinessForm : undefined,
    businessRegNo: r.businessRegNo, businessRegDate: r.businessRegDate || undefined, businessRegPlace: r.businessRegPlace,
    totalAssets: r.totalAssets || undefined, totalAssetsCurrency: r.totalAssets ? r.charterCurrency : undefined,
    keyLeaders: r.leaders, branches: r.branches?.filter((b) => b.name || b.address),
    charterCapital: r.charterCapital, charterCapitalCurrency: r.charterCurrency, totalRevenue: r.totalRevenue, reportYear: r.reportYear, employees: r.employees,
    website: r.website, fax: r.fax, country: r.country, province: r.province, address: r.address, email: r.email, phone: r.phone,
    // khi có keyLeaders, BE tự lấy người đại diện từ TGĐ/Giám đốc rồi người liên hệ #1
    ...(r.leaders ? {} : { representativeName: r.repName, representativeTitle: r.repTitle, representativeEmail: r.repEmail, representativePhone: r.repPhone }),
  },
})

/* ---------------------------------------------------------------- my profile */
export async function fetchMyProfile(): Promise<RemoteProfile> { return toRemoteProfile(await apiFetch<Raw>('/api/me/profile')) }
/** POST /api/me/profile/resubmit: REJECTED -> PENDING */
export const resubmitProfile = () => apiFetch('/api/me/profile/resubmit', { method: 'POST' })
/** PUT /api/me/profile/{section} */
export const saveProfileSection = (section: SectionKey, data: CompanyProfile[SectionKey]) => apiFetch(`/api/me/profile/${section}`, { method: 'PUT', json: data })

/* ---------------------------------------------------------------------- home */
/** GET /api/public/stats */
export const homeStats = () => orMock('GET /api/public/stats', async () => {
  const r = await apiFetch<Raw>('/api/public/stats')
  return { businesses: num(r.businesses), products: num(r.products), requests: num(r.requests), countries: num(r.countries) }
}, mock.homeStats)
export const homeTrending = () => orMock('GET /api/public/trending-keywords', async () => arr<unknown>(await apiFetch('/api/public/trending-keywords')).map((k) => bi(typeof k === 'string' ? k : (k as Raw).text ?? (k as Raw).keyword)), mock.homeTrending)
export const homeActivity = () => orMock('GET /api/public/activity-feed', async () => arr<Raw>(await apiFetch('/api/public/activity-feed')).map((a) => ({ country: str(a.country), text: bi(a.text), ago: bi(a.ago) })), mock.homeActivity)
export const homeTestimonials = () => orMock('GET /api/public/testimonials', async () => arr<Raw>(await apiFetch('/api/public/testimonials')).map((t) => ({
  id: id(t.id), name: str(t.name), company: str(t.company), country: str(t.country), countryName: bi(t.countryName), role: bi(t.role), rating: num(t.rating, 5), event: bi(t.event), quote: bi(t.quote), accent: str(t.accent, '#0b4f8a'),
})), mock.homeTestimonials)
const PALETTE = ['#0b4f8a', '#0f766e', '#be123c', '#6d28d9', '#1d4ed8', '#b45309', '#15803d', '#334155']
/** GET /api/public/sponsors (tier, mark, color, tagline, url provided by the BE; missing tier falls back to displayOrder). */
export const homeSponsors = () => orMock('GET /api/public/sponsors', async () => {
  const list = listOf<Raw>(await apiFetch('/api/public/sponsors')).sort((a, b) => num(a.displayOrder) - num(b.displayOrder))
  return list.map((s, i) => ({
    id: id(s.id), name: str(s.name), mark: str(s.mark) || initials(str(s.name)),
    // CMS chỉ cho MAIN/GOLD/PARTNER; hạng lạ (vd. dữ liệu cũ 'SILVER') xếp vào PARTNER thay vì biến mất khỏi trang chủ
    tier: (s.tier ? (['MAIN', 'GOLD', 'PARTNER'].includes(str(s.tier).toUpperCase()) ? str(s.tier).toUpperCase() : 'PARTNER') : i === 0 ? 'MAIN' : i <= 3 ? 'GOLD' : 'PARTNER') as SponsorTier,
    color: str(s.color, PALETTE[i % PALETTE.length]!), tagline: s.tagline ? bi(s.tagline) : undefined, url: str(s.url || s.linkUrl) || undefined,
  }))
}, mock.homeSponsors)

/** GET /api/public/home/products?tab=popular|newest|certified&limit= */
export const homeProducts = async (tab: 'popular' | 'newest' | 'certified', limit = 10) => listOf<Raw>(await apiFetch('/api/public/home/products', { query: { tab, limit } })).map(toProduct)

/* -------------------------------------------------------------- suggestions */
/** SearchBar suggestions: GET /api/products/search?keyword=&size=4 */
export const suggestProducts = async (q: string) => toPage<Raw>(await apiFetch('/api/products/search', { query: { keyword: q, page: 0, size: 4 } }), 4).items.map(toProduct)
