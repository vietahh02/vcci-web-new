/** Motion building blocks. All respect prefers-reduced-motion via <MotionConfig reducedMotion="user">. */
import { animate, motion, useInView, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform, type Variants } from 'motion/react'
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const ease = [0.16, 1, 0.3, 1] as const

/* ---------------------------------------------------------------- Reveal on scroll */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  as?: 'div' | 'section' | 'li'
}) {
  const Comp = motion[as]
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay, ease }}
    >
      {children}
    </Comp>
  )
}

export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease } },
}

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}>
      {children}
    </motion.div>
  )
}
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={staggerChild}>
      {children}
    </motion.div>
  )
}

/* ---------------------------------------------------------------- Word-by-word headline */
export function WordsReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(' ')
  return (
    <span className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom" aria-hidden>
          <motion.span
            className="inline-block"
            initial={{ y: '105%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: delay + i * 0.06, ease }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

/* ---------------------------------------------------------------- Count-up number */
export function CountUp({ to, duration = 2, format, className }: { to: number; duration?: number; format?: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    const controls = animate(0, to, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setVal(v) })
    return () => controls.stop()
  }, [inView, to, duration])
  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {format ? format(val) : Math.round(val).toLocaleString('vi-VN')}
    </span>
  )
}

/* ---------------------------------------------------------------- Infinite marquee */
export function Marquee({ children, duration = 40, className, reverse }: { children: ReactNode; duration?: number; className?: string; reverse?: boolean }) {
  return (
    <div className={cn('group mask-fade-x flex overflow-hidden', className)}>
      <div
        className="flex w-max shrink-0 animate-marquee gap-4 pr-4 group-hover:[animation-play-state:paused]"
        style={{ '--marquee-duration': `${duration}s`, animationDirection: reverse ? 'reverse' : 'normal' } as CSSProperties}
      >
        {children}
        {children}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- 3D tilt + glare */
export function Tilt({ children, className, max = 7 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const rx = useSpring(0, { stiffness: 200, damping: 18 })
  const ry = useSpring(0, { stiffness: 200, damping: 18 })
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const glare = useMotionTemplate`radial-gradient(420px circle at ${gx}% ${gy}%, rgb(255 255 255 / 0.22), transparent 45%)`

  function onMove(e: MouseEvent) {
    const r = ref.current!.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    ry.set((px - 0.5) * max * 2)
    rx.set(-(py - 0.5) * max * 2)
    gx.set(px * 100)
    gy.set(py * 100)
  }
  function onLeave() {
    rx.set(0)
    ry.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={cn('group/tilt relative will-change-transform', className)}
    >
      {children}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100" style={{ background: glare }} />
    </motion.div>
  )
}

/* ---------------------------------------------------------------- Cursor spotlight card */
export function Spotlight({ children, className, color = 'rgb(0 102 153 / 0.14)' }: { children: ReactNode; className?: string; color?: string }) {
  const x = useMotionValue(-300)
  const y = useMotionValue(-300)
  const bg = useMotionTemplate`radial-gradient(360px circle at ${x}px ${y}px, ${color}, transparent 70%)`
  return (
    <div
      className={cn('group relative overflow-hidden', className)}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        x.set(e.clientX - r.left)
        y.set(e.clientY - r.top)
      }}
    >
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: bg }} />
      {children}
    </div>
  )
}

/* ---------------------------------------------------------------- Countdown */
export function useCountdown(target: string) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const diff = Math.max(0, new Date(target).getTime() - now)
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff / 3_600_000) % 24),
    m: Math.floor((diff / 60_000) % 60),
    s: Math.floor((diff / 1000) % 60),
    done: diff === 0,
  }
}

export function Countdown({ target, labels, className, dark }: { target: string; labels: [string, string, string, string]; className?: string; dark?: boolean }) {
  const c = useCountdown(target)
  const parts = [c.d, c.h, c.m, c.s]
  return (
    <div className={cn('flex gap-1.5', className)}>
      {parts.map((v, i) => (
        <div key={i} className={cn('min-w-11 rounded-lg px-1.5 py-1 text-center', dark ? 'bg-white/10 text-white ring-1 ring-white/15' : 'bg-muted')}>
          <div className="relative h-5 overflow-hidden text-[15px] font-bold tabular-nums leading-5">
            <motion.div key={v} initial={{ y: -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
              {String(v).padStart(2, '0')}
            </motion.div>
          </div>
          <div className={cn('text-[10px] font-medium uppercase tracking-wide', dark ? 'text-white/60' : 'text-muted-foreground')}>{labels[i]}</div>
        </div>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- Live dot */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn('relative inline-flex size-2', className)}>
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-75" />
      <span className="relative inline-flex size-2 rounded-full bg-current" />
    </span>
  )
}

/* ---------------------------------------------------------------- Scroll progress bar */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26 })
  return <motion.div className="fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-gradient-to-r from-primary via-sky-400 to-gold-bright" style={{ scaleX }} />
}

/* ---------------------------------------------------------------- Parallax image */
export function ParallaxImage({ src, alt, className, strength = 60 }: { src: string; alt: string; className?: string; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [-strength, strength])
  return (
    <div ref={ref} className={cn('overflow-hidden', className)}>
      <motion.img src={src} alt={alt} style={{ y, scale: 1.18 }} className="size-full object-cover" />
    </div>
  )
}

/* ---------------------------------------------------------------- Image with fade-in + skeleton */
export function SmartImage({ src, alt, className, imgClassName }: { src: string; alt: string; className?: string; imgClassName?: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className={cn('relative overflow-hidden bg-muted', !loaded && 'skeleton', className)}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn('size-full object-cover transition-[opacity,transform,filter] duration-700', loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-md', imgClassName)}
      />
    </div>
  )
}
