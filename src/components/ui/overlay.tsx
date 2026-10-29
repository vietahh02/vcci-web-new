/** Radix-backed Dialog, Sheet, Tabs, Tooltip + a Sonner-style toaster. */
import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, Info, X } from 'lucide-react'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* ---------------------------------------------------------------- Dialog */
export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export function DialogContent({
  children,
  className,
  title,
  description,
}: {
  children: ReactNode
  className?: string
  title: string
  description?: string
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-navy/55 backdrop-blur-[3px] data-[state=open]:animate-[fade-in_.2s_ease-out]" />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-[81] flex max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl shadow-navy/30 data-[state=open]:animate-[dialog-in_.28s_cubic-bezier(.16,1,.3,1)]',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
          <div>
            <DialogPrimitive.Title className="text-lg font-bold tracking-tight">{title}</DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-0.5 text-sm text-muted-foreground">{description}</DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close className="-mr-2 rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Close">
            <X className="size-4" />
          </DialogPrimitive.Close>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

/* ---------------------------------------------------------------- Sheet (side drawer) */
export function SheetContent({
  children,
  title,
  description,
  side = 'right',
  className,
}: {
  children: ReactNode
  title: string
  description?: string
  side?: 'right' | 'left'
  className?: string
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-navy/50 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_.2s_ease-out]" />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-y-0 z-[81] flex w-full max-w-md flex-col border-l bg-popover shadow-2xl',
          side === 'right' ? 'right-0 data-[state=open]:animate-[sheet-in-right_.35s_cubic-bezier(.16,1,.3,1)]' : 'left-0 border-r data-[state=open]:animate-[sheet-in-left_.35s_cubic-bezier(.16,1,.3,1)]',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
          <div>
            <DialogPrimitive.Title className="text-lg font-bold">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Description className={description ? 'mt-0.5 text-sm text-muted-foreground' : 'sr-only'}>
              {description ?? title}
            </DialogPrimitive.Description>
          </div>
          <DialogPrimitive.Close className="-mr-2 rounded-md p-2 text-muted-foreground hover:bg-muted" aria-label="Close">
            <X className="size-4" />
          </DialogPrimitive.Close>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

/* ---------------------------------------------------------------- Tabs (animated indicator) */
export function Tabs({
  value,
  onValueChange,
  items,
  className,
  layoutId,
  size = 'md',
}: {
  value: string
  onValueChange: (v: string) => void
  items: { value: string; label: ReactNode }[]
  className?: string
  layoutId: string
  size?: 'sm' | 'md'
}) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange} className="no-scrollbar max-w-full overflow-x-auto">
      <TabsPrimitive.List className={cn('inline-flex items-center gap-1 rounded-xl bg-muted p-1', className)}>
        {items.map((it) => (
          <TabsPrimitive.Trigger
            key={it.value}
            value={it.value}
            className={cn(
              'relative shrink-0 whitespace-nowrap rounded-lg font-semibold text-muted-foreground transition-colors data-[state=active]:text-foreground',
              size === 'sm' ? 'px-3 py-1.5 text-[13px]' : 'px-4 py-2 text-sm',
            )}
          >
            {value === it.value && (
              <motion.span layoutId={layoutId} className="absolute inset-0 rounded-lg bg-background shadow-sm ring-1 ring-border" transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }} />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">{it.label}</span>
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  )
}

/* Underline tabs used on detail pages */
export function UnderlineTabs({
  value,
  onValueChange,
  items,
  layoutId,
  className,
}: {
  value: string
  onValueChange: (v: string) => void
  items: { value: string; label: ReactNode }[]
  layoutId: string
  className?: string
}) {
  return (
    <div role="tablist" className={cn('no-scrollbar flex gap-6 overflow-x-auto border-b', className)}>
      {items.map((it) => (
        <button
          key={it.value}
          role="tab"
          aria-selected={value === it.value}
          onClick={() => onValueChange(it.value)}
          className={cn('relative shrink-0 pb-3 pt-1 text-sm font-semibold transition-colors', value === it.value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
        >
          {it.label}
          {value === it.value && <motion.span layoutId={layoutId} className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
        </button>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- Tooltip */
export const TooltipProvider = TooltipPrimitive.Provider
export function Tooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  return (
    <TooltipPrimitive.Root delayDuration={200}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content sideOffset={6} className="z-[90] rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-lg data-[state=delayed-open]:animate-[fade-in_.15s_ease-out]">
          {content}
          <TooltipPrimitive.Arrow className="fill-foreground" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

/* ---------------------------------------------------------------- Toaster */
type Toast = { id: number; title: string; description?: string; kind: 'success' | 'info' }
const ToastContext = createContext<(t: Omit<Toast, 'id'>) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev.slice(-2), { ...t, id }])
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4200)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-[calc(100vw-32px)] max-w-sm -translate-x-1/2 flex-col gap-2 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border bg-popover p-4 shadow-xl shadow-navy/10"
            >
              {t.kind === 'success' ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" /> : <Info className="mt-0.5 size-5 shrink-0 text-primary" />}
              <div className="min-w-0">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.description && <p className="mt-0.5 text-[13px] text-muted-foreground">{t.description}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
