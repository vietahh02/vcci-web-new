import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Quote, RefreshCw } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { categories } from '@/data/mock'
import { Logo } from '@/components/brand'
import { CountUp } from '@/components/effects'
import { LangSwitcher } from '@/components/layout/LangSwitcher'
import { useToast } from '@/components/ui/overlay'
import { Button, Field, Input, Select } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <LangSwitcher />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
        <p className="text-center text-xs text-muted-foreground">{t.footer.rights}</p>
      </div>
      <aside className="relative hidden overflow-hidden bg-navy text-white lg:block">
        <img src="/imgs/cang-bien.jpg" alt="" className="absolute inset-0 size-full animate-kenburns object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/30" />
        <div className="bg-grid absolute inset-0 opacity-40" />
        <div className="absolute -right-20 top-20 size-80 animate-aurora rounded-full bg-primary/40 blur-3xl" />
        <div className="relative flex h-full flex-col justify-end p-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <p className="text-5xl font-extrabold tracking-tight"><CountUp to={12400} format={(n) => Math.round(n).toLocaleString('vi-VN') + '+'} /></p>
            <p className="mt-2 text-lg font-semibold text-white/80">{t.auth.sideTitle}</p>
            <div className="glass-dark mt-8 max-w-lg rounded-2xl p-6">
              <Quote className="size-6 text-gold-bright" />
              <p className="mt-3 text-[17px] leading-relaxed">{t.auth.sideQuote}</p>
              <p className="mt-4 text-sm text-white/60">— {t.auth.sideAuthor}</p>
            </div>
          </motion.div>
        </div>
      </aside>
    </div>
  )
}

function PasswordInput({ id, placeholder }: { id: string; placeholder?: string }) {
  const { t } = useI18n()
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input id={id} type={show ? 'text' : 'password'} required minLength={8} placeholder={placeholder} className="pr-10" />
      <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:text-foreground" aria-label={t.ui.togglePassword}>
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

function Captcha() {
  const { t } = useI18n()
  const [code, setCode] = useState(() => Math.random().toString(36).slice(2, 7).toUpperCase())
  return (
    <div className="flex gap-2">
      <Input id="captcha" required placeholder="•••••" className="flex-1 uppercase tracking-[0.3em]" />
      <div className="relative grid h-10 w-28 select-none place-items-center overflow-hidden rounded-lg bg-[repeating-linear-gradient(45deg,var(--muted),var(--muted)_6px,var(--background)_6px,var(--background)_12px)] font-mono text-lg font-bold italic tracking-[0.25em] text-primary">
        {code}
      </div>
      <button type="button" onClick={() => setCode(Math.random().toString(36).slice(2, 7).toUpperCase())} className="grid size-10 place-items-center rounded-lg border hover:bg-muted" aria-label={t.ui.refreshCaptcha}>
        <RefreshCw className="size-4" />
      </button>
    </div>
  )
}

/** POST /api/auth/login (captcha from GET /api/auth/captcha) */
export function Login() {
  const { t } = useI18n()
  const toast = useToast()
  const navigate = useNavigate()
  return (
    <AuthShell>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold tracking-tight">{t.auth.loginTitle}</h1>
        <p className="mt-2 text-muted-foreground">{t.auth.loginSub}</p>
        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            toast({ kind: 'success', title: t.auth.loginTitle, description: t.common.demoNote })
            navigate('/')
          }}
        >
          <Field label={t.auth.email} htmlFor="email"><Input id="email" type="email" required autoComplete="email" placeholder="export@company.vn" /></Field>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="pw" className="mb-1.5 block text-[13px] font-semibold">{t.auth.password}</label>
              <a href="#" className="mb-1.5 text-xs font-semibold text-primary hover:underline">{t.auth.forgot}</a>
            </div>
            <PasswordInput id="pw" />
          </div>
          <Field label={t.auth.captcha} htmlFor="captcha"><Captcha /></Field>
          <Button type="submit" size="lg" className="w-full">{t.auth.loginTitle} <ArrowRight /></Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t.auth.noAccount} <Link to="/register" className="font-semibold text-primary hover:underline">{t.nav.register}</Link>
        </p>
      </motion.div>
    </AuthShell>
  )
}

/** POST /api/business/register — moderated PENDING → APPROVED/REJECTED */
export function Register() {
  const { t, L } = useI18n()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [done, setDone] = useState(false)
  const go = (n: number) => {
    setDir(n > step ? 1 : -1)
    setStep(n)
  }

  return (
    <AuthShell>
      {done ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 14 }} className="mx-auto grid size-16 place-items-center rounded-full bg-success text-white">
            <Check className="size-8" />
          </motion.div>
          <h1 className="mt-6 text-2xl font-extrabold">{t.auth.submitted}</h1>
          <p className="mt-2 text-muted-foreground">{t.auth.submittedDesc}</p>
          <Link to="/" className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground">{t.common.home} <ArrowRight className="size-4" /></Link>
        </motion.div>
      ) : (
        <>
          <h1 className="text-3xl font-extrabold tracking-tight">{t.auth.registerTitle}</h1>
          <p className="mt-2 text-muted-foreground">{t.auth.registerSub}</p>
          <div className="mt-7 flex gap-2">
            {t.auth.steps.map((s, i) => (
              <button key={s} type="button" onClick={() => i < step && go(i)} className="flex-1 text-left">
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <motion.div className="h-full bg-primary" initial={false} animate={{ width: i <= step ? '100%' : '0%' }} transition={{ duration: 0.45 }} />
                </div>
                <p className={cn('mt-2 text-xs font-semibold', i <= step ? 'text-foreground' : 'text-muted-foreground')}>{i + 1}. {s}</p>
              </button>
            ))}
          </div>

          <form
            className="mt-6 overflow-hidden"
            onSubmit={(e) => {
              e.preventDefault()
              if (step < 2) go(step + 1)
              else setDone(true)
            }}
          >
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                initial={{ opacity: 0, x: dir * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -40 }}
                transition={{ duration: 0.28 }}
                className="grid gap-4 sm:grid-cols-2"
              >
                {step === 0 && (
                  <>
                    <Field label={t.auth.businessName} htmlFor="bn" className="sm:col-span-2"><Input id="bn" required /></Field>
                    <Field label={t.auth.taxCode} htmlFor="tax"><Input id="tax" required inputMode="numeric" /></Field>
                    <Field label={t.auth.businessType} htmlFor="bt">
                      <Select id="bt" defaultValue="VN_EXPORTER">
                        {(Object.keys(t.supplier.types) as (keyof typeof t.supplier.types)[]).map((k) => <option key={k} value={k}>{t.supplier.types[k]}</option>)}
                      </Select>
                    </Field>
                    <Field label={t.auth.industry} htmlFor="ind">
                      <Select id="ind" defaultValue="">
                        <option value="" disabled>—</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{L(c.categoryName)}</option>)}
                      </Select>
                    </Field>
                    <Field label={t.auth.province} htmlFor="prov"><Input id="prov" required /></Field>
                    <Field label={t.auth.address} htmlFor="addr" className="sm:col-span-2"><Input id="addr" required /></Field>
                  </>
                )}
                {step === 1 && (
                  <>
                    <Field label={t.auth.repName} htmlFor="rn" className="sm:col-span-2"><Input id="rn" required /></Field>
                    <Field label={t.auth.position} htmlFor="pos"><Input id="pos" /></Field>
                    <Field label={t.auth.repPhone} htmlFor="rp"><Input id="rp" type="tel" required /></Field>
                    <Field label={t.auth.repEmail} htmlFor="re" className="sm:col-span-2"><Input id="re" type="email" required /></Field>
                  </>
                )}
                {step === 2 && (
                  <>
                    <Field label={t.auth.email} htmlFor="ae" className="sm:col-span-2"><Input id="ae" type="email" required /></Field>
                    <Field label={t.auth.password} htmlFor="ap"><PasswordInput id="ap" /></Field>
                    <Field label={t.auth.confirmPassword} htmlFor="ap2"><PasswordInput id="ap2" /></Field>
                    <label className="flex items-start gap-2.5 text-sm text-muted-foreground sm:col-span-2">
                      <input type="checkbox" required className="mt-0.5 size-4 accent-[var(--primary)]" /> {t.auth.agree}
                    </label>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
            <div className="mt-6 flex justify-between gap-3">
              {step > 0 ? <Button variant="ghost" onClick={() => go(step - 1)}><ArrowLeft /> {t.common.back}</Button> : <span />}
              <Button type="submit" size="lg">{step < 2 ? t.common.next : t.common.submit} <ArrowRight /></Button>
            </div>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t.auth.haveAccount} <Link to="/login" className="font-semibold text-primary hover:underline">{t.nav.login}</Link>
          </p>
        </>
      )}
    </AuthShell>
  )
}
