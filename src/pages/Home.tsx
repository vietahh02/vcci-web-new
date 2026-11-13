import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react'
import {
  ArrowRight, Pause, Play,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCategory, useHomeProducts, useHomeRequests, useHomeStats, useHomeTrending } from '@/api'
import { CountryChip, SectionHeader } from '@/components/brand'
import { ProductCard } from '@/components/cards'
import { CountUp, LiveDot, Reveal, Stagger, StaggerItem, WordsReveal } from '@/components/effects'
import { Tabs } from '@/components/ui/overlay'
import { Pager, usePaged } from '@/components/ui/pager'
import { buttonClass } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { useProfile } from '@/lib/profile'
import { tx } from '@/lib/tx'
import { EventsAgenda, FeaturedBusiness, HomeEmpty, SponsorTiers, WhyList } from '@/pages/home/sections'
import { type ImportRequest } from '@/data/mock'
import { cn, daysLeft, formatMoney, formatNumber } from '@/lib/utils'

export default function Home() {
  return (
    <>
      <Hero />
      {/* TrustBand (legal verification / 63 provinces / B2B support / languages) hidden on home; component kept in home/sections.tsx */}
      <EventsAgenda />
      <ProductsSection />
      <FeaturedBusiness />
      <RequestsSection />
      {/* Testimonials ("Tiếng nói từ hội chợ") tạm ẩn khỏi trang chủ; component vẫn giữ trong home/sections.tsx */}
      <WhyList />
      <SponsorTiers />
      <CtaSection />
    </>
  )
}

/* ================================================================ HERO — background video (same source as the current portal banner) */
function Hero() {
  const { t, L, locale } = useI18n()
  const navigate = useNavigate()
  const ref = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(true)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -60])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  // the footage plays on arrival (product decision); the pause button stays for anyone who wants it still.
  // muted is set on the element too: React leaves the attribute off, and Chrome only autoplays muted media
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = true
    v.play().catch(() => setPlaying(false))
  }, [])

  const toggleVideo = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { void v.play(); setPlaying(true) } else { v.pause(); setPlaying(false) }
  }

  const { session } = useProfile()
  const doors = [
    { to: '/search', title: tx('Tôi muốn mua', 'I want to buy', '구매하려고 해요'), sub: tx('Tìm sản phẩm, gửi yêu cầu báo giá', 'Find products, send an RFQ', '상품 찾기, 견적 요청') },
    { to: session ? '/requests' : '/register', title: tx('Tôi muốn bán', 'I want to sell', '판매하려고 해요'), sub: tx('Nhận yêu cầu nhập khẩu, gửi báo giá', 'Get import requests, send quotes', '수입 요청 받기, 견적 보내기') },
  ]
  const st = useHomeStats().data
  const trendingKeywords = useHomeTrending().data ?? []
  const stats = [
    { to: st?.businesses ?? 0, suffix: '+', label: t.home.stats.businesses },
    { to: st?.products ?? 0, suffix: '+', label: t.home.stats.products },
    { to: st?.requests ?? 0, suffix: '+', label: t.home.stats.requests },
    { to: st?.countries ?? 0, suffix: '+', label: t.home.stats.countries },
  ].filter((s) => s.to > 0)

  return (
    <section ref={ref} className="relative isolate flex flex-col overflow-hidden bg-navy pb-12 text-white md:min-h-[calc(100svh-147px)] md:pb-16">
      <motion.div style={{ y: bgY }} className="absolute inset-0 -z-30">
        <video
          ref={videoRef}
          className="size-full animate-hero-drift object-cover"
          src="/video/car.mp4"
          poster="/video/car-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          aria-hidden
        />
      </motion.div>
      {/* scrim: dark behind the type on the left, thinning toward the empty right so the footage shows; flat on phones where text runs full width */}
      <div className="absolute inset-0 -z-20 bg-navy/65 md:bg-transparent md:bg-gradient-to-r md:from-navy/80 md:from-[22%] md:via-navy/30 md:via-[48%] md:to-transparent md:to-[75%]" />
      <div className="absolute inset-x-0 bottom-0 -z-20 h-1/3 bg-gradient-to-t from-navy/60 to-transparent" />

      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="container-page w-full pt-10 md:pt-14">
        <div className="min-w-0">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="flex items-center gap-2.5 text-sm font-semibold text-white/90 md:text-[15px]">
            <LiveDot className="text-gold-bright" /> {t.home.heroEyebrow}
          </motion.p>
          {/* each line stays on one row from sm up; the size follows the viewport so the longest line fits the column */}
          <h1 className="mt-5 text-[32px] font-extrabold leading-[1.02] tracking-[-0.035em] sm:whitespace-nowrap sm:text-[clamp(38px,5.8vw,56px)] lg:text-[clamp(44px,4.5vw,88px)]">
            <WordsReveal key={t.home.heroTitleA} text={t.home.heroTitleA} className="block" />
            <WordsReveal key={t.home.heroTitleB} text={t.home.heroTitleB} delay={0.25} className="block" />
          </h1>
          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }} className="mt-6 max-w-lg text-base leading-relaxed text-white/85 md:text-lg">
            {t.home.heroSub}
          </motion.p>
          {/* two doors, by intent: the platform serves both sides equally; the longer line is the tooltip */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="mt-8 flex flex-wrap gap-3">
            {doors.map((d, i) => (
              <Link
                key={d.to}
                to={d.to}
                className={cn(
                  'group flex min-h-[64px] min-w-[15rem] flex-1 items-center gap-4 rounded-2xl px-5 py-3 transition-[background-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:flex-none',
                  i === 0
                    ? 'bg-white text-navy shadow-[0_14px_30px_-16px_rgba(255,255,255,0.6)] hover:bg-white/95'
                    : 'bg-gradient-to-b from-[#f2d36b] to-[#d9a62a] text-[#2b1d00] shadow-[0_14px_30px_-16px_rgba(217,166,42,0.8)] hover:brightness-105',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-extrabold leading-tight">{d.title}</span>
                  <span className="mt-0.5 block text-[13px] font-medium leading-snug opacity-75">{d.sub}</span>
                </span>
                <ArrowRight className="size-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            ))}
          </motion.div>
          {trendingKeywords.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-6 flex flex-wrap items-center gap-2 text-[13px]">
              <span className="text-white/70">{t.search.trending}:</span>
              {trendingKeywords.slice(0, 5).map((k) => (
                <button key={k.en} onClick={() => navigate(`/search?q=${encodeURIComponent(L(k))}`)} className="min-h-9 rounded-full bg-white/10 px-3.5 text-white transition hover:bg-white/20 active:scale-[0.97]">
                  {L(k)}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>

      <div className="container-page mt-12 flex items-end justify-between gap-6 md:mt-auto md:pt-16">
        {/* remount once stats arrive: items mounted after the in-view trigger stay hidden */}
        <Stagger key={stats.length} className="grid flex-1 grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((s) => (
            <StaggerItem key={s.label}>
              <p className="text-3xl font-extrabold tracking-[-0.03em] tabular-nums md:text-[44px] md:leading-none">
                <CountUp to={s.to} format={(n) => formatNumber(Math.round(n), locale)} /><span className="text-gold-bright">{s.suffix}</span>
              </p>
              <p className="mt-2 text-[13px] text-white/70 md:text-sm">{s.label}</p>
            </StaggerItem>
          ))}
        </Stagger>
        <button onClick={toggleVideo} className="hidden size-11 shrink-0 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 md:grid" aria-label={playing ? t.ui.pauseVideo : t.ui.playVideo}>
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
      </div>
    </section>
  )
}

/* ================================================================ PRODUCTS */
function ProductsSection() {
  const { t } = useI18n()
  const [tab, setTab] = useState<'popular' | 'newest' | 'certified'>('popular')
  const { data: list = [], loading } = useHomeProducts(tab)

  return (
    <section className="container-page mt-24">
      <SectionHeader title={t.home.productsTitle} sub={t.home.productsSub} action={{ to: '/search', label: t.common.viewAll }} className="mb-5" />
      <Tabs
        layoutId="home-products"
        value={tab}
        onValueChange={(v) => setTab(v as typeof tab)}
        className="mb-6 max-w-full overflow-x-auto"
        items={[
          { value: 'popular', label: t.home.productTabs.popular },
          { value: 'newest', label: t.home.productTabs.newest },
          { value: 'certified', label: t.home.productTabs.certified },
        ]}
      />
      {!loading && !list.length && <HomeEmpty what="products" />}
      <motion.div layout className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-5">
        <AnimatePresence mode="popLayout">
          {/* one row only: 2 / 3 / 5 cards, matching the column count at each width */}
          {list.slice(0, 5).map((p, i) => (
            <motion.div
              key={p.id}
              layout
              className={i >= 3 ? 'hidden lg:block' : i === 2 ? 'hidden md:block' : undefined}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.035, duration: 0.45 } }}
              exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
            >
              <ProductCard product={p} className="h-full" />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}

/* ================================================================ IMPORT REQUESTS */
function RequestsSection() {
  const { t } = useI18n()
  const { data: importRequests = [], loading } = useHomeRequests()
  const { items: list, ...pager } = usePaged(importRequests)

  return (
    <section className="container-page mt-24">
      <SectionHeader title={t.home.requestsTitle} sub={t.home.requestsSub} action={{ to: '/requests', label: t.common.viewAll }} />
      <div className="relative space-y-3">
        {!loading && !importRequests.length && <HomeEmpty what="requests" />}
        <AnimatePresence mode="popLayout" initial={false}>
          {list.map((r) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, y: -24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: 'spring', bounce: 0.18, duration: 0.7 }}
            >
              <RequestRow request={r} />
            </motion.div>
          ))}
        </AnimatePresence>
        <Pager {...pager} className="pt-2" />
      </div>
    </section>
  )
}

/** One full-width row: category + title, quantity, buyer, price with time left, and an arrow that nudges on hover. */
function RequestRow({ request: r }: { request: ImportRequest }) {
  const { t, L, locale } = useI18n()
  const cat = getCategory(r.categoryId)
  const left = daysLeft(r.endTime)
  return (
    <Link
      to={`/requests/${r.id}`}
      className="group relative grid items-center gap-x-6 gap-y-2 overflow-hidden rounded-2xl border bg-card px-5 py-4 transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_-24px_rgba(0,102,153,0.45)] md:grid-cols-[minmax(0,1fr)_150px_minmax(0,220px)_150px_32px] md:px-6"
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 origin-top scale-y-0 bg-gradient-to-b from-[#1a8cc4] to-primary transition-transform duration-300 group-hover:scale-y-100" />
      <div className="min-w-0">
        <span className="inline-block rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold text-primary">{cat ? L(cat.categoryName) : r.productType}</span>
        <p className="mt-1.5 truncate text-base font-bold leading-snug transition-colors group-hover:text-primary">{L(r.requestName)}</p>
      </div>
      <p className="text-sm font-semibold md:text-[15px]">{formatNumber(r.quantity, locale)} <span className="font-normal text-muted-foreground">{r.unit}</span></p>
      <CountryChip code={r.country} label={r.organizationName} className="min-w-0 truncate" />
      <div className="md:text-right">
        <p className="text-lg font-extrabold tracking-tight">{formatMoney(r.price)}<span className="text-xs font-normal text-muted-foreground">/{r.unit}</span></p>
        <p className={cn('text-xs', left <= 7 ? 'font-semibold text-amber-600 dark:text-amber-400' : 'text-muted-foreground')}>{left} {t.common.daysLeft}</p>
      </div>
      <span className="hidden size-8 place-items-center rounded-full bg-muted text-muted-foreground transition group-hover:bg-primary group-hover:text-primary-foreground md:grid"><ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
    </Link>
  )
}

/* ================================================================ CTA */
function CtaSection() {
  const { t } = useI18n()
  return (
    <section className="container-page mt-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-navy p-8 text-white md:p-14">
          <img src="/imgs/cta-background.png" alt="" className="absolute inset-0 size-full object-cover opacity-30 mix-blend-luminosity" loading="lazy" />
          <div className="absolute inset-0 bg-navy/70" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-balance md:text-[42px] md:leading-[1.1]">
                {t.home.ctaTitle}
              </h2>
              <p className="mt-4 max-w-xl text-white/90">{t.home.ctaSub}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/register" className={buttonClass('gold', 'lg')}>{t.home.ctaPrimary} <ArrowRight /></Link>
              <Link to="/about" className={buttonClass('ghost', 'lg', 'bg-white/10 text-white hover:bg-white/20 hover:text-white')}>{t.home.ctaSecondary}</Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
