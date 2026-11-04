/** Runtime config. VITE_USE_MOCK=true returns to the in-repo mock layer (default: real backend). */
const env = import.meta.env as Record<string, string | undefined>

export const API_BASE = (env.VITE_API_BASE_URL ?? env.VITE_API_BASE ?? 'http://localhost:8094').replace(/\/+$/, '')
export const USE_MOCK = env.VITE_USE_MOCK === 'true'

/** A public read that fails (missing endpoint, 5xx, network) falls back to sample data; every fallback is logged once. A successful empty response stays empty. */
const warned = new Set<string>()
export function mockFallback(endpoint: string, reason = 'endpoint not available on backend yet') {
  if (warned.has(endpoint)) return
  warned.add(endpoint)
  console.warn(`[api] mock fallback for ${endpoint}: ${reason}`)
}
