import { ArrowRight, BadgeCheck, Boxes, Cpu, Fish, Gem, Hammer, Shirt, Sofa, Star, Truck, Wheat, Zap, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { CategoryIcon } from '@/data/mock'
import { Reveal } from '@/components/effects'
import { Tooltip } from '@/components/ui/overlay'
import { useI18n } from '@/lib/i18n'
import { cn, initials } from '@/lib/utils'

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link to="/" className={cn('flex items-center gap-2.5', className)} aria-label="VCCI Trade Hub">
      <img src="/imgs/lg1.png" alt="VCCI" className="h-7 w-auto dark:brightness-125 md:h-8" />
      {!compact && (
        <span className="hidden border-l border-border pl-2.5 leading-none sm:block">
          <span className="block text-[13px] font-extrabold tracking-tight text-foreground">TRADE HUB</span>
          <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">B2B Portal</span>
        </span>
      )}
    </Link>
  )
}

export const categoryIcons: Record<CategoryIcon, LucideIcon> = { Wheat, Fish, Shirt, Sofa, Cpu, Gem, Hammer, Zap, Boxes, Truck }

export function VerifiedBadge({ className, compact }: { className?: string; compact?: boolean }) {
  const { t } = useI18n()
  return (
    <Tooltip content={t.common.verifiedLong}>
      <span
        className={cn(
          'relative inline-flex items-center gap-1 overflow-hidden rounded-md border border-gold/30 bg-gold-soft px-1.5 py-0.5 text-[11px] font-bold text-gold',
          className,
        )}
      >
        <BadgeCheck className="size-3.5" />
        {!compact && t.common.verified}
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/25" />
      </span>
    </Tooltip>
  )
}

export function Stars({ score, className }: { score: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-[13px] font-semibold', className)}>
      <Star className="size-3.5 fill-gold-bright text-gold-bright" />
      {score.toFixed(1)}
    </span>
  )
}

/** Monogram logo — companies upload real logos via /api/organization/my-company/logo. */
export function CompanyMark({ name, accent, className }: { name: string; accent: string; className?: string }) {
  return (
    <div
      className={cn('grid shrink-0 place-items-center rounded-xl text-sm font-extrabold text-white shadow-inner ring-1 ring-black/5', className)}
      style={{ background: `linear-gradient(140deg, ${accent}, color-mix(in oklab, ${accent} 55%, #08082e))` }}
      aria-hidden
    >
      {initials(name)}
    </div>
  )
}

export function CountryChip({ code, label, className }: { code: string; label?: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[13px] text-muted-foreground', className)}>
      <span className="rounded bg-muted px-1 py-px font-mono text-[10px] font-bold tracking-wider text-foreground/70 ring-1 ring-border">{code}</span>
      {label}
    </span>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  sub,
  action,
  className,
}: {
  eyebrow?: string
  title: string
  sub?: string
  action?: { to: string; label: string }
  className?: string
}) {
  return (
    <Reveal className={cn('mb-7 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>}
        <h2 className="text-2xl font-extrabold tracking-tight text-balance md:text-[32px] md:leading-[1.15]">{title}</h2>
        {sub && <p className="mt-2 text-[15px] text-muted-foreground">{sub}</p>}
      </div>
      {action && (
        <Link to={action.to} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          {action.label}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </Reveal>
  )
}

export function PageHero({ title, sub, crumbs, children, image }: { title: string; sub?: string; crumbs?: { to?: string; label: string }[]; children?: ReactNode; image?: string }) {
  const { t } = useI18n()
  return (
    <section className="relative isolate overflow-hidden bg-navy text-white">
      {image && <img src={image} alt="" className="absolute inset-0 -z-20 size-full animate-kenburns object-cover opacity-35" />}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-navy via-navy/90 to-[#003a5c]/80" />
      <div className="bg-grid absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(ellipse_at_top,#000_30%,transparent_75%)]" />
      <div className="absolute -right-24 -top-24 -z-10 size-96 animate-aurora rounded-full bg-primary/40 blur-3xl" />
      <div className="container-page py-12 md:py-16">
        {crumbs && (
          <nav aria-label={t.ui.breadcrumb} className="mb-4 flex flex-wrap items-center gap-1.5 text-[13px] text-white/60">
            {crumbs.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                {c.to ? <Link to={c.to} className="hover:text-white">{c.label}</Link> : <span className="text-white/90">{c.label}</span>}
                {i < crumbs.length - 1 && <span>/</span>}
              </span>
            ))}
          </nav>
        )}
        <Reveal>
          <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-balance md:text-[44px] md:leading-[1.1]">{title}</h1>
          {sub && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/75 md:text-base">{sub}</p>}
        </Reveal>
        {children}
      </div>
    </section>
  )
}
