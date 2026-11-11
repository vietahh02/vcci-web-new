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
  const violet = tone === 'violet'
  const nav = (
    <nav aria-label={t.ui.breadcrumb} className={cn('flex flex-wrap items-center gap-1 text-[13px]', navy ? 'text-white/65' : violet ? 'text-[#3d2f8f]/70 dark:text-white/70' : 'text-navy/65 dark:text-white/70')}>
      {crumbs.map((c, i) => (
        <span key={c.label + i} className="inline-flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3.5" aria-hidden />}
          {c.to && i < crumbs.length - 1
            ? <Link to={c.to} className={navy ? 'hover:text-white' : violet ? 'hover:text-[#5a31e0] dark:hover:text-white' : 'hover:text-primary dark:hover:text-white'}>{c.label}</Link>
            : <span className={i === crumbs.length - 1 ? cn('font-semibold', navy ? 'text-white' : violet ? 'text-[#2a1b7a] dark:text-white' : 'text-navy dark:text-white') : undefined}>{c.label}</span>}
        </span>
      ))}
    </nav>
  )

  // violet: tiêu đề căn giữa, nền tím lavender có dải bóng; ô tìm kiếm và bộ lọc nằm ngay trong hero (không có thanh tab chồng mép)
  if (violet) {
    return (
      <div className="relative isolate pb-10">
        <VioletArt />
        <section className="pb-8 pt-7 md:pt-8">
          <div className="container-page">
            {nav}
            <div className="mt-1 max-w-3xl">
              <motion.h1 key={titleKey} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="line-clamp-2 py-1.5 text-4xl font-extrabold leading-[1.25] tracking-tight text-[#5a31e0] md:text-5xl md:leading-[1.25] dark:text-[#c3b8ff]">
                {title}
              </motion.h1>
              {subtitle && <p className="mt-2 text-base font-medium text-[#1f1a45]/85 md:text-lg dark:text-white/80" aria-live="polite">{subtitle}</p>}
            </div>
            {children && <div className="mt-7">{children}</div>}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="relative isolate pb-12">
      <HeroArt tone={tone} />
      <section className={cn('pt-7 md:min-h-[300px] md:pt-10', tabs ? 'pb-16 md:pb-20' : 'pb-12 md:pb-14')}>
        <div className="container-page">
          <div className="min-w-0 max-w-2xl">
            {nav}
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

/** Nền tím lavender → xanh ngọc nhạt, thêm vài tấm "lụa" bán trong suốt cong nhẹ. Thuần CSS + SVG, tan dần ở đáy. */
const VIOLET_MESH_LIGHT = [
  'radial-gradient(38% 80% at 0% 0%, rgba(205,196,255,.95) 0%, rgba(205,196,255,0) 70%)',
  'radial-gradient(34% 90% at 100% 12%, rgba(170,236,255,.95) 0%, rgba(170,236,255,0) 70%)',
  'radial-gradient(45% 60% at 52% 100%, rgba(226,216,255,.8) 0%, rgba(226,216,255,0) 70%)',
  'linear-gradient(100deg, #e9e6ff 0%, #f1f0ff 50%, #e0f4ff 100%)',
].join(',')
const VIOLET_MESH_DARK = [
  'radial-gradient(38% 80% at 0% 0%, rgba(110,86,255,.42) 0%, rgba(110,86,255,0) 70%)',
  'radial-gradient(34% 90% at 100% 12%, rgba(42,180,230,.3) 0%, rgba(42,180,230,0) 70%)',
  'linear-gradient(100deg, #0f0d2c 0%, #15143c 55%, #0d1f3a 100%)',
].join(',')
const VIOLET_FADE = 'linear-gradient(to bottom, #000 0%, #000 60%, transparent 100%)'

function VioletArt() {
  return (
    <>
      <div aria-hidden className="absolute inset-0 -z-20 dark:hidden" style={{ background: VIOLET_MESH_LIGHT, maskImage: VIOLET_FADE, WebkitMaskImage: VIOLET_FADE }} />
      <div aria-hidden className="absolute inset-0 -z-20 hidden dark:block" style={{ background: VIOLET_MESH_DARK, maskImage: VIOLET_FADE, WebkitMaskImage: VIOLET_FADE }} />
      <svg aria-hidden viewBox="0 0 1440 420" preserveAspectRatio="xMidYMin slice" className="pointer-events-none absolute inset-x-0 top-0 -z-10 hidden h-[420px] w-full md:block dark:opacity-40" style={{ maskImage: VIOLET_FADE, WebkitMaskImage: VIOLET_FADE }}>
        <defs>
          <linearGradient id="vi-sheet" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7aa8ff" stopOpacity=".55" />
            <stop offset=".6" stopColor="#b9b0ff" stopOpacity=".28" />
            <stop offset="1" stopColor="#ffffff" stopOpacity=".12" />
          </linearGradient>
          <linearGradient id="vi-ribbon" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffffff" stopOpacity=".05" />
            <stop offset=".5" stopColor="#ffffff" stopOpacity=".85" />
            <stop offset="1" stopColor="#c7bdff" stopOpacity=".25" />
          </linearGradient>
        </defs>
        <path d="M-40 150 C 180 140 330 60 560 -30 L 610 -30 C 380 90 220 190 -40 215 Z" fill="url(#vi-ribbon)" />
        <path d="M-40 215 C 220 190 380 90 610 -30" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1.5" />
        <path d="M960 330 C 1030 190 1110 70 1165 40 C 1250 80 1370 160 1480 250 L 1480 330 Z" fill="url(#vi-sheet)" />
        <path d="M1165 40 C 1250 80 1370 160 1480 250" fill="none" stroke="#fff" strokeOpacity=".85" strokeWidth="2" />
        <path d="M1165 40 C 1100 90 1030 190 975 300" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1.5" />
      </svg>
    </>
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

export type HeroTone = 'sky' | 'navy' | 'violet'

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
