/** Share an event page: copy the link, Facebook, LinkedIn, Zalo. The pages open in a new tab and receive only the URL. */
import { Link2 } from 'lucide-react'
import { useToast } from '@/components/ui/overlay'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'
import { cn } from '@/lib/utils'

export function ShareButtons({ url, tone = 'light', className }: { url: string; tone?: 'dark' | 'light'; className?: string }) {
  useI18n()
  const toast = useToast()
  const to = encodeURIComponent(url)
  const cls = cn('inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-[13px] font-semibold transition', tone === 'dark' ? 'border-white/25 text-white hover:bg-white/10' : 'hover:bg-muted')
  const copy = () => navigator.clipboard.writeText(url).then(
    () => toast({ kind: 'success', title: tx('Đã sao chép liên kết', 'Link copied', '링크를 복사했습니다') }),
    () => toast({ kind: 'info', title: url }),
  )
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <button type="button" className={cls} onClick={() => void copy()}><Link2 className="size-4" /> {tx('Sao chép liên kết', 'Copy link', '링크 복사')}</button>
      <a className={cls} target="_blank" rel="noopener noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${to}`}>Facebook</a>
      <a className={cls} target="_blank" rel="noopener noreferrer" href={`https://www.linkedin.com/sharing/share-offsite/?url=${to}`}>LinkedIn</a>
      <a className={cls} target="_blank" rel="noopener noreferrer" href={`https://zalo.me/share?url=${to}`}>Zalo</a>
    </div>
  )
}
