/**
 * Company profile ("Hồ sơ doanh nghiệp") — filled once after sign-up, reused by every event registration.
 * Prototype: persisted in localStorage. Real backend: extend Organization + new tables
 * (org_capability, org_export, org_revenue_evidence, org_needs, org_attendee).
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Bilingual } from '@/lib/i18n'
import { KO } from '@/lib/ko-profile'
import { withKo } from '@/lib/tx'

export type Opt = { value: string } & Bilingual
const o = (value: string, vi: string, en: string): Opt => ({ value, vi, en, ko: KO[en] })

/* ---------------------------------------------------------------- option sets (from VCCI/GIZ survey) */
export const OPTIONS = {
  ownership: [o('DOMESTIC', '100% vốn trong nước', '100% domestic capital'), o('FDI_PARTIAL', 'Có vốn nước ngoài', 'Partly foreign-owned'), o('FOREIGN_100', '100% vốn nước ngoài', '100% foreign-owned')],
  sectors: [
    o('FOOD', 'Thực phẩm chất lượng cao', 'Premium food'), o('PACKAGING', 'Bao bì & vật liệu tái chế', 'Packaging & recycled materials'),
    o('COSMETICS', 'Hoá mỹ phẩm thiên nhiên', 'Natural cosmetics'), o('CRAFT', 'Thủ công mỹ nghệ & gốm sứ', 'Handicrafts & ceramics'),
    o('MECH', 'Cơ khí chính xác & tự động hoá', 'Precision engineering & automation'), o('ELEC', 'Điện – Điện tử', 'Electrical & electronics'),
    o('TEXTILE', 'Dệt may & da giày', 'Textiles & footwear'), o('FURNITURE', 'Đồ gỗ & nội thất', 'Furniture & wood'),
  ],
  supplyCapacity: [
    o('SMALL', 'Chỉ đáp ứng đơn hàng nhỏ', 'Small orders only'), o('MEDIUM', 'Đáp ứng đơn hàng vừa', 'Medium orders'),
    o('LARGE', 'Đáp ứng đơn hàng lớn', 'Large orders'), o('SCALABLE', 'Có thể tăng công suất đáng kể', 'Can scale up significantly'),
    o('CUSTOM', 'Phát triển năng lực theo yêu cầu khách hàng', 'Can build capacity to order'),
  ],
  oem: [
    o('YES', 'Có, hoàn toàn có thể', 'Yes, fully'), o('ADJUST', 'Có, cần điều chỉnh một số yếu tố', 'Yes, with adjustments'),
    o('INVEST', 'Có khả năng nhưng cần đầu tư thêm', 'Possible with investment'), o('NO_EXP', 'Chưa có kinh nghiệm', 'No experience yet'),
    o('NOT_FIT', 'Không phù hợp mô hình kinh doanh', 'Not our model'),
  ],
  exportShare: [o('NONE', 'Chưa có', 'None'), o('LT10', 'Dưới 10%', 'Under 10%'), o('10_30', '10 – 30%', '10 – 30%'), o('31_50', '31 – 50%', '31 – 50%'), o('GT50', 'Trên 50%', 'Over 50%')],
  markets: [
    o('DE', 'Đức', 'Germany'), o('EU', 'Các nước EU khác', 'Other EU'), o('US', 'Mỹ', 'USA'), o('JP', 'Nhật Bản', 'Japan'), o('KR', 'Hàn Quốc', 'Korea'),
    o('UK', 'Anh', 'UK'), o('ASEAN', 'ASEAN', 'ASEAN'), o('CN', 'Trung Quốc', 'China'), o('ANZ', 'Úc / New Zealand', 'Australia / NZ'), o('ME', 'Trung Đông', 'Middle East'),
  ],
  exportModes: [
    o('PROCESSING', 'Gia công', 'Processing'), o('OEM', 'OEM/ODM', 'OEM/ODM'), o('ECOM', 'TMĐT xuyên biên giới', 'Cross-border e-commerce'),
    o('DIRECT', 'Xuất khẩu trực tiếp', 'Direct export'), o('TRADER', 'Qua thương nhân trung gian', 'Via traders'), o('FDI', 'Qua doanh nghiệp FDI tại VN', 'Via FDI firms in VN'),
  ],
  traceability: [
    o('FULL', 'Truy xuất toàn chuỗi (số hoá đến nguồn nguyên liệu)', 'Full-chain digital traceability'),
    o('LOT', 'Truy xuất theo lô nội bộ (sổ sách, tem nhãn)', 'Internal lot-level records'),
    o('SUPPLIER', 'Phụ thuộc chứng từ nhà cung cấp', 'Relies on supplier invoices'),
    o('NONE', 'Chưa có hệ thống truy xuất', 'No traceability yet'),
  ],
  euExperience: [o('NEVER', 'Chưa bao giờ', 'Never'), o('TALKED', 'Đã trao đổi, chưa giao dịch', 'Talked, no deals'), o('TRADED', 'Đã có giao dịch', 'Have traded')],
  revenueBand: [o('LT50', 'Dưới 50 tỷ đồng', 'Under VND 50bn'), o('50_100', '50 – 100 tỷ', 'VND 50 – 100bn'), o('100_200', '100 – 200 tỷ', 'VND 100 – 200bn'), o('200_300', '200 – 300 tỷ', 'VND 200 – 300bn'), o('GT300', 'Trên 300 tỷ', 'Over VND 300bn')],
  revenueProof: [
    o('AUDITED', 'Báo cáo tài chính đã kiểm toán', 'Audited financial statements'),
    o('TAX_FS', 'BCTC đã nộp cơ quan thuế (có xác nhận eTax)', 'Financial statements filed with tax authority'),
    o('CIT', 'Tờ khai quyết toán thuế TNDN (mẫu 03/TNDN)', 'Corporate income tax finalisation (03/TNDN)'),
    o('CUSTOMS', 'Tờ khai hải quan xuất khẩu / C/O do VCCI cấp', 'Export customs declarations / VCCI-issued C/O'),
  ],
  partnerTypes: [
    o('SOURCING', 'Công ty sourcing / mua hàng', 'Sourcing / buying office'), o('TECH', 'Công ty công nghệ', 'Technology company'), o('JV', 'Đối tác liên doanh', 'Joint-venture partner'),
    o('LOGISTICS', 'Đối tác logistics', 'Logistics partner'), o('RND', 'Đối tác R&D', 'R&D partner'), o('INDUSTRIAL', 'Khách hàng công nghiệp', 'Industrial customer'),
    o('WHOLESALE', 'Nhà bán buôn', 'Wholesaler'), o('MANUFACTURER', 'Nhà sản xuất', 'Manufacturer'), o('INVESTOR', 'Nhà đầu tư', 'Investor'),
  ],
  opportunities: [
    o('DISTRIBUTE', 'Bán / phân phối thành phẩm', 'Sell / distribute finished goods'), o('CONTRACT', 'Gia công sản xuất', 'Contract manufacturing'),
    o('TECH_TRANSFER', 'Chuyển giao công nghệ', 'Technology transfer'), o('GREEN', 'Công nghệ xanh / giảm phát thải', 'Green / low-emission tech'),
    o('DIGITAL', 'Chuyển đổi số / Industry 4.0', 'Digitalisation / Industry 4.0'), o('JV', 'Liên doanh / liên kết', 'Joint venture'),
    o('RND', 'Hợp tác R&D', 'R&D cooperation'), o('PACKAGING', 'Bao bì bền vững', 'Sustainable packaging'), o('INVEST', 'Thu hút đầu tư', 'Attract investment'),
  ],
  readiness: [
    o('RESEARCH', 'Đang khảo sát thị trường, chưa xuất khẩu', 'Researching, not exporting yet'),
    o('OTHER_MARKETS', 'Đã xuất khẩu thị trường khác, chưa vào EU', 'Exporting elsewhere, not to the EU yet'),
    o('NEGOTIATING', 'Đang gửi mẫu / đàm phán / đơn thử', 'Sampling / negotiating / trial order'),
    o('STABLE', 'Đã xuất khẩu ổn định, cần mở rộng', 'Exporting steadily, want to expand'),
  ],
  barriers: [
    o('STANDARDS', 'Tiêu chuẩn kỹ thuật & bền vững (ESG, CBAM, EUDR…)', 'Technical & sustainability standards (ESG, CBAM, EUDR…)'),
    o('ORIGIN', 'Quy tắc xuất xứ, ưu đãi EVFTA, thủ tục hải quan', 'Rules of origin, EVFTA, customs'),
    o('BUYERS', 'Khó tìm và kết nối nhà mua hàng uy tín', 'Finding reliable buyers'),
    o('NEGOTIATION', 'Năng lực đàm phán, kiểm định chất lượng, tranh chấp', 'Negotiation, QC & disputes'),
  ],
  documents: [
    o('PROFILE_VI', 'Company profile tiếng Việt', 'Company profile (VI)'), o('PROFILE_EN', 'Company profile tiếng Anh', 'Company profile (EN)'),
    o('PROFILE_DE', 'Company profile tiếng Đức', 'Company profile (DE)'), o('CATALOGUE_EN', 'Catalogue tiếng Anh', 'Catalogue (EN)'),
    o('WEBSITE_EN', 'Website tiếng Anh', 'English website'), o('CAPABILITY', 'Hồ sơ năng lực sản xuất', 'Production capability deck'),
    o('SPECS', 'Thông số kỹ thuật sản phẩm', 'Product specifications'), o('QUOTE', 'Báo giá xuất khẩu', 'Export price list'),
    o('FACTORY_MEDIA', 'Hình ảnh / video nhà máy', 'Factory photos / video'), o('CASES', 'Case study khách hàng quốc tế', 'International case studies'),
  ],
} as const

/* ---------------------------------------------------------------- data shape */
export type VerifyStatus = 'SELF' | 'SUBMITTED' | 'VERIFIED'
export interface RevenueRow { year: number; band: string; amount: string; proofType: string; proofFile: string; status: VerifyStatus }
export interface Certificate { name: string; issuer: string; expiry: string; file: string }
export interface Attendee { id: string; name: string; title: string; email: string; phone: string }

export interface CompanyProfile {
  general: { nameVi: string; nameEn: string; taxCode: string; ownership: string; foundedYear: string; channels: string; womenOwned: '' | 'YES' | 'NO'; factoryAddress: string; contactName: string; contactTitle: string; contactPhone: string; contactEmail: string }
  capability: { sectors: string[]; mainProducts: string[]; servedIndustries: string; keyCustomers: string; supplyCapacity: string; oem: string; monthlyCapacity: string; exportCapacityPct: string; moq: string; certificates: Certificate[] }
  exports: { exportShare: string; markets: string[]; modes: string[]; traceability: string; euExperience: string; evidence: string }
  finance: { revenues: RevenueRow[]; visibility: 'BAND' | 'HIDDEN' }
  needs: { partnerTypes: string[]; opportunities: string[]; targetMarkets: string[]; readiness: string; barriers: string[]; documents: string[]; note: string }
  attendees: Attendee[]
  consent: { dataUse: boolean; media: boolean }
}

export type SectionKey = 'general' | 'capability' | 'exports' | 'finance' | 'needs' | 'attendees' | 'consent'

const SECTIONS_RAW: { key: SectionKey; title: Bilingual; hint: Bilingual }[] = [
  { key: 'general', title: { vi: 'Thông tin chung', en: 'General information' }, hint: { vi: 'Tên, loại hình sở hữu, kênh online, người liên hệ', en: 'Names, ownership, channels, contact' } },
  { key: 'capability', title: { vi: 'Sản phẩm & năng lực', en: 'Products & capability' }, hint: { vi: 'Sản phẩm chủ lực, công suất, MOQ, chứng nhận', en: 'Key products, capacity, MOQ, certificates' } },
  { key: 'exports', title: { vi: 'Xuất nhập khẩu', en: 'Export experience' }, hint: { vi: 'Thị trường, hình thức, truy xuất nguồn gốc', en: 'Markets, modes, traceability' } },
  { key: 'finance', title: { vi: 'Doanh thu & xác minh', en: 'Revenue & verification' }, hint: { vi: 'Doanh thu 2–3 năm kèm chứng từ', en: '2–3 years of revenue with evidence' } },
  { key: 'needs', title: { vi: 'Nhu cầu hợp tác', en: 'Partnership needs' }, hint: { vi: 'Đối tác cần tìm, mức sẵn sàng, rào cản', en: 'Partners sought, readiness, barriers' } },
  { key: 'attendees', title: { vi: 'Người tham dự sự kiện', en: 'Event attendees' }, hint: { vi: 'Nhân sự thường đi sự kiện, chọn nhanh khi đăng ký', en: 'People you send to events' } },
  { key: 'consent', title: { vi: 'Bảo mật & đồng ý', en: 'Privacy & consent' }, hint: { vi: 'Phạm vi sử dụng dữ liệu, hình ảnh', en: 'Data and media consent' } },
]
export const SECTIONS = SECTIONS_RAW.map((x) => ({ ...x, title: withKo(x.title), hint: withKo(x.hint) }))

/** Section is "done" when these checks pass — events declare which sections they need. */
export function sectionDone(p: CompanyProfile, key: SectionKey): boolean {
  switch (key) {
    case 'general': return !!(p.general.nameVi && p.general.nameEn && p.general.ownership && p.general.contactName && p.general.contactEmail)
    case 'capability': return p.capability.sectors.length > 0 && p.capability.mainProducts.filter(Boolean).length > 0 && !!p.capability.supplyCapacity && !!p.capability.oem && !!p.capability.moq
    case 'exports': return !!p.exports.exportShare && p.exports.modes.length > 0 && !!p.exports.traceability && !!p.exports.euExperience
    case 'finance': return p.finance.revenues.some((r) => r.band)
    case 'needs': return p.needs.partnerTypes.length > 0 && p.needs.opportunities.length > 0 && !!p.needs.readiness
    case 'attendees': return p.attendees.some((a) => a.name && a.email)
    case 'consent': return p.consent.dataUse
  }
}

export const completion = (p: CompanyProfile) => Math.round((SECTIONS.filter((s) => sectionDone(p, s.key)).length / SECTIONS.length) * 100)

const thisYear = new Date().getFullYear()
export const emptyProfile = (name = '', taxCode = ''): CompanyProfile => ({
  general: { nameVi: name, nameEn: '', taxCode, ownership: '', foundedYear: '', channels: '', womenOwned: '', factoryAddress: '', contactName: '', contactTitle: '', contactPhone: '', contactEmail: '' },
  capability: { sectors: [], mainProducts: ['', '', ''], servedIndustries: '', keyCustomers: '', supplyCapacity: '', oem: '', monthlyCapacity: '', exportCapacityPct: '', moq: '', certificates: [] },
  exports: { exportShare: '', markets: [], modes: [], traceability: '', euExperience: '', evidence: '' },
  finance: {
    revenues: [thisYear - 1, thisYear - 2, thisYear - 3].map((year) => ({ year, band: '', amount: '', proofType: '', proofFile: '', status: 'SELF' as VerifyStatus })),
    visibility: 'BAND',
  },
  needs: { partnerTypes: [], opportunities: [], targetMarkets: [], readiness: '', barriers: [], documents: [], note: '' },
  attendees: [],
  consent: { dataUse: false, media: false },
})

/** Demo account used by "Đăng nhập" — about half complete so the gap-fill flow is visible. */
const demoProfile = (): CompanyProfile => {
  const p = emptyProfile('Công ty CP Nội thất Gỗ Phương Nam', '3700 884 512')
  p.general = { ...p.general, nameEn: 'Southwood Furniture JSC', ownership: 'DOMESTIC', foundedYear: '2006', channels: 'southwood.example.vn, linkedin.com/company/southwood', womenOwned: 'NO', contactName: 'Trần Minh Quân', contactTitle: 'Giám đốc xuất khẩu', contactPhone: '0912 000 111', contactEmail: 'export@southwood.example.vn' }
  p.capability = { ...p.capability, sectors: ['FURNITURE'], mainProducts: ['Sofa khung gỗ sồi', 'Bộ bàn ăn gỗ keo', 'Nội thất ngoài trời'], supplyCapacity: 'LARGE', oem: 'YES', monthlyCapacity: '180 container, 70% xuất khẩu', exportCapacityPct: '70', moq: '1 container 40HQ', certificates: [{ name: 'FSC CoC', issuer: 'Control Union', expiry: `${thisYear + 1}-06-30`, file: 'FSC_CoC.pdf' }] }
  p.attendees = [{ id: 'a1', name: 'Trần Minh Quân', title: 'Giám đốc xuất khẩu', email: 'quan.tm@southwood.example.vn', phone: '0912 000 111' }]
  p.finance.revenues[0] = { ...p.finance.revenues[0]!, band: '200_300', amount: '246', proofType: 'AUDITED', proofFile: `BCTC_kiem_toan_${thisYear - 1}.pdf`, status: 'VERIFIED' }
  return p
}

/* ---------------------------------------------------------------- store */
export interface Session { companyName: string; taxCode: string }
export interface EventRegistration { eventId: string; at: string; attendees: Attendee[]; answers: Record<string, string>; snapshot: CompanyProfile }

type Ctx = {
  session: Session | null
  profile: CompanyProfile
  signIn: (s?: Partial<Session>, fresh?: boolean) => void
  signOut: () => void
  update: <K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) => void
  registrations: EventRegistration[]
  register: (r: Omit<EventRegistration, 'at' | 'snapshot'>) => void
}

const ProfileContext = createContext<Ctx | null>(null)
const KEY = 'vcci.profile.v1'

function load(): { session: Session | null; profile: CompanyProfile; registrations: EventRegistration[] } {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* storage unavailable */
  }
  return { session: null, profile: emptyProfile(), registrations: [] }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      signIn: (s, fresh) =>
        setState((prev) => {
          if (fresh) {
            const name = s?.companyName ?? ''
            return { ...prev, session: { companyName: name, taxCode: s?.taxCode ?? '' }, profile: emptyProfile(name, s?.taxCode ?? '') }
          }
          const p = prev.profile.general.nameVi ? prev.profile : demoProfile()
          return { ...prev, session: { companyName: p.general.nameVi, taxCode: p.general.taxCode }, profile: p }
        }),
      signOut: () => setState((prev) => ({ ...prev, session: null })),
      update: (key, v) => setState((prev) => ({ ...prev, profile: { ...prev.profile, [key]: v } })),
      register: (r) =>
        setState((prev) => ({
          ...prev,
          registrations: [...prev.registrations.filter((x) => x.eventId !== r.eventId), { ...r, at: new Date().toISOString(), snapshot: prev.profile }],
        })),
    }),
    [state],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider')
  return ctx
}
