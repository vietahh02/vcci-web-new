import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react'
import {
  ArrowRight, ChevronRight, FilePlus2, Pause, Play, Send, UserRound,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useEvents, useHomeProducts, useHomeRequests, useHomeStats, useHomeTrending } from '@/api'
import { categories } from '@/data/mock'
import { categoryIcons, CountryChip, SectionHeader } from '@/components/brand'
import { ProductCard, RequestCard } from '@/components/cards'
import { CountUp, LiveDot, Reveal, Stagger, StaggerItem, WordsReveal } from '@/components/effects'
import { SearchBar } from '@/components/layout/SearchBar'
import { Tabs } from '@/components/ui/overlay'
import { Pager, usePaged } from '@/components/ui/pager'
import { Badge, Button, buttonClass, Input } from '@/components/ui/primitives'
import { Select } from '@/components/ui/select'
import { isOnAir } from '@/lib/eventStatus'
import { useI18n } from '@/lib/i18n'
import { useProfile } from '@/lib/profile'
import { tx } from '@/lib/tx'
import { CategoryTiles, EventsAgenda, FeaturedBusiness, SponsorTiers, Testimonials, WhyList } from '@/pages/home/sections'
import { formatNumber, img } from '@/lib/utils'

export default function Home() {
  return (
    <>
      <Hero />
      <SourcingDock />
      {/* TrustBand (legal verification / 63 provinces / B2B support / languages) hidden on home; component kept in home/sections.tsx */}
      <CategoryTiles />
      <ProductsSection />
      <FeaturedBusiness />
      <RequestsSection />
      <EventsAgenda />
      <Testimonials />
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
    <section ref={ref} className="relative isolate overflow-hidden bg-navy pb-[136px] text-white md:pb-[152px]">
      <motion.div style={{ y: bgY }} className="absolute inset-0 -z-30">
        <video
          ref={videoRef}
          className="size-full scale-105 object-cover"
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
      {/* flat neutral scrim: the footage stays visible, the type stays readable */}
      <div className="absolute inset-0 -z-20 bg-navy/75" />

      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="container-page pt-10 md:pt-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-bright md:text-sm">{t.home.heroEyebrow}</p>
            {/* each line stays on one row from sm up; the size follows the viewport so the longest line fits the column */}
            <h1 className="mt-3 text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] sm:whitespace-nowrap sm:text-[clamp(36px,5.6vw,52px)] lg:text-[clamp(36px,3.9vw,76px)]">
              <WordsReveal key={t.home.heroTitleA} text={t.home.heroTitleA} className="block" />
              <WordsReveal key={t.home.heroTitleB} text={t.home.heroTitleB} delay={0.25} className="block text-gold-bright" />
            </h1>
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }} className="mt-5 max-w-2xl text-base leading-relaxed text-white/90 md:text-lg">
              {t.home.heroSub}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="mt-8 max-w-3xl">
              <SearchBar size="lg" autoFocusKey />
            </motion.div>
            {trendingKeywords.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-4 flex flex-wrap items-center gap-2 text-[13px]">
                <span className="text-white/70">{t.search.trending}:</span>
                {trendingKeywords.slice(0, 5).map((k) => (
                  <button key={k.en} onClick={() => navigate(`/search?q=${encodeURIComponent(L(k))}`)} className="min-h-9 rounded-full bg-white/10 px-3.5 text-white transition hover:bg-white/20 active:scale-[0.97]">
                    {L(k)}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
          {/* two doors, by intent: the platform serves both sides equally */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {doors.map((d) => (
              <Link key={d.to} to={d.to} className="group flex items-center justify-between gap-4 rounded-2xl bg-white/10 px-5 py-4 transition hover:bg-white hover:text-navy active:scale-[0.99]">
                <span>
                  <span className="block text-lg font-bold">{d.title}</span>
                  <span className="block text-sm text-white/80 group-hover:text-navy/70">{d.sub}</span>
                </span>
                <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <div className="container-page mt-12 flex items-end justify-between gap-6 md:mt-16">
        {/* remount once stats arrive: items mounted after the in-view trigger stay hidden */}
        <Stagger key={stats.length} className="grid flex-1 grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((s) => (
            <StaggerItem key={s.label}>
              <p className="text-2xl font-extrabold tracking-tight md:text-[34px]">
                <CountUp to={s.to} format={(n) => formatNumber(Math.round(n), locale) + s.suffix} />
              </p>
              <p className="mt-0.5 text-[13px] text-white/75 md:text-sm">{s.label}</p>
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

/* ================================================================ SOURCING DOCK (GS-style 3-column) */
function SourcingDock() {
  const { t, L } = useI18n()
  const { session } = useProfile()
  const navigate = useNavigate()
  const slides = (useEvents().data ?? []).filter((e) => e.eventStatus !== 'ENDED').slice(0, 3)
  const [slide, setSlide] = useState(0)
  const [need, setNeed] = useState('')
  const [qty, setQty] = useState('')

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % Math.max(slides.length, 1)), 5200)
    return () => clearInterval(id)
  }, [slides.length])
  const ev = slides[slide]

  return (
    <section className="container-page relative z-10 -mt-[96px] md:-mt-[104px]">
      <Reveal className={`relative grid gap-4 rounded-3xl bg-card p-3 ${categories.length ? 'lg:grid-cols-[250px_1fr_310px]' : 'lg:grid-cols-[1fr_310px]'}`}>
        {/* round the hero's inner bottom corners beside the card (hero bottom = card top + 104px); only where the gutter fits both radii */}
        <span aria-hidden className="pointer-events-none absolute -left-6 top-[80px] hidden size-6 bg-[radial-gradient(circle_at_0_0,transparent_24px,var(--background)_24.5px)] min-[1520px]:block" />
        <span aria-hidden className="pointer-events-none absolute -right-6 top-[80px] hidden size-6 bg-[radial-gradient(circle_at_100%_0,transparent_24px,var(--background)_24.5px)] min-[1520px]:block" />
        {/* categories rail */}
        {categories.length > 0 && <div className="hidden rounded-2xl bg-muted/50 p-2 lg:block">
          <h2 className="px-3 pb-1.5 pt-2 text-sm font-bold">{t.home.dock.categories}</h2>
          <ul>
            {categories.map((c) => {
              const Icon = categoryIcons[c.icon]
              return (
                <li key={c.id}>
                  <Link to={`/search?category=${c.id}`} className="group flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] font-medium text-foreground/85 transition hover:bg-background hover:text-primary">
                    <Icon className="size-4 text-muted-foreground transition group-hover:text-primary" />
                    <span className="flex-1 truncate">{L(c.categoryName)}</span>
                    <ChevronRight className="size-3.5 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>}

        {/* promo carousel */}
        <div className="relative min-h-[300px] overflow-hidden rounded-2xl bg-navy text-white">
          {ev && <AnimatePresence mode="popLayout" initial={false}>
            <motion.img
              key={ev.id}
              src={img(ev.coverImage, 1100, 640)}
              alt=""
              initial={{ opacity: 0, scale: 1.12 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 size-full object-cover"
            />
          </AnimatePresence>}
          <div className="absolute inset-0 bg-navy/60" />
          <div className="relative flex h-full flex-col justify-end p-6 md:p-8">
            {ev && <AnimatePresence mode="wait">
              <motion.div key={ev.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.45 }}>
                <div className="flex gap-2">
                  {ev.eventStatus === 'ONGOING' ? (
                    <Badge variant="live" className="gap-1.5"><LiveDot /> {isOnAir(ev) ? t.events.live : t.events.status.ONGOING}</Badge>
                  ) : (
                    <Badge variant="gold">{t.home.dock.promoTag}</Badge>
                  )}
                  <Badge variant="outline" className="border-white/25 text-white">{t.events.type[ev.eventType]}</Badge>
                </div>
                <h3 className="mt-3 max-w-lg text-xl font-extrabold leading-tight md:text-[26px]">{L(ev.title)}</h3>
                <p className="mt-2 line-clamp-2 max-w-md text-sm text-white/70">{L(ev.introduction)}</p>
                {/* the live room is for webinars and livestreams; a Show's sessions are on its own page */}
                <Link to={ev.eventStatus === 'ONGOING' && ev.eventType !== 'SHOW' ? `/live/${ev.id}` : `/events/${ev.id}`} className={buttonClass('white', 'md', 'mt-5')}>
                  {ev.eventStatus !== 'ONGOING' ? t.events.register : ev.eventType === 'SHOW' ? t.common.viewDetail : t.events.watchNow} <ArrowRight />
                </Link>
              </motion.div>
            </AnimatePresence>}
            <div className="mt-6 flex gap-1.5">
              {slides.map((s, k) => (
                <button key={s.id} onClick={() => setSlide(k)} className="relative h-1 w-10 overflow-hidden rounded-full bg-white/25" aria-label={`Slide ${k + 1}`}>
                  {k === slide && <motion.span key={slide} className="absolute inset-y-0 left-0 bg-gold-bright" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 5.2, ease: 'linear' }} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* account + quick RFQ */}
        <div className="flex flex-col gap-3">
          {!session && <div className="rounded-2xl bg-primary-soft p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary"><UserRound className="size-5" /></div>
              <div>
                <p className="text-sm font-bold">{t.home.dock.welcome}</p>
                <p className="text-xs text-muted-foreground">{t.brand.tagline}</p>
              </div>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-foreground/80">{t.home.dock.welcomeSub}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link to="/login" className={buttonClass('outline', 'sm', 'h-9')}>{t.nav.login}</Link>
              <Link to="/register" className={buttonClass('default', 'sm', 'h-9')}>{t.nav.register}</Link>
            </div>
          </div>}
          <form
            className="flex-1 rounded-2xl bg-muted/60 p-4"
            onSubmit={(e) => {
              e.preventDefault()
              // the real post (and its required fields) happens on the RFQ form: this block only pre-fills it
              const unit = String(new FormData(e.currentTarget).get('unit') ?? '')
              navigate(`/requests?${new URLSearchParams({ post: '1', need, qty, unit })}`)
            }}
          >
            <h2 className="flex items-center gap-2 text-sm font-bold"><FilePlus2 className="size-4 text-gold" /> {t.home.dock.quickRfq}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t.home.dock.quickRfqSub}</p>
            <Input className="mt-3 h-9" placeholder={t.home.dock.whatNeed} value={need} onChange={(e) => setNeed(e.target.value)} aria-label={t.home.dock.whatNeed} />
            <div className="mt-2 grid grid-cols-[1fr_90px] gap-2">
              <Input className="h-9" type="number" min={1} placeholder={t.home.dock.qty} value={qty} onChange={(e) => setQty(e.target.value)} aria-label={t.home.dock.qty} />
              <Select className="h-9" name="unit" aria-label={t.common.unit} defaultValue="MT" options={['MT', 'kg', 'pcs', 'set'].map((u) => ({ value: u, label: u }))} />
            </div>
            <Button type="submit" variant="gold" size="sm" className="mt-3 h-9 w-full">
              <Send /> {t.home.dock.sendRfq}
            </Button>
          </form>
        </div>
      </Reveal>
    </section>
  )
}

/* ================================================================ PRODUCTS */
function ProductsSection() {
  const { t } = useI18n()
  const [tab, setTab] = useState<'popular' | 'newest' | 'certified'>('popular')
  const list = useHomeProducts(tab).data ?? []

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
      <motion.div layout className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-5">
        <AnimatePresence mode="popLayout">
          {list.map((p, i) => (
            <motion.div
              key={p.id}
              layout
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
  const { t, L } = useI18n()
  const importRequests = useHomeRequests().data ?? []
  const { items: list, ...pager } = usePaged(importRequests)

  return (
    <section className="container-page mt-24">
      <SectionHeader title={t.home.requestsTitle} sub={t.home.requestsSub} action={{ to: '/requests', label: t.common.viewAll }} />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="relative space-y-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {list.map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: -30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.97 }}
                transition={{ type: 'spring', bounce: 0.18, duration: 0.7 }}
                className="relative"
              >
                <RequestCard request={r} />
              </motion.div>
            ))}
          </AnimatePresence>
          <Pager {...pager} className="pt-2" />
        </div>
        <Reveal className="relative overflow-hidden rounded-2xl bg-navy p-6 text-white md:p-7">
          <div className="relative">
            <h3 className="text-2xl font-extrabold tracking-tight">{t.home.howItWorks}</h3>
            <ol className="relative mt-6 space-y-6">
              {t.home.steps.map((s, i) => (
                <motion.li
                  key={s.t}
                  initial={{ opacity: 0, x: -14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.12, duration: 0.5 }}
                  className="relative flex gap-4"
                >
                  <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-navy text-sm font-extrabold ring-2 ring-gold-bright/70">{i + 1}</span>
                  <div>
                    <p className="font-bold">{s.t}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-white/80">{s.d}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
            <div className="mt-7 flex flex-wrap gap-2">
              <Link to="/requests" className={buttonClass('gold', 'md')}>{t.requests.sendQuote} <ArrowRight /></Link>
              <Link to="/requests?post=1" className={buttonClass('ghost', 'md', 'text-white hover:bg-white/10')}>{t.nav.postRequest}</Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-4 gap-y-2">
              {importRequests.slice(0, 5).map((r) => (
                <CountryChip key={r.id} code={r.country} label={L(r.countryName)} className="text-white/70 [&>span:first-child]:bg-white/10 [&>span:first-child]:text-white [&>span:first-child]:ring-white/15" />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
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
              <Link to="/about" className={buttonClass('ghost', 'lg', 'bg-white/10 text-white hover:bg-white/20')}>{t.home.ctaSecondary}</Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
