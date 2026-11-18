/** Tiny request cache + hooks: components stay declarative (`const { data, loading, error } = useX(id)`). Keys include the UI language because BE content is localised. */
import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { useI18n } from '@/lib/i18n'
import type { Business } from '@/data/mock'
import { USE_MOCK } from './config'
import * as mockApi from './mockApi'
import * as liveApi from './realApi'

interface Entry { data?: unknown; error?: Error; loading: boolean }
const cache = new Map<string, Entry>()
const subs = new Set<() => void>()
const emit = () => subs.forEach((f) => f())
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f) } }

export function invalidate(prefix = '') {
  for (const k of cache.keys()) if (k.includes(prefix)) cache.delete(k)
  emit()
}

export interface Remote<T> { data: T | undefined; loading: boolean; error: Error | undefined; reload: () => void }

/** Cached async read. `key = null` disables the request (e.g. mock mode or missing id). */
export function useRemote<T>(key: string | null, fetcher: () => Promise<T>): Remote<T> {
  const { lang } = useI18n()
  const k = key ? `${lang}|${key}` : null
  const entry = useSyncExternalStore(subscribe, () => (k ? cache.get(k) : undefined))
  useEffect(() => {
    if (!k || cache.has(k)) return
    cache.set(k, { loading: true })
    emit()
    fetcher().then(
      (data) => { cache.set(k, { data, loading: false }); emit() },
      (error: Error) => { cache.set(k, { error, loading: false }); emit() },
    )
  }, [k, fetcher])
  const reload = useCallback(() => { if (k) { cache.delete(k); emit() } }, [k])
  return { data: entry?.data as T | undefined, loading: !!k && (!entry || entry.loading), error: entry?.error, reload }
}

/** Mock mode answers synchronously from the in-memory arrays; live mode goes through the cache. */
function useBoth<T>(key: string | null, sync: () => T, fetcher: () => Promise<T>): Remote<T> {
  const r = useRemote<T>(USE_MOCK ? null : key, fetcher)
  if (USE_MOCK) return { data: sync(), loading: false, error: undefined, reload: () => {} }
  return r
}

export const useBusiness = (bid: string) =>
  useBoth(bid ? 'biz:' + bid : null, () => ({ business: mockApi.getBusiness(bid), profile: null }), () => liveApi.fetchBusiness(bid))
/** Every business in the directory, loaded once and cached: event participants (company name only) are matched to it for their cover and logo. Live mode only. */
export const useBusinessDirectory = () => useRemote<Business[]>(USE_MOCK ? null : 'biz:directory', liveApi.fetchBusinessDirectory)
/** `enabled=false` skips the request (list cards avoid an N+1 fetch; BE does not embed featured products in business cards yet). */
export const useOrgProducts = (orgId: string, enabled = true) => useBoth(orgId && enabled ? 'orgp:' + orgId : null, () => mockApi.productsOf(orgId), () => liveApi.fetchOrgProducts(orgId))
/** Every product of a company (detail page). Separate cache key: `useOrgProducts` may hold only the 3 products embedded in directory cards. */
export const useAllOrgProducts = (orgId: string) => useBoth(orgId ? 'orgp-all:' + orgId : null, () => mockApi.productsOf(orgId), () => liveApi.fetchAllOrgProducts(orgId))
export const useFeaturedBusinesses =() => useBoth('featured', () => mockApi.featuredBusinesses(), () => liveApi.fetchFeaturedBusinesses())
export const useImportRequest = (rid: string) => useBoth(rid ? 'ir:' + rid : null, () => mockApi.getImportRequest(rid), () => liveApi.fetchImportRequest(rid))
export const useEvent = (eid: string) => useBoth(eid ? 'ev:' + eid : null, () => mockApi.getEvent(eid), () => liveApi.fetchEvent(eid))
export const useEvents = () => useRemote('events', USE_MOCK ? mockApi.searchEvents : liveApi.searchEvents)
export const useProduct = (pid: string) => useRemote('prod:' + pid, useCallback(() => (USE_MOCK ? mockApi.getProduct(pid) : liveApi.getProduct(pid)), [pid]))
export const useShow = (feId: string, enabled: boolean) => useRemote(enabled && !USE_MOCK ? 'show:' + feId : null, useCallback(() => liveApi.fetchShow(feId), [feId]))
const m = <T>(a: T, b: T) => (USE_MOCK ? a : b)
export const useHomeStats = () => useRemote('home:stats', m(mockApi.homeStats, liveApi.homeStats))
export const useHomeTrending = () => useRemote('home:trending', m(mockApi.homeTrending, liveApi.homeTrending))
export const useHomeActivity = () => useRemote('home:activity', m(mockApi.homeActivity, liveApi.homeActivity))
export const useHomeTestimonials = () => useRemote('home:testimonials', m(mockApi.homeTestimonials, liveApi.homeTestimonials))
export const useHomeSponsors = () => useRemote('home:sponsors', m(mockApi.homeSponsors, liveApi.homeSponsors))

/** Similar products (product detail): same category when the row has one, topped up from the same industry (live rows often carry only the industry). Never an unfiltered list. */
export const useRelatedProducts = (pid: string, categoryId: string, industry = '') =>
  useRemote('rel:' + pid, useCallback(async () => {
    const want = 5
    if (USE_MOCK) return (await mockApi.searchProducts({ categoryId })).filter((p) => p.id !== pid).slice(0, want)
    const picked = new Map<string, Awaited<ReturnType<typeof liveApi.searchProducts>>[number]>()
    const take = async (q: liveApi.ProductQuery) => {
      for (const p of await liveApi.searchProducts({ ...q, size: want + 1 })) if (p.id !== pid && picked.size < want) picked.set(p.id, p)
    }
    if (categoryId) await take({ categoryId })
    if (picked.size < want && industry) await take({ industry })
    return [...picked.values()]
  }, [pid, categoryId, industry]))

/** Home product tabs (GET /api/public/home/products?tab=) and request ticker (browse?sort=newest&size=8). */
export const useHomeProducts = (tab: 'popular' | 'newest' | 'certified') => useRemote('home:products:' + tab, useCallback(() => (USE_MOCK ? mockApi.homeProducts : liveApi.homeProducts)(tab), [tab]))
export const useHomeRequests = () => useRemote('home:requests', useCallback(() => (USE_MOCK ? mockApi.browseImportRequests : liveApi.browseImportRequests)(), []))
