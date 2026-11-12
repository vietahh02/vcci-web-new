import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/** Client-side paging for an already-loaded list; `page` is clamped so a shrinking list never shows an empty page. */
export function usePaged<T>(all: T[], size = 5) {
  const [requested, onChange] = useState(0)
  const pageCount = Math.ceil(all.length / size)
  const page = Math.min(requested, Math.max(pageCount - 1, 0))
  return { items: all.slice(page * size, (page + 1) * size), page, pageCount, onChange }
}

/** Page indexes to render: first, last and the current ±1; -1 marks a gap ("…"). A gap hiding a single page shows that page instead. */
export function pageItems(page: number, pageCount: number): number[] {
  const keep = [...new Set([0, page - 1, page, page + 1, pageCount - 1])].filter((i) => i >= 0 && i < pageCount).sort((a, b) => a - b)
  const out: number[] = []
  keep.forEach((i, k) => {
    const prev = keep[k - 1]
    if (prev !== undefined && i - prev === 2) out.push(i - 1)
    else if (prev !== undefined && i - prev > 2) out.push(-1)
    out.push(i)
  })
  return out
}

export function Pager({ page, pageCount, onChange, className }: { page: number; pageCount: number; onChange: (page: number) => void; className?: string }) {
  const { t } = useI18n()
  if (pageCount <= 1) return null
  const cell = 'grid size-9 place-items-center rounded-full border text-sm font-semibold transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40'

  return (
    <nav aria-label="pagination" className={cn('flex flex-wrap items-center justify-center gap-1', className)}>
      <button type="button" aria-label={t.common.back} disabled={page === 0} onClick={() => onChange(page - 1)} className={cell}><ChevronLeft className="size-4" /></button>
      {pageItems(page, pageCount).map((i, k) => i < 0 ? (
        <span key={`gap${k}`} className="grid size-9 place-items-center text-sm text-muted-foreground">…</span>
      ) : (
        <button
          key={i}
          type="button"
          aria-current={i === page ? 'page' : undefined}
          onClick={() => onChange(i)}
          className={cn(cell, i === page && 'border-primary bg-primary text-primary-foreground hover:bg-primary')}
        >
          {i + 1}
        </button>
      ))}
      <button type="button" aria-label={t.common.next} disabled={page === pageCount - 1} onClick={() => onChange(page + 1)} className={cell}><ChevronRight className="size-4" /></button>
    </nav>
  )
}
