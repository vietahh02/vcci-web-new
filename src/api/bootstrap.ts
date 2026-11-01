/**
 * Pre-render bootstrap (live mode only): load the category list and sponsors once and swap them into the
 * shared mock arrays in place, so every screen that lists categories/sponsors sees backend data.
 * On any failure (or after 4 s) the mock lists stay (logged) and the app still renders.
 */
import { applySponsors } from '@/components/sponsor'
import { categories } from '@/data/mock'
import { USE_MOCK, mockFallback } from './config'
import { homeSponsors, loadCategories } from './realApi'

const why = (e: unknown) => (e instanceof Error ? e.message : 'unavailable')

export async function bootstrap() {
  if (USE_MOCK) return
  const cats = loadCategories().then(
    (live) => { if (live.length) categories.splice(0, categories.length, ...live) },
    (e) => mockFallback('GET /api/categories/options', why(e)),
  )
  const spons = homeSponsors().then(applySponsors, (e) => mockFallback('GET /api/public/sponsors', why(e)))
  await Promise.race([Promise.all([cats, spons]), new Promise((r) => setTimeout(r, 4000))])
}
