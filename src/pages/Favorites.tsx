/** /account/favorites — "Sản phẩm yêu thích": products the signed-in account saved with the heart button (BE: GET /api/my/favorites/products, newest first). */
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Heart, LayoutGrid, List, MapPin, PackageSearch } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { catalogApi, searchProductsPage, tokens, USE_MOCK } from '@/api'
import { ProductCard } from '@/components/cards'
import { SmartImage } from '@/components/effects'
import { FavoriteButton } from '@/components/catalog/FavoriteButton'
import { PageHero } from '@/components/PageHero'
import { Pagination } from '@/components/Pagination'
import { ErrorBlock } from '@/components/ui/StateViews'
import { buttonClass, Skeleton } from '@/components/ui/primitives'
import { products as mockProducts, type Product } from '@/data/mock'
import { mockFavoriteIds, onFavoriteChange } from '@/lib/favorites'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'
import { cn, formatMoney, formatNumber, img } from '@/lib/utils'

const PAGE_SIZE = 12
type View = 'grid' | 'list'
const VIEW_KEY = 'vcci.favorites.view'
const readView = (): View => { try { return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid' } catch { return 'grid' } }

export default function Favorites() {
  const { L, lang, locale } = useI18n()
  const [params, setParams] = useSearchParams()
  const pageNo = Math.max(1, Math.floor(Number(params.get('page'))) || 1)
  const [items, setItems] = useState<Product[] | null>(null)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<Error>()
  const [attempt, setAttempt] = useState(0)
  const [view, setView] = useState<View>(readView)
  const itemsRef = useRef<Product[]>([])
  itemsRef.current = items ?? []
  const removed = useRef(new Map<string, { product: Product; index: number }>())
  const listTop = useRef<HTMLDivElement>(null)
  const signedOut = !USE_MOCK && !tokens.access()
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  useEffect(() => {
    if (signedOut) { setItems([]); return }
    let alive = true
    setError(undefined)
    removed.current.clear()
    const load = USE_MOCK
      ? Promise.resolve(mockFavoriteIds()).then((ids) => {
          const all = ids.map((id) => mockProducts.find((p) => p.id === id)).filter((p): p is Product => !!p)
          return { items: all.slice((pageNo - 1) * PAGE_SIZE, pageNo * PAGE_SIZE), total: all.length }
        })
      : catalogApi.listFavorites(pageNo - 1, PAGE_SIZE)
    load.then((r) => { if (alive) { setItems(r.items); setTotal(r.total) } }, (e: Error) => { if (alive) { setError(e); setItems([]) } })
    return () => { alive = false }
  }, [pageNo, lang, attempt, signedOut])

  // bấm tim ở bất kỳ thẻ nào: thẻ rời khỏi lưới có hiệu ứng; "Hoàn tác" đưa nó về đúng chỗ cũ
  useEffect(() => onFavoriteChange(({ productId, on }) => {
    const cur = itemsRef.current
    if (!on) {
      const index = cur.findIndex((p) => p.id === productId)
      if (index < 0) return
      removed.current.set(productId, { product: cur[index]!, index })
      setItems(cur.filter((p) => p.id !== productId))
      setTotal((n) => Math.max(0, n - 1))
      return
    }
    const r = removed.current.get(productId)
    if (!r || cur.some((p) => p.id === productId)) return
    removed.current.delete(productId)
    setItems([...cur.slice(0, r.index), r.product, ...cur.slice(r.index)])
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
  const pickView = (v: View) => { setView(v); try { localStorage.setItem(VIEW_KEY, v) } catch { /* không lưu được thì thôi */ } }

  const loading = items === null
  const empty = !loading && !error && total === 0 && items.length === 0

  return (
    <>
      <PageHero
        tone="azure"
        crumbs={[{ label: tx('Trang chủ', 'Home', '홈'), to: '/' }, { label: tx('Yêu thích', 'Favourites', '즐겨찾기') }]}
        title={tx('Sản phẩm yêu thích', 'Favourite products', '즐겨찾는 제품')}
        subtitle={tx('Những sản phẩm bạn đã lưu để so sánh giá FOB, MOQ và gửi yêu cầu báo giá khi cần.', 'Products you saved to compare FOB prices and MOQ, and to request a quote when you are ready.', '나중에 FOB 가격과 MOQ를 비교하고 견적을 요청할 수 있도록 저장한 제품입니다.')}
        aside={<HeartStack products={items ?? []} total={total} />}
      >
        <Link to="/search" className={buttonClass('default', 'lg')}>{tx('Khám phá thêm sản phẩm', 'Discover more products', '제품 더 보기')} <ArrowRight /></Link>
      </PageHero>

      <div className="container-page mt-4 pb-6">
        {signedOut ? <SignedOut /> : empty ? <Empty /> : (
          <>
            <div ref={listTop} className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground/80" aria-live="polite">
                {loading || error ? '' : (
                  <>
                    <motion.span key={total} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mr-1 inline-block text-lg font-extrabold text-primary">{formatNumber(total, locale)}</motion.span>
                    {tx('sản phẩm đã lưu', 'saved products', '저장한 제품')}
                    <span className="ml-2 hidden text-muted-foreground sm:inline">· {tx('mới lưu hiện đầu tiên', 'most recent first', '최근 저장 순')}</span>
                  </>
                )}
              </p>
              <ViewToggle value={view} onChange={pickView} />
            </div>

            {loading ? (
              <div className={view === 'grid' ? 'grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4' : 'space-y-3'}>
                {Array.from({ length: view === 'grid' ? 8 : 4 }).map((_, i) => view === 'grid'
                  ? <div key={i} className="overflow-hidden rounded-2xl border bg-card"><Skeleton className="aspect-square rounded-none" /><div className="p-3.5"><Skeleton className="h-4" /><Skeleton className="mt-2 h-5 w-1/2" /></div></div>
                  : <Skeleton key={i} className="h-32 rounded-2xl" />)}
              </div>
            ) : error ? (
              <ErrorBlock error={error} onRetry={() => setAttempt((n) => n + 1)} />
            ) : (
              <motion.div layout className={view === 'grid' ? 'grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 xl:grid-cols-4' : 'space-y-3'}>
                <AnimatePresence mode="popLayout" initial>
                  {items.map((p, i) => (
                    <motion.div
                      key={`${view}-${p.id}`}
                      layout="position"
                      initial={{ opacity: 0, y: 18, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: Math.min(i, 8) * 0.04, type: 'spring', stiffness: 260, damping: 26 } }}
                      exit={{ opacity: 0, scale: 0.8, rotate: view === 'grid' ? -2 : 0, filter: 'blur(4px)', transition: { duration: 0.28 } }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className={view === 'grid' ? 'h-full' : undefined}
                    >
                      {view === 'grid' ? <ProductCard product={p} favorite /> : <FavoriteRow product={p} name={L(p.productName)} />}
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
// ba thẻ sản phẩm xếp quạt (lấy từ chính sản phẩm đã lưu), tim đập nhẹ và vài trái tim nổi lên; rê chuột vào thì quạt xoè rộng hơn
function HeartStack({ products, total }: { products: Product[]; total: number }) {
  const { locale } = useI18n()
  const shown = products.slice(0, 3)
  const slots = [
    { rotate: -12, x: -78, y: 14, z: 1 },
    { rotate: 11, x: 78, y: 18, z: 1 },
    { rotate: 0, x: 0, y: -8, z: 2 },
  ]
  return (
    <motion.div initial="rest" animate="rest" whileHover="spread" className="relative mx-auto hidden h-[270px] w-[340px] select-none md:block" aria-hidden>
      {slots.map((s, i) => {
        const p = shown[[1, 2, 0][i]!] // thẻ giữa là sản phẩm mới lưu nhất
        return (
          <motion.div
            key={i}
            variants={{ rest: { opacity: 1, rotate: s.rotate, x: s.x, y: s.y }, spread: { opacity: 1, rotate: s.rotate * 1.35, x: s.x * 1.18, y: s.y - (i === 2 ? 8 : 0) } }}
            initial={{ opacity: 0, y: 40, rotate: 0, x: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.08 * i }}
            style={{ zIndex: s.z }}
            className="absolute left-1/2 top-4 -ml-[72px] h-[196px] w-[144px] overflow-hidden rounded-2xl border-4 border-white bg-white shadow-xl shadow-navy/20 dark:border-white/90"
          >
            {p ? <img src={img(p.productImages[0]!, 300, 380)} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center bg-gradient-to-br from-primary-soft to-white text-primary/50"><PackageSearch className="size-10" /></div>}
          </motion.div>
        )
      })}
      <motion.div
        animate={{ scale: [1, 1.14, 1, 1.1, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', times: [0, 0.18, 0.36, 0.5, 1] }}
        className="absolute bottom-2 left-1/2 z-10 -ml-9 grid size-[72px] place-items-center rounded-full bg-white shadow-xl shadow-red-500/25 ring-4 ring-red-100 dark:bg-card dark:ring-red-500/20"
      >
        <Heart className="size-9 fill-red-500 text-red-500" />
        {total > 0 && <span className="absolute -right-2 -top-1 min-w-7 rounded-full bg-navy px-2 py-0.5 text-center text-xs font-bold text-white shadow">{formatNumber(total, locale)}</span>}
      </motion.div>
      {[
        { x: -150, delay: 0, size: 14 }, { x: -96, delay: 1.1, size: 10 }, { x: 118, delay: 0.5, size: 16 }, { x: 160, delay: 1.7, size: 10 }, { x: 40, delay: 2.2, size: 12 },
      ].map((h, i) => (
        <motion.span
          key={i}
          style={{ left: `calc(50% + ${h.x}px)` }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: [-0, -150], opacity: [0, 0.9, 0], x: [0, i % 2 ? 10 : -10] }}
          transition={{ duration: 3.6, repeat: Infinity, delay: h.delay, ease: 'easeOut' }}
          className="absolute bottom-12"
        >
          <Heart style={{ width: h.size, height: h.size }} className="fill-red-400 text-red-400" />
        </motion.span>
      ))}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ view toggle */
function ViewToggle({ value, onChange }: { value: View; onChange: (v: View) => void }) {
  const opts: { v: View; icon: typeof List; label: string }[] = [
    { v: 'grid', icon: LayoutGrid, label: tx('Dạng lưới', 'Grid view', '그리드 보기') },
    { v: 'list', icon: List, label: tx('Dạng danh sách', 'List view', '목록 보기') },
  ]
  return (
    <div role="group" aria-label={tx('Kiểu hiển thị', 'Display', '표시 방식')} className="relative inline-flex rounded-full bg-muted p-1">
      {opts.map(({ v, icon: Icon, label }) => (
        <button key={v} type="button" aria-pressed={value === v} aria-label={label} title={label} onClick={() => onChange(v)} className={cn('relative grid size-9 place-items-center rounded-full transition-colors', value === v ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>
          {value === v && <motion.span layoutId="fav-view" className="absolute inset-0 rounded-full bg-background shadow-sm" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
          <Icon className="relative size-4" />
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ list row */
function FavoriteRow({ product, name }: { product: Product; name: string }) {
  const { t, locale } = useI18n()
  return (
    <div className="group/row relative">
      <Link to={`/products/${product.id}`} className="flex gap-4 rounded-2xl border bg-card p-3 pr-16 outline-none transition-[box-shadow,border-color,translate] duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-navy/10 focus-visible:ring-2 focus-visible:ring-primary">
        <SmartImage src={img(product.productImages[0]!, 320, 320)} alt={name} className="size-24 shrink-0 rounded-xl sm:size-28" imgClassName="group-hover/row:scale-105" />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 py-0.5 md:flex-row md:items-center md:gap-6">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-[15px] font-semibold leading-snug transition-colors group-hover/row:text-primary">{name}</p>
            {product.organizationName && <p className="mt-1 truncate text-[13px] text-muted-foreground">{product.organizationName}</p>}
            {product.certificates[0] && <p className="mt-1 truncate text-xs font-semibold text-gold">{product.certificates.slice(0, 3).join(' · ')}</p>}
          </div>
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 md:contents">
            <p className="hidden text-xs text-muted-foreground md:block md:w-28">
              <span className="block">{t.common.moq}</span>
              <span className="mt-0.5 block text-[13px] font-semibold text-foreground">{formatNumber(product.moq, locale)} {product.unit}</span>
            </p>
            <p className="inline-flex items-center gap-1 text-xs text-muted-foreground md:w-32"><MapPin className="size-3.5 shrink-0" /><span className="truncate">{product.origin.split(',')[0]}</span></p>
            <p className="whitespace-nowrap text-[17px] font-bold tracking-tight md:w-36 md:text-right">{formatMoney(product.priceFob)} <span className="text-xs font-normal text-muted-foreground md:mt-0.5 md:block">/ {product.unit} FOB</span></p>
          </div>
        </div>
      </Link>
      <FavoriteButton productId={product.id} initial className="absolute right-3 top-3 size-10 rounded-full bg-muted/80 text-navy hover:bg-muted md:top-1/2 md:-translate-y-1/2 dark:text-white" />
    </div>
  )
}

/* ------------------------------------------------------------------ states */
function SignedOut() {
  return (
    <div className="mx-auto grid max-w-lg place-items-center rounded-3xl border bg-card px-6 py-14 text-center shadow-sm">
      <span className="grid size-16 place-items-center rounded-full bg-primary-soft text-primary"><Heart className="size-8" /></span>
      <p className="mt-5 text-xl font-extrabold">{tx('Đăng nhập để xem sản phẩm đã lưu', 'Sign in to see your saved products', '로그인하여 저장한 제품을 확인하세요')}</p>
      <p className="mt-2 max-w-sm text-[15px] text-foreground/75">{tx('Danh sách yêu thích gắn với tài khoản của bạn nên dùng được trên mọi thiết bị.', 'Your favourites belong to your account, so they follow you across devices.', '즐겨찾기는 계정에 저장되어 모든 기기에서 사용할 수 있습니다.')}</p>
      <Link to="/login?return=/account/favorites" className={buttonClass('default', 'lg', 'mt-6')}>{tx('Đăng nhập', 'Sign in', '로그인')} <ArrowRight /></Link>
    </div>
  )
}

function Empty() {
  const [picks, setPicks] = useState<Product[]>([])
  useEffect(() => {
    let alive = true
    searchProductsPage({ sort: 'popular', page: 0, size: 4 }).then((r) => { if (alive) setPicks(r.items.slice(0, 4)) }, () => undefined)
    return () => { alive = false }
  }, [])
  return (
    <div>
      <div className="grid place-items-center rounded-3xl bg-muted/60 px-6 py-14 text-center">
        <div className="relative grid size-24 place-items-center">
          {[0, 1].map((i) => (
            <motion.span key={i} className="absolute inset-0 rounded-full border-2 border-red-300/70" animate={{ scale: [1, 1.7], opacity: [0.7, 0] }} transition={{ duration: 2.2, repeat: Infinity, delay: i * 1.1, ease: 'easeOut' }} />
          ))}
          <motion.span animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} className="grid size-20 place-items-center rounded-full bg-white shadow-lg shadow-red-500/15 dark:bg-card">
            <Heart className="size-9 text-red-400" />
          </motion.span>
        </div>
        <p className="mt-6 text-xl font-extrabold">{tx('Bạn chưa lưu sản phẩm nào', 'You have not saved any product yet', '아직 저장한 제품이 없습니다')}</p>
        <p className="mt-2 max-w-md text-[15px] text-foreground/75">{tx('Bấm biểu tượng trái tim trên sản phẩm bạn quan tâm, chúng sẽ xuất hiện ở đây để bạn xem lại và so sánh.', 'Tap the heart on any product you like and it will appear here to review and compare later.', '마음에 드는 제품의 하트를 누르면 여기에 모여 나중에 비교할 수 있습니다.')}</p>
        <Link to="/search" className={buttonClass('default', 'lg', 'mt-6')}>{tx('Khám phá sản phẩm', 'Browse products', '제품 둘러보기')} <ArrowRight /></Link>
      </div>
      {picks.length > 0 && (
        <section className="mt-10">
          <p className="mb-4 text-lg font-extrabold">{tx('Gợi ý cho bạn', 'Popular right now', '인기 제품')}</p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
            {picks.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.06 } }}>
                <ProductCard product={p} favorite={false} />
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
