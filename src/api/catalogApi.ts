/**
 * Live-only calls for a business's own catalogue and booths, plus favourites and filter facets.
 * Own-product endpoints take the organisation from the signed-in session on the BE, so no organisation id is ever sent.
 */
import { apiFetch, toPage, type Page } from './http'
import { isOnlineFormat } from '@/lib/eventStatus'
import type { Raw } from './adapters/common'

export interface Specs { label: string; value: string }
export interface TranslationInput { productName?: string; description?: string }
export interface MyProductInput {
  productName: string
  categoryId: number
  description?: string
  origin?: string
  unit?: string
  moq?: number
  priceFob?: number
  priceCif?: number
  leadTime?: string
  specs?: Specs[]
  certificateLabels?: string[]
  keepImageUrls?: string[]
  translations?: Record<'en' | 'ko', TranslationInput>
}
export interface MyProduct {
  id: string
  productCode: string
  productName: string
  categoryId: string
  categoryName: string
  description: string
  origin: string
  unit: string
  moq: number | null
  priceFob: number | null
  priceCif: number | null
  leadTime: string
  specs: Specs[]
  certificateLabels: string[]
  productImages: string[]
  visible: boolean
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | string
  moderationNote: string
  viewCount: number
  translations: Record<string, { productName: string; description: string; state: string; reviewNote?: string }>
}

const toMy = (r: Raw): MyProduct => ({
  id: String(r.id), productCode: r.productCode ?? '', productName: r.productName ?? '', categoryId: r.categoryId == null ? '' : String(r.categoryId),
  categoryName: r.categoryName ?? '', description: r.description ?? '', origin: r.origin ?? '', unit: r.unit ?? '',
  moq: r.moq ?? null, priceFob: r.priceFob ?? null, priceCif: r.priceCif ?? null, leadTime: r.leadTime ?? '',
  specs: Array.isArray(r.specs) ? r.specs : [], certificateLabels: Array.isArray(r.certificateLabels) ? r.certificateLabels : [],
  productImages: Array.isArray(r.productImages) ? r.productImages : [], visible: !!r.visible,
  moderationStatus: r.moderationStatus ?? 'APPROVED', moderationNote: r.moderationNote ?? '', viewCount: r.viewCount ?? 0,
  translations: r.translations ?? {},
})

/* ------------------------------------------------------------ my products */
export async function myProducts(keyword: string, state: 'all' | 'visible' | 'hidden', page: number, size = 20): Promise<Page<MyProduct>> {
  const p = toPage<Raw>(await apiFetch('/api/my/products', { query: { keyword, state, page, size } }), size)
  return { ...p, items: p.items.map(toMy) }
}
export const getMyProduct = async (id: string) => toMy(await apiFetch<Raw>(`/api/my/products/${encodeURIComponent(id)}`))

/** multipart: `data` (JSON part) + `images` (new files). Existing images to keep go in data.keepImageUrls. */
export async function saveMyProduct(id: string | null, data: MyProductInput, images: File[]) {
  const fd = new FormData()
  fd.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  images.forEach((f) => fd.append('images', f))
  return toMy(await apiFetch<Raw>(id ? `/api/my/products/${encodeURIComponent(id)}` : '/api/my/products', { method: id ? 'PUT' : 'POST', form: fd }))
}
export const setMyProductVisible = async (id: string, visible: boolean) =>
  toMy(await apiFetch<Raw>(`/api/my/products/${encodeURIComponent(id)}/visibility`, { method: 'PATCH', json: { visible } }))
export const deleteMyProduct = (id: string, reason?: string) =>
  apiFetch(`/api/my/products/${encodeURIComponent(id)}`, { method: 'DELETE', query: { reason } })

/* -------------------------------------------------------------- favourites */
export async function favoriteIds(ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set()
  const r = await apiFetch<number[]>('/api/my/favorites/products/ids', { query: { ids: ids.slice(0, 100) } })
  return new Set((r ?? []).map(String))
}
export const addFavorite = (pid: string) => apiFetch(`/api/my/favorites/products/${encodeURIComponent(pid)}`, { method: 'PUT' })
export const removeFavorite = (pid: string) => apiFetch(`/api/my/favorites/products/${encodeURIComponent(pid)}`, { method: 'DELETE' })

/* ----------------------------------------------------------------- facets */
/** GET /api/products/certificates -> most used certificate labels in the public catalogue */
export async function popularCertificates(limit = 12): Promise<string[]> {
  const r = await apiFetch<{ label: string }[]>('/api/products/certificates', { query: { limit }, anon: true })
  return (r ?? []).map((x) => x.label)
}

/* ------------------------------------------------------------------ booths */
export interface BoothInput {
  pavilionId?: number
  phaseId?: number
  intro?: string
  bannerImage?: string
  tagline?: string
  accent?: string
  website?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  goals?: string[]
  consentExhibitorTerms?: boolean
  translations?: Record<'en' | 'ko', { tagline?: string; intro?: string }>
}
export interface BoothProductRow { id: string; productId: string; name: string; image?: string; status: string }
export interface MyBooth {
  id: string
  showId: string
  showName: string
  showStatus: string
  status: string
  rejectReason?: string
  pavilionId?: string
  pavilionName?: string
  phaseId?: string
  tagline: string
  accent: string
  website: string
  intro: string
  bannerImage: string
  contactName: string
  contactEmail: string
  contactPhone: string
  goals: string[]
  consent: boolean
  missing: string[]
  percent: number
  payment?: { status?: string; amount?: number; currency?: string; dueAt?: string; rejectReason?: string }
  products: BoothProductRow[]
  inquiryCount: number
  translations: Record<string, { tagline?: string; intro?: string; state?: string }>
}
const toBooth = (r: Raw): MyBooth => ({
  id: String(r.id), showId: String(r.showId), showName: r.showName ?? '', showStatus: r.showStatus ?? '', status: r.status ?? '',
  rejectReason: r.rejectReason ?? undefined, pavilionId: r.pavilionId == null ? undefined : String(r.pavilionId), pavilionName: r.pavilionName ?? undefined,
  phaseId: r.phaseId == null ? undefined : String(r.phaseId), tagline: r.tagline ?? '', accent: r.accent ?? '', website: r.website ?? '',
  intro: r.intro ?? '', bannerImage: r.bannerImage ?? '', contactName: r.contactName ?? '', contactEmail: r.contactEmail ?? '', contactPhone: r.contactPhone ?? '',
  goals: Array.isArray(r.goals) ? r.goals : [], consent: !!r.consentExhibitorTermsAt, missing: r.profile?.missing ?? [], percent: r.profile?.percent ?? 0,
  payment: r.payment ?? undefined,
  products: (Array.isArray(r.products) ? r.products : []).map((p: Raw) => ({ id: String(p.id), productId: String(p.productId), name: p.name ?? '', image: p.image ?? undefined, status: p.status ?? '' })),
  inquiryCount: r.inquiryCount ?? 0, translations: r.translations ?? {},
})
export interface OpenShow {
  id: string
  name: string
  startDate: string
  endDate: string
  closeAt?: string
  phases: { id: string; name: string }[]
  pavilions: { id: string; name: string; phaseId?: string }[]
  boothFee: boolean
}
/** OFFLINE/HYBRID shows that currently accept booth applications (UPCOMING and not past the application deadline). ONLINE shows have no booths. */
export async function openShows(): Promise<OpenShow[]> {
  const list = toPage<Raw>(await apiFetch('/api/public/shows', { query: { status: 'UPCOMING', page: 0, size: 50 }, anon: true }), 50).items
  const details = await Promise.all(list.map((s) => apiFetch<Raw>(`/api/public/shows/${encodeURIComponent(String(s.id))}`, { anon: true }).catch(() => null)))
  const now = Date.now()
  return details.filter((d): d is Raw => !!d && !isOnlineFormat(d.format) && (!d.boothApplicationCloseAt || new Date(d.boothApplicationCloseAt).getTime() > now)).map((d) => ({
    id: String(d.id), name: d.name ?? '', startDate: d.startDate ?? '', endDate: d.endDate ?? '', closeAt: d.boothApplicationCloseAt ?? undefined,
    phases: (d.phases ?? []).map((p: Raw) => ({ id: String(p.id), name: p.name ?? '' })),
    pavilions: (d.pavilions ?? []).map((p: Raw) => ({ id: String(p.id), name: p.name ?? '', phaseId: p.phaseId == null ? undefined : String(p.phaseId) })),
    boothFee: !!d.fees?.boothFeeEnabled,
  }))
}
export const myBooths = async () => (await apiFetch<Raw[]>('/api/shows/my/booths')).map(toBooth)
/* ------------------------------------------------- price inquiries received by my booths */
export interface BoothInquiry { id: string; productName?: string; quantity?: string; fromName: string; fromEmail: string; message: string; status: string; reply?: string; repliedAt?: string; createdAt?: string }
const toInquiry = (r: Raw): BoothInquiry => ({
  id: String(r.id), productName: r.productName ?? undefined, quantity: r.quantity ?? undefined, fromName: r.fromName ?? '', fromEmail: r.fromEmail ?? '',
  message: r.message ?? '', status: r.status ?? 'NEW', reply: r.reply ?? undefined, repliedAt: r.repliedAt ?? undefined, createdAt: r.createdDate ?? undefined,
})
/** GET /api/shows/booths/{boothId}/inquiries (own booth only, newest first) */
export const boothInquiries = async (boothId: string) => (await apiFetch<Raw[]>(`/api/shows/booths/${encodeURIComponent(boothId)}/inquiries`)).map(toInquiry)
/** POST /api/shows/inquiries/{id}/reply: only a NEW inquiry; the visitor gets the reply by email */
export const replyInquiry = async (id: string, reply: string) => toInquiry(await apiFetch<Raw>(`/api/shows/inquiries/${encodeURIComponent(id)}/reply`, { method: 'POST', json: { reply } }))
/**
 * My booths at OFFLINE/HYBRID shows. An ONLINE show keeps one internal booth per organisation to hold its products (CR-2026-008 §4.6);
 * that record is not a booth to the user. A show whose format cannot be read stays listed.
 */
export async function myOnSiteBooths(): Promise<MyBooth[]> {
  const all = await myBooths()
  const ids = [...new Set(all.map((b) => b.showId))]
  const online = new Set((await Promise.all(ids.map((id) => apiFetch<Raw>(`/api/public/shows/${encodeURIComponent(id)}`, { anon: true }).then((d) => (isOnlineFormat(d?.format) ? id : ''), () => '')))).filter(Boolean))
  return all.filter((b) => !online.has(b.showId))
}
export const createBooth = async (showId: string, b: BoothInput) => toBooth(await apiFetch<Raw>(`/api/shows/${encodeURIComponent(showId)}/booths`, { method: 'POST', json: b }))
export const updateBooth = async (id: string, b: BoothInput) => toBooth(await apiFetch<Raw>(`/api/shows/booths/${encodeURIComponent(id)}`, { method: 'PUT', json: b }))
export const submitBooth = async (id: string) => toBooth(await apiFetch<Raw>(`/api/shows/booths/${encodeURIComponent(id)}/submit`, { method: 'POST' }))
export const withdrawBooth = async (id: string) => toBooth(await apiFetch<Raw>(`/api/shows/booths/${encodeURIComponent(id)}/withdraw`, { method: 'POST' }))
export const payBooth = async (id: string, bill: File, transactionCode?: string) => {
  const fd = new FormData()
  fd.append('billImage', bill)
  if (transactionCode) fd.append('transactionCode', transactionCode)
  return toBooth(await apiFetch<Raw>(`/api/shows/booths/${encodeURIComponent(id)}/payment`, { method: 'POST', form: fd }))
}
/* ------------------------------------------------- products in an ONLINE show (CR-2026-008 §4.6) */
export interface OnlineShow { id: string; name: string; status: string; startDate: string; endDate: string }
export interface ShowProductRow { productId: string; name: string; image?: string; visible: boolean }
const toShowProduct = (r: Raw): ShowProductRow => ({ productId: String(r.productId ?? r.id), name: r.name ?? r.productName ?? '', image: r.image ?? undefined, visible: r.visible !== false })
/** ONLINE shows a business can still put products into: under way first, then the soonest upcoming. */
export async function onlineShows(): Promise<OnlineShow[]> {
  const byStatus = (status: string) => apiFetch('/api/public/shows', { query: { status, page: 0, size: 50 }, anon: true }).then((r) => toPage<Raw>(r, 50).items)
  const [ongoing, upcoming] = await Promise.all([byStatus('ONGOING'), byStatus('UPCOMING')])
  return [...ongoing, ...upcoming].filter((s) => isOnlineFormat(s.format)).map((s) => ({ id: String(s.id), name: s.name ?? '', status: s.status ?? '', startDate: s.startDate ?? '', endDate: s.endDate ?? '' }))
}
/** GET /api/shows/{id}/my-products */
export const myShowProducts = async (showId: string) => {
  const r = await apiFetch<Raw>(`/api/shows/${encodeURIComponent(showId)}/my-products`)
  return (Array.isArray(r?.products) ? (r.products as Raw[]) : []).map(toShowProduct)
}
/** POST /api/shows/{id}/my-products: the products must be mine and public; consent is required. */
export const addShowProducts = (showId: string, productIds: string[], consentPublic: boolean) =>
  apiFetch(`/api/shows/${encodeURIComponent(showId)}/my-products`, { method: 'POST', json: { productIds: productIds.map(Number), consentPublic } })
/** DELETE /api/shows/{id}/my-products/{productId} */
export const removeShowProduct = (showId: string, productId: string) => apiFetch(`/api/shows/${encodeURIComponent(showId)}/my-products/${encodeURIComponent(productId)}`, { method: 'DELETE' })

/* ------------------------------------------- show participation application (kèm sản phẩm mới ra mắt) */
export interface ParticipationLaunchInput { productName: string; categoryId: number; shortDescription?: string; launchDate: string; startTime: string; endTime: string }
export interface ParticipationLaunch { productId: string; productName?: string; productImage?: string; categoryName?: string; shortDescription?: string; productModerationStatus?: string; launchDate: string; startTime: string; endTime: string }
export interface MyParticipation {
  id: string; showId: string; status: string; rejectReason?: string; submittedAt?: string; reviewedAt?: string
  contactName: string; contactPhone: string; note: string; launches: ParticipationLaunch[]
}
const toParticipation = (r: Raw): MyParticipation => ({
  id: String(r.id), showId: String(r.showId), status: r.status ?? 'PENDING', rejectReason: r.rejectReason ?? undefined,
  submittedAt: r.submittedAt ?? undefined, reviewedAt: r.reviewedAt ?? undefined,
  contactName: r.contactName ?? '', contactPhone: r.contactPhone ?? '', note: r.note ?? '',
  launches: (Array.isArray(r.launches) ? r.launches : []).map((l: Raw) => ({
    productId: String(l.productId), productName: l.productName ?? undefined, productImage: l.productImage ?? undefined,
    categoryName: l.categoryName ?? undefined, shortDescription: l.shortDescription ?? undefined, productModerationStatus: l.productModerationStatus ?? undefined,
    launchDate: l.launchDate ?? '', startTime: l.startTime ?? '', endTime: l.endTime ?? '',
  })),
})
/** Shows currently taking participation applications: UPCOMING or ONGOING, any format. */
export async function participableShows(): Promise<OnlineShow[]> {
  const byStatus = (status: string) => apiFetch('/api/public/shows', { query: { status, page: 0, size: 50 }, anon: true }).then((r) => toPage<Raw>(r, 50).items)
  const [ongoing, upcoming] = await Promise.all([byStatus('ONGOING'), byStatus('UPCOMING')])
  return [...ongoing, ...upcoming].map((s) => ({ id: String(s.id), name: s.name ?? '', status: s.status ?? '', startDate: s.startDate ?? '', endDate: s.endDate ?? '' }))
}
/** GET /api/shows/{id}/participation -> null when my organisation has not applied */
export const myParticipation = async (showId: string) => {
  const r = await apiFetch<Raw | null>(`/api/shows/${encodeURIComponent(showId)}/participation`)
  return r ? toParticipation(r) : null
}
/** POST /api/shows/{id}/participation: multipart `data` (JSON) + `images[i]` is the image of `launches[i]` */
export async function submitParticipation(showId: string, data: { contactName: string; contactPhone: string; note?: string; launches: ParticipationLaunchInput[] }, images: File[]) {
  const fd = new FormData()
  fd.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  images.forEach((f) => fd.append('images', f))
  return toParticipation(await apiFetch<Raw>(`/api/shows/${encodeURIComponent(showId)}/participation`, { method: 'POST', form: fd }))
}

/** Active products of my organisation that can still be put on a booth or into an ONLINE show. */
export const boothPickableProducts = async (keyword = '') =>
  (await apiFetch<Raw[]>('/api/shows/my/products', { query: { keyword } })).map((p) => ({ id: String(p.id), name: String(p.name ?? ''), image: p.image as string | undefined }))
export const addBoothProduct = (boothId: string, productId: string, purpose = 'SELL') =>
  apiFetch(`/api/shows/booths/${encodeURIComponent(boothId)}/products`, { method: 'POST', json: { productId: Number(productId), purpose } })
export const removeBoothProduct = (boothProductId: string) => apiFetch(`/api/shows/booth-products/${encodeURIComponent(boothProductId)}`, { method: 'DELETE' })
