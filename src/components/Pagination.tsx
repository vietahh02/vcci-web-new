/** Numbered pagination (‹ 1 … 4 5 6 … 27 ›). Shared by the product list and the import-request board. */
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Các số trang cần hiện: đầu, cuối, trang hiện tại và hai bên; chỗ hở thay bằng dấu ba chấm. */
function pageItems(page: number, pages: number): (number | 'gap-l' | 'gap-r')[] {
  const keep = new Set([1, pages, page - 1, page, page + 1])
  if (page <= 3) { keep.add(2); keep.add(3) }
  if (page >= pages - 2) { keep.add(pages - 1); keep.add(pages - 2) }
  const nums = [...keep].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b)
  const out: (number | 'gap-l' | 'gap-r')[] = []
  nums.forEach((n, i) => {
    const prev = nums[i - 1]
    if (prev !== undefined && n - prev > 1) out.push(i < nums.length / 2 ? 'gap-l' : 'gap-r')
    out.push(n)
  })
  return out
}

export function Pagination({ page, pages, onChange, label }: { page: number; pages: number; onChange: (n: number) => void; label: string }) {
  const cell = 'grid h-10 min-w-10 place-items-center rounded-full border px-2 text-sm font-semibold transition-colors'
  return (
    <nav aria-label={label} className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
      <button type="button" aria-label="‹" disabled={page <= 1} onClick={() => onChange(page - 1)} className={cn(cell, 'bg-card hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-40')}><ChevronLeft className="size-4" /></button>
      {pageItems(page, pages).map((it) =>
        typeof it === 'number' ? (
          <button key={it} type="button" aria-current={it === page ? 'page' : undefined} onClick={() => onChange(it)} className={cn(cell, it === page ? 'border-transparent bg-primary text-primary-foreground' : 'bg-card text-foreground/80 hover:border-primary/40 hover:text-primary')}>{it}</button>
        ) : (
          <span key={it} aria-hidden className="grid h-10 min-w-8 place-items-center text-muted-foreground">…</span>
        ),
      )}
      <button type="button" aria-label="›" disabled={page >= pages} onClick={() => onChange(page + 1)} className={cn(cell, 'bg-card hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-40')}><ChevronRight className="size-4" /></button>
    </nav>
  )
}
