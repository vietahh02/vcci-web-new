import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Quote, RefreshCw } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { emptyProfile, useProfile, type Registration } from '@/lib/profile'
import { FileUpload, ImageUpload, UploadGuide } from '@/components/upload/Upload'
import { tx } from '@/lib/tx'
import { categories } from '@/data/mock'
import { Logo } from '@/components/brand'
import { CountUp } from '@/components/effects'
import { LangSwitcher } from '@/components/layout/LangSwitcher'
import { useToast } from '@/components/ui/overlay'
import { Button, Field, Input, Select } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

function AuthShell({ children, wide }: { children: ReactNode; wide?: boolean }) {
  const { t } = useI18n()
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
  const { signIn } = useProfile()
  const [params] = useSearchParams()
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
            signIn()
            navigate(params.get('return') ?? '/account/profile')
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
  { value: 'COOPERATIVE', vi: 'Hợp tác xã', en: 'Cooperative', ko: '협동조합' },
  { value: 'STATE_OWNED', vi: 'Doanh nghiệp nhà nước', en: 'State-owned enterprise', ko: '국영 기업' },
  { value: 'OTHER', vi: 'Khác', en: 'Other', ko: '기타' },
]
const EMPLOYEE_RANGES = ['1 – 10', '11 – 50', '51 – 200', '201 – 500', '500 – 1.000', '1.000 – 2.000', '2.000+']
const REG_COUNTRIES = ['VN', 'KR', 'JP', 'CN', 'US', 'DE', 'FR', 'GB', 'AU', 'SG', 'TH']

type Reg = Registration & { nameVi: string; nameEn: string; taxCode: string; logo: string; loginEmail: string }

export function Register() {
  const { t, L, locale } = useI18n()
  const { signIn } = useProfile()
  const navigate = useNavigate()
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [done, setDone] = useState(false)
  const [r, setR] = useState<Reg>(() => ({ ...emptyProfile().registration, nameVi: '', nameEn: '', taxCode: '', logo: '', loginEmail: '' }))
  const set = <K extends keyof Reg>(k: K, v: Reg[K]) => setR((x) => ({ ...x, [k]: v }))
  const region = new Intl.DisplayNames([locale], { type: 'region' })
  const steps = [tx('Doanh nghiệp', 'Company', '기업'), tx('Địa chỉ & liên hệ', 'Address & contact', '주소 & 연락처'), tx('Người đại diện', 'Representative', '대표자'), tx('Pháp lý & tài khoản', 'Legal & account', '법인 서류 & 계정')]
  const go = (n: number) => {
    setDir(n > step ? 1 : -1)
    setStep(n)
  }

  const submit = () => {
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
            <p className={cn('mt-2 truncate text-xs font-semibold', i <= step ? 'text-foreground' : 'text-muted-foreground')}>{i + 1}. {s}</p>
          </button>
        ))}
      </div>

      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault()
          if (step === 0 && !r.industries.length) return toast({ kind: 'info', title: tx('Chọn ít nhất 1 ngành nghề', 'Choose at least one industry', '업종을 하나 이상 선택하세요') })
          if (step === 3 && !r.legalDocs.license) return toast({ kind: 'info', title: tx('Cần tải Giấy chứng nhận đăng ký doanh nghiệp', 'Business registration certificate is required', '사업자등록증을 업로드해야 합니다') })
          if (step < 3) {
            if (step === 2 && !r.loginEmail) set('loginEmail', r.repEmail || r.email)
            go(step + 1)
          } else setDone(true)
        }}
      >
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -40 }} transition={{ duration: 0.28 }} className="grid gap-4 sm:grid-cols-2">
            {step === 0 && (
              <>
                <Field label={tx('Tên doanh nghiệp (tiếng Việt)', 'Company name (Vietnamese)', '기업명 (베트남어)') + ' *'} htmlFor="bn" className="sm:col-span-2"><Input id="bn" required value={r.nameVi} onChange={(e) => set('nameVi', e.target.value)} /></Field>
                <Field label={tx('Tên tiếng Anh', 'English name', '영문 기업명')} htmlFor="bn-en"><Input id="bn-en" value={r.nameEn} onChange={(e) => set('nameEn', e.target.value)} /></Field>
                <Field label={t.auth.taxCode + ' *'} htmlFor="tax" hint={tx('10 hoặc 13 chữ số, trùng mã số doanh nghiệp', '10 or 13 digits, same as enterprise code', '10자리 또는 13자리')}>
                  <Input id="tax" required inputMode="numeric" pattern="\d{10}(\d{3})?" title={tx('10 hoặc 13 chữ số', '10 or 13 digits', '10자리 또는 13자리')} value={r.taxCode} onChange={(e) => set('taxCode', e.target.value.replace(/\D/g, ''))} />
                </Field>
                <Field label={tx('Loại hình doanh nghiệp', 'Legal form', '기업 형태') + ' *'} htmlFor="bf">
                  <Select id="bf" required value={r.businessForm} onChange={(e) => set('businessForm', e.target.value)}>
                    <option value="" disabled>—</option>
                    {BUSINESS_FORMS.map((o) => <option key={o.value} value={o.value}>{L(o)}</option>)}
                  </Select>
                </Field>
                <Field label={tx('Loại hình hoạt động', 'Business type', '사업 유형') + ' *'} htmlFor="bt">
                  <Select id="bt" value={r.businessType} onChange={(e) => set('businessType', e.target.value)}>
                    {(Object.keys(t.supplier.types) as (keyof typeof t.supplier.types)[]).map((k) => <option key={k} value={k}>{t.supplier.types[k]}</option>)}
                  </Select>
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
                    <Input id="cap" required inputMode="numeric" value={r.charterCapital} onChange={(e) => set('charterCapital', e.target.value)} />
                    <Select aria-label={tx('Đơn vị tiền tệ', 'Currency', '통화')} className="w-24 shrink-0" value={r.charterCurrency} onChange={(e) => set('charterCurrency', e.target.value)}><option>VND</option><option>USD</option></Select>
                  </div>
                </Field>
                <Field label={tx('Số lao động', 'Employees', '직원 수')} htmlFor="emp">
                  <Select id="emp" value={r.employees} onChange={(e) => set('employees', e.target.value)}><option value="">—</option>{EMPLOYEE_RANGES.map((x) => <option key={x}>{x}</option>)}</Select>
                </Field>
                <Field label={tx('Tổng doanh thu năm gần nhất', 'Latest annual revenue', '최근 연매출')} htmlFor="rev" hint={tx('Tự khai; xác minh bằng chứng từ ở bước hoàn thiện hồ sơ', 'Self-declared; verified with evidence in your profile', '자체 신고; 프로필에서 증빙으로 검증')}>
                  <Input id="rev" inputMode="numeric" value={r.totalRevenue} onChange={(e) => set('totalRevenue', e.target.value)} />
                </Field>
                <Field label={tx('Năm báo cáo', 'Reporting year', '보고 연도')} htmlFor="ry"><Input id="ry" inputMode="numeric" pattern="\d{4}" value={r.reportYear} onChange={(e) => set('reportYear', e.target.value)} /></Field>
                <Field label="Website" htmlFor="web"><Input id="web" value={r.website} onChange={(e) => set('website', e.target.value)} placeholder="www.company.vn" /></Field>
                <Field label="Fax" htmlFor="fax"><Input id="fax" value={r.fax} onChange={(e) => set('fax', e.target.value)} /></Field>
              </>
            )}
            {step === 1 && (
              <>
                <Field label={t.auth.country + ' *'} htmlFor="ct">
                  <Select id="ct" value={r.country} onChange={(e) => set('country', e.target.value)}>{REG_COUNTRIES.map((c) => <option key={c} value={c}>{region.of(c)}</option>)}</Select>
                </Field>
                <Field label={t.auth.province + ' *'} htmlFor="prov"><Input id="prov" required value={r.province} onChange={(e) => set('province', e.target.value)} /></Field>
                <Field label={tx('Địa chỉ trụ sở chính', 'Registered address', '본사 주소') + ' *'} htmlFor="addr" className="sm:col-span-2" hint={tx('Ghi đúng như trên Giấy chứng nhận đăng ký doanh nghiệp', 'As shown on the business registration certificate', '사업자등록증 기재 주소')}>
                  <Input id="addr" required value={r.address} onChange={(e) => set('address', e.target.value)} />
                </Field>
                <Field label={tx('Email doanh nghiệp', 'Company email', '기업 이메일') + ' *'} htmlFor="cem"><Input id="cem" type="email" required value={r.email} onChange={(e) => set('email', e.target.value)} /></Field>
                <Field label={tx('Điện thoại doanh nghiệp', 'Company phone', '기업 전화') + ' *'} htmlFor="cph"><Input id="cph" type="tel" required value={r.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
              </>
            )}
            {step === 2 && (
              <>
                <Field label={t.auth.repName + ' *'} htmlFor="rn" className="sm:col-span-2"><Input id="rn" required value={r.repName} onChange={(e) => set('repName', e.target.value)} /></Field>
                <Field label={t.auth.position + ' *'} htmlFor="pos"><Input id="pos" required value={r.repTitle} onChange={(e) => set('repTitle', e.target.value)} /></Field>
                <Field label={t.auth.repPhone + ' *'} htmlFor="rp"><Input id="rp" type="tel" required value={r.repPhone} onChange={(e) => set('repPhone', e.target.value)} /></Field>
                <Field label={t.auth.repEmail + ' *'} htmlFor="re" className="sm:col-span-2" hint={tx('Thông báo duyệt hồ sơ và mật khẩu lần đầu gửi về email này', 'Approval notice and first-time password are sent here', '승인 안내와 초기 비밀번호가 이 이메일로 발송됩니다')}>
                  <Input id="re" type="email" required value={r.repEmail} onChange={(e) => set('repEmail', e.target.value)} />
                </Field>
              </>
            )}
            {step === 3 && (
              <>
                <div className="sm:col-span-2">
                  <p className="mb-2 text-[13px] font-semibold">{tx('Giấy chứng nhận đăng ký doanh nghiệp', 'Business registration certificate', '사업자등록증')} *</p>
                  <FileUpload rule="legal" value={r.legalDocs.license} onChange={(v) => set('legalDocs', { ...r.legalDocs, license: v })} />
                </div>
                <div className="sm:col-span-2">
                  <p className="mb-2 text-[13px] font-semibold">{tx('Giấy chứng nhận đăng ký thuế (nếu có)', 'Tax registration certificate (if any)', '세무 등록증 (해당 시)')}</p>
                  <FileUpload rule="legal" compact value={r.legalDocs.tax} onChange={(v) => set('legalDocs', { ...r.legalDocs, tax: v })} />
                </div>
                <div className="sm:col-span-2">
                  <p className="mb-2 text-[13px] font-semibold">{tx('Logo doanh nghiệp (không bắt buộc)', 'Company logo (optional)', '기업 로고 (선택)')}</p>
                  <ImageUpload rule="logo" value={r.logo} onChange={(v) => set('logo', v)} />
                </div>
                <Field label={t.auth.email + ' *'} htmlFor="ae" className="sm:col-span-2"><Input id="ae" type="email" required value={r.loginEmail} onChange={(e) => set('loginEmail', e.target.value)} /></Field>
                <Field label={t.auth.password} htmlFor="ap"><PasswordInput id="ap" /></Field>
                <Field label={t.auth.confirmPassword} htmlFor="ap2"><PasswordInput id="ap2" /></Field>
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
          <Button type="submit" size="lg">{step < 3 ? t.common.next : t.common.submit} <ArrowRight /></Button>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t.auth.haveAccount} <Link to="/login" className="font-semibold text-primary hover:underline">{t.nav.login}</Link>
      </p>
    </AuthShell>
  )
}
