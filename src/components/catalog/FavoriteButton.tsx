/**
 * Favourite toggle shared by the product page and the Show product tab: stored per account on the BE in live mode, toast-only in mock mode.
 * A guest is sent to sign in and back. `initial` lets a list read all its ids in one request; without it the button asks for its own.
 */
import { Heart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { catalogApi, tokens, USE_MOCK } from '@/api'
import { useToast } from '@/components/ui/overlay'
import { Button } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'

export function FavoriteButton({ productId, initial, className }: { productId: string; initial?: boolean; className?: string }) {
  const { t } = useI18n()
  const toast = useToast()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const [on, setOn] = useState(initial ?? false)
  useEffect(() => {
    if (initial !== undefined) { setOn(initial); return }
    if (USE_MOCK || !tokens.access()) return
    catalogApi.favoriteIds([productId]).then((s) => setOn(s.has(productId)), () => undefined)
  }, [productId, initial])
  const toggle = () => {
    if (USE_MOCK) { toast({ kind: 'success', title: t.product.addFav }); return }
    if (!tokens.access()) {
      toast({ kind: 'info', title: tx('Vui lòng đăng nhập để lưu sản phẩm yêu thích', 'Please sign in to save favourites', '즐겨찾기를 저장하려면 로그인하세요') })
      navigate(`/login?return=${encodeURIComponent(pathname + search)}`)
      return
    }
    const next = !on
    setOn(next)
    ;(next ? catalogApi.addFavorite(productId) : catalogApi.removeFavorite(productId)).then(
      () => toast({ kind: 'success', title: next ? t.product.addFav : tx('Đã bỏ khỏi yêu thích', 'Removed from favourites', '즐겨찾기에서 제거됨') }),
      (e: Error) => { setOn(!next); toast({ kind: 'info', title: e.message }) },
    )
  }
  return (
    <Button variant="ghost" size="icon" className={className} aria-label={t.product.addFav} aria-pressed={on} onClick={toggle}>
      <Heart className={on ? 'fill-red-500 text-red-500' : ''} />
    </Button>
  )
}
