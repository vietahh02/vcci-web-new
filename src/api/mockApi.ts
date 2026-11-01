/**
 * MOCK data access layer (kept for VITE_USE_MOCK=true and as per-endpoint fallback).
 * Every function names the real VCCI portal endpoint it stands in for; the live
 * implementation is in ./realApi.ts and src/api/index.ts picks one of the two.
 */
import {
  activityFeed, businesses, categories, events, importRequests, products, sponsors, testimonials, trendingKeywords,
  type Business, type EventItem, type ImportRequest, type Product,
} from '@/data/mock'

import type { Bilingual } from '@/lib/i18n'
import { shows } from '@/data/shows'
import { showToEvent } from '@/lib/showEvent'

const latency = (ms = 320) => new Promise((r) => setTimeout(r, ms + Math.random() * 180))

export interface ProductQuery {
  keyword?: string
  categoryId?: string
  verifiedOnly?: boolean
  maxMoq?: number
  certificates?: string[]
  sort?: 'popular' | 'newest' | 'priceAsc' | 'priceDesc'
}

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** GET /api/products/search */
export async function searchProducts(q: ProductQuery = {}): Promise<Product[]> {
  await latency()
  let list = products.filter((p) => {
    if (q.categoryId && p.categoryId !== q.categoryId) return false
    if (q.maxMoq && p.moq > q.maxMoq) return false
    if (q.certificates?.length && !q.certificates.some((c) => p.certificates.includes(c))) return false
    if (q.keyword) {
      const hay = norm(`${p.productName.vi} ${p.productName.en} ${p.productName.ko ?? ''} ${p.industry} ${p.productCode}`)
      if (!norm(q.keyword).split(/\s+/).every((w) => hay.includes(w))) return false
    }
    return true
  })
  switch (q.sort) {
    case 'newest': list = [...list].sort((a, b) => b.createdDate.localeCompare(a.createdDate)); break
    case 'priceAsc': list = [...list].sort((a, b) => a.priceFob - b.priceFob); break
    case 'priceDesc': list = [...list].sort((a, b) => b.priceFob - a.priceFob); break
    default: list = [...list].sort((a, b) => b.viewCount - a.viewCount)
  }
  return list
}

/** GET /api/products/{id} */
export async function getProduct(id: string) {
  await latency(240)
  return products.find((p) => p.id === id) ?? null
}

/** GET /api/public/product/organization/{orgId}/products */
export function productsOf(orgId: string) {
  return products.filter((p) => p.organizationId === orgId)
}

/** GET /api/business/search */
export async function searchBusinesses(keyword = '', categoryId?: string, businessType?: string): Promise<Business[]> {
  await latency()
  return businesses.filter((b) => {
    if (categoryId && b.categoryId !== categoryId) return false
    if (businessType && businessType !== 'ALL' && b.businessType !== businessType) return false
    if (!keyword) return true
    return norm(`${b.name} ${b.nameEn} ${b.industry.join(' ')} ${b.province}`).includes(norm(keyword))
  })
}

/** GET /api/business/featured */
export function featuredBusinesses() {
  return [...businesses].sort((a, b) => b.reputationScore - a.reputationScore)
}

/** GET /api/business/{id} */
export function getBusiness(id: string) {
  return businesses.find((b) => b.id === id) ?? null
}

/** GET /api/portal/import-requests/browse */
export async function browseImportRequests(categoryId?: string, keyword?: string, _size?: number): Promise<ImportRequest[]> {
  void _size
  await latency()
  return importRequests.filter((r) => (!categoryId || r.categoryId === categoryId) && (!keyword || norm(`${r.requestName.vi} ${r.requestName.en} ${r.productType}`).includes(norm(keyword))))
}

/** GET /api/portal/import-requests/browse/{id} */
export function getImportRequest(id: string) {
  return importRequests.find((r) => r.id === id) ?? null
}

/** GET /api/event/search */
export async function searchEvents(): Promise<EventItem[]> {
  await latency()
  return [...events, ...shows.map(showToEvent)]
}

/** GET /api/event/webinar/{id} | /api/event/livestream/{id} */
export function getEvent(id: string) {
  return [...events, ...shows.map(showToEvent)].find((e) => e.id === id) ?? null
}

/** GET /api/categories/options */
export function categoryOptions() {
  return categories
}

export const getCategory = (id: string) => categories.find((c) => c.id === id)

/* ---- async variants used by the hooks so mock and live share one call shape ---- */
export const fetchOrgProducts = async (orgId: string) => productsOf(orgId)
export const fetchFeaturedBusinesses = async () => featuredBusinesses()
export const fetchBusiness = async (id: string) => ({ business: getBusiness(id), profile: null as null })
export const fetchImportRequest = async (id: string) => getImportRequest(id)
export const fetchEvent = async (id: string) => getEvent(id)

/** Home blocks. Live equivalents: GET /api/public/{stats|trending-keywords|activity-feed|testimonials|sponsors}. */
export const homeStats = async () => ({ businesses: 12400, products: 58000, requests: 1200, countries: 40 })
export const homeTrending = async (): Promise<Bilingual[]> => trendingKeywords
export const homeActivity = async () => activityFeed
export const homeTestimonials = async () => testimonials
export const homeSponsors = async () => sponsors
export const homeProducts = async (tab: 'popular' | 'newest' | 'certified', limit = 10) => {
  const list = tab === 'newest' ? [...products].sort((a, b) => b.createdDate.localeCompare(a.createdDate)) : tab === 'certified' ? products.filter((p) => p.certificates.length >= 3) : [...products].sort((a, b) => b.viewCount - a.viewCount)
  return list.slice(0, limit)
}
