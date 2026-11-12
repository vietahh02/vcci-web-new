/** /account/following — "Doanh nghiệp đang theo dõi": businesses the signed-in account follows (BE: GET /api/me/follows/businesses, newest first). */
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, BellRing, Building2, UsersRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchFeaturedBusinesses, getBusiness, liveApi, tokens, USE_MOCK } from '@/api'
import { SupplierCard } from '@/components/cards'
import { FollowButton } from '@/components/catalog/FollowButton'
import { PageHero } from '@/components/PageHero'
import { Pagination } from '@/components/Pagination'
import { ErrorBlock } from '@/components/ui/StateViews'
import { buttonClass, Skeleton } from '@/components/ui/primitives'
import type { Business } from '@/data/mock'
import { mockFollowIds, onFollowChange } from '@/lib/follows'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'
import { formatNumber, img } from '@/lib/utils'

const PAGE_SIZE = 12

export default function Following() {
  const { lang, locale } = useI18n()
  const [params, setParams] = useSearchParams()
  const pageNo = Math.max(1, Math.floor(Number(params.get('page'))) || 1)
  const [items, setItems] = useState<Business[] | null>(null)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<Error>()
  const [attempt, setAttempt] = useState(0)
  const itemsRef = useRef<Business[]>([])
  itemsRef.current = items ?? []
  const removed = useRef(new Map<string, { business: Business; index: number }>())
  const listTop = useRef<HTMLDivElement>(null)
  const signedOut = !USE_MOCK && !tokens.access()
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  useEffect(() => {
    if (signedOut) { setItems([]); return }
    let alive = true
    setError(undefined)
    removed.current.clear()
    const load = USE_MOCK
      ? Promise.resolve(mockFollowIds()).then((ids) => {
          const all = ids.map((id) => getBusiness(id)).filter((b): b is Business => !!b)
          return { items: all.slice((pageNo - 1) * PAGE_SIZE, pageNo * PAGE_SIZE), total: all.length }
        })
      : liveApi.listFollowedBusinesses(pageNo - 1, PAGE_SIZE)
    load.then((r) => { if (alive) { setItems(r.items); setTotal(r.total) } }, (e: Error) => { if (alive) { setError(e); setItems([]) } })
    return () => { alive = false }
  }, [pageNo, lang, attempt, signedOut])

  // bỏ theo dõi ở bất kỳ thẻ nào: thẻ rời khỏi lưới có hiệu ứng; "Hoàn tác" đưa nó về đúng chỗ cũ
  useEffect(() => onFollowChange(({ orgId, on }) => {
    const cur = itemsRef.current
    if (!on) {
      const index = cur.findIndex((b) => b.id === orgId)
      if (index < 0) return
      removed.current.set(orgId, { business: cur[index]!, index })
      setItems(cur.filter((b) => b.id !== orgId))
      setTotal((n) => Math.max(0, n - 1))
      return
    }
    const r = removed.current.get(orgId)
    if (!r || cur.some((b) => b.id === orgId)) return
    removed.current.delete(orgId)
    setItems([...cur.slice(0, r.index), r.business, ...cur.slice(r.index)])
    setTotal((n) => n + 1)
  }), [])

  // bỏ hết thẻ của trang hiện tại thì nạp lại (lùi một trang nếu trang này không còn gì)
  useEffect(() => {
    if (!items || items.length > 0 || total === 0) return
    const t = setTimeout(() => {
      if (pageNo > 1 && pageNo > Math.ceil(total / PAGE_SIZE)) setParams((p) => { const n = new URLSearchParams(p); if (pageNo - 1 <= 1) n.delete('page'); else n.set('page', String(pageNo - 1)); return n }, { replace: true })
      else setAttempt((n) => n + 1)
    }, 500)
    return () => clearTimeout(t)
  }, [items, total, pageNo, setParams])

  const goPage = (n: number) => {
    setParams((p) => { const next = new URLSearchParams(p); if (n <= 1) next.delete('page'); else next.set('page', String(n)); return next })
    const el = listTop.current
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 110, behavior: 'smooth' })
  }

  const loading = items === null
  const empty = !loading && !error && total === 0 && items.length === 0

  return (
    <>
      <PageHero
        tone="azure"
        crumbs={[{ label: tx('Trang chủ', 'Home', '홈'), to: '/' }, { label: tx('Đang theo dõi', 'Following', '팔로우 중') }]}
        title={tx('Doanh nghiệp đang theo dõi', 'Businesses you follow', '팔로우 중인 기업')}
        subtitle={tx('Theo dõi doanh nghiệp để xem lại nhanh và nhận thông báo khi họ đăng sản phẩm mới.', 'Follow businesses to find them again quickly and get notified when they publish new products.', '기업을 팔로우하면 빠르게 다시 찾고 신제품 알림을 받을 수 있습니다.')}
        aside={<CompanyStack items={items ?? []} total={total} />}
      >
        <Link to="/suppliers" className={buttonClass('default', 'lg')}>{tx('Khám phá doanh nghiệp', 'Discover businesses', '기업 둘러보기')} <ArrowRight /></Link>
      </PageHero>

      <div className="container-page mt-4 pb-6">
        {signedOut ? <SignedOut /> : empty ? <Empty /> : (
          <>
            <div ref={listTop} className="mb-6">
              <p className="text-sm font-semibold text-foreground/80" aria-live="polite">
                {loading || error ? '' : (
                  <>
                    <motion.span key={total} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mr-1 inline-block text-lg font-extrabold text-primary">{formatNumber(total, locale)}</motion.span>
                    {tx('doanh nghiệp đang theo dõi', 'businesses followed', '팔로우 중인 기업')}
                    <span className="ml-2 hidden text-muted-foreground sm:inline">· {tx('mới theo dõi hiện đầu tiên', 'most recent first', '최근 팔로우 순')}</span>
                  </>
                )}
              </p>
            </div>

            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
              </div>
            ) : error ? (
              <ErrorBlock error={error} onRetry={() => setAttempt((n) => n + 1)} />
            ) : (
              <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout" initial>
                  {items.map((b, i) => (
                    <motion.div
                      key={b.id}
                      layout="position"
                      initial={{ opacity: 0, y: 18, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: Math.min(i, 8) * 0.05, type: 'spring', stiffness: 260, damping: 26 } }}
                      exit={{ opacity: 0, scale: 0.8, filter: 'blur(4px)', transition: { duration: 0.28 } }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="relative h-full"
                    >
                      <SupplierCard business={b} corner={<FollowButton orgId={b.id} name={b.name} initial variant="icon" />} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
            {!loading && !error && pages > 1 && <Pagination page={pageNo} pages={pages} onChange={goPage} label={tx('Phân trang', 'Pagination', '페이지 이동')} />}
          </>
        )}
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ hero art */
// ba thẻ doanh nghiệp xếp quạt (ảnh bìa của chính các doanh nghiệp đang theo dõi), chuông thông báo rung nhẹ; rê chuột thì quạt xoè rộng
function CompanyStack({ items, total }: { items: Business[]; total: number }) {
  const { locale } = useI18n()
  const shown = items.slice(0, 3)
  const slots = [
    { rotate: -12, x: -78, y: 14, z: 1 },
    { rotate: 11, x: 78, y: 18, z: 1 },
    { rotate: 0, x: 0, y: -8, z: 2 },
  ]
  return (
    <motion.div initial="rest" animate="rest" whileHover="spread" className="relative mx-auto hidden h-[270px] w-[340px] select-none md:block" aria-hidden>
      {slots.map((s, i) => {
        const b = shown[[1, 2, 0][i]!]
        return (
          <motion.div
            key={i}
            variants={{ rest: { opacity: 1, rotate: s.rotate, x: s.x, y: s.y }, spread: { opacity: 1, rotate: s.rotate * 1.35, x: s.x * 1.18, y: s.y - (i === 2 ? 8 : 0) } }}
            initial={{ opacity: 0, y: 40, rotate: 0, x: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.08 * i }}
            style={{ zIndex: s.z }}
            className="absolute left-1/2 top-4 -ml-[72px] h-[196px] w-[144px] overflow-hidden rounded-2xl border-4 border-white bg-white shadow-xl shadow-navy/20 dark:border-white/90"
          >
            {b ? <img src={img(b.coverImage, 300, 380)} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center bg-gradient-to-br from-primary-soft to-white text-primary/50"><Building2 className="size-10" /></div>}
          </motion.div>
        )
      })}
      <motion.div
        animate={{ rotate: [0, -14, 12, -8, 6, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut' }}
        style={{ originY: 0.1 }}
        className="absolute bottom-2 left-1/2 z-10 -ml-9 grid size-[72px] place-items-center rounded-full bg-white shadow-xl shadow-primary/25 ring-4 ring-primary-soft dark:bg-card"
      >
        <BellRing className="size-8 fill-primary/15 text-primary" />
        {total > 0 && <span className="absolute -right-2 -top-1 min-w-7 rounded-full bg-navy px-2 py-0.5 text-center text-xs font-bold text-white shadow">{formatNumber(total, locale)}</span>}
      </motion.div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ states */
function SignedOut() {
  return (
    <div className="mx-auto grid max-w-lg place-items-center rounded-3xl border bg-card px-6 py-14 text-center shadow-sm">
      <span className="grid size-16 place-items-center rounded-full bg-primary-soft text-primary"><UsersRound className="size-8" /></span>
      <p className="mt-5 text-xl font-extrabold">{tx('Đăng nhập để xem doanh nghiệp bạn theo dõi', 'Sign in to see the businesses you follow', '로그인하여 팔로우 중인 기업을 확인하세요')}</p>
      <p className="mt-2 max-w-sm text-[15px] text-foreground/75">{tx('Danh sách gắn với tài khoản của bạn nên dùng được trên mọi thiết bị.', 'The list belongs to your account, so it follows you across devices.', '목록은 계정에 저장되어 모든 기기에서 사용할 수 있습니다.')}</p>
      <Link to="/login?return=/account/following" className={buttonClass('default', 'lg', 'mt-6')}>{tx('Đăng nhập', 'Sign in', '로그인')} <ArrowRight /></Link>
    </div>
  )
}

function Empty() {
  const [picks, setPicks] = useState<Business[]>([])
  useEffect(() => {
    let alive = true
    fetchFeaturedBusinesses().then((r) => { if (alive) setPicks(r.slice(0, 3)) }, () => undefined)
    return () => { alive = false }
  }, [])
  return (
    <div>
      <div className="grid place-items-center rounded-3xl bg-muted/60 px-6 py-14 text-center">
        <div className="relative grid size-24 place-items-center">
          {[0, 1].map((i) => (
            <motion.span key={i} className="absolute inset-0 rounded-full border-2 border-primary/30" animate={{ scale: [1, 1.7], opacity: [0.7, 0] }} transition={{ duration: 2.2, repeat: Infinity, delay: i * 1.1, ease: 'easeOut' }} />
          ))}
          <motion.span animate={{ rotate: [0, -12, 10, -6, 0] }} transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.6, ease: 'easeInOut' }} className="grid size-20 place-items-center rounded-full bg-white shadow-lg shadow-primary/15 dark:bg-card">
            <BellRing className="size-9 text-primary" />
          </motion.span>
        </div>
        <p className="mt-6 text-xl font-extrabold">{tx('Bạn chưa theo dõi doanh nghiệp nào', 'You are not following any business yet', '아직 팔로우한 기업이 없습니다')}</p>
        <p className="mt-2 max-w-md text-[15px] text-foreground/75">{tx('Bấm "Theo dõi" ở hồ sơ doanh nghiệp hoặc trang sản phẩm. Khi họ đăng sản phẩm mới, bạn sẽ nhận được thông báo.', 'Tap "Follow" on a business profile or product page. When they publish a new product, you will be notified.', '기업 프로필이나 제품 페이지에서 "팔로우"를 누르세요. 신제품이 등록되면 알림을 받습니다.')}</p>
        <Link to="/suppliers" className={buttonClass('default', 'lg', 'mt-6')}>{tx('Khám phá doanh nghiệp', 'Browse businesses', '기업 둘러보기')} <ArrowRight /></Link>
      </div>
      {picks.length > 0 && (
        <section className="mt-10">
          <p className="mb-4 text-lg font-extrabold">{tx('Doanh nghiệp nổi bật', 'Featured businesses', '추천 기업')}</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {picks.map((b, i) => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.06 } }} className="relative h-full">
                <SupplierCard business={b} corner={<FollowButton orgId={b.id} name={b.name} variant="icon" />} />
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
