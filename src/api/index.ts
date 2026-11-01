/**
 * Data access facade used by the whole UI.
 * VITE_USE_MOCK=true  -> ./mockApi (original prototype data)
 * default             -> ./realApi (portal backend, VITE_API_BASE_URL)
 * Both modules export the same function names with the same shapes.
 */
import { USE_MOCK } from './config'
import * as live from './realApi'
import * as mock from './mockApi'
import type { ImportRequestInput, ProductQuery } from './realApi'

export { USE_MOCK, API_BASE } from './config'
export { ApiError, apiFetch, onAuthExpired, tokens } from './http'
export type { ImportRequestInput, ProductQuery }
export * from './hooks'

/* Mock-only synchronous helpers (also used by data/capability.ts for sample profiles). */
export const { productsOf, getBusiness, getImportRequest, getEvent, featuredBusinesses, categoryOptions, getCategory } = mock

export const searchProducts: (q?: ProductQuery) => Promise<Awaited<ReturnType<typeof mock.searchProducts>>> = USE_MOCK ? mock.searchProducts : live.searchProducts
export const searchProductsPage = (q?: ProductQuery) => USE_MOCK
  ? mock.searchProducts(q).then((items) => ({ items, total: items.length, page: 0, size: items.length || 1 }))
  : live.searchProductsPage(q)
export const getProduct = USE_MOCK ? mock.getProduct : live.getProduct
export const fetchOrgProducts = USE_MOCK ? mock.fetchOrgProducts : live.fetchOrgProducts
export const searchBusinesses = USE_MOCK ? mock.searchBusinesses : live.searchBusinesses
export const fetchFeaturedBusinesses = USE_MOCK ? mock.fetchFeaturedBusinesses : live.fetchFeaturedBusinesses
export const fetchBusiness = USE_MOCK ? mock.fetchBusiness : live.fetchBusiness
export const browseImportRequests = USE_MOCK ? mock.browseImportRequests : live.browseImportRequests
export const fetchImportRequest = USE_MOCK ? mock.fetchImportRequest : live.fetchImportRequest
export const searchEvents = USE_MOCK ? mock.searchEvents : live.searchEvents
export const fetchEvent = USE_MOCK ? mock.fetchEvent : live.fetchEvent

export const homeStats = USE_MOCK ? mock.homeStats : live.homeStats
export const homeTrending = USE_MOCK ? mock.homeTrending : live.homeTrending
export const homeActivity = USE_MOCK ? mock.homeActivity : live.homeActivity
export const homeTestimonials = USE_MOCK ? mock.homeTestimonials : live.homeTestimonials
export const homeSponsors = USE_MOCK ? mock.homeSponsors : live.homeSponsors

/** Live-only operations: callers check USE_MOCK and keep their local/demo behaviour when it is true. */
export * as liveApi from './realApi'
export * as authApi from './auth'
export * as catalogApi from './catalogApi'
