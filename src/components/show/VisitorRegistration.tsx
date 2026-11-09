/** Visitor registration → email OTP → (receipt / approval) → e-badge. BR-SHB-20/21/28. */
import { CheckCircle2, Clock, FileUp, Loader2, MailCheck, ShieldAlert } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { liveApi, tokens, USE_MOCK } from '@/api'
import { Dialog, DialogContent, useToast } from '@/components/ui/overlay'
import { useCancelRegistration } from '@/components/show/useCancelRegistration'
import { Captcha } from '@/components/ui/captcha'
import { useLiveCaptcha } from '@/components/ui/useLiveCaptcha'
import { Button, Field, Input, Req } from '@/components/ui/primitives'
import { Select } from '@/components/ui/select'
import type { Show } from '@/data/shows'
import { SELLER_BUYER_TYPES, VISITOR_TYPES } from '@/data/shows'
import { useI18n } from '@/lib/i18n'
import { useProfile } from '@/lib/profile'
import { newBadgeCode, type useShowVisitor, type VisitorBadge } from '@/lib/showReg'
import { useShowT } from '@/lib/showText'
import { cn, formatMoney } from '@/lib/utils'
import { tx } from '@/lib/tx'

type Visitor = ReturnType<typeof useShowVisitor>
const DEMO_OTP = '123456'
const MAX_TRIES = 5
const OTP_DIGITS = /^\d{6}$/
const CONFIRM_CODE_LENGTH = 12
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

/** Required mark: red asterisk. Optional fields get a muted hint instead. */
const req = (text: string): ReactNode => <>{text} <span className="text-destructive" aria-hidden>*</span></>
const optional = (text: string): ReactNode => <>{text} <span className="text-xs font-normal text-muted-foreground">· {tx('không bắt buộc', 'optional', '선택')}</span></>

export function BadgeCard({ show, badge }: { show: Show; badge: VisitorBadge }) {
  const { L } = useI18n()
  const x = useShowT()
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="bg-gradient-to-r from-navy to-navy-2 p-4 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gold-bright">{x.badgeLabel}</p>
        <p className="mt-1 line-clamp-2 text-sm font-bold leading-snug">{L(show.title)}</p>
      </div>
      <div className="flex items-center gap-4 p-4">
        <div className="min-w-0 text-sm">
          <p className="truncate text-base font-extrabold">{badge.name}</p>
          <p className="truncate text-muted-foreground">{badge.company || badge.email}</p>
          <p className="mt-2 text-xs text-muted-foreground">{x.reg.code}</p>
          <p className="font-mono text-lg font-bold tracking-wider">{badge.code}</p>
        </div>
      </div>
    </div>
  )
}

export function VisitorRegistration({ show, open, onOpenChange, visitor }: { show: Show; open: boolean; onOpenChange: (v: boolean) => void; visitor: Visitor }) {
  const { L, locale, t } = useI18n()
  const x = useShowT()
  const toast = useToast()
  const { session, profile } = useProfile()
  const paid = show.visitorTicketFee > 0
  // public registration goes through the sso captcha (enabled=false = none); the code lives 120s, so a fresh one per opening
  const captcha = useLiveCaptcha()
  const showCaptcha = !USE_MOCK && captcha.cap?.enabled !== false
  const [captchaText, setCaptchaText] = useState('')
  const cancelRegistration = useCancelRegistration(visitor)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', country: 'VN', visitorType: 'BUYER', businessType: 'TRADER', share: true, consent: false })
  const [err, setErr] = useState('')
  const [otp, setOtp] = useState('')
  const [tries, setTries] = useState(0)
  const [cooldown, setCooldown] = useState(0)
  const [receipt, setReceipt] = useState('')
  const [busy, setBusy] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [pending, setPending] = useState<{ code: string; visitorId: string; status: string; paymentToken?: string } | null>(null)
  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))
  const locked = tries >= MAX_TRIES

  // signed in: start from the profile; whatever the person already typed stays
  useEffect(() => {
    if (!session || !open) return
    const r = profile.registration
    setForm((f) => ({ ...f, name: f.name || r.repName, email: f.email || r.repEmail || r.email, phone: f.phone || r.repPhone || r.phone, company: f.company || session.companyName || profile.general.nameVi }))
  }, [session, profile, open])

  const { refresh: refreshCaptcha } = captcha
  useEffect(() => {
    if (open) refreshCaptcha()
  }, [open, refreshCaptcha])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const existing = visitor.badge
  const view = existing ? 3 : step

  const toOtp = () => {
    if (!form.name.trim() || !form.email.trim() || !form.consent) return setErr(x.reg.required)
    if (!emailOk(form.email)) return setErr(x.reg.invalidEmail)
    if (showCaptcha && !captchaText.trim()) return setErr(x.reg.required)
    setErr('')
    setOtp('')
    if (!USE_MOCK) {
      setBusy(true)
      liveApi.showRegisterVisitor(show.id, { ...form, phaseIds: show.phases.length > 1 ? show.phases.map((p) => p.id) : undefined, captchaId: captcha.cap?.captchaId, captchaAnswer: captchaText.trim() }).then(
        (r) => { setBusy(false); setCaptchaText(''); setPending({ code: '', visitorId: r.visitorId, status: r.badgeStatus ?? '' }); setCooldown(r.resendAfterSeconds); setStep(1) },
        // a captcha is single-use even when the answer was wrong: always show a new one
        (e: Error) => { setBusy(false); setErr(e.message); refreshCaptcha(); setCaptchaText('') },
      )
      return
    }
    setCooldown(30)
    setStep(1)
  }
  const verify = () => {
    if (locked) return
    if (!USE_MOCK) {
      setBusy(true)
      // the same box takes the code from the mail of someone who registered before: the BE answers a repeat like a new registration, so the page cannot tell which it is
      if (otp.length === CONFIRM_CODE_LENGTH) {
        liveApi.showRestoreVisitor(show.id, form.email, otp).then(
          (r) => { setBusy(false); setErr(''); visitor.restore(r) },
          (e: Error) => { setBusy(false); setTries((n) => n + 1); setErr(e.message) },
        )
        return
      }
      liveApi.showVerifyOtp(show.id, form.email, otp).then(
        (r) => {
          setBusy(false)
          setErr('')
          const status = (r.badgeStatus ?? 'ISSUED') as VisitorBadge['status']
          if (status === 'PENDING_PAYMENT') { setPending({ code: r.badgeCode, visitorId: r.visitorId, status, paymentToken: r.paymentToken }); return setStep(2) }
          visitor.saveBadge({ visitorId: r.visitorId, code: r.badgeCode, name: form.name, email: form.email, company: form.company, visitorType: form.visitorType, status, issuedAt: new Date().toISOString() })
          setStep(3)
        },
        (e: Error) => { setBusy(false); setTries((n) => n + 1); setErr(e.message) },
      )
      return
    }
    if (otp !== DEMO_OTP) {
      setTries((n) => n + 1)
      setErr(x.reg.wrong)
      return
    }
    setErr('')
    if (paid) return setStep(2)
    issue()
  }
  /** live: attach the receipt (signed in: own registration; guest: email + paymentToken from the OTP step); the badge stays PENDING_PAYMENT either way */
  const submitReceiptLive = () => {
    if (!pending) return
    setBusy(true)
    const save = () => { visitor.saveBadge({ visitorId: pending.visitorId, code: pending.code, name: form.name, email: form.email, company: form.company, visitorType: form.visitorType, status: 'PENDING_PAYMENT', issuedAt: new Date().toISOString() }); setBusy(false); setStep(3) }
    const guest = !tokens.access() && pending.paymentToken ? { email: form.email, paymentToken: pending.paymentToken } : undefined
    liveApi.showUploadReceipt(pending.visitorId, receiptFile!, guest).then(save, (e: Error) => { toast({ title: e.message, kind: 'info' }); save() })
  }
  const issue = (receiptPicked = false) => {
    setBusy(true)
    setTimeout(() => {
      const status = paid && receiptPicked ? 'PENDING_PAYMENT' : show.requireVisitorApproval ? 'PENDING_APPROVAL' : paid ? 'PENDING_PAYMENT' : 'ISSUED'
      visitor.saveBadge({ code: newBadgeCode(show.id), name: form.name, email: form.email, company: form.company, visitorType: form.visitorType, status, issuedAt: new Date().toISOString() })
      setBusy(false)
      setStep(3)
    }, 500)
  }

  const stepper = (
    <ol className="flex items-center gap-2 px-6 pt-4 text-xs font-semibold">
      {x.reg.steps.map((s, i) => (
        <li key={s} className={`flex items-center gap-2 ${view >= i ? 'text-primary' : 'text-muted-foreground'}`}>
          <span className={`grid size-5 place-items-center rounded-full text-[11px] ${view >= i ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{i + 1}</span>
          <span className="hidden sm:inline">{s}</span>
          {i < 2 && <span className="h-px w-5 bg-border" />}
        </li>
      ))}
    </ol>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={x.reg.title} description={L(show.title)}>
        {stepper}
        <div className="space-y-4 p-6">
          {view === 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={req(x.reg.name)} htmlFor="v-name"><Input id="v-name" placeholder={tx('VD: Nguyễn Văn An', 'e.g. Nguyen Van An', '예: Nguyen Van An')} value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
                <Field label={req(x.reg.email)} htmlFor="v-email" hint={x.reg.one}><Input id="v-email" placeholder={'ban@congty.vn'} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
                <Field label={optional(x.reg.phone)} htmlFor="v-phone"><Input id="v-phone" placeholder={tx('VD: 0912 345 678', 'e.g. +84 912 345 678', '예: +84 912 345 678')} value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
                <Field label={optional(x.reg.company)} htmlFor="v-co"><Input id="v-co" placeholder={tx('Tên công ty của bạn', 'Your company name', '회사명')} value={form.company} onChange={(e) => set('company', e.target.value)} /></Field>
                <Field label={optional(x.reg.visitorType)} htmlFor="v-type">
                  <Select id="v-type" value={form.visitorType} onValueChange={(v) => set('visitorType', v)} options={VISITOR_TYPES.map((v) => ({ value: v, label: x.reg.visitorTypes[v] }))} />
                </Field>
                <Field label={optional(x.reg.businessType)} htmlFor="v-bt">
                  <Select id="v-bt" value={form.businessType} onValueChange={(v) => set('businessType', v)} options={SELLER_BUYER_TYPES.map((v) => ({ value: v, label: x.reg.businessTypes[v] }))} />
                </Field>
              </div>
              {paid && <p className="rounded-lg bg-gold-soft p-3 text-sm text-gold">{x.fee}: <b>{formatMoney(show.visitorTicketFee, show.ticketCurrency, locale)}</b></p>}
              {show.requireVisitorApproval && <p className="rounded-lg bg-primary-soft p-3 text-sm text-primary">{x.needApproval}</p>}
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={form.share} onChange={(e) => set('share', e.target.checked)} /> {x.reg.shareContact}</label>
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} /> {x.reg.consent}<Req /></label>
              {showCaptcha && <Field label={`${t.auth.captcha} *`} htmlFor="captcha"><Captcha live={captcha} value={captchaText} onChange={setCaptchaText} /></Field>}
              {err && <p className="text-sm font-medium text-destructive">{err}</p>}
              <Button className="w-full" size="lg" disabled={busy} onClick={toOtp}><MailCheck /> {x.reg.sendOtp}</Button>
            </>
          )}

          {view === 1 && (
            <>
              <p className="text-sm text-muted-foreground">{x.reg.otpSent} <b className="text-foreground">{form.email}</b>. {USE_MOCK ? x.reg.otpHint : <>{x.reg.otpHintLive} {x.reg.registeredHint}</>}</p>
              <Input maxLength={CONFIRM_CODE_LENGTH} placeholder={tx('Mã trong email', 'Code from the email', '이메일 코드')} autoCapitalize="characters" autoComplete="one-time-code" value={otp} disabled={locked} onChange={(e) => setOtp(e.target.value.replace(/[^0-9a-z]/gi, '').toUpperCase())} className={cn('h-14 text-center font-mono', otp.length > 6 ? 'text-lg tracking-widest' : 'text-2xl tracking-[0.6em]')} aria-label={x.reg.codeInput} />
              {locked ? (
                <p className="flex items-center gap-2 text-sm font-medium text-destructive"><ShieldAlert className="size-4" /> {x.reg.locked}</p>
              ) : (
                err && <p className="text-sm font-medium text-destructive">{err} · {MAX_TRIES - tries} {x.reg.attemptsLeft}</p>
              )}
              <Button className="w-full" size="lg" disabled={!(OTP_DIGITS.test(otp) || otp.length === CONFIRM_CODE_LENGTH) || locked || busy} onClick={verify}>{busy ? <Loader2 className="animate-spin" /> : null} {x.reg.verify}</Button>
              <Button variant="ghost" className="w-full" disabled={cooldown > 0 || locked} onClick={() => {
                setOtp(''); setErr('')
                if (USE_MOCK) return setCooldown(30)
                liveApi.showResendOtp(show.id, form.email).then((r) => setCooldown(r.resendAfterSeconds), (e: Error) => setErr(e.message))
              }}>
                {cooldown > 0 ? `${x.reg.resendIn} ${cooldown}s` : x.reg.resend}
              </Button>
            </>
          )}

          {view === 2 && (
            <>
              <h3 className="font-bold">{x.reg.payTitle}</h3>
              <p className="text-sm text-muted-foreground">{x.reg.payDesc}</p>
              <div className="rounded-xl border bg-muted/50 p-4 text-sm">
                <p className="flex justify-between"><span className="text-muted-foreground">{x.fee}</span><b>{formatMoney(show.visitorTicketFee, show.ticketCurrency, locale)}</b></p>
                <p className="mt-1 flex justify-between"><span className="text-muted-foreground">Memo</span><b className="font-mono">{show.id.toUpperCase()} {form.email.split('@')[0]}</b></p>
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 text-sm hover:bg-muted/50">
                <FileUp className="size-5 text-primary" />
                <span className="min-w-0 flex-1 truncate">{receipt ? `${x.reg.receiptPicked}: ${receipt}` : x.reg.uploadReceipt}</span>
                <input type="file" accept="image/*,.pdf" className="sr-only" onChange={(e) => { setReceipt(e.target.files?.[0]?.name ?? ''); setReceiptFile(e.target.files?.[0] ?? null) }} />
              </label>
              <Button className="w-full" size="lg" disabled={!receipt || busy} onClick={() => (USE_MOCK ? issue(true) : submitReceiptLive())}>{busy ? <Loader2 className="animate-spin" /> : null} {x.reg.submitReceipt}</Button>
            </>
          )}

          {view === 3 && existing && (
            <>
              {existing.status === 'ISSUED' ? (
                <>
                  <p className="flex items-center gap-2 font-bold text-success"><CheckCircle2 className="size-5" /> {x.reg.doneTitle}</p>
                  <BadgeCard show={show} badge={existing} />
                  <p className="text-sm text-muted-foreground">{x.reg.doneDesc}</p>
                </>
              ) : (
                <div className="py-4 text-center">
                  <Clock className="mx-auto size-10 text-gold" />
                  <p className="mt-3 text-lg font-bold">{existing.status === 'PENDING_PAYMENT' ? x.reg.pendingPayTitle : x.reg.pendingApprovalTitle}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{existing.status === 'PENDING_PAYMENT' ? x.reg.pendingPayDesc : x.reg.pendingApprovalDesc}</p>
                </div>
              )}
              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => onOpenChange(false)}>OK</Button>
                <Button variant="outline" onClick={() => void cancelRegistration().then((done) => { if (done) { setStep(0); setTries(0); onOpenChange(false) } })}>{x.reg.cancelReg}</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
