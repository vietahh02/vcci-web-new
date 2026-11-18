import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Hiển thị mô tả dài do doanh nghiệp/người mua nhập: đoạn cách nhau bằng dòng trống, dòng kết thúc bằng ":" đứng riêng là tiêu đề,
 * dòng bắt đầu bằng "• " (hoặc "- ") là mục liệt kê. Văn bản thường một đoạn vẫn hiển thị như cũ.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const lines = text.replace(/\r/g, '').split('\n')
  const out: ReactNode[] = []
  let bullets: string[] = []
  let para: string[] = []
  let k = 0
  const flushBullets = () => {
    if (!bullets.length) return
    out.push(
      <ul key={k++} className="mt-2 space-y-1.5">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2.5 leading-relaxed">
            <span aria-hidden className="mt-[0.62em] size-1.5 shrink-0 rounded-full bg-primary/70" />
            <span>{b}</span>
          </li>
        ))}
      </ul>,
    )
    bullets = []
  }
  const flushPara = () => {
    if (!para.length) return
    out.push(<p key={k++} className="mt-3 leading-relaxed first:mt-0">{para.join(' ')}</p>)
    para = []
  }
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) { flushBullets(); flushPara(); continue }
    const bullet = /^(•|-|\*)\s+(.*)$/.exec(line)
    if (bullet) { flushPara(); bullets.push(bullet[2]!); continue }
    if (line.endsWith(':') && line.length <= 72) {
      flushBullets(); flushPara()
      out.push(<h4 key={k++} className="mt-6 text-sm font-bold uppercase tracking-wide text-foreground first:mt-0">{line.slice(0, -1)}</h4>)
      continue
    }
    flushBullets()
    para.push(line)
  }
  flushBullets(); flushPara()
  return <div className={cn('text-foreground/90', className)}>{out}</div>
}
