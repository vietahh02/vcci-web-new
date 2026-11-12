/**
 * Favourite toggle shared by the product card, the product page and the favourites page: stored per account on the BE in live mode,
 * in localStorage in mock mode. A guest is sent to sign in and back. `initial` lets a list read all its ids in one request;
 * without it the button asks for its own. Adding pops the heart and bursts a few small hearts; every change is broadcast
 * (`emitFavoriteChange`) so the header counter and the favourites page stay in step.
 */
import { Heart } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { catalogApi, tokens, USE_MOCK } from '@/api'
import { useToast } from '@/components/ui/overlay'
import { Button } from '@/components/ui/primitives'
import { emitFavoriteChange, mockFavoriteIds, mockSetFavorite } from '@/lib/favorites'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'

// 7 trái tim nhỏ toả ra theo vòng tròn, mỗi cái lệch nhịp một chút cho tự nhiên
const BURST = Array.from({ length: 7 }, (_, i) => {
  const a = (i / 7) * Math.PI * 2 - Math.PI / 2
  return { x: Math.cos(a) * 26, y: Math.sin(a) * 26, size: i % 2 ? 7 : 9, delay: (i % 3) * 0.03 }
})

export function FavoriteButton({ productId, initial, className, onChange }: { productId: string; initial?: boolean; className?: string; onChange?: (on: boolean) => void }) {
  const { t } = useI18n()
  const toast = useToast()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const [on, setOn] = useState(initial ?? false)
  const [burst, setBurst] = useState(0)
  useEffect(() => {
    if (initial !== undefined) { setOn(initial); return }
    if (USE_MOCK) { setOn(mockFavoriteIds().includes(productId)); return }
    if (!tokens.access()) return
    catalogApi.favoriteIds([productId]).then((s) => setOn(s.has(productId)), () => undefined)
  }, [productId, initial])

  const apply = (next: boolean) => {
    setOn(next)
    if (next) setBurst((n) => n + 1)
    emitFavoriteChange({ productId, on: next })
    onChange?.(next)
  }
  // thêm → "Xem danh sách" (trừ khi đang ở chính trang đó); bỏ → "Hoàn tác" đưa sản phẩm về lại
  const commit = (next: boolean) => {
    const toastFor = () => toast(next
      ? { kind: 'success', title: t.product.addFav, action: pathname === '/account/favorites' ? undefined : { label: tx('Xem danh sách', 'View list', '목록 보기'), onClick: () => navigate('/account/favorites') } }
      : { kind: 'success', title: tx('Đã bỏ khỏi yêu thích', 'Removed from favourites', '즐겨찾기에서 제거됨'), action: { label: tx('Hoàn tác', 'Undo', '실행 취소'), onClick: () => commit(true) } })
    if (USE_MOCK) {
      mockSetFavorite(productId, next)
      apply(next)
      toastFor()
      return
    }
    if (!tokens.access()) {
      toast({ kind: 'info', title: tx('Vui lòng đăng nhập để lưu sản phẩm yêu thích', 'Please sign in to save favourites', '즐겨찾기를 저장하려면 로그인하세요') })
      navigate(`/login?return=${encodeURIComponent(pathname + search)}`)
      return
    }
    apply(next) // lạc quan: đổi ngay, lỗi thì hoàn lại
    ;(next ? catalogApi.addFavorite(productId) : catalogApi.removeFavorite(productId)).then(
      toastFor,
      (e: Error) => { setOn(!next); emitFavoriteChange({ productId, on: !next }); onChange?.(!next); toast({ kind: 'info', title: e.message }) },
    )
  }
  const toggle = () => commit(!on)

  return (
    <Button variant="ghost" size="icon" className={className} aria-label={t.product.addFav} aria-pressed={on} onClick={toggle}>
      <motion.span
        key={on ? `on${burst}` : 'off'}
        initial={on ? { scale: 0.4 } : false}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 520, damping: 12 }}
        className="grid place-items-center"
      >
        <Heart className={on ? 'fill-red-500 text-red-500' : ''} />
      </motion.span>
      {burst > 0 && on && (
        <span key={burst} aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
          <motion.span
            initial={{ scale: 0.4, opacity: 0.55 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="absolute size-9 rounded-full border-2 border-red-400"
          />
          {BURST.map((b, i) => (
            <motion.span
              key={i}
              initial={{ x: 0, y: 0, scale: 0.3, opacity: 1 }}
              animate={{ x: b.x, y: b.y, scale: 1, opacity: 0 }}
              transition={{ duration: 0.6, delay: b.delay, ease: [0.16, 1, 0.3, 1] }}
              className="absolute"
            >
              <Heart style={{ width: b.size, height: b.size }} className="fill-red-500 text-red-500" />
            </motion.span>
          ))}
        </span>
      )}
    </Button>
  )
}
