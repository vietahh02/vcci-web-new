/**
 * Cards show only fields that exist in the VCCI portal DTOs
 * (ProductResult, Business, EventItem, PortalImportRequestListItem) — nothing invented.
 */
import { ArrowRight, CalendarDays, MapPin, Radio, Users, Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getCategory, productsOf } from '@/api'
import type { Business, EventItem, ImportRequest, Product } from '@/data/mock'
import { CompanyMark, CountryChip, Stars, VerifiedBadge } from '@/components/brand'
import { LiveDot, SmartImage, Tilt } from '@/components/effects'
import { Badge } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { cn, daysLeft, formatDate, formatMoney, formatNumber, img } from '@/lib/utils'

/* ---------------------------------------------------------------- Product (ProductResult) */
export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const { t, L, locale } = useI18n()
  return (
    <Link to={`/products/${product.id}`} className={cn('group block', className)}>
      <SmartImage
        src={img(product.productImages[0]!, 520, 520)}
        alt={L(product.productName)}
        className="aspect-square rounded-xl"
        imgClassName="group-hover:scale-105"
      />
      <p className="mt-3 line-clamp-2 text-[14px] font-medium leading-snug text-foreground/90 group-hover:text-primary">{L(product.productName)}</p>
      <p className="mt-1.5 text-[16px] font-semibold tracking-tight">
        {formatMoney(product.priceFob)} <span className="text-xs font-normal text-muted-foreground">/ {product.unit} FOB</span>
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {t.common.moq} {formatNumber(product.moq, locale)} {product.unit} · {product.origin.split(',')[0]}
      </p>
    </Link>
  )
}

/* ---------------------------------------------------------------- Supplier (Business) — interactive card */
export function SupplierCard({ business }: { business: Business }) {
  const { t, L } = useI18n()
  const items = productsOf(business.id).slice(0, 3)
  return (
    <Tilt className="h-full rounded-2xl" max={6}>
      <Link
        to={`/suppliers/${business.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-[box-shadow,border-color] duration-300 hover:border-primary/30 hover:shadow-2xl hover:shadow-navy/12"
      >
        <div className="relative h-36 overflow-hidden">
          <img src={img(business.coverImage, 640, 300)} alt="" loading="lazy" className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          {business.verified && <VerifiedBadge className="absolute right-3 top-3 bg-white/90 dark:bg-black/50" />}
          {/* product strip revealed on hover */}
          <div className="absolute bottom-3 right-3 flex translate-y-4 gap-1.5 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            {items.map((p, i) => (
              <img
                key={p.id}
                src={img(p.productImages[0]!, 120, 120)}
                alt={L(p.productName)}
                loading="lazy"
                style={{ transitionDelay: `${i * 60}ms` }}
                className="size-11 rounded-lg object-cover ring-2 ring-white/80"
              />
            ))}
          </div>
        </div>
        <div className="relative flex flex-1 flex-col px-5 pb-5">
          <CompanyMark name={business.nameEn} accent={business.accent} className="-mt-8 size-16 rounded-2xl border-4 border-card text-lg shadow-md" />
          <p className="mt-3 line-clamp-2 text-[16px] font-bold leading-snug transition-colors group-hover:text-primary">{business.name}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
            <Stars score={business.reputationScore} className="text-foreground" />
            <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{business.province}</span>
          </div>
          <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{L(business.description)}</p>
          <div className="mt-auto flex items-center justify-between pt-5 text-[13px]">
            <span className="text-muted-foreground">{t.supplier.types[business.businessType]}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-primary">
              {t.common.viewDetail}
              <ArrowRight className="size-4 -translate-x-1 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </Tilt>
  )
}

/* ---------------------------------------------------------------- Supplier (Business) — horizontal row */
export function SupplierRow({ business }: { business: Business }) {
  const { t, L } = useI18n()
  const items = productsOf(business.id).slice(0, 3)
  return (
    <article className="group grid gap-5 border-b py-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="flex gap-4">
        <CompanyMark name={business.nameEn} accent={business.accent} className="size-14 rounded-xl text-base" />
        <div className="min-w-0">
          <Link to={`/suppliers/${business.id}`} className="text-[17px] font-bold leading-snug hover:text-primary">{business.name}</Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
            {business.verified && <VerifiedBadge />}
            <Stars score={business.reputationScore} className="text-foreground" />
            <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{business.province}</span>
            <span>{t.supplier.types[business.businessType]}</span>
          </div>
          <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-muted-foreground">{L(business.description)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 md:justify-end">
        {items.map((p) => (
          <Link key={p.id} to={`/products/${p.id}`} className="block size-20 overflow-hidden rounded-lg bg-muted">
            <img src={img(p.productImages[0]!, 200, 200)} alt={L(p.productName)} loading="lazy" className="size-full object-cover transition-transform duration-500 hover:scale-110" />
          </Link>
        ))}
        <Link to={`/suppliers/${business.id}`} className="ml-2 rounded-lg border px-4 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary">{t.common.contact}</Link>
      </div>
    </article>
  )
}

/* ---------------------------------------------------------------- Event (EventItem) */
export function EventCard({ event }: { event: EventItem }) {
  const { t, L, locale } = useI18n()
  const isLive = event.eventStatus === 'ONGOING'
  return (
    <Link to={`/events/${event.id}`} className="group block">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
        <img src={img(event.coverImage, 800, 500)} alt="" loading="lazy" className={cn('size-full object-cover transition-transform duration-700 group-hover:scale-105', event.eventStatus === 'ENDED' && 'grayscale-[50%]')} />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {isLive ? (
            <Badge variant="live" className="gap-1.5"><LiveDot /> {t.events.live}</Badge>
          ) : (
            <Badge variant="outline" className="border-white/30 bg-black/45 text-white backdrop-blur">{t.events.status[event.eventStatus]}</Badge>
          )}
        </div>
        {isLive && event.viewers && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
            <Users className="size-3.5" /> {formatNumber(event.viewers, locale)}
          </span>
        )}
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {event.eventType === 'LIVESTREAM' ? <Radio className="size-3.5" /> : <Video className="size-3.5" />}
        {t.events.type[event.eventType]}
        <span>·</span>
        <CalendarDays className="size-3.5" /> {formatDate(event.startDate, locale)} · {event.startTime}
      </p>
      <p className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug group-hover:text-primary">{L(event.title)}</p>
      <p className="mt-1 text-xs text-muted-foreground">{L(event.organizedBy)}</p>
    </Link>
  )
}

/* ---------------------------------------------------------------- Import request (list item) */
export function RequestCard({ request }: { request: ImportRequest }) {
  const { t, L, locale } = useI18n()
  const cat = getCategory(request.categoryId)
  const left = daysLeft(request.endTime)
  return (
    <Link to={`/requests/${request.id}`} className="group flex items-start justify-between gap-4 rounded-xl border bg-card p-4 transition hover:border-primary/40 hover:shadow-md md:p-5">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{cat ? L(cat.categoryName) : request.productType}</p>
        <p className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug group-hover:text-primary">{L(request.requestName)}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
          <span>{formatNumber(request.quantity, locale)} {request.unit}</span>
          <CountryChip code={request.country} label={request.organizationName} />
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-base font-bold">{formatMoney(request.price)}<span className="text-xs font-normal text-muted-foreground">/{request.unit}</span></p>
        <p className={cn('mt-1 text-xs', left <= 7 ? 'font-semibold text-amber-600 dark:text-amber-400' : 'text-muted-foreground')}>{left} {t.common.daysLeft}</p>
      </div>
    </Link>
  )
}
