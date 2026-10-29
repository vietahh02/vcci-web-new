/**
 * Public company page data = registration (BusinessRegisterRequest) + capability profile.
 * When the signed-in company views its own page, its saved profile is used, so edits/uploads show up.
 * Other companies use sample data shaped exactly like the profile. All companies are fictional.
 */
import { productsOf } from '@/api'
import { IMG, type Business } from '@/data/mock'
import type { Bilingual } from '@/lib/i18n'
import { OPTIONS, type CompanyProfile, type DocFile, type MediaItem, type VerifyStatus } from '@/lib/profile'

const U = (id: string, w = 1200) => `https://images.unsplash.com/photo-${id}?w=${w}&q=70&auto=format`
const b = (vi: string, en: string, ko: string): Bilingual => ({ vi, en, ko })

export interface PublicCert { name: string; issuer: string; expiry: string; preview?: string }
export interface PublicProfile {
  own: boolean
  nameEn: string
  logo?: string
  cover?: string
  facts: {
    legalForm: string; businessType: string; founded: string; charterCapital: string; employees: string
    revenueBand?: string; revenueYear?: string; revenueStatus?: VerifyStatus; website: string; fax: string
    representative: { name: string; title: string }; contact: { name: string; title: string; phone: string; email: string }
    legalVerified: string[]
  }
  capability: { factoryArea: string; productionLines: string; monthlyCapacity: string; exportPct: string; moq: string; oem: string; supply: string; mainProducts: string[]; keyCustomers: string; qcProcess: string; highlights: Bilingual[] }
  exports: { share: string; markets: string[]; modes: string[]; traceability: string }
  certificates: PublicCert[]
  gallery: MediaItem[]
  documents: DocFile[]
  video: string
  needs: { partnerTypes: string[]; opportunities: string[] }
}

/* per-category sample photos & numbers */
const GALLERY: Record<string, [string, Bilingual, string][]> = {
  'c-agri': [[IMG.factory, b('Nhà máy chế biến ướt', 'Wet-processing mill', '습식 가공 공장'), 'LINE'], [IMG.warehouse, b('Kho bảo quản nhiệt độ kiểm soát', 'Climate-controlled warehouse', '온도 관리 창고'), 'WAREHOUSE'], [IMG.coffeeBeans, b('Nguyên liệu sau phân loại', 'Sorted raw material', '선별된 원료'), 'PRODUCT'], [IMG.meeting, b('Phòng cupping / QC', 'Cupping / QC lab', '커핑 / QC실'), 'QC'], [IMG.port, b('Xuất hàng tại cảng', 'Loading at port', '항구 선적'), 'WAREHOUSE']],
  'c-sea': [[IMG.factory, b('Dây chuyền cấp đông IQF', 'IQF freezing line', 'IQF 급속 냉동 라인'), 'LINE'], [IMG.warehouse, b('Kho lạnh -25°C', '-25°C cold store', '-25°C 냉동 창고'), 'WAREHOUSE'], [IMG.shrimp, b('Thành phẩm tôm sú', 'Finished black tiger shrimp', '블랙타이거 새우 완제품'), 'PRODUCT'], [IMG.port, b('Container lạnh tại cảng', 'Reefers at port', '항구 냉동 컨테이너'), 'WAREHOUSE']],
  'c-tex': [[IMG.factory, b('Chuyền may', 'Sewing lines', '봉제 라인'), 'LINE'], [IMG.clothesRack, b('Phòng mẫu', 'Sample room', '샘플실'), 'OFFICE'], [IMG.tshirts, b('Sản phẩm OEM', 'OEM products', 'OEM 제품'), 'PRODUCT'], [IMG.warehouse, b('Kho thành phẩm', 'Finished goods warehouse', '완제품 창고'), 'WAREHOUSE']],
  'c-furn': [[IMG.factory, b('Xưởng CNC & lắp ráp', 'CNC & assembly shop', 'CNC & 조립 공장'), 'LINE'], [IMG.warehouse, b('Kho thành phẩm', 'Finished goods warehouse', '완제품 창고'), 'WAREHOUSE'], [IMG.sofa, b('Showroom mẫu', 'Sample showroom', '샘플 쇼룸'), 'OFFICE'], [IMG.interior, b('Dự án hoàn thiện', 'Completed project', '완료 프로젝트'), 'PRODUCT']],
  'c-elec': [[IMG.factory, b('Dây chuyền SMT', 'SMT lines', 'SMT 라인'), 'LINE'], [IMG.laptopDark, b('Phòng kiểm thử RF', 'RF test room', 'RF 테스트실'), 'QC'], [IMG.headphones, b('Sản phẩm âm thanh OEM', 'OEM audio products', 'OEM 오디오 제품'), 'PRODUCT'], [IMG.warehouse, b('Kho linh kiện', 'Component store', '부품 창고'), 'WAREHOUSE']],
  'c-craft': [[IMG.vases, b('Sản phẩm men rạn', 'Crackle-glaze products', '크랙 유약 제품'), 'PRODUCT'], [IMG.workshop, b('Xưởng nghệ nhân', 'Artisan workshop', '장인 공방'), 'LINE'], [IMG.interior, b('Showroom decor', 'Décor showroom', '인테리어 쇼룸'), 'OFFICE'], [IMG.warehouse, b('Kho đóng gói chống vỡ', 'Drop-tested packing area', '파손 방지 포장실'), 'WAREHOUSE']],
  'c-mech': [[IMG.welding, b('Xưởng hàn kết cấu', 'Structural welding shop', '구조물 용접 공장'), 'LINE'], [IMG.factory, b('Cụm máy CNC 5 trục', '5-axis CNC cell', '5축 CNC 셀'), 'LINE'], [IMG.port, b('Cảng chuyên dụng', 'Dedicated quay', '전용 부두'), 'WAREHOUSE'], [IMG.meeting, b('Phòng kỹ thuật', 'Engineering office', '기술 사무실'), 'OFFICE']],
  'c-energy': [[IMG.solar, b('Dự án điện mặt trời', 'Solar project', '태양광 프로젝트'), 'PRODUCT'], [IMG.factory, b('Dây chuyền lắp ráp module', 'Module assembly line', '모듈 조립 라인'), 'LINE'], [IMG.warehouse, b('Kho thành phẩm', 'Finished goods warehouse', '완제품 창고'), 'WAREHOUSE'], [IMG.laptopDark, b('Phòng thử nghiệm EL', 'EL test lab', 'EL 시험실'), 'QC']],
}
const NUMBERS: Record<string, { area: string; lines: string; cap: string; pct: string; moq: string; form: string; capital: string; band: string; status: VerifyStatus; share: string }> = {
  'b-caonguyen': { area: '48.000', lines: '3', cap: '5.000 MT', pct: '85', moq: '19 MT', form: 'JOINT_STOCK', capital: '320.000.000.000 VND', band: 'GT300', status: 'VERIFIED', share: 'GT50' },
  'b-mekong': { area: '36.000', lines: '4', cap: '1.200 MT', pct: '90', moq: '2.000 kg', form: 'LLC', capital: '180.000.000.000 VND', band: '200_300', status: 'VERIFIED', share: 'GT50' },
  'b-songhong': { area: '210.000', lines: '42', cap: '2,4 triệu sp', pct: '80', moq: '3.000 pcs', form: 'JOINT_STOCK', capital: '500.000.000.000 VND', band: 'GT300', status: 'SUBMITTED', share: 'GT50' },
  'b-phuongnam': { area: '120.000', lines: '6', cap: '180 container', pct: '70', moq: '1 × 40HQ', form: 'JOINT_STOCK', capital: '150.000.000.000 VND', band: '200_300', status: 'VERIFIED', share: 'GT50' },
  'b-saigontech': { area: '12.000', lines: '8', cap: '600.000 pcs', pct: '75', moq: '1.000 pcs', form: 'LLC', capital: '90.000.000.000 VND', band: '100_200', status: 'SUBMITTED', share: 'GT50' },
  'b-battrang': { area: '4.500', lines: '2', cap: '8.000 sets', pct: '60', moq: '200 sets', form: 'LLC', capital: '12.000.000.000 VND', band: 'LT50', status: 'SELF', share: '31_50' },
  'b-nangvang': { area: '85.000', lines: '5', cap: '100 MW', pct: '65', moq: '200 pcs', form: 'JOINT_STOCK', capital: '1.200.000.000.000 VND', band: 'GT300', status: 'VERIFIED', share: 'GT50' },
  'b-phuquoc': { area: '18.000', lines: '3', cap: '900 MT', pct: '80', moq: '12 MT', form: 'LLC', capital: '60.000.000.000 VND', band: '100_200', status: 'SUBMITTED', share: 'GT50' },
  'b-haiphong': { area: '95.000', lines: '4', cap: '1.500 MT', pct: '55', moq: '10 MT', form: 'JOINT_STOCK', capital: '400.000.000.000 VND', band: 'GT300', status: 'VERIFIED', share: '31_50' },
}

const opt = (set: readonly { value: string }[], v: string) => (set.find((o) => o.value === v) ? v : '')

export function buildPublicProfile(biz: Business, own: CompanyProfile | null): PublicProfile {
  const n = NUMBERS[biz.id] ?? NUMBERS['b-phuongnam']!
  const products = productsOf(biz.id)
  const certNames = Array.from(new Set(products.flatMap((p) => p.certificates)))
  const year = new Date().getFullYear()

  const sample: PublicProfile = {
    own: false,
    nameEn: biz.nameEn,
    facts: {
      legalForm: n.form, businessType: biz.businessType, founded: String(biz.founded), charterCapital: n.capital, employees: biz.employees,
      revenueBand: n.band, revenueYear: String(year - 1), revenueStatus: n.status, website: biz.website, fax: '',
      representative: { name: '—', title: '' }, contact: { name: '', title: '', phone: biz.phone, email: biz.email },
      legalVerified: biz.verified ? ['BUSINESS_LICENSE', 'TAX'] : [],
    },
    capability: {
      factoryArea: n.area, productionLines: n.lines, monthlyCapacity: n.cap, exportPct: n.pct, moq: n.moq, oem: 'YES', supply: 'LARGE',
      mainProducts: products.map((p) => p.productName.vi).slice(0, 5), keyCustomers: '', qcProcess: '', highlights: biz.capabilities,
    },
    exports: { share: n.share, markets: biz.markets, modes: ['DIRECT', 'OEM'], traceability: 'LOT' },
    certificates: certNames.map((c) => ({ name: c, issuer: '', expiry: `${year + 1}-12-31` })),
    gallery: (GALLERY[biz.categoryId] ?? GALLERY['c-furn']!).map(([id, cap, kind], i) => ({ id: `${biz.id}-g${i}`, url: U(id), caption: cap.vi, kind, captionI18n: cap }) as MediaItem),
    documents: [
      { id: `${biz.id}-dp`, name: `${biz.nameEn.replace(/[^A-Za-z]+/g, '_')}_Company_Profile_EN.pdf`, kind: 'brochure', size: 6_200_000, preview: U(biz.coverImage, 600) },
      ...(products[0] ? [{ id: `${biz.id}-dc`, name: `Catalogue_${year}.pdf`, kind: 'brochure', size: 11_800_000, preview: U(products[0].productImages[0]!, 600) }] : []),
    ],
    video: '',
    needs: { partnerTypes: ['SOURCING', 'WHOLESALE'], opportunities: ['DISTRIBUTE', 'CONTRACT'] },
  }
  if (!own) return sample

  const latest = own.finance.revenues.find((r) => r.band)
  return {
    own: true,
    nameEn: own.general.nameEn || biz.nameEn,
    logo: own.media.logo || undefined,
    cover: own.media.cover || undefined,
    facts: {
      legalForm: own.registration.businessForm || sample.facts.legalForm,
      businessType: own.registration.businessType || biz.businessType,
      founded: own.general.foundedYear || sample.facts.founded,
      charterCapital: own.registration.charterCapital ? `${own.registration.charterCapital} ${own.registration.charterCurrency}` : sample.facts.charterCapital,
      employees: own.registration.employees || biz.employees,
      revenueBand: own.finance.visibility === 'BAND' ? latest?.band : undefined,
      revenueYear: latest ? String(latest.year) : undefined,
      revenueStatus: latest?.status,
      website: own.registration.website || own.general.channels.split(',')[0]?.trim() || biz.website,
      fax: own.registration.fax,
      representative: { name: own.registration.repName, title: own.registration.repTitle },
      contact: { name: own.general.contactName, title: own.general.contactTitle, phone: own.general.contactPhone || biz.phone, email: own.general.contactEmail || biz.email },
      legalVerified: own.registration.legalDocs.license ? ['BUSINESS_LICENSE', ...(own.registration.legalDocs.tax ? ['TAX'] : [])] : sample.facts.legalVerified,
    },
    capability: {
      factoryArea: own.capability.factoryArea, productionLines: own.capability.productionLines, monthlyCapacity: own.capability.monthlyCapacity,
      exportPct: own.capability.exportCapacityPct, moq: own.capability.moq, oem: opt(OPTIONS.oem, own.capability.oem), supply: opt(OPTIONS.supplyCapacity, own.capability.supplyCapacity),
      mainProducts: own.capability.mainProducts.filter(Boolean), keyCustomers: own.capability.keyCustomers, qcProcess: own.capability.qcProcess, highlights: [],
    },
    exports: { share: own.exports.exportShare, markets: own.exports.markets.length ? own.exports.markets : biz.markets, modes: own.exports.modes, traceability: own.exports.traceability },
    certificates: own.capability.certificates.filter((c) => c.name).map((c) => ({ name: c.name, issuer: c.issuer, expiry: c.expiry, preview: c.preview })),
    gallery: own.media.gallery.length ? own.media.gallery : sample.gallery,
    documents: own.media.documents.length ? own.media.documents : sample.documents,
    video: own.media.video,
    needs: { partnerTypes: own.needs.partnerTypes, opportunities: own.needs.opportunities },
  }
}
