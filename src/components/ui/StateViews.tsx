/** Basic loading / error placeholders for live API calls (no new visual language: muted text + spinner). */
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/primitives'
import { tx } from '@/lib/tx'

export function LoadingBlock({ className = 'py-24' }: { className?: string }) {
  return (
    <div role="status" className={`flex items-center justify-center gap-2 text-muted-foreground ${className}`}>
      <Loader2 className="size-5 animate-spin" /> <span className="text-sm">{tx('Đang tải…', 'Loading…', '불러오는 중…')}</span>
    </div>
  )
}

export function ErrorBlock({ error, onRetry, className = 'py-24' }: { error?: Error; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={`flex flex-col items-center justify-center gap-3 text-center ${className}`}>
      <p className="font-semibold">{tx('Không tải được dữ liệu', 'Could not load data', '데이터를 불러오지 못했습니다')}</p>
      {error?.message && <p className="max-w-md text-sm text-muted-foreground">{error.message}</p>}
      {onRetry && <Button variant="outline" onClick={onRetry}>{tx('Thử lại', 'Retry', '다시 시도')}</Button>}
    </div>
  )
}
