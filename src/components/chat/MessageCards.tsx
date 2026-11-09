import { CalendarClock, CheckSquare, Download, FileText, Link2, Package, Square } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { chatApi } from '@/api/chat'
import type { BizChat, WidgetMsg } from '@/components/layout/useBizChat'
import { dateTime, tx } from '@/lib/tx'
import { cn } from '@/lib/utils'
import { fmtMoney, fmtSize } from './chatFormat'

const str = (v: unknown) => (v == null ? '' : String(v))
const card = 'w-64 max-w-full space-y-2 rounded-xl border bg-background p-3 text-left text-foreground'

/** Tệp đính kèm: ảnh -> xem trước, ghi âm -> trình phát, còn lại -> thẻ tải về (link 30 phút lấy khi cần). */
function AttachmentCard({ cid, m }: { cid: string | null; m: WidgetMsg }) {
  const p = m.payload ?? {}
  const type = str(p.contentType)
  const inline = type.startsWith('image/') || type.startsWith('audio/')
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const id = m.serverId
  useEffect(() => {
    if (!inline || !cid || id == null) return
    let alive = true
    chatApi.attachmentUrl(cid, id).then((r) => alive && setUrl(r.url), () => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [inline, cid, id])
  const download = async () => {
    if (!cid || id == null) return
    try {
      window.open((await chatApi.attachmentUrl(cid, id)).url, '_blank', 'noopener')
    } catch {
      setFailed(true)
    }
  }
  if (type.startsWith('image/') && url) return <img src={url} alt={str(p.name)} className="max-h-60 max-w-full rounded-lg object-cover" onError={() => setFailed(true)} />
  if (type.startsWith('audio/') && url) return <audio src={url} controls className="h-10 w-60 max-w-full" aria-label={tx('Tin nhắn thoại', 'Voice message', '음성 메시지')} />
  return (
    <button type="button" onClick={download} disabled={id == null} className="flex w-64 max-w-full items-center gap-3 rounded-xl border bg-background p-3 text-left text-foreground transition hover:border-primary">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"><FileText className="size-5" /></span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-[13px]">{str(p.name)}</strong>
        <span className="text-xs text-muted-foreground">{failed ? tx('Không tải được tệp', 'Could not load file', '파일을 불러올 수 없음') : fmtSize(Number(p.size) || 0)}</span>
      </span>
      <Download className="size-4 shrink-0 text-muted-foreground" aria-label={tx('Tải về', 'Download', '다운로드')} />
    </button>
  )
}

const rfqLabel = (k: string) =>
  k === 'item' ? tx('Hàng hoá', 'Item', '품목')
    : k === 'quantity' ? tx('Số lượng', 'Quantity', '수량')
      : k === 'incoterm' ? 'Incoterm'
        : tx('Hạn trả lời', 'Reply by', '회신 기한')

/** Nội dung riêng của từng loại tin; TEXT/khác trả null để ChatMessages tự vẽ chữ. */
export function MessageCard({ chat, m, onReply }: { chat: BizChat; m: WidgetMsg; onReply?: (m: WidgetMsg) => void }) {
  const p = m.payload ?? {}
  switch (m.kind) {
    case 'ATTACHMENT':
      return <AttachmentCard cid={chat.activeId} m={m} />
    case 'PRODUCT':
      return (
        <div className={card}>
          <div className="flex gap-3">
            {str(p.imageUrl) ? <img src={str(p.imageUrl)} alt="" className="size-14 shrink-0 rounded-lg object-cover" /> : <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-muted"><Package className="size-6 text-muted-foreground" /></span>}
            <div className="min-w-0">
              <strong className="line-clamp-2 text-[13px]">{str(p.name)}</strong>
              <p className="text-xs text-muted-foreground">FOB {fmtMoney(Number(p.priceFob) || null)} · MOQ {fmtMoney(Number(p.moq) || null)} {str(p.unit)}</p>
            </div>
          </div>
          <Link to={`/products/${str(p.productId)}`} className="block rounded-lg bg-primary-soft py-1.5 text-center text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground">{tx('Xem sản phẩm', 'View product', '제품 보기')}</Link>
        </div>
      )
    case 'RFQ': {
      const answered = str(p.status) === 'ANSWERED'
      return (
        <div className={card}>
          <div className="flex items-center justify-between gap-2">
            <strong className="text-[13px]">{tx('Yêu cầu báo giá', 'Request for quote', '견적 요청')} {str(p.code)}</strong>
            <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-semibold', answered ? 'bg-success/15 text-success' : 'bg-gold-soft text-gold')}>
              {answered ? tx('Đã báo giá', 'Answered', '답변됨') : tx('Chờ báo giá', 'Pending', '대기')}
            </span>
          </div>
          {str(p.requestCode) && (
            <p className="mt-1 text-[11px] text-muted-foreground">{tx('Cho yêu cầu', 'For request', '요청')} <b className="text-foreground">{str(p.requestCode)}</b>{str(p.requestName) ? ` · ${str(p.requestName)}` : ''}</p>
          )}
          {str(p.productName) && (
            <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-muted/60 p-2">
              {str(p.imageUrl) && <img src={str(p.imageUrl)} alt="" className="size-10 shrink-0 rounded-lg object-cover" />}
              <div className="min-w-0 text-xs">
                <p className="truncate font-semibold">{str(p.productName)}</p>
                {p.priceFob != null && <p className="text-muted-foreground">FOB {String(p.priceFob)}{str(p.unit) ? ` / ${str(p.unit)}` : ''}</p>}
              </div>
            </div>
          )}
          <dl className="space-y-0.5 text-xs">
            {['item', 'quantity', 'incoterm', 'deadline'].filter((k) => str(p[k])).map((k) => (
              <div key={k} className="flex justify-between gap-3"><dt className="text-muted-foreground">{rfqLabel(k)}</dt><dd className="text-right font-medium">{str(p[k])}</dd></div>
            ))}
          </dl>
          {str(p.note) && <p className="text-xs text-muted-foreground">{str(p.note)}</p>}
          {!m.mine && !answered && onReply && (
            <button type="button" onClick={() => onReply(m)} className="w-full rounded-lg bg-primary py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover">{tx('Gửi báo giá', 'Send quote', '견적 보내기')}</button>
          )}
        </div>
      )
    }
    case 'CHECKLIST': {
      const items = (Array.isArray(p.items) ? p.items : []) as { label: string; done: boolean }[]
      const done = items.filter((i) => i.done).length
      return (
        <div className={card}>
          <strong className="text-[13px]">{str(p.title)}</strong>
          <ul className="space-y-1">
            {items.map((it, i) => (
              <li key={i}>
                <button type="button" role="checkbox" aria-checked={it.done} disabled={m.serverId == null} onClick={() => m.serverId != null && void chat.toggleChecklist(m.serverId, i, !it.done)} className="flex w-full items-start gap-2 text-left text-xs">
                  {it.done ? <CheckSquare className="mt-px size-4 shrink-0 text-success" /> : <Square className="mt-px size-4 shrink-0 text-muted-foreground" />}
                  <span className={cn(it.done && 'text-muted-foreground line-through')}>{it.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={done} aria-valuemax={items.length}>
            <div className="h-full bg-success" style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }} />
          </div>
          <span className="text-[11px] text-muted-foreground">{done}/{items.length}</span>
        </div>
      )
    }
    case 'LINK': {
      let host = str(p.url)
      try {
        host = new URL(host).host
      } catch {
        /* giữ nguyên */
      }
      return (
        <a href={str(p.url)} target="_blank" rel="noopener noreferrer" className={cn(card, 'block transition hover:border-primary')}>
          <span className="flex items-center gap-1.5 text-xs text-primary"><Link2 className="size-3.5" /> {host}</span>
          <strong className="block text-[13px]">{str(p.title) || str(p.url)}</strong>
          {str(p.description) && <span className="line-clamp-2 text-xs text-muted-foreground">{str(p.description)}</span>}
        </a>
      )
    }
    case 'APPOINTMENT': {
      const s = new Date(str(p.startAt))
      return (
        <div className={card}>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-primary"><CalendarClock className="size-3.5" /> {tx('Lịch hẹn', 'Appointment', '약속')}</span>
          <strong className="block text-[13px]">{str(p.title)}</strong>
          <span className="block text-xs text-muted-foreground">{Number.isNaN(s.getTime()) ? str(p.startAt) : dateTime(s)}{str(p.location) ? ` · ${str(p.location)}` : ''}</span>
        </div>
      )
    }
    default:
      return null
  }
}
