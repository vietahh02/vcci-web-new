/**
 * Price inquiries received by my booths, grouped by show (on-site booths and the internal booth of an ONLINE show alike).
 * A NEW inquiry can be answered once; the visitor gets the answer by email.
 */
import { MessageSquareReply } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { catalogApi } from '@/api'
import type { BoothInquiry, MyBooth } from '@/api/catalogApi'
import { useToast } from '@/components/ui/overlay'
import { Badge, Button, Skeleton, Textarea } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'
import { formatDate } from '@/lib/utils'

const STATUS = (): Record<string, string> => ({
  NEW: tx('Chưa trả lời', 'Not answered', '미답변'), REPLIED: tx('Đã trả lời', 'Answered', '답변 완료'), CLOSED: tx('Đã đóng', 'Closed', '종료'),
})

export function MyInquiries() {
  useI18n() // đăng ký đổi ngôn ngữ để tx() tính lại
  const [groups, setGroups] = useState<{ booth: MyBooth; items: BoothInquiry[] }[] | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    catalogApi.myBooths()
      .then((booths) => Promise.all(booths.map((b) => catalogApi.boothInquiries(b.id).then((items) => ({ booth: b, items }), () => ({ booth: b, items: [] })))))
      .then((all) => setGroups(all.filter((g) => g.items.length > 0)), (e: Error) => { setGroups([]); setError(e.message) })
  }, [])
  useEffect(load, [load])

  const open = (groups ?? []).reduce((n, g) => n + g.items.filter((i) => i.status === 'NEW').length, 0)

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-3 text-lg font-extrabold">
        {tx('Yêu cầu hỏi giá', 'Price inquiries', '가격 문의')}
        {open > 0 && <Badge>{open} {tx('chưa trả lời', 'to answer', '미답변')}</Badge>}
      </h2>
      {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!groups ? <Skeleton className="h-24" /> : groups.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{tx('Chưa có yêu cầu hỏi giá nào.', 'No price inquiries yet.', '가격 문의가 없습니다.')}</p>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.booth.id}>
              <p className="mb-2 text-sm font-semibold">{g.booth.showName}</p>
              <ul className="space-y-3">
                {g.items.map((i) => <InquiryItem key={i.id} inquiry={i} onReplied={load} />)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function InquiryItem({ inquiry: i, onReplied }: { inquiry: BoothInquiry; onReplied: () => void }) {
  const toast = useToast()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const send = () => {
    setBusy(true)
    catalogApi.replyInquiry(i.id, text.trim()).then(
      () => { setBusy(false); toast({ kind: 'success', title: tx('Đã gửi phản hồi qua email', 'Reply sent by email', '이메일로 답변을 보냈습니다') }); onReplied() },
      (e: Error) => { setBusy(false); toast({ kind: 'info', title: e.message }) },
    )
  }
  return (
    <li className="rounded-xl border p-4 text-sm" data-testid="my-inquiry">
      <div className="flex flex-wrap items-center gap-2">
        <b>{i.fromName || i.fromEmail}</b>
        <span className="text-muted-foreground">{i.fromEmail}</span>
        <Badge variant={i.status === 'NEW' ? 'default' : 'secondary'}>{STATUS()[i.status] ?? i.status}</Badge>
        {i.createdAt && <span className="ml-auto text-xs text-muted-foreground">{formatDate(i.createdAt)}</span>}
      </div>
      {(i.productName || i.quantity) && (
        <p className="mt-1 text-xs text-muted-foreground">{[i.productName, i.quantity && `${tx('Số lượng', 'Quantity', '수량')}: ${i.quantity}`].filter(Boolean).join(' · ')}</p>
      )}
      <p className="mt-2 whitespace-pre-line">{i.message}</p>
      {i.reply ? (
        <p className="mt-3 whitespace-pre-line rounded-lg bg-muted/60 p-3"><span className="font-semibold">{tx('Đã trả lời', 'Your reply', '답변')}: </span>{i.reply}</p>
      ) : i.status === 'NEW' && (
        <div className="mt-3 space-y-2">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} rows={3} placeholder={tx('Nhập phản hồi (giá, điều kiện, liên hệ...)', 'Write your reply (price, terms, contact...)', '답변 입력 (가격, 조건, 연락처...)')} />
          <Button size="sm" disabled={!text.trim() || busy} onClick={send}><MessageSquareReply /> {busy ? '…' : tx('Gửi phản hồi', 'Send reply', '답변 보내기')}</Button>
        </div>
      )}
    </li>
  )
}
