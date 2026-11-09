/**
 * Cards show only fields that exist in the VCCI portal DTOs
 * (ProductResult, Business, EventItem, PortalImportRequestListItem) — nothing invented.
 */
import { ArrowRight, CalendarDays, MapPin, Radio, Store, Users, Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getCategory, liveApi, USE_MOCK, useOrgProducts } from '@/api'
import type { Business, EventItem, ImportRequest, Product } from '@/data/mock'
import { CompanyMark, CountryChip, VerifiedBadge } from '@/components/brand'
import { ReputationStars } from '@/components/reputation/Reputation'
import { LiveDot, SmartImage, Tilt } from '@/components/effects'
import { Badge } from '@/components/ui/primitives'
import { eventStartTime, isOnAir } from '@/lib/eventStatus'
import { useI18n } from '@/lib/i18n'
import { cn, daysLeft, formatDate, formatMoney, formatNumber, img } from '@/lib/utils'

/* ---------------------------------------------------------------- Product (ProductResult) */
export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const { t, L, locale } = useI18n()
  return (
    <Link
      to={`/products/${product.id}`}
      className={cn('group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary', className)}
    >
      {/* Link giữ nguyên vị trí làm vùng hover; chỉ lớp trong nhấc lên → không nháy ở mép card */}
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-[box-shadow,border-color,translate] duration-300 group-hover:-translate-y-1 group-hover:border-primary/30 group-hover:shadow-xl group-hover:shadow-navy/10 group-active:translate-y-0">
      <SmartImage
        src={img(product.productImages[0]!, 520, 520)}
        alt={L(product.productName)}
        className="aspect-square rounded-2xl"
        imgClassName="group-hover:scale-105"
      />
      <div className="flex flex-1 flex-col p-3.5">
        <p className="line-clamp-2 text-[14px] font-semibold leading-snug transition-colors group-hover:text-primary" title={L(product.productName)}>{L(product.productName)}</p>
        {/* who sells it and one spec: what tells two similar listings apart */}
        {product.organizationName && <p className="mt-1 truncate text-[13px] text-muted-foreground" title={product.organizationName}>{product.organizationName}</p>}
        {product.certificates[0] && <p className="mt-1.5 truncate text-xs font-semibold text-gold">{product.certificates.slice(0, 2).join(' · ')}{product.certificates.length > 2 && ` +${product.certificates.length - 2}`}</p>}
        <p className="mt-auto pt-2.5 text-[17px] font-bold tracking-tight">
          {formatMoney(product.priceFob)} <span className="text-xs font-normal text-muted-foreground">/ {product.unit} FOB</span>
        </p>
        <p className="mt-2.5 flex flex-col gap-0.5 border-t pt-2.5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <span className="shrink-0">{t.common.moq} {formatNumber(product.moq, locale)} {product.unit}</span>
          <span className="flex min-w-0 items-center gap-1"><MapPin className="size-3 shrink-0" /><span className="truncate">{product.origin.split(',')[0]}</span></span>
        </p>
      </div>
      </div>
    </Link>
  )
}

/* ---------------------------------------------------------------- Supplier (Business) — interactive card */
export function SupplierCard({ business }: { business: Business }) {
  const { t, L } = useI18n()
  const items = (useOrgProducts(business.id, USE_MOCK || liveApi.hasEmbeddedProducts(business.id)).data ?? []).slice(0, 3)
  return (
    <Tilt className="h-full rounded-3xl" max={6}>
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
                className="size-11 rounded-full object-cover ring-2 ring-white/80"
              />
            ))}
          </div>
        </div>
        <div className="relative flex flex-1 flex-col px-5 pb-5">
          <CompanyMark name={business.nameEn} accent={business.accent} className="-mt-8 size-16 rounded-full border-4 border-card text-lg shadow-md" />
          <p className="mt-3 line-clamp-2 text-[16px] font-bold leading-snug transition-colors group-hover:text-primary">{business.name}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
            <ReputationStars orgId={business.id} legacyScore={business.reputationScore} className="text-foreground" />
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
  const items = (useOrgProducts(business.id, USE_MOCK || liveApi.hasEmbeddedProducts(business.id)).data ?? []).slice(0, 3)
  return (
    <article className="group grid gap-5 border-b py-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="flex gap-4">
        <CompanyMark name={business.nameEn} accent={business.accent} className="size-14 rounded-full text-base" />
        <div className="min-w-0">
          <Link to={`/suppliers/${business.id}`} className="text-[17px] font-bold leading-snug hover:text-primary">{business.name}</Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
            {business.verified && <VerifiedBadge />}
            <ReputationStars orgId={business.id} legacyScore={business.reputationScore} className="text-foreground" />
            <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{business.province}</span>
            <span>{t.supplier.types[business.businessType]}</span>
          </div>
          <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-muted-foreground">{L(business.description)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 md:justify-end">
        {items.map((p) => (
          <Link key={p.id} to={`/products/${p.id}`} className="block size-20 overflow-hidden rounded-2xl bg-muted">
            <img src={img(p.productImages[0]!, 200, 200)} alt={L(p.productName)} loading="lazy" className="size-full object-cover transition-transform duration-500 hover:scale-110" />
          </Link>
        ))}
        <Link to={`/suppliers/${business.id}`} className="ml-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary">{t.common.contact}</Link>
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
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
        <img src={img(event.coverImage, 800, 500)} alt="" loading="lazy" className={cn('size-full object-cover transition-transform duration-700 group-hover:scale-105', event.eventStatus === 'ENDED' && 'grayscale-[50%]')} />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {isLive ? (
            <Badge variant="live" className="gap-1.5"><LiveDot /> {isOnAir(event) ? t.events.live : t.events.status.ONGOING}</Badge>
          ) : (
            <Badge variant="outline" className="border-white/30 bg-black/45 text-white backdrop-blur">{t.events.status[event.eventStatus]}</Badge>
          )}
        </div>
        {isLive && event.viewers && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            <Users className="size-3.5" /> {formatNumber(event.viewers, locale)}
          </span>
        )}
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {event.eventType === 'LIVESTREAM' ? <Radio className="size-3.5" /> : event.eventType === 'SHOW' ? <Store className="size-3.5" /> : <Video className="size-3.5" />}
        {t.events.type[event.eventType]}
        <span>·</span>
        <CalendarDays className="size-3.5" /> {formatDate(event.startDate, locale)}{eventStartTime(event) && ` · ${eventStartTime(event)}`}
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
