/** Home sections added in the "less monotonous" pass: varied rhythm, fewer image frames. */
import { motion } from 'motion/react'
import {
  ArrowRight, ArrowUpRight, Bot, CalendarDays, ChevronLeft, ChevronRight, Globe2, Handshake,
  Landmark, MessagesSquare, Quote, Radio, SearchX, ShieldCheck, Star,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { searchBusinesses, useEvents, useFeaturedBusinesses, useHomeTestimonials, useOrgProducts, useRemote } from '@/api'
import { countryName, type Business } from '@/data/mock'
import { SectionHeader, VerifiedBadge } from '@/components/brand'
import { LiveDot, Marquee, Reveal, Stagger, StaggerItem } from '@/components/effects'
import { goldSponsors, mainSponsor, partnerSponsors } from '@/components/sponsor'
import { buttonClass } from '@/components/ui/primitives'
import { eventTimeRange, isOnAir } from '@/lib/eventStatus'
import { useI18n } from '@/lib/i18n'
import { cn, daysLeft, formatDate, formatMoney, img } from '@/lib/utils'

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

/** Shown in a home section when its API returned nothing (never while it is still loading). */
export function HomeEmpty({ what, dark, className }: { what: keyof ReturnType<typeof useI18n>['t']['common']['notFound']; dark?: boolean; className?: string }) {
  const { t } = useI18n()
  return (
    <div role="status" className={cn('flex flex-col items-center gap-2 rounded-2xl px-6 py-14 text-center', dark ? 'bg-white/[0.06] text-white/75' : 'bg-muted/60 text-muted-foreground', className)}>
      <SearchX className="size-7" aria-hidden />
      <p className={cn('font-semibold', dark ? 'text-white' : 'text-foreground')}>{t.common.notFound[what]}</p>
    </div>
  )
}

/* ================================================================ FEATURED BUSINESSES — three suppliers, each with three of its products */
export function FeaturedBusiness() {
  const { t } = useI18n()
  const { data: featured, loading: featuredLoading } = useFeaturedBusinesses()
  // featured suppliers may have no products (BE currently returns importers only), so the directory fills the gaps
  const { data: directory, loading: directoryLoading } = useRemote('home:biz-directory', searchBusinesses)
  const list = [...(featured ?? []), ...(directory ?? []).filter((d) => !featured?.some((f) => f.id === d.id))]
  return (
    <section className="container-page mt-24">
      <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-extrabold tracking-[-0.02em] md:text-[38px] md:leading-[1.1]">{t.home.featuredTitle}</h2>
          <p className="mt-3 text-muted-foreground">{t.home.featuredSub}</p>
        </div>
        <Link to="/suppliers" className="group inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-primary">
          {t.supplier.directoryTitle}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Reveal>
      {/* rows without products render nothing (a hidden marker while loading), so nth-of-type keeps the first three articles.
          shortcut: one product request per candidate (up to 12); upgrade when the BE returns featured suppliers with products */}
      <div className="peer grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 [&>article:nth-of-type(n+4)]:hidden">
        {list.slice(0, 12).map((b) => <FeaturedBusinessRow key={b.id} business={b} />)}
      </div>
      {!featuredLoading && !directoryLoading && <HomeEmpty what="businesses" className="hidden peer-[:not(:has(article,[data-loading]))]:flex" />}
    </section>
  )
}

function FeaturedBusinessRow({ business: b }: { business: Business }) {
  const { t, L } = useI18n()
  const { data, loading } = useOrgProducts(b.id)
  const items = (data ?? []).slice(0, 3)
  if (loading) return <span data-loading hidden />
  if (!items.length) return null
  const country = countryName[b.country] ? L(countryName[b.country]) : b.country
  return (
    <article className="flex flex-col rounded-3xl bg-muted/60 p-4 md:p-5">
      <div className="flex items-center gap-4">
        <img src={img(b.coverImage, 160, 160)} alt="" loading="lazy" className="size-16 shrink-0 rounded-2xl object-cover" />
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <img src={`https://flagcdn.com/${b.country.toLowerCase()}.svg`} alt="" width={20} height={14} className="h-3.5 w-5 rounded-[2px] object-cover" />
            {country} · {t.supplier.types[b.businessType]}
            {b.verified && <VerifiedBadge compact />}
          </p>
          <h3 className="mt-0.5 line-clamp-2 text-base font-bold leading-snug">
            <Link to={`/suppliers/${b.id}`} className="hover:text-primary">{b.name}</Link>
          </h3>
        </div>
      </div>
      <ul className="mt-4 grid grid-cols-3 gap-2.5">
        {items.map((p) => (
          <li key={p.id}>
            {/* image only at rest; name and price show on hover or keyboard focus (touch opens the product) */}
            <Link to={`/products/${p.id}`} aria-label={`${L(p.productName)}, ${formatMoney(p.priceFob)} / ${p.unit}`} className="group relative block aspect-square overflow-hidden rounded-2xl bg-background outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <img src={img(p.productImages[0]!, 320, 320)} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <span aria-hidden className="absolute inset-0 flex flex-col justify-end bg-navy/80 p-2.5 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="line-clamp-3 text-[13px] font-semibold leading-snug">{L(p.productName)}</span>
                <span className="mt-1 text-[13px] font-bold">{formatMoney(p.priceFob)} <span className="font-normal text-white/75">/ {p.unit}</span></span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link to={`/suppliers/${b.id}`} className="group mt-4 inline-flex min-h-9 items-center gap-1.5 self-start text-sm font-semibold text-primary">
        {t.product.visitProfile}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </article>
  )
}
/* ================================================================ EVENTS — one featured event with its date set large, then a separate row of the next ones */
/** Trang chủ — Sự kiện: một sự kiện nổi bật (ảnh lớn + ngày + tiêu đề + nút) và, tách riêng bên dưới, hàng thẻ "Sắp diễn ra". */
export function EventsAgenda() {
  const { t, L, locale } = useI18n()
  const { data: events = [], loading } = useEvents()
  const list = [...events.filter((e) => e.eventStatus === 'ONGOING'), ...events.filter((e) => e.eventStatus === 'UPCOMING')].slice(0, 4)
  const ev = list[0]
  if (!ev) return loading ? null : (
    <section className="container-page mt-24">
      <h2 className="mb-8 text-3xl font-extrabold tracking-[-0.02em] md:text-[38px] md:leading-[1.1]">{t.home.eventsTitle}</h2>
      <HomeEmpty what="events" />
    </section>
  )
  const others = list.slice(1)
  const time = eventTimeRange(ev)
  const left = daysLeft(ev.startDate)
  const d = new Date(ev.startDate)

  return (
    <section className="container-page mt-24">
      <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-extrabold tracking-[-0.02em] md:text-[38px] md:leading-[1.1]">{t.home.eventsTitle}</h2>
          <p className="mt-3 text-muted-foreground">{t.home.eventsSub}</p>
        </div>
        <Link to="/events" className="group inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-primary">
          {t.events.viewCalendar}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Reveal>

      {/* sự kiện nổi bật */}
      <Reveal className="grid overflow-hidden rounded-3xl bg-muted/60 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Link to={`/events/${ev.id}`} tabIndex={-1} aria-hidden className="group relative block aspect-[16/10] overflow-hidden bg-muted lg:aspect-auto lg:min-h-[380px]">
          <img src={img(ev.coverImage, 1100, 800)} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-background px-3.5 py-1.5 text-sm font-semibold text-foreground">
            {isOnAir(ev) ? <><LiveDot /> {t.events.live}</> : ev.eventStatus === 'ONGOING' ? t.events.status.ONGOING : `${left} ${t.common.daysLeft}`}
          </span>
        </Link>
        <div className="flex min-w-0 flex-col justify-center p-6 md:p-10">
          <div className="flex items-center gap-4">
            <span className="text-[56px] font-extrabold leading-[0.9] tracking-[-0.05em] text-primary tabular-nums md:text-[72px]">{String(d.getDate()).padStart(2, '0')}</span>
            <span className="text-sm leading-relaxed text-muted-foreground">
              <span className="block font-semibold text-foreground first-letter:uppercase">{formatDate(ev.startDate, locale, { month: 'long', year: 'numeric' })}</span>
              {time}
            </span>
          </div>
          <h3 className="mt-6 line-clamp-3 text-2xl font-extrabold leading-tight tracking-[-0.02em] md:text-[28px]">
            <Link to={`/events/${ev.id}`} className="transition-colors hover:text-primary">{L(ev.title)}</Link>
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-background px-3 py-1 text-[13px] font-semibold text-foreground/80">{t.events.type[ev.eventType]}</span>
            <span className="rounded-full bg-background px-3 py-1 text-[13px] font-semibold text-foreground/80">{ev.participationFee ? formatMoney(ev.participationFee, ev.participationFeeCurrency, locale) : t.common.free}</span>
          </div>
          <Link to={`/events/${ev.id}`} className={buttonClass('default', 'lg', 'mt-7 self-start rounded-full')}>
            {ev.eventStatus === 'ONGOING' ? t.common.viewDetail : t.events.register}
          </Link>
        </div>
      </Reveal>

      {/* các sự kiện khác: hàng thẻ riêng, cùng một kiểu (ảnh + ngày + tiêu đề), tách khỏi khối nổi bật bằng nhãn và khoảng cách */}
      {others.length > 0 && (
        <div className="mt-10">
          <p className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">{t.home.upcoming}</p>
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((e) => (
              <StaggerItem key={e.id}>
                <Link to={`/events/${e.id}`} className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <span className="relative block aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
                    <img src={img(e.coverImage, 640, 400)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <span className="absolute left-3 top-3 rounded-xl bg-background px-3 py-1.5 text-center leading-none shadow-sm">
                      <span className="block text-lg font-extrabold tabular-nums text-primary">{String(new Date(e.startDate).getDate()).padStart(2, '0')}</span>
                      <span className="mt-0.5 block text-[10px] font-bold uppercase text-muted-foreground">{formatDate(e.startDate, locale, { month: 'short' })}</span>
                    </span>
                  </span>
                  <span className="mt-3 block line-clamp-2 text-base font-bold leading-snug transition-colors group-hover:text-primary">{L(e.title)}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{t.events.type[e.eventType]}</span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      )}
    </section>
  )
}

/* ================================================================ TESTIMONIALS */
export function Testimonials() {
  const { t, L } = useI18n()
  const { data: testimonials = [], loading } = useHomeTestimonials()
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

  if (loading && !testimonials.length) return null

  return (
    <section className="relative isolate mt-24 overflow-hidden bg-navy py-20 text-white">
      <div className="container-page">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-[42px]">{t.home.testimonialsTitle}</h2>
          <p className="mt-4 text-white/90 md:text-lg">{t.home.testimonialsSub}</p>
        </Reveal>

        {!testimonials.length && <HomeEmpty what="testimonials" dark className="mt-10" />}
        <div className={cn('relative mt-6', !testimonials.length && 'hidden')} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
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
  const none = !s && !goldSponsors.length && !partnerSponsors.length
  const nameLink = 'rounded-sm decoration-gold decoration-2 underline-offset-[6px] outline-none [&[href]:hover]:underline focus-visible:ring-2 focus-visible:ring-primary'
  return (
    <section className="container-page mt-24">
      <SectionHeader title={`${s ? t.home.sponsorMain : t.live.sponsors} & ${t.home.sponsorPartners.toLowerCase()}`} />
      {none && <HomeEmpty what="sponsors" />}

      <Reveal>
        <dl className="divide-y border-y border-t-2 border-t-foreground">
          {s && <SponsorTier label={t.home.sponsorMain}>
            {s.logo && <img src={s.logo} alt="" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.hidden = true }} className="mb-4 h-14 w-auto max-w-60 object-contain" />}
            <a href={s.url} className={cn('text-4xl font-extrabold tracking-tight md:text-5xl', nameLink)}>{s.name}</a>
            {s.tagline && <p className="mt-3 max-w-2xl text-muted-foreground">{L(s.tagline)}</p>}
            {s.url && <a href={s.url} className="mt-4 inline-flex items-center gap-1 rounded-sm text-sm font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary">
              {t.home.sponsorVisit} <ArrowUpRight className="size-4" />
            </a>}
          </SponsorTier>}

          {goldSponsors.length > 0 && <SponsorTier label={t.home.sponsorGold}>
            <Marquee duration={36} className="py-1 [&>div]:gap-14 [&>div]:pr-14">
              {loop(goldSponsors).map((g, i) => (
                <SponsorChip key={i} sponsor={g} size="lg" />
              ))}
            </Marquee>
          </SponsorTier>}

          {partnerSponsors.length > 0 && <SponsorTier label={t.home.sponsorPartners}>
            <Marquee duration={44} reverse className="py-1 [&>div]:gap-10 [&>div]:pr-10">
              {loop(partnerSponsors).map((p, i) => (
                <SponsorChip key={i} sponsor={p} size="md" />
              ))}
            </Marquee>
          </SponsorTier>}
        </dl>
      </Reveal>
    </section>
  )
}

function SponsorChip({ sponsor: sp, size }: { sponsor: (typeof goldSponsors)[number]; size: 'lg' | 'md' }) {
  // a logo hosted elsewhere can fail (hotlink block, moved file): fall back to the monogram
  const [broken, setBroken] = useState(false)
  const logo = broken ? undefined : sp.logo
  return (
    <a href={sp.url} className="group/chip flex shrink-0 items-center gap-3 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <span aria-hidden className={cn('grid shrink-0 place-items-center overflow-hidden rounded-full font-extrabold text-white transition-transform duration-300 group-hover/chip:scale-110', size === 'lg' ? 'size-16 text-lg' : 'size-11 text-sm', logo && 'bg-white p-1.5 ring-1 ring-border')} style={logo ? undefined : { background: sp.color }}>
        {logo ? <img src={logo} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} className="size-full object-contain" /> : sp.mark}
      </span>
      <span className={cn('whitespace-nowrap tracking-tight transition-colors group-hover/chip:text-primary', size === 'lg' ? 'text-xl font-bold md:text-2xl' : 'text-base font-semibold text-foreground/80')}>{sp.name}</span>
    </a>
  )
}

// repeat a short list so one copy is wider than the row; Marquee doubles it for the seamless loop
const loop = <T,>(xs: T[]) => Array.from({ length: Math.ceil(8 / xs.length) }, () => xs).flat()

function SponsorTier({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 py-7 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-8 md:py-9">
      <dt className="text-sm font-semibold text-muted-foreground md:pt-1.5">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}
