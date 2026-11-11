/** Shared page header: gradient-mesh hero with the trade illustration, breadcrumb, title, and a Global-Sources-style tab bar overlapping its bottom edge. */
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export type Crumb = { label: string; to?: string }

/**
 * Hero + breadcrumb + title + optional tab bar. The mesh covers hero and tab bar, then fades into the page, so there is no horizontal seam.
 * `children` (search box, filters…) sit in the left column under the subtitle; `tabs` straddles the hero's bottom edge.
 */
export function PageHero({ crumbs, title, titleKey, subtitle, children, tabs, tone = 'sky' }: { crumbs: Crumb[]; title: ReactNode; titleKey?: string; subtitle?: ReactNode; children?: ReactNode; tabs?: ReactNode; tone?: HeroTone }) {
  const { t } = useI18n()
  const navy = tone === 'navy'
  return (
    <div className="relative isolate pb-12">
      <HeroArt tone={tone} />
      <section className={cn('pt-7 md:min-h-[300px] md:pt-10', tabs ? 'pb-16 md:pb-20' : 'pb-12 md:pb-14')}>
        <div className="container-page">
          <div className="min-w-0 max-w-2xl">
            <nav aria-label={t.ui.breadcrumb} className={cn('flex flex-wrap items-center gap-1 text-[13px]', navy ? 'text-white/65' : 'text-navy/65 dark:text-white/70')}>
              {crumbs.map((c, i) => (
                <span key={c.label + i} className="inline-flex items-center gap-1">
                  {i > 0 && <ChevronRight className="size-3.5" aria-hidden />}
                  {c.to && i < crumbs.length - 1
                    ? <Link to={c.to} className={navy ? 'hover:text-white' : 'hover:text-primary dark:hover:text-white'}>{c.label}</Link>
                    : <span className={i === crumbs.length - 1 ? cn('font-semibold', navy ? 'text-white' : 'text-navy dark:text-white') : undefined}>{c.label}</span>}
                </span>
              ))}
            </nav>
            <motion.h1 key={titleKey} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn('mt-1 line-clamp-2 py-1.5 text-4xl font-extrabold leading-[1.25] tracking-tight md:text-5xl md:leading-[1.25]', navy ? 'text-white' : 'text-primary dark:text-white')}>
              {title}
            </motion.h1>
            {navy && <span aria-hidden className="block h-1 w-14 rounded-full bg-gold-bright" />}
            {subtitle && <p className={cn('mt-3 text-base font-medium md:text-lg', navy ? 'text-white/80' : 'text-navy/75 dark:text-white/80')} aria-live="polite">{subtitle}</p>}
            {children && <div className="mt-6">{children}</div>}
          </div>
        </div>
      </section>
      {tabs && <div className="container-page relative z-10 -mt-8 md:-mt-9">{tabs}</div>}
    </div>
  )
}

/** Một hàng danh mục cuộn ngang: tab đang chọn tô kín chiều cao thanh, mũi nhọn trượt theo tab; mũi tên hiện khi còn danh mục bị che. */
export function CategoryTabs({ items, value, onChange, label }: { items: { id: string; name: string }[]; value: string; onChange: (id: string) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [edge, setEdge] = useState({ start: true, end: true })
  const [pointer, setPointer] = useState<number | null>(null)
  const sync = () => {
    const el = ref.current
    if (!el) return
    setEdge({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 })
    const tab = el.querySelector<HTMLElement>('[aria-pressed="true"]')
    const x = tab ? tab.offsetLeft - el.scrollLeft + tab.offsetWidth / 2 : -1
    // mũi nhọn chỉ hiện khi tab nằm trong vùng giữa hai dải mũi tên (padding của thanh)
    const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0
    setPointer(x > pad + 12 && x < el.clientWidth - pad - 12 ? x : null)
  }
  // Tự chạy hiệu ứng trượt thay vì scrollTo({behavior:'smooth'}): index.css ép scroll-behavior:auto khi hệ điều hành bật
  // "giảm chuyển động" (Windows tắt animation), lúc đó cuộn mượt của trình duyệt biến thành nhảy một cục.
  const raf = useRef(0)
  const stop = () => cancelAnimationFrame(raf.current)
  const glide = (to: number) => {
    const el = ref.current
    if (!el) return
    stop()
    const from = el.scrollLeft
    const target = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, to))
    const dist = target - from
    if (Math.abs(dist) < 1) return
    const dur = Math.min(560, 280 + Math.abs(dist) * 0.3)
    const t0 = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur)
      el.scrollLeft = from + dist * (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2) // easeInOutCubic
      if (p < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }
  useEffect(() => {
    // font tải muộn làm tab rộng ra, nên đo và căn giữa tab đang chọn sau khi font sẵn sàng
    document.fonts.ready.then(() => {
      const el = ref.current
      const tab = el?.querySelector<HTMLElement>('[aria-pressed="true"]')
      if (el && tab) glide(tab.offsetLeft - (el.clientWidth - tab.offsetWidth) / 2)
      sync()
    })
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [value, items.length])
  useEffect(() => stop, [])
  // mỗi lần bấm lướt đúng một tab: tab kế tiếp (hoặc liền trước) trở thành tab đầu tiên nhìn thấy
  const nudge = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0
    const left = el.scrollLeft + pad
    const tabs = [...el.querySelectorAll<HTMLElement>('button[aria-pressed]')]
    const target = dir === 1 ? tabs.find((t) => t.offsetLeft > left + 1) : [...tabs].reverse().find((t) => t.offsetLeft < left - 1)
    if (target) glide(target.offsetLeft - pad)
  }
  // hai dải mũi tên luôn hiện (desktop): xanh đậm khi còn cuộn được, xám mờ khi đã hết; tab không bị che vì thanh chừa padding cho dải
  const strip = 'absolute inset-y-0 z-10 hidden w-12 items-center justify-center bg-card md:flex'
  const btn = 'grid size-10 place-items-center text-primary transition-colors enabled:hover:text-primary-hover disabled:cursor-default disabled:text-muted-foreground/35'
  return (
    <div className="relative rounded-xl bg-card shadow-[0_12px_32px_-14px_rgba(8,8,46,0.4)] ring-1 ring-black/5 dark:ring-white/10">
      <div ref={ref} onScroll={sync} onWheel={stop} onTouchStart={stop} role="group" aria-label={label} className="no-scrollbar flex overflow-x-auto rounded-xl md:px-12">
        {items.map(({ id, name }) => {
          const on = value === id
          return (
            <button
              key={id}
              aria-pressed={on}
              onClick={() => onChange(id)}
              className={cn('relative h-14 shrink-0 whitespace-nowrap px-6 text-[15px] font-semibold transition-colors lg:px-7', on ? 'bg-gradient-to-b from-[#1a8bc4] to-primary text-primary-foreground' : 'text-foreground/75 hover:bg-primary-soft hover:text-primary')}
            >
              {name}
            </button>
          )
        })}
      </div>
      {pointer !== null && <span aria-hidden style={{ left: pointer }} className="pointer-events-none absolute -bottom-1.5 size-3 -translate-x-1/2 rotate-45 rounded-[2px] bg-primary" />}
      <div className={cn(strip, 'left-0 rounded-l-xl shadow-[6px_0_10px_-6px_rgba(8,8,46,0.22)]')}><button type="button" aria-label="‹" disabled={edge.start} onClick={() => nudge(-1)} className={btn}><ChevronLeft className="size-6" strokeWidth={2.75} /></button></div>
      <div className={cn(strip, 'right-0 rounded-r-xl shadow-[-6px_0_10px_-6px_rgba(8,8,46,0.22)]')}><button type="button" aria-label="›" disabled={edge.end} onClick={() => nudge(1)} className={btn}><ChevronRight className="size-6" strokeWidth={2.75} /></button></div>
    </div>
  )
}

/** Nền hero kiểu gradient mesh: vài vệt màu mờ chồng lên nhau, tràn hết chiều ngang, không có cạnh cứng. Thuần CSS. */
const HERO_MESH_LIGHT = [
  'radial-gradient(60% 90% at 92% 8%, rgba(255,205,96,.85) 0%, rgba(255,205,96,0) 70%)',
  'radial-gradient(45% 80% at 72% 105%, rgba(255,160,122,.55) 0%, rgba(255,160,122,0) 70%)',
  'radial-gradient(50% 90% at 58% -10%, rgba(92,192,236,.55) 0%, rgba(92,192,236,0) 70%)',
  'radial-gradient(55% 100% at 4% 100%, rgba(140,208,245,.75) 0%, rgba(140,208,245,0) 70%)',
  'linear-gradient(115deg, rgba(255,255,255,0) 52%, rgba(255,255,255,.4) 60%, rgba(255,255,255,0) 68%)',
  'linear-gradient(100deg, #d4ebf9 0%, #eaf5fb 42%, #fdf1d6 100%)',
].join(',')
const HERO_MESH_DARK = [
  'radial-gradient(60% 90% at 92% 8%, rgba(224,184,74,.5) 0%, rgba(224,184,74,0) 70%)',
  'radial-gradient(45% 80% at 72% 105%, rgba(42,159,216,.35) 0%, rgba(42,159,216,0) 70%)',
  'radial-gradient(55% 100% at 4% 100%, rgba(42,159,216,.3) 0%, rgba(42,159,216,0) 70%)',
  'linear-gradient(100deg, #06152e 0%, #0a2a4a 60%, #1b2a3f 100%)',
].join(',')

// đáy nền tan dần về trong suốt để hoà vào màu nền trang
const HERO_FADE = { maskImage: 'linear-gradient(to bottom, #000 0%, #000 55%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 55%, transparent 100%)' }

// ảnh minh hoạ (tạo bằng Figma AI) mờ dần ở mọi mép để hoà vào nền mesh, không lộ khung chữ nhật
const HERO_IMG_FADE = 'linear-gradient(to right, transparent 0%, #000 38%), linear-gradient(to bottom, transparent 0%, #000 14%, #000 66%, transparent 100%)'
const HERO_IMG_MASK = { maskImage: HERO_IMG_FADE, maskComposite: 'intersect', WebkitMaskImage: HERO_IMG_FADE, WebkitMaskComposite: 'source-in' } as const

export type HeroTone = 'sky' | 'navy'

// bản "navy": nền xanh đậm có vệt vàng và lưới chấm mờ, ảnh toà nhà; khác hẳn bản "sky" sáng của trang sản phẩm
const HERO_MESH_NAVY = [
  'radial-gradient(45% 100% at 88% 10%, rgba(224,184,74,.32) 0%, rgba(224,184,74,0) 70%)',
  'radial-gradient(50% 90% at 30% 120%, rgba(42,159,216,.28) 0%, rgba(42,159,216,0) 70%)',
  'radial-gradient(rgba(255,255,255,.09) 1px, transparent 1.6px) 0 0 / 22px 22px',
  'linear-gradient(100deg, #021a3f 0%, #03224f 55%, #04285c 100%)',
].join(',')
const NAVY_FADE = 'linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%)'

function HeroArt({ tone }: { tone: HeroTone }) {
  if (tone === 'navy') {
    return (
      <>
        <img src="/imgs/hero-business.webp" alt="" aria-hidden width={1536} height={864} className="pointer-events-none absolute right-0 top-0 -z-10 hidden h-[300px] w-auto max-w-[62%] object-cover object-right md:block" style={HERO_IMG_MASK} />
        <div aria-hidden className="absolute inset-0 -z-20" style={{ background: HERO_MESH_NAVY, maskImage: NAVY_FADE, WebkitMaskImage: NAVY_FADE }} />
      </>
    )
  }
  return (
    <>
      <img src="/imgs/hero-trade.webp" alt="" aria-hidden width={1536} height={864} className="pointer-events-none absolute right-0 top-0 -z-10 hidden h-[300px] w-auto max-w-[62%] object-cover object-right opacity-95 md:block dark:md:hidden" style={HERO_IMG_MASK} />
      <div aria-hidden className="absolute inset-0 -z-20 dark:hidden" style={{ background: HERO_MESH_LIGHT, ...HERO_FADE }} />
      <div aria-hidden className="absolute inset-0 -z-20 hidden dark:block" style={{ background: HERO_MESH_DARK, ...HERO_FADE }} />
    </>
  )
}
