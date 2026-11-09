/** Home sections added in the "less monotonous" pass: varied rhythm, fewer image frames. */
import { motion, MotionConfig } from 'motion/react'
import {
  ArrowRight, ArrowUpRight, Bot, CalendarDays, ChevronLeft, ChevronRight, Clock, Globe2, Handshake,
  Landmark, MessagesSquare, Quote, Radio, ShieldCheck, Star, Ticket, Video,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useEvents, useFeaturedBusinesses, useHomeStats, useHomeTestimonials, useOrgProducts } from '@/api'
import { categories, countryName } from '@/data/mock'
import { categoryIcons, SectionHeader, VerifiedBadge } from '@/components/brand'
import { ReputationStars } from '@/components/reputation/Reputation'
import { EventCard } from '@/components/cards'
import { CountUp, Marquee, Reveal, Stagger, StaggerItem } from '@/components/effects'
import { goldSponsors, mainSponsor, partnerSponsors } from '@/components/sponsor'
import { Pager, usePaged } from '@/components/ui/pager'
import { buttonClass } from '@/components/ui/primitives'
import { eventTimeRange } from '@/lib/eventStatus'
import { useI18n } from '@/lib/i18n'
import { cn, formatDate, formatMoney, formatNumber, img } from '@/lib/utils'

/* ================================================================ TRUST BAND — no boxes */
export function TrustBand() {
  const { t, L } = useI18n()
  const icons = [ShieldCheck, Landmark, Handshake, Globe2]
  const markets = ['DE', 'JP', 'KR', 'US', 'AU', 'SE', 'FR', 'CA', 'SG', 'AE', 'NL', 'IN']
  return (
    <section className="container-page mt-12">
      <Stagger className="grid grid-cols-2 gap-y-6 lg:grid-cols-4 lg:divide-x">
        {t.home.trust.map((it, i) => {
          const Icon = icons[i]!
          return (
            <StaggerItem key={it.title} className="flex items-start gap-3 lg:px-6 lg:first:pl-0">
              <Icon className="mt-0.5 size-6 shrink-0 text-gold" strokeWidth={1.75} />
              <div>
                <p className="text-[15px] font-bold">{it.title}</p>
                <p className="text-[13px] text-muted-foreground">{it.desc}</p>
              </div>
            </StaggerItem>
          )
        })}
      </Stagger>
      <div className="mt-8 flex items-center gap-4 border-y py-3">
        <p className="hidden shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:block">{t.home.trustLine}</p>
        <Marquee duration={30} className="flex-1">
          {markets.map((m) => (
            <span key={m} className="inline-flex shrink-0 items-center gap-2 px-3 text-sm font-semibold text-foreground/70">
              {/* Ảnh thay vì emoji cờ vì Windows chỉ hiện emoji cờ thành hai chữ cái */}
              <img src={`https://flagcdn.com/${m.toLowerCase()}.svg`} alt="" width={24} height={16} className="h-4 w-6 rounded-sm object-cover ring-1 ring-border" />
              {countryName[m] ? L(countryName[m]) : m}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  )
}

/* ================================================================ CATEGORIES — icon tiles, split layout */
export function CategoryTiles() {
  const { t, L, locale } = useI18n()
  const productTotal = useHomeStats().data?.products ?? 0
  if (!categories.length) return null
  return (
    <section className="container-page mt-20 grid grid-cols-1 gap-10 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-center">
      <Reveal>
        <h2 className="text-3xl font-extrabold tracking-tight text-balance md:text-[38px] md:leading-[1.1]">{t.home.categoriesTitle}</h2>
        <p className="mt-3 text-muted-foreground">{t.home.categoriesSub}</p>
        <p className="mt-6 text-5xl font-extrabold tracking-tight text-primary">
          <CountUp to={productTotal} format={(n) => formatNumber(Math.round(n), locale) + '+'} />
        </p>
        <p className="text-sm text-muted-foreground">{t.home.stats.products}</p>
        <Link to="/search" className={buttonClass('outline', 'md', 'mt-6 rounded-full')}>{t.common.viewAll} <ArrowRight /></Link>
      </Reveal>
      <Stagger className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
        {categories.map((c) => {
          const Icon = categoryIcons[c.icon]
          return (
            <StaggerItem key={c.id}>
              <Link
                to={`/search?category=${c.id}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-muted/60 p-4 transition-colors duration-300 hover:bg-primary"
              >
                <span className="relative grid size-11 place-items-center rounded-xl bg-background text-primary transition-transform duration-300 group-hover:scale-110">
                  <Icon className="size-5" />
                </span>
                <span className="relative mt-4 text-[14px] font-bold leading-snug transition-colors group-hover:text-white">{L(c.categoryName)}</span>
                <span className="relative mt-1 flex items-center gap-1 text-[13px] text-muted-foreground transition-colors group-hover:text-white/85">
                  {formatNumber(c.productCount, locale)} {t.nav.products_count}
                  <ArrowRight className="size-3.5 -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </span>
              </Link>
            </StaggerItem>
          )
        })}
      </Stagger>
    </section>
  )
}

/* ================================================================ FEATURED BUSINESSES — honour roll of wide photo panels */
export function FeaturedBusiness() {
  const { t, L } = useI18n()
  const list = (useFeaturedBusinesses().data ?? []).slice(0, 5)
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused || list.length < 2) return
    const id = setInterval(() => setI((v) => (v + 1) % list.length), 7000)
    return () => clearInterval(id)
  }, [paused, list.length, i])
  // hover intent: a mouse sweeping across the row should not open every panel it crosses
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const hoverOpen = (k: number) => {
    clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setI(k), 140)
  }
  useEffect(() => () => clearTimeout(hoverTimer.current), [])
  const active = list[i % Math.max(list.length, 1)]
  const items = useOrgProducts(active?.id ?? '').data ?? []
  if (!active) return null
  const ease = 'ease-[cubic-bezier(0.65,0,0.35,1)]'

  return (
    <section
      className="motion-keep relative mt-24 bg-navy py-20 text-white md:py-24"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="container-page">
        <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-extrabold tracking-[-0.02em] md:text-[44px] md:leading-[1.05]">{t.home.featuredTitle}</h2>
            <p className="mt-3 text-base text-white/75">{t.home.featuredSub}</p>
          </div>
          <Link to="/suppliers" className="group inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-gold-bright">
            {t.supplier.directoryTitle}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>

        {/* --open: the active panel's final width, so its copy is laid out once and never reflows while the panel grows */}
        <div
          className="flex flex-col gap-2 @container lg:h-[560px] lg:flex-row lg:gap-3"
          style={{ '--open': `calc((100cqw - ${(list.length - 1) * 12}px) * 5.5 / ${list.length + 4.5})` } as React.CSSProperties}
          onMouseLeave={() => clearTimeout(hoverTimer.current)}
        >
          {list.map((b, k) => {
            const on = k === i
            const country = countryName[b.country] ? L(countryName[b.country]) : b.country
            const flag = `https://flagcdn.com/${b.country.toLowerCase()}.svg`
            // staggered entrance for the open panel's lines; `off` is any extra resting transform (e.g. a tilt)
            const rise = (n: number, cls: string, off = '') => ({
              className: cn(cls, 'transition-[opacity,translate,rotate]', ease, on ? 'translate-y-0 rotate-0 opacity-100 duration-[800ms]' : cn('translate-y-6 opacity-0 duration-200', off)),
              style: { transitionDelay: on ? `${500 + n * 90}ms` : '0ms' },
            })
            return (
              <article
                key={b.id}
                onPointerEnter={(e) => e.pointerType === 'mouse' && !on && hoverOpen(k)}
                onPointerLeave={() => clearTimeout(hoverTimer.current)}
                className={cn(
                  'group relative overflow-hidden rounded-3xl bg-navy-2 transition-[flex-grow,height] duration-[1100ms]',
                  ease,
                  on ? 'h-[480px] lg:h-auto lg:flex-[5.5]' : 'h-20 lg:h-auto lg:flex-1',
                )}
              >
                <img
                  src={img(b.coverImage, 1200, 900)}
                  alt=""
                  loading="lazy"
                  className={cn(
                    'absolute inset-0 size-full object-cover transition-[scale,opacity] duration-[1600ms]',
                    ease,
                    on ? 'scale-100 opacity-100' : 'scale-125 opacity-45 group-hover:scale-115 group-hover:opacity-70',
                  )}
                />
                {/* neutral scrims so the white type reads on any photograph; crossfaded, since gradients cannot transition */}
                <div className={cn('absolute inset-0 bg-navy/55 transition-opacity duration-[900ms]', ease, on && 'opacity-0')} />
                <div className={cn('absolute inset-0 bg-[linear-gradient(to_top,rgb(8_8_46/0.92)_0%,rgb(8_8_46/0.55)_45%,rgb(8_8_46/0.1)_100%)] transition-opacity duration-[900ms]', ease, !on && 'opacity-0')} />

                <button
                  type="button"
                  onClick={() => setI(k)}
                  aria-label={b.name}
                  aria-hidden={on || undefined}
                  tabIndex={on ? -1 : 0}
                  className={cn('absolute inset-0 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-gold-bright', on && 'pointer-events-none')}
                >
                  {/* the name lies on its side in a closed panel and swings level as the panel opens (desktop) */}
                  <span
                    className={cn(
                      'absolute left-5 top-1/2 flex -translate-y-1/2 items-center gap-3 whitespace-nowrap transition-[rotate,opacity,translate] lg:top-auto lg:bottom-6 lg:left-[calc(50%+14px)] lg:origin-bottom-left lg:translate-y-0',
                      ease,
                      on ? 'opacity-0 duration-700 lg:translate-x-4 lg:rotate-0' : 'opacity-100 delay-200 duration-[1000ms] lg:-rotate-90',
                    )}
                  >
                    <img src={flag} alt="" width={28} height={20} className="h-5 w-7 shrink-0 rounded-[3px] object-cover lg:rotate-90" />
                    <span className="max-w-[60vw] truncate text-base font-bold lg:max-w-[440px]">{b.name}</span>
                  </span>
                </button>

                {/* always mounted: each line drops out fast on close and rises in turn once the panel has mostly opened */}
                <div inert={!on} className="absolute inset-y-0 left-0 flex w-full flex-col justify-between p-6 md:p-9 lg:w-(--open)">
                    <p {...rise(0, 'flex items-center gap-2.5 text-[15px] font-semibold')}>
                      <img src={flag} alt="" width={28} height={20} className="h-5 w-7 rounded-[3px] object-cover" />
                      {b.province && b.province !== country ? `${b.province}, ${country}` : country}
                    </p>

                    <div className="max-w-2xl">
                      <div {...rise(1, 'flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/85')}>
                        <span>{t.supplier.types[b.businessType]}</span>
                        {b.verified && <VerifiedBadge />}
                        <ReputationStars orgId={b.id} legacyScore={b.reputationScore} dark />
                      </div>
                      <h3 {...rise(2, 'mt-3 origin-bottom-left text-[28px] font-extrabold leading-[1.05] tracking-[-0.02em] text-balance md:text-[44px]', '-rotate-3')}>
                        <Link to={`/suppliers/${b.id}`} className="hover:underline hover:decoration-2 hover:underline-offset-4">{b.name}</Link>
                      </h3>
                      <p {...rise(3, 'mt-3 line-clamp-3 text-base leading-relaxed text-white/90 md:line-clamp-2')}>{L(b.description)}</p>
                      {on && items.length > 0 && (
                        <ul {...rise(4, 'mt-4 hidden flex-wrap gap-2 md:flex')}>
                          {items.slice(0, 3).map((p) => (
                            <li key={p.id}>
                              <Link to={`/products/${p.id}`} className="inline-flex min-h-9 items-center gap-2 rounded-full bg-white/10 px-3.5 text-[13px] transition hover:bg-white hover:text-navy">
                                {L(p.productName)}
                                <span className="font-semibold">{formatMoney(p.priceFob)}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div {...rise(5, 'mt-6 flex flex-wrap gap-3')}>
                        <Link to={`/suppliers/${b.id}`} className={buttonClass('default', 'lg', 'rounded-full bg-white text-navy hover:bg-gold-bright')}>
                          {t.product.visitProfile} <ArrowUpRight />
                        </Link>
                        <Link to={`/suppliers/${b.id}`} className={buttonClass('ghost', 'lg', 'rounded-full text-white hover:bg-white/15 hover:text-white')}>
                          <MessagesSquare /> {t.common.contact}
                        </Link>
                      </div>
                    </div>
                </div>

                {on && list.length > 1 && (
                  <MotionConfig reducedMotion="never">
                  <motion.span
                    key={`bar-${i}-${paused}`}
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-1 origin-left bg-gold-bright"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: paused ? 0 : 1 }}
                    transition={{ duration: paused ? 0 : 7, ease: 'linear' }}
                  />
                  </MotionConfig>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ================================================================ EVENTS — featured + calendar list */
export function EventsAgenda() {
  const { t, L, locale } = useI18n()
  const events = useEvents().data ?? []
  const upcoming = events.filter((e) => e.eventStatus === 'UPCOMING')
  const live = events.find((e) => e.eventStatus === 'ONGOING') ?? upcoming[0]
  const { items: pageEvents, ...pager } = usePaged(upcoming)
  if (!live) return null

  return (
    <section className="container-page mt-24">
      <SectionHeader title={t.home.eventsTitle} sub={t.home.eventsSub} action={{ to: '/events', label: t.events.viewCalendar }} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Reveal><EventCard event={live} /></Reveal>
        <Reveal delay={0.1}>
          <p className="mb-3 flex items-center gap-2 text-sm font-bold"><CalendarDays className="size-4 text-primary" /> {t.home.upcoming}</p>
          <ol className="divide-y border-y">
            {pageEvents.map((e, i) => {
              const d = new Date(e.startDate)
              return (
                <motion.li key={e.id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <Link to={`/events/${e.id}`} className="group flex items-center gap-4 py-4 transition-colors">
                    <div className="grid w-16 shrink-0 place-items-center rounded-2xl bg-navy py-2.5 text-white transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gold-bright">{formatDate(e.startDate, locale, { month: 'short' })}</span>
                      <span className="text-2xl font-extrabold leading-none">{String(d.getDate()).padStart(2, '0')}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                        <span className="inline-flex items-center gap-1">{e.eventType === 'LIVESTREAM' ? <Radio className="size-3" /> : <Video className="size-3" />}{t.events.type[e.eventType]}</span>
                        {eventTimeRange(e) && <span className="inline-flex items-center gap-1"><Clock className="size-3" />{eventTimeRange(e)}</span>}
                      </div>
                      <p className="mt-1 line-clamp-2 font-bold leading-snug transition-colors group-hover:text-primary">{L(e.title)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {e.participationFee ? formatMoney(e.participationFee, e.participationFeeCurrency, locale) : t.common.free} · {formatNumber(e.registeredSlots, locale)}{e.maxSlots > 0 && `/${formatNumber(e.maxSlots, locale)}`} {t.events.registered}
                      </p>
                    </div>
                    <span className="grid size-10 shrink-0 place-items-center rounded-full border transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                      <ArrowUpRight className="size-4" />
                    </span>
                  </Link>
                </motion.li>
              )
            })}
          </ol>
          <Pager {...pager} className="mt-4" />
          <Link to="/events" className={buttonClass('gold', 'md', 'mt-5')}><Ticket /> {t.events.register}</Link>
        </Reveal>
      </div>
    </section>
  )
}

/* ================================================================ TESTIMONIALS */
export function Testimonials() {
  const { t, L } = useI18n()
  const testimonials = useHomeTestimonials().data ?? []
  const scroller = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)

  const scroll = (dir: 1 | -1) => {
    const el = scroller.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-card]')
    const step = (card?.offsetWidth ?? 360) + 20
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8
    el.scrollTo({ left: dir === 1 && atEnd ? 0 : el.scrollLeft + dir * step, behavior: 'smooth' })
  }
  useEffect(() => {
    if (paused) return
    const id = setInterval(() => scroll(1), 5000)
    return () => clearInterval(id)
  }, [paused])

  // Live mode with no testimonials authored in the CMS yet: hide the block instead of rendering an empty carousel.
  if (!testimonials.length) return null

  return (
    <section className="relative isolate mt-24 overflow-hidden bg-navy py-20 text-white">
      <div className="container-page">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-[42px]">{t.home.testimonialsTitle}</h2>
          <p className="mt-4 text-white/90 md:text-lg">{t.home.testimonialsSub}</p>
        </Reveal>

        <div className="relative mt-6" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          {/* safe center: canh giữa khi ít thẻ, tự về đầu hàng khi tràn để không mất thẻ đầu */}
          {/* overflow-x cắt luôn chiều dọc: pt/pb phải đủ chỗ cho avatar nhô lên, viền trắng, thẻ nhấc khi hover và shadow */}
          <div ref={scroller} className="no-scrollbar -mx-4 -mb-8 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-12 pt-14 [justify-content:safe_center] md:-mx-7 md:px-7">
            {testimonials.map((q, i) => (
              <motion.article
                key={q.id}
                data-card
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i, 3) * 0.1, duration: 0.6 }}
                whileHover={{ y: -8 }}
                className="relative flex w-[300px] shrink-0 snap-start flex-col items-center rounded-2xl bg-white px-7 pb-7 pt-12 text-center text-slate-900 sm:w-[360px] lg:w-[calc((100%-40px)/3)]"
              >
                <span
                  className="absolute -top-8 grid size-16 place-items-center rounded-full text-lg font-extrabold text-white ring-4 ring-white"
                  style={{ background: q.accent }}
                  aria-hidden
                >
                  {q.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </span>
                <p className="text-lg font-bold">{q.name}</p>
                <p className="mt-0.5 text-sm text-slate-500">{q.company} – <span className="uppercase">{L(q.countryName)}</span></p>
                <p className="text-xs text-slate-400">{L(q.role)}</p>
                <div className="mt-3 flex gap-1" aria-label={`${q.rating}/5`}>
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className={cn('size-[18px]', k < q.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200')} />
                  ))}
                </div>
                <p className="mt-4 line-clamp-6 text-left text-[15px] leading-relaxed text-slate-600">{L(q.quote)}</p>
                <div className="mt-auto flex w-full items-end justify-between pt-6">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    <CalendarDays className="size-3" /> {L(q.event)}
                  </span>
                  <Quote className="size-12 -scale-x-100 fill-rose-100 text-rose-100" />
                </div>
              </motion.article>
            ))}
          </div>
          {/* Desktop hiện đủ 3 thẻ một hàng, nên chỉ cần nút khi có từ 4 thẻ */}
          <div className={cn('mt-6 flex justify-center gap-3', testimonials.length < 2 ? 'hidden' : testimonials.length <= 3 && 'lg:hidden')}>
            <button onClick={() => scroll(-1)} className="grid size-11 place-items-center rounded-full bg-white/10 transition hover:bg-white/20" aria-label={t.ui.previous}><ChevronLeft className="size-5" /></button>
            <button onClick={() => scroll(1)} className="grid size-11 place-items-center rounded-full bg-white/10 transition hover:bg-white/20" aria-label={t.ui.next}><ChevronRight className="size-5" /></button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ================================================================ WHY — numbered list, no cards */
export function WhyList() {
  const { t } = useI18n()
  const icons = [ShieldCheck, Handshake, Bot, Radio, MessagesSquare]
  return (
    <section className="container-page mt-24 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <Reveal className="lg:sticky lg:top-36 lg:self-start">
        <img src="/imgs/lg1.png" alt="VCCI" className="h-10 w-auto dark:brightness-125" />
        <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-balance md:text-[40px] md:leading-[1.1]">{t.home.whyTitle}</h2>
        <p className="mt-4 max-w-md text-foreground/80">{t.home.ctaSub}</p>
        <Link to="/register" className={buttonClass('default', 'lg', 'mt-7')}>{t.home.ctaPrimary} <ArrowRight /></Link>
      </Reveal>
      <ol>
        {t.home.why.map((w, i) => {
          const Icon = icons[i]!
          return (
            <motion.li
              key={w.t}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5 }}
              className="group flex gap-5 py-5 first:pt-0"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><Icon className="size-5" /></span>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{w.t}</h3>
                <p className="mt-1.5 leading-relaxed text-foreground/80">{w.d}</p>
              </div>
            </motion.li>
          )
        })}
      </ol>
    </section>
  )
}

/* ================================================================ SPONSOR TIERS */
/** Set like the credits page of a printed fair programme: hairlines and names, rank carried by type size alone. */
export function SponsorTiers() {
  const { t, L } = useI18n()
  const s = mainSponsor
  // only what the CMS has published: no sponsors, no section
  if (!s && !goldSponsors.length && !partnerSponsors.length) return null
  const nameLink = 'rounded-sm decoration-gold decoration-2 underline-offset-[6px] outline-none [&[href]:hover]:underline focus-visible:ring-2 focus-visible:ring-primary'
  return (
    <section className="container-page mt-24">
      <SectionHeader title={`${s ? t.home.sponsorMain : t.live.sponsors} & ${t.home.sponsorPartners.toLowerCase()}`} />

      <Reveal>
        <dl className="divide-y border-y border-t-2 border-t-foreground">
          {s && <SponsorTier label={t.home.sponsorMain}>
            <a href={s.url} className={cn('text-4xl font-extrabold tracking-tight md:text-5xl', nameLink)}>{s.name}</a>
            {s.tagline && <p className="mt-3 max-w-2xl text-muted-foreground">{L(s.tagline)}</p>}
            {s.url && <a href={s.url} className="mt-4 inline-flex items-center gap-1 rounded-sm text-sm font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary">
              {t.home.sponsorVisit} <ArrowUpRight className="size-4" />
            </a>}
          </SponsorTier>}

          {goldSponsors.length > 0 && <SponsorTier label={t.home.sponsorGold}>
            <ul className="grid gap-x-10 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
              {goldSponsors.map((g) => (
                <li key={g.id}>
                  <a href={g.url} className={cn('text-2xl font-bold tracking-tight', nameLink)}>{g.name}</a>
                  {g.tagline && <p className="mt-1 text-sm text-muted-foreground">{L(g.tagline)}</p>}
                </li>
              ))}
            </ul>
          </SponsorTier>}

          {partnerSponsors.length > 0 && <SponsorTier label={t.home.sponsorPartners}>
            <ul className="flex flex-wrap gap-x-9 gap-y-2">
              {partnerSponsors.map((p) => (
                <li key={p.id}><a href={p.url} className={cn('text-[17px] font-semibold', nameLink)}>{p.name}</a></li>
              ))}
            </ul>
          </SponsorTier>}
        </dl>
      </Reveal>
    </section>
  )
}

function SponsorTier({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 py-7 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-8 md:py-9">
      <dt className="text-sm font-semibold text-muted-foreground md:pt-1.5">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}
