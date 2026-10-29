/**
 * shadcn-style primitives (see ui-references/flutter-shadcn-ui/skills/shadcn-ui-flutter/components):
 * Button, Badge, Card, Input, Textarea, Label, Select, Separator, Skeleton, Progress.
 */
import { forwardRef, type ReactNode, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type LabelHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/* ---------------------------------------------------------------- Button */
type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'gold' | 'link' | 'white'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const buttonVariants: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover shadow-primary/20',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-muted',
  outline: 'border border-input bg-background hover:bg-muted hover:border-foreground/20',
  ghost: 'hover:bg-muted',
  gold: 'bg-gradient-to-b from-[#e6c357] to-[#c99a22] text-[#2b1d00] shadow-sm shadow-amber-900/20 hover:brightness-105',
  link: 'text-primary underline-offset-4 hover:underline px-0 h-auto',
  white: 'bg-white text-navy hover:bg-white/90 shadow-sm',
}
const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
  icon: 'h-10 w-10 rounded-lg',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'default', size = 'md', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-semibold transition-[background,color,box-shadow,transform,filter] duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  )
})

export function buttonClass(variant: ButtonVariant = 'default', size: ButtonSize = 'md', className?: string) {
  return cn(
    'relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-semibold transition-[background,color,box-shadow,transform] duration-200 active:scale-[0.97] [&_svg]:size-4 [&_svg]:shrink-0',
    buttonVariants[variant],
    buttonSizes[size],
    className,
  )
}

/* ---------------------------------------------------------------- Badge */
type BadgeVariant = 'default' | 'secondary' | 'outline' | 'gold' | 'success' | 'live' | 'muted'
const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-primary text-primary-foreground border-transparent',
  secondary: 'bg-primary-soft text-primary border-transparent',
  outline: 'border-border text-foreground',
  gold: 'bg-gold-soft text-gold border-gold/25',
  success: 'bg-success-soft text-success border-transparent',
  live: 'bg-live text-white border-transparent',
  muted: 'bg-muted text-muted-foreground border-transparent',
}

export function Badge({ className, variant = 'secondary', ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-[11.5px] font-semibold leading-5 [&_svg]:size-3.5',
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  )
}

/* ---------------------------------------------------------------- Card */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-xl border bg-card text-card-foreground shadow-[0_1px_2px_rgb(15_23_42/0.04)]', className)} {...props} />
}
export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 p-5', className)} {...props} />
}
export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-bold leading-snug tracking-tight', className)} {...props} />
}
export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}
export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pt-0', className)} {...props} />
}
export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center p-5 pt-0', className)} {...props} />
}

/* ---------------------------------------------------------------- Form fields */
const fieldBase =
  'w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-[0_1px_1px_rgb(15_23_42/0.03)] transition-[border,box-shadow] placeholder:text-muted-foreground/80 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/12 disabled:opacity-60'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(fieldBase, 'h-10', className)} {...props} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(fieldBase, 'min-h-24 py-2.5 leading-relaxed', className)} {...props} />
})

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        fieldBase,
        "h-10 appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2371717a' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-9",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1.5 block text-[13px] font-semibold text-foreground', className)} {...props} />
}

export function Field({ label, htmlFor, hint, children, className }: { label: string; htmlFor?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/* ---------------------------------------------------------------- Misc */
export function Separator({ className, vertical }: { className?: string; vertical?: boolean }) {
  return <div role="separator" className={cn('shrink-0 bg-border', vertical ? 'h-full w-px' : 'h-px w-full', className)} />
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} />
}

export function Progress({ value, className, barClassName }: { value: number; className?: string; barClassName?: string }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full bg-primary transition-[width] duration-700', barClassName)} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border bg-muted px-1.5 py-0.5 font-sans text-[11px] font-semibold text-muted-foreground">{children}</kbd>
}
