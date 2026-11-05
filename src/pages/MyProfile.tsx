/** /account/profile — "Hồ sơ doanh nghiệp của tôi": fill once after sign-up, reused for every event. */
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, ArrowLeft, ArrowRight, BadgeCheck, Check, Info, Lock, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { liveApi, USE_MOCK, useEvent } from '@/api'
import { useToast } from '@/components/ui/overlay'
import { Button, buttonClass, Field, Input, Textarea } from '@/components/ui/primitives'
import { DateField } from '@/components/ui/DateField'
import { Select } from '@/components/ui/select'
import { useI18n } from '@/lib/i18n'
import { BUSINESS_FORMS, completion, OPTIONS, PROFILE_TABS, sectionDone, tabDone, tabSection, useProfile, type CompanyProfile, type Opt, type ProfileTab, type SectionKey, type VerifyStatus } from '@/lib/profile'
import { cn } from '@/lib/utils'
import { tx, withKo } from '@/lib/tx'
import { FileUpload, GalleryUpload, ImageUpload, UploadGuide } from '@/components/upload/Upload'
import { uploadPending } from '@/api/uploads'
import { BranchesFields, LeadersFields } from '@/components/profile/KeyLeadersFields'
import type { RuleKey } from '@/lib/upload'

export default function MyProfile() {
  const { L } = useI18n()
  const { session, profile, update, remoteStatus, loadRemote } = useProfile()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  // chốt tab mặc định một lần (khi đã có hồ sơ): tính lại theo profile thì form nhảy tab ngay khi đang gõ
  const defaultTab = useRef<ProfileTab | null>(null)
  if (session && !defaultTab.current) defaultTab.current = firstIncomplete(profile)
  const active = (params.get('section') as ProfileTab) || defaultTab.current || 'general'
  const returnTo = params.get('return')
  const returnEvent = useEvent(returnTo?.startsWith('/events/') ? (returnTo.split('/')[2] ?? '') : '').data ?? null
  const pct = completion(profile)
  const idx = PROFILE_TABS.findIndex((s) => s.key === active)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [active])
  // mobile: the section strip scrolls sideways; bring the active chip to the middle of it
  const navRef = useRef<HTMLOListElement>(null)
  useEffect(() => {
    const strip = navRef.current
    const chip = strip?.querySelector<HTMLElement>('[data-on="true"]')
    if (!strip || !chip || strip.scrollWidth <= strip.clientWidth) return
    const delta = chip.getBoundingClientRect().left - strip.getBoundingClientRect().left - (strip.clientWidth - chip.offsetWidth) / 2
    strip.scrollBy({ left: delta, behavior: 'smooth' })
  }, [active])

  if (!session) return <SignInGate />

  const go = (key: ProfileTab) => {
    const next = new URLSearchParams(params)
    next.set('section', key)
    setParams(next, { replace: true })
  }
  const proceed = () => {
    toast({ kind: 'success', title: tx('Đã lưu', 'Saved'), description: L(PROFILE_TABS[idx]!.title) })
    if (idx < PROFILE_TABS.length - 1) go(PROFILE_TABS[idx + 1]!.key)
    else if (returnTo) navigate(returnTo)
  }
  // live: PUT /api/me/profile/{section}; the BE accepts incomplete data (BR-PRF-01) and computes completion
  const saveAndNext = () => {
    if (USE_MOCK) return proceed()
    setSaving(true)
    const section = tabSection(active)
    uploadPending(profile[section])
      .then((data) => { update(section, data); return liveApi.saveProfileSection(section, data) })
      .then(proceed, (err: Error) => toast({ kind: 'info', title: err.message }))
      .finally(() => setSaving(false))
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
        {!USE_MOCK && remoteStatus && remoteStatus.orgStatus !== 'APPROVED' && (
          <div className={cn('border-t', remoteStatus.orgStatus === 'REJECTED' ? 'bg-destructive/10' : 'bg-gold-soft/60')}>
            <div className="container-page flex flex-wrap items-center justify-between gap-3 py-4">
              <span className={cn('flex items-center gap-3 text-[15px] font-semibold', remoteStatus.orgStatus === 'REJECTED' ? 'text-destructive' : 'text-[#7a5600]')}>
                <span className={cn('grid size-9 shrink-0 place-items-center rounded-full text-white shadow-md', remoteStatus.orgStatus === 'REJECTED' ? 'bg-destructive' : 'bg-gradient-to-b from-[#f2d36b] to-[#d9a62a] text-[#2b1d00]')}><AlertTriangle className="size-5" /></span>
                {remoteStatus.orgStatus === 'REJECTED'
                  ? <>{tx('Hồ sơ doanh nghiệp bị từ chối', 'Your company registration was rejected', '기업 등록이 거절되었습니다')}{remoteStatus.statusReason ? <>: <b>{remoteStatus.statusReason}</b></> : null}</>
                  : tx('Hồ sơ đang chờ VCCI duyệt. Bạn vẫn có thể hoàn thiện hồ sơ năng lực.', 'Your registration is awaiting VCCI approval. You can keep completing your profile.', 'VCCI 승인 대기 중입니다. 프로필은 계속 작성할 수 있습니다.')}
              </span>
              {remoteStatus.orgStatus === 'REJECTED' && (
                <Button size="sm" onClick={() => liveApi.resubmitProfile().then(() => loadRemote(), (err: Error) => toast({ kind: 'info', title: err.message }))}>
                  {tx('Chỉnh sửa xong, nộp lại', 'Resubmit for review', '수정 후 재제출')}
                </Button>
              )}
            </div>
          </div>
        )}
        {returnEvent && (
          <div className="border-t bg-gold-soft/60">
            <div className="container-page flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <span className="flex items-center gap-2"><Info className="size-4 text-gold" /> {tx('Bạn đang bổ sung hồ sơ để đăng ký', 'Completing your profile to register for')} <b>{L(returnEvent.title)}</b></span>
              <Link to={returnTo!} className="inline-flex items-center gap-1 font-semibold text-primary"><ArrowLeft className="size-4" /> {tx('Quay lại đăng ký', 'Back to registration')}</Link>
            </div>
          </div>
        )}
      </section>

      <div className="container-page mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
        {/* section nav */}
        <nav className="min-w-0 lg:sticky lg:top-32 lg:self-start">
          {/* overflow-x cắt cả viền và shadow của mục đang chọn: mobile chừa p-1, desktop không cuộn nên tắt hẳn */}
          <ol className="no-scrollbar -m-1 flex gap-2 overflow-x-auto p-1 lg:m-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:p-0">
            {PROFILE_TABS.map((s, i) => {
              const done = tabDone(profile, s.key)
              const on = s.key === active
              return (
                <li key={s.key} className="shrink-0">
                  <button data-on={on} onClick={() => go(s.key)} className={cn('relative flex w-full items-start gap-3 rounded-3xl px-3 text-left transition-all duration-300', on ? 'py-2 text-foreground lg:py-4' : 'py-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground lg:py-3', 'max-lg:w-auto max-lg:items-center max-lg:whitespace-nowrap max-lg:px-3.5')}>
                    {on && <motion.span layoutId="profile-nav" className="absolute inset-0 rounded-3xl border-2 border-primary/60 bg-card shadow-lg shadow-primary/10" transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }} />}
                    <span className={cn('relative mt-0.5 grid shrink-0 place-items-center rounded-full font-bold transition-all duration-300', on ? 'size-6 text-[11px] shadow-md shadow-primary/30 lg:size-9 lg:text-sm' : 'size-6 text-[11px]', done ? 'bg-success text-white' : on ? 'bg-gradient-to-b from-[#1a8cc4] to-primary text-primary-foreground' : 'bg-muted')}>
                      {done ? <Check className="size-3.5" /> : i + 1}
                    </span>
                    <span className="relative hidden min-w-0 lg:block">
                      <span className={cn("block text-sm font-semibold transition-colors", on && "text-primary")}>{L(s.title)}</span>
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
          <div className="flex items-start justify-between gap-4 border-b px-4 py-4 sm:px-6 sm:py-5 md:px-8">
            <div className="min-w-0">
              <h2 className="text-xl font-bold">{L(PROFILE_TABS[idx]!.title)}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{L(PROFILE_TABS[idx]!.hint)}</p>
            </div>
            {tabDone(profile, active) ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success"><Check className="size-3.5" /> {tx('Đã đủ', 'Complete')}</span>
            ) : (
              <span className="inline-flex shrink-0 animate-pulse items-center gap-2 rounded-full bg-gradient-to-b from-[#f2d36b] to-[#d9a62a] px-4 py-2 text-sm font-bold text-[#2b1d00] shadow-lg shadow-amber-500/30 [animation-duration:2.5s]"><AlertTriangle className="size-4" /> {tx('Còn thiếu thông tin', 'Incomplete')}</span>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="px-4 py-6 sm:px-6 sm:py-7 md:px-8">
              {active === 'general' && <GeneralForm p={profile} set={(v) => update('general', v)} />}
              {active === 'members' && <MembersForm p={profile} set={(v) => update('general', v)} />}
              {active === 'capability' && <CapabilityForm p={profile} set={(v) => update('capability', v)} />}
              {active === 'media' && <MediaForm p={profile} set={(v) => update('media', v)} />}
              {active === 'exports' && <ExportsForm p={profile} set={(v) => update('exports', v)} />}
              {active === 'finance' && <FinanceForm p={profile} set={(v) => update('finance', v)} />}
              {active === 'needs' && <NeedsForm p={profile} set={(v) => update('needs', v)} />}
              {active === 'attendees' && <AttendeesForm p={profile} set={(v) => update('attendees', v)} />}
              {active === 'consent' && <ConsentForm p={profile} set={(v) => update('consent', v)} />}
            </motion.div>
          </AnimatePresence>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4 sm:px-6 md:px-8">
            <Button variant="ghost" disabled={idx === 0} onClick={() => go(PROFILE_TABS[idx - 1]!.key)}><ArrowLeft /> {tx('Phần trước', 'Previous')}</Button>
            <Button onClick={saveAndNext} disabled={saving}>
              {idx < PROFILE_TABS.length - 1 ? (tx('Lưu & tiếp tục', 'Save & continue')) : returnTo ? (tx('Lưu & quay lại đăng ký', 'Save & back to registration')) : (tx('Lưu', 'Save'))} <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const firstIncomplete = (p: CompanyProfile): ProfileTab => PROFILE_TABS.find((s) => !tabDone(p, s.key))?.key ?? 'general'

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

/** Nhãn các trường lấy từ hồ sơ đăng ký, chỉ đọc ở trang hồ sơ. */
function useRegistrationLabels(p: CompanyProfile) {
  const { t, L } = useI18n()
  const reg = p.registration
  const form = BUSINESS_FORMS.find((x) => x.value === reg.businessForm)
  return {
    fromReg: tx('Lấy từ hồ sơ đăng ký, không sửa tại đây', 'From registration, read-only', '등록 정보, 수정 불가'),
    businessType: t.supplier.types[reg.businessType as keyof typeof t.supplier.types] ?? '—',
    businessForm: (reg.businessForm === 'OTHER' && reg.otherBusinessForm) || (form ? L(form) : '—'),
    industries: reg.industries.map((v) => { const o = OPTIONS.industries.find((x) => x.value === v); return o ? L(o) : v }).join(', ') || '—',
  }
}

function GeneralForm({ p, set }: FP<'general'>) {
  const g = p.general
  const reg = p.registration
  const { fromReg, businessType, businessForm } = useRegistrationLabels(p)
  const f = (k: keyof typeof g) => (e: { target: { value: string } }) => set({ ...g, [k]: e.target.value })
  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={(tx('Tên tiếng Việt', 'Vietnamese name')) + ' *'} htmlFor="g-vi"><Input id="g-vi" placeholder={tx('VD: Công ty TNHH ABC', 'e.g. Công ty TNHH ABC', '예: Công ty TNHH ABC')} value={g.nameVi} onChange={f('nameVi')} /></Field>
        <Field label={(tx('Tên tiếng Anh', 'English name')) + ' *'} htmlFor="g-en"><Input id="g-en" placeholder={tx('VD: ABC Import Export Co., Ltd.', 'e.g. ABC Import Export Co., Ltd.', '예: ABC Import Export Co., Ltd.')} value={g.nameEn} onChange={f('nameEn')} /></Field>
        <Field label={tx('Tên viết tắt', 'Short name', '약칭')} htmlFor="g-short"><Input id="g-short" maxLength={255} placeholder={tx('VD: SOUTHWOOD', 'e.g. SOUTHWOOD', '예: SOUTHWOOD')} value={g.shortName} onChange={f('shortName')} /></Field>
        <Field label={tx('Mã số thuế', 'Tax code')} htmlFor="g-tax" hint={tx('Lấy từ hồ sơ đăng ký, không sửa tại đây', 'From registration, read-only')}><Input id="g-tax" value={g.taxCode} readOnly className="bg-muted" /></Field>
        <Field label={tx('Năm thành lập', 'Year founded')} htmlFor="g-year"><Input id="g-year" placeholder={tx('VD: 2010', 'e.g. 2010', '예: 2010')} inputMode="numeric" value={g.foundedYear} onChange={f('foundedYear')} /></Field>
        <Field label={tx('Tổng tài sản', 'Total assets', '총자산') + ` (${reg.totalAssetsCurrency || reg.charterCurrency || 'VND'})`} htmlFor="g-assets" hint={tx('Chỉ nhập số', 'Digits only', '숫자만 입력')}><Input id="g-assets" placeholder={tx('VD: 50000000000', 'e.g. 50000000000', '예: 50000000000')} inputMode="numeric" maxLength={30} value={g.totalAssets} onChange={(e) => set({ ...g, totalAssets: e.target.value.replace(/\D/g, '') })} /></Field>
        <Field label={tx('Loại hình hoạt động', 'Business type', '사업 유형')} htmlFor="g-type" hint={tx('Lấy từ hồ sơ đăng ký, không sửa tại đây', 'From registration, read-only')} className="sm:col-span-2"><Input id="g-type" value={businessType} readOnly className="bg-muted" /></Field>
      </div>
      <div>
        <p className="mb-3 text-[14px] font-semibold">{tx('Đăng ký kinh doanh', 'Business registration', '사업자 등록')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {reg.businessRegNo && (
            <>
              <Field label={tx('Số đăng ký kinh doanh', 'Registration number', '등록 번호')} htmlFor="g-regno" hint={fromReg}><Input id="g-regno" value={reg.businessRegNo} readOnly className="bg-muted" /></Field>
              <Field label={tx('Ngày cấp', 'Issue date', '발급일')} htmlFor="g-regdate" hint={fromReg}><Input id="g-regdate" type="date" value={reg.businessRegDate} readOnly className="bg-muted" /></Field>
              <Field label={tx('Nơi cấp', 'Issued by', '발급 기관')} htmlFor="g-regplace" hint={fromReg}><Input id="g-regplace" value={reg.businessRegPlace} readOnly className="bg-muted" /></Field>
            </>
          )}
          <Field label={tx('Loại hình doanh nghiệp', 'Legal form', '기업 형태')} htmlFor="g-form" hint={fromReg}><Input id="g-form" value={businessForm} readOnly className="bg-muted" /></Field>
        </div>
      </div>
      <Q label={tx('Loại hình sở hữu', 'Ownership')} required><Choice cols={3} options={OPTIONS.ownership} value={g.ownership} onChange={(v) => set({ ...g, ownership: v })} /></Q>
      <Field label={tx('Các kênh online (website, fanpage, LinkedIn…)', 'Online channels (website, fanpage, LinkedIn…)')} htmlFor="g-ch"><Input id="g-ch" placeholder={tx('VD: https://company.vn, facebook.com/company', 'e.g. https://company.vn, facebook.com/company', '예: https://company.vn, facebook.com/company')} value={g.channels} onChange={f('channels')} /></Field>
      <Field label={tx('Địa chỉ nhà máy (nếu khác trụ sở)', 'Factory address (if different)')} htmlFor="g-fac"><Input id="g-fac" placeholder={tx('VD: Lô A1, KCN ABC, tỉnh Bắc Ninh', 'e.g. Lot A1, ABC Industrial Park, Bac Ninh', '예: Lot A1, ABC Industrial Park, Bac Ninh')} value={g.factoryAddress} onChange={f('factoryAddress')} /></Field>
      <Q label={tx('Doanh nghiệp do nữ làm chủ?', 'Women-owned business?')} hint={tx('≥51% vốn điều lệ thuộc nữ, hoặc nữ trực tiếp điều hành, hoặc >50% lao động là nữ', '≥51% female-owned, female-led, or >50% female workforce')}>
        <Choice cols={3} options={[withKo({ value: 'YES', vi: 'Có', en: 'Yes' }), withKo({ value: 'NO', vi: 'Không', en: 'No' })]} value={g.womenOwned} onChange={(v) => set({ ...g, womenOwned: v as 'YES' | 'NO' })} />
      </Q>
      <div className="grid gap-4 sm:grid-cols-2">
        <BranchesFields value={g.branches} onChange={(v) => set({ ...g, branches: v })} />
      </div>
    </div>
  )
}

/* Dữ liệu vẫn thuộc mục general (không có section riêng ở BE), chỉ tách tab hiển thị. */
function MembersForm({ p, set }: FP<'general'>) {
  const g = p.general
  const f = (k: keyof typeof g) => (e: { target: { value: string } }) => set({ ...g, [k]: e.target.value })
  return (
    <div className="space-y-7">
      <div>
        <p className="mb-3 text-[14px] font-semibold">{tx('Người liên hệ #1 (giao thương)', 'Contact person #1 (trade)', '담당자 #1 (거래)')}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={(tx('Họ tên', 'Full name')) + ' *'} htmlFor="g-cn"><Input id="g-cn" placeholder={tx('VD: Nguyễn Văn A', 'e.g. Nguyen Van A', '예: Nguyen Van A')} value={g.contactName} onChange={f('contactName')} /></Field>
          <Field label={tx('Chức vụ', 'Title')} htmlFor="g-ct"><Input id="g-ct" placeholder={tx('VD: Trưởng phòng Kinh doanh', 'e.g. Sales Manager', '예: 영업 팀장')} value={g.contactTitle} onChange={f('contactTitle')} /></Field>
          <Field label={tx('Điện thoại / Zalo', 'Phone / Zalo')} htmlFor="g-cp"><Input id="g-cp" placeholder={tx('VD: 0912 345 678', 'e.g. 0912 345 678', '예: 0912 345 678')} value={g.contactPhone} onChange={f('contactPhone')} /></Field>
          <Field label="Email *" htmlFor="g-ce"><Input id="g-ce" placeholder={tx('VD: ten@company.vn', 'e.g. name@company.vn', '예: name@company.vn')} type="email" value={g.contactEmail} onChange={f('contactEmail')} /></Field>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <p className="text-[14px] font-semibold sm:col-span-2">{tx('Lãnh đạo chủ chốt', 'Key leaders', '주요 경영진')}</p>
        <LeadersFields omit="contact1" value={g.keyLeaders} onChange={(role, field, v) => set({ ...g, keyLeaders: { ...g.keyLeaders, [role]: { ...g.keyLeaders[role], [field]: v } } })} />
      </div>
    </div>
  )
}

function CapabilityForm({ p, set }: FP<'capability'>) {
  useI18n()
  const c = p.capability
  const { fromReg, businessType, businessForm, industries } = useRegistrationLabels(p)
  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={tx('Loại hình doanh nghiệp', 'Legal form', '기업 형태')} htmlFor="c-form" hint={fromReg}><Input id="c-form" value={businessForm} readOnly className="bg-muted" /></Field>
        <Field label={tx('Hình thức doanh nghiệp', 'Business type', '사업 유형')} htmlFor="c-type" hint={fromReg}><Input id="c-type" value={businessType} readOnly className="bg-muted" /></Field>
        <Field label={tx('Ngành hàng', 'Industries', '업종')} htmlFor="c-ind" hint={fromReg} className="sm:col-span-2"><Input id="c-ind" value={industries} readOnly className="bg-muted" /></Field>
      </div>
      <Q label={tx('Tối đa 5 sản phẩm chủ lực', 'Up to 5 key products')} required>
        <div className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Input key={i} placeholder={`${tx('Sản phẩm', 'Product')} ${i + 1}`} value={c.mainProducts[i] ?? ''} onChange={(e) => { const m = [...c.mainProducts]; m[i] = e.target.value; set({ ...c, mainProducts: m }) }} />
          ))}
        </div>
      </Q>
      <Q label={tx('Năng lực cung ứng hiện tại', 'Current supply capacity')} required><Choice options={OPTIONS.supplyCapacity} value={c.supplyCapacity} onChange={(v) => set({ ...c, supplyCapacity: v })} /></Q>
      <Q label={tx('Sản xuất theo thiết kế / thông số của khách hàng (OEM/ODM)?', 'Produce to customer design (OEM/ODM)?')} required><Choice options={OPTIONS.oem} value={c.oem} onChange={(v) => set({ ...c, oem: v })} /></Q>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={tx('Công suất / tháng', 'Monthly capacity')} htmlFor="c-cap" hint={tx('Số lượng + đơn vị', 'Quantity + unit')}><Input id="c-cap" placeholder={tx('VD: 20.000 sản phẩm', 'e.g. 20,000 units', '예: 20,000개')} value={c.monthlyCapacity} onChange={(e) => set({ ...c, monthlyCapacity: e.target.value })} /></Field>
        <Field label={tx('% dành cho xuất khẩu', '% for export')} htmlFor="c-pct"><Input id="c-pct" placeholder={tx('VD: 60', 'e.g. 60', '예: 60')} inputMode="numeric" value={c.exportCapacityPct} onChange={(e) => set({ ...c, exportCapacityPct: e.target.value })} /></Field>
        <Field label={(tx('Đơn hàng tối thiểu (MOQ)', 'Minimum order (MOQ)')) + ' *'} htmlFor="c-moq"><Input id="c-moq" placeholder={tx('VD: 500 sản phẩm', 'e.g. 500 units', '예: 500개')} value={c.moq} onChange={(e) => set({ ...c, moq: e.target.value })} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={tx('Diện tích nhà xưởng (m²)', 'Factory area (m²)', '공장 면적 (m²)')} htmlFor="c-area"><Input id="c-area" placeholder={tx('VD: 5000', 'e.g. 5000', '예: 5000')} inputMode="numeric" value={c.factoryArea} onChange={(e) => set({ ...c, factoryArea: e.target.value })} /></Field>
        <Field label={tx('Số dây chuyền sản xuất', 'Production lines', '생산 라인 수')} htmlFor="c-lines"><Input id="c-lines" placeholder={tx('VD: 3', 'e.g. 3', '예: 3')} inputMode="numeric" value={c.productionLines} onChange={(e) => set({ ...c, productionLines: e.target.value })} /></Field>
      </div>
      <Field label={tx('Quy trình kiểm soát chất lượng', 'Quality control process', '품질 관리 절차')} htmlFor="c-qc" hint={tx('Mô tả ngắn: kiểm tra đầu vào, trong chuyền, thành phẩm, tiêu chuẩn AQL…', 'Short description: incoming, in-line and final inspection, AQL standard…', '간단히: 입고·공정·출하 검사, AQL 기준 등')}>
        <Textarea id="c-qc" placeholder={tx('VD: Kiểm tra nguyên liệu đầu vào, kiểm tra trong chuyền, kiểm tra thành phẩm theo AQL 2.5', 'e.g. Incoming material checks, in-line inspection, final inspection to AQL 2.5', '예: 입고 자재 검사, 공정 검사, AQL 2.5 기준 출하 검사')} className="min-h-20" value={c.qcProcess} onChange={(e) => set({ ...c, qcProcess: e.target.value })} />
      </Field>
      <Q label={tx('Chứng nhận chất lượng, kỹ thuật, môi trường', 'Quality, technical & environmental certificates')} hint={tx('Ưu tiên chứng nhận thị trường châu Âu. Chứng nhận hết hạn sẽ tự ẩn khỏi hồ sơ công khai.', 'EU-market certificates first. Expired certificates are hidden from the public profile.')}>
        <div className="space-y-2">
          {c.certificates.map((cert, i) => (
            <div key={i} className="space-y-2 rounded-xl border p-3">
              <div className="grid items-center gap-2 sm:grid-cols-[1.3fr_1fr_160px_auto]">
                <Input placeholder={tx('Tên chứng nhận', 'Certificate')} value={cert.name} onChange={(e) => { const l = [...c.certificates]; l[i] = { ...cert, name: e.target.value }; set({ ...c, certificates: l }) }} />
                <Input placeholder={tx('Đơn vị cấp', 'Issuer')} value={cert.issuer} onChange={(e) => { const l = [...c.certificates]; l[i] = { ...cert, issuer: e.target.value }; set({ ...c, certificates: l }) }} />
                <DateField value={cert.expiry} onChange={(e) => { const l = [...c.certificates]; l[i] = { ...cert, expiry: e.target.value }; set({ ...c, certificates: l }) }} aria-label={tx('Hạn hiệu lực', 'Expiry')} />
                <button type="button" onClick={() => set({ ...c, certificates: c.certificates.filter((_, k) => k !== i) })} className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Remove"><Trash2 className="size-4" /></button>
              </div>
              <FilePick rule="certificate" compact name={cert.file} preview={cert.preview} onPick={(n, pv, fid) => { const l = [...c.certificates]; l[i] = { ...cert, file: n, preview: pv, fileId: fid }; set({ ...c, certificates: l }) }} />
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
        <FilePick rule="evidence" name={x.evidence} onPick={(n, _pv, fid) => set({ ...x, evidence: n, evidenceFileId: fid })} />
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
              <Select value={r.band} onValueChange={(band) => row(i, { band })} aria-label={tx('Khoảng doanh thu', 'Revenue band')} placeholder={tx('Khoảng doanh thu…', 'Revenue band…')} options={[{ value: '', label: '—' }, ...OPTIONS.revenueBand.map((o) => ({ value: o.value, label: L(o) }))]} />
              <Input placeholder={tx('Số chính xác (tỷ đ)', 'Exact (VND bn)')} inputMode="decimal" value={r.amount} onChange={(e) => row(i, { amount: e.target.value })} />
              <Select value={r.proofType} onValueChange={(proofType) => row(i, { proofType })} aria-label={tx('Loại chứng từ', 'Evidence type')} placeholder={tx('Loại chứng từ…', 'Evidence type…')} options={[{ value: '', label: '—' }, ...OPTIONS.revenueProof.map((o) => ({ value: o.value, label: L(o) }))]} />
            </div>
            {r.status === 'SELF' && r.reviewReason && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                {tx('VCCI từ chối chứng từ', 'VCCI rejected the evidence', 'VCCI가 증빙을 거절했습니다')}: <b>{r.reviewReason}</b> — {tx('tải chứng từ mới rồi lưu để gửi xác minh lại.', 'upload a new document and save to resubmit.', '새 증빙을 올리고 저장하면 재제출됩니다.')}
              </p>
            )}
            {r.status === 'SUBMITTED' && <p className="mt-3 text-xs text-muted-foreground">{tx('Đang chờ VCCI thẩm định chứng từ.', 'Waiting for VCCI to review the evidence.', 'VCCI 검토 대기 중입니다.')}</p>}
            <div className="mt-3"><FilePick rule="finance" compact name={r.proofFile} onPick={(n, _pv, fid) => row(i, { proofFile: n, proofFileId: fid, reviewReason: null })} /></div>
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
      <Field label={tx('Nhu cầu cụ thể khác', 'Other specific needs')} htmlFor="n-note"><Textarea id="n-note" placeholder={tx('VD: Cần tìm nhà phân phối tại Đức cho dòng nội thất gỗ', 'e.g. Looking for a distributor in Germany for our wooden furniture line', '예: 독일 내 원목 가구 유통사를 찾고 있습니다')} value={n.note} onChange={(e) => set({ ...n, note: e.target.value })} /></Field>
    </div>
  )
}

function AttendeesForm({ p, set }: FP<'attendees'>) {
  useI18n()
  const list = p.attendees
  const patch = (i: number, k: keyof (typeof list)[number], v: string) => { const l = [...list]; l[i] = { ...l[i]!, [k]: v }; set(l) }
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{tx('Khi đăng ký sự kiện, bạn chỉ cần tick chọn người tham dự. Nút vào xem trực tiếp hiện trên trang sự kiện; nhắc lịch gửi tới email từng người.', 'When registering, just tick who attends. The live-watch button appears on the event page; reminders go to each person’s email.')}</p>
      <AnimatePresence initial={false}>
        {list.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_1fr_1.2fr_1fr_auto]">
              <Input placeholder={tx('Họ tên', 'Full name')} value={a.name} onChange={(e) => patch(i, 'name', e.target.value)} />
              <Input placeholder={tx('Chức danh', 'Title')} value={a.title} onChange={(e) => patch(i, 'title', e.target.value)} />
              <Input placeholder="Email" type="email" value={a.email} onChange={(e) => patch(i, 'email', e.target.value)} />
              <Input placeholder={tx('Điện thoại', 'Phone')} value={a.phone} onChange={(e) => patch(i, 'phone', e.target.value)} />
              <button type="button" onClick={() => set(list.filter((_, k) => k !== i))} className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Remove"><Trash2 className="size-4" /></button>
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
function FilePick({ name, preview, onPick, rule, compact }: { name: string; preview?: string; onPick: (n: string, preview?: string, fileId?: string) => void; rule: RuleKey; compact?: boolean }) {
  useI18n()
  return (
    <FileUpload
      rule={rule}
      compact={compact}
      value={name ? { id: name, name, kind: rule, size: 0, preview } : null}
      onChange={(d) => onPick(d?.name ?? '', d ? (d.url && /\.(png|jpe?g|webp)$/i.test(d.name) ? d.url : USE_MOCK ? d.preview : undefined) : undefined, d?.fileId)}
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
