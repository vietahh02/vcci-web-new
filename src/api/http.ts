/**
 * HTTP core: base URL, Accept-Language, Bearer token, CommonResponse envelope unwrapping,
 * pagination normalisation and a single-flight refresh on 401.
 */
import { currentLang } from '@/lib/i18n'
import { API_BASE } from './config'

const OK_CODE = '00000'

export class ApiError extends Error {
  code: string
  status: number
  constructor(code: string, message: string, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

/* ------------------------------ token store ------------------------------ */
/** Tokens live in sessionStorage (cleared with the tab) -- minimal exposure; they are never logged or put in URLs. */
const AT = 'vcci.at'
const RT = 'vcci.rt'
const store = {
  get: (k: string) => {
    try { return sessionStorage.getItem(k) } catch { return null }
  },
  set: (k: string, v: string | null) => {
    try { if (v) sessionStorage.setItem(k, v); else sessionStorage.removeItem(k) } catch { /* storage unavailable: in-memory only */ }
  },
}
let memAccess: string | null = null
let memRefresh: string | null = null

export const tokens = {
  access: () => memAccess ?? store.get(AT),
  refresh: () => memRefresh ?? store.get(RT),
  set(access: string | null, refresh: string | null) {
    memAccess = access
    memRefresh = refresh
    store.set(AT, access)
    store.set(RT, refresh)
  },
  clear() { tokens.set(null, null) },
}

const listeners = new Set<() => void>()
export const onAuthExpired = (fn: () => void) => {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

/* -------------------------------- envelope -------------------------------- */
interface Envelope<T> { errorCode?: string; message?: string; result?: T }
const isEnvelope = (v: unknown): v is Envelope<unknown> => !!v && typeof v === 'object' && !Array.isArray(v) && 'errorCode' in (v as object)

export interface Page<T> { items: T[]; total: number; page: number; size: number }

/** BE paged result: {data, pagination:{page,size,total}} (also tolerates {items,total} / plain array). */
export function toPage<T>(r: unknown, fallbackSize = 12): Page<T> {
  const o = (r ?? {}) as Record<string, unknown>
  if (Array.isArray(r)) return { items: r as T[], total: r.length, page: 0, size: r.length || fallbackSize }
  const items = (o.data ?? o.items ?? o.content ?? []) as T[]
  const p = (o.pagination ?? {}) as Record<string, number>
  return { items, total: p.total ?? (o.total as number) ?? items.length, page: p.page ?? 0, size: p.size ?? fallbackSize }
}

/* --------------------------------- fetch --------------------------------- */
export interface ReqOpts {
  method?: string
  query?: Record<string, string | number | boolean | undefined | null | (string | number)[]>
  json?: unknown
  form?: FormData
  headers?: Record<string, string>
  /** do not attach Bearer / do not try refresh (login, refresh itself) */
  anon?: boolean
  signal?: AbortSignal
}

function buildUrl(path: string, query?: ReqOpts['query']) {
  const u = new URL(API_BASE + path, typeof location !== 'undefined' ? location.origin : undefined)
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v === undefined || v === null || v === '') continue
    u.searchParams.set(k, Array.isArray(v) ? v.join(',') : String(v))
  }
  return u.toString()
}

async function send(path: string, o: ReqOpts) {
  const headers = new Headers(o.headers)
  if (!headers.has('Accept-Language')) headers.set('Accept-Language', currentLang())
  headers.set('Accept', 'application/json')
  const at = o.anon ? null : tokens.access()
  if (at) headers.set('Authorization', `Bearer ${at}`)
  let body: BodyInit | undefined
  if (o.form) body = o.form
  else if (o.json !== undefined) { headers.set('Content-Type', 'application/json'); body = JSON.stringify(o.json) }
  return fetch(buildUrl(path, o.query), { method: o.method ?? (body ? 'POST' : 'GET'), headers, body, signal: o.signal })
}

let refreshing: Promise<boolean> | null = null
/** Làm mới access token một lần (single-flight); dùng thêm cho client chat (dịch vụ khác base URL). */
export async function refreshOnce(): Promise<boolean> {
  const rt = tokens.refresh()
  if (!rt) return false
  refreshing ??= (async () => {
    try {
      const res = await send('/api/auth/refresh-token', { method: 'POST', json: { refreshToken: rt }, anon: true })
      const data = (await res.json().catch(() => null)) as Envelope<Record<string, unknown>> | null
      const r = data?.result
      if (!res.ok || !r || data?.errorCode !== OK_CODE || !r.access_token) return false
      tokens.set(String(r.access_token), String(r.refresh_token ?? rt))
      return true
    } catch {
      return false
    } finally {
      setTimeout(() => { refreshing = null }, 0)
    }
  })()
  return refreshing
}

async function parse<T>(res: Response, path: string): Promise<T> {
  const text = await res.text()
  let data: unknown = null
  if (text) { try { data = JSON.parse(text) } catch { data = text } }
  if (isEnvelope(data)) {
    if (res.ok && data.errorCode === OK_CODE) return data.result as T
    throw new ApiError(data.errorCode ?? String(res.status), data.message ?? res.statusText, res.status)
  }
  if (!res.ok) {
    const msg = typeof data === 'object' && data && 'message' in data ? String((data as { message: unknown }).message) : `${res.status} ${res.statusText} - ${path}`
    throw new ApiError(String(res.status), msg, res.status)
  }
  return data as T // non-enveloped body (e.g. text/calendar)
}

export async function apiFetch<T>(path: string, o: ReqOpts = {}): Promise<T> {
  let res = await send(path, o)
  if (res.status === 401 && !o.anon && tokens.refresh()) {
    if (await refreshOnce()) res = await send(path, o)
    else { tokens.clear(); listeners.forEach((f) => f()) }
  }
  return parse<T>(res, path)
}

/** Paged GET helper. */
export const apiPage = async <T>(path: string, query: ReqOpts['query'], size = 12) => toPage<T>(await apiFetch<unknown>(path, { query }), size)
