import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Check, ChevronDown, Eye, EyeOff, MailCheck } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi, liveApi, USE_MOCK } from '@/api'
import { Captcha } from '@/components/ui/captcha'
import { useLiveCaptcha } from '@/components/ui/useLiveCaptcha'
import { BUSINESS_FORMS, emptyLeaders, emptyProfile, useProfile, type DocFile, type Registration } from '@/lib/profile'
import { BranchesFields, LeadersFields, type PersonField } from '@/components/profile/KeyLeadersFields'
import { ImageUpload, MultiFileUpload, UploadGuide } from '@/components/upload/Upload'
import type { Branch, KeyLeaders, RegDocGroup } from '@/api/realApi'
import { clearRegisterUploadToken, uploadPending } from '@/api/uploads'
import { tx } from '@/lib/tx'
import { categories } from '@/data/mock'
import { Logo } from '@/components/brand'
import { LangSwitcher } from '@/components/layout/LangSwitcher'
import { useToast } from '@/components/ui/overlay'
import { Button, buttonClass, Field, Input } from '@/components/ui/primitives'
import { DateField } from '@/components/ui/DateField'
import { Select } from '@/components/ui/select'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/** Side panel: what the account gives you, from the product's positioning only (no counters or quotes without a source). */
function AuthShell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  const { t } = useI18n()
  const points = [
    tx('Hồ sơ doanh nghiệp do chính VCCI rà soát và gắn huy hiệu Xác thực VCCI', 'Company profiles reviewed by VCCI itself and marked VCCI Verified', 'VCCI가 직접 심사하고 VCCI 인증 배지를 부여한 기업 프로필'),
    tx('Hội chợ, Show Hub và livestream do VCCI tổ chức, dùng chung một tài khoản', 'Fairs, Show Hub and livestreams run by VCCI, on the same account', 'VCCI가 주최하는 박람회·Show Hub·라이브를 하나의 계정으로'),
    tx('Khai hồ sơ năng lực một lần, đăng ký sự kiện bằng một lần xác nhận', 'Fill in your capability profile once, register for events with one confirmation', '역량 프로필은 한 번만 작성, 행사 신청은 한 번의 확인으로'),
  ]
  return (
    <div className={cn('grid min-h-dvh', wide ? 'lg:grid-cols-[1.6fr_1fr]' : 'lg:grid-cols-[1fr_1.05fr]')}>
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <LangSwitcher />
        </div>
        <div className={cn('mx-auto flex w-full flex-1 flex-col justify-center py-10', wide ? 'max-w-2xl' : 'max-w-md')}>{children}</div>
        <p className="text-center text-xs text-muted-foreground">{t.footer.rights} · <Link to="/help" className="hover:text-foreground hover:underline">{t.top.help}</Link> · <Link to="/privacy" className="hover:text-foreground hover:underline">{tx('Bảo mật', 'Privacy', '개인정보')}</Link></p>
      </div>
      <aside className="relative hidden overflow-hidden bg-navy text-white lg:block">
        <img src="/imgs/cang-bien.jpg" alt="" className="absolute inset-0 size-full animate-kenburns object-cover opacity-60" />
        {/* neutral scrim so the text stays readable on the photo */}
        <div className="absolute inset-0 bg-navy/55" />
        <div className="relative flex h-full flex-col justify-end p-12 xl:p-16">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }}>
            <p className="max-w-md text-[40px] font-extrabold leading-[1.05] tracking-tight xl:text-5xl">{t.brand.tagline}</p>
            <ul className="mt-8 max-w-md space-y-4">
              {points.map((p, i) => (
                <motion.li key={p} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.08 }} className="flex gap-3 text-[17px] leading-relaxed text-white">
                  <Check className="mt-1 size-5 shrink-0 text-gold-bright" /> {p}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </aside>
    </div>
  )
}

function PasswordInput({ id, placeholder, name, describedBy, autoComplete }: { id: string; placeholder?: string; name?: string; describedBy?: string; autoComplete?: string }) {
  const { t } = useI18n()
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input id={id} name={name} type={show ? 'text' : 'password'} required minLength={8} placeholder={placeholder} autoComplete={autoComplete} aria-describedby={describedBy} className="pr-12" />
      <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:text-foreground" aria-label={t.ui.togglePassword} aria-pressed={show}>
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

/** POST /api/auth/forgot-password — the BE answers the same whether the account exists or not (anti-enumeration). */
export function ForgotPassword() {
  const { t } = useI18n()
  const [params] = useSearchParams()
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [error, setError] = useState('')
  return (
    <AuthShell>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold tracking-tight">{tx('Đặt lại mật khẩu', 'Reset your password', '비밀번호 재설정')}</h1>
        {sentTo ? (
          <div className="mt-6 space-y-4" role="status">
            <div className="flex gap-3 rounded-2xl bg-success-soft p-5">
              <MailCheck className="mt-0.5 size-5 shrink-0 text-success" />
              <p className="text-[15px] leading-relaxed">
                {tx('Nếu ', 'If ', '')}<strong className="break-all">{sentTo}</strong>{tx(' thuộc một tài khoản đang hoạt động, VCCI đã gửi liên kết đặt lại mật khẩu tới hộp thư đó.', ' belongs to an active account, VCCI has sent a password reset link to that inbox.', '이(가) 활성 계정이라면 VCCI가 비밀번호 재설정 링크를 보냈습니다.')}
              </p>
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">{tx('Không thấy email sau vài phút? Kiểm tra mục Thư rác, gửi lại, hoặc gọi hotline 1900 6 1111 để VCCI hỗ trợ khôi phục tài khoản.', 'No email after a few minutes? Check your spam folder, send it again, or call the 1900 6 1111 hotline and VCCI will help you recover the account.', '몇 분이 지나도 메일이 없다면 스팸함을 확인하거나 다시 보내거나 1900 6 1111로 문의하세요.')}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/login" className={buttonClass('default', 'lg')}><ArrowLeft /> {t.nav.login}</Link>
              <Button variant="outline" size="lg" onClick={() => setSentTo('')}>{tx('Gửi lại', 'Send again', '다시 보내기')}</Button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-2 text-muted-foreground">{tx('Nhập email đăng nhập. VCCI sẽ gửi liên kết để bạn đặt mật khẩu mới.', 'Enter your login email. VCCI will send a link to set a new password.', '로그인 이메일을 입력하면 새 비밀번호 설정 링크를 보내드립니다.')}</p>
            <form
              className="mt-8 space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                const email = String(new FormData(e.currentTarget).get('email') ?? '').trim()
                setError('')
                if (USE_MOCK) return setSentTo(email)
                setBusy(true)
                authApi.forgotPassword(email).then(() => setSentTo(email), (err: Error) => setError(err.message)).finally(() => setBusy(false))
              }}
            >
              <Field label={t.auth.email} htmlFor="fp-email" error={error}>
                <Input id="fp-email" name="email" type="email" required autoComplete="email" autoFocus defaultValue={params.get('email') ?? ''} placeholder="export@company.vn" aria-invalid={!!error} aria-describedby={error ? 'fp-email-err' : undefined} />
              </Field>
              <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? t.common.loading : tx('Gửi liên kết đặt lại', 'Send reset link', '재설정 링크 보내기')} <ArrowRight /></Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"><ArrowLeft className="size-4" /> {tx('Quay lại đăng nhập', 'Back to sign in', '로그인으로 돌아가기')}</Link>
            </p>
          </>
        )}
      </motion.div>
    </AuthShell>
  )
}

/** /reset-password?token=… — the link from the reset email (POST /api/auth/complete-password-reset). */
export function ResetPassword() {
  const { t } = useI18n()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const rule = tx('Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.', 'At least 8 characters with an upper-case letter, a lower-case letter, a digit and a symbol.', '8자 이상, 대문자·소문자·숫자·특수문자 포함.')
  return (
    <AuthShell>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold tracking-tight">{tx('Đặt mật khẩu mới', 'Set a new password', '새 비밀번호 설정')}</h1>
        {!token ? (
          <div className="mt-6 space-y-4">
            <p className="text-foreground/80">{tx('Liên kết thiếu mã đặt lại hoặc đã bị cắt. Hãy mở lại liên kết trong email, hoặc yêu cầu liên kết mới.', 'The link is missing its reset code or was cut off. Open the link from the email again, or request a new one.', '링크에 재설정 코드가 없습니다. 메일의 링크를 다시 열거나 새 링크를 요청하세요.')}</p>
            <Link to="/forgot-password" className={buttonClass('default', 'lg')}>{tx('Yêu cầu liên kết mới', 'Request a new link', '새 링크 요청')} <ArrowRight /></Link>
          </div>
        ) : done ? (
          <div className="mt-6 space-y-4" role="status">
            <p className="flex gap-3 rounded-2xl bg-success-soft p-5 text-[15px]"><Check className="mt-0.5 size-5 shrink-0 text-success" /> {tx('Đã đổi mật khẩu. Đăng nhập bằng mật khẩu mới.', 'Password changed. Sign in with your new password.', '비밀번호가 변경되었습니다. 새 비밀번호로 로그인하세요.')}</p>
            <Link to="/login" className={buttonClass('default', 'lg')}>{t.nav.login} <ArrowRight /></Link>
          </div>
        ) : (
          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const pw = String(fd.get('pw') ?? ''), pw2 = String(fd.get('pw2') ?? '')
              if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(pw)) return setError(rule)
              if (pw !== pw2) return setError(tx('Hai mật khẩu chưa khớp.', 'The two passwords do not match.', '두 비밀번호가 일치하지 않습니다.'))
              setError('')
              if (USE_MOCK) return setDone(true)
              setBusy(true)
              authApi.completePasswordReset(token, pw, pw2).then(() => setDone(true), (err: Error) => setError(err.message)).finally(() => setBusy(false))
            }}
          >
            <Field label={tx('Mật khẩu mới', 'New password', '새 비밀번호')} htmlFor="rp-pw" hint={rule}>
              <PasswordInput id="rp-pw" placeholder={tx('Ít nhất 8 ký tự', 'At least 8 characters', '8자 이상')} name="pw" autoComplete="new-password" describedBy="rp-pw-hint" />
            </Field>
            <Field label={t.auth.confirmPassword} htmlFor="rp-pw2" error={error}>
              <PasswordInput id="rp-pw2" placeholder={tx('Nhập lại mật khẩu mới', 'Re-enter the new password', '새 비밀번호 재입력')} name="pw2" autoComplete="new-password" describedBy={error ? 'rp-pw2-err' : undefined} />
            </Field>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? t.common.loading : tx('Lưu mật khẩu mới', 'Save new password', '새 비밀번호 저장')} <ArrowRight /></Button>
          </form>
        )}
      </motion.div>
    </AuthShell>
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
              <Link to="/forgot-password" className="-my-2 mb-0 inline-flex min-h-10 items-center text-[13px] font-semibold text-primary hover:underline">{t.auth.forgot}</Link>
            </div>
            <PasswordInput id="pw" placeholder={tx('Mật khẩu của bạn', 'Your password', '비밀번호')} name="pw" autoComplete="current-password" />
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
const EMPLOYEE_RANGES = ['1 – 10', '11 – 50', '51 – 200', '201 – 500', '500 – 1.000', '1.000 – 2.000', '2.000+']
const REG_COUNTRIES = ['VN', 'KR', 'JP', 'CN', 'US', 'DE', 'FR', 'GB', 'AU', 'SG', 'TH']

/** "Hồ sơ yêu cầu": 5 groups, max 5 files each; only the business registration certificate is mandatory. */
const DOC_GROUPS: { key: RegDocGroup; label: Parameters<typeof tx>; items: Parameters<typeof tx>[]; required?: boolean }[] = [
  { key: 'application', label: ['Đơn xin gia nhập hội viên', 'Membership application', '회원 가입 신청서'], items: [['Đơn đăng ký hội viên Liên đoàn Thương mại & Công nghiệp Việt Nam (VCCI)', 'VCCI membership application form', 'VCCI 회원 가입 신청서'], ['Giấy chứng nhận đăng ký doanh nghiệp', 'Enterprise registration certificate', '사업자등록증']] },
  { key: 'license', label: ['Giấy chứng nhận đăng ký kinh doanh', 'Business registration certificate', '영업 등록증'], items: [['Bản sao Giấy chứng nhận đăng ký kinh doanh', 'Copy of the business registration certificate', '영업 등록증 사본'], ['Giấy phép kinh doanh có điều kiện (nếu có)', 'Conditional business licence (if any)', '조건부 영업 허가증 (해당 시)']], required: true },
  { key: 'finance', label: ['Báo cáo tài chính', 'Financial statements', '재무제표'], items: [['Báo cáo tài chính gần nhất', 'Latest financial statements', '최근 재무제표'], ['Báo cáo thuế (nếu có)', 'Tax report (if any)', '세무 보고서 (해당 시)']] },
  { key: 'payment', label: ['Chứng từ thanh toán', 'Payment documents', '납부 증빙'], items: [['Biên lai thanh toán phí hội viên', 'Membership fee receipt', '회비 납부 영수증'], ['Chứng từ chuyển khoản', 'Bank transfer slip', '계좌 이체 증빙']] },
  { key: 'other', label: ['Tài liệu khác', 'Other documents', '기타 서류'], items: [['Tài liệu bổ sung', 'Supplementary documents', '추가 서류']] },
]

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
    leaders: emptyLeaders(),
    branches: [], docs: { application: [], license: [], finance: [], payment: [], other: [] },
  }))
  // inline errors for the custom controls (the Radix select's hidden native <select> must not drive validation)
  const [errors, setErrors] = useState<Partial<Record<'businessForm' | 'industries' | 'businessRegDate', string>>>({})
  const industriesRef = useRef<HTMLDivElement>(null)
  const set = <K extends keyof Reg>(k: K, v: Reg[K]) => {
    setR((x) => ({ ...x, [k]: v }))
    if (k === 'businessForm' || k === 'industries' || k === 'businessRegDate') setErrors((e) => ({ ...e, [k]: undefined }))
  }
  const setPerson = (role: keyof KeyLeaders, f: PersonField, v: string) => setR((x) => ({ ...x, leaders: { ...x.leaders, [role]: { ...x.leaders[role], [f]: v } } }))
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
      <p className="mt-2 text-muted-foreground">{t.auth.registerSub}. {tx('Trường có dấu * là bắt buộc.', 'Fields marked * are required.', '* 표시는 필수입니다.')}</p>
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
          if (step === 0) {
            const errs = {
              businessForm: r.businessForm ? undefined : tx('Chọn loại hình doanh nghiệp', 'Choose the legal form', '기업 형태를 선택하세요'),
              businessRegDate: r.businessRegDate ? undefined : tx('Chọn ngày cấp', 'Choose the date of issue', '발급일을 선택하세요'),
              industries: r.industries.length ? undefined : tx('Chọn ít nhất 1 ngành nghề', 'Choose at least one industry', '업종을 하나 이상 선택하세요'),
            }
            setErrors(errs)
            if (errs.businessForm) return document.getElementById('bf')?.focus()
            if (errs.businessRegDate) return document.getElementById('brd')?.focus()
            if (errs.industries) return industriesRef.current?.querySelector('button')?.focus()
          }
          if (step === 3 && !r.legalDocs.license) return toast({ kind: 'info', title: tx('Cần tải Giấy chứng nhận đăng ký kinh doanh', 'Business registration certificate is required', '영업 등록증을 업로드해야 합니다') })
          if (step < 3) {
            go(step + 1)
          } else if (USE_MOCK) setDone(true)
          else {
            setBusy(true)
            // files go up only now (token + fileIds); the BE links them to the new organization
            uploadPending(r).then((sent) => liveApi.registerBusiness({ ...sent, loginEmail: sent.loginEmail || sent.email })).then(
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
                <Field label={tx('Loại hình doanh nghiệp', 'Legal form', '기업 형태') + ' *'} htmlFor="bf" error={errors.businessForm}>
                  <Select id="bf" value={r.businessForm} onValueChange={(v) => set('businessForm', v)} placeholder={tx('Chọn loại hình', 'Choose a legal form', '형태 선택')} aria-describedby={errors.businessForm ? 'bf-err' : undefined} className={cn(errors.businessForm && 'border-destructive ring-4 ring-destructive/12')} options={BUSINESS_FORMS.map((o) => ({ value: o.value, label: L(o) }))} />
                </Field>
                {r.businessForm === 'OTHER' && (
                  <Field label={tx('Ghi rõ loại hình', 'Specify legal form', '기업 형태 명시') + ' *'} htmlFor="bf-other"><Input id="bf-other" placeholder={tx('Nhập loại hình doanh nghiệp', 'Enter the legal form', '기업 형태 입력')} required maxLength={150} value={r.otherBusinessForm} onChange={(e) => set('otherBusinessForm', e.target.value)} /></Field>
                )}
                <Field label={tx('Số đăng ký kinh doanh', 'Business registration no.', '영업 등록 번호') + ' *'} htmlFor="brn"><Input id="brn" placeholder={tx('VD: 0123456789', 'e.g. 0123456789', '예: 0123456789')} required maxLength={50} value={r.businessRegNo} onChange={(e) => set('businessRegNo', e.target.value)} /></Field>
                <Field label={tx('Ngày cấp', 'Date of issue', '발급일') + ' *'} htmlFor="brd" error={errors.businessRegDate}><DateField id="brd" required max={today} value={r.businessRegDate} onChange={(e) => set('businessRegDate', e.target.value)} /></Field>
                <Field label={tx('Nơi cấp', 'Place of issue', '발급 기관') + ' *'} htmlFor="brp" className="sm:col-span-2"><Input id="brp" required maxLength={255} value={r.businessRegPlace} onChange={(e) => set('businessRegPlace', e.target.value)} placeholder={tx('VD: Sở Kế hoạch và Đầu tư TP. Hà Nội', 'e.g. Hanoi Department of Planning and Investment', '예: 하노이 기획투자국')} /></Field>
                <Field label={tx('Loại hình hoạt động', 'Business type', '사업 유형') + ' *'} htmlFor="bt">
                  <Select id="bt" value={r.businessType} onValueChange={(v) => set('businessType', v)} options={(Object.keys(t.supplier.types) as (keyof typeof t.supplier.types)[]).map((k) => ({ value: k, label: t.supplier.types[k] }))} />
                </Field>
                <div className="sm:col-span-2" role="group" aria-labelledby="ind-label" aria-describedby={errors.industries ? 'ind-err' : undefined}>
                  <p id="ind-label" className="mb-2 text-[13px] font-semibold">{t.auth.industry} *</p>
                  <div ref={industriesRef} className="flex flex-wrap gap-2">
                    {categories.map((c) => {
                      const on = r.industries.includes(c.id)
                      return (
                        <button key={c.id} type="button" aria-pressed={on} onClick={() => set('industries', on ? r.industries.filter((x) => x !== c.id) : [...r.industries, c.id])} className={cn('inline-flex min-h-10 items-center gap-1 rounded-full border px-3.5 text-[13px] font-medium transition active:scale-[0.97]', on ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/50', errors.industries && !on && 'border-destructive/50')}>
                          {on && <Check className="size-3.5" />} {L(c.categoryName)}
                        </button>
                      )
                    })}
                  </div>
                  {errors.industries && <p id="ind-err" role="alert" className="mt-1.5 text-[13px] font-semibold text-destructive">{errors.industries}</p>}
                </div>
                <Field label={tx('Vốn điều lệ', 'Charter capital', '자본금') + ' *'} htmlFor="cap">
                  <div className="flex gap-2">
                    <Input id="cap" placeholder={tx('VD: 10000000000', 'e.g. 10000000000', '예: 10000000000')} required inputMode="numeric" value={r.charterCapital} onChange={(e) => set('charterCapital', e.target.value)} />
                    <Select aria-label={tx('Đơn vị tiền tệ', 'Currency', '통화')} className="w-24 shrink-0" value={r.charterCurrency} onValueChange={(v) => set('charterCurrency', v)} options={[{ value: 'VND', label: 'VND' }, { value: 'USD', label: 'USD' }]} />
                  </div>
                </Field>
                {/* optional figures stay folded so the required part of step 1 reads as one short form */}
                <details className="group rounded-2xl bg-muted/60 sm:col-span-2" open={!!(r.totalAssets || r.employees || r.totalRevenue || r.reportYear || r.website || r.fax)}>
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                    <span>{tx('Thông tin bổ sung', 'More details', '추가 정보')} <span className="font-normal text-muted-foreground">· {tx('không bắt buộc, có thể khai sau trong hồ sơ', 'optional, can be added later in your profile', '선택 사항, 나중에 프로필에서 입력 가능')}</span></span>
                    <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="grid gap-4 px-4 pb-4 pt-1 sm:grid-cols-2">
                    <Field label={tx('Tổng tài sản', 'Total assets', '총자산')} htmlFor="assets" hint={tx('Cùng đơn vị tiền tệ với vốn điều lệ', 'Same currency as charter capital', '자본금과 같은 통화')}>
                      <Input id="assets" placeholder={tx('VD: 50000000000', 'e.g. 50000000000', '예: 50000000000')} inputMode="numeric" pattern="\d*" value={r.totalAssets} onChange={(e) => set('totalAssets', e.target.value.replace(/\D/g, ''))} />
                    </Field>
                    <Field label={tx('Số lao động', 'Employees', '직원 수')} htmlFor="emp">
                      <Select id="emp" placeholder={tx('Chọn quy mô nhân sự', 'Choose a headcount range', '직원 규모 선택')} value={r.employees} onValueChange={(v) => set('employees', v)} options={[{ value: '', label: tx('Không chọn', 'None', '선택 안 함') }, ...EMPLOYEE_RANGES.map((x) => ({ value: x, label: x }))]} />
                    </Field>
                    <Field label={tx('Tổng doanh thu năm gần nhất', 'Latest annual revenue', '최근 연매출')} htmlFor="rev" hint={tx('Tự khai; xác minh bằng chứng từ ở bước hoàn thiện hồ sơ', 'Self-declared; verified with evidence in your profile', '자체 신고; 프로필에서 증빙으로 검증')}>
                      <Input id="rev" placeholder={tx('VD: 20000000000', 'e.g. 20000000000', '예: 20000000000')} inputMode="numeric" value={r.totalRevenue} onChange={(e) => set('totalRevenue', e.target.value)} />
                    </Field>
                    <Field label={tx('Năm báo cáo', 'Reporting year', '보고 연도')} htmlFor="ry"><Input id="ry" placeholder={String(new Date().getFullYear() - 1)} inputMode="numeric" pattern="\d{4}" value={r.reportYear} onChange={(e) => set('reportYear', e.target.value)} /></Field>
                    <Field label="Website" htmlFor="web"><Input id="web" value={r.website} onChange={(e) => set('website', e.target.value)} placeholder="www.company.vn" /></Field>
                    <Field label="Fax" htmlFor="fax"><Input id="fax" placeholder={'024 3825 0000'} value={r.fax} onChange={(e) => set('fax', e.target.value)} /></Field>
                  </div>
                </details>
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
                <LeadersFields value={r.leaders} onChange={setPerson} />
                <BranchesFields value={r.branches} onChange={(v) => set('branches', v)} />
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
