import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Plus, Quote, RefreshCw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi, liveApi, USE_MOCK, useHomeStats } from '@/api'
import type { Captcha as CaptchaChallenge } from '@/api/auth'
import { emptyProfile, useProfile, type DocFile, type Registration } from '@/lib/profile'
import { ImageUpload, MultiFileUpload, UploadGuide } from '@/components/upload/Upload'
import type { Branch, KeyLeaders, LeaderPerson, RegDocGroup } from '@/api/realApi'
import { clearRegisterUploadToken, uploadPending } from '@/api/uploads'
import { tx } from '@/lib/tx'
import { categories } from '@/data/mock'
import { Logo } from '@/components/brand'
import { CountUp } from '@/components/effects'
import { LangSwitcher } from '@/components/layout/LangSwitcher'
import { useToast } from '@/components/ui/overlay'
import { Button, Field, Input } from '@/components/ui/primitives'
import { Select } from '@/components/ui/select'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

function AuthShell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  const { t } = useI18n()
  const businesses = useHomeStats().data?.businesses ?? 0
  return (
    <div className={cn('grid min-h-dvh', wide ? 'lg:grid-cols-[1.6fr_1fr]' : 'lg:grid-cols-[1fr_1.05fr]')}>
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <LangSwitcher />
        </div>
        <div className={cn('mx-auto flex w-full flex-1 flex-col justify-center py-10', wide ? 'max-w-2xl' : 'max-w-md')}>{children}</div>
        <p className="text-center text-xs text-muted-foreground">{t.footer.rights}</p>
      </div>
      <aside className="relative hidden overflow-hidden bg-navy text-white lg:block">
        <img src="/imgs/cang-bien.jpg" alt="" className="absolute inset-0 size-full animate-kenburns object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/30" />
        <div className="bg-grid absolute inset-0 opacity-40" />
        <div className="absolute -right-20 top-20 size-80 animate-aurora rounded-full bg-primary/40 blur-3xl" />
        <div className="relative flex h-full flex-col justify-end p-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            {businesses > 0 && <p className="text-5xl font-extrabold tracking-tight"><CountUp to={businesses} format={(n) => Math.round(n).toLocaleString('vi-VN') + '+'} /></p>}
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

function PasswordInput({ id, placeholder, name }: { id: string; placeholder?: string; name?: string }) {
  const { t } = useI18n()
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input id={id} name={name} type={show ? 'text' : 'password'} required minLength={8} placeholder={placeholder} className="pr-10" />
      <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:text-foreground" aria-label={t.ui.togglePassword}>
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

/** Live: GET /api/auth/captcha (image data-URI + captchaId). `enabled=false` means login needs no captcha. */
function useLiveCaptcha() {
  const [cap, setCap] = useState<CaptchaChallenge | null>(null)
  const refresh = useCallback(() => {
    if (USE_MOCK) return
    authApi.getCaptcha().then(setCap, () => setCap({ enabled: false }))
  }, [])
  useEffect(() => { refresh() }, [refresh])
  return { cap, refresh }
}

function Captcha({ live }: { live?: ReturnType<typeof useLiveCaptcha> }) {
  const { t } = useI18n()
  const [code, setCode] = useState(() => Math.random().toString(36).slice(2, 7).toUpperCase())
  const remote = !USE_MOCK && live
  return (
    <div className="flex gap-2">
      <Input id="captcha" name="captcha" required placeholder="•••••" className="flex-1 uppercase tracking-[0.3em]" />
      <div className="relative grid h-10 w-28 select-none place-items-center overflow-hidden rounded-lg bg-[repeating-linear-gradient(45deg,var(--muted),var(--muted)_6px,var(--background)_6px,var(--background)_12px)] font-mono text-lg font-bold italic tracking-[0.25em] text-primary">
        {remote ? (live.cap?.image ? <img src={live.cap.image} alt="" className="size-full object-contain" /> : '…') : code}
      </div>
      <button type="button" onClick={() => (remote ? live.refresh() : setCode(Math.random().toString(36).slice(2, 7).toUpperCase()))} className="grid size-10 place-items-center rounded-lg border hover:bg-muted" aria-label={t.ui.refreshCaptcha}>
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
  const { signIn, loadRemote } = useProfile()
  const [params] = useSearchParams()
  const captcha = useLiveCaptcha()
  const [busy, setBusy] = useState(false)
  const showCaptcha = USE_MOCK || captcha.cap?.enabled !== false
  return (
    <AuthShell>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold tracking-tight">{t.auth.loginTitle}</h1>
        <p className="mt-2 text-muted-foreground">{t.auth.loginSub}</p>
        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (USE_MOCK) {
              toast({ kind: 'success', title: t.auth.loginTitle, description: t.common.demoNote })
              signIn()
              navigate(params.get('return') ?? '/account/profile')
              return
            }
            const fd = new FormData(e.currentTarget)
            setBusy(true)
            authApi.login(String(fd.get('email') ?? ''), String(fd.get('pw') ?? ''), { captchaId: captcha.cap?.captchaId, answer: String(fd.get('captcha') ?? '') })
              .then(() => loadRemote())
              .then(() => navigate(params.get('return') ?? '/account/profile'))
              .catch((err: Error) => { toast({ kind: 'info', title: err.message }); captcha.refresh() })
              .finally(() => setBusy(false))
          }}
        >
          <Field label={t.auth.email} htmlFor="email"><Input id="email" name="email" type="email" required autoComplete="email" placeholder="export@company.vn" /></Field>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="pw" className="mb-1.5 block text-[13px] font-semibold">{t.auth.password}</label>
              <a href="#" className="mb-1.5 text-xs font-semibold text-primary hover:underline">{t.auth.forgot}</a>
            </div>
            <PasswordInput id="pw" name="pw" />
          </div>
          {showCaptcha && <Field label={t.auth.captcha} htmlFor="captcha"><Captcha live={captcha} /></Field>}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>{t.auth.loginTitle} <ArrowRight /></Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t.auth.noAccount} <Link to="/register" className="font-semibold text-primary hover:underline">{t.nav.register}</Link>
        </p>
      </motion.div>
    </AuthShell>
  )
}

/**
 * POST /api/business/register (BusinessRegisterRequest) — moderated PENDING → APPROVED/REJECTED.
 * Fields follow the portal DTO: name, taxCode, businessForm, businessType, industry[], charterCapital(+currency),
 * totalRevenue, reportYear, employees, website, fax, country, province, address, email, phone, representative*.
 * Legal documents: OrganizationDocumentType BUSINESS_LICENSE / TAX_REGISTRATION_CERTIFICATE.
 */
const BUSINESS_FORMS = [
  { value: 'PRIVATE', vi: 'Doanh nghiệp tư nhân', en: 'Sole proprietorship', ko: '개인 기업' },
  { value: 'LLC', vi: 'Công ty TNHH', en: 'Limited liability company', ko: '유한책임회사' },
  { value: 'JOINT_STOCK', vi: 'Công ty cổ phần', en: 'Joint stock company', ko: '주식회사' },
  { value: 'JOINT_VENTURE', vi: 'Liên doanh', en: 'Joint venture', ko: '합작 투자 기업' },
  { value: 'COOPERATIVE', vi: 'Hợp tác xã', en: 'Cooperative', ko: '협동조합' },
  { value: 'STATE_OWNED', vi: 'Doanh nghiệp nhà nước', en: 'State-owned enterprise', ko: '국영 기업' },
  { value: 'OTHER', vi: 'Khác', en: 'Other', ko: '기타' },
]
const EMPLOYEE_RANGES = ['1 – 10', '11 – 50', '51 – 200', '201 – 500', '500 – 1.000', '1.000 – 2.000', '2.000+']
const REG_COUNTRIES = ['VN', 'KR', 'JP', 'CN', 'US', 'DE', 'FR', 'GB', 'AU', 'SG', 'TH']

const GENDERS = [
  { value: 'MALE', vi: 'Nam', en: 'Male', ko: '남' },
  { value: 'FEMALE', vi: 'Nữ', en: 'Female', ko: '여' },
  { value: 'OTHER', vi: 'Khác', en: 'Other', ko: '기타' },
]
type PersonField = keyof LeaderPerson
/** "Lãnh đạo chủ chốt": which fields each role asks for; `required` marks the mandatory role (Người liên hệ #1). */
const LEADER_ROLES: { key: keyof KeyLeaders; label: Parameters<typeof tx>; fields: PersonField[]; required?: boolean }[] = [
  { key: 'contact1', label: ['Người liên hệ #1', 'Contact person #1', '담당자 #1'], fields: ['fullName', 'mobile', 'email'], required: true },
  { key: 'chairman', label: ['Chủ tịch', 'Chairperson', '회장'], fields: ['fullName', 'gender', 'landline', 'mobile'] },
  { key: 'ceo', label: ['Tổng Giám đốc / Giám đốc', 'CEO / Director', '대표이사 / 사장'], fields: ['fullName', 'gender', 'landline', 'mobile', 'email'] },
  { key: 'chiefOfOffice', label: ['Chánh Văn phòng', 'Chief of office', '비서실장'], fields: ['fullName', 'landline', 'mobile', 'email'] },
  { key: 'contact2', label: ['Người liên hệ #2', 'Contact person #2', '담당자 #2'], fields: ['fullName', 'mobile', 'email'] },
]
const PERSON_LABEL: Record<PersonField, Parameters<typeof tx>> = {
  fullName: ['Họ tên', 'Full name', '성명'],
  gender: ['Giới tính', 'Gender', '성별'],
  landline: ['Điện thoại cố định', 'Landline', '유선 전화'],
  mobile: ['Di động', 'Mobile', '휴대전화'],
  email: ['Email', 'Email', '이메일'],
}
const PERSON_PLACEHOLDER: Record<Exclude<PersonField, 'gender'>, Parameters<typeof tx>> = {
  fullName: ['VD: Nguyễn Văn A', 'e.g. Nguyen Van A', '예: Nguyen Van A'],
  landline: ['VD: 024 3825 0000', 'e.g. 024 3825 0000', '예: 024 3825 0000'],
  mobile: ['VD: 0912 345 678', 'e.g. 0912 345 678', '예: 0912 345 678'],
  email: ['VD: ten@company.vn', 'e.g. name@company.vn', '예: name@company.vn'],
}
/** "Hồ sơ yêu cầu": 5 groups, max 5 files each; only the business registration certificate is mandatory. */
const DOC_GROUPS: { key: RegDocGroup; label: Parameters<typeof tx>; items: Parameters<typeof tx>[]; required?: boolean }[] = [
  { key: 'application', label: ['Đơn xin gia nhập hội viên', 'Membership application', '회원 가입 신청서'], items: [['Đơn đăng ký hội viên Liên đoàn Thương mại & Công nghiệp Việt Nam (VCCI)', 'VCCI membership application form', 'VCCI 회원 가입 신청서'], ['Giấy chứng nhận đăng ký doanh nghiệp', 'Enterprise registration certificate', '사업자등록증']] },
  { key: 'license', label: ['Giấy chứng nhận đăng ký kinh doanh', 'Business registration certificate', '영업 등록증'], items: [['Bản sao Giấy chứng nhận đăng ký kinh doanh', 'Copy of the business registration certificate', '영업 등록증 사본'], ['Giấy phép kinh doanh có điều kiện (nếu có)', 'Conditional business licence (if any)', '조건부 영업 허가증 (해당 시)']], required: true },
  { key: 'finance', label: ['Báo cáo tài chính', 'Financial statements', '재무제표'], items: [['Báo cáo tài chính gần nhất', 'Latest financial statements', '최근 재무제표'], ['Báo cáo thuế (nếu có)', 'Tax report (if any)', '세무 보고서 (해당 시)']] },
  { key: 'payment', label: ['Chứng từ thanh toán', 'Payment documents', '납부 증빙'], items: [['Biên lai thanh toán phí hội viên', 'Membership fee receipt', '회비 납부 영수증'], ['Chứng từ chuyển khoản', 'Bank transfer slip', '계좌 이체 증빙']] },
  { key: 'other', label: ['Tài liệu khác', 'Other documents', '기타 서류'], items: [['Tài liệu bổ sung', 'Supplementary documents', '추가 서류']] },
]
const emptyPerson = (): LeaderPerson => ({ fullName: '', gender: '', landline: '', mobile: '', email: '' })

type Reg = Registration & {
  nameVi: string; nameEn: string; shortName: string; taxCode: string; logo: string; loginEmail: string
  otherBusinessForm: string; businessRegNo: string; businessRegDate: string; businessRegPlace: string; totalAssets: string
  leaders: KeyLeaders; branches: Branch[]; docs: Record<RegDocGroup, DocFile[]>
}

export function Register() {
  const { t, L, locale } = useI18n()
  const { signIn } = useProfile()
  const navigate = useNavigate()
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [r, setR] = useState<Reg>(() => ({
    ...emptyProfile().registration, nameVi: '', nameEn: '', shortName: '', taxCode: '', logo: '', loginEmail: '',
    otherBusinessForm: '', businessRegNo: '', businessRegDate: '', businessRegPlace: '', totalAssets: '',
    leaders: { chairman: emptyPerson(), ceo: emptyPerson(), chiefOfOffice: emptyPerson(), contact1: emptyPerson(), contact2: emptyPerson() },
    branches: [], docs: { application: [], license: [], finance: [], payment: [], other: [] },
  }))
  const set = <K extends keyof Reg>(k: K, v: Reg[K]) => setR((x) => ({ ...x, [k]: v }))
  const setPerson = (role: keyof KeyLeaders, f: PersonField, v: string) => setR((x) => ({ ...x, leaders: { ...x.leaders, [role]: { ...x.leaders[role], [f]: v } } }))
  const setBranch = (i: number, b: Partial<Branch>) => set('branches', r.branches.map((x, j) => (j === i ? { ...x, ...b } : x)))
  // the profile (mock) and the step-4 check still read legalDocs.license: mirror the first certificate there
  const setDocs = (g: RegDocGroup, v: DocFile[]) => setR((x) => ({ ...x, docs: { ...x.docs, [g]: v }, ...(g === 'license' ? { legalDocs: { ...x.legalDocs, license: v[0] ?? null } } : {}) }))
  const [today] = useState(() => new Date().toISOString().slice(0, 10))
  const region = new Intl.DisplayNames([locale], { type: 'region' })
  const steps = [tx('Doanh nghiệp', 'Company', '기업'), tx('Địa chỉ & liên hệ', 'Address & contact', '주소 & 연락처'), tx('Lãnh đạo chủ chốt', 'Key leaders', '주요 경영진'), tx('Pháp lý & tài khoản', 'Legal & account', '법인 서류 & 계정')]
  const go = (n: number) => {
    setDir(n > step ? 1 : -1)
    setStep(n)
  }

  const submit = () => {
    // live: the account is created by VCCI after approval (no password is accepted at registration), so go to login
    if (!USE_MOCK) return navigate('/login')
    signIn(
      { companyName: r.nameVi, taxCode: r.taxCode },
      true,
      { ...r, email: r.email, legalDocs: r.legalDocs },
      { nameEn: r.nameEn, logo: r.logo },
    )
    navigate('/account/profile')
  }

  if (done) {
    return (
      <AuthShell wide>
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 14 }} className="grid size-14 place-items-center rounded-full bg-success text-white">
            <Check className="size-7" />
          </motion.div>
          <h1 className="mt-5 text-2xl font-extrabold">{t.auth.submitted}</h1>
          <p className="mt-2 text-muted-foreground">{t.auth.submittedDesc}</p>
          <div className="mt-6 rounded-2xl border p-5">
            <p className="text-sm font-semibold">{tx('VCCI sẽ thẩm định', 'VCCI will check', 'VCCI 심사 항목')}</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[
                tx('Mã số thuế khớp với Giấy chứng nhận đăng ký doanh nghiệp', 'Tax code matches the business registration certificate', '사업자 번호와 사업자등록증 일치 여부'),
                tx('Tên, địa chỉ trụ sở và người đại diện theo pháp luật', 'Name, registered address and legal representative', '상호, 본사 주소, 법정 대표자'),
                tx('Ngành nghề kinh doanh và tình trạng hoạt động', 'Business lines and operating status', '업종 및 영업 상태'),
              ].map((x) => <li key={x} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" /> {x}</li>)}
            </ul>
          </div>
          <div className="mt-6 rounded-2xl bg-primary-soft/60 p-5">
            <p className="font-semibold">{tx('Trong lúc chờ duyệt, hãy hoàn thiện hồ sơ năng lực', 'While you wait, complete your capability profile', '심사 대기 중 역량 프로필을 완성하세요')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{tx('Thông tin vừa khai được chuyển sẵn sang hồ sơ. Hồ sơ đầy đủ giúp được duyệt nhanh hơn và đăng ký sự kiện 1 chạm.', 'What you entered is carried over. A complete profile speeds up approval and enables one-tap event registration.', '입력한 정보가 프로필로 옮겨집니다. 프로필이 완성되면 승인이 빨라지고 원클릭 행사 신청이 가능합니다.')}</p>
            <Button size="lg" className="mt-4" onClick={submit}>{tx('Hoàn thiện hồ sơ năng lực', 'Complete capability profile', '역량 프로필 완성하기')} <ArrowRight /></Button>
          </div>
          <Link to="/" className="mt-5 inline-block text-sm font-semibold text-primary">{t.common.home}</Link>
        </motion.div>
      </AuthShell>
    )
  }

  return (
    <AuthShell wide>
      <h1 className="text-3xl font-extrabold tracking-tight">{t.auth.registerTitle}</h1>
      <p className="mt-2 text-muted-foreground">{t.auth.registerSub}</p>
      <div className="mt-7 grid grid-cols-4 gap-2">
        {steps.map((s, i) => (
          <button key={s} type="button" onClick={() => i < step && go(i)} className="text-left">
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <motion.div className="h-full bg-primary" initial={false} animate={{ width: i <= step ? '100%' : '0%' }} transition={{ duration: 0.45 }} />
            </div>
            <p className={cn('mt-2 truncate text-xs font-semibold', i <= step ? 'text-foreground' : 'text-muted-foreground')}>{i + 1}<span className="max-sm:hidden">. {s}</span></p>
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-sm font-semibold sm:hidden">{step + 1}/{steps.length} · {steps[step]}</p>

      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault()
          if (step === 0 && !r.industries.length) return toast({ kind: 'info', title: tx('Chọn ít nhất 1 ngành nghề', 'Choose at least one industry', '업종을 하나 이상 선택하세요') })
          if (step === 3 && !r.legalDocs.license) return toast({ kind: 'info', title: tx('Cần tải Giấy chứng nhận đăng ký kinh doanh', 'Business registration certificate is required', '영업 등록증을 업로드해야 합니다') })
          if (step < 3) {
            go(step + 1)
          } else if (USE_MOCK) setDone(true)
          else {
            const fd = new FormData(e.currentTarget)
            const password = String(fd.get('password') ?? '')
            if (password !== String(fd.get('confirmPassword') ?? '')) return toast({ kind: 'info', title: tx('Mật khẩu nhập lại không khớp', 'Passwords do not match', '비밀번호가 일치하지 않습니다') })
            setBusy(true)
            // files go up only now (token + fileIds); the BE links them to the new organization
            uploadPending(r).then((sent) => liveApi.registerBusiness({ ...sent, loginEmail: sent.loginEmail || sent.email, password })).then(
              () => { clearRegisterUploadToken(); setDone(true) },
              (err: Error) => toast({ kind: 'info', title: err.message }),
            ).finally(() => setBusy(false))
          }
        }}
      >
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -40 }} transition={{ duration: 0.28 }} className="grid gap-4 sm:grid-cols-2">
            {step === 0 && (
              <>
                <Field label={tx('Tên doanh nghiệp (tiếng Việt)', 'Company name (Vietnamese)', '기업명 (베트남어)') + ' *'} htmlFor="bn" className="sm:col-span-2"><Input id="bn" placeholder={tx('VD: Công ty Cổ phần Nội thất Phương Nam', 'e.g. Phuong Nam Furniture JSC', '예: Phuong Nam 가구 주식회사')} required value={r.nameVi} onChange={(e) => set('nameVi', e.target.value)} /></Field>
                <Field label={tx('Tên tiếng Anh', 'English name', '영문 기업명')} htmlFor="bn-en"><Input id="bn-en" placeholder={tx('VD: Southwood Furniture JSC', 'e.g. Southwood Furniture JSC', '예: Southwood Furniture JSC')} value={r.nameEn} onChange={(e) => set('nameEn', e.target.value)} /></Field>
                <Field label={tx('Tên viết tắt', 'Short name', '약칭')} htmlFor="bn-short"><Input id="bn-short" placeholder={tx('VD: SOUTHWOOD', 'e.g. SOUTHWOOD', '예: SOUTHWOOD')} maxLength={255} value={r.shortName} onChange={(e) => set('shortName', e.target.value)} /></Field>
                <Field label={t.auth.taxCode + ' *'} htmlFor="tax" hint={tx('10 hoặc 13 chữ số, trùng mã số doanh nghiệp', '10 or 13 digits, same as enterprise code', '10자리 또는 13자리')}>
                  <Input id="tax" placeholder={'0123456789'} required inputMode="numeric" pattern="\d{10}(\d{3})?" title={tx('10 hoặc 13 chữ số', '10 or 13 digits', '10자리 또는 13자리')} value={r.taxCode} onChange={(e) => set('taxCode', e.target.value.replace(/\D/g, ''))} />
                </Field>
                <Field label={tx('Loại hình doanh nghiệp', 'Legal form', '기업 형태') + ' *'} htmlFor="bf">
                  <Select id="bf" required value={r.businessForm} onValueChange={(v) => set('businessForm', v)} placeholder="—" options={BUSINESS_FORMS.map((o) => ({ value: o.value, label: L(o) }))} />
                </Field>
                {r.businessForm === 'OTHER' && (
                  <Field label={tx('Ghi rõ loại hình', 'Specify legal form', '기업 형태 명시') + ' *'} htmlFor="bf-other"><Input id="bf-other" placeholder={tx('Nhập loại hình doanh nghiệp', 'Enter the legal form', '기업 형태 입력')} required maxLength={150} value={r.otherBusinessForm} onChange={(e) => set('otherBusinessForm', e.target.value)} /></Field>
                )}
                <Field label={tx('Số đăng ký kinh doanh', 'Business registration no.', '영업 등록 번호') + ' *'} htmlFor="brn"><Input id="brn" placeholder={tx('VD: 0123456789', 'e.g. 0123456789', '예: 0123456789')} required maxLength={50} value={r.businessRegNo} onChange={(e) => set('businessRegNo', e.target.value)} /></Field>
                <Field label={tx('Ngày cấp', 'Date of issue', '발급일') + ' *'} htmlFor="brd"><Input id="brd" type="date" required max={today} value={r.businessRegDate} onChange={(e) => set('businessRegDate', e.target.value)} /></Field>
                <Field label={tx('Nơi cấp', 'Place of issue', '발급 기관') + ' *'} htmlFor="brp" className="sm:col-span-2"><Input id="brp" required maxLength={255} value={r.businessRegPlace} onChange={(e) => set('businessRegPlace', e.target.value)} placeholder={tx('VD: Sở Kế hoạch và Đầu tư TP. Hà Nội', 'e.g. Hanoi Department of Planning and Investment', '예: 하노이 기획투자국')} /></Field>
                <Field label={tx('Loại hình hoạt động', 'Business type', '사업 유형') + ' *'} htmlFor="bt">
                  <Select id="bt" value={r.businessType} onValueChange={(v) => set('businessType', v)} options={(Object.keys(t.supplier.types) as (keyof typeof t.supplier.types)[]).map((k) => ({ value: k, label: t.supplier.types[k] }))} />
                </Field>
                <div className="sm:col-span-2">
                  <p className="mb-2 text-[13px] font-semibold">{t.auth.industry} *</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => {
                      const on = r.industries.includes(c.id)
                      return (
                        <button key={c.id} type="button" onClick={() => set('industries', on ? r.industries.filter((x) => x !== c.id) : [...r.industries, c.id])} className={cn('inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[13px] font-medium transition', on ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/50')}>
                          {on && <Check className="size-3.5" />} {L(c.categoryName)}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <Field label={tx('Vốn điều lệ', 'Charter capital', '자본금') + ' *'} htmlFor="cap">
                  <div className="flex gap-2">
                    <Input id="cap" placeholder={tx('VD: 10000000000', 'e.g. 10000000000', '예: 10000000000')} required inputMode="numeric" value={r.charterCapital} onChange={(e) => set('charterCapital', e.target.value)} />
                    <Select aria-label={tx('Đơn vị tiền tệ', 'Currency', '통화')} className="w-24 shrink-0" value={r.charterCurrency} onValueChange={(v) => set('charterCurrency', v)} options={[{ value: 'VND', label: 'VND' }, { value: 'USD', label: 'USD' }]} />
                  </div>
                </Field>
                <Field label={tx('Tổng tài sản', 'Total assets', '총자산')} htmlFor="assets" hint={tx('Cùng đơn vị tiền tệ với vốn điều lệ', 'Same currency as charter capital', '자본금과 같은 통화')}>
                  <Input id="assets" placeholder={tx('VD: 50000000000', 'e.g. 50000000000', '예: 50000000000')} inputMode="numeric" pattern="\d*" value={r.totalAssets} onChange={(e) => set('totalAssets', e.target.value.replace(/\D/g, ''))} />
                </Field>
                <Field label={tx('Số lao động', 'Employees', '직원 수')} htmlFor="emp">
                  <Select id="emp" value={r.employees} onValueChange={(v) => set('employees', v)} options={[{ value: '', label: '—' }, ...EMPLOYEE_RANGES.map((x) => ({ value: x, label: x }))]} />
                </Field>
                <Field label={tx('Tổng doanh thu năm gần nhất', 'Latest annual revenue', '최근 연매출')} htmlFor="rev" hint={tx('Tự khai; xác minh bằng chứng từ ở bước hoàn thiện hồ sơ', 'Self-declared; verified with evidence in your profile', '자체 신고; 프로필에서 증빙으로 검증')}>
                  <Input id="rev" placeholder={tx('VD: 20000000000', 'e.g. 20000000000', '예: 20000000000')} inputMode="numeric" value={r.totalRevenue} onChange={(e) => set('totalRevenue', e.target.value)} />
                </Field>
                <Field label={tx('Năm báo cáo', 'Reporting year', '보고 연도')} htmlFor="ry"><Input id="ry" placeholder={String(new Date().getFullYear() - 1)} inputMode="numeric" pattern="\d{4}" value={r.reportYear} onChange={(e) => set('reportYear', e.target.value)} /></Field>
                <Field label="Website" htmlFor="web"><Input id="web" value={r.website} onChange={(e) => set('website', e.target.value)} placeholder="www.company.vn" /></Field>
                <Field label="Fax" htmlFor="fax"><Input id="fax" placeholder={'024 3825 0000'} value={r.fax} onChange={(e) => set('fax', e.target.value)} /></Field>
              </>
            )}
            {step === 1 && (
              <>
                <Field label={t.auth.country + ' *'} htmlFor="ct">
                  <Select id="ct" value={r.country} onValueChange={(v) => set('country', v)} options={REG_COUNTRIES.map((c) => ({ value: c, label: region.of(c) }))} />
                </Field>
                <Field label={t.auth.province + ' *'} htmlFor="prov"><Input id="prov" placeholder={tx('VD: Hà Nội', 'e.g. Hanoi', '예: 하노이')} required value={r.province} onChange={(e) => set('province', e.target.value)} /></Field>
                <Field label={tx('Địa chỉ trụ sở chính', 'Registered address', '본사 주소') + ' *'} htmlFor="addr" className="sm:col-span-2" hint={tx('Ghi đúng như trên Giấy chứng nhận đăng ký doanh nghiệp', 'As shown on the business registration certificate', '사업자등록증 기재 주소')}>
                  <Input id="addr" placeholder={tx('Số nhà, đường, phường/xã, quận/huyện', 'Street, ward, district', '번지, 도로, 동, 구')} required value={r.address} onChange={(e) => set('address', e.target.value)} />
                </Field>
                <Field label={tx('Email doanh nghiệp', 'Company email', '기업 이메일') + ' *'} htmlFor="cem"><Input id="cem" placeholder={'contact@company.vn'} type="email" required value={r.email} onChange={(e) => set('email', e.target.value)} /></Field>
                <Field label={tx('Điện thoại doanh nghiệp', 'Company phone', '기업 전화') + ' *'} htmlFor="cph"><Input id="cph" placeholder={'024 3825 0000'} type="tel" required value={r.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
              </>
            )}
            {step === 2 && (
              <>
                {LEADER_ROLES.map((role) => (
                  <fieldset key={role.key} className="grid gap-3 rounded-xl border p-4 sm:col-span-2 sm:grid-cols-2">
                    <legend className="px-1 text-[13px] font-semibold">{tx(...role.label)}{role.required && ' *'}</legend>
                    {role.fields.map((f) => {
                      const id = `${role.key}-${f}`
                      const label = tx(...PERSON_LABEL[f]) + (role.required ? ' *' : '')
                      const v = r.leaders[role.key][f]
                      return f === 'gender' ? (
                        <Field key={f} label={label} htmlFor={id}>
                          <Select id={id} value={v} onValueChange={(x) => setPerson(role.key, f, x)} options={[{ value: '', label: '—' }, ...GENDERS.map((g) => ({ value: g.value, label: L(g) }))]} />
                        </Field>
                      ) : (
                        <Field key={f} label={label} htmlFor={id} className={f === 'fullName' && role.fields.length % 2 === 1 ? 'sm:col-span-2' : undefined}>
                          <Input id={id} placeholder={tx(...PERSON_PLACEHOLDER[f])} required={role.required} type={f === 'email' ? 'email' : f === 'fullName' ? 'text' : 'tel'} maxLength={f === 'fullName' || f === 'email' ? 255 : 20} value={v} onChange={(e) => setPerson(role.key, f, e.target.value)} />
                        </Field>
                      )
                    })}
                  </fieldset>
                ))}
                <div className="sm:col-span-2">
                  <p className="mb-2 text-[13px] font-semibold">{tx('Chi nhánh / văn phòng đại diện trong và ngoài nước', 'Branches / representative offices (domestic & overseas)', '국내외 지사 / 대표 사무소')}</p>
                  <div className="space-y-2">
                    {r.branches.map((b, i) => (
                      <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1.6fr_auto]">
                        <Input aria-label={tx('Tên chi nhánh', 'Branch name', '지사명')} placeholder={tx('Tên chi nhánh / VPĐD', 'Branch / office name', '지사 / 사무소명')} required maxLength={255} value={b.name} onChange={(e) => setBranch(i, { name: e.target.value })} />
                        <Input aria-label={tx('Địa chỉ chi nhánh', 'Branch address', '지사 주소')} placeholder={tx('Địa chỉ (trong hoặc ngoài nước)', 'Address (domestic or overseas)', '주소 (국내 또는 해외)')} maxLength={1000} value={b.address} onChange={(e) => setBranch(i, { address: e.target.value })} />
                        <button type="button" onClick={() => set('branches', r.branches.filter((_, j) => j !== i))} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label={tx('Xoá chi nhánh', 'Remove branch', '지사 삭제')}><Trash2 className="size-4" /></button>
                      </div>
                    ))}
                  </div>
                  {r.branches.length < 20 && (
                    <Button variant="ghost" className="mt-2" onClick={() => set('branches', [...r.branches, { name: '', address: '' }])}><Plus /> {tx('Thêm chi nhánh', 'Add branch', '지사 추가')}</Button>
                  )}
                </div>
              </>
            )}
            {step === 3 && (
              <>
                {DOC_GROUPS.map((g) => (
                  <div key={g.key} className="sm:col-span-2">
                    <p className="text-[13px] font-semibold">{tx(...g.label)}{g.required && ' *'}</p>
                    <ul className="mb-2 mt-0.5 text-xs text-muted-foreground">{g.items.map((it) => <li key={it[1]}>• {tx(...it)}</li>)}</ul>
                    <MultiFileUpload rule="legal" value={r.docs[g.key]} onChange={(v) => setDocs(g.key, v)} />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <p className="mb-2 text-[13px] font-semibold">{tx('Logo doanh nghiệp (không bắt buộc)', 'Company logo (optional)', '기업 로고 (선택)')}</p>
                  <ImageUpload rule="logo" value={r.logo} onChange={(v) => set('logo', v)} />
                </div>
                <Field label={tx('Email đăng nhập', 'Login email', '로그인 이메일') + ' *'} htmlFor="ae" className="sm:col-span-2" hint={tx('Mặc định là email doanh nghiệp, có thể đổi', 'Defaults to the company email; you can change it', '기본값은 기업 이메일이며 변경할 수 있습니다')}><Input id="ae" placeholder={'login@company.vn'} type="email" required value={r.loginEmail || r.email} onChange={(e) => set('loginEmail', e.target.value)} /></Field>
                <Field label={t.auth.password} htmlFor="ap"><PasswordInput id="ap" name="password" placeholder={tx('Tối thiểu 8 ký tự', 'At least 8 characters', '8자 이상')} /></Field>
                <Field label={t.auth.confirmPassword} htmlFor="ap2"><PasswordInput id="ap2" name="confirmPassword" placeholder={tx('Nhập lại mật khẩu', 'Re-enter password', '비밀번호 재입력')} /></Field>
                <label className="flex items-start gap-2.5 text-sm text-muted-foreground sm:col-span-2">
                  <input type="checkbox" required className="mt-0.5 size-4 accent-[var(--primary)]" /> {t.auth.agree}
                </label>
                <div className="sm:col-span-2"><UploadGuide keys={['legal', 'logo']} /></div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="mt-6 flex justify-between gap-3">
          {step > 0 ? <Button variant="ghost" onClick={() => go(step - 1)}><ArrowLeft /> {t.common.back}</Button> : <span />}
          <Button type="submit" size="lg" disabled={busy}>{step < 3 ? t.common.next : t.common.submit} <ArrowRight /></Button>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t.auth.haveAccount} <Link to="/login" className="font-semibold text-primary hover:underline">{t.nav.login}</Link>
      </p>
    </AuthShell>
  )
}
