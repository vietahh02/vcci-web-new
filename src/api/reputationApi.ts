/**
 * Đánh giá uy tín DN công khai (VCCI chấm ở CMS): điểm /100, số sao, tiêu chí đạt.
 * - Thẻ danh bạ: `useReputation(id)`; các thẻ render cùng lúc được gom thành MỘT lời gọi
 *   `GET /api/public/businesses/reputation?ids=` (không N+1).
 * - Hồ sơ DN: `useReputationDetail(id)` -> `GET /api/public/businesses/{id}/reputation`.
 * Quy tắc (công khai hay không, quy đổi sao) do BE quyết theo cấu hình; FE không tự quy đổi điểm ra sao.
 * `enabled=false` (mặc định khi chưa chốt nghiệp vụ) -> component ẩn hẳn khối.
 */
import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from './http'
import { USE_MOCK } from './config'
import { useRemote } from './hooks'
import { arr, id, num, str, type Raw } from './adapters/common'

export interface ReputationSummary { organizationId: string; evaluated: boolean; score: number; maxScore: number; stars: number; maxStars: number }
export interface ReputationCriterion { code: string; group: string; name: string; points?: number }
export interface ReputationDetail extends ReputationSummary {
  enabled: boolean
  achievedCount?: number
  totalCount?: number
  evaluatedAt?: string
  criteria?: ReputationCriterion[]
}

const toSummary = (r: Raw): ReputationSummary => ({
  organizationId: id(r.organizationId), evaluated: Boolean(r.evaluated), score: num(r.score), maxScore: num(r.maxScore, 100),
  stars: num(r.stars), maxStars: num(r.maxStars, 5),
})

/* -------------------------------------------------------- batched loader */
type Hit = ReputationSummary | null
/** null = BE tắt công khai (hoặc DN không công khai): ẩn. Điểm không phụ thuộc ngôn ngữ nên không gắn khoá ngôn ngữ. */
const cache = new Map<string, { at: number; p: Promise<Hit> }>()
/** Điểm có thể đổi khi CMS chấm lại: giữ tối đa 60 giây trong phiên SPA (BE cũng chỉ cho cache 30 giây). */
const TTL_MS = 60_000
let queue: { id: string; resolve: (h: Hit) => void }[] = []
let timer: ReturnType<typeof setTimeout> | null = null
const MAX_IDS = 100

async function flush() {
  timer = null
  const batch = queue
  queue = []
  for (let i = 0; i < batch.length; i += MAX_IDS) {
    const part = batch.slice(i, i + MAX_IDS)
    try {
      const r = await apiFetch<Raw>('/api/public/businesses/reputation', { query: { ids: part.map((p) => p.id) } })
      const byId = new Map(arr(r?.items).map((x) => [id(x.organizationId), toSummary(x)]))
      part.forEach((p) => p.resolve(r?.enabled ? byId.get(p.id) ?? null : null))
    } catch {
      // lỗi mạng/BE cũ chưa có endpoint: ẩn khối (không hiện số sai), cho phép thử lại ở lần render sau
      part.forEach((p) => { cache.delete(p.id); p.resolve(null) })
    }
  }
}

export function getReputation(orgId: string): Promise<Hit> {
  if (USE_MOCK || !/^\d+$/.test(orgId)) return Promise.resolve(null)
  const hit = cache.get(orgId)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.p
  const p = new Promise<Hit>((resolve) => { queue.push({ id: orgId, resolve }) })
  cache.set(orgId, { at: Date.now(), p })
  timer ??= setTimeout(flush, 0)
  return p
}

/** Xoá cache (vd. sau khi biết CMS vừa chấm lại). */
export const resetReputationCache = () => cache.clear()

export function useReputation(orgId: string): Hit | undefined {
  const [hit, setHit] = useState<{ id: string; v: Hit } | undefined>()
  useEffect(() => {
    let alive = true
    getReputation(orgId).then((v) => { if (alive) setHit({ id: orgId, v }) })
    return () => { alive = false }
  }, [orgId])
  return hit && hit.id === orgId ? hit.v : undefined
}

/* ---------------------------------------------------------------- detail */
export async function fetchReputationDetail(orgId: string): Promise<ReputationDetail | null> {
  const r = await apiFetch<Raw>(`/api/public/businesses/${encodeURIComponent(orgId)}/reputation`)
  if (!r?.enabled) return null
  return {
    ...toSummary(r), enabled: true,
    achievedCount: r.achievedCount == null ? undefined : num(r.achievedCount),
    totalCount: r.totalCount == null ? undefined : num(r.totalCount),
    evaluatedAt: r.evaluatedAt ? str(r.evaluatedAt) : undefined,
    criteria: r.criteria == null ? undefined : arr(r.criteria).map((c) => ({ code: str(c.code), group: str(c.group), name: str(c.name), points: c.points == null ? undefined : num(c.points) })),
  }
}

/** Khoá có ngôn ngữ (tên tiêu chí theo Accept-Language). Lỗi -> data undefined, component ẩn. */
export const useReputationDetail = (orgId: string) =>
  useRemote(!USE_MOCK && /^\d+$/.test(orgId) ? 'reputation:' + orgId : null, useCallback(() => fetchReputationDetail(orgId).catch(() => null), [orgId]))
