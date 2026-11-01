/**
 * Uy tín do VCCI đánh giá (CMS > Doanh nghiệp > Đánh giá): số sao + điểm /100 trên thẻ/hero, khối chi tiết ở hồ sơ DN.
 * Số sao và việc có công khai hay không do backend quyết (cấu hình `vcci.reputation.*`); BE tắt -> không vẽ gì.
 * Chế độ mock giữ nguyên hiển thị prototype (`Stars` với điểm mẫu thang 5).
 */
import { Award, CheckCircle2, Star } from 'lucide-react'
import { USE_MOCK } from '@/api'
import { useReputation, useReputationDetail, type ReputationCriterion, type ReputationSummary } from '@/api/reputationApi'
import { Stars } from '@/components/brand'
import { Tooltip } from '@/components/ui/overlay'
import { useI18n, type Bilingual } from '@/lib/i18n'
import { tx } from '@/lib/tx'
import { cn, formatDate } from '@/lib/utils'

const GROUPS: Record<string, Bilingual> = {
  A: { vi: 'Tuân thủ & pháp lý', en: 'Compliance & legal', ko: '준법 및 법률' },
  B: { vi: 'Gắn kết với VCCI', en: 'Engagement with VCCI', ko: 'VCCI 참여' },
  C: { vi: 'Năng lực & quy mô', en: 'Capacity & scale', ko: '역량 및 규모' },
  D: { vi: 'Thông tin & sản phẩm', en: 'Information & products', ko: '정보 및 제품' },
  E: { vi: 'Uy tín giao thương', en: 'Trade reputation', ko: '거래 신뢰도' },
}

const label = (r: ReputationSummary) =>
  tx(`Uy tín VCCI: ${r.stars}/${r.maxStars} sao (${r.score}/${r.maxScore} điểm)`, `VCCI reputation: ${r.stars}/${r.maxStars} stars (${r.score}/${r.maxScore} points)`, `VCCI 신뢰도: 별 ${r.stars}/${r.maxStars} (${r.score}/${r.maxScore}점)`)

function StarRow({ value, max, className, size = 'size-3.5', dark }: { value: number; max: number; className?: string; size?: string; dark?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-hidden>
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={cn(size, i < value ? 'fill-gold-bright text-gold-bright' : dark ? 'fill-white/20 text-white/20' : 'fill-muted text-muted-foreground/30')} />
      ))}
    </span>
  )
}

/** Inline (thẻ DN, hero hồ sơ, DN tiêu biểu, nhà cung cấp ở chi tiết sản phẩm). */
export function ReputationStars({ orgId, legacyScore, className, dark }: { orgId: string; legacyScore: number; className?: string; dark?: boolean }) {
  if (USE_MOCK) return <Stars score={legacyScore} className={className} />
  return <LiveStars orgId={orgId} className={className} dark={dark} />
}

function LiveStars({ orgId, className, dark }: { orgId: string; className?: string; dark?: boolean }) {
  const r = useReputation(orgId)
  if (!r || !r.evaluated) return null
  return (
    <Tooltip content={tx('Điểm uy tín do VCCI đánh giá theo bộ tiêu chí công khai', 'Reputation score assessed by VCCI against its published criteria', 'VCCI가 공개 기준에 따라 평가한 신뢰도 점수')}>
      <span className={cn('inline-flex items-center gap-1.5 text-[13px] font-semibold', className)} aria-label={label(r)} role="img" data-testid="reputation-stars">
        <StarRow value={r.stars} max={r.maxStars} dark={dark} />
        <span className={cn('tabular-nums', dark ? 'text-white/80' : 'text-muted-foreground')}>{r.score}/{r.maxScore}</span>
      </span>
    </Tooltip>
  )
}

/** Khối "Uy tín VCCI" ở cột phải hồ sơ DN: điểm, sao, số tiêu chí đạt, ngày đánh giá, các tiêu chí ĐẠT theo nhóm. */
export function ReputationPanel({ orgId }: { orgId: string }) {
  const { L, locale } = useI18n()
  const { data } = useReputationDetail(USE_MOCK ? '' : orgId)
  if (!data) return null
  const groups = groupCriteria(data.criteria ?? [])
  return (
    <section className="rounded-2xl border bg-card p-6 text-sm" aria-labelledby="rep-title" data-testid="reputation-panel">
      <p id="rep-title" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <Award className="size-4 text-gold" /> {tx('Uy tín VCCI', 'VCCI reputation', 'VCCI 신뢰도')}
      </p>
      {!data.evaluated ? (
        <p className="mt-3 text-muted-foreground">{tx('VCCI chưa đánh giá doanh nghiệp này.', 'VCCI has not assessed this company yet.', 'VCCI가 아직 이 기업을 평가하지 않았습니다.')}</p>
      ) : (
        <>
          <div className="mt-3 flex items-end justify-between gap-4">
            <p className="text-4xl font-extrabold tracking-tight tabular-nums">
              {data.score}<span className="text-base font-semibold text-muted-foreground">/{data.maxScore}</span>
            </p>
            <span role="img" aria-label={label(data)}><StarRow value={data.stars} max={data.maxStars} size="size-5" /></span>
          </div>
          {data.achievedCount != null && data.totalCount != null && (
            <p className="mt-2 text-muted-foreground">
              {tx(`Đạt ${data.achievedCount}/${data.totalCount} tiêu chí`, `Meets ${data.achievedCount} of ${data.totalCount} criteria`, `${data.totalCount}개 기준 중 ${data.achievedCount}개 충족`)}
              {data.evaluatedAt && <> · {tx('đánh giá ngày', 'assessed on', '평가일')} {formatDate(data.evaluatedAt, locale)}</>}
            </p>
          )}
          {groups.length > 0 && (
            <ul className="mt-4 space-y-3 border-t pt-4">
              {groups.map(([g, list]) => (
                <li key={g}>
                  <p className="text-xs font-semibold text-muted-foreground">{GROUPS[g] ? L(GROUPS[g]!) : g || tx('Khác', 'Other', '기타')}</p>
                  <ul className="mt-1.5 space-y-1.5">
                    {list.map((c) => (
                      <li key={c.code} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                        <span className="flex-1 leading-snug">{c.name}</span>
                        {c.points != null && <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">+{c.points}</span>}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}

function groupCriteria(list: ReputationCriterion[]): [string, ReputationCriterion[]][] {
  const m = new Map<string, ReputationCriterion[]>()
  list.forEach((c) => { const k = c.group || ''; m.set(k, [...(m.get(k) ?? []), c]) })
  return [...m.entries()].sort(([a], [b]) => (a || '~').localeCompare(b || '~'))
}
