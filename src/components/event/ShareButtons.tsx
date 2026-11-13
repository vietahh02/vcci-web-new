/** Share an event page: copy the link, Facebook, LinkedIn, Zalo. The pages open in a new tab and receive only the URL. */
import { Link2, Share2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/overlay'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'
import { cn } from '@/lib/utils'

/** `menu`: one button opening the choices, where space is tight. */
export function ShareButtons({ url, tone = 'light', className, menu }: { url: string; tone?: 'dark' | 'light'; className?: string; menu?: boolean }) {
  useI18n()
  const toast = useToast()
  const to = encodeURIComponent(url)
  const cls = cn('inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-[13px] font-semibold transition', tone === 'dark' ? 'border-white/25 text-white hover:bg-white/10' : 'hover:bg-muted')
  const copy = () => navigator.clipboard.writeText(url).then(
    () => toast({ kind: 'success', title: tx('Đã sao chép liên kết', 'Link copied', '링크를 복사했습니다') }),
    () => toast({ kind: 'info', title: url }),
  )
  const targets = [
    ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${to}`],
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${to}`],
    ['Zalo', `https://zalo.me/share?url=${to}`],
  ] as const
  if (menu) return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={cn('inline-flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-2 text-[13px] font-semibold transition sm:text-sm', tone === 'dark' ? 'border-white/25 text-white hover:bg-white/10' : 'hover:bg-muted', className)}><Share2 className="size-4" aria-hidden /> {tx('Chia sẻ', 'Share', '공유')}</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => void copy()}><Link2 /> {tx('Sao chép liên kết', 'Copy link', '링크 복사')}</DropdownMenuItem>
        {targets.map(([name, href]) => <DropdownMenuItem key={name} asChild><a href={href} target="_blank" rel="noopener noreferrer">{name}</a></DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
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
