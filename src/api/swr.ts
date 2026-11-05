/**
 * Stale-while-revalidate cache for slow-changing public reads.
 *  - fresh (age < ttl): answered from cache, no request.
 *  - stale: the cached value is returned at once and refreshed in the background.
 *  - miss / failed refresh: fetch; a failed refresh keeps serving the stale value when there is one.
 * `persist: true` also keeps the value in localStorage, so a page reload needs no request. Every storage call is
 * wrapped: private mode, blocked storage or a full quota just means the memory cache alone.
 */
const mem = new Map<string, { at: number; data: unknown }>()
const inflight = new Map<string, Promise<unknown>>()
const PREFIX = 'vcci.cache.v1:'
const MEM_LIMIT = 60

export const HOUR = 60 * 60 * 1000
export const DAY = 24 * HOUR

function readStore(key: string): { at: number; data: unknown } | undefined {
  try {
    const raw = globalThis.localStorage?.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as { at: number; data: unknown }) : undefined
  } catch {
    return undefined
  }
}

function writeStore(key: string, entry: { at: number; data: unknown }) {
  try {
    globalThis.localStorage?.setItem(PREFIX + key, JSON.stringify(entry))
  } catch {
    /* storage unavailable or full: memory cache still works */
  }
}

function remember(key: string, entry: { at: number; data: unknown }, persist: boolean) {
  mem.delete(key)
  mem.set(key, entry)
  while (mem.size > MEM_LIMIT) mem.delete(mem.keys().next().value as string)
  if (persist) writeStore(key, entry)
}

export interface SwrOptions {
  ttl: number
  persist?: boolean
}

export function cached<T>(key: string, opts: SwrOptions, fetcher: () => Promise<T>): Promise<T> {
  const { ttl, persist = false } = opts
  const hit = mem.get(key) ?? (persist ? readStore(key) : undefined)
  if (hit && Date.now() - hit.at < ttl) return Promise.resolve(hit.data as T)

  const refresh = () => {
    const running = inflight.get(key)
    if (running) return running as Promise<T>
    const p = fetcher()
      .then((data) => {
        remember(key, { at: Date.now(), data }, persist)
        return data
      })
      .finally(() => inflight.delete(key))
    inflight.set(key, p)
    return p
  }

  if (hit) {
    // stale: show it now, refresh quietly; a failed refresh is ignored (the stale value stays)
    refresh().catch(() => {})
    return Promise.resolve(hit.data as T)
  }
  return refresh()
}

/** Drop one key (or every key starting with `prefix`) from memory and storage. */
export function forget(prefix = '') {
  for (const k of [...mem.keys()]) if (k.startsWith(prefix)) mem.delete(k)
  try {
    const ls = globalThis.localStorage
    if (!ls) return
    for (let i = ls.length - 1; i >= 0; i--) {
      const k = ls.key(i)
      if (k?.startsWith(PREFIX + prefix)) ls.removeItem(k)
    }
  } catch {
    /* ignore */
  }
}
