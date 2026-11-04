/**
 * Profile file uploads (BE: vcci-portal-apis `FileController`). Rules are the same 8 keys as `lib/upload.ts` RULES;
 * the server re-checks extension, size, magic-bytes and image size/ratio, so the client check is only a hint.
 *  - signed in : POST /api/files/upload       (any rule)
 *  - anonymous : POST /api/files/register-upload (logo, legal only; returns an `uploadToken` that the register call sends back)
 * Public files are referenced by a relative path `/api/files/{id}/content`, resolved against the API origin with `fileSrc`.
 */
import { API_BASE } from './config'
import { apiFetch, tokens } from './http'
import type { Raw } from './adapters/common'

export interface UploadedFile {
  fileId: string
  name: string
  kind: string
  size: number
  contentType: string
  /** relative public path, undefined for private rules (legal, finance, evidence) */
  url?: string
  uploadToken?: string
}

const TOKEN_KEY = 'vcci.reg.upload'
let regToken: string | null = null
export const registerUploadToken = (): string | null => {
  if (regToken) return regToken
  try { regToken = sessionStorage.getItem(TOKEN_KEY) } catch { /* storage unavailable */ }
  return regToken
}
const rememberToken = (t: string) => {
  regToken = t
  try { sessionStorage.setItem(TOKEN_KEY, t) } catch { /* storage unavailable */ }
}
export const clearRegisterUploadToken = () => {
  regToken = null
  try { sessionStorage.removeItem(TOKEN_KEY) } catch { /* storage unavailable */ }
}

export async function uploadFile(rule: string, file: File): Promise<UploadedFile> {
  const fd = new FormData()
  fd.set('rule', rule)
  fd.set('file', file)
  const signedIn = !!tokens.access()
  if (!signedIn) {
    const t = registerUploadToken()
    if (t) fd.set('uploadToken', t)
  }
  const r = await apiFetch<Raw>(signedIn ? '/api/files/upload' : '/api/files/register-upload', { method: 'POST', form: fd, anon: !signedIn })
  if (!signedIn && r.uploadToken) rememberToken(String(r.uploadToken))
  return {
    fileId: String(r.fileId), name: String(r.name ?? file.name), kind: String(r.kind ?? rule), size: Number(r.size ?? file.size),
    contentType: String(r.contentType ?? ''), url: r.url ? String(r.url) : undefined, uploadToken: r.uploadToken ? String(r.uploadToken) : undefined,
  }
}

/**
 * Picked files stay in the browser until Save/Submit: form state holds a local `blob:` ref (as its id/url/fileId, which also previews),
 * and `uploadPending` swaps every ref still in the form for the stored file. Files removed before that are never sent.
 */
const pending = new Map<string, { rule: string; file: File; upload?: Promise<UploadedFile> }>()

export function holdFile(rule: string, file: File): string {
  const ref = URL.createObjectURL(file)
  pending.set(ref, { rule, file })
  return ref
}

// memoized: a ref can appear twice (legalDocs mirrors docs) and a failed submit is retried; anonymous uploads are rate limited per IP
const send = (ref: string) => {
  const p = pending.get(ref)!
  p.upload ??= uploadFile(p.rule, p.file).catch((e: Error) => {
    p.upload = undefined
    throw new Error(`${p.file.name}: ${e.message}`)
  })
  return p.upload
}

/** Returns `value` with refs replaced. One file at a time: the first anonymous upload mints the token the others must reuse. */
export async function uploadPending<T>(value: T): Promise<T> {
  const walk = async (v: unknown, key: string): Promise<unknown> => {
    if (typeof v === 'string') {
      if (!pending.has(v)) return v
      const u = await send(v)
      return /^id$|fileId$/i.test(key) ? u.fileId : u.url
    }
    if (Array.isArray(v)) {
      const out: unknown[] = []
      for (const x of v) out.push(await walk(x, key))
      return out
    }
    if (v && typeof v === 'object') {
      const out: Record<string, unknown> = {}
      for (const [k, x] of Object.entries(v)) out[k] = await walk(x, k)
      return out
    }
    return v
  }
  return (await walk(value, '')) as T
}

/** Absolute src for a stored file reference: `/api/files/..` paths belong to the API origin; everything else passes through. */
export const fileSrc = (v: string): string => (v.startsWith('/api/files/') ? API_BASE + v : v)

/** `/api/files/{id}/content` -> `{id}` (the logo is stored as that path; register sends its id). */
export const fileIdOf = (v: string | undefined | null): string | undefined => v?.match(/\/api\/files\/([A-Za-z0-9_-]+)\/content/)?.[1]
