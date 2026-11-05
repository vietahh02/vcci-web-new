/**
 * Date / date-time pickers in the VCCI style. Drop-in replacement for <input type="date"> and
 * <input type="datetime-local">: same `value` string format ('YYYY-MM-DD' / 'YYYY-MM-DDTHH:mm'),
 * same `onChange({ target: { value } })` shape, and a hidden <input name> so plain forms still read it.
 */
import * as Popover from '@radix-ui/react-popover'
import { format, isValid, parse } from 'date-fns'
import { enUS, ko, vi } from 'react-day-picker/locale'
import { DayPicker, type DayPickerProps } from 'react-day-picker'
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { fieldBase, popoverContent } from '@/components/ui/styles'

type Change = (e: { target: { value: string } }) => void

export interface DateFieldProps {
  id?: string
  name?: string
  value: string
  onChange: Change
  min?: string
  max?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
  'aria-label'?: string
}

const DATE_FMT = 'yyyy-MM-dd'

function toDate(v: string | undefined): Date | undefined {
  if (!v) return undefined
  const d = parse(v.slice(0, 10), DATE_FMT, new Date())
  return isValid(d) ? d : undefined
}

const localeMap = { vi, en: enUS, ko } as const
const displayFmt = { vi: 'dd/MM/yyyy', en: 'MM/dd/yyyy', ko: 'yyyy.MM.dd' } as const

/* Calendar class map: rounded, primary-colored selection, soft hover. */
const calendarClassNames: NonNullable<DayPickerProps['classNames']> = {
  root: 'text-sm text-foreground',
  months: 'flex flex-col',
  month: 'space-y-3',
  month_caption: 'flex h-9 items-center justify-center',
  caption_label: 'text-sm font-bold capitalize',
  nav: 'absolute inset-x-3 top-3 flex items-center justify-between',
  button_previous:
    'grid size-8 place-items-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-primary-soft hover:text-primary',
  button_next:
    'grid size-8 place-items-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-primary-soft hover:text-primary',
  month_grid: 'w-full border-collapse',
  weekdays: 'flex',
  weekday: 'w-9 pb-1 text-center text-[11px] font-semibold uppercase text-muted-foreground',
  week: 'mt-1 flex w-full',
  day: 'size-9 p-0 text-center text-sm',
  day_button:
    'mx-auto grid size-9 place-items-center rounded-full font-medium transition-all duration-150 hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20',
  selected:
    '[&>button]:bg-gradient-to-b [&>button]:from-[#1a8cc4] [&>button]:to-primary [&>button]:text-primary-foreground [&>button]:shadow-md [&>button]:shadow-primary/30 [&>button]:hover:bg-primary',
  today: '[&>button]:ring-1 [&>button]:ring-primary/40 [&>button]:text-primary [&>button]:font-bold',
  outside: 'text-muted-foreground/50',
  disabled: 'opacity-35 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent',
}

export function DateField({ id, name, value, onChange, min, max, required, disabled, placeholder, className, ...aria }: DateFieldProps) {
  const { lang } = useI18n()
  const [open, setOpen] = useState(false)
  const selected = toDate(value)
  const fmt = displayFmt[lang as keyof typeof displayFmt] ?? displayFmt.en
  const locale = localeMap[lang as keyof typeof localeMap] ?? enUS

  const pick = (d: Date | undefined) => {
    onChange({ target: { value: d ? format(d, DATE_FMT) : '' } })
    setOpen(false)
  }

  return (
    <>
      {name && <input type="hidden" name={name} value={value} required={required} />}
      <Popover.Root open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
        <Popover.Trigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            aria-label={aria['aria-label']}
            aria-haspopup="dialog"
            aria-expanded={open}
            className={cn(
              fieldBase,
              'group flex h-10 items-center justify-between gap-2 rounded-full px-4 text-left transition-all duration-200 hover:border-primary/50 data-[state=open]:border-primary data-[state=open]:ring-4 data-[state=open]:ring-primary/12 disabled:cursor-not-allowed',
              className,
            )}
          >
            <span className={cn('truncate', !selected && 'text-muted-foreground/80')}>
              {selected ? format(selected, fmt) : placeholder ?? fmt.toUpperCase()}
            </span>
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <CalendarDays className="size-4" />
            </span>
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={8}
            collisionPadding={12}
            className={cn(popoverContent, 'relative w-[300px] rounded-3xl p-4 shadow-2xl shadow-navy/15')}
          >
            <DayPicker
              mode="single"
              locale={locale}
              selected={selected}
              defaultMonth={selected ?? new Date()}
              onSelect={pick}
              disabled={[
                ...(min ? [{ before: toDate(min)! }] : []),
                ...(max ? [{ after: toDate(max)! }] : []),
              ]}
              showOutsideDays
              classNames={calendarClassNames}
              components={{
                Chevron: ({ orientation }: { orientation?: 'left' | 'right' | 'up' | 'down' }) =>
                  orientation === 'left' ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />,
              }}
            />
            <div className="mt-3 flex justify-between border-t pt-3">
              <button
                type="button"
                onClick={() => pick(undefined)}
                className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
              >
                {lang === 'ko' ? '지우기' : lang === 'en' ? 'Clear' : 'Xoá'}
              </button>
              <button
                type="button"
                onClick={() => pick(new Date())}
                className="rounded-full bg-primary-soft px-3 py-1.5 text-[13px] font-semibold text-primary transition-all duration-200 hover:bg-primary hover:text-primary-foreground"
              >
                {lang === 'ko' ? '오늘' : lang === 'en' ? 'Today' : 'Hôm nay'}
              </button>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </>
  )
}

/** Date + time in one value ('YYYY-MM-DDTHH:mm'), replacing <input type="datetime-local">. */
export function DateTimeField({ id, name, value, onChange, min, max, required, disabled, className, 'aria-label': label }: Omit<DateFieldProps, 'placeholder'>) {
  const [datePart, timePart = ''] = value ? value.split('T') : ['', '']
  const emit = (d: string, t: string) => onChange({ target: { value: d ? `${d}T${t || '00:00'}` : '' } })
  return (
    <div className={cn('grid grid-cols-[1fr_8.5rem] gap-2', className)}>
      <DateField
        id={id}
        value={datePart ?? ''}
        onChange={(e) => emit(e.target.value, timePart)}
        min={min?.slice(0, 10)}
        max={max?.slice(0, 10)}
        required={required}
        disabled={disabled}
        aria-label={label}
      />
      <label className={cn(fieldBase, 'flex h-10 items-center gap-2 rounded-full px-3 transition-all duration-200 hover:border-primary/50 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/12', disabled && 'pointer-events-none opacity-60')}>
        <Clock className="size-4 shrink-0 text-primary" />
        <input
          type="time"
          aria-label={label ? `${label} (time)` : undefined}
          value={timePart}
          required={required}
          disabled={disabled}
          onChange={(e) => emit(datePart ?? '', e.target.value)}
          className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none"
        />
      </label>
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  )
}
