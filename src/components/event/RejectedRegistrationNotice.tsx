import { AlertTriangle } from 'lucide-react'
import { useMemo } from 'react'
import { USE_MOCK } from '@/api'
import { useMyRegistrations } from '@/api/eventApi'
import { useProfile } from '@/lib/profile'
import { tx } from '@/lib/tx'

/**
 * Khi đăng ký trước đó của tổ chức cho sự kiện này bị BTC từ chối (CMS), ev.myRegistration không còn (chỉ tính đăng ký
 * còn hiệu lực) nên trang chỉ hiện nút Đăng ký. Thông báo này cho biết lý do và rằng có thể đăng ký lại.
 * Dữ liệu: GET /api/event/registrations/my (đã có rejectReason).
 */
export function RejectedRegistrationNotice({ eventId }: { eventId: string }) {
  const { session } = useProfile()
  const mine = useMyRegistrations(!!session && !USE_MOCK).data
  const rejected = useMemo(() => (mine ?? []).filter((r) => r.eventId === eventId && r.status === 'REJECTED')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0], [mine, eventId])
  if (!rejected) return null
  return (
    <p className="mt-4 flex items-start gap-2 rounded-lg bg-muted p-3 text-xs text-foreground/90" data-testid="registration-rejected">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
      <span>
        {tx('Đăng ký trước của bạn đã bị Ban tổ chức từ chối', 'Your previous registration was declined by the organiser', '이전 등록이 주최측에 의해 거절되었습니다')}
        {rejected.rejectReason ? <>: <b>{rejected.rejectReason}</b></> : null}. {tx('Bạn có thể bổ sung thông tin và đăng ký lại.', 'You can update your details and register again.', '정보를 보완해 다시 등록할 수 있습니다.')}
      </span>
    </p>
  )
}
