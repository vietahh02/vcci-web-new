/**
 * Post-event recap content (CR-2026-002 EV-12), modelled on the Global Sources "show highlights" pages:
 * headline numbers, highlight video, takeaways, photo gallery, participating companies, testimonials, next edition.
 * Sample figures — a real backend would fill these from attendance data after the event.
 */
import { IMG, type EventItem } from '@/data/mock'
import type { Bilingual } from '@/lib/i18n'

const b = (vi: string, en: string): Bilingual => ({ vi, en })

/** A product in a post-event ranking: public counts only, never who. */
export interface RecapProduct { id: string; name: Bilingual; image: string; org: string; count: number }
export interface RecapStat { label: Bilingual; value: number; suffix?: string }
export interface Recap {
  stats: RecapStat[]
  takeaways: Bilingual[]
  gallery: string[]
  video: { title: Bilingual; duration: string; url?: string }
  participants: { name: string; country: string }[]
  testimonials: { quote: Bilingual; name: string; org: string }[]
  next?: { title: Bilingual; inDays: number }
  /** Live mode: most favourited products (system-wide count, up to 8). */
  favoriteProducts?: RecapProduct[]
  /** Live mode: banner uploaded for the post-event page. */
  banner?: string
  /** Live mode: average of the approved, public ratings. */
  rating?: { average: number; count: number }
}

const people = [
  { name: 'Mekong Pearl Seafood', country: 'VN' }, { name: 'Highland Green Coffee', country: 'VN' }, { name: 'Southwood Furniture', country: 'VN' },
  { name: 'Bat Trang Heritage', country: 'VN' }, { name: 'Seoul Fresh Mart', country: 'KR' }, { name: 'Nordhafen Trading', country: 'DE' },
  { name: 'Tokyo Marine Foods', country: 'JP' }, { name: 'Manila Central Distribution', country: 'PH' }, { name: 'Red River Textile', country: 'VN' },
]

const quotes = [
  { quote: b('Nội dung sát thực tế, tôi có ngay hai đầu mối để trao đổi sau buổi này.', 'Very practical — I left with two concrete contacts to follow up.'), name: 'Nguyễn Hoàng Long', org: 'Giám đốc xuất khẩu / Export Director' },
  { quote: b('Có bản ghi và tài liệu nên đồng nghiệp không dự được vẫn xem lại đủ.', 'The recording and slides let colleagues who missed it catch up.'), name: 'Trần Thu Hà', org: 'Trưởng phòng kinh doanh / Sales Manager' },
]

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)
const gallery = [IMG.videoCall, IMG.onlineLaptop, IMG.cheerLaptop, IMG.dealLaptop, IMG.workLaptop, IMG.remoteCall, IMG.webcamChat]

/** Deterministic sample recap per event so figures stay stable between renders. */
export function getRecap(ev: EventItem): Recap {
  const h = Math.abs(hash(ev.id))
  const attended = Math.max(20, Math.round(ev.registeredSlots * (0.74 + (h % 15) / 100)))
  const countries = 6 + (h % 14)
  const stats: RecapStat[] = [
    { label: b('Người tham dự', 'Attendees'), value: attended },
    { label: b('Quốc gia / vùng lãnh thổ', 'Countries / regions'), value: countries },
    { label: b('Phiên chương trình', 'Sessions'), value: Math.max(1, ev.agendaOptions.length) },
    ev.eventType === 'LIVESTREAM' || ev.eventType === 'MATCHMAKING' || ev.eventType === 'SHOW'
      ? { label: b('Lượt kết nối B2B', 'B2B meetings'), value: 120 + (h % 480) }
      : { label: b('Lượt xem lại', 'Replay views'), value: 90 + (h % 900) },
    { label: b('Mức hài lòng', 'Satisfaction'), value: 88 + (h % 10), suffix: '%' },
  ]
  return {
    stats,
    takeaways: ev.topics?.length ? ev.topics : [
      b('Cập nhật yêu cầu thị trường và tiêu chuẩn mới nhất', 'Latest market requirements and standards'),
      b('Kinh nghiệm thực tế từ doanh nghiệp đã xuất khẩu thành công', 'Practical lessons from companies that already export'),
      b('Gợi ý bước tiếp theo và đầu mối hỗ trợ của VCCI', 'Next steps and VCCI support contacts'),
    ],
    gallery: [...gallery.slice(h % 3), ...gallery].slice(0, 5),
    video: { title: b('Điểm nhấn sự kiện', 'Event highlights'), duration: `${2 + (h % 4)}:${String(10 + (h % 45)).padStart(2, '0')}` },
    participants: people.slice(h % 3, (h % 3) + 6),
    testimonials: quotes,
    next: { title: b('Kỳ tiếp theo — đăng ký sớm để nhận thông báo', 'Next edition — pre-register to be notified'), inDays: 60 + (h % 60) },
  }
}
