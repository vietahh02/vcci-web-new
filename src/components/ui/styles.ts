/** Class strings shared by the form fields (primitives.tsx) and the Radix popovers (select.tsx, dropdown-menu.tsx). */

/** Input / Textarea / Select trigger. */
export const fieldBase =
  'w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-[0_1px_1px_rgb(15_23_42/0.03)] transition-[border,box-shadow] placeholder:text-muted-foreground/80 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/12 disabled:opacity-60'

/** Floating list surface (z above dialogs/sheets at z-81). Grows from the trigger via the Radix transform-origin var. */
export const popoverContent =
  'relative z-[90] overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-xl shadow-navy/10 data-[state=open]:animate-[popover-in_.16s_cubic-bezier(.16,1,.3,1)] data-[state=closed]:animate-[popover-out_.1s_ease-in]'

/** Row inside a Select / DropdownMenu; taller on touch screens. */
export const menuItem =
  'relative flex w-full cursor-pointer select-none items-center gap-2.5 rounded-full px-3.5 py-2 text-left text-sm outline-none transition-colors data-[highlighted]:bg-primary-soft data-[highlighted]:text-primary data-[state=checked]:font-semibold data-[state=checked]:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50 pointer-coarse:py-2.5 [&_svg]:size-4 [&_svg]:shrink-0'
