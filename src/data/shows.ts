/**
 * Show Hub mock data — online-only trade shows (BRD-VCCI-SHB-v1.0, SRS_SHB / SRS_SHV).
 * Only content that is already approved appears here (BRL-SHB-05): booths APPROVED, products APPROVED,
 * launch slots CONFIRMED, sessions published. All companies and people are fictional.
 */
import { IMG } from '@/data/mock'
import type { Bilingual } from '@/lib/i18n'

const b = (vi: string, en: string): Bilingual => ({ vi, en })
const at = (offset: number, hour = 9, minute = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}
const dateOnly = (offset: number) => at(offset, 0).slice(0, 10)

/* ------------------------------------------------------------ types */
/** Stored show status (BR-SHB-01). Portal only lists these four (BR-SHB-11). */
export type ShowStatus = 'UPCOMING' | 'ONGOING' | 'ENDED' | 'CANCELED'
/** Display label, never stored (BRL-SHB-02). Live mode takes it from the API (`displayLabel`); only mock data computes it (showLabel). */
export type ShowLabel = 'LIVE' | 'ONGOING' | 'CANCELED' | 'REPLAY' | 'ENDED' | 'FULL' | 'REG_OPEN' | 'REG_NOT_OPEN' | 'REG_CLOSED' | 'UPCOMING'
/** Direction of the show: who is invited to sell (BR-SHB-19). */
export type ShowDirection = 'EXPORT' | 'IMPORT'
/** Seller / buyer / support side derived from BusinessTypeEnum (BR-SHB-16, 5.4.2). */
export type ShowSide = 'SELLER' | 'SUPPORT'
export type SessionStatus = 'PUBLISHED' | 'LIVE' | 'ENDED' | 'CANCELED'
export type SessionKind = 'SEMINAR' | 'LAUNCH' | 'MATCHMAKING'

export interface ShowPhase { id: string; name: Bilingual; start: string; end: string; theme: Bilingual }
export interface ShowPavilion { id: string; name: Bilingual; industry: string }
export interface ShowProduct { id: string; name: Bilingual; image: string; blurb: Bilingual; featured?: boolean; moq?: string; linkId?: string }
export interface ShowBooth {
  id: string
  name: Bilingual
  org: Bilingual
  country: string
  pavilionId: string
  phaseId: string
  side: ShowSide
  accent: string
  cover: string
  tagline: Bilingual
  about: Bilingual
  verified: boolean
  businessId?: string
  products: ShowProduct[]
  website?: string
}
export interface ShowLaunch {
  id: string
  boothId: string
  productId: string
  stage: Bilingual
  start: string
  end: string
  live: boolean
  followers: number
  /** Live mode: the broadcast behind this launch slot, when one is linked. */
  streamEventId?: string
  streamSessionId?: string
}
export interface ShowSpeaker { id: string; name: string; title: Bilingual; org: Bilingual; country: string; bio: Bilingual; accent: string }
export interface ShowSession {
  id: string
  kind: SessionKind
  title: Bilingual
  summary: Bilingual
  speakerIds: string[]
  room: Bilingual
  start: string
  end: string
  capacity: number
  booked: number
  status: SessionStatus
  hasReplay?: boolean
  phaseId: string
  tags: string[]
  /** Live mode: the webinar/livestream session behind this agenda row, when one is linked. */
  live?: { eventType: string; eventId: string; sessionId: string }
  recordingUrl?: string
}
/** Show home-page content entered in the CMS; each block only renders when it has rows. */
export interface ShowStat { label: Bilingual; value: Bilingual }
export interface ShowWhyAttend { title: Bilingual; text: Bilingual }
export interface ShowHighlight { title: Bilingual; text: Bilingual; image?: string; video?: string; link?: string; hero: boolean }
export interface ShowFaq { q: Bilingual; a: Bilingual }
export interface Show {
  id: string
  title: Bilingual
  tagline: Bilingual
  introduction: Bilingual
  cover: string
  status: ShowStatus
  direction: ShowDirection
  /** Who may open booths: domestic (VN) or foreign exhibitors (exhibitorScope). */
  exhibitorScope: 'DOMESTIC' | 'FOREIGN'
  targetMarkets: string[]
  industries: string[]
  startDate: string
  endDate: string
  /** HH:mm (Vietnam time); missing means all day. */
  startTime?: string
  endTime?: string
  /** Label from the API, same value as GET /api/public/shows. */
  displayLabel?: ShowLabel
  organizer: Bilingual
  /** Virtual venue only: Show Hub is online-only (BR-SHB-15). */
  virtualVenue: Bilingual
  /** Online-first (Leader 01/11/2026): ONLINE by default; OFFLINE/HYBRID only when the backend flag is on. */
  format?: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  /** Physical venue, present only for OFFLINE/HYBRID shows; shown as secondary info. */
  physicalVenue?: Bilingual
  boothCapacity: number
  visitorTicketFee: number
  ticketCurrency: 'VND' | 'USD'
  requireVisitorApproval: boolean
  boothFee: number
  registrationDeadline: string
  issuedBadges: number
  inquiries: number
  phases: ShowPhase[]
  pavilions: ShowPavilion[]
  booths: ShowBooth[]
  launches: ShowLaunch[]
  speakers: ShowSpeaker[]
  sessions: ShowSession[]
  contact: { name: string; email: string; phone: string }
  rules: Bilingual[]
  /** Hero overrides from the CMS; without them the hero uses title and cover. */
  heroTitle?: Bilingual
  heroBadge?: Bilingual
  banner?: string
  stats?: ShowStat[]
  whyAttend?: ShowWhyAttend[]
  topics?: Bilingual[]
  highlights?: ShowHighlight[]
  faq?: ShowFaq[]
  /** New-product launch moments from approved participation applications (V85) - show calendar, no streaming. */
  productLaunches?: ShowProductLaunch[]
}

export interface ShowProductLaunch {
  productId: string
  productName: string
  productImage?: string
  organizationName?: string
  /** yyyy-MM-dd */
  launchDate: string
  /** HH:mm */
  startTime: string
  endTime: string
}

/* ------------------------------------------------------------ show 1: ongoing export expo */
const expoPhases: ShowPhase[] = [
  { id: 'ph1', name: b('Kỳ 1 — Nông sản & Cà phê', 'Phase 1 — Agri & Coffee'), start: dateOnly(-3), end: dateOnly(1), theme: b('Hạt cà phê, gạo, trái cây nhiệt đới', 'Coffee, rice, tropical fruit') },
  { id: 'ph2', name: b('Kỳ 2 — Thuỷ sản & Thực phẩm chế biến', 'Phase 2 — Seafood & Processed Food'), start: dateOnly(2), end: dateOnly(5), theme: b('Tôm, cá tra, gia vị, thực phẩm đóng gói', 'Shrimp, pangasius, spices, packaged food') },
  { id: 'ph3', name: b('Kỳ 3 — Nội thất & Thủ công mỹ nghệ', 'Phase 3 — Furniture & Handicraft'), start: dateOnly(6), end: dateOnly(9), theme: b('Gỗ, gốm, mây tre, dệt may', 'Wood, ceramics, rattan, textiles') },
]
const expoPavilions: ShowPavilion[] = [
  { id: 'pv1', name: b('Khu Cà phê & Nông sản', 'Coffee & Agri Pavilion'), industry: 'Agriculture' },
  { id: 'pv2', name: b('Khu Thuỷ sản & Thực phẩm', 'Seafood & Food Pavilion'), industry: 'Food' },
  { id: 'pv3', name: b('Khu Nội thất & Thủ công', 'Furniture & Handicraft Pavilion'), industry: 'Handicraft' },
]
const expoBooths: ShowBooth[] = [
  {
    id: 'bt-cnx', name: b('Gian Cà phê Cao Nguyên Xanh', 'Highland Green Coffee Booth'), org: b('Công ty CP Cà phê Cao Nguyên Xanh', 'Highland Green Coffee JSC'),
    country: 'VN', pavilionId: 'pv1', phaseId: 'ph1', side: 'SELLER', accent: '#7a4a1f', cover: IMG.coffeeBeans, verified: true, businessId: 'b-caonguyen',
    tagline: b('Robusta & Arabica truy xuất đến từng nông hộ', 'Robusta & Arabica traceable to the farm'),
    about: b('3 nhà máy chế biến ướt, vùng nguyên liệu 4.200 ha đạt chứng nhận bền vững. Mời tham quan gian để nhận mẫu cupping trực tuyến và báo giá FOB theo container.', '3 wet mills and 4,200 ha of certified farms. Visit the booth for an online cupping session and per-container FOB quotes.'),
    products: [
      { id: 'sp-rb', name: b('Robusta nhân xanh S18', 'Robusta green beans S18'), image: IMG.coffeeBeans, featured: true, moq: '1 × 20ft', linkId: 'p-robusta', blurb: b('Sàng 18, ẩm ≤ 12,5%, tạp chất < 0,1%', 'Screen 18, moisture ≤ 12.5%, foreign matter < 0.1%') },
      { id: 'sp-ar', name: b('Arabica Cầu Đất rang xay', 'Cau Dat Arabica roasted'), image: IMG.coffeeBag, linkId: 'p-arabica', blurb: b('Rang vừa, hương hoa quả, nhãn riêng từ 500 kg', 'Medium roast, fruity notes, private label from 500 kg') },
      { id: 'sp-latte', name: b('Cà phê hoà tan sấy lạnh', 'Freeze-dried instant coffee'), image: IMG.latte, blurb: b('Hoà tan nhanh, đóng gói OEM', 'Fast-dissolving, OEM packing') },
    ],
  },
  {
    id: 'bt-pq', name: b('Gian Gia vị & Nông sản Phú Quốc', 'Phu Quoc Spice & Agro Booth'), org: b('Công ty TNHH Gia vị & Nông sản Phú Quốc', 'Phu Quoc Spice & Agro Co., Ltd'),
    country: 'VN', pavilionId: 'pv1', phaseId: 'ph1', side: 'SELLER', accent: '#b45309', cover: IMG.spices, verified: true, businessId: 'b-phuquoc',
    tagline: b('Tiêu đen, gạo ST25, thanh long sấy', 'Black pepper, ST25 rice, dried dragon fruit'),
    about: b('Đạt tiêu chuẩn ASTA, quy định dư lượng EU. Nhận đơn mẫu và đơn thử cho nhà nhập khẩu mới.', 'ASTA-grade and EU-residue compliant. Samples and trial orders for new importers.'),
    products: [
      { id: 'sp-pp', name: b('Tiêu đen 500 g/l', 'Black pepper 500 g/l'), image: IMG.spoonSpices, featured: true, moq: '2 MT', linkId: 'p-pepper', blurb: b('Làm sạch, tiệt trùng hơi nước', 'Machine cleaned, steam sterilised') },
      { id: 'sp-rice', name: b('Gạo ST25 thơm', 'ST25 fragrant rice'), image: IMG.rice, linkId: 'p-rice', blurb: b('Giải thưởng gạo ngon thế giới', 'World’s best rice award') },
      { id: 'sp-df', name: b('Thanh long ruột đỏ', 'Red-flesh dragon fruit'), image: IMG.dragonfruit, linkId: 'p-dragon', blurb: b('Đạt chuẩn GlobalG.A.P', 'GlobalG.A.P certified') },
    ],
  },
  {
    id: 'bt-tea', name: b('Gian Trà Thái Nguyên Tinh Hoa', 'Thai Nguyen Premium Tea Booth'), org: b('Hợp tác xã Chè Tân Cương', 'Tan Cuong Tea Cooperative'),
    country: 'VN', pavilionId: 'pv1', phaseId: 'ph1', side: 'SELLER', accent: '#15803d', cover: IMG.tea, verified: true,
    tagline: b('Chè xanh hữu cơ, OEM cho thương hiệu nước ngoài', 'Organic green tea, OEM for overseas brands'),
    about: b('Vùng chè hữu cơ 320 ha. Hỗ trợ tư vấn công thức pha trộn theo thị hiếu từng thị trường.', '320 ha organic tea estate. Blend consultation by target market.'),
    products: [
      { id: 'sp-tea1', name: b('Trà xanh búp hữu cơ', 'Organic green tea buds'), image: IMG.tea, featured: true, moq: '300 kg', blurb: b('USDA Organic, EU Organic', 'USDA & EU Organic') },
      { id: 'sp-tea2', name: b('Trà túi lọc xuất khẩu', 'Export tea bags'), image: IMG.tote, blurb: b('Đóng gói OEM, in nhãn riêng', 'OEM packing, private label') },
    ],
  },
  {
    id: 'bt-mk', name: b('Gian Thuỷ sản Mekong Pearl', 'Mekong Pearl Seafood Booth'), org: b('Công ty TNHH Thuỷ sản Mekong Pearl', 'Mekong Pearl Seafood Co., Ltd'),
    country: 'VN', pavilionId: 'pv2', phaseId: 'ph2', side: 'SELLER', accent: '#0e7490', cover: IMG.shrimp, verified: true, businessId: 'b-mekong',
    tagline: b('Tôm thẻ chân trắng đạt BRC, ASC, BAP', 'BRC, ASC & BAP certified whiteleg shrimp'),
    about: b('Nhà máy chế biến đông lạnh công suất 12.000 tấn/năm, giao CIF các cảng Đông Bắc Á trong 25 ngày.', '12,000 MT/yr frozen-processing plant, CIF delivery to Northeast Asian ports in 25 days.'),
    products: [
      { id: 'sp-sh1', name: b('Tôm thẻ PTO 26/30', 'PTO whiteleg shrimp 26/30'), image: IMG.shrimp, featured: true, moq: '1 × 20ft', linkId: 'p-shrimp', blurb: b('Block 2 kg, IQF theo yêu cầu', '2 kg block, IQF on request') },
      { id: 'sp-sh2', name: b('Cá tra phi lê đông lạnh', 'Frozen pangasius fillet'), image: IMG.port, blurb: b('Không phụ gia, glazing 10%', 'Additive-free, 10% glazing') },
    ],
  },
  {
    id: 'bt-sh', name: b('Gian Dệt may Sông Hồng Việt', 'Red River Viet Textile Booth'), org: b('Tổng công ty Dệt may Sông Hồng Việt', 'Red River Viet Textile Corp.'),
    country: 'VN', pavilionId: 'pv3', phaseId: 'ph3', side: 'SELLER', accent: '#be123c', cover: IMG.apparel, verified: true, businessId: 'b-songhong',
    tagline: b('Áo thun hữu cơ, đồ thể thao, OEM/ODM', 'Organic tees, activewear, OEM/ODM'),
    about: b('Chuỗi sản xuất khép kín từ sợi đến may, chứng nhận OEKO-TEX và GOTS.', 'Vertically integrated from yarn to garment; OEKO-TEX and GOTS certified.'),
    products: [
      { id: 'sp-ts', name: b('Áo thun cotton hữu cơ', 'Organic cotton T-shirt'), image: IMG.tshirts, featured: true, moq: '3.000 pcs', linkId: 'p-tshirt', blurb: b('180 gsm, GOTS', '180 gsm, GOTS') },
      { id: 'sp-at', name: b('Bộ thể thao co giãn', 'Stretch activewear set'), image: IMG.clothesRack, linkId: 'p-athleisure', blurb: b('Thoáng khí, khô nhanh', 'Breathable, quick-dry') },
    ],
  },
  {
    id: 'bt-pn', name: b('Gian Nội thất Gỗ Phương Nam', 'Southwood Furniture Booth'), org: b('Công ty CP Nội thất Gỗ Phương Nam', 'Southwood Furniture JSC'),
    country: 'VN', pavilionId: 'pv3', phaseId: 'ph3', side: 'SELLER', accent: '#92400e', cover: IMG.interior, verified: true, businessId: 'b-phuongnam',
    tagline: b('Nội thất gỗ keo FSC cho thị trường Mỹ - EU', 'FSC acacia furniture for US & EU'),
    about: b('Sản xuất theo bản vẽ, ra mẫu trong 15 ngày, container hỗn hợp.', 'Build-to-drawing, samples in 15 days, mixed containers.'),
    products: [
      { id: 'sp-sf', name: b('Sofa 3 chỗ khung gỗ', '3-seat wooden sofa'), image: IMG.sofa, featured: true, moq: '1 × 40HQ', linkId: 'p-sofa', blurb: b('Gỗ keo FSC, bọc vải chống bẩn', 'FSC acacia, stain-resistant fabric') },
      { id: 'sp-dn', name: b('Bộ bàn ăn 6 ghế', '6-seat dining set'), image: IMG.interior, linkId: 'p-dining', blurb: b('Tháo lắp, đóng gói phẳng', 'Knock-down flat pack') },
    ],
  },
  {
    id: 'bt-bt', name: b('Gian Gốm Bát Tràng Heritage', 'Bat Trang Heritage Ceramics Booth'), org: b('Công ty Gốm sứ Bát Tràng Heritage', 'Bat Trang Heritage Ceramics'),
    country: 'VN', pavilionId: 'pv3', phaseId: 'ph3', side: 'SELLER', accent: '#0f766e', cover: IMG.vases, verified: true, businessId: 'b-battrang',
    tagline: b('Gốm men rạn thủ công, men không chì', 'Handmade crackle-glaze, lead-free'),
    about: b('Nghệ nhân làng nghề 400 năm, nhận thiết kế riêng theo bộ sưu tập.', '400-year craft village artisans, custom collections welcome.'),
    products: [{ id: 'sp-vs', name: b('Bình gốm men rạn', 'Crackle-glaze vase'), image: IMG.vases, featured: true, moq: '200 pcs', linkId: 'p-vase', blurb: b('Men không chì đạt FDA', 'FDA-compliant lead-free glaze') }],
  },
  {
    id: 'bt-law', name: b('Gian Tư vấn Pháp lý Việt Luật', 'VietLaw Advisory Booth'), org: b('Công ty Luật Việt Luật', 'VietLaw Advisory'),
    country: 'VN', pavilionId: 'pv1', phaseId: 'ph1', side: 'SUPPORT', accent: '#4338ca', cover: IMG.meeting, verified: true,
    tagline: b('Tư vấn FTA, CBAM, hợp đồng xuất khẩu', 'FTA, CBAM and export-contract advice'),
    about: b('Gian dịch vụ hỗ trợ — không bán hàng hoá. Đặt lịch tư vấn miễn phí 20 phút cho doanh nghiệp tham quan.', 'Support-service booth — no goods for sale. Book a free 20-minute consultation.'),
    products: [{ id: 'sp-law', name: b('Gói rà soát hợp đồng xuất khẩu', 'Export contract review pack'), image: IMG.laptop, blurb: b('Báo giá theo hồ sơ', 'Quoted per file') }],
  },
]
const expoSpeakers: ShowSpeaker[] = [
  { id: 'sk1', name: 'Nguyễn Thu Hà', title: b('Phó Giám đốc Trung tâm WTO & Hội nhập', 'Deputy Director, WTO & Integration Center'), org: b('VCCI', 'VCCI'), country: 'VN', accent: '#006699', bio: b('15 năm tư vấn doanh nghiệp xuất khẩu tận dụng FTA.', '15 years advising exporters on leveraging FTAs.') },
  { id: 'sk2', name: 'Klaus Reinhardt', title: b('Trưởng bộ phận mua hàng cà phê', 'Head of Coffee Sourcing'), org: b('Nordhafen Trading GmbH', 'Nordhafen Trading GmbH'), country: 'DE', accent: '#7a4a1f', bio: b('Nhập khẩu hơn 40.000 tấn cà phê xanh mỗi năm vào EU.', 'Imports 40,000+ MT of green coffee a year into the EU.') },
  { id: 'sk3', name: 'Trần Minh Quân', title: b('Giám đốc xuất khẩu', 'Export Director'), org: b('Mekong Pearl Seafood', 'Mekong Pearl Seafood'), country: 'VN', accent: '#0e7490', bio: b('Chuyên gia chứng nhận thuỷ sản BRC/ASC.', 'BRC/ASC seafood certification specialist.') },
  { id: 'sk4', name: 'Park Ji-woo', title: b('Giám đốc danh mục thực phẩm', 'Food Category Director'), org: b('Seoul Fresh Mart', 'Seoul Fresh Mart'), country: 'KR', accent: '#be123c', bio: b('Phụ trách thu mua thực phẩm châu Á cho 120 cửa hàng.', 'Leads Asian food sourcing for 120 stores.') },
  { id: 'sk5', name: 'Lê Thanh Mai', title: b('Luật sư điều hành', 'Managing Partner'), org: b('Việt Luật', 'VietLaw Advisory'), country: 'VN', accent: '#4338ca', bio: b('Chuyên hợp đồng thương mại quốc tế và CBAM.', 'International trade contracts and CBAM specialist.') },
]
const expoSessions: ShowSession[] = [
  { id: 'ss1', kind: 'SEMINAR', title: b('Khai mạc & Toàn cảnh xuất khẩu nông sản 2026', 'Opening & 2026 Agri-Export Outlook'), summary: b('Toàn cảnh thị trường và cơ hội EVFTA cho nhóm nông sản.', 'Market overview and EVFTA opportunities for agri products.'), speakerIds: ['sk1'], room: b('Sân khấu ảo chính', 'Main virtual stage'), start: at(-2, 9), end: at(-2, 10, 30), capacity: 500, booked: 412, status: 'ENDED', hasReplay: true, phaseId: 'ph1', tags: ['EVFTA', 'Agri'] },
  { id: 'ss2', kind: 'SEMINAR', title: b('Người mua châu Âu cần gì từ cà phê Việt?', 'What EU buyers want from Vietnamese coffee'), summary: b('Tiêu chuẩn EUDR, truy xuất nguồn gốc và điều khoản thanh toán.', 'EUDR requirements, traceability and payment terms.'), speakerIds: ['sk2', 'sk1'], room: b('Phòng hội thảo ảo A', 'Virtual seminar room A'), start: at(0, 14), end: at(0, 15, 30), capacity: 300, booked: 214, status: 'LIVE', phaseId: 'ph1', tags: ['Coffee', 'EUDR'] },
  { id: 'ss3', kind: 'SEMINAR', title: b('Chứng nhận BRC – ASC: lộ trình cho nhà xuất khẩu thuỷ sản', 'BRC – ASC roadmap for seafood exporters'), summary: b('Chia sẻ thực tế từ doanh nghiệp đã đạt chứng nhận.', 'Hands-on lessons from certified exporters.'), speakerIds: ['sk3'], room: b('Phòng hội thảo ảo B', 'Virtual seminar room B'), start: at(2, 10), end: at(2, 11, 30), capacity: 120, booked: 120, status: 'PUBLISHED', phaseId: 'ph2', tags: ['Seafood', 'Certification'] },
  { id: 'ss4', kind: 'MATCHMAKING', title: b('Kết nối 1-1: Nhà nhập khẩu Hàn Quốc – thực phẩm Việt', '1-on-1 matchmaking: Korean importers × Vietnamese food'), summary: b('Phiên kết nối theo lịch hẹn 15 phút.', 'Pre-booked 15-minute matchmaking slots.'), speakerIds: ['sk4'], room: b('Phòng kết nối ảo 1', 'Virtual matchmaking room 1'), start: at(3, 14), end: at(3, 16), capacity: 60, booked: 38, status: 'PUBLISHED', phaseId: 'ph2', tags: ['Korea', 'B2B'] },
  { id: 'ss5', kind: 'SEMINAR', title: b('Hợp đồng xuất khẩu & phòng ngừa rủi ro thanh toán', 'Export contracts & payment-risk mitigation'), summary: b('Điều khoản Incoterms, L/C và giải quyết tranh chấp.', 'Incoterms, L/C and dispute resolution.'), speakerIds: ['sk5'], room: b('Phòng hội thảo ảo A', 'Virtual seminar room A'), start: at(7, 9), end: at(7, 10, 30), capacity: 200, booked: 96, status: 'PUBLISHED', phaseId: 'ph3', tags: ['Contract', 'Legal'] },
  { id: 'ss6', kind: 'SEMINAR', title: b('Thiết kế nội thất & xu hướng gỗ bền vững tại Mỹ', 'Furniture design & sustainable wood trends in the US'), summary: b('Phiên bị huỷ do diễn giả không thể tham dự.', 'Cancelled — speaker unavailable.'), speakerIds: [], room: b('Phòng hội thảo ảo B', 'Virtual seminar room B'), start: at(8, 14), end: at(8, 15), capacity: 100, booked: 22, status: 'CANCELED', phaseId: 'ph3', tags: ['Furniture'] },
]
const expoLaunches: ShowLaunch[] = [
  { id: 'ln1', boothId: 'bt-cnx', productId: 'sp-ar', stage: b('Sân khấu ra mắt 1', 'Launch stage 1'), start: at(0, 10), end: at(0, 10, 20), live: false, followers: 186 },
  { id: 'ln2', boothId: 'bt-pq', productId: 'sp-pp', stage: b('Sân khấu ra mắt 1', 'Launch stage 1'), start: at(0, 16), end: at(0, 16, 20), live: false, followers: 94 },
  { id: 'ln3', boothId: 'bt-tea', productId: 'sp-tea2', stage: b('Sân khấu ra mắt 2', 'Launch stage 2'), start: at(1, 11), end: at(1, 11, 20), live: false, followers: 61 },
  { id: 'ln4', boothId: 'bt-mk', productId: 'sp-sh2', stage: b('Sân khấu ra mắt 1', 'Launch stage 1'), start: at(3, 10), end: at(3, 10, 20), live: false, followers: 130 },
  { id: 'ln5', boothId: 'bt-pn', productId: 'sp-dn', stage: b('Sân khấu ra mắt 2', 'Launch stage 2'), start: at(7, 15), end: at(7, 15, 20), live: false, followers: 48 },
]

/* ------------------------------------------------------------ show 2: upcoming import show (paid ticket) */
const euPhases: ShowPhase[] = [
  { id: 'ph1', name: b('Kỳ 1 — Công nghệ xanh & Năng lượng', 'Phase 1 — Green Tech & Energy'), start: dateOnly(28), end: dateOnly(30), theme: b('Pin mặt trời, thiết bị tiết kiệm năng lượng', 'Solar, energy-saving equipment') },
  { id: 'ph2', name: b('Kỳ 2 — Cơ khí chính xác & Điện tử', 'Phase 2 — Precision Engineering & Electronics'), start: dateOnly(31), end: dateOnly(33), theme: b('Gia công kim loại, linh kiện điện tử', 'Metal fabrication, electronic components') },
]
const euPavilions: ShowPavilion[] = [
  { id: 'pv1', name: b('Khu Năng lượng sạch', 'Clean Energy Pavilion'), industry: 'Energy' },
  { id: 'pv2', name: b('Khu Cơ khí & Điện tử', 'Engineering & Electronics Pavilion'), industry: 'Machinery' },
]
const euBooths: ShowBooth[] = [
  {
    id: 'bt-gse', name: b('Gian Năng lượng Nắng Vàng', 'Golden Sun Energy Booth'), org: b('Công ty CP Năng lượng Nắng Vàng', 'Golden Sun Energy JSC'),
    country: 'VN', pavilionId: 'pv1', phaseId: 'ph1', side: 'SELLER', accent: '#ca8a04', cover: IMG.solar, verified: true, businessId: 'b-nangvang',
    tagline: b('Tấm pin 550W đạt IEC, chứng nhận CE', '550W IEC-certified panels with CE'),
    about: b('Cung cấp tấm pin và hệ thống lưu trữ cho dự án áp mái tại châu Âu.', 'Panels and storage for rooftop projects in Europe.'),
    products: [{ id: 'sp-pv', name: b('Tấm pin mono PERC 550W', 'Mono PERC panel 550W'), image: IMG.solar, featured: true, moq: '1 MW', linkId: 'p-solar', blurb: b('Hiệu suất 21,3%, bảo hành 25 năm', '21.3% efficiency, 25-year warranty') }],
  },
  {
    id: 'bt-hp', name: b('Gian Cơ khí Chính xác Hải Phòng', 'Haiphong Precision Engineering Booth'), org: b('Công ty CP Cơ khí Chính xác Hải Phòng', 'Haiphong Precision Engineering JSC'),
    country: 'VN', pavilionId: 'pv2', phaseId: 'ph2', side: 'SELLER', accent: '#334155', cover: IMG.factory, verified: true, businessId: 'b-haiphong',
    tagline: b('Gia công inox, kết cấu thép theo bản vẽ', 'Stainless & steel fabrication to drawing'),
    about: b('Hàn TIG/MIG đạt EN 1090, kiểm tra 3D, xuất đi Đức và Hà Lan.', 'EN 1090 TIG/MIG welding, 3D inspection; exports to Germany and the Netherlands.'),
    products: [{ id: 'sp-ss', name: b('Kết cấu inox gia công', 'Fabricated stainless structure'), image: IMG.welding, featured: true, moq: '5 MT', linkId: 'p-steel', blurb: b('Dung sai ±0,1 mm', '±0.1 mm tolerance') }],
  },
  {
    id: 'bt-sg', name: b('Gian Linh kiện Saigon Tech', 'Saigon Tech Components Booth'), org: b('Công ty TNHH Linh kiện Điện tử Saigon Tech', 'Saigon Tech Components Co., Ltd'),
    country: 'VN', pavilionId: 'pv2', phaseId: 'ph2', side: 'SELLER', accent: '#2563eb', cover: IMG.laptop, verified: true, businessId: 'b-saigontech',
    tagline: b('Tai nghe ANC, đồng hồ thông minh OEM', 'ANC headphones & smartwatch OEM'),
    about: b('Nhà máy SMT, hỗ trợ chứng nhận CE/RoHS cho thị trường EU.', 'SMT factory with CE/RoHS support for the EU market.'),
    products: [{ id: 'sp-hp', name: b('Tai nghe chống ồn ANC', 'ANC headphones'), image: IMG.headphones, featured: true, moq: '1.000 pcs', linkId: 'p-headphone', blurb: b('Bluetooth 5.3, 40 giờ pin', 'Bluetooth 5.3, 40 h battery') }],
  },
]
const euSpeakers: ShowSpeaker[] = [
  { id: 'sk1', name: 'Anna Keller', title: b('Chuyên gia chính sách thương mại EU', 'EU Trade Policy Expert'), org: b('GIZ Vietnam', 'GIZ Vietnam'), country: 'DE', accent: '#006699', bio: b('Tư vấn doanh nghiệp Việt tuân thủ CBAM và CSDDD.', 'Advises Vietnamese firms on CBAM and CSDDD compliance.') },
  { id: 'sk2', name: 'Phạm Quốc Bảo', title: b('Giám đốc điều hành', 'CEO'), org: b('Nắng Vàng Energy', 'Golden Sun Energy'), country: 'VN', accent: '#ca8a04', bio: b('Triển khai hơn 180 MW điện mặt trời.', 'Delivered 180+ MW of solar projects.') },
]
const euSessions: ShowSession[] = [
  { id: 'ss1', kind: 'SEMINAR', title: b('CBAM 2027: Doanh nghiệp cơ khí cần chuẩn bị gì', 'CBAM 2027: what engineering firms must prepare'), summary: b('Lộ trình báo cáo phát thải và chi phí dự kiến.', 'Emission-reporting roadmap and expected costs.'), speakerIds: ['sk1'], room: b('Sân khấu ảo chính', 'Main virtual stage'), start: at(28, 9), end: at(28, 10, 30), capacity: 250, booked: 131, status: 'PUBLISHED', phaseId: 'ph1', tags: ['CBAM', 'EU'] },
  { id: 'ss2', kind: 'LAUNCH', title: b('Ra mắt tấm pin thế hệ mới 600W', 'Launch: next-gen 600W panel'), summary: b('Sản phẩm mới của Nắng Vàng Energy.', 'New product from Golden Sun Energy.'), speakerIds: ['sk2'], room: b('Sân khấu ra mắt 1', 'Launch stage 1'), start: at(29, 15), end: at(29, 15, 30), capacity: 250, booked: 77, status: 'PUBLISHED', phaseId: 'ph1', tags: ['Solar'] },
]
const euLaunches: ShowLaunch[] = [
  { id: 'ln1', boothId: 'bt-gse', productId: 'sp-pv', stage: b('Sân khấu ra mắt 1', 'Launch stage 1'), start: at(29, 15), end: at(29, 15, 20), live: false, followers: 52 },
]

/* ------------------------------------------------------------ show 3: ended (replay) */
const pastPhases: ShowPhase[] = [{ id: 'ph1', name: b('Toàn chương trình', 'Full programme'), start: dateOnly(-40), end: dateOnly(-37), theme: b('Hàng tiêu dùng & dệt may', 'Consumer goods & textiles') }]
const pastPavilions: ShowPavilion[] = [{ id: 'pv1', name: b('Khu Dệt may & Thời trang', 'Textile & Fashion Pavilion'), industry: 'Textiles' }]
const pastBooths: ShowBooth[] = [expoBooths[4]].map((x) => ({ ...x, id: 'bt-sh-p', phaseId: 'ph1', pavilionId: 'pv1' }))
const pastSpeakers: ShowSpeaker[] = [expoSpeakers[3]]
const pastSessions: ShowSession[] = [
  { id: 'ss1', kind: 'SEMINAR', title: b('Xu hướng thời trang bền vững tại Hàn Quốc', 'Sustainable fashion trends in Korea'), summary: b('Phiên đã kết thúc, có bản ghi để xem lại.', 'Ended — recording available.'), speakerIds: ['sk4'], room: b('Sân khấu ảo chính', 'Main virtual stage'), start: at(-40, 10), end: at(-40, 11, 30), capacity: 300, booked: 287, status: 'ENDED', hasReplay: true, phaseId: 'ph1', tags: ['Fashion'] },
]

/* ------------------------------------------------------------ shows */
export const shows: Show[] = [
  {
    id: 'sh-agri-2026', cover: IMG.videoCall, status: 'ONGOING', direction: 'EXPORT', exhibitorScope: 'DOMESTIC',
    title: b('Vietnam Online Export Expo 2026 — Nông sản & Thực phẩm', 'Vietnam Online Export Expo 2026 — Agri & Food'),
    tagline: b('9 ngày, hơn 100 doanh nghiệp kết nối nhà xuất khẩu Việt với người mua toàn cầu', '9 days, 100+ businesses connecting Vietnamese exporters with global buyers'),
    introduction: b('Hội chợ trực tuyến do VCCI tổ chức: xem sản phẩm, xem ra mắt sản phẩm trực tiếp trên sân khấu ảo, dự hội thảo và đặt lịch kết nối 1-1. Toàn bộ chương trình diễn ra trực tuyến — không cần di chuyển.', 'An online fair by VCCI: browse products, watch live product launches on virtual stages, join seminars and book 1-on-1 meetings. Fully online — no travel needed.'),
    targetMarkets: ['DE', 'KR', 'JP', 'US', 'NL'], industries: ['Coffee', 'Seafood', 'Spices', 'Furniture', 'Textiles'],
    startDate: dateOnly(-3), endDate: dateOnly(9), organizer: b('VCCI — Trung tâm Xúc tiến Thương mại', 'VCCI — Trade Promotion Center'),
    virtualVenue: b('Không gian ảo VCCI Trade Hub (portal)', 'VCCI Trade Hub virtual space (portal)'),
    boothCapacity: 120, visitorTicketFee: 0, ticketCurrency: 'VND', requireVisitorApproval: false, boothFee: 3500000, registrationDeadline: dateOnly(8),
    issuedBadges: 2184, inquiries: 436, phases: expoPhases, pavilions: expoPavilions, booths: expoBooths, launches: expoLaunches,
    speakers: expoSpeakers, sessions: expoSessions, contact: { name: 'Ban tổ chức Show Hub', email: 'showhub@vcci.example.vn', phone: '024 3577 0632' },
    rules: [
      b('Mỗi người một xác nhận tham gia cho mỗi show (một email – một đăng ký).', 'One confirmation per person per show (one email – one registration).'),
      b('Xác nhận được gửi qua email và hiển thị trên màn hình; dùng mã tham gia để vào phiên trực tiếp.', 'The confirmation is emailed and shown on screen; use the participation code to enter live sessions.'),
      b('Hỏi giá ở trang sản phẩm; doanh nghiệp phản hồi trong tối đa 2 ngày làm việc.', 'Ask for quotes on the product page; businesses reply within 2 business days.'),
      b('Hết chỗ phiên sẽ vào hàng chờ và tự lên khi có người huỷ.', 'Full sessions open a waitlist; you are promoted automatically on a cancellation.'),
      b('Người đã đăng ký nhưng không tham gia đến khi show kết thúc được ghi nhận vắng mặt.', 'Registrants who never join by the end are recorded as absent.'),
    ],
  },
  {
    id: 'sh-eu-green-2026', cover: IMG.remoteCall, status: 'UPCOMING', direction: 'IMPORT', exhibitorScope: 'DOMESTIC',
    title: b('EU Green Supply Show 2026 — Công nghệ xanh & Cơ khí', 'EU Green Supply Show 2026 — Green Tech & Engineering'),
    tagline: b('Nhà cung ứng Việt Nam cho chuỗi cung ứng xanh của châu Âu', 'Vietnamese suppliers for Europe’s green supply chains'),
    introduction: b('Show dành cho nhà nhập khẩu và nhà phân phối châu Âu tìm nguồn cung năng lượng sạch, cơ khí chính xác, điện tử. Tham gia có phí; BTC duyệt trước khi xác nhận tham gia.', 'A show for European importers and distributors sourcing clean energy, precision engineering and electronics. Participation is paid; organisers approve registrations before confirming.'),
    targetMarkets: ['DE', 'NL', 'FR', 'SE'], industries: ['Solar', 'Machinery', 'Electronics'],
    startDate: dateOnly(28), endDate: dateOnly(33), organizer: b('VCCI & GIZ', 'VCCI & GIZ'),
    virtualVenue: b('Không gian ảo VCCI Trade Hub (portal)', 'VCCI Trade Hub virtual space (portal)'),
    boothCapacity: 40, visitorTicketFee: 250000, ticketCurrency: 'VND', requireVisitorApproval: true, boothFee: 5000000, registrationDeadline: dateOnly(25),
    issuedBadges: 318, inquiries: 41, phases: euPhases, pavilions: euPavilions, booths: euBooths, launches: euLaunches,
    speakers: euSpeakers, sessions: euSessions, contact: { name: 'Ban tổ chức Show Hub', email: 'showhub@vcci.example.vn', phone: '024 3577 0632' },
    rules: [
      b('Tham gia có phí: chuyển khoản, tải biên lai; kế toán xác nhận xong mới xác nhận tham gia.', 'Paid participation: pay by bank transfer and upload the receipt; accounting confirms before you are confirmed.'),
      b('Show yêu cầu duyệt người đăng ký: người duyệt quyết định sau khi xác thực email.', 'This show requires approval after email verification.'),
      b('Mã OTP hết hạn sau 5 phút; sai 5 lần sẽ bị khoá tạm thời.', 'OTP expires after 5 minutes; 5 wrong attempts lock the form temporarily.'),
    ],
  },
  {
    id: 'sh-textile-2026', cover: IMG.cheerLaptop, status: 'ENDED', direction: 'EXPORT', exhibitorScope: 'DOMESTIC',
    title: b('Vietnam Textile & Fashion Online Week 2026', 'Vietnam Textile & Fashion Online Week 2026'),
    tagline: b('Tuần lễ dệt may trực tuyến — xem lại các phiên hội thảo', 'Online textile week — watch session replays'),
    introduction: b('Show đã kết thúc. Bạn vẫn có thể xem sản phẩm và các phiên có bản ghi.', 'This show has ended. Products and recorded sessions remain available.'),
    targetMarkets: ['KR', 'JP', 'US'], industries: ['Textiles', 'Fashion'],
    startDate: dateOnly(-40), endDate: dateOnly(-37), organizer: b('VCCI & VITAS', 'VCCI & VITAS'),
    virtualVenue: b('Không gian ảo VCCI Trade Hub (portal)', 'VCCI Trade Hub virtual space (portal)'),
    boothCapacity: 30, visitorTicketFee: 0, ticketCurrency: 'VND', requireVisitorApproval: false, boothFee: 0, registrationDeadline: dateOnly(-42),
    issuedBadges: 903, inquiries: 128, phases: pastPhases, pavilions: pastPavilions, booths: pastBooths, launches: [],
    speakers: pastSpeakers, sessions: pastSessions, contact: { name: 'Ban tổ chức Show Hub', email: 'showhub@vcci.example.vn', phone: '024 3577 0632' },
    rules: [b('Đã đóng đăng ký tham gia. Có thể xem lại các phiên có bản ghi.', 'Registration is closed. Recorded sessions can be replayed.')],
  },
]

export function getShow(id: string) {
  return shows.find((s) => s.id === id) ?? null
}

/** The API's label when it sent one. Otherwise (mock data, older BE) the priority of BR-SHB-11: LIVE > CANCELED > REPLAY/ENDED > FULL > REG_OPEN > UPCOMING. */
export function showLabel(show: Show): ShowLabel {
  if (show.displayLabel) return show.displayLabel
  if (show.status === 'CANCELED') return 'CANCELED'
  if (show.sessions.some((s) => s.status === 'LIVE')) return 'LIVE'
  if (show.status === 'ENDED') return show.sessions.some((s) => s.hasReplay) ? 'REPLAY' : 'ENDED'
  if (show.booths.length >= show.boothCapacity && show.boothCapacity > 0 && show.status === 'UPCOMING') return 'FULL'
  if (show.status === 'ONGOING' || new Date(show.registrationDeadline) >= new Date(new Date().toDateString())) return 'REG_OPEN'
  return 'UPCOMING'
}

export const SELLER_BUYER_TYPES = ['MANUFACTURER', 'TRADER', 'DISTRIBUTOR', 'RETAIL_ECOMMERCE', 'INVESTOR', 'OTHER'] as const
export const VISITOR_TYPES = ['BUYER', 'INVESTOR', 'DISTRIBUTOR', 'PARTNER', 'OBSERVER'] as const
