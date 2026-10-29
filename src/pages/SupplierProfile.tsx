/**
 * Supplier storefront. Overview = registration facts; Capability = production, photos (lightbox),
 * certificates with previews, markets, QC, products & customers, video, viewable + downloadable documents.
 */
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react'
import { Award, BadgeCheck, Building2, ChevronLeft, ChevronRight, Download, Eye, FileText, Globe, Mail, MapPin, MessageSquare, Phone, Plus, Send, ShieldCheck, Users, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getBusiness, productsOf } from '@/api'
import { buildPublicProfile, type PublicProfile } from '@/data/capability'
import { categories, type Business } from '@/data/mock'
import { CompanyMark, Stars, VerifiedBadge } from '@/components/brand'
import { ProductCard } from '@/components/cards'
import { GALLERY_KINDS } from '@/components/upload/Upload'
import { Dialog, DialogContent, DialogTrigger, useToast } from '@/components/ui/overlay'
import { Button, Field, Input, Textarea } from '@/components/ui/primitives'
import NotFound from '@/pages/NotFound'
import { SuccessState } from '@/pages/ProductDetail'
import { useI18n, type Bilingual } from '@/lib/i18n'
import { OPTIONS, useProfile, type MediaItem, type VerifyStatus } from '@/lib/profile'
import { tx } from '@/lib/tx'
import { formatSize } from '@/lib/upload'
import { cn, formatDate, img } from '@/lib/utils'

type Tab = 'overview' | 'products' | 'capability' | 'contact'
type Slide = { url: string; caption: string }

const LEGAL_FORMS: Record<string, Bilingual> = {
  PRIVATE: { vi: 'Doanh nghiệp tư nhân', en: 'Sole proprietorship', ko: '개인 기업' },
  LLC: { vi: 'Công ty TNHH', en: 'Limited liability company', ko: '유한책임회사' },
  JOINT_STOCK: { vi: 'Công ty cổ phần', en: 'Joint stock company', ko: '주식회사' },
  COOPERATIVE: { vi: 'Hợp tác xã', en: 'Cooperative', ko: '협동조합' },
  STATE_OWNED: { vi: 'Doanh nghiệp nhà nước', en: 'State-owned enterprise', ko: '국영 기업' },
  OTHER: { vi: 'Khác', en: 'Other', ko: '기타' },
}
const STATUS: Record<VerifyStatus, { cls: string; label: Bilingual }> = {
  SELF: { cls: 'bg-muted text-muted-foreground', label: { vi: 'Tự khai', en: 'Self-declared', ko: '자체 신고' } },
  SUBMITTED: { cls: 'bg-primary-soft text-primary', label: { vi: 'Đã nộp chứng từ', en: 'Evidence submitted', ko: '증빙 제출됨' } },
  VERIFIED: { cls: 'bg-success-soft text-success', label: { vi: 'VCCI đã xác minh', en: 'Verified by VCCI', ko: 'VCCI 검증 완료' } },
}

export default function SupplierProfile() {
  const { id = '' } = useParams()
  const b = getBusiness(id)
  if (!b) return <NotFound />
  return <Storefront b={b} />
}

function Storefront({ b }: { b: Business }) {
  const { t, L } = useI18n()
  const toast = useToast()
  const { session, profile } = useProfile()
  const isOwn = !!session && profile.general.taxCode.replace(/\s/g, '') === b.taxCode.replace(/\s/g, '')
  const pp = useMemo(() => buildPublicProfile(b, isOwn ? profile : null), [b, isOwn, profile])
  const [tab, setTab] = useState<Tab>('overview')
  const [following, setFollowing] = useState(false)
  const [lightbox, setLightbox] = useState<{ slides: Slide[]; index: number } | null>(null)
  const coverRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: coverRef, offset: ['start start', 'end start'] })
  const coverY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const items = productsOf(b.id)
  const gallerySlides: Slide[] = pp.gallery.map((m) => ({ url: m.url, caption: caption(m, L) }))

  return (
    <div>
      <div ref={coverRef} className="relative isolate overflow-hidden bg-navy text-white">
        <motion.img style={{ y: coverY }} src={pp.cover ?? img(b.coverImage, 1800, 700)} alt="" className="absolute inset-0 -z-20 size-full scale-110 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/80 to-navy/30" />
        <div className="container-page flex min-h-72 flex-col justify-end gap-6 py-10 md:flex-row md:items-end md:justify-between">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-5">
            {pp.logo ? (
              <img src={pp.logo} alt={b.name} className="size-20 rounded-2xl bg-white object-contain p-2 ring-4 ring-white/15 md:size-24" />
            ) : (
              <CompanyMark name={b.nameEn} accent={b.accent} className="size-20 rounded-2xl text-2xl ring-4 ring-white/15 md:size-24" />
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {b.verified && <VerifiedBadge className="bg-white/90" />}
                <span className="text-xs text-white/70">{t.supplier.types[b.businessType]}</span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight md:text-4xl">{b.name}</h1>
              <p className="text-sm text-white/65">{pp.nameEn}</p>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/75">
                <Stars score={b.reputationScore} className="text-white" />
                <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" /> {b.province}</span>
                <span className="inline-flex items-center gap-1.5"><Users className="size-4" /> {pp.facts.employees}</span>
              </p>
            </div>
          </motion.div>
          <div className="flex flex-wrap gap-2">
            {pp.own && <Link to="/account/profile" className="inline-flex h-10 items-center gap-2 rounded-lg bg-white/15 px-4 text-sm font-semibold hover:bg-white/25">{tx('Sửa hồ sơ', 'Edit profile', '프로필 수정')}</Link>}
            <Button variant="ghost" className="border border-white/25 text-white hover:bg-white/10" onClick={() => { setFollowing((v) => !v); if (!following) toast({ kind: 'success', title: t.supplier.follow, description: b.name }) }}>
              {following ? <BadgeCheck /> : <Plus />} {t.supplier.follow}
            </Button>
            <ContactDialog name={b.name} email={pp.facts.contact.email} />
          </div>
        </div>
      </div>

      <div className="sticky top-[112px] z-30 border-b bg-background/95 backdrop-blur max-lg:top-[68px]">
        <div className="container-page flex items-center gap-6">
          <span className="hidden shrink-0 items-center gap-2 py-3 lg:flex">
            <CompanyMark name={b.nameEn} accent={b.accent} className="size-7 rounded-md text-[10px]" />
            <span className="max-w-56 truncate text-sm font-bold">{b.name}</span>
          </span>
          <div className="no-scrollbar flex gap-1 overflow-x-auto">
            {(['overview', 'capability', 'products', 'contact'] as Tab[]).map((k) => (
              <button key={k} onClick={() => setTab(k)} className={cn('relative shrink-0 px-3 py-4 text-sm font-semibold transition-colors', tab === k ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>
                {t.supplier.tabs[k]}
                {tab === k && <motion.span layoutId="store-tab" className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-page">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="py-10">
            {tab === 'overview' && (
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold">{t.supplier.about}</h2>
                  <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-foreground/85">{L(b.description)}</p>
                  <Facts b={b} pp={pp} />
                  {pp.gallery.length > 0 && (
                    <>
                      <div className="mt-10 flex items-end justify-between">
                        <h3 className="text-xl font-bold">{tx('Hình ảnh doanh nghiệp', 'Company photos', '기업 사진')}</h3>
                        <button onClick={() => setTab('capability')} className="text-sm font-semibold text-primary">{tx('Xem hồ sơ năng lực', 'View capability profile', '역량 프로필 보기')} →</button>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        {pp.gallery.slice(0, 3).map((m, i) => (
                          <button key={m.id} onClick={() => setLightbox({ slides: gallerySlides, index: i })} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                            <img src={m.url} alt={caption(m, L)} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  <div className="mt-10 flex items-end justify-between">
                    <h3 className="text-xl font-bold">{t.nav.products}</h3>
                    {items.length > 3 && <button onClick={() => setTab('products')} className="text-sm font-semibold text-primary">{t.common.viewAll}</button>}
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3">
                    {items.slice(0, 3).map((p) => <ProductCard key={p.id} product={p} />)}
                  </div>
                </div>
                <InfoCard b={b} pp={pp} />
              </div>
            )}
            {tab === 'capability' && <Capability pp={pp} open={(slides, index) => setLightbox({ slides, index })} />}
            {tab === 'products' && (
              <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
                {items.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
            {tab === 'contact' && <div className="max-w-xl"><InfoCard b={b} pp={pp} /></div>}
          </motion.div>
        </AnimatePresence>
        <Link to="/suppliers" className="text-sm font-semibold text-primary">← {t.supplier.directoryTitle}</Link>
      </div>

      <Lightbox state={lightbox} onClose={() => setLightbox(null)} onIndex={(index) => setLightbox((s) => (s ? { ...s, index } : s))} />
    </div>
  )
}

const caption = (m: MediaItem, L: (t: Bilingual | string) => string) => {
  const i18n = (m as MediaItem & { captionI18n?: Bilingual }).captionI18n
  return i18n ? L(i18n) : m.caption
}
const label = (set: readonly ({ value: string } & Bilingual)[], v: string, L: (t: Bilingual) => string) => {
  const o = set.find((x) => x.value === v)
  return o ? L(o) : ''
}

/* ---------------------------------------------------------------- overview facts (from registration) */
function Facts({ b, pp }: { b: Business; pp: PublicProfile }) {
  const { t, L, locale } = useI18n()
  const region = new Intl.DisplayNames([locale], { type: 'region' })
  const f = pp.facts
  const cat = categories.find((c) => c.id === b.categoryId)
  const rows: { k: string; v: ReactNode }[] = [
    { k: tx('Tên tiếng Anh', 'English name', '영문 기업명'), v: pp.nameEn },
    { k: t.supplier.taxCode, v: b.taxCode },
    { k: tx('Loại hình doanh nghiệp', 'Legal form', '기업 형태'), v: LEGAL_FORMS[f.legalForm] ? L(LEGAL_FORMS[f.legalForm]!) : '—' },
    { k: tx('Loại hình hoạt động', 'Business type', '사업 유형'), v: t.supplier.types[f.businessType as keyof typeof t.supplier.types] ?? '—' },
    { k: tx('Ngành nghề', 'Industry', '업종'), v: cat ? L(cat.categoryName) : b.industry.join(', ') },
    { k: tx('Năm thành lập', 'Founded', '설립 연도'), v: f.founded },
    { k: tx('Vốn điều lệ', 'Charter capital', '자본금'), v: f.charterCapital },
    { k: tx('Quy mô nhân sự', 'Employees', '직원 수'), v: f.employees },
    {
      k: tx('Doanh thu', 'Revenue', '매출'),
      v: f.revenueBand ? (
        <span className="inline-flex flex-wrap items-center gap-2">
          {label(OPTIONS.revenueBand, f.revenueBand, L)} {f.revenueYear && <span className="text-muted-foreground">({f.revenueYear})</span>}
          {f.revenueStatus && <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', STATUS[f.revenueStatus].cls)}>{L(STATUS[f.revenueStatus].label)}</span>}
        </span>
      ) : tx('Không công khai', 'Not disclosed', '비공개'),
    },
    { k: tx('Thị trường xuất khẩu', 'Export markets', '수출 시장'), v: pp.exports.markets.map((m) => label(OPTIONS.markets, m, L) || safeRegion(region, m)).join(', ') || '—' },
  ]
  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold">{tx('Thông tin doanh nghiệp', 'Company information', '기업 정보')}</h3>
      <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.k} className="flex justify-between gap-4 border-b py-3 text-sm">
            <dt className="shrink-0 text-muted-foreground">{r.k}</dt>
            <dd className="text-right font-medium">{r.v}</dd>
          </div>
        ))}
      </dl>
      {f.legalVerified.length > 0 && (
        <p className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-sm text-success">
          <ShieldCheck className="size-4" />
          {tx('VCCI đã đối chiếu:', 'Checked by VCCI:', 'VCCI 대조 확인:')}
          {f.legalVerified.map((d) => <span key={d} className="rounded-full bg-background/70 px-2 py-0.5 text-xs font-semibold">{d === 'TAX' ? tx('Đăng ký thuế', 'Tax registration', '세무 등록') : tx('Giấy chứng nhận ĐKDN', 'Business registration', '사업자등록증')}</span>)}
        </p>
      )}
    </div>
  )
}

const safeRegion = (r: Intl.DisplayNames, code: string) => {
  try { return r.of(code) ?? code } catch { return code }
}

/* ---------------------------------------------------------------- capability profile */
function Capability({ pp, open }: { pp: PublicProfile; open: (slides: Slide[], index: number) => void }) {
  const { L, locale } = useI18n()
  const region = new Intl.DisplayNames([locale], { type: 'region' })
  const [kind, setKind] = useState('ALL')
  const photos = pp.gallery.filter((m) => kind === 'ALL' || m.kind === kind)
  const kinds = GALLERY_KINDS.filter((k) => pp.gallery.some((m) => m.kind === k.value))
  const c = pp.capability
  const today = new Date().toISOString().slice(0, 10)
  const certs = pp.certificates.filter((x) => !x.expiry || x.expiry >= today)
  const certSlides: Slide[] = certs.filter((x) => x.preview).map((x) => ({ url: x.preview!, caption: `${x.name}${x.issuer ? ` · ${x.issuer}` : ''}` }))
  const docSlides: Slide[] = pp.documents.filter((d) => d.preview).map((d) => ({ url: d.preview!, caption: d.name }))
  const yt = pp.video.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1]

  const toc = [
    ['cap-production', tx('Năng lực sản xuất', 'Production capacity', '생산 역량')],
    ['cap-photos', tx('Hình ảnh nhà máy', 'Factory photos', '공장 사진')],
    ['cap-certs', tx('Chứng nhận', 'Certificates', '인증')],
    ['cap-markets', tx('Thị trường & xuất khẩu', 'Markets & export', '시장 & 수출')],
    ['cap-qc', tx('Kiểm soát chất lượng', 'Quality control', '품질 관리')],
    ['cap-customers', tx('Sản phẩm & khách hàng', 'Products & customers', '제품 & 고객')],
    ...(yt ? [['cap-video', tx('Video giới thiệu', 'Intro video', '소개 영상')]] : []),
    ['cap-docs', tx('Tài liệu', 'Documents', '자료')],
  ] as [string, string][]

  const facts = [
    [tx('Diện tích nhà xưởng', 'Factory area', '공장 면적'), c.factoryArea && `${c.factoryArea} m²`],
    [tx('Dây chuyền sản xuất', 'Production lines', '생산 라인'), c.productionLines],
    [tx('Công suất / tháng', 'Monthly capacity', '월 생산 능력'), c.monthlyCapacity],
    [tx('Dành cho xuất khẩu', 'For export', '수출 비중'), c.exportPct && `${c.exportPct}%`],
    [tx('Đơn hàng tối thiểu', 'Minimum order', '최소 주문'), c.moq],
    ['OEM / ODM', label(OPTIONS.oem, c.oem, L)],
    [tx('Năng lực cung ứng', 'Supply capacity', '공급 능력'), label(OPTIONS.supplyCapacity, c.supply, L)],
  ].filter(([, v]) => v) as [string, string][]

  return (
    <div className="grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)]">
      <nav className="hidden lg:block">
        <ul className="sticky top-48 space-y-1 border-l text-sm">
          {toc.map(([id, t]) => (
            <li key={id}><a href={`#${id}`} className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-muted-foreground transition hover:border-primary hover:text-foreground">{t}</a></li>
          ))}
        </ul>
      </nav>
      <div className="min-w-0 space-y-14">
        <Block id="cap-production" title={toc[0]![1]}>
          <dl className="grid overflow-hidden rounded-2xl border sm:grid-cols-2 lg:grid-cols-4">
            {facts.map(([k, v]) => (
              <div key={k} className="-mb-px -mr-px border-b border-r bg-card p-4">
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="mt-1 text-lg font-bold">{v}</dd>
              </div>
            ))}
          </dl>
          {c.highlights.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {c.highlights.map((h) => <li key={h.en} className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-[13px] font-medium text-primary"><BadgeCheck className="size-3.5" /> {L(h)}</li>)}
            </ul>
          )}
        </Block>

        <Block id="cap-photos" title={toc[1]![1]} sub={tx('Bấm vào ảnh để xem cỡ lớn', 'Click a photo to enlarge', '사진을 클릭하면 크게 볼 수 있습니다')}>
          {kinds.length > 1 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {[{ value: 'ALL', vi: 'Tất cả', en: 'All', ko: '전체' }, ...kinds].map((k) => (
                <button key={k.value} onClick={() => setKind(k.value)} className={cn('rounded-full border px-3 py-1.5 text-[13px] font-medium transition', kind === k.value ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/50')}>{L(k)}</button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {photos.map((m, i) => (
              <motion.button key={m.id} layout onClick={() => open(photos.map((x) => ({ url: x.url, caption: caption(x, L) })), i)} className={cn('group relative overflow-hidden rounded-xl bg-muted text-left', i === 0 && kind === 'ALL' && 'col-span-2 row-span-2')}>
                <img src={m.url} alt={caption(m, L)} loading="lazy" className="aspect-[4/3] size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8 text-[13px] font-medium text-white">{caption(m, L)}</span>
              </motion.button>
            ))}
          </div>
        </Block>

        <Block id="cap-certs" title={toc[2]![1]}>
          {certs.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {certs.map((x) => (
                <button
                  key={x.name}
                  onClick={() => x.preview && open(certSlides, certSlides.findIndex((s) => s.url === x.preview))}
                  className={cn('group overflow-hidden rounded-2xl border bg-card text-left transition', x.preview && 'hover:shadow-lg')}
                >
                  {x.preview ? (
                    <img src={x.preview} alt={x.name} className="aspect-[4/3] w-full object-cover" />
                  ) : (
                    <CertificateArt name={x.name} issuer={x.issuer} />
                  )}
                  <div className="p-4">
                    <p className="font-semibold">{x.name}</p>
                    <p className="text-xs text-muted-foreground">{x.issuer || '—'}{x.expiry && ` · ${tx('Hiệu lực đến', 'Valid until', '유효기간')} ${formatDate(x.expiry, locale)}`}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : <Empty />}
        </Block>

        <Block id="cap-markets" title={toc[3]![1]}>
          <dl className="grid gap-x-8 sm:grid-cols-2">
            {[
              [tx('Tỷ trọng doanh thu xuất khẩu', 'Export share of revenue', '수출 매출 비중'), label(OPTIONS.exportShare, pp.exports.share, L) || '—'],
              [tx('Hình thức xuất khẩu', 'Export modes', '수출 방식'), pp.exports.modes.map((m) => label(OPTIONS.exportModes, m, L)).filter(Boolean).join(', ') || '—'],
              [tx('Truy xuất nguồn gốc', 'Traceability', '이력 추적'), label(OPTIONS.traceability, pp.exports.traceability, L) || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b py-3 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
            ))}
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {pp.exports.markets.map((m) => <span key={m} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-[13px] font-medium"><Globe className="size-3.5 text-primary" /> {label(OPTIONS.markets, m, L) || safeRegion(region, m)}</span>)}
          </div>
        </Block>

        <Block id="cap-qc" title={toc[4]![1]}>
          {c.qcProcess ? <p className="max-w-3xl leading-relaxed text-foreground/85">{c.qcProcess}</p> : <Empty />}
        </Block>

        <Block id="cap-customers" title={toc[5]![1]}>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold">{tx('Sản phẩm chủ lực', 'Key products', '주력 제품')}</p>
              <ul className="space-y-1.5 text-sm">{c.mainProducts.map((m) => <li key={m} className="flex gap-2"><Award className="mt-0.5 size-4 shrink-0 text-gold" /> {m}</li>)}</ul>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">{tx('Khách hàng tiêu biểu', 'Key customers', '주요 고객')}</p>
              <p className="text-sm text-muted-foreground">{c.keyCustomers || tx('Doanh nghiệp chưa công khai', 'Not disclosed by the company', '기업이 공개하지 않음')}</p>
            </div>
          </div>
        </Block>

        {yt && (
          <Block id="cap-video" title={tx('Video giới thiệu', 'Intro video', '소개 영상')}>
            <div className="aspect-video overflow-hidden rounded-2xl bg-black">
              <iframe className="size-full" src={`https://www.youtube-nocookie.com/embed/${yt}`} title="video" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen />
            </div>
          </Block>
        )}

        <Block id="cap-docs" title={toc[toc.length - 1]![1]} sub={tx('Xem trước trực tiếp hoặc tải về', 'Preview online or download', '온라인 미리보기 또는 다운로드')}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pp.documents.map((d) => <DocCard key={d.id} name={d.name} size={d.size} preview={d.preview} onView={() => d.preview && open(docSlides, docSlides.findIndex((s) => s.url === d.preview))} />)}
          </div>
        </Block>
      </div>
    </div>
  )
}

function Block({ id, title, sub, children }: { id: string; title: string; sub?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-48">
      <h2 className="text-xl font-bold">{title}</h2>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

const Empty = () => <p className="text-sm text-muted-foreground">{tx('Doanh nghiệp chưa cập nhật', 'Not provided yet', '아직 제공되지 않음')}</p>

/** Rendered certificate visual for certificates uploaded as PDF (no image preview). */
function CertificateArt({ name, issuer }: { name: string; issuer: string }) {
  return (
    <div className="relative grid aspect-[4/3] place-items-center bg-gradient-to-br from-gold-soft via-card to-primary-soft p-4">
      <div className="absolute inset-3 rounded-lg border-2 border-double border-gold/50" />
      <div className="relative text-center">
        <Award className="mx-auto size-9 text-gold" />
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Certificate</p>
        <p className="mt-1 text-lg font-extrabold">{name}</p>
        {issuer && <p className="text-xs text-muted-foreground">{issuer}</p>}
        <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground"><FileText className="size-3" /> PDF</p>
      </div>
    </div>
  )
}

function DocCard({ name, size, preview, onView }: { name: string; size: number; preview?: string; onView: () => void }) {
  const toast = useToast()
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <button onClick={onView} disabled={!preview} className="group relative block aspect-[4/3] w-full overflow-hidden bg-muted">
        {preview ? (
          <>
            <img src={preview} alt={name} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <span className="absolute right-0 top-0 size-8 bg-gradient-to-bl from-background to-background/0" />
            <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100"><Eye className="size-7" /></span>
          </>
        ) : (
          <span className="grid size-full place-items-center"><FileText className="size-10 text-red-600" /></span>
        )}
        <span className="absolute left-3 top-3 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">PDF</span>
      </button>
      <div className="flex items-center gap-2 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name}</p>
          {size > 0 && <p className="text-xs text-muted-foreground">{formatSize(size)}</p>}
        </div>
        {preview && <button onClick={onView} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={tx('Xem', 'View', '보기')}><Eye className="size-4" /></button>}
        <button onClick={() => toast({ kind: 'info', title: tx('Đang tải về', 'Downloading', '다운로드 중'), description: name })} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={tx('Tải về', 'Download', '다운로드')}><Download className="size-4" /></button>
      </div>
    </div>
  )
}

function Lightbox({ state, onClose, onIndex }: { state: { slides: Slide[]; index: number } | null; onClose: () => void; onIndex: (i: number) => void }) {
  const n = state?.slides.length ?? 0
  useEffect(() => {
    if (!state) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') onIndex((state.index + 1) % n)
      if (e.key === 'ArrowLeft') onIndex((state.index - 1 + n) % n)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state, n, onIndex])
  const s = state?.slides[state.index]
  return (
    <DialogPrimitive.Root open={!!state && !!s} onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed inset-0 z-[91] flex flex-col items-center justify-center p-4 outline-none" onClick={onClose}>
          <DialogPrimitive.Title className="sr-only">{s?.caption}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{s?.caption}</DialogPrimitive.Description>
          <AnimatePresence mode="wait">
            {s && <motion.img key={s.url} src={s.url} alt={s.caption} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-h-[80vh] max-w-[92vw] rounded-xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />}
          </AnimatePresence>
          <p className="mt-4 text-sm text-white/85">{s?.caption} <span className="text-white/50">· {(state?.index ?? 0) + 1}/{n}</span></p>
          <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20" aria-label={tx('Đóng', 'Close', '닫기')}><X className="size-5" /></button>
          {n > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onIndex((state!.index - 1 + n) % n) }} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label={tx('Ảnh trước', 'Previous', '이전')}><ChevronLeft className="size-5" /></button>
              <button onClick={(e) => { e.stopPropagation(); onIndex((state!.index + 1) % n) }} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label={tx('Ảnh sau', 'Next', '다음')}><ChevronRight className="size-5" /></button>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function InfoCard({ b, pp }: { b: Business; pp: PublicProfile }) {
  const { t } = useI18n()
  const f = pp.facts
  return (
    <dl className="h-fit space-y-4 rounded-2xl bg-muted/50 p-6 text-sm">
      {[
        { icon: Building2, k: t.supplier.taxCode, v: b.taxCode },
        { icon: MapPin, k: t.supplier.address, v: `${b.address}, ${b.province}` },
        { icon: Globe, k: t.supplier.website, v: f.website },
        { icon: Mail, k: t.supplier.email, v: f.contact.email },
        { icon: Phone, k: t.supplier.phone, v: f.contact.phone },
        ...(f.fax ? [{ icon: Phone, k: 'Fax', v: f.fax }] : []),
        ...(f.representative.name && f.representative.name !== '—' ? [{ icon: Users, k: tx('Người đại diện pháp luật', 'Legal representative', '법정 대표자'), v: `${f.representative.name}${f.representative.title ? ` · ${f.representative.title}` : ''}` }] : []),
        ...(f.contact.name ? [{ icon: MessageSquare, k: tx('Người liên hệ giao thương', 'Trade contact', '무역 담당자'), v: `${f.contact.name}${f.contact.title ? ` · ${f.contact.title}` : ''}` }] : []),
      ].map((r) => (
        <div key={r.k} className="flex gap-3">
          <r.icon className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">{r.k}</dt>
            <dd className="break-words font-medium">{r.v}</dd>
          </div>
        </div>
      ))}
    </dl>
  )
}

/** POST /api/business/{businessId}/rfq/email */
function ContactDialog({ name, email }: { name: string; email: string }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSent(false) }}>
      <DialogTrigger asChild>
        <Button variant="gold"><MessageSquare /> {t.supplier.contactSupplier}</Button>
      </DialogTrigger>
      <DialogContent title={t.supplier.contactSupplier} description={name}>
        {sent ? (
          <SuccessState title={t.product.sent} desc={t.product.sentDesc} onClose={() => setOpen(false)} />
        ) : (
          <form className="space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
            <Field label={t.requests.to} htmlFor="c-to"><Input id="c-to" value={email} readOnly className="bg-muted" /></Field>
            <Field label={t.requests.subject} htmlFor="c-sub"><Input id="c-sub" required placeholder="RFQ – …" /></Field>
            <Field label={t.product.message} htmlFor="c-msg"><Textarea id="c-msg" required placeholder={t.product.messagePh} /></Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>{t.common.cancel}</Button>
              <Button type="submit"><Send /> {t.common.submit}</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
