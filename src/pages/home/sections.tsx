/** Home sections added in the "less monotonous" pass: varied rhythm, fewer image frames. */
import { AnimatePresence, motion } from 'motion/react'
import {
  ArrowRight, ArrowUpRight, Bot, CalendarDays, ChevronLeft, ChevronRight, Clock, Crown, Globe2, Handshake,
  Landmark, MapPin, MessagesSquare, Quote, Radio, ShieldCheck, Star, Ticket, Video,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useEvents, useFeaturedBusinesses, useHomeStats, useHomeTestimonials, useOrgProducts } from '@/api'
import { categories, countryName } from '@/data/mock'
import { categoryIcons, CompanyMark, SectionHeader, VerifiedBadge } from '@/components/brand'
import { ReputationStars } from '@/components/reputation/Reputation'
import { EventCard } from '@/components/cards'
import { CountUp, Marquee, Reveal, Stagger, StaggerItem } from '@/components/effects'
import { goldSponsors, mainSponsor, partnerSponsors } from '@/components/sponsor'
import { Pager, usePaged } from '@/components/ui/pager'
import { Badge, buttonClass } from '@/components/ui/primitives'
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
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{t.nav.allCategories}</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-balance md:text-[38px] md:leading-[1.1]">{t.home.categoriesTitle}</h2>
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
                <span className="absolute -right-6 -top-6 size-20 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-[3] group-hover:bg-white/10" />
                <span className="relative grid size-11 place-items-center rounded-xl bg-background text-primary shadow-sm transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110">
                  <Icon className="size-5" />
                </span>
                <span className="relative mt-4 text-[14px] font-bold leading-snug transition-colors group-hover:text-white">{L(c.categoryName)}</span>
                <span className="relative mt-1 flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-white/75">
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

/* ================================================================ FEATURED BUSINESS SPOTLIGHT */
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
  const b = list[i % Math.max(list.length, 1)]
  const items = useOrgProducts(b?.id ?? '').data ?? []
  if (!b) return null

  return (
    <section className="relative mt-24 overflow-hidden py-20" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-soft via-background to-gold-soft/70" />
      <div className="bg-dots absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_center,#000,transparent_70%)]" />
      <div className="container-page">
        <SectionHeader eyebrow="VCCI Verified" title={t.home.featuredTitle} sub={t.home.featuredSub} action={{ to: '/suppliers', label: t.supplier.directoryTitle }} />

        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <AnimatePresence mode="wait">
            <motion.div key={b.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
              <Badge variant="gold" className="gap-1.5 px-2.5 py-1"><Crown /> {t.home.featuredBadge}</Badge>
              <div className="mt-5 flex items-center gap-4">
                <CompanyMark name={b.nameEn} accent={b.accent} className="size-16 rounded-2xl text-xl" />
                <div className="min-w-0">
                  <h3 className="text-2xl font-extrabold leading-tight tracking-tight md:text-[30px]">{b.name}</h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    {b.verified && <VerifiedBadge />} <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{b.province}</span>
                  </p>
                </div>
              </div>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-foreground/80">{L(b.description)}</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <ReputationStars orgId={b.id} legacyScore={b.reputationScore} className="text-base" />
                <span className="text-muted-foreground">{t.supplier.types[b.businessType]}</span>
                <span className="text-muted-foreground">{b.employees} {t.common.employees.toLowerCase()}</span>
              </div>
              {items.length > 0 && (
                <ul className="mt-6 max-w-xl divide-y border-y">
                  {items.slice(0, 3).map((p) => (
                    <li key={p.id}>
                      <Link to={`/products/${p.id}`} className="group flex items-center justify-between gap-4 py-2.5 text-sm">
                        <span className="truncate font-medium group-hover:text-primary">{L(p.productName)}</span>
                        <span className="shrink-0 font-semibold">{formatMoney(p.priceFob)}<span className="font-normal text-muted-foreground"> / {p.unit}</span></span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to={`/suppliers/${b.id}`} className={buttonClass('default', 'lg')}>{t.product.visitProfile} <ArrowRight /></Link>
                <Link to={`/suppliers/${b.id}`} className={buttonClass('outline', 'lg')}><MessagesSquare /> {t.common.contact}</Link>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="relative">
            <div className="relative aspect-[5/4] overflow-hidden rounded-[28px] shadow-2xl shadow-navy/20">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.img
                  key={b.id}
                  src={img(b.coverImage, 1000, 800)}
                  alt=""
                  initial={{ opacity: 0, scale: 1.12 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 size-full object-cover"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent" />
            </div>
          </div>
        </div>

        {/* switcher */}
        <div className="mt-12">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.home.featuredMore}</p>
          {/* Mobile cuộn ngang nên cần -m/p chừa chỗ cho shadow; desktop bỏ overflow để không cắt shadow */}
          <div className="no-scrollbar -m-4 flex gap-3 overflow-x-auto p-4 md:m-0 md:grid md:grid-cols-5 md:overflow-visible md:p-0">
            {list.map((x, k) => (
              <button
                key={x.id}
                onClick={() => setI(k)}
                aria-pressed={k === i}
                className={cn('relative flex min-w-56 items-center gap-3 overflow-hidden rounded-xl p-3 text-left ring-1 transition md:min-w-0', k === i ? 'bg-background shadow-lg ring-primary/30' : 'bg-background/60 ring-border hover:bg-background')}
              >
                <CompanyMark name={x.nameEn} accent={x.accent} className="size-9 shrink-0 rounded-lg text-[11px]" />
                <span className="min-w-0">
                  <span className="line-clamp-2 text-[13px] font-semibold leading-snug" title={x.name}>{x.name}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{x.province}</span>
                </span>
                {k === i && !paused && (
                  <motion.span key={`p-${i}`} className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 7, ease: 'linear' }} />
                )}
              </button>
            ))}
          </div>
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
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_85%_60%,#1e5fae_0%,transparent_55%),radial-gradient(ellipse_at_10%_0%,#2a1c6b_0%,transparent_50%)]" />
      <div className="absolute -bottom-32 left-1/3 -z-10 size-96 animate-aurora rounded-full bg-gold-bright/15 blur-3xl" />
      <div className="bg-grid absolute inset-0 -z-10 opacity-30 [mask-image:linear-gradient(to_bottom,transparent,#000_30%,#000_70%,transparent)]" />
      <div className="container-page">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-[42px]">{t.home.testimonialsTitle}</h2>
          <p className="mt-4 text-white/75 md:text-lg">{t.home.testimonialsSub}</p>
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
                className="relative flex w-[300px] shrink-0 snap-start flex-col items-center rounded-2xl bg-white px-7 pb-7 pt-12 text-center text-slate-900 shadow-2xl shadow-black/30 sm:w-[360px] lg:w-[calc((100%-40px)/3)]"
              >
                <span
                  className="absolute -top-8 grid size-16 place-items-center rounded-full text-lg font-extrabold text-white ring-4 ring-white shadow-lg"
                  style={{ background: `linear-gradient(140deg, ${q.accent}, #08082e)` }}
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
            <button onClick={() => scroll(-1)} className="grid size-11 place-items-center rounded-full border border-white/20 bg-white/5 backdrop-blur transition hover:bg-white/15" aria-label={t.ui.previous}><ChevronLeft className="size-5" /></button>
            <button onClick={() => scroll(1)} className="grid size-11 place-items-center rounded-full border border-white/20 bg-white/5 backdrop-blur transition hover:bg-white/15" aria-label={t.ui.next}><ChevronRight className="size-5" /></button>
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
        <p className="mt-4 max-w-md text-muted-foreground">{t.home.ctaSub}</p>
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
              className="group flex gap-5 border-b py-6 first:pt-0"
            >
              <span className="w-10 shrink-0 font-mono text-sm font-bold text-muted-foreground/60 transition-colors group-hover:text-gold">0{i + 1}</span>
              <div className="flex-1">
                <h3 className="flex items-center gap-3 text-xl font-bold transition-colors group-hover:text-primary">
                  {w.t}
                  <Icon className="size-5 -translate-x-2 text-primary opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                </h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{w.d}</p>
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
