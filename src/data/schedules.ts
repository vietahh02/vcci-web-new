/**
 * Trade-fair structure (phases → days → 10-minute product-launch slots), modelled on the
 * Global Sources "New Product Launch" schedule. Real BE: event_phase + event_schedule_slot
 * (slot → organizationId, productId, booth). Companies here are fictional.
 */
import type { Bilingual } from '@/lib/i18n'

const day = (offset: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export interface EventPhase {
  id: string
  name: Bilingual
  theme: Bilingual
  dates: string[]
  venue: Bilingual
  categories: Bilingual[]
}

export interface ScheduleSlot {
  phaseId: string
  date: string
  start: string
  end: string
  company: Bilingual
  businessId?: string
  product: Bilingual
  booth: string
}

export interface EventProgramme {
  phases: EventPhase[]
  schedule: ScheduleSlot[]
  launchZone: Bilingual
}

const b = (vi: string, en: string, ko: string): Bilingual => ({ vi, en, ko })

const P1 = [day(12), day(13)]
const P2 = [day(14)]

const slot = (phaseId: string, date: string, start: string, end: string, company: Bilingual, product: Bilingual, booth: string, businessId?: string): ScheduleSlot =>
  ({ phaseId, date, start, end, company, product, booth, businessId })

const SOUTHWOOD = b('Công ty CP Nội thất Gỗ Phương Nam', 'Southwood Furniture JSC', '사우스우드 가구')
const BATTRANG = b('Công ty Gốm sứ Bát Tràng Heritage', 'Bat Trang Heritage Ceramics', '밧짱 헤리티지 도자기')
const SONGHONG = b('Tổng công ty Dệt may Sông Hồng Việt', 'Red River Viet Textile Corp.', '레드리버 비엣 섬유')
const LAMSON = b('Công ty TNHH Nội thất Lam Sơn', 'Lam Son Interiors Co., Ltd', '람선 인테리어')
const TANPHUOC = b('Công ty CP Đồ gỗ Tân Phước', 'Tan Phuoc Woodcraft JSC', '떤프억 목공예')
const PHUVINH = b('Công ty TNHH Mây tre Phú Vinh Craft', 'Phu Vinh Rattan Craft Co., Ltd', '푸빈 라탄 공예')
const HATHAI = b('Xưởng Sơn mài Hạ Thái Art', 'Ha Thai Lacquer Art Studio', '하타이 옻칠 아트')
const MEKONGHOME = b('Công ty TNHH Mekong Home Living', 'Mekong Home Living Co., Ltd', '메콩 홈 리빙')
const SAIGONLIGHT = b('Công ty CP Đèn trang trí Sài Gòn Lumi', 'Saigon Lumi Lighting JSC', '사이공 루미 조명')

export const programmes: Record<string, EventProgramme> = {
  'e-furniture': {
    launchZone: b('Khu ra mắt sản phẩm mới – Sảnh A, Trung tâm Hội chợ Bình Dương & livestream', 'New Product Launch Zone – Hall A, Binh Duong Expo Centre & livestream', '신제품 런칭존 – A홀, 빈즈엉 전시센터 & 라이브 방송'),
    phases: [
      {
        id: 'p1', name: b('Phase 1', 'Phase 1', '1차'), dates: P1,
        theme: b('Nội thất phòng khách & ngoài trời', 'Living room & outdoor furniture', '거실 & 아웃도어 가구'),
        venue: b('Sảnh A – Trung tâm Hội chợ Bình Dương', 'Hall A – Binh Duong Expo Centre', 'A홀 – 빈즈엉 전시센터'),
        categories: [b('Sofa & ghế', 'Sofas & chairs', '소파 & 의자'), b('Bàn ăn', 'Dining sets', '식탁 세트'), b('Nội thất ngoài trời', 'Outdoor furniture', '아웃도어 가구'), b('Mây tre đan', 'Rattan & bamboo', '라탄 & 대나무')],
      },
      {
        id: 'p2', name: b('Phase 2', 'Phase 2', '2차'), dates: P2,
        theme: b('Nội thất khách sạn, trang trí & quà tặng', 'Hospitality, décor & gifts', '호텔 가구, 인테리어 소품 & 선물'),
        venue: b('Sảnh B – Trung tâm Hội chợ Bình Dương', 'Hall B – Binh Duong Expo Centre', 'B홀 – 빈즈엉 전시센터'),
        categories: [b('Nội thất khách sạn', 'Hospitality furniture', '호텔 가구'), b('Gốm sứ', 'Ceramics', '도자기'), b('Đèn trang trí', 'Lighting', '조명'), b('Sơn mài', 'Lacquerware', '옻칠 공예')],
      },
    ],
    schedule: [
      // Phase 1 · day 1
      slot('p1', P1[0]!, '14:00', '14:10', SOUTHWOOD, b('Sofa 3 chỗ khung sồi FSC bọc nhung', 'FSC oak-frame 3-seat velvet sofa', 'FSC 오크 프레임 3인용 벨벳 소파'), 'A-12', 'b-phuongnam'),
      slot('p1', P1[0]!, '14:10', '14:20', PHUVINH, b('Ghế thư giãn mây tự nhiên dệt tay', 'Hand-woven natural rattan lounge chair', '수공예 천연 라탄 라운지 체어'), 'A-27'),
      slot('p1', P1[0]!, '14:20', '14:30', TANPHUOC, b('Bàn ăn gỗ keo mở rộng 8 chỗ', 'Extendable 8-seat acacia dining table', '확장형 8인용 아카시아 식탁'), 'A-05'),
      slot('p1', P1[0]!, '14:30', '14:40', LAMSON, b('Bộ sofa module bọc vải chống bám bẩn', 'Modular sofa with stain-resistant fabric', '방오 원단 모듈형 소파'), 'A-33'),
      slot('p1', P1[0]!, '14:40', '14:50', MEKONGHOME, b('Bộ bàn ghế ngoài trời nhôm – gỗ teak', 'Aluminium & teak outdoor dining set', '알루미늄 & 티크 아웃도어 다이닝 세트'), 'A-41'),
      slot('p1', P1[0]!, '14:50', '15:00', SONGHONG, b('Đệm & gối ngoài trời vải tái chế chống UV', 'UV-proof recycled outdoor cushions', 'UV 차단 재활용 원단 아웃도어 쿠션'), 'A-18', 'b-songhong'),
      // Phase 1 · day 2
      slot('p1', P1[1]!, '14:00', '14:10', MEKONGHOME, b('Ghế băng ngoài trời gỗ tràm chịu nước', 'Water-resistant eucalyptus garden bench', '내수성 유칼립투스 정원 벤치'), 'A-41'),
      slot('p1', P1[1]!, '14:10', '14:20', SOUTHWOOD, b('Bộ bàn ăn gỗ keo phong cách Bắc Âu', 'Scandinavian acacia dining set for 6', '북유럽 스타일 아카시아 6인 식탁 세트'), 'A-12', 'b-phuongnam'),
      slot('p1', P1[1]!, '14:20', '14:30', PHUVINH, b('Đèn thả mây tre đan thủ công', 'Hand-woven bamboo pendant lamp', '수공예 대나무 펜던트 조명'), 'A-27'),
      slot('p1', P1[1]!, '14:30', '14:40', TANPHUOC, b('Kệ TV gỗ óc chó lắp ghép nhanh', 'Quick-assembly walnut TV console', '간편 조립 월넛 TV 콘솔'), 'A-05'),
      slot('p1', P1[1]!, '14:40', '14:50', LAMSON, b('Ghế bành xoay bọc da thuộc thực vật', 'Swivel armchair in vegetable-tanned leather', '식물성 무두질 가죽 회전 암체어'), 'A-33'),
      slot('p1', P1[1]!, '14:50', '15:00', SONGHONG, b('Rèm vải lanh hữu cơ cản sáng', 'Organic linen blackout curtains', '유기농 린넨 암막 커튼'), 'A-18', 'b-songhong'),
      slot('p1', P1[1]!, '15:00', '15:10', MEKONGHOME, b('Dù che nắng lệch tâm khung nhôm', 'Aluminium cantilever parasol', '알루미늄 캔틸레버 파라솔'), 'A-41'),
      // Phase 2 · day 3
      slot('p2', P2[0]!, '14:00', '14:10', BATTRANG, b('Bộ bình gốm men rạn thủ công', 'Handmade crackle-glaze vase set', '수제 크랙 유약 화병 세트'), 'B-08', 'b-battrang'),
      slot('p2', P2[0]!, '14:10', '14:20', SAIGONLIGHT, b('Đèn bàn đá cẩm thạch cảm ứng', 'Touch-dimmable marble table lamp', '터치 디밍 대리석 테이블 램프'), 'B-21'),
      slot('p2', P2[0]!, '14:20', '14:30', HATHAI, b('Tranh sơn mài khảm trứng khổ lớn', 'Large eggshell-inlay lacquer panel', '대형 계란껍질 상감 옻칠 패널'), 'B-15'),
      slot('p2', P2[0]!, '14:30', '14:40', LAMSON, b('Giường khách sạn khung gỗ chống ồn', 'Noise-free hotel bed frame', '무소음 호텔 침대 프레임'), 'B-02'),
      slot('p2', P2[0]!, '14:40', '14:50', BATTRANG, b('Bộ đồ ăn gốm men lam cho nhà hàng', 'Cobalt-glaze tableware for restaurants', '레스토랑용 코발트 유약 식기 세트'), 'B-08', 'b-battrang'),
      slot('p2', P2[0]!, '14:50', '15:00', SAIGONLIGHT, b('Đèn chùm đồng thủ công cho sảnh khách sạn', 'Handcrafted brass lobby chandelier', '호텔 로비용 수공예 황동 샹들리에'), 'B-21'),
    ],
  },
}

export const getProgramme = (eventId: string): EventProgramme | null => programmes[eventId] ?? null
