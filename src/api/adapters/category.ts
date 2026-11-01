import { categories, IMG, type Category, type CategoryIcon } from '@/data/mock'
import type { Bilingual } from '@/lib/i18n'
import { bi, id, str, url, type Raw } from './common'

const ICONS = new Set(['Wheat', 'Fish', 'Shirt', 'Sofa', 'Cpu', 'Gem', 'Hammer', 'Zap', 'Boxes', 'Truck'])
const byCode = (code: string) => categories.find((c) => c.categoryCode.toLowerCase() === code.toLowerCase())
const ICON_BY_INDUSTRY: Record<string, CategoryIcon> = {
  AGRICULTURE: 'Wheat', FOOD: 'Wheat', SEAFOOD: 'Fish', TEXTILE: 'Shirt', FURNITURE: 'Sofa', ELECTRONICS: 'Cpu', HANDICRAFT: 'Gem', MACHINERY: 'Hammer', ENERGY: 'Zap', LOGISTICS: 'Truck',
}

/** GET /api/categories/options -> FE Category. Decorative fields (icon, image, sub) are kept from the matching mock category when codes line up. */
export function toCategory(r: Raw, names?: Bilingual, subs?: { vi: string[]; en: string[]; ko: string[] }): Category {
  const code = str(r.categoryCode)
  const m = byCode(code) ?? categories.find((c) => c.id === id(r.id))
  return {
    id: id(r.id),
    categoryCode: code,
    categoryName: names ?? bi(r.categoryName),
    icon: ICONS.has(str(r.icon)) ? (str(r.icon) as CategoryIcon) : m?.icon ?? ICON_BY_INDUSTRY[str(r.industry).toUpperCase()] ?? 'Boxes',
    image: r.image ? url(r.image) : m?.image ?? IMG.warehouse,
    productCount: typeof r.productCount === 'number' ? r.productCount : m?.productCount ?? 0,
    sub: subs?.vi.length ? subs.vi.map((v, i) => ({ vi: v, en: subs.en[i] ?? v, ko: subs.ko[i] ?? subs.en[i] ?? v })) : m?.sub ?? [],
  }
}
