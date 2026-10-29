/**
 * Data access layer. Every function names the real VCCI portal endpoint it
 * stands in for; swap the mock body for `apiFetch(path)` to go live.
 * BE localizes its content from the Accept-Language header, so those fields
 * come back as plain strings in the active language.
 */
import {
  businesses, categories, events, importRequests, products,
  type Business, type EventItem, type ImportRequest, type Product,
} from '@/data/mock'
import { currentLang } from '@/lib/i18n'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept-Language', currentLang())
  const res = await fetch(API_BASE + path, { ...init, headers })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${path}`)
  return res.json() as Promise<T>
}

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
export async function searchBusinesses(keyword = '', categoryId?: string): Promise<Business[]> {
  await latency()
  return businesses.filter((b) => {
    if (categoryId && b.categoryId !== categoryId) return false
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
export async function browseImportRequests(categoryId?: string): Promise<ImportRequest[]> {
  await latency()
  return importRequests.filter((r) => !categoryId || r.categoryId === categoryId)
}

/** GET /api/portal/import-requests/browse/{id} */
export function getImportRequest(id: string) {
  return importRequests.find((r) => r.id === id) ?? null
}

/** GET /api/event/search */
export async function searchEvents(): Promise<EventItem[]> {
  await latency()
  return events
}

/** GET /api/event/webinar/{id} | /api/event/livestream/{id} */
export function getEvent(id: string) {
  return events.find((e) => e.id === id) ?? null
}

/** GET /api/categories/options */
export function categoryOptions() {
  return categories
}

export const getCategory = (id: string) => categories.find((c) => c.id === id)
