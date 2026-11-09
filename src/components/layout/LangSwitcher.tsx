import { ChevronDown, Globe } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { LANGS, useI18n, type Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function LangSwitcher({ className }: { className?: string }) {
  const { t, lang, setLang } = useI18n()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={cn('group inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-[13px] font-bold text-muted-foreground transition-all duration-200 hover:bg-primary-soft hover:text-primary data-[state=open]:bg-muted data-[state=open]:text-foreground', className)}
        aria-label={t.ui.language}
      >
        <Globe className="size-[18px]" /> {LANGS.find((l) => l.code === lang)?.short}
        <ChevronDown className="size-3.5 transition group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={lang} onValueChange={(v) => setLang(v as Lang)}>
          {LANGS.map((l) => (
            <DropdownMenuRadioItem key={l.code} value={l.code}>
              <span className="w-6 text-xs font-bold text-muted-foreground">{l.short}</span>
              <span className="flex-1">{l.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
