/** Per-type defaults for the prepare / after-event panels (CR-2026-002 EV-09, EV-12). Real data would come from the organizer. */
import type { EventItem, EventType } from '@/data/mock'
import type { Bilingual } from '@/lib/i18n'

const b = (vi: string, en: string): Bilingual => ({ vi, en })

export interface PrepTask { id: string; title: Bilingual; hint?: Bilingual; /** days before start */ due: number }
export interface Faq { q: Bilingual; a: Bilingual }
export interface Material { id: string; kind: 'RECORDING' | 'SLIDES' | 'REPORT' | 'PHOTOS'; title: Bilingual; meta: string; url?: string }

const commonFaq: Faq[] = [
  { q: b('Tôi có thể đổi người tham dự không?', 'Can I change the attendee?'), a: b('Được, trước hạn đăng ký. Nhắn Ban Tổ chức ở mục "Trao đổi với Ban Tổ chức".', 'Yes, before the registration deadline. Message the organizers below.') },
  { q: b('Tôi vào xem trực tiếp bằng cách nào?', 'How do I join the live session?'), a: b('Nút "Xem trực tiếp" xuất hiện trên trang sự kiện khi bạn đã được duyệt; hệ thống nhắc qua email 1 giờ trước giờ bắt đầu.', 'The "Watch live" button appears on the event page once you are approved; we email a reminder 1 hour before start.') },
  { q: b('Tôi muốn huỷ đăng ký?', 'I want to cancel.'), a: b('Huỷ ở mục "Đăng ký của tôi" hoặc nhắn Ban Tổ chức để giải phóng chỗ cho người khác.', 'Cancel under "My registrations" or tell the organizers so the seat can be released.') },
]

const tasks: Record<EventType, PrepTask[]> = {
  WEBINAR: [
    { id: 'room', title: b('Thử kết nối mạng và âm thanh trên trình duyệt (xem trực tiếp ngay trên hệ thống, không cần cài thêm)', 'Test your connection and audio in the browser (watch live on the platform — nothing to install)'), due: 1 },
    { id: 'q', title: b('Gửi câu hỏi cho diễn giả', 'Send your question to the speakers'), hint: b('Câu hỏi được tổng hợp và trả lời trong phần hỏi đáp.', 'Questions are grouped and answered in the Q&A.'), due: 1 },
    { id: 'calendar', title: b('Thêm vào lịch cá nhân', 'Add to your calendar'), due: 3 },
  ],
  LIVESTREAM: [
    { id: 'calendar', title: b('Thêm vào lịch cá nhân', 'Add to your calendar'), due: 3 },
    { id: 'list', title: b('Chọn doanh nghiệp muốn theo dõi', 'Pick exhibitors to follow'), due: 1 },
  ],
  MATCHMAKING: [
    { id: 'profile', title: b('Hoàn thiện hồ sơ doanh nghiệp (≥ 80%)', 'Complete your company profile (≥ 80%)'), hint: b('Hồ sơ đầy đủ giúp Ban Tổ chức ghép đối tác đúng hơn.', 'A complete profile helps organizers match you better.'), due: 14 },
    { id: 'docs', title: b('Chuẩn bị Company Profile và Catalogue tiếng Anh', 'Prepare an English company profile and catalogue'), due: 10 },
    { id: 'certs', title: b('Tải lên chứng nhận chất lượng, môi trường (đặc biệt thị trường EU)', 'Upload quality and environmental certificates (esp. EU)'), due: 10 },
    { id: 'quote', title: b('Chuẩn bị báo giá xuất khẩu và MOQ', 'Prepare export price list and MOQ'), due: 7 },
    { id: 'slots', title: b('Chọn khung giờ gặp 1-1 phù hợp', 'Choose your 1-on-1 meeting slots'), due: 3 },
  ],
  SHOW: [
    { id: 'badge', title: b('Nhận xác nhận tham gia', 'Get your confirmation'), due: 3 },
    { id: 'plan', title: b('Chọn phiên và sản phẩm muốn xem', 'Pick sessions and products to see'), due: 1 },
  ],
  CONFERENCE: [
    { id: 'id', title: b('Mang CCCD/hộ chiếu để đối chiếu khi đón khách', 'Bring ID for check-in'), due: 1 },
    { id: 'route', title: b('Xem địa điểm và lộ trình', 'Check venue and route'), due: 2 },
    { id: 'q', title: b('Gửi câu hỏi cho Ban Tổ chức', 'Send questions to organizers'), due: 2 },
  ],
  TRADE_MISSION: [
    { id: 'passport', title: b('Hộ chiếu còn hạn ≥ 6 tháng và visa (nếu đi nước ngoài)', 'Passport valid ≥ 6 months and visa (if overseas)'), due: 21 },
    { id: 'samples', title: b('Chuẩn bị mẫu hàng, catalogue và danh thiếp', 'Prepare samples, catalogue and business cards'), due: 7 },
    { id: 'needs', title: b('Khai nhu cầu gặp gỡ để Ban Tổ chức sắp xếp B2B', 'Declare meeting needs for B2B arrangement'), due: 7 },
    { id: 'insurance', title: b('Mua bảo hiểm du lịch', 'Buy travel insurance'), due: 5 },
  ],
  TRAINING: [
    { id: 'pay', title: b('Hoàn tất học phí', 'Complete tuition payment'), due: 7 },
    { id: 'bio', title: b('Gửi tiểu sử và mục tiêu học tập', 'Send your bio and learning goals'), due: 5 },
  ],
  SUPPORT_1TO1: [
    { id: 'book', title: b('Chọn lịch hẹn tư vấn', 'Book a consultation slot'), due: 0 },
    { id: 'prep', title: b('Chuẩn bị sơ đồ hệ thống và câu hỏi', 'Prepare a system overview and questions'), due: 0 },
  ],
}

export const prepTasks = (ev: EventItem): PrepTask[] => tasks[ev.eventType] ?? []
export const faqs = (): Faq[] => commonFaq

export function materials(ev: EventItem): Material[] {
  if (ev.eventStatus !== 'ENDED') return []
  const recorded = ev.eventType === 'WEBINAR' || ev.eventType === 'LIVESTREAM' || ev.eventType === 'SHOW' || ev.eventType === 'CONFERENCE'
  return [
    ...(recorded ? [{ id: 'rec', kind: 'RECORDING' as const, title: b('Bản ghi toàn bộ phiên', 'Full session recording'), meta: '1h 52m · MP4' }] : []),
    { id: 'slides', kind: 'SLIDES', title: b('Bài trình bày của diễn giả', 'Speaker slides'), meta: 'PDF · 4.2 MB' },
    { id: 'report', kind: 'REPORT', title: b('Báo cáo tổng kết sự kiện', 'Event summary report'), meta: 'PDF · 1.1 MB' },
    { id: 'photos', kind: 'PHOTOS', title: b('Hình ảnh sự kiện', 'Event photos'), meta: '48 ảnh / photos' },
  ]
}
