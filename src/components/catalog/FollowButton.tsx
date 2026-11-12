/**
 * Follow / unfollow a business (BE: GET/POST/DELETE /api/me/follows/businesses/{id}, per account).
 * Shared by the product page's supplier card, the business profile and the "Following" page (icon variant). The label itself changes
 * ("Theo dõi" → "Đang theo dõi", "Bỏ theo dõi" on hover), so the state reads at a glance; a guest is sent to sign in and back;
 * mock mode keeps it in localStorage. Every change is broadcast (`emitFollowChange`) so counters and lists stay in step.
 */
import { BadgeCheck, Plus, UserMinus } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { liveApi, tokens, USE_MOCK } from '@/api'
import { useToast } from '@/components/ui/overlay'
import { Button } from '@/components/ui/primitives'
import { emitFollowChange, mockFollowIds, mockSetFollow } from '@/lib/follows'
import { useProfile } from '@/lib/profile'
import { tx } from '@/lib/tx'
import { cn } from '@/lib/utils'

export function FollowButton({ orgId, name, className, initial, variant = 'full' }: { orgId: string; name: string; className?: string; initial?: boolean; variant?: 'full' | 'icon' }) {
  const toast = useToast()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const { session } = useProfile()
  const [following, setFollowing] = useState(initial ?? false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (initial !== undefined) { setFollowing(initial); return }
    if (USE_MOCK) { setFollowing(mockFollowIds().includes(orgId)); return }
    if (!session) { setFollowing(false); return }
    let alive = true
    liveApi.isFollowingBusiness(orgId).then((v) => { if (alive) setFollowing(v) }, () => undefined)
    return () => { alive = false }
  }, [orgId, session, initial])

  const apply = (next: boolean) => { setFollowing(next); emitFollowChange({ orgId, on: next }) }
  const set = (next: boolean) => {
    const said = next
      ? { kind: 'success' as const, title: tx('Đã theo dõi doanh nghiệp', 'You are following this business', '기업을 팔로우했습니다'), description: name }
      : { kind: 'success' as const, title: tx('Đã bỏ theo dõi', 'Unfollowed', '팔로우를 취소했습니다'), description: name, action: { label: tx('Hoàn tác', 'Undo', '실행 취소'), onClick: () => set(true) } }
    if (USE_MOCK) { mockSetFollow(orgId, next); apply(next); toast(said); return }
    if (!tokens.access()) {
      toast({ kind: 'info', title: tx('Vui lòng đăng nhập để theo dõi doanh nghiệp', 'Please sign in to follow businesses', '기업을 팔로우하려면 로그인하세요') })
      navigate(`/login?return=${encodeURIComponent(pathname + search)}`)
      return
    }
    apply(next) // lạc quan: đổi ngay, lỗi thì hoàn lại
    setBusy(true)
    liveApi.followBusiness(orgId, next).then(
      () => toast(said),
      (err: Error) => { setFollowing(!next); emitFollowChange({ orgId, on: !next }); toast({ kind: 'info', title: err.message }) },
    ).finally(() => setBusy(false))
  }

  const mark = (
    <motion.span key={following ? 'on' : 'off'} initial={{ scale: 0.4, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 460, damping: 14 }} className="grid place-items-center">
      {following ? <><BadgeCheck className="group-hover:hidden" /><UserMinus className="hidden group-hover:block" /></> : <Plus />}
    </motion.span>
  )
  const label = following ? tx('Bỏ theo dõi', 'Unfollow', '팔로우 취소') : tx('Theo dõi', 'Follow', '팔로우')
  const tone = following
    ? 'border-primary/40 bg-primary-soft text-primary hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive'
    : 'hover:-translate-y-0.5'

  if (variant === 'icon') {
    return (
      <Button variant="outline" size="icon" aria-pressed={following} aria-label={label} title={label} disabled={busy} onClick={() => set(!following)} className={cn('group rounded-full bg-white/90 shadow-sm backdrop-blur transition-all duration-300 dark:bg-card/90', tone, className)}>
        {mark}
      </Button>
    )
  }
  return (
    <Button variant="outline" aria-pressed={following} disabled={busy} onClick={() => set(!following)} className={cn('group rounded-full transition-all duration-300', tone, className)}>
      {mark}
      {following
        ? <><span className="group-hover:hidden">{tx('Đang theo dõi', 'Following', '팔로우 중')}</span><span className="hidden group-hover:inline">{label}</span></>
        : label}
    </Button>
  )
}
