/**
 * shadcn-style Select on @radix-ui/react-select (replaces the native <select>).
 *
 * - Controlled: `value` + `onValueChange`. Uncontrolled in a <form>: `name` + `defaultValue` (+ `required`) still
 *   submit through FormData and reset with the form (Radix renders a hidden native select for that).
 * - `placeholder` shows while the value is '' and is not selectable (the old `<option value="" disabled>`).
 * - An option with `value: ''` is a selectable "none" choice (the old `<option value="">—</option>`). Radix forbids
 *   empty item values, so it is mapped to a private sentinel and back; state keeps seeing ''. With a `placeholder` as
 *   well, '' shows the placeholder and the '' option just clears. Don't combine a '' option with `name`/`required`
 *   (the hidden select would submit the sentinel) — use `placeholder` alone there.
 * - `id` / `aria-label` go on the trigger, so `<Field htmlFor>` labels keep focusing it. `className` styles the
 *   trigger (full width by default; `w-24`, `h-9`, `text-[13px]`… override).
 */
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import type { ReactNode } from 'react'
import { fieldBase, menuItem, popoverContent } from '@/components/ui/styles'
import { tx } from '@/lib/tx'
import { cn } from '@/lib/utils'

export type SelectOption<T extends string = string> = { value: T; label: ReactNode; disabled?: boolean }

export interface SelectProps<T extends string = string> {
  options: readonly SelectOption<T>[]
  value?: T
  defaultValue?: T
  onValueChange?: (value: T) => void
  placeholder?: ReactNode
  id?: string
  name?: string
  required?: boolean
  disabled?: boolean
  autoComplete?: string
  className?: string
  contentClassName?: string
  'aria-label'?: string
  'aria-describedby'?: string
}

const NONE = '__none__'
const scrollButton = 'flex h-6 cursor-default items-center justify-center bg-popover text-muted-foreground'

export function Select<T extends string = string>({ options, value, defaultValue, onValueChange, placeholder, id, name, required, disabled, autoComplete, className, contentClassName, ...aria }: SelectProps<T>) {
  const noneShown = placeholder == null && options.some((o) => o.value === '')
  const toRadix = (v: string | undefined) => (v === '' && noneShown ? NONE : v)
  // an empty select never shows a blank or a dash: it asks for a choice unless the caller worded it
  const prompt = placeholder ?? (noneShown ? undefined : tx('Chọn…', 'Select…', '선택…'))

  return (
    <SelectPrimitive.Root value={toRadix(value)} defaultValue={toRadix(defaultValue)} onValueChange={(v) => onValueChange?.((v === NONE ? '' : v) as T)} name={name} required={required} disabled={disabled} autoComplete={autoComplete}>
      <SelectPrimitive.Trigger
        id={id}
        {...aria}
        className={cn(fieldBase, 'group flex h-10 items-center justify-between gap-2 rounded-full px-4 pr-3 text-left data-[placeholder]:text-muted-foreground/80 data-[state=open]:border-primary data-[state=open]:ring-4 data-[state=open]:ring-primary/12', className)}
      >
        <span className="min-w-0 flex-1 truncate"><SelectPrimitive.Value placeholder={prompt} /></span>
        <SelectPrimitive.Icon asChild><ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" /></SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          collisionPadding={8}
          className={cn(popoverContent, 'max-h-[min(20rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-16px)] origin-[var(--radix-select-content-transform-origin)]', contentClassName)}
        >
          <SelectPrimitive.ScrollUpButton className={scrollButton}><ChevronUp className="size-4" /></SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="p-1">
            {options.map((o) => (
              <SelectPrimitive.Item key={o.value} value={o.value === '' ? NONE : o.value} disabled={o.disabled} className={cn(menuItem, 'pr-9')}>
                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-3 inline-flex"><Check /></SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className={scrollButton}><ChevronDown className="size-4" /></SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
