/** "View my card" and "Cancel registration" for the signed-in organisation's registration (live mode). Uses GET /registrations/{id} and POST .../cancel. */
import { Ticket, XCircle } from 'lucide-react'
import { useState } from 'react'
import { fetchRegistration, cancelMyRegistration } from '@/api/eventApi'
import { invalidate } from '@/api/hooks'
import type { RegistrationFull } from '@/api/adapters/eventExtra'
import { FakeQr } from '@/components/event/visuals'
import { Dialog, DialogClose, DialogContent, useToast } from '@/components/ui/overlay'
import { Badge, Button } from '@/components/ui/primitives'
import type { EventItem } from '@/data/mock'
import { unmarkRegistered } from '@/lib/eventUser'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'
import { formatDate } from '@/lib/utils'

const statusText = (s: string) => ({
  CONFIRMED: tx('Đã xác nhận', 'Confirmed', '확정'),
  PENDING_PAYMENT: tx('Chờ thanh toán', 'Awaiting payment', '결제 대기'),
  PENDING_APPROVAL: tx('Chờ duyệt', 'Pending approval', '승인 대기'),
  REJECTED: tx('Bị từ chối', 'Rejected', '거절됨'),
  CANCELED: tx('Đã huỷ', 'Cancelled', '취소됨'),
} as Record<string, string>)[s] ?? s

export function MyRegistrationActions({ ev, onChanged }: { ev: EventItem; onChanged?: () => void }) {
  const { L, locale } = useI18n()
  const toast = useToast()
  const my = ev.myRegistration
  const [cardOpen, setCardOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reg, setReg] = useState<RegistrationFull | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  if (!my) return null
  const canCancel = ev.eventStatus !== 'ENDED'

  const openCard = () => {
    setCardOpen(true)
    setErr(null)
    setBusy(true)
    fetchRegistration(my.id).then((r) => { setReg(r); setBusy(false) }, (e: Error) => { setErr(e.message); setBusy(false) })
  }
  const doCancel = () => {
    setBusy(true)
    cancelMyRegistration(my.id).then(() => {
      setBusy(false)
      setCancelOpen(false)
      unmarkRegistered(ev.id)
      invalidate('ev:'); invalidate('events'); invalidate('myreg'); invalidate('evpart:')
      toast({ kind: 'success', title: tx('Đã huỷ đăng ký', 'Registration cancelled', '등록이 취소되었습니다') })
      onChanged?.()
    }, (e: Error) => { setBusy(false); setErr(e.message); toast({ kind: 'info', title: e.message }) })
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2" data-testid="my-registration">
      <Badge variant="outline" className="border-white/30 text-white">{statusText(my.status)}</Badge>
      <Button size="sm" variant="white" onClick={openCard}><Ticket /> {tx('Xem thẻ', 'View my card', '내 배지 보기')}</Button>
      {canCancel && <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={() => { setErr(null); setCancelOpen(true) }}><XCircle /> {tx('Huỷ đăng ký', 'Cancel registration', '등록 취소')}</Button>}

      <Dialog open={cardOpen} onOpenChange={setCardOpen}>
        <DialogContent title={tx('Thẻ tham dự', 'Your badge', '참가 배지')} description={L(ev.title)}>
          <div className="p-6">
            {busy && <p className="text-sm text-muted-foreground">…</p>}
            {err && <p className="text-sm text-destructive">{err}</p>}
            {reg && (
              <div className="space-y-4 text-foreground">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-semibold tracking-wider">{reg.regCode}</span>
                  <Badge variant={reg.status === 'CONFIRMED' ? 'success' : 'muted'}>{statusText(reg.status)}</Badge>
                </div>
                {reg.badge ? (
                  <div className="grid grid-cols-[1fr_120px] gap-5 rounded-2xl border p-4">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-extrabold">{reg.badge.name || '—'}</p>
                      <p className="truncate text-sm text-muted-foreground">{reg.badge.jobTitle}</p>
                      <p className="mt-2 truncate font-semibold">{reg.badge.company}</p>
                      {reg.badge.dates.length > 0 && <p className="mt-2 text-xs text-muted-foreground">{reg.badge.dates.map((d) => formatDate(`${d}T12:00:00`, locale, { day: '2-digit', month: '2-digit', year: 'numeric' })).join(' · ')}</p>}
                    </div>
                    <div className="grid aspect-square place-items-center rounded-xl border bg-white p-2"><FakeQr seed={reg.badge.qrToken || reg.regCode} /></div>
                  </div>
                ) : (
                  <p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
                    {reg.status === 'REJECTED' && reg.rejectReason ? `${tx('Lý do từ chối', 'Reason', '거절 사유')}: ${reg.rejectReason}` : tx('Thẻ tham dự sẽ được cấp khi đăng ký được xác nhận.', 'Your badge is issued once the registration is confirmed.', '등록이 확정되면 배지가 발급됩니다.')}
                  </p>
                )}
                {reg.needPayment && reg.status === 'PENDING_PAYMENT' && <p className="text-sm text-gold">{tx('Đăng ký còn chờ biên lai thanh toán.', 'This registration is still waiting for a payment receipt.', '결제 영수증을 기다리고 있습니다.')}</p>}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent title={tx('Huỷ đăng ký?', 'Cancel registration?', '등록을 취소할까요?')} description={L(ev.title)}>
          <div className="space-y-4 p-6 text-foreground">
            <p className="text-sm text-muted-foreground">{tx('Chỗ của bạn sẽ được nhả cho người khác. Việc hoàn phí (nếu có) do Ban Tổ chức xử lý ngoài hệ thống.', 'Your seat will be released. Any refund is handled by the organizers outside the platform.', '자리가 반환됩니다. 환불은 주최 측이 별도로 처리합니다.')}</p>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <div className="flex justify-end gap-2">
              <DialogClose asChild><Button variant="ghost" disabled={busy}>{tx('Giữ đăng ký', 'Keep it', '유지')}</Button></DialogClose>
              <Button disabled={busy} onClick={doCancel}>{tx('Xác nhận huỷ', 'Confirm cancel', '취소 확정')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
