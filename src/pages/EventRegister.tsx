/**
 * /events/:id/register — full-page visitor registration modelled on the Global Sources trade-show
 * registration: attendance (phase/day) → registrant → company → sourcing needs → consent,
 * then payment (if any) and an e-badge with QR. Pre-filled from the company profile when signed in.
 * POST /api/event/registrations (+ /payment multipart for paid events).
 */
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, CalendarPlus, Check, Copy, FileUp, Gift, Handshake, Info, MapPin, Printer, Sparkles, Ticket, Users } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEvent } from '@/api'
import { categories, type EventItem } from '@/data/mock'
import { getProgramme } from '@/data/schedules'
import { ProfileRegistration } from '@/components/event/ProfileRegistration'
import { Confetti, FakeQr } from '@/components/event/visuals'
import { useToast } from '@/components/ui/overlay'
import { Button, buttonClass, Field, Input, Select, Textarea } from '@/components/ui/primitives'
import NotFound from '@/pages/NotFound'
import { useI18n, type Bilingual } from '@/lib/i18n'
import { useProfile } from '@/lib/profile'
import { tx } from '@/lib/tx'
import { cn, formatDate, formatMoney, img } from '@/lib/utils'

const b = (vi: string, en: string, ko: string): Bilingual & { value: string } => ({ value: en, vi, en, ko })

const SALUTATIONS = [b('Ông', 'Mr.', 'Mr.'), b('Bà', 'Ms.', 'Ms.'), b('Khác', 'Other', '기타')]
const DEPARTMENTS = [b('Ban giám đốc', 'Management', '경영진'), b('Mua hàng / Thu mua', 'Purchasing / Sourcing', '구매 / 소싱'), b('Kinh doanh / Xuất khẩu', 'Sales / Export', '영업 / 수출'), b('Sản xuất / Kỹ thuật', 'Production / Engineering', '생산 / 기술'), b('Marketing', 'Marketing', '마케팅'), b('Khác', 'Other', '기타')]
const BUSINESS_TYPES = [
  b('Nhà nhập khẩu', 'Importer', '수입업체'), b('Nhà phân phối / Bán buôn', 'Distributor / Wholesaler', '유통 / 도매업체'), b('Nhà bán lẻ / Chuỗi cửa hàng', 'Retailer / Chain store', '소매 / 체인점'),
  b('Thương hiệu', 'Brand owner', '브랜드사'), b('Nhà sản xuất', 'Manufacturer', '제조업체'), b('Văn phòng thu mua', 'Buying office / Agent', '구매 대행사'),
  b('Thương mại điện tử', 'E-commerce seller', '전자상거래 판매자'), b('Khác', 'Other', '기타'),
]
const STAFF = ['1 – 10', '11 – 50', '51 – 200', '201 – 500', '501 – 1.000', '1.000+']
const VOLUME = [b('Dưới 100.000 USD', 'Under USD 100K', '10만 달러 미만'), b('100.000 – 500.000 USD', 'USD 100K – 500K', '10만 – 50만 달러'), b('500.000 – 1 triệu USD', 'USD 500K – 1M', '50만 – 100만 달러'), b('1 – 5 triệu USD', 'USD 1M – 5M', '100만 – 500만 달러'), b('Trên 5 triệu USD', 'Over USD 5M', '500만 달러 초과')]
const ROLES = [b('Người quyết định mua', 'Final decision maker', '최종 구매 결정권자'), b('Đề xuất / ảnh hưởng quyết định', 'Recommend / influence', '구매 추천 / 영향'), b('Tìm hiểu thông tin', 'Research only', '정보 수집')]
const PURPOSES = [b('Tìm nhà cung cấp mới', 'Find new suppliers', '신규 공급업체 발굴'), b('Tìm sản phẩm mới', 'Source new products', '신제품 소싱'), b('Gặp nhà cung cấp hiện tại', 'Meet current suppliers', '기존 공급업체 미팅'), b('Nắm bắt xu hướng thị trường', 'Market trends', '시장 트렌드 파악'), b('Tìm đối tác đầu tư / liên doanh', 'Investment / JV partners', '투자 / 합작 파트너')]
const COUNTRIES = ['VN', 'KR', 'JP', 'CN', 'US', 'DE', 'FR', 'GB', 'AU', 'SG', 'TH', 'IN', 'AE']
const DIAL: Record<string, string> = { VN: '+84', KR: '+82', JP: '+81', CN: '+86', US: '+1', DE: '+49', FR: '+33', GB: '+44', AU: '+61', SG: '+65', TH: '+66', IN: '+91', AE: '+971' }

type Form = {
  dates: string[]
  salutation: string; firstName: string; lastName: string; jobTitle: string; department: string; email: string; country: string; phone: string
  company: string; taxCode: string; companyCountry: string; city: string; website: string; businessType: string; staff: string; volume: string
  interests: string[]; role: string; purposes: string[]; meetSlots: string[]; answers: Record<string, string>
  news: boolean; terms: boolean
}

export default function EventRegister() {
  const { id = '' } = useParams()
  const ev = getEvent(id)
  if (!ev) return <NotFound />
  return <RegisterFlow ev={ev} />
}

function RegisterFlow({ ev }: { ev: EventItem }) {
  const { t, L, locale } = useI18n()
  const toast = useToast()
  const { session, profile, register } = useProfile()
  const programme = getProgramme(ev.id)
  const paid = ev.participationFee > 0
  const matchmaking = ev.eventType === 'MATCHMAKING'
  const steps = [tx('Thông tin đăng ký', 'Registration details', '등록 정보'), ...(paid ? [tx('Thanh toán', 'Payment', '결제')] : []), tx('Thẻ tham dự', 'Your badge', '참가 배지')]
  const [step, setStep] = useState(0)
  const [proof, setProof] = useState<string | null>(null)
  const regCode = useMemo(() => `VCCI-${ev.id.replace('e-', '').toUpperCase()}-${String(Math.abs([...ev.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % 100000).padStart(5, '0')}`, [ev.id])
  const allDates = programme ? programme.phases.flatMap((p) => p.dates) : [ev.startDate.slice(0, 10)]

  const person = profile.attendees[0]
  const [f, setF] = useState<Form>(() => ({
    dates: allDates.slice(0, 1),
    salutation: 'Mr.', firstName: person?.name.split(' ').slice(-1).join(' ') ?? '', lastName: person?.name.split(' ').slice(0, -1).join(' ') ?? '',
    jobTitle: person?.title ?? profile.general.contactTitle, department: '', email: person?.email ?? profile.general.contactEmail, country: 'VN', phone: person?.phone ?? profile.general.contactPhone,
    company: session ? profile.general.nameVi || session.companyName : '', taxCode: profile.general.taxCode, companyCountry: 'VN', city: '', website: profile.general.channels.split(',')[0]?.trim() ?? '',
    businessType: '', staff: '', volume: '', interests: [], role: '', purposes: [], meetSlots: [], answers: {}, news: true, terms: false,
  }))
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }))
  const toggle = (k: 'dates' | 'interests' | 'purposes' | 'meetSlots', v: string) => setF((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }))
  const region = useMemo(() => new Intl.DisplayNames([locale], { type: 'region' }), [locale])
  const interestOptions: Bilingual[] = programme ? programme.phases.flatMap((p) => p.categories) : categories.map((c) => c.categoryName)

  const finish = () => {
    if (session) register({ eventId: ev.id, attendees: [{ id: 'reg', name: `${f.lastName} ${f.firstName}`.trim(), title: f.jobTitle, email: f.email, phone: f.phone }], answers: f.answers })
    setStep(steps.length - 1)
    toast({ kind: 'success', title: t.events.doneTitle })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="pb-10">
      {/* banner */}
      <section className="relative isolate overflow-hidden bg-navy text-white">
        <img src={img(ev.coverImage, 1800, 500)} alt="" className="absolute inset-0 -z-20 size-full object-cover opacity-25" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/90 to-navy/60" />
        <div className="container-page py-10">
          <Link to={`/events/${ev.id}`} className="inline-flex items-center gap-1.5 text-[13px] text-white/60 hover:text-white"><ArrowLeft className="size-4" /> {tx('Quay lại sự kiện', 'Back to event', '행사로 돌아가기')}</Link>
          <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.16em] text-gold-bright">{matchmaking ? tx('Đăng ký tham gia chương trình', 'Programme application', '프로그램 참가 신청') : tx('Đăng ký tham quan', 'Visitor registration', '참관 등록')}</p>
          <h1 className="mt-2 max-w-3xl text-2xl font-extrabold leading-tight md:text-4xl">{L(ev.title)}</h1>
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/75">
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" /> {formatDate(ev.startDate, locale)}{ev.endDate.slice(0, 10) !== ev.startDate.slice(0, 10) && ` – ${formatDate(ev.endDate, locale)}`}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> {L(ev.location)}</span>
          </p>
          {/* steps */}
          <ol className="mt-8 flex max-w-xl items-center gap-2">
            {steps.map((s, i) => (
              <li key={s} className="flex flex-1 items-center gap-2">
                <span className={cn('grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition', i < step ? 'bg-success text-white' : i === step ? 'bg-gold-bright text-navy' : 'bg-white/15 text-white/70')}>
                  {i < step ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className={cn('hidden text-[13px] font-semibold sm:block', i <= step ? 'text-white' : 'text-white/55')}>{s}</span>
                {i < steps.length - 1 && <span className={cn('h-px flex-1', i < step ? 'bg-success' : 'bg-white/20')} />}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="container-page mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              {step === 0 && matchmaking && (
                <div className="rounded-2xl border bg-card">
                  <ProfileRegistration ev={ev} onDone={() => (paid ? setStep(1) : finish())} />
                </div>
              )}

              {step === 0 && !matchmaking && (
                <form
                  className="space-y-6"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!f.dates.length) return toast({ kind: 'info', title: tx('Chọn ít nhất 1 ngày tham dự', 'Choose at least one day', '참가일을 하나 이상 선택하세요') })
                    if (paid) { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }) } else finish()
                  }}
                >
                  {session ? (
                    <p className="flex flex-wrap items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-sm text-success">
                      <BadgeCheck className="size-4" /> {tx('Đã điền sẵn từ hồ sơ doanh nghiệp. Kiểm tra lại trước khi gửi.', 'Pre-filled from your company profile. Please review before submitting.', '기업 프로필에서 자동 입력되었습니다. 제출 전에 확인하세요.')}
                      <Link to={`/account/profile?return=${encodeURIComponent(`/events/${ev.id}/register`)}`} className="ml-auto font-semibold underline-offset-4 hover:underline">{tx('Sửa hồ sơ', 'Edit profile', '프로필 수정')}</Link>
                    </p>
                  ) : (
                    <p className="flex flex-wrap items-center gap-2 rounded-xl bg-primary-soft px-4 py-3 text-sm text-primary">
                      <Info className="size-4" /> {tx('Đã có tài khoản doanh nghiệp? Đăng nhập để tự điền thông tin.', 'Have a business account? Sign in to auto-fill.', '기업 계정이 있으신가요? 로그인하면 자동 입력됩니다.')}
                      <Link to={`/login?return=${encodeURIComponent(`/events/${ev.id}/register`)}`} className="ml-auto font-semibold underline-offset-4 hover:underline">{tx('Đăng nhập', 'Sign in', '로그인')}</Link>
                    </p>
                  )}

                  <Section n={1} title={tx('Chọn ngày tham dự', 'Choose your visit days', '참가일 선택')}>
                    {programme ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {programme.phases.map((p) => (
                          <div key={p.id} className="rounded-xl border p-4">
                            <p className="text-sm font-bold text-primary">{L(p.name)}</p>
                            <p className="text-[15px] font-semibold">{L(p.theme)}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{L(p.venue)}</p>
                            <div className="mt-3 space-y-1.5">
                              {p.dates.map((d) => (
                                <label key={d} className={cn('flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition', f.dates.includes(d) ? 'border-primary bg-primary-soft/60 font-medium' : 'hover:border-primary/40')}>
                                  <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={f.dates.includes(d)} onChange={() => toggle('dates', d)} />
                                  {formatDate(`${d}T12:00:00`, locale, { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl border px-4 py-3 text-sm">
                        <Check className="mr-2 inline size-4 text-success" />
                        {formatDate(ev.startDate, locale, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} · {ev.startTime}–{ev.endTime}
                      </p>
                    )}
                  </Section>

                  <Section n={2} title={tx('Thông tin người đăng ký', 'Your details', '등록자 정보')}>
                    <div className="grid gap-4 sm:grid-cols-[120px_1fr_1fr]">
                      <Field label={tx('Danh xưng', 'Title', '호칭')} htmlFor="r-sal">
                        <Select id="r-sal" value={f.salutation} onChange={(e) => set('salutation', e.target.value)}>{SALUTATIONS.map((o) => <option key={o.value} value={o.value}>{L(o)}</option>)}</Select>
                      </Field>
                      <Field label={tx('Họ', 'Last name', '성') + ' *'} htmlFor="r-ln"><Input id="r-ln" required value={f.lastName} onChange={(e) => set('lastName', e.target.value)} /></Field>
                      <Field label={tx('Tên', 'First name', '이름') + ' *'} htmlFor="r-fn"><Input id="r-fn" required value={f.firstName} onChange={(e) => set('firstName', e.target.value)} /></Field>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <Field label={tx('Chức danh', 'Job title', '직함') + ' *'} htmlFor="r-jt"><Input id="r-jt" required value={f.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} /></Field>
                      <Field label={tx('Bộ phận', 'Department', '부서')} htmlFor="r-dep">
                        <Select id="r-dep" value={f.department} onChange={(e) => set('department', e.target.value)}>
                          <option value="">—</option>
                          {DEPARTMENTS.map((o) => <option key={o.value} value={o.value}>{L(o)}</option>)}
                        </Select>
                      </Field>
                      <Field label="Email *" htmlFor="r-em" hint={tx('Thẻ tham dự và link tham gia gửi về email này', 'Your badge and joining link are sent here', '참가 배지와 참여 링크가 이 이메일로 발송됩니다')}><Input id="r-em" type="email" required value={f.email} onChange={(e) => set('email', e.target.value)} /></Field>
                      <Field label={tx('Điện thoại di động', 'Mobile', '휴대폰') + ' *'} htmlFor="r-ph">
                        <div className="flex gap-2">
                          <Select aria-label={tx('Mã quốc gia', 'Country code', '국가 번호')} className="w-28 shrink-0" value={f.country} onChange={(e) => set('country', e.target.value)}>
                            {COUNTRIES.map((c) => <option key={c} value={c}>{c} {DIAL[c]}</option>)}
                          </Select>
                          <Input id="r-ph" type="tel" required value={f.phone} onChange={(e) => set('phone', e.target.value)} />
                        </div>
                      </Field>
                    </div>
                  </Section>

                  <Section n={3} title={tx('Thông tin doanh nghiệp', 'Company information', '기업 정보')}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label={tx('Tên doanh nghiệp', 'Company name', '기업명') + ' *'} htmlFor="r-co" className="sm:col-span-2"><Input id="r-co" required value={f.company} onChange={(e) => set('company', e.target.value)} /></Field>
                      <Field label={tx('Quốc gia / khu vực', 'Country / region', '국가 / 지역') + ' *'} htmlFor="r-cc">
                        <Select id="r-cc" value={f.companyCountry} onChange={(e) => set('companyCountry', e.target.value)}>
                          {COUNTRIES.map((c) => <option key={c} value={c}>{region.of(c)}</option>)}
                        </Select>
                      </Field>
                      <Field label={tx('Tỉnh / Thành phố', 'City', '도시')} htmlFor="r-city"><Input id="r-city" value={f.city} onChange={(e) => set('city', e.target.value)} /></Field>
                      <Field label="Website" htmlFor="r-web"><Input id="r-web" value={f.website} onChange={(e) => set('website', e.target.value)} placeholder="www.company.com" /></Field>
                      <Field label={tx('Mã số thuế', 'Tax / business reg. no.', '사업자 번호')} htmlFor="r-tax"><Input id="r-tax" value={f.taxCode} onChange={(e) => set('taxCode', e.target.value)} /></Field>
                    </div>
                    <p className="mb-2.5 mt-5 text-[13px] font-semibold">{tx('Loại hình kinh doanh', 'Business type', '사업 유형')} *</p>
                    <Chips options={BUSINESS_TYPES} value={f.businessType ? [f.businessType] : []} onToggle={(v) => set('businessType', v)} single />
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <Field label={tx('Quy mô nhân sự', 'Number of employees', '직원 수')} htmlFor="r-staff">
                        <Select id="r-staff" value={f.staff} onChange={(e) => set('staff', e.target.value)}><option value="">—</option>{STAFF.map((s) => <option key={s}>{s}</option>)}</Select>
                      </Field>
                      <Field label={tx('Kim ngạch mua hàng hằng năm', 'Annual purchasing volume', '연간 구매 규모')} htmlFor="r-vol">
                        <Select id="r-vol" value={f.volume} onChange={(e) => set('volume', e.target.value)}><option value="">—</option>{VOLUME.map((o) => <option key={o.value} value={o.value}>{L(o)}</option>)}</Select>
                      </Field>
                    </div>
                  </Section>

                  <Section n={4} title={tx('Nhu cầu tham dự', 'Your sourcing needs', '소싱 수요')}>
                    <p className="mb-2.5 text-[13px] font-semibold">{tx('Ngành hàng quan tâm', 'Product interests', '관심 품목')}</p>
                    <Chips options={interestOptions.map((c) => ({ ...c, value: c.en }))} value={f.interests} onToggle={(v) => toggle('interests', v)} />
                    <p className="mb-2.5 mt-6 text-[13px] font-semibold">{tx('Vai trò trong quyết định mua hàng', 'Your purchasing role', '구매 결정 역할')}</p>
                    <Chips options={ROLES} value={f.role ? [f.role] : []} onToggle={(v) => set('role', v)} single />
                    <p className="mb-2.5 mt-6 text-[13px] font-semibold">{tx('Mục đích tham dự', 'Purpose of visit', '참관 목적')}</p>
                    <Chips options={PURPOSES} value={f.purposes} onToggle={(v) => toggle('purposes', v)} />
                    {programme && (
                      <>
                        <p className="mb-1 mt-6 text-[13px] font-semibold">{tx('Đặt lịch gặp sau phần ra mắt sản phẩm', 'Book a meeting after a product launch', '신제품 런칭 후 미팅 예약')}</p>
                        <p className="mb-2.5 text-xs text-muted-foreground">{tx('Chỉ hiện các phiên trong ngày bạn chọn. Nhà cung cấp sẽ xác nhận lịch gặp qua email.', 'Only sessions on your chosen days are shown. Suppliers confirm by email.', '선택한 날짜의 세션만 표시됩니다. 공급업체가 이메일로 확정합니다.')}</p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {programme.schedule.filter((s) => f.dates.includes(s.date)).map((s) => {
                            const key = `${s.date}-${s.start}`
                            const on = f.meetSlots.includes(key)
                            return (
                              <label key={key} className={cn('flex min-w-0 cursor-pointer gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] transition', on ? 'border-primary bg-primary-soft/60' : 'hover:border-primary/40')}>
                                <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]" checked={on} onChange={() => toggle('meetSlots', key)} />
                                <span className="min-w-0">
                                  <span className="block font-semibold">{formatDate(`${s.date}T12:00:00`, locale, { day: '2-digit', month: '2-digit', year: 'numeric' })} · {s.start} · {s.booth}</span>
                                  <span className="block truncate text-muted-foreground">{L(s.company)} — {L(s.product)}</span>
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </>
                    )}
                    {ev.questions?.map((q) => (
                      <div key={q.id} className="mt-6">
                        <p className="mb-2.5 text-[13px] font-semibold">{L(q.label)}</p>
                        {q.options ? (
                          <Chips options={q.options.map((o) => ({ ...o, value: o.en }))} value={f.answers[q.id] ? [f.answers[q.id]!] : []} onToggle={(v) => set('answers', { ...f.answers, [q.id]: v })} single />
                        ) : (
                          <Textarea className="min-h-20" value={f.answers[q.id] ?? ''} onChange={(e) => set('answers', { ...f.answers, [q.id]: e.target.value })} />
                        )}
                      </div>
                    ))}
                  </Section>

                  <Section n={5} title={tx('Xác nhận', 'Confirmation', '확인')}>
                    <label className="flex cursor-pointer gap-3 text-sm">
                      <input type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" checked={f.news} onChange={(e) => set('news', e.target.checked)} />
                      {tx('Nhận thông tin về sự kiện, cơ hội giao thương từ VCCI và đối tác.', 'Send me event updates and trade opportunities from VCCI and partners.', 'VCCI 및 파트너의 행사 소식과 무역 기회를 받겠습니다.')}
                    </label>
                    <label className="mt-3 flex cursor-pointer gap-3 text-sm">
                      <input type="checkbox" required className="mt-0.5 size-4 accent-[var(--primary)]" checked={f.terms} onChange={(e) => set('terms', e.target.checked)} />
                      <span>{tx('Tôi đồng ý với Điều khoản tham dự, Chính sách bảo mật và cho phép Ban tổ chức chụp ảnh, ghi hình tại sự kiện.', 'I agree to the Terms of Attendance and Privacy Policy and allow photos and recordings at the event.', '참가 약관 및 개인정보 처리방침에 동의하며, 행사 중 사진·영상 촬영을 허용합니다.')} *</span>
                    </label>
                  </Section>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5">
                    <p className="text-sm text-muted-foreground">
                      {t.events.fee}: <b className="text-foreground">{paid ? formatMoney(ev.participationFee, ev.participationFeeCurrency, locale) : t.common.free}</b>
                    </p>
                    <Button type="submit" size="lg">{paid ? tx('Tiếp tục thanh toán', 'Continue to payment', '결제로 계속') : tx('Hoàn tất đăng ký', 'Complete registration', '등록 완료')} <ArrowRight /></Button>
                  </div>
                </form>
              )}

              {paid && step === 1 && <PaymentStep ev={ev} code={regCode} proof={proof} setProof={setProof} onBack={() => setStep(0)} onDone={finish} />}

              {step === steps.length - 1 && step > 0 && (
                <Badge ev={ev} code={regCode} name={matchmaking ? profile.general.contactName : `${f.salutation} ${f.lastName} ${f.firstName}`.trim()} title={matchmaking ? profile.general.contactTitle : f.jobTitle} company={matchmaking ? profile.general.nameVi : f.company} dates={matchmaking ? [] : f.dates} meetings={f.meetSlots.length} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <Sidebar ev={ev} />
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- pieces */
function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-6">
      <h2 className="mb-5 flex items-center gap-3 text-lg font-bold">
        <span className="grid size-7 place-items-center rounded-full bg-primary text-[13px] font-bold text-primary-foreground">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Chips({ options, value, onToggle, single }: { options: (Bilingual & { value: string })[]; value: string[]; onToggle: (v: string) => void; single?: boolean }) {
  const { L } = useI18n()
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.value)
        return (
          <button key={o.value} type="button" onClick={() => onToggle(o.value)} className={cn('inline-flex items-center gap-1.5 border px-3.5 py-2 text-[13px] font-medium transition', single ? 'rounded-lg' : 'rounded-full', on ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/50')}>
            {on && <Check className="size-3.5" />}
            {L(o)}
          </button>
        )
      })}
    </div>
  )
}

function PaymentStep({ ev, code, proof, setProof, onBack, onDone }: { ev: EventItem; code: string; proof: string | null; setProof: (v: string | null) => void; onBack: () => void; onDone: () => void }) {
  const { t, locale } = useI18n()
  const toast = useToast()
  return (
    <div className="rounded-2xl border bg-card p-6">
      <p className="text-lg font-bold">{t.events.payTitle}</p>
      <p className="text-sm text-muted-foreground">{t.events.payDesc}</p>
      <div className="mt-5 grid gap-6 sm:grid-cols-[200px_1fr]">
        <div className="relative grid aspect-square place-items-center rounded-xl border bg-white p-3">
          <FakeQr seed={code} />
          <motion.span className="absolute inset-x-3 h-0.5 bg-primary/70 shadow-[0_0_12px_var(--primary)]" animate={{ top: ['12%', '88%', '12%'] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} />
        </div>
        <dl className="space-y-2.5 text-sm">
          {[
            [t.events.bank, 'Sao Viet Bank – CN Hà Nội'],
            [t.events.account, '1903 6688 2026'],
            [t.events.amount, formatMoney(ev.participationFee, ev.participationFeeCurrency, locale)],
            [t.events.memo, code],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2.5">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="flex items-center gap-1.5 text-right font-semibold">
                {v}
                <button type="button" onClick={() => { void navigator.clipboard?.writeText(v!).catch(() => {}); toast({ kind: 'info', title: t.ui.copied, description: v }) }} className="text-muted-foreground hover:text-primary" aria-label={t.ui.copy}><Copy className="size-3.5" /></button>
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <label className={cn('mt-6 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-4 transition', proof ? 'border-success bg-success-soft' : 'hover:border-primary/50')}>
        {proof ? <Check className="size-5 text-success" /> : <FileUp className="size-5 text-primary" />}
        <span className="text-sm font-medium">{proof ?? t.events.uploadProof}</span>
        <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => setProof(e.target.files?.[0]?.name ?? null)} />
      </label>
      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft /> {t.common.back}</Button>
        <Button disabled={!proof} onClick={onDone}>{t.common.submit} <ArrowRight /></Button>
      </div>
    </div>
  )
}

function Badge({ ev, code, name, title, company, dates, meetings }: { ev: EventItem; code: string; name: string; title: string; company: string; dates: string[]; meetings: number }) {
  const { t, L, locale } = useI18n()
  const ics = () => {
    const d = (s: string) => s.replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `UID:${code}@vcci`, `DTSTART:${d(ev.startDate)}`, `DTEND:${d(ev.endDate)}`, `SUMMARY:${L(ev.title)}`, `LOCATION:${L(ev.location)}`, `DESCRIPTION:${code}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
    const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${code}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="relative">
      <Confetti />
      <div className="text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="mx-auto grid size-14 place-items-center rounded-full bg-success text-white"><Check className="size-7" /></motion.div>
        <h2 className="mt-4 text-2xl font-extrabold">{t.events.doneTitle}</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{tx('Thẻ tham dự điện tử đã được gửi về email. Xuất trình mã QR tại quầy check-in hoặc khi vào phòng trực tuyến.', 'Your e-badge has been emailed. Show the QR code at check-in or when joining online.', '전자 배지가 이메일로 발송되었습니다. 체크인 시 또는 온라인 입장 시 QR 코드를 제시하세요.')}</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 24, rotateX: 25 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="mx-auto mt-8 max-w-md overflow-hidden rounded-3xl border bg-card shadow-2xl shadow-navy/15 print:shadow-none">
        <div className="relative bg-navy px-6 py-5 text-white">
          <div className="absolute -right-10 -top-10 size-36 rounded-full bg-primary/50 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <img src="/imgs/lg1.png" alt="VCCI" className="h-6 w-auto rounded bg-white px-1.5 py-0.5" />
            <span className="rounded-full bg-gold-bright px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-navy">{ev.eventType === 'MATCHMAKING' ? tx('Doanh nghiệp', 'Company', '기업') : tx('Khách tham quan', 'Visitor', '참관객')}</span>
          </div>
          <p className="relative mt-4 line-clamp-2 text-[15px] font-bold leading-snug">{L(ev.title)}</p>
        </div>
        <div className="grid grid-cols-[1fr_120px] gap-5 p-6">
          <div className="min-w-0">
            <p className="truncate text-xl font-extrabold">{name || '—'}</p>
            <p className="truncate text-sm text-muted-foreground">{title}</p>
            <p className="mt-3 truncate font-semibold">{company}</p>
            {dates.length > 0 && <p className="mt-3 text-xs text-muted-foreground">{dates.map((d) => formatDate(`${d}T12:00:00`, locale, { day: '2-digit', month: '2-digit', year: 'numeric' })).join(' · ')}</p>}
            {meetings > 0 && <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary"><Handshake className="size-3.5" /> {meetings} {tx('lịch gặp chờ xác nhận', 'meetings pending', '미팅 확정 대기')}</p>}
          </div>
          <div className="grid aspect-square place-items-center rounded-xl border bg-white p-2"><FakeQr seed={code} /></div>
        </div>
        <div className="border-t border-dashed px-6 py-3 text-center font-mono text-sm font-semibold tracking-wider">{code}</div>
      </motion.div>

      <div className="mt-6 flex flex-wrap justify-center gap-2 print:hidden">
        <Button variant="outline" onClick={() => window.print()}><Printer /> {tx('In thẻ', 'Print badge', '배지 인쇄')}</Button>
        <Button variant="outline" onClick={ics}><CalendarPlus /> {tx('Thêm vào lịch', 'Add to calendar', '캘린더에 추가')}</Button>
        <Link to={`/events/${ev.id}`} className={buttonClass('default')}>{tx('Về trang sự kiện', 'Back to event', '행사 페이지로')}</Link>
      </div>
    </div>
  )
}

function Sidebar({ ev }: { ev: EventItem }) {
  const { t, L, locale } = useI18n()
  const benefits = [
    { icon: Ticket, text: tx('Thẻ tham dự điện tử, check-in nhanh bằng QR', 'E-badge with fast QR check-in', 'QR 빠른 체크인 전자 배지') },
    { icon: Handshake, text: tx('Đặt lịch gặp nhà cung cấp ngay trên hệ thống', 'Book supplier meetings online', '온라인으로 공급업체 미팅 예약') },
    { icon: Sparkles, text: tx('Xem trước sản phẩm ra mắt và danh sách gian hàng', 'Preview launches and exhibitor list', '신제품 및 참가사 목록 미리 보기') },
    { icon: Gift, text: tx('Tài liệu, bản ghi và báo cáo ngành sau sự kiện', 'Post-event materials and recordings', '행사 후 자료 및 녹화본 제공') },
  ]
  return (
    <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
      <div className="overflow-hidden rounded-2xl border bg-card">
        <img src={img(ev.coverImage, 700, 320)} alt="" className="h-36 w-full object-cover" />
        <div className="space-y-2 p-5 text-sm">
          <p className="font-bold leading-snug">{L(ev.title)}</p>
          <p className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="size-4" /> {formatDate(ev.startDate, locale)} · {ev.startTime}</p>
          <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="size-4" /> {L(ev.location)}</p>
          <p className="flex items-center gap-2 text-muted-foreground"><Users className="size-4" /> {ev.registeredSlots}/{ev.maxSlots} {t.events.registered}</p>
        </div>
      </div>
      <div className="rounded-2xl border bg-gradient-to-br from-primary-soft/70 to-card p-5">
        <p className="font-bold">{tx('Quyền lợi khi đăng ký', 'Why register', '등록 혜택')}</p>
        <ul className="mt-3 space-y-3">
          {benefits.map((x) => (
            <li key={x.text} className="flex gap-3 text-[13px]"><x.icon className="mt-0.5 size-4 shrink-0 text-primary" /> {x.text}</li>
          ))}
        </ul>
      </div>
      {ev.contact && (
        <p className="rounded-2xl bg-muted/60 p-4 text-xs text-muted-foreground">
          {tx('Cần hỗ trợ?', 'Need help?', '도움이 필요하신가요?')} {ev.contact.name} · {ev.contact.phone} · {ev.contact.email}
        </p>
      )}
    </aside>
  )
}
