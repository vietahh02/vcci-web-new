import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { myProducts, type MyProduct } from '@/api/catalogApi'
import type { Payload } from '@/api/chat'
import { Button, Field, Input, Textarea } from '@/components/ui/primitives'
import { DateField, DateTimeField } from '@/components/ui/DateField'
import { Dialog, DialogContent } from '@/components/ui/overlay'
import { tx } from '@/lib/tx'

interface Base {
  open: boolean
  onOpenChange: (v: boolean) => void
}

function FormBody({ onSubmit, busy, submit, children }: { onSubmit: () => void; busy?: boolean; submit: string; children: ReactNode }) {
  return (
    <form
      onSubmit={(e: FormEvent) => {
        e.preventDefault()
        onSubmit()
      }}
      className="space-y-3 p-6"
    >
      {children}
      <Button type="submit" disabled={busy} className="w-full">{submit}</Button>
    </form>
  )
}

export function RfqDialog({ open, onOpenChange, onSend }: Base & { onSend: (p: Payload) => Promise<boolean> }) {
  const [f, setF] = useState({ item: '', quantity: '', incoterm: 'FOB', deadline: '', note: '' })
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }))
  const submit = async () => {
    setBusy(true)
    const ok = await onSend({ ...f, deadline: f.deadline || undefined })
    setBusy(false)
    if (ok) {
      setF({ item: '', quantity: '', incoterm: 'FOB', deadline: '', note: '' })
      onOpenChange(false)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={tx('Yêu cầu báo giá (RFQ)', 'Request for quote (RFQ)', '견적 요청 (RFQ)')}>
        <FormBody onSubmit={submit} busy={busy} submit={tx('Gửi yêu cầu', 'Send request', '요청 보내기')}>
          <Field label={tx('Hàng hoá', 'Item', '품목')} htmlFor="rfq-item"><Input id="rfq-item" placeholder={tx('VD: Cà phê Robusta S18', 'e.g. Robusta coffee S18', '예: 로부스타 커피 S18')} required value={f.item} onChange={set('item')} maxLength={200} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={tx('Số lượng', 'Quantity', '수량')} htmlFor="rfq-qty"><Input id="rfq-qty" placeholder={tx('VD: 2 container 20ft', 'e.g. 2 × 20ft containers', '예: 20ft 컨테이너 2개')} required value={f.quantity} onChange={set('quantity')} maxLength={60} /></Field>
            <Field label="Incoterm" htmlFor="rfq-inc"><Input id="rfq-inc" placeholder={tx('VD: FOB, CIF', 'e.g. FOB, CIF', '예: FOB, CIF')} value={f.incoterm} onChange={set('incoterm')} maxLength={20} /></Field>
          </div>
          <Field label={tx('Hạn trả lời', 'Reply by', '회신 기한')} htmlFor="rfq-dl"><DateField id="rfq-dl" value={f.deadline} onChange={set('deadline')} /></Field>
          <Field label={tx('Ghi chú', 'Note', '메모')} htmlFor="rfq-note"><Textarea id="rfq-note" placeholder={tx('Quy cách, đóng gói, cảng nhận hàng…', 'Spec, packing, destination port…', '규격, 포장, 도착항…')} value={f.note} onChange={set('note')} maxLength={1000} /></Field>
        </FormBody>
      </DialogContent>
    </Dialog>
  )
}

export function AppointmentDialog({ open, onOpenChange, onSend }: Base & { onSend: (p: Payload) => Promise<boolean> }) {
  const [f, setF] = useState({ title: '', start: '', end: '', location: '' })
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }))
  const submit = async () => {
    setBusy(true)
    const ok = await onSend({
      title: f.title,
      startAt: new Date(f.start).toISOString(),
      endAt: f.end ? new Date(f.end).toISOString() : undefined,
      location: f.location || undefined,
    })
    setBusy(false)
    if (ok) {
      setF({ title: '', start: '', end: '', location: '' })
      onOpenChange(false)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={tx('Đặt lịch hẹn', 'Schedule an appointment', '약속 잡기')}>
        <FormBody onSubmit={submit} busy={busy} submit={tx('Gửi lịch hẹn', 'Send appointment', '약속 보내기')}>
          <Field label={tx('Nội dung', 'Title', '제목')} htmlFor="ap-title"><Input id="ap-title" placeholder={tx('VD: Trao đổi mẫu và giá FOB', 'e.g. Discuss samples and FOB price', '예: 샘플 및 FOB 가격 논의')} required value={f.title} onChange={set('title')} maxLength={200} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={tx('Bắt đầu', 'Starts', '시작')} htmlFor="ap-start"><DateTimeField id="ap-start" required value={f.start} onChange={set('start')} /></Field>
            <Field label={tx('Kết thúc', 'Ends', '종료')} htmlFor="ap-end"><DateTimeField id="ap-end" value={f.end} min={f.start} onChange={set('end')} /></Field>
          </div>
          <Field label={tx('Địa điểm / liên kết họp', 'Location / meeting link', '장소 / 회의 링크')} htmlFor="ap-loc"><Input id="ap-loc" placeholder={tx('Địa chỉ văn phòng hoặc link Google Meet/Zoom', 'Office address or a Google Meet/Zoom link', '사무실 주소 또는 Meet/Zoom 링크')} value={f.location} onChange={set('location')} maxLength={300} /></Field>
        </FormBody>
      </DialogContent>
    </Dialog>
  )
}

/** Chọn sản phẩm của chính DN để gửi thẻ sản phẩm. */
export function ProductDialog({ open, onOpenChange, onSend }: Base & { onSend: (p: Payload) => Promise<boolean> }) {
  const [items, setItems] = useState<MyProduct[] | null>(null)
  const [err, setErr] = useState(false)
  useEffect(() => {
    if (!open) return
    myProducts('', 'visible', 0, 30).then((p) => setItems(p.items), () => setErr(true))
  }, [open])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={tx('Chia sẻ sản phẩm của bạn', 'Share one of your products', '내 제품 공유')}>
        <ul className="max-h-80 space-y-1 overflow-y-auto p-3">
          {err && <li className="p-3 text-sm text-destructive">{tx('Không tải được sản phẩm.', 'Could not load products.', '제품을 불러올 수 없습니다.')}</li>}
          {items?.length === 0 && <li className="p-3 text-sm text-muted-foreground">{tx('Chưa có sản phẩm đang hiển thị.', 'No visible products yet.', '표시 중인 제품이 없습니다.')}</li>}
          {items?.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={async () => { if (await onSend({ productId: p.id })) onOpenChange(false) }}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-muted"
              >
                {p.productImages[0] ? <img src={p.productImages[0]} alt="" className="size-10 rounded-md object-cover" /> : <span className="size-10 rounded-md bg-muted" />}
                <span className="min-w-0"><strong className="block truncate text-sm">{p.productName}</strong><span className="text-xs text-muted-foreground">{p.productCode}</span></span>
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}

export function ReportDialog({ open, onOpenChange, onSend }: Base & { onSend: (reason: string) => Promise<boolean> }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={tx('Báo cáo vi phạm', 'Report a violation', '위반 신고')} description={tx('VCCI sẽ tạo yêu cầu hỗ trợ để xem xét hội thoại này.', 'VCCI will open a support ticket to review this conversation.', 'VCCI가 이 대화를 검토하기 위한 지원 요청을 생성합니다.')}>
        <FormBody
          busy={busy || !reason.trim()}
          submit={tx('Gửi báo cáo', 'Send report', '신고 보내기')}
          onSubmit={async () => {
            setBusy(true)
            const ok = await onSend(reason.trim())
            setBusy(false)
            if (ok) {
              setReason('')
              onOpenChange(false)
            }
          }}
        >
          <Field label={tx('Lý do', 'Reason', '사유')} htmlFor="rp-reason"><Textarea id="rp-reason" placeholder={tx('Mô tả vấn đề: nội dung sai, spam, lừa đảo…', 'Describe the problem: wrong content, spam, fraud…', '문제 설명: 잘못된 내용, 스팸, 사기…')} required value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} /></Field>
        </FormBody>
      </DialogContent>
    </Dialog>
  )
}

/** Hộp xác nhận ngắn (chặn đối tác...). */
export function ConfirmDialog({ open, onOpenChange, title, description, confirm, onConfirm }: Base & { title: string; description: string; confirm: string; onConfirm: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} description={description}>
        <div className="flex justify-end gap-2 p-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tx('Huỷ', 'Cancel', '취소')}</Button>
          <Button onClick={() => { onConfirm(); onOpenChange(false) }}>{confirm}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
