/**
 * Pre-render bootstrap (live mode only): load the category list and sponsors once and swap them into the
 * shared mock arrays in place, so every screen that lists categories/sponsors sees backend data.
 * A successful response wins even when empty; on failure (or after 4 s) the mock lists stay (logged) and the app still renders.
 */
import { applySponsors } from '@/components/sponsor'
import { categories } from '@/data/mock'
import { USE_MOCK, mockFallback } from './config'
import { homeSponsors, loadCategories } from './realApi'

const why = (e: unknown) => (e instanceof Error ? e.message : 'unavailable')

export async function bootstrap() {
  if (USE_MOCK) return
  const cats = loadCategories().then(
    (live) => { categories.splice(0, categories.length, ...live) },
    (e) => mockFallback('GET /api/public/home/categories', why(e)),
  )
  const spons = homeSponsors().then(applySponsors, (e) => mockFallback('GET /api/public/sponsors', why(e)))
  // shortcut: a response slower than 4 s replaces the mock lists without a re-render, move them to a subscribed store if the BE gets that slow
  await Promise.race([Promise.all([cats, spons]), new Promise((r) => setTimeout(r, 4000))])
}
