import dictionary from './dataTranslations.json'
import { currentLang } from '@/lib/i18n'

/**
 * Giá trị dữ liệu "thô" do doanh nghiệp/hệ thống nhập bằng tiếng Việt và KHÔNG có bảng dịch ở backend
 * (đơn vị tính, tỉnh/thành, chức danh, quy mô nhân sự, số liệu năng lực, tên sản phẩm chủ lực, chú thích ảnh…).
 * Khoá = chuỗi tiếng Việt, mọi con số được thay bằng {n}; giá trị = bản en/ko. Chuỗi không có trong bảng giữ nguyên.
 */
type Entry = { en?: string; ko?: string }
const DICT = dictionary as Record<string, Entry>
const NUM = /\d[\d.,]*/g

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()

/** "địa chỉ, tỉnh" — bỏ phần tỉnh khi địa chỉ (đã dịch) đã chứa tên tỉnh, tránh lặp "…, Hưng Yên, Hưng Yên". */
export function joinAddress(address: string, province: string): string {
  if (!province) return address
  if (!address) return province
  return fold(address).includes(fold(province)) ? address : `${address}, ${province}`
}

/** Dịch một giá trị dữ liệu thô theo ngôn ngữ đang chọn (tiếng Việt hoặc không có bản dịch: trả nguyên văn). */
export function dt(value: string | null | undefined): string {
  if (!value) return value ?? ''
  const lang = currentLang()
  if (lang !== 'en' && lang !== 'ko') return value
  const nums = value.match(NUM) ?? []
  const hit = DICT[value.trim().replace(NUM, '{n}')]?.[lang]
  if (!hit) return value
  let i = 0
  return hit.replace(/\{n\}/g, () => nums[i++] ?? '')
}
