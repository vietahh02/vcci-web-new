/** Captcha image from vcci-sso (GET /api/auth/captcha), shared by sign-in and the public show registration. */
import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { USE_MOCK } from '@/api'
import type { useLiveCaptcha } from '@/components/ui/useLiveCaptcha'
import { Input } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'

/** Uncontrolled (read `name="captcha"` from the form) unless `value` / `onChange` are given. */
export function Captcha({ live, value, onChange }: { live?: ReturnType<typeof useLiveCaptcha>; value?: string; onChange?: (v: string) => void }) {
  const { t } = useI18n()
  const [code, setCode] = useState(() => Math.random().toString(36).slice(2, 7).toUpperCase())
  const remote = !USE_MOCK && live
  return (
    <div className="flex gap-2">
      <Input id="captcha" name="captcha" required placeholder="•••••" className="flex-1 uppercase tracking-[0.3em]"
        {...(onChange ? { value: value ?? '', onChange: (e) => onChange(e.target.value) } : {})} />
      <div className="relative grid h-10 w-28 select-none place-items-center overflow-hidden rounded-lg bg-[repeating-linear-gradient(45deg,var(--muted),var(--muted)_6px,var(--background)_6px,var(--background)_12px)] font-mono text-lg font-bold italic tracking-[0.25em] text-primary">
        {remote ? (live.cap?.image ? <img src={live.cap.image} alt="" className="size-full object-contain" /> : '…') : code}
      </div>
      <button type="button" onClick={() => (remote ? live.refresh() : setCode(Math.random().toString(36).slice(2, 7).toUpperCase()))} className="grid size-10 place-items-center rounded-lg border hover:bg-muted" aria-label={t.ui.refreshCaptcha}>
        <RefreshCw className="size-4" />
      </button>
    </div>
  )
}
