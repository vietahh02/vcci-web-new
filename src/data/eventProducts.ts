/** Which catalogue products are traded through an event (shown on the event page as "products traded via this event"). */
import { products, type EventItem, type Product } from '@/data/mock'
import { getShow } from '@/data/shows'

const KEYWORDS: Record<string, string[]> = {
  Food: ['Coffee', 'Rice', 'Fruit', 'Spices', 'Tea'], Seafood: ['Seafood'], Coffee: ['Coffee'], Spices: ['Spices'],
  Furniture: ['Furniture'], Textiles: ['Apparel'], Fashion: ['Apparel'], Apparel: ['Apparel'], Machinery: ['Steel'], Electronics: ['Electronics'],
  Solar: ['Energy'], Energy: ['Energy'], Handicraft: ['Ceramics', 'Handicraft'], Packaging: ['Packaging'], Cosmetics: ['Cosmetics'],
}

export interface TradedProduct { product: Product; quotes: number }

const hash = (s: string) => Math.abs([...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 11))

/** Products linked to the event + a sample count of quote requests it generated (a real backend counts RFQs tagged with the event id). */
export function eventProducts(ev: EventItem, max = 8): TradedProduct[] {
  const show = getShow(ev.id)
  let list: Product[]
  if (show) {
    const ids = new Set(show.booths.flatMap((b) => b.products.map((p) => p.linkId)).filter(Boolean))
    list = products.filter((p) => ids.has(p.id))
  } else {
    const wanted = new Set(ev.industry.flatMap((i) => KEYWORDS[i] ?? []))
    list = wanted.size ? products.filter((p) => wanted.has(p.industry)) : []
    if (ev.industry.includes('Multi-industry') || list.length === 0) {
      list = [...new Map([...list, ...[...products].sort((a, b) => b.viewCount - a.viewCount).slice(0, 6)].map((p) => [p.id, p])).values()]
    }
  }
  return list.slice(0, max).map((product) => ({ product, quotes: 3 + ((hash(ev.id + product.id)) % 26) }))
}
