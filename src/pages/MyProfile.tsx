/** /account/profile — "Hồ sơ doanh nghiệp của tôi": fill once after sign-up, reused for every event. */
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, BadgeCheck, Check, CircleDashed, Info, Lock, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { useEffect, useMemo, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getEvent } from '@/api'
import { useToast } from '@/components/ui/overlay'
import { Button, buttonClass, Field, Input, Select, Textarea } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { completion, OPTIONS, SECTIONS, sectionDone, useProfile, type CompanyProfile, type Opt, type SectionKey, type VerifyStatus } from '@/lib/profile'
import { cn } from '@/lib/utils'
import { tx, withKo } from '@/lib/tx'
import { FileUpload, GalleryUpload, ImageUpload, UploadGuide } from '@/components/upload/Upload'
import type { RuleKey } from '@/lib/upload'

export default function MyProfile() {
  const { L } = useI18n()
  const { session, profile, update } = useProfile()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const active = (params.get('section') as SectionKey) || firstIncomplete(profile)
  const returnTo = params.get('return')
  const returnEvent = returnTo?.startsWith('/events/') ? getEvent(returnTo.split('/')[2] ?? '') : null
  const pct = completion(profile)
  const idx = SECTIONS.findIndex((s) => s.key === active)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [active])

  if (!session) return <SignInGate />

  const go = (key: SectionKey) => {
    const next = new URLSearchParams(params)
    next.set('section', key)
    setParams(next, { replace: true })
  }
  const saveAndNext = () => {
    toast({ kind: 'success', title: tx('Đã lưu', 'Saved'), description: L(SECTIONS[idx]!.title) })
    if (idx < SECTIONS.length - 1) go(SECTIONS[idx + 1]!.key)
    else if (returnTo) navigate(returnTo)
  }

  return (
    <div className="pb-10">
      {/* header band */}
      <section className="border-b bg-gradient-to-br from-primary-soft/70 via-background to-gold-soft/50">
        <div className="container-page flex flex-col gap-8 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{tx('Hồ sơ doanh nghiệp của tôi', 'My company profile')}</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">{profile.general.nameVi || session.companyName}</h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              {tx('Khai một lần — dùng cho mọi sự kiện. Hồ sơ càng đầy đủ, bạn càng được đăng ký sự kiện 1 chạm và được VCCI ưu tiên xét ghép đối tác.', 'Fill it once, reuse it for every event. A complete profile unlocks one-tap event registration and priority matchmaking by VCCI.')}
            </p>
          </div>
          <ProgressRing value={pct} label={tx('hoàn thiện', 'complete')} />
        </div>
        {returnEvent && (
          <div className="border-t bg-gold-soft/60">
            <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <span className="flex items-center gap-2"><Info className="size-4 text-gold" /> {tx('Bạn đang bổ sung hồ sơ để đăng ký', 'Completing your profile to register for')} <b>{L(returnEvent.title)}</b></span>
              <Link to={returnTo!} className="inline-flex items-center gap-1 font-semibold text-primary"><ArrowLeft className="size-4" /> {tx('Quay lại đăng ký', 'Back to registration')}</Link>
            </div>
          </div>
        )}
      </section>

      <div className="container-page mt-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* section nav */}
        <nav className="lg:sticky lg:top-32 lg:self-start">
          <ol className="no-scrollbar flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
            {SECTIONS.map((s, i) => {
              const done = sectionDone(profile, s.key)
              const on = s.key === active
              return (
                <li key={s.key} className="shrink-0">
                  <button onClick={() => go(s.key)} className={cn('relative flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors', on ? 'text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground')}>
                    {on && <motion.span layoutId="profile-nav" className="absolute inset-0 rounded-xl bg-card shadow-sm ring-1 ring-border" transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }} />}
                    <span className={cn('relative mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold', done ? 'bg-success text-white' : on ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                      {done ? <Check className="size-3.5" /> : i + 1}
                    </span>
                    <span className="relative hidden min-w-0 lg:block">
                      <span className="block text-sm font-semibold">{L(s.title)}</span>
                      <span className="block truncate text-xs text-muted-foreground">{L(s.hint)}</span>
                    </span>
                    <span className="relative text-sm font-semibold lg:hidden">{L(s.title)}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        {/* active section */}
        <div className="min-w-0 rounded-2xl border bg-card">
          <div className="flex items-start justify-between gap-4 border-b px-6 py-5 md:px-8">
            <div>
              <h2 className="text-xl font-bold">{L(SECTIONS[idx]!.title)}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{L(SECTIONS[idx]!.hint)}</p>
            </div>
            {sectionDone(profile, active) ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success"><Check className="size-3.5" /> {tx('Đã đủ', 'Complete')}</span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground"><CircleDashed className="size-3.5" /> {tx('Còn thiếu', 'Incomplete')}</span>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="px-6 py-7 md:px-8">
              {active === 'general' && <GeneralForm p={profile} set={(v) => update('general', v)} />}
              {active === 'capability' && <CapabilityForm p={profile} set={(v) => update('capability', v)} />}
              {active === 'media' && <MediaForm p={profile} set={(v) => update('media', v)} />}
              {active === 'exports' && <ExportsForm p={profile} set={(v) => update('exports', v)} />}
              {active === 'finance' && <FinanceForm p={profile} set={(v) => update('finance', v)} />}
              {active === 'needs' && <NeedsForm p={profile} set={(v) => update('needs', v)} />}
              {active === 'attendees' && <AttendeesForm p={profile} set={(v) => update('attendees', v)} />}
              {active === 'consent' && <ConsentForm p={profile} set={(v) => update('consent', v)} />}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between gap-3 border-t px-6 py-4 md:px-8">
            <Button variant="ghost" disabled={idx === 0} onClick={() => go(SECTIONS[idx - 1]!.key)}><ArrowLeft /> {tx('Phần trước', 'Previous')}</Button>
            <Button onClick={saveAndNext}>
              {idx < SECTIONS.length - 1 ? (tx('Lưu & tiếp tục', 'Save & continue')) : returnTo ? (tx('Lưu & quay lại đăng ký', 'Save & back to registration')) : (tx('Lưu', 'Save'))} <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const firstIncomplete = (p: CompanyProfile): SectionKey => SECTIONS.find((s) => !sectionDone(p, s.key))?.key ?? 'general'

/* ================================================================ building blocks */
function ProgressRing({ value, label }: { value: number; label: string }) {
  const r = 44
  const c = 2 * Math.PI * r
  return (
    <div className="relative grid size-32 shrink-0 place-items-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="7" />
        <motion.circle cx="50" cy="50" r={r} fill="none" stroke="var(--primary)" strokeWidth="7" strokeLinecap="round" strokeDasharray={c} initial={false} animate={{ strokeDashoffset: c - (c * value) / 100 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <div className="text-center">
        <p className="text-3xl font-extrabold tabular-nums">{value}%</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function Chips({ options, value, onChange, max }: { options: readonly Opt[]; value: string[]; onChange: (v: string[]) => void; max?: number }) {
  const { L } = useI18n()
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o.value)
          const disabled = !on && !!max && value.length >= max
          return (
            <button
              key={o.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
              className={cn('inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition', on ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/50 disabled:opacity-40')}
            >
              {on && <Check className="size-3.5" />}
              {L(o)}
            </button>
          )
        })}
      </div>
      {max && <p className="mt-2 text-xs text-muted-foreground">{tx(`Chọn tối đa ${max}`, `Choose up to ${max}`, `최대 ${max}개 선택`)} · {value.length}/{max}</p>}
    </div>
  )
}

function Choice({ options, value, onChange, cols = 2 }: { options: readonly Opt[]; value: string; onChange: (v: string) => void; cols?: 1 | 2 | 3 }) {
  const { L } = useI18n()
  return (
    <div className={cn('grid gap-2', cols === 3 ? 'sm:grid-cols-3' : cols === 2 ? 'sm:grid-cols-2' : '')}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn('flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-[13.5px] transition', value === o.value ? 'border-primary bg-primary-soft font-semibold text-primary' : 'hover:border-primary/40')}
        >
          <span className={cn('grid size-4 shrink-0 place-items-center rounded-full border-2', value === o.value ? 'border-primary' : 'border-input')}>
            {value === o.value && <span className="size-1.5 rounded-full bg-primary" />}
          </span>
          {L(o)}
        </button>
      ))}
    </div>
  )
}

function Q({ label, required, children, hint }: { label: string; required?: boolean; children: ReactNode; hint?: string }) {
  return (
    <div>
      <p className="mb-2.5 text-[14px] font-semibold">
        {label} {required && <span className="text-destructive">*</span>}
      </p>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/* ================================================================ sections */
type FP<K extends keyof CompanyProfile> = { p: CompanyProfile; set: (v: CompanyProfile[K]) => void }

function GeneralForm({ p, set }: FP<'general'>) {
  useI18n()
  const g = p.general
  const f = (k: keyof typeof g) => (e: { target: { value: string } }) => set({ ...g, [k]: e.target.value })
  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={(tx('Tên tiếng Việt', 'Vietnamese name')) + ' *'} htmlFor="g-vi"><Input id="g-vi" value={g.nameVi} onChange={f('nameVi')} /></Field>
        <Field label={(tx('Tên tiếng Anh', 'English name')) + ' *'} htmlFor="g-en"><Input id="g-en" value={g.nameEn} onChange={f('nameEn')} /></Field>
        <Field label={tx('Mã số thuế', 'Tax code')} htmlFor="g-tax" hint={tx('Lấy từ hồ sơ đăng ký, không sửa tại đây', 'From registration, read-only')}><Input id="g-tax" value={g.taxCode} readOnly className="bg-muted" /></Field>
        <Field label={tx('Năm thành lập', 'Year founded')} htmlFor="g-year"><Input id="g-year" inputMode="numeric" value={g.foundedYear} onChange={f('foundedYear')} /></Field>
      </div>
      <Q label={tx('Loại hình sở hữu', 'Ownership')} required><Choice cols={3} options={OPTIONS.ownership} value={g.ownership} onChange={(v) => set({ ...g, ownership: v })} /></Q>
      <Field label={tx('Các kênh online (website, fanpage, LinkedIn…)', 'Online channels (website, fanpage, LinkedIn…)')} htmlFor="g-ch"><Input id="g-ch" value={g.channels} onChange={f('channels')} /></Field>
      <Field label={tx('Địa chỉ nhà máy (nếu khác trụ sở)', 'Factory address (if different)')} htmlFor="g-fac"><Input id="g-fac" value={g.factoryAddress} onChange={f('factoryAddress')} /></Field>
      <Q label={tx('Doanh nghiệp do nữ làm chủ?', 'Women-owned business?')} hint={tx('≥51% vốn điều lệ thuộc nữ, hoặc nữ trực tiếp điều hành, hoặc >50% lao động là nữ', '≥51% female-owned, female-led, or >50% female workforce')}>
        <Choice cols={3} options={[withKo({ value: 'YES', vi: 'Có', en: 'Yes' }), withKo({ value: 'NO', vi: 'Không', en: 'No' })]} value={g.womenOwned} onChange={(v) => set({ ...g, womenOwned: v as 'YES' | 'NO' })} />
      </Q>
      <div>
        <p className="mb-3 text-[14px] font-semibold">{tx('Người liên hệ giao thương', 'Trade contact')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={(tx('Họ tên', 'Full name')) + ' *'} htmlFor="g-cn"><Input id="g-cn" value={g.contactName} onChange={f('contactName')} /></Field>
          <Field label={tx('Chức vụ', 'Title')} htmlFor="g-ct"><Input id="g-ct" value={g.contactTitle} onChange={f('contactTitle')} /></Field>
          <Field label={tx('Điện thoại / Zalo', 'Phone / Zalo')} htmlFor="g-cp"><Input id="g-cp" value={g.contactPhone} onChange={f('contactPhone')} /></Field>
          <Field label="Email *" htmlFor="g-ce"><Input id="g-ce" type="email" value={g.contactEmail} onChange={f('contactEmail')} /></Field>
        </div>
      </div>
    </div>
  )
}

function CapabilityForm({ p, set }: FP<'capability'>) {
  useI18n()
  const c = p.capability
  return (
    <div className="space-y-7">
      <Q label={tx('Lĩnh vực hoạt động chính', 'Main sectors')} required><Chips options={OPTIONS.sectors} value={c.sectors} onChange={(v) => set({ ...c, sectors: v })} /></Q>
      <Q label={tx('Tối đa 5 sản phẩm chủ lực', 'Up to 5 key products')} required>
        <div className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Input key={i} placeholder={`${tx('Sản phẩm', 'Product')} ${i + 1}`} value={c.mainProducts[i] ?? ''} onChange={(e) => { const m = [...c.mainProducts]; m[i] = e.target.value; set({ ...c, mainProducts: m }) }} />
          ))}
        </div>
      </Q>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={tx('Sản phẩm phục vụ ngành nào?', 'Industries served')} htmlFor="c-ind"><Textarea id="c-ind" className="min-h-20" value={c.servedIndustries} onChange={(e) => set({ ...c, servedIndustries: e.target.value })} /></Field>
        <Field label={tx('Khách hàng tiêu biểu', 'Key customers')} htmlFor="c-cus"><Textarea id="c-cus" className="min-h-20" value={c.keyCustomers} onChange={(e) => set({ ...c, keyCustomers: e.target.value })} /></Field>
      </div>
      <Q label={tx('Năng lực cung ứng hiện tại', 'Current supply capacity')} required><Choice options={OPTIONS.supplyCapacity} value={c.supplyCapacity} onChange={(v) => set({ ...c, supplyCapacity: v })} /></Q>
      <Q label={tx('Sản xuất theo thiết kế / thông số của khách hàng (OEM/ODM)?', 'Produce to customer design (OEM/ODM)?')} required><Choice options={OPTIONS.oem} value={c.oem} onChange={(v) => set({ ...c, oem: v })} /></Q>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={tx('Công suất / tháng', 'Monthly capacity')} htmlFor="c-cap" hint={tx('Số lượng + đơn vị', 'Quantity + unit')}><Input id="c-cap" value={c.monthlyCapacity} onChange={(e) => set({ ...c, monthlyCapacity: e.target.value })} /></Field>
        <Field label={tx('% dành cho xuất khẩu', '% for export')} htmlFor="c-pct"><Input id="c-pct" inputMode="numeric" value={c.exportCapacityPct} onChange={(e) => set({ ...c, exportCapacityPct: e.target.value })} /></Field>
        <Field label={(tx('Đơn hàng tối thiểu (MOQ)', 'Minimum order (MOQ)')) + ' *'} htmlFor="c-moq"><Input id="c-moq" value={c.moq} onChange={(e) => set({ ...c, moq: e.target.value })} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={tx('Diện tích nhà xưởng (m²)', 'Factory area (m²)', '공장 면적 (m²)')} htmlFor="c-area"><Input id="c-area" inputMode="numeric" value={c.factoryArea} onChange={(e) => set({ ...c, factoryArea: e.target.value })} /></Field>
        <Field label={tx('Số dây chuyền sản xuất', 'Production lines', '생산 라인 수')} htmlFor="c-lines"><Input id="c-lines" inputMode="numeric" value={c.productionLines} onChange={(e) => set({ ...c, productionLines: e.target.value })} /></Field>
      </div>
      <Field label={tx('Quy trình kiểm soát chất lượng', 'Quality control process', '품질 관리 절차')} htmlFor="c-qc" hint={tx('Mô tả ngắn: kiểm tra đầu vào, trong chuyền, thành phẩm, tiêu chuẩn AQL…', 'Short description: incoming, in-line and final inspection, AQL standard…', '간단히: 입고·공정·출하 검사, AQL 기준 등')}>
        <Textarea id="c-qc" className="min-h-20" value={c.qcProcess} onChange={(e) => set({ ...c, qcProcess: e.target.value })} />
      </Field>
      <Q label={tx('Chứng nhận chất lượng, kỹ thuật, môi trường', 'Quality, technical & environmental certificates')} hint={tx('Ưu tiên chứng nhận thị trường châu Âu. Chứng nhận hết hạn sẽ tự ẩn khỏi hồ sơ công khai.', 'EU-market certificates first. Expired certificates are hidden from the public profile.')}>
        <div className="space-y-2">
          {c.certificates.map((cert, i) => (
            <div key={i} className="space-y-2 rounded-xl border p-3">
              <div className="grid items-center gap-2 sm:grid-cols-[1.3fr_1fr_160px_auto]">
                <Input placeholder={tx('Tên chứng nhận', 'Certificate')} value={cert.name} onChange={(e) => { const l = [...c.certificates]; l[i] = { ...cert, name: e.target.value }; set({ ...c, certificates: l }) }} />
                <Input placeholder={tx('Đơn vị cấp', 'Issuer')} value={cert.issuer} onChange={(e) => { const l = [...c.certificates]; l[i] = { ...cert, issuer: e.target.value }; set({ ...c, certificates: l }) }} />
                <Input type="date" value={cert.expiry} onChange={(e) => { const l = [...c.certificates]; l[i] = { ...cert, expiry: e.target.value }; set({ ...c, certificates: l }) }} aria-label={tx('Hạn hiệu lực', 'Expiry')} />
                <button type="button" onClick={() => set({ ...c, certificates: c.certificates.filter((_, k) => k !== i) })} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="Remove"><Trash2 className="size-4" /></button>
              </div>
              <FilePick rule="certificate" compact name={cert.file} preview={cert.preview} onPick={(n, pv) => { const l = [...c.certificates]; l[i] = { ...cert, file: n, preview: pv }; set({ ...c, certificates: l }) }} />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => set({ ...c, certificates: [...c.certificates, { name: '', issuer: '', expiry: '', file: '' }] })}><Plus /> {tx('Thêm chứng nhận', 'Add certificate')}</Button>
        </div>
      </Q>
    </div>
  )
}

function ExportsForm({ p, set }: FP<'exports'>) {
  useI18n()
  const x = p.exports
  return (
    <div className="space-y-7">
      <Q label={tx('Tỷ trọng doanh thu xuất khẩu hiện nay', 'Export share of revenue')} required><Choice cols={3} options={OPTIONS.exportShare} value={x.exportShare} onChange={(v) => set({ ...x, exportShare: v })} /></Q>
      <Q label={tx('Đã xuất khẩu đến những thị trường nào?', 'Markets exported to')}><Chips options={OPTIONS.markets} value={x.markets} onChange={(v) => set({ ...x, markets: v })} /></Q>
      <Q label={tx('Hình thức xuất khẩu đã / đang thực hiện', 'Export modes')} required><Chips options={OPTIONS.exportModes} value={x.modes} onChange={(v) => set({ ...x, modes: v })} /></Q>
      <Q label={tx('Khả năng truy xuất nguồn gốc dòng sản phẩm xuất khẩu', 'Traceability of export products')} required><Choice cols={1} options={OPTIONS.traceability} value={x.traceability} onChange={(v) => set({ ...x, traceability: v })} /></Q>
      <Q label={tx('Đã từng làm việc với doanh nghiệp Đức / châu Âu?', 'Worked with German / EU companies?')} required><Choice cols={3} options={OPTIONS.euExperience} value={x.euExperience} onChange={(v) => set({ ...x, euExperience: v })} /></Q>
      <Q label={tx('Bằng chứng xuất khẩu (không bắt buộc)', 'Export evidence (optional)')} hint={tx('Tờ khai hải quan, hợp đồng + invoice, B/L. VCCI có thể đối chiếu với dữ liệu C/O do VCCI cấp.', 'Customs declarations, contract + invoice, B/L. VCCI can cross-check against C/O it has issued.')}>
        <FilePick rule="evidence" name={x.evidence} onPick={(n) => set({ ...x, evidence: n })} />
      </Q>
    </div>
  )
}

const STATUS_STYLE: Record<VerifyStatus, { cls: string; vi: string; en: string }> = {
  SELF: { cls: 'bg-muted text-muted-foreground', vi: 'Tự khai', en: 'Self-declared' },
  SUBMITTED: { cls: 'bg-primary-soft text-primary', vi: 'Đã nộp chứng từ', en: 'Evidence submitted' },
  VERIFIED: { cls: 'bg-success-soft text-success', vi: 'VCCI đã xác minh', en: 'Verified by VCCI' },
}

function FinanceForm({ p, set }: FP<'finance'>) {
  const { L } = useI18n()
  const fin = p.finance
  const row = (i: number, patch: Partial<(typeof fin.revenues)[number]>) => {
    const r = [...fin.revenues]
    const next = { ...r[i]!, ...patch }
    if (patch.proofFile && next.status === 'SELF') next.status = 'SUBMITTED'
    r[i] = next
    set({ ...fin, revenues: r })
  }
  return (
    <div className="space-y-7">
      <div className="flex gap-3 rounded-xl bg-muted/60 p-4 text-[13px] leading-relaxed text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          {tx('Số doanh thu chính xác và chứng từ chỉ VCCI xem để xác minh. Người mua chỉ thấy khoảng doanh thu (nếu bạn cho phép) kèm trạng thái xác minh. Doanh thu xuất khẩu có thể được đối chiếu với dữ liệu C/O do VCCI cấp.', 'Exact figures and documents are visible to VCCI only, for verification. Buyers see the revenue band (if you allow) and its verification status.')}
        </p>
      </div>

      <div className="space-y-3">
        {fin.revenues.map((r, i) => (
          <div key={r.year} className="rounded-xl border p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">{tx('Năm', 'Year')} {r.year}</p>
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold', STATUS_STYLE[r.status].cls)}>
                {r.status === 'VERIFIED' && <BadgeCheck className="size-3.5" />} {tx(STATUS_STYLE[r.status].vi, STATUS_STYLE[r.status].en)}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_140px_1.3fr]">
              <Select value={r.band} onChange={(e) => row(i, { band: e.target.value })} aria-label={tx('Khoảng doanh thu', 'Revenue band')}>
                <option value="">{tx('Khoảng doanh thu…', 'Revenue band…')}</option>
                {OPTIONS.revenueBand.map((o) => <option key={o.value} value={o.value}>{L(o)}</option>)}
              </Select>
              <Input placeholder={tx('Số chính xác (tỷ đ)', 'Exact (VND bn)')} inputMode="decimal" value={r.amount} onChange={(e) => row(i, { amount: e.target.value })} />
              <Select value={r.proofType} onChange={(e) => row(i, { proofType: e.target.value })} aria-label={tx('Loại chứng từ', 'Evidence type')}>
                <option value="">{tx('Loại chứng từ…', 'Evidence type…')}</option>
                {OPTIONS.revenueProof.map((o) => <option key={o.value} value={o.value}>{L(o)}</option>)}
              </Select>
            </div>
            <div className="mt-3"><FilePick rule="finance" compact name={r.proofFile} onPick={(n) => row(i, { proofFile: n })} /></div>
          </div>
        ))}
      </div>

      <Q label={tx('Hiển thị doanh thu trên hồ sơ công khai', 'Show revenue on public profile')}>
        <Choice options={[withKo({ value: 'BAND', vi: 'Hiện khoảng doanh thu + trạng thái xác minh', en: 'Show band + verification status' }), withKo({ value: 'HIDDEN', vi: 'Ẩn — chỉ VCCI xem', en: 'Hidden — VCCI only' })]} value={fin.visibility} onChange={(v) => set({ ...fin, visibility: v as 'BAND' | 'HIDDEN' })} />
      </Q>

      <div className="grid gap-3 sm:grid-cols-3">
        {(['SELF', 'SUBMITTED', 'VERIFIED'] as VerifyStatus[]).map((s, i) => (
          <div key={s} className="rounded-xl border p-4">
            <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold', STATUS_STYLE[s].cls)}>{tx(STATUS_STYLE[s].vi, STATUS_STYLE[s].en)}</span>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {[
                tx('Doanh nghiệp tự nhập, chưa có chứng từ.', 'Entered by the business, no evidence.'),
                tx('Đã tải chứng từ, chờ VCCI thẩm định.', 'Evidence uploaded, awaiting VCCI review.'),
                tx('VCCI đã đối chiếu chứng từ. Hiệu lực 12 tháng.', 'Checked by VCCI. Valid for 12 months.'),
              ][i]}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function NeedsForm({ p, set }: FP<'needs'>) {
  useI18n()
  const n = p.needs
  return (
    <div className="space-y-7">
      <Q label={tx('Loại đối tác muốn tìm', 'Partner types sought')} required><Chips max={3} options={OPTIONS.partnerTypes} value={n.partnerTypes} onChange={(v) => set({ ...n, partnerTypes: v })} /></Q>
      <Q label={tx('Cơ hội hợp tác quan tâm', 'Opportunities of interest')} required><Chips max={3} options={OPTIONS.opportunities} value={n.opportunities} onChange={(v) => set({ ...n, opportunities: v })} /></Q>
      <Q label={tx('Thị trường mục tiêu', 'Target markets')}><Chips options={OPTIONS.markets} value={n.targetMarkets} onChange={(v) => set({ ...n, targetMarkets: v })} /></Q>
      <Q label={tx('Mức độ sẵn sàng xuất khẩu', 'Export readiness')} required><Choice cols={1} options={OPTIONS.readiness} value={n.readiness} onChange={(v) => set({ ...n, readiness: v })} /></Q>
      <Q label={tx('Rào cản lớn nhất cần giải quyết', 'Biggest barriers')}><Chips options={OPTIONS.barriers} value={n.barriers} onChange={(v) => set({ ...n, barriers: v })} /></Q>
      <Q label={tx('Tài liệu doanh nghiệp đã có', 'Documents you already have')} hint={tx('Dùng để đánh giá mức sẵn sàng khi VCCI chắp mối đối tác', 'Used to assess readiness for matchmaking')}>
        <Chips options={OPTIONS.documents} value={n.documents} onChange={(v) => set({ ...n, documents: v })} />
      </Q>
      <Field label={tx('Nhu cầu cụ thể khác', 'Other specific needs')} htmlFor="n-note"><Textarea id="n-note" value={n.note} onChange={(e) => set({ ...n, note: e.target.value })} /></Field>
    </div>
  )
}

function AttendeesForm({ p, set }: FP<'attendees'>) {
  useI18n()
  const list = p.attendees
  const patch = (i: number, k: keyof (typeof list)[number], v: string) => { const l = [...list]; l[i] = { ...l[i]!, [k]: v }; set(l) }
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{tx('Khi đăng ký sự kiện, bạn chỉ cần tick chọn người tham dự. Link tham dự (Zoom/Jitsi) gửi tới email từng người.', 'When registering, just tick who attends. Join links go to each person’s email.')}</p>
      <AnimatePresence initial={false}>
        {list.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_1fr_1.2fr_1fr_auto]">
              <Input placeholder={tx('Họ tên', 'Full name')} value={a.name} onChange={(e) => patch(i, 'name', e.target.value)} />
              <Input placeholder={tx('Chức danh', 'Title')} value={a.title} onChange={(e) => patch(i, 'title', e.target.value)} />
              <Input placeholder="Email" type="email" value={a.email} onChange={(e) => patch(i, 'email', e.target.value)} />
              <Input placeholder={tx('Điện thoại', 'Phone')} value={a.phone} onChange={(e) => patch(i, 'phone', e.target.value)} />
              <button type="button" onClick={() => set(list.filter((_, k) => k !== i))} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="Remove"><Trash2 className="size-4" /></button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <Button variant="outline" onClick={() => set([...list, { id: `a${Date.now()}`, name: '', title: '', email: '', phone: '' }])}><Plus /> {tx('Thêm người tham dự', 'Add attendee')}</Button>
    </div>
  )
}

function ConsentForm({ p, set }: FP<'consent'>) {
  useI18n()
  const c = p.consent
  const Box = ({ k, title, body }: { k: keyof typeof c; title: string; body: string }) => (
    <label className={cn('flex cursor-pointer gap-4 rounded-xl border p-5 transition', c[k] ? 'border-primary bg-primary-soft/50' : 'hover:border-primary/40')}>
      <input type="checkbox" className="mt-1 size-4 accent-[var(--primary)]" checked={c[k]} onChange={(e) => set({ ...c, [k]: e.target.checked })} />
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{body}</span>
      </span>
    </label>
  )
  return (
    <div className="space-y-3">
      <Box
        k="dataUse"
        title={(tx('Đồng ý sử dụng thông tin để khảo sát, đánh giá và kết nối đối tác', 'Use my information for assessment and partner matching')) + ' *'}
        body={tx('Thông tin được bảo mật, không cung cấp cho bên thứ ba ngoài phạm vi chương trình khi chưa có sự đồng ý của doanh nghiệp.', 'Kept confidential and never shared outside the programme without your consent.')}
      />
      <Box
        k="media"
        title={tx('Đồng ý chụp ảnh, ghi hình khi tham dự sự kiện', 'Allow photos and recordings at events')}
        body={tx('Ban tổ chức được dùng tư liệu cho mục đích truyền thông, quảng bá và báo cáo sự kiện.', 'Organisers may use them for communication and event reports.')}
      />
      <p className="flex items-center gap-2 pt-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-success" /> {tx('Bạn có thể thay đổi lựa chọn bất cứ lúc nào.', 'You can change these at any time.')}</p>
    </div>
  )
}

/** Single-file upload bound to a name (+ optional image preview), with format guidance and validation. */
function FilePick({ name, preview, onPick, rule, compact }: { name: string; preview?: string; onPick: (n: string, preview?: string) => void; rule: RuleKey; compact?: boolean }) {
  useI18n()
  return (
    <FileUpload
      rule={rule}
      compact={compact}
      value={name ? { id: name, name, kind: rule, size: 0, preview } : null}
      onChange={(d) => onPick(d?.name ?? '', d?.preview)}
    />
  )
}

/* ---------------------------------------------------------------- photos & documents */
function MediaForm({ p, set }: FP<'media'>) {
  useI18n()
  const m = p.media
  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-[160px_minmax(0,1fr)]">
        <Q label={tx('Logo doanh nghiệp', 'Company logo', '기업 로고')} required>
          <ImageUpload rule="logo" value={m.logo} onChange={(v) => set({ ...m, logo: v })} />
        </Q>
        <Q label={tx('Ảnh bìa trang doanh nghiệp', 'Profile cover image', '프로필 커버 이미지')}>
          <ImageUpload rule="cover" value={m.cover} onChange={(v) => set({ ...m, cover: v })} />
        </Q>
      </div>
      <Q label={tx('Ảnh nhà xưởng, dây chuyền, kho, phòng QC', 'Factory, production line, warehouse & QC photos', '공장·생산 라인·창고·QC 사진')} required hint={tx('Tối thiểu 3 ảnh. Ảnh đầu tiên là ảnh chính trên hồ sơ năng lực.', 'At least 3 photos. The first one is the main capability photo.', '최소 3장. 첫 번째 사진이 대표 사진입니다.')}>
        <GalleryUpload value={m.gallery} onChange={(v) => set({ ...m, gallery: v })} />
      </Q>
      <Field label={tx('Video giới thiệu (YouTube / Vimeo)', 'Intro video (YouTube / Vimeo)', '소개 영상 (YouTube / Vimeo)')} htmlFor="m-video" hint={tx('Dán đường link, khuyến nghị 1–3 phút, có phụ đề tiếng Anh', 'Paste the link; 1–3 minutes with English subtitles recommended', '링크를 붙여넣으세요. 1–3분, 영어 자막 권장')}>
        <Input id="m-video" value={m.video} onChange={(e) => set({ ...m, video: e.target.value })} placeholder="https://www.youtube.com/watch?v=…" />
      </Field>
      <Q label={tx('Hồ sơ năng lực / Catalogue (PDF)', 'Company profile / Catalogue (PDF)', '회사 소개서 / 카탈로그 (PDF)')}>
        <div className="space-y-2">
          {m.documents.map((d) => (
            <FileUpload key={d.id} rule="brochure" compact value={d} onChange={(v) => set({ ...m, documents: v ? m.documents.map((x) => (x.id === d.id ? v : x)) : m.documents.filter((x) => x.id !== d.id) })} />
          ))}
          {m.documents.length < 4 && <FileUpload rule="brochure" value={null} onChange={(v) => v && set({ ...m, documents: [...m.documents, v] })} />}
        </div>
      </Q>
      <UploadGuide keys={['logo', 'cover', 'gallery', 'brochure', 'certificate']} />
    </div>
  )
}

function SignInGate() {
  useI18n()
  const { signIn } = useProfile()
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-20 text-center">
      <div className="max-w-md">
        <Lock className="mx-auto size-10 text-muted-foreground" />
        <h1 className="mt-5 text-2xl font-bold">{tx('Đăng nhập để quản lý hồ sơ doanh nghiệp', 'Sign in to manage your company profile')}</h1>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => signIn()}>{tx('Đăng nhập tài khoản demo', 'Sign in with demo account')}</Button>
          <Link to="/register" className={buttonClass('outline')}>{tx('Đăng ký', 'Register')}</Link>
        </div>
      </div>
    </div>
  )
}

export function useMissingSections(required: SectionKey[]) {
  const { profile } = useProfile()
  return useMemo(() => required.filter((k) => !sectionDone(profile, k)), [profile, required])
}
