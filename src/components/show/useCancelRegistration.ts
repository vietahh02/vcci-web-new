/** Cancel a show registration after asking: a signed-in account by its registration id, a guest by email + code. The browser's copy goes only once the BE agreed. */
import { invalidate, liveApi, tokens, USE_MOCK } from '@/api'
import { useToast } from '@/components/ui/overlay'
import type { useShowVisitor } from '@/lib/showReg'
import { useShowT } from '@/lib/showText'
import { tx } from '@/lib/tx'

export function useCancelRegistration(visitor: ReturnType<typeof useShowVisitor>) {
  const x = useShowT()
  const toast = useToast()
  return async (): Promise<boolean> => {
    const badge = visitor.badge
    if (!badge || !window.confirm(tx('Huỷ đăng ký tham gia Show này?', 'Cancel your registration for this show?', '이 쇼의 등록을 취소할까요?'))) return false
    try {
      if (!USE_MOCK) {
        if (tokens.access() && badge.visitorId) await liveApi.showCancelVisit(badge.visitorId)
        else await liveApi.showCancelByBadge(badge.email, badge.code)
        invalidate('myvisits')
      }
      visitor.cancelBadge()
      toast({ title: x.reg.cancelled, kind: 'info' })
      return true
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : x.reg.cancelReg, kind: 'info' })
      return false
    }
  }
}
