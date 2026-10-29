import { ArrowUpRight, Crown } from 'lucide-react'
import { sponsors } from '@/data/mock'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export const mainSponsor = sponsors.find((s) => s.tier === 'MAIN')!
export const goldSponsors = sponsors.filter((s) => s.tier === 'GOLD')
export const partnerSponsors = sponsors.filter((s) => s.tier === 'PARTNER')

export function SponsorMark({ mark, color, className }: { mark: string; color: string; className?: string }) {
  return (
    <span
      className={cn('grid shrink-0 place-items-center rounded-xl font-extrabold text-white', className)}
      style={{ background: `linear-gradient(140deg, ${color}, color-mix(in oklab, ${color} 50%, #08082e))` }}
      aria-hidden
    >
      {mark}
    </span>
  )
}

/** Vertical banner for event & livestream pages (UC-EAM-06: only Active ads inside their date range). */
export function SponsorVerticalBanner({ className, dark }: { className?: string; dark?: boolean }) {
  const { t, L } = useI18n()
  const s = mainSponsor
  return (
    <a
      href={s.url}
      className={cn('group relative block overflow-hidden rounded-2xl p-5 text-white shadow-lg', className)}
      style={{ background: `linear-gradient(160deg, ${s.color}, #08082e 85%)` }}
    >
      <div className="absolute -right-10 -top-10 size-40 rounded-full bg-gold-bright/25 blur-2xl transition-transform duration-700 group-hover:scale-125" />
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <p className="relative inline-flex items-center gap-1.5 rounded-full bg-gold-bright/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gold-bright">
        <Crown className="size-3.5" /> {t.home.sponsorMain}
      </p>
      <div className="relative mt-5 flex items-center gap-3">
        <SponsorMark mark={s.mark} color="#ffffff22" className="size-12 text-base ring-1 ring-white/25" />
        <p className="text-xl font-extrabold tracking-tight">{s.name}</p>
      </div>
      {s.tagline && <p className="relative mt-3 text-sm leading-relaxed text-white/75">{L(s.tagline)}</p>}
      <span className={cn('relative mt-5 inline-flex items-center gap-1 text-sm font-semibold', dark ? 'text-gold-bright' : 'text-white')}>
        {t.home.sponsorVisit} <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
      <div className="relative mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
        {goldSponsors.map((g) => (
          <span key={g.id} className="truncate rounded-md bg-white/8 px-2 py-1.5 text-center text-[10px] font-semibold text-white/70">{g.name}</span>
        ))}
      </div>
    </a>
  )
}
