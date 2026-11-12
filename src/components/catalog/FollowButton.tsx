/**
 * Follow / unfollow a business (BE: GET/POST/DELETE /api/me/follows/businesses/{id}, per account).
 * Shared by the product page's supplier card and the business profile. The label itself changes ("Theo dõi" → "Đang theo dõi",
 * "Bỏ theo dõi" on hover), so the state reads at a glance; a guest is sent to sign in and back; mock mode keeps it in memory.
 */
import { BadgeCheck, Plus, UserMinus } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { liveApi, tokens, USE_MOCK } from '@/api'
import { useToast } from '@/components/ui/overlay'
import { Button } from '@/components/ui/primitives'
import { useProfile } from '@/lib/profile'
import { tx } from '@/lib/tx'
import { cn } from '@/lib/utils'

export function FollowButton({ orgId, name, className }: { orgId: string; name: string; className?: string }) {
  const toast = useToast()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const { session } = useProfile()
  const [following, setFollowing] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (USE_MOCK || !session) { setFollowing(false); return }
    let alive = true
    liveApi.isFollowingBusiness(orgId).then((v) => { if (alive) setFollowing(v) }, () => undefined)
    return () => { alive = false }
  }, [orgId, session])

  const set = (next: boolean) => {
    const said = next
      ? { kind: 'success' as const, title: tx('Đã theo dõi doanh nghiệp', 'You are following this business', '기업을 팔로우했습니다'), description: name }
      : { kind: 'success' as const, title: tx('Đã bỏ theo dõi', 'Unfollowed', '팔로우를 취소했습니다'), description: name, action: { label: tx('Hoàn tác', 'Undo', '실행 취소'), onClick: () => set(true) } }
    if (USE_MOCK) { setFollowing(next); toast(said); return }
    if (!tokens.access()) {
      toast({ kind: 'info', title: tx('Vui lòng đăng nhập để theo dõi doanh nghiệp', 'Please sign in to follow businesses', '기업을 팔로우하려면 로그인하세요') })
      navigate(`/login?return=${encodeURIComponent(pathname + search)}`)
      return
    }
    setFollowing(next) // lạc quan: đổi ngay, lỗi thì hoàn lại
    setBusy(true)
    liveApi.followBusiness(orgId, next).then(
      () => toast(said),
      (err: Error) => { setFollowing(!next); toast({ kind: 'info', title: err.message }) },
    ).finally(() => setBusy(false))
  }

  return (
    <Button
      variant="outline"
      aria-pressed={following}
      disabled={busy}
      onClick={() => set(!following)}
      className={cn('group rounded-full transition-all duration-300', following ? 'border-primary/40 bg-primary-soft text-primary hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive' : 'hover:-translate-y-0.5', className)}
    >
      <motion.span key={following ? 'on' : 'off'} initial={{ scale: 0.4, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 460, damping: 14 }} className="grid place-items-center">
        {following ? <><BadgeCheck className="group-hover:hidden" /><UserMinus className="hidden group-hover:block" /></> : <Plus />}
      </motion.span>
      {following
        ? <><span className="group-hover:hidden">{tx('Đang theo dõi', 'Following', '팔로우 중')}</span><span className="hidden group-hover:inline">{tx('Bỏ theo dõi', 'Unfollow', '팔로우 취소')}</span></>
        : tx('Theo dõi', 'Follow', '팔로우')}
    </Button>
  )
}
