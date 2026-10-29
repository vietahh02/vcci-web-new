import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react'
import {
  ArrowRight, ChevronRight, FilePlus2, Pause, Play, Send, UserRound,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { categories, events, importRequests, products, trendingKeywords } from '@/data/mock'
import { categoryIcons, CountryChip, SectionHeader } from '@/components/brand'
import { ProductCard, RequestCard } from '@/components/cards'
import { CountUp, LiveDot, Reveal, Stagger, StaggerItem, WordsReveal } from '@/components/effects'
import { SearchBar } from '@/components/layout/SearchBar'
import { Tabs, useToast } from '@/components/ui/overlay'
import { Badge, Button, buttonClass, Input, Select } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { CategoryTiles, EventsAgenda, FeaturedBusiness, SponsorTiers, Testimonials, TrustBand, WhyList } from '@/pages/home/sections'
import { formatNumber, img } from '@/lib/utils'

export default function Home() {
  return (
    <>
      <Hero />
      <SourcingDock />
      <TrustBand />
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

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      videoRef.current?.pause()
      setPlaying(false)
    }
  }, [])

  const toggleVideo = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { void v.play(); setPlaying(true) } else { v.pause(); setPlaying(false) }
  }

  const stats = [
    { to: 12400, suffix: '+', label: t.home.stats.businesses },
    { to: 58000, suffix: '+', label: t.home.stats.products },
    { to: 1200, suffix: '+', label: t.home.stats.requests },
    { to: 40, suffix: '+', label: t.home.stats.countries },
  ]

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-navy pb-28 text-white md:pb-36">
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
          aria-hidden
        />
      </motion.div>
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(100deg,#08082e_0%,rgb(8_8_46/0.88)_40%,rgb(0_40_70/0.45)_75%,rgb(8_8_46/0.3)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-20 h-48 bg-gradient-to-t from-navy to-transparent" />

      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="container-page pt-16 md:pt-24">
        <div className="max-w-3xl">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-[13px] font-semibold uppercase tracking-[0.18em] text-gold-bright">
            {t.home.eyebrow}
          </motion.p>
          <h1 className="mt-4 text-[34px] font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[64px]">
            <WordsReveal key={t.home.heroTitleA} text={t.home.heroTitleA} className="block" />
            <WordsReveal key={t.home.heroTitleB} text={t.home.heroTitleB} className="text-gold-gradient block" delay={0.25} />
          </h1>
          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.55 }} className="mt-5 max-w-2xl text-[15px] leading-relaxed text-white/75 md:text-lg">
            {t.home.heroSub}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.7 }} className="mt-8">
            <SearchBar size="lg" autoFocusKey />
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.95 }} className="mt-4 flex flex-wrap items-center gap-2 text-[13px]">
            <span className="text-white/55">{t.search.trending}:</span>
            {trendingKeywords.slice(0, 5).map((k) => (
              <button key={k.en} onClick={() => navigate(`/search?q=${encodeURIComponent(L(k))}`)} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-white/85 backdrop-blur transition hover:border-gold-bright/60 hover:text-white">
                {L(k)}
              </button>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <div className="container-page mt-14 flex items-end justify-between gap-6 md:mt-20">
        <Stagger className="grid flex-1 grid-cols-2 gap-6 border-t border-white/15 pt-6 lg:grid-cols-4">
          {stats.map((s) => (
            <StaggerItem key={s.label}>
              <p className="text-2xl font-extrabold tracking-tight md:text-[34px]">
                <CountUp to={s.to} format={(n) => formatNumber(Math.round(n), locale) + s.suffix} />
              </p>
              <p className="mt-0.5 text-xs text-white/60 md:text-[13px]">{s.label}</p>
            </StaggerItem>
          ))}
        </Stagger>
        <button onClick={toggleVideo} className="hidden size-11 shrink-0 place-items-center rounded-full border border-white/25 bg-white/10 backdrop-blur transition hover:bg-white/20 md:grid" aria-label={playing ? t.ui.pauseVideo : t.ui.playVideo}>
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
      </div>
    </section>
  )
}

/* ================================================================ SOURCING DOCK (GS-style 3-column) */
function SourcingDock() {
  const { t, L } = useI18n()
  const navigate = useNavigate()
  const toast = useToast()
  const slides = events.filter((e) => e.eventStatus !== 'ENDED').slice(0, 3)
  const [slide, setSlide] = useState(0)
  const [need, setNeed] = useState('')
  const [qty, setQty] = useState('')

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % slides.length), 5200)
    return () => clearInterval(id)
  }, [slides.length])
  const ev = slides[slide]!

  return (
    <section className="container-page relative z-10 -mt-20 md:-mt-24">
      <Reveal className="grid gap-4 rounded-3xl border bg-card p-3 shadow-2xl shadow-navy/12 lg:grid-cols-[250px_1fr_310px]">
        {/* categories rail */}
        <div className="hidden rounded-2xl bg-muted/50 p-2 lg:block">
          <p className="px-3 pb-1.5 pt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.home.dock.categories}</p>
          <ul>
            {categories.map((c) => {
              const Icon = categoryIcons[c.icon]
              return (
                <li key={c.id}>
                  <Link to={`/search?category=${c.id}`} className="group flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] font-medium text-foreground/85 transition hover:bg-background hover:text-primary hover:shadow-sm">
                    <Icon className="size-4 text-muted-foreground transition group-hover:text-primary" />
                    <span className="flex-1 truncate">{L(c.categoryName)}</span>
                    <ChevronRight className="size-3.5 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* promo carousel */}
        <div className="relative min-h-[300px] overflow-hidden rounded-2xl bg-navy text-white">
          <AnimatePresence mode="popLayout" initial={false}>
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
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/75 to-transparent" />
          <div className="relative flex h-full flex-col justify-end p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div key={ev.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.45 }}>
                <div className="flex gap-2">
                  {ev.eventStatus === 'ONGOING' ? (
                    <Badge variant="live" className="gap-1.5"><LiveDot /> {t.events.live}</Badge>
                  ) : (
                    <Badge variant="gold">{t.home.dock.promoTag}</Badge>
                  )}
                  <Badge variant="outline" className="border-white/25 text-white">{t.events.type[ev.eventType]}</Badge>
                </div>
                <h3 className="mt-3 max-w-lg text-xl font-extrabold leading-tight md:text-[26px]">{L(ev.title)}</h3>
                <p className="mt-2 line-clamp-2 max-w-md text-sm text-white/70">{L(ev.introduction)}</p>
                <Link to={ev.eventStatus === 'ONGOING' ? `/live/${ev.id}` : `/events/${ev.id}`} className={buttonClass('white', 'md', 'mt-5')}>
                  {ev.eventStatus === 'ONGOING' ? t.events.watchNow : t.events.register} <ArrowRight />
                </Link>
              </motion.div>
            </AnimatePresence>
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
          <div className="rounded-2xl border bg-gradient-to-br from-primary-soft to-background p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary"><UserRound className="size-5" /></div>
              <div>
                <p className="text-sm font-bold">{t.home.dock.welcome}</p>
                <p className="text-xs text-muted-foreground">{t.brand.tagline}</p>
              </div>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">{t.home.dock.welcomeSub}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link to="/login" className={buttonClass('outline', 'sm', 'h-9')}>{t.nav.login}</Link>
              <Link to="/register" className={buttonClass('default', 'sm', 'h-9')}>{t.nav.register}</Link>
            </div>
          </div>
          <form
            className="flex-1 rounded-2xl border p-4"
            onSubmit={(e) => {
              e.preventDefault()
              toast({ kind: 'success', title: t.requests.posted, description: need || undefined })
              navigate('/requests?post=1')
            }}
          >
            <p className="flex items-center gap-2 text-sm font-bold"><FilePlus2 className="size-4 text-gold" /> {t.home.dock.quickRfq}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.home.dock.quickRfqSub}</p>
            <Input className="mt-3 h-9" placeholder={t.home.dock.whatNeed} value={need} onChange={(e) => setNeed(e.target.value)} aria-label={t.home.dock.whatNeed} />
            <div className="mt-2 grid grid-cols-[1fr_90px] gap-2">
              <Input className="h-9" type="number" min={1} placeholder={t.home.dock.qty} value={qty} onChange={(e) => setQty(e.target.value)} aria-label={t.home.dock.qty} />
              <Select className="h-9" aria-label={t.common.unit} defaultValue="MT">
                <option>MT</option><option>kg</option><option>pcs</option><option>set</option>
              </Select>
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
  const list = useMemo(() => {
    if (tab === 'newest') return [...products].sort((a, b) => b.createdDate.localeCompare(a.createdDate)).slice(0, 10)
    if (tab === 'certified') return products.filter((p) => p.certificates.length >= 3).slice(0, 10)
    return [...products].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10)
  }, [tab])

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
  const [offset, setOffset] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setOffset((o) => (o + 1) % importRequests.length), 6000)
    return () => clearInterval(id)
  }, [])
  const list = [0, 1, 2, 3].map((k) => importRequests[(offset + k) % importRequests.length]!)

  return (
    <section className="container-page mt-24">
      <SectionHeader title={t.home.requestsTitle} sub={t.home.requestsSub} action={{ to: '/requests', label: t.common.viewAll }} />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="relative space-y-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {list.map((r, k) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: -30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.97 }}
                transition={{ type: 'spring', bounce: 0.18, duration: 0.7 }}
                className="relative"
              >
                {k === 0 && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute -left-2 -top-2 z-10 rounded-md bg-gold-bright px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-[#2b1d00] shadow"
                  >
                    New
                  </motion.span>
                )}
                <RequestCard request={r} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <Reveal className="relative overflow-hidden rounded-2xl bg-navy p-6 text-white md:p-7">
          <div className="absolute -right-16 -top-16 size-56 rounded-full bg-primary/40 blur-3xl" />
          <div className="bg-grid absolute inset-0 opacity-40" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-bright">{t.home.howItWorks}</p>
            <ol className="relative mt-6 space-y-6">
              <span className="absolute bottom-3 left-[17px] top-3 w-px bg-gradient-to-b from-gold-bright via-primary to-transparent" />
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
                    <p className="mt-0.5 text-[13px] leading-relaxed text-white/65">{s.d}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
            <div className="mt-7 flex flex-wrap gap-2">
              <Link to="/requests" className={buttonClass('gold', 'md')}>{t.requests.sendQuote} <ArrowRight /></Link>
              <Link to="/requests?post=1" className={buttonClass('ghost', 'md', 'text-white hover:bg-white/10')}>{t.nav.postRequest}</Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/10 pt-5">
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
        <div className="border-spin relative overflow-hidden rounded-3xl bg-navy p-8 text-white md:p-14">
          <img src="/imgs/cta-background.png" alt="" className="absolute inset-0 size-full object-cover opacity-25 mix-blend-luminosity" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-[#003a5c]/70" />
          <div className="absolute -bottom-24 right-10 size-80 animate-aurora rounded-full bg-gold-bright/25 blur-3xl" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight text-balance md:text-[42px] md:leading-[1.1]">
                {t.home.ctaTitle}
              </h2>
              <p className="mt-4 max-w-xl text-white/75">{t.home.ctaSub}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/register" className={buttonClass('gold', 'lg')}>{t.home.ctaPrimary} <ArrowRight /></Link>
              <Link to="/about" className={buttonClass('ghost', 'lg', 'border border-white/20 text-white hover:bg-white/10')}>{t.home.ctaSecondary}</Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
