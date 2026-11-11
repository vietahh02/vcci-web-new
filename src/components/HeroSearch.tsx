/** The prominent pill search bar that sits inside page heroes (products, business directory, import requests). */
import { Search, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { buttonClass } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'

export function HeroSearch({ value, onChange, placeholder, label, tone = 'primary', className, onSubmit }: { value: string; onChange: (v: string) => void; placeholder: string; label: string; tone?: 'primary' | 'warm'; className?: string; onSubmit?: () => void }) {
  const { t } = useI18n()
  const warm = tone === 'warm'
  return (
    <form
      role="search"
      onSubmit={(e) => { e.preventDefault(); onSubmit?.() }}
      className={cn(
        'flex h-14 items-center rounded-full bg-background pl-6 pr-2 ring-1 focus-within:ring-2',
        warm ? 'shadow-[0_10px_30px_-14px_rgba(160,60,20,0.45)] ring-[#e8553a]/15 focus-within:ring-[#e8553a]/50' : 'shadow-[0_10px_30px_-14px_rgba(0,80,125,0.4)] ring-primary/10 focus-within:ring-primary/50',
        className,
      )}
    >
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label={t.ui.close} className="mr-1 grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground">
          <X className="size-4" />
        </button>
      )}
      <button type="submit" className={buttonClass(warm ? 'warm' : 'default', 'md', 'px-6 text-[15px] font-bold')}>
        <Search aria-hidden /> <span className="max-sm:sr-only">{t.search.submit}</span>
      </button>
    </form>
  )
}
