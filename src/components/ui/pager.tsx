import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/** Client-side paging for an already-loaded list; `page` is clamped so a shrinking list never shows an empty page. */
export function usePaged<T>(all: T[], size = 10) {
  const [requested, onChange] = useState(0)
  const pageCount = Math.ceil(all.length / size)
  const page = Math.min(requested, Math.max(pageCount - 1, 0))
  return { items: all.slice(page * size, (page + 1) * size), page, pageCount, onChange }
}

export function Pager({ page, pageCount, onChange, className }: { page: number; pageCount: number; onChange: (page: number) => void; className?: string }) {
  const { t } = useI18n()
  if (pageCount <= 1) return null
  const cell = 'grid size-9 place-items-center rounded-lg border text-sm font-semibold transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40'

  return (
    <nav aria-label="pagination" className={cn('flex flex-wrap items-center justify-center gap-1', className)}>
      <button type="button" aria-label={t.common.back} disabled={page === 0} onClick={() => onChange(page - 1)} className={cell}><ChevronLeft className="size-4" /></button>
      {Array.from({ length: pageCount }, (_, i) => (
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
