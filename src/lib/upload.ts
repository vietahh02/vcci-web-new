/**
 * Upload rules shown to businesses next to every upload control, plus client-side checks.
 * The same limits must be enforced by the storage API (vcci-storage presigned upload).
 */
import type { Bilingual } from '@/lib/i18n'
import { tx } from '@/lib/tx'

export type RuleKey = 'legal' | 'certificate' | 'finance' | 'evidence' | 'logo' | 'cover' | 'gallery' | 'brochure'

export interface UploadRule {
  key: RuleKey
  label: Bilingual
  accept: string
  exts: string[]
  maxMB: number
  /** Minimum pixel size on the long / short side for images. */
  image?: { minLong: number; minShort?: number; ratio?: string }
  tips: Bilingual[]
}

const b = (vi: string, en: string, ko: string): Bilingual => ({ vi, en, ko })

export const RULES: Record<RuleKey, UploadRule> = {
  legal: {
    key: 'legal', label: b('Giấy tờ pháp lý', 'Legal documents', '법인 서류'),
    accept: '.pdf,.jpg,.jpeg,.png', exts: ['pdf', 'jpg', 'jpeg', 'png'], maxMB: 10,
    tips: [
      b('Bản scan màu hoặc ảnh chụp rõ nét, đủ 4 góc, đủ tất cả các trang', 'Clear colour scan or photo, all four corners and every page', '모든 페이지가 포함된 선명한 컬러 스캔 또는 사진'),
      b('Còn hiệu lực, có dấu đỏ; không chỉnh sửa, không che thông tin', 'Valid, with red seal; not edited or redacted', '유효하며 직인이 있고 수정·가림 없음'),
      b('Nhiều trang thì gộp thành 1 file PDF', 'Merge multi-page documents into one PDF', '여러 페이지는 PDF 한 파일로 병합'),
    ],
  },
  certificate: {
    key: 'certificate', label: b('Chứng nhận', 'Certificates', '인증서'),
    accept: '.pdf,.jpg,.jpeg,.png', exts: ['pdf', 'jpg', 'jpeg', 'png'], maxMB: 10,
    tips: [
      b('Ảnh JPG/PNG sẽ được hiển thị xem trước trên hồ sơ công khai', 'JPG/PNG files are shown as previews on your public profile', 'JPG/PNG는 공개 프로필에 미리보기로 표시됩니다'),
      b('Ghi đúng đơn vị cấp và ngày hết hạn; chứng nhận hết hạn tự ẩn', 'Enter issuer and expiry; expired certificates are hidden', '발급 기관과 만료일 입력, 만료 시 자동 숨김'),
    ],
  },
  finance: {
    key: 'finance', label: b('Chứng từ doanh thu', 'Revenue evidence', '매출 증빙'),
    accept: '.pdf', exts: ['pdf'], maxMB: 20,
    tips: [
      b('Chỉ nhận PDF: BCTC có chữ ký số / xác nhận eTax, hoặc báo cáo kiểm toán', 'PDF only: digitally signed / eTax-confirmed statements or audit report', 'PDF만 가능: 전자서명/eTax 확인 재무제표 또는 감사보고서'),
      b('Chỉ VCCI xem; không hiển thị công khai', 'Visible to VCCI only, never public', 'VCCI만 열람, 비공개'),
    ],
  },
  evidence: {
    key: 'evidence', label: b('Chứng từ xuất khẩu', 'Export evidence', '수출 증빙'),
    accept: '.pdf,.jpg,.jpeg,.png', exts: ['pdf', 'jpg', 'jpeg', 'png'], maxMB: 20,
    tips: [b('Tờ khai hải quan, hợp đồng + invoice, B/L; che giá trị hợp đồng nếu cần', 'Customs declarations, contract + invoice, B/L; you may mask contract values', '수출신고서, 계약서+인보이스, B/L; 계약 금액은 가려도 됩니다')],
  },
  logo: {
    key: 'logo', label: b('Logo', 'Logo', '로고'),
    accept: '.png,.svg,.jpg,.jpeg', exts: ['png', 'svg', 'jpg', 'jpeg'], maxMB: 2, image: { minLong: 400, minShort: 400, ratio: '1:1' },
    tips: [b('Ảnh vuông 1:1, tối thiểu 400×400 px, ưu tiên PNG/SVG nền trong suốt', 'Square 1:1, at least 400×400 px, transparent PNG/SVG preferred', '정사각형 1:1, 최소 400×400px, 투명 배경 PNG/SVG 권장')],
  },
  cover: {
    key: 'cover', label: b('Ảnh bìa', 'Cover image', '커버 이미지'),
    accept: '.jpg,.jpeg,.png,.webp', exts: ['jpg', 'jpeg', 'png', 'webp'], maxMB: 5, image: { minLong: 1600, minShort: 500, ratio: '16:5' },
    tips: [b('Ảnh ngang tỉ lệ 16:5, khuyến nghị 1920×600 px; không chèn chữ hoặc logo lớn', 'Landscape 16:5, 1920×600 px recommended; no large text or logos', '가로 16:5, 1920×600px 권장; 큰 글자·로고 삽입 금지')],
  },
  gallery: {
    key: 'gallery', label: b('Ảnh nhà xưởng & sản xuất', 'Factory & production photos', '공장 & 생산 사진'),
    accept: '.jpg,.jpeg,.png,.webp', exts: ['jpg', 'jpeg', 'png', 'webp'], maxMB: 5, image: { minLong: 1200, ratio: '4:3 / 16:9' },
    tips: [
      b('3–12 ảnh thật: nhà xưởng, dây chuyền, kho, phòng QC, văn phòng', '3–12 real photos: factory, lines, warehouse, QC lab, office', '실제 사진 3–12장: 공장, 라인, 창고, QC실, 사무실'),
      b('Ảnh ngang 4:3 hoặc 16:9, cạnh dài ≥ 1200 px, đủ sáng, không watermark lớn', 'Landscape 4:3 or 16:9, long side ≥ 1200 px, well lit, no big watermark', '가로 4:3 또는 16:9, 긴 변 1200px 이상, 밝게, 큰 워터마크 금지'),
      b('Ghi chú cho từng ảnh để người mua hiểu đang xem gì', 'Caption each photo so buyers know what they see', '각 사진에 설명을 입력하세요'),
    ],
  },
  brochure: {
    key: 'brochure', label: b('Hồ sơ năng lực / Catalogue', 'Company profile / Catalogue', '회사 소개서 / 카탈로그'),
    accept: '.pdf', exts: ['pdf'], maxMB: 20,
    tips: [b('PDF, tối đa 20 MB; nên có bản tiếng Anh. Trang đầu được dùng làm ảnh xem trước', 'PDF up to 20 MB; English version recommended. First page is used as preview', 'PDF 최대 20MB, 영문본 권장. 첫 페이지가 미리보기로 사용됩니다')],
  },
}

export const formatSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)
export const ruleSummary = (r: UploadRule) => `${r.exts.filter((e) => e !== 'jpeg').map((e) => e.toUpperCase()).join(', ')} · ${tx('tối đa', 'max', '최대')} ${r.maxMB} MB${r.image ? ` · ≥ ${r.image.minLong}px` : ''}`
export const isImage = (name: string) => /\.(png|jpe?g|webp|svg)$/i.test(name)

const imageSize = (file: File) =>
  new Promise<{ w: number; h: number } | null>((resolve) => {
    if (file.type === 'image/svg+xml') return resolve(null)
    const url = URL.createObjectURL(file)
    const im = new Image()
    im.onload = () => { resolve({ w: im.naturalWidth, h: im.naturalHeight }); URL.revokeObjectURL(url) }
    im.onerror = () => { resolve(null); URL.revokeObjectURL(url) }
    im.src = url
  })

/** Returns a localized error, or null when the file satisfies the rule. */
export async function checkFile(file: File, rule: UploadRule): Promise<string | null> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!rule.exts.includes(ext)) return tx(`Định dạng .${ext} không được hỗ trợ. Chấp nhận: ${ruleSummary(rule)}`, `.${ext} is not supported. Accepted: ${ruleSummary(rule)}`, `.${ext} 형식은 지원되지 않습니다. 허용: ${ruleSummary(rule)}`)
  if (file.size > rule.maxMB * 1024 * 1024) return tx(`File ${formatSize(file.size)} vượt quá ${rule.maxMB} MB`, `File is ${formatSize(file.size)}, over the ${rule.maxMB} MB limit`, `파일 ${formatSize(file.size)}가 ${rule.maxMB}MB를 초과합니다`)
  if (rule.image && isImage(file.name)) {
    const s = await imageSize(file)
    if (s) {
      const long = Math.max(s.w, s.h), short = Math.min(s.w, s.h)
      if (long < rule.image.minLong || (rule.image.minShort && short < rule.image.minShort)) {
        return tx(`Ảnh ${s.w}×${s.h} px quá nhỏ (cần ≥ ${rule.image.minLong} px)`, `Image ${s.w}×${s.h} px is too small (needs ≥ ${rule.image.minLong} px)`, `이미지 ${s.w}×${s.h}px가 너무 작습니다 (${rule.image.minLong}px 이상 필요)`)
      }
    }
  }
  return null
}

/** Downscaled JPEG data URL for previews (prototype storage). */
export function toPreview(file: File, maxSide = 1200, quality = 0.78): Promise<string> {
  return new Promise((resolve) => {
    if (!isImage(file.name)) return resolve('')
    const url = URL.createObjectURL(file)
    const im = new Image()
    im.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(im.naturalWidth, im.naturalHeight))
      const c = document.createElement('canvas')
      c.width = Math.round(im.naturalWidth * scale)
      c.height = Math.round(im.naturalHeight * scale)
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, c.width, c.height)
      ctx.drawImage(im, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality))
    }
    im.onerror = () => { URL.revokeObjectURL(url); resolve('') }
    im.src = url
  })
}
