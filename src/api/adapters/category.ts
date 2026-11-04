import { IMG, type Category, type CategoryIcon } from '@/data/mock'
import type { Bilingual } from '@/lib/i18n'
import { bi, id, num, str, url, type Raw } from './common'

const ICONS = new Set(['Wheat', 'Fish', 'Shirt', 'Sofa', 'Cpu', 'Gem', 'Hammer', 'Zap', 'Boxes', 'Truck'])
const ICON_BY_INDUSTRY: Record<string, CategoryIcon> = {
  AGRICULTURE: 'Wheat', FOOD: 'Wheat', SEAFOOD: 'Fish', TEXTILE: 'Shirt', FURNITURE: 'Sofa', ELECTRONICS: 'Cpu', HANDICRAFT: 'Gem', MACHINERY: 'Hammer', ENERGY: 'Zap', LOGISTICS: 'Truck',
}

/** GET /api/public/home/categories -> FE Category. Everything comes from the BE; only a category with no image gets the placeholder. */
export function toCategory(r: Raw, names?: Bilingual, subs?: { vi: string[]; en: string[]; ko: string[] }): Category {
  return {
    id: id(r.id),
    categoryCode: str(r.categoryCode),
    categoryName: names ?? bi(r.categoryName),
    icon: ICONS.has(str(r.icon)) ? (str(r.icon) as CategoryIcon) : ICON_BY_INDUSTRY[str(r.industry).toUpperCase()] ?? 'Boxes',
    image: r.image ? url(r.image) : IMG.warehouse,
    productCount: num(r.productCount),
    sub: subs?.vi.length ? subs.vi.map((v, i) => ({ vi: v, en: subs.en[i] ?? v, ko: subs.ko[i] ?? subs.en[i] ?? v })) : [],
  }
}
