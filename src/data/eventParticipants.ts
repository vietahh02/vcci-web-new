/**
 * Buyers / sellers / support services attached to an event (BRD-SHB §5.4: Bên bán – Bên mua – Dịch vụ hỗ trợ).
 * One participant model serves every event state: only the status wording and available actions change.
 * Buyers and sellers are listed publicly together with what they supply (cung) and what they need (cầu); contact details stay private until both sides connect.
 */
import { businesses, products, type EventItem } from '@/data/mock'
import { getShow } from '@/data/shows'
import type { Bilingual } from '@/lib/i18n'

export type Side = 'SELLER' | 'BUYER' | 'SUPPORT'
export interface Participant {
  id: string
  name: string
  nameEn?: string
  country: string
  side: Side
  kind: Bilingual
  industries: string[]
  accent: string
  businessId?: string
  /** what the buyer is looking for (cầu) */
  need?: Bilingual
  /** what the seller supplies (cung) */
  offer?: Bilingual[]
  /** sample presence: online now (live) / attended (ended) */
  online: boolean
  attended: boolean
  quotes: number
}

const b = (vi: string, en: string): Bilingual => ({ vi, en })
const hash = (s: string) => Math.abs([...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 13))

const KEYWORDS: Record<string, string[]> = {
  Food: ['Coffee', 'Agriculture', 'Spices', 'Seafood'], Seafood: ['Seafood'], Coffee: ['Coffee'], Furniture: ['Furniture'], Textiles: ['Textile', 'Apparel'],
  Fashion: ['Textile', 'Apparel'], Machinery: ['Machinery', 'Steel'], Electronics: ['Electronics'], Solar: ['Energy'], Energy: ['Energy'], Handicraft: ['Handicraft', 'Ceramics'],
}

/** Foreign buyers (fictional). */
const BUYERS: Omit<Participant, 'side' | 'online' | 'attended' | 'quotes'>[] = [
  { id: 'by-1', name: 'Nordhafen Trading GmbH', country: 'DE', kind: b('Nhà nhập khẩu', 'Importer'), industries: ['Coffee', 'Food', 'Spices'], need: b('Cần nhập 2 container cà phê Robusta S18 mỗi tháng, có chứng nhận EUDR.', 'Needs 2 containers of Robusta S18 a month, EUDR-compliant.'), accent: '#1d4ed8' },
  { id: 'by-2', name: 'Seoul Fresh Mart', country: 'KR', kind: b('Chuỗi bán lẻ', 'Retail chain'), industries: ['Food', 'Seafood'], need: b('Tìm nhà cung cấp tôm và cá tra đông lạnh, đạt BRC, giao CIF Busan.', 'Seeking BRC-certified frozen shrimp and pangasius, CIF Busan.'), accent: '#be123c' },
  { id: 'by-3', name: 'Tokyo Marine Foods', country: 'JP', kind: b('Nhà nhập khẩu', 'Importer'), industries: ['Seafood', 'Food'], need: b('Cần tôm thẻ PTO 26/30 và nguyên liệu surimi, đơn hàng đều đặn.', 'Needs PTO whiteleg shrimp 26/30 and surimi raw material, recurring orders.'), accent: '#0e7490' },
  { id: 'by-4', name: 'Manila Central Distribution', country: 'PH', kind: b('Nhà phân phối', 'Distributor'), industries: ['Food', 'Handicraft', 'Multi-industry'], need: b('Tìm nhà xuất khẩu thực phẩm đóng gói và đồ thủ công cho chuỗi bán lẻ.', 'Looking for packaged food and handicraft exporters for retail chains.'), accent: '#b45309' },
  { id: 'by-5', name: 'Atlantic Home Imports', country: 'US', kind: b('Nhà nhập khẩu', 'Importer'), industries: ['Furniture', 'Handicraft'], need: b('Cần nội thất gỗ keo FSC, sản xuất theo bản vẽ, container hỗn hợp.', 'Needs FSC acacia furniture, build-to-drawing, mixed containers.'), accent: '#4338ca' },
  { id: 'by-6', name: 'Lumière Textiles SAS', country: 'FR', kind: b('Thương hiệu thời trang', 'Fashion brand'), industries: ['Textiles', 'Fashion'], need: b('Tìm xưởng may cotton hữu cơ GOTS, MOQ từ 3.000 sản phẩm.', 'Seeking GOTS organic-cotton garment factories, MOQ from 3,000 pcs.'), accent: '#9f1239' },
  { id: 'by-7', name: 'Rotterdam Green Supply', country: 'NL', kind: b('Nhà phân phối', 'Distributor'), industries: ['Solar', 'Energy', 'Machinery', 'Electronics'], need: b('Cần nhà cung ứng tấm pin 550W và kết cấu inox cho dự án áp mái châu Âu.', 'Needs 550W panels and stainless structures for European rooftop projects.'), accent: '#15803d' },
  { id: 'by-8', name: 'Gulf Foodstuff Trading', country: 'AE', kind: b('Nhà nhập khẩu', 'Importer'), industries: ['Food', 'Spices', 'Multi-industry'], need: b('Cần tiêu đen, gia vị và gạo thơm số lượng lớn, giao FOB.', 'Needs black pepper, spices and fragrant rice in volume, FOB.'), accent: '#a16207' },
  { id: 'by-9', name: 'Stockholm Tech Sourcing AB', country: 'SE', kind: b('Văn phòng thu mua', 'Sourcing office'), industries: ['Electronics', 'Machinery'], need: b('Tìm nhà sản xuất linh kiện điện tử, tai nghe ANC theo OEM.', 'Looking for electronics component and OEM ANC headphone makers.'), accent: '#334155' },
  { id: 'by-10', name: 'Sunrise Investment Partners', country: 'SG', kind: b('Nhà đầu tư', 'Investor'), industries: ['Multi-industry', 'Energy'], need: b('Tìm cơ hội hợp tác đầu tư năng lượng sạch và sản xuất tại Việt Nam.', 'Seeking clean-energy and manufacturing investment opportunities in Vietnam.'), accent: '#6d28d9' },
]

const SUPPORT: { id: string; name: string; kind: Bilingual; accent: string }[] = [
  { id: 'sp-1', name: 'VietLaw Advisory', kind: b('Tư vấn pháp lý', 'Legal advisory'), accent: '#4338ca' },
  { id: 'sp-2', name: 'SaoViet Bank', kind: b('Tài chính thương mại', 'Trade finance'), accent: '#0b4f8a' },
  { id: 'sp-3', name: 'MekongLog', kind: b('Logistics', 'Logistics'), accent: '#0f766e' },
]

const presence = (id: string, ev: EventItem) => {
  const h = hash(id + ev.id)
  return { online: ev.eventStatus === 'ONGOING' && h % 100 < 55, attended: ev.eventStatus === 'ENDED' && h % 100 < 82, quotes: 2 + (h % 24) }
}

export function eventParticipants(ev: EventItem): Participant[] {
  const show = getShow(ev.id)
  const sellers: Participant[] = show
    ? show.booths.filter((x) => x.side === 'SELLER').map((x) => ({
        id: x.id, name: x.org.vi, nameEn: x.org.en, country: x.country, side: 'SELLER' as const, kind: b('Nhà xuất khẩu', 'Exporter'), industries: [show.pavilions.find((p) => p.id === x.pavilionId)?.industry ?? ''],
        accent: x.accent, businessId: x.businessId, offer: x.products.slice(0, 3).map((p) => p.name), ...presence(x.id, ev),
      }))
    : (() => {
        const wanted = new Set(ev.industry.flatMap((i) => KEYWORDS[i] ?? []))
        const all = ev.industry.includes('Multi-industry') || wanted.size === 0
        return businesses.filter((x) => x.businessType === 'VN_EXPORTER' && (all || x.industry.some((i) => wanted.has(i)))).slice(0, 8).map((x) => ({
          id: x.id, name: x.name, nameEn: x.nameEn, country: x.country, side: 'SELLER' as const, kind: b('Nhà xuất khẩu', 'Exporter'), industries: x.industry, accent: x.accent, businessId: x.id, offer: products.filter((p) => p.organizationId === x.id).slice(0, 3).map((p) => p.productName), ...presence(x.id, ev),
        }))
      })()
  const bw = new Set(ev.industry)
  const buyers: Participant[] = BUYERS.filter((x) => x.industries.some((i) => bw.has(i)) || bw.has('Multi-industry')).slice(0, 8)
    .map((x) => ({ ...x, side: 'BUYER' as const, ...presence(x.id, ev) }))
  const support: Participant[] = SUPPORT.map((x) => ({ ...x, country: 'VN', side: 'SUPPORT' as const, industries: [], ...presence(x.id, ev) }))
  return [...sellers, ...buyers, ...support]
}
