import { CalendarClock, FileText, Image as ImageIcon, Mic, Package, Paperclip, Send, Smile, Square, X } from 'lucide-react'
import { useRef, useState, type KeyboardEvent } from 'react'
import type { ReplyRef } from '@/api/chat'
import type { BizChat, WidgetMsg } from '@/components/layout/useBizChat'
import { tx } from '@/lib/tx'
import { cn } from '@/lib/utils'
import { AppointmentDialog, ProductDialog, RfqDialog } from './ChatDialogs'

const EMOJIS = ['😀', '😊', '😂', '😍', '👍', '🙏', '👏', '🎉', '❤️', '🔥', '✅', '😮', '😢', '🤝', '👌', '💼']

const toReplyRef = (m: WidgetMsg): ReplyRef => ({ messageId: m.serverId!, senderName: m.senderName, messageKind: m.kind, body: m.text || m.kind })

/**
 * Khung soạn tin dùng chung (widget + trang Tin nhắn): tệp, ảnh, emoji, ghi âm (MediaRecorder -> webm), thanh trả lời.
 * `full` thêm chia sẻ sản phẩm / RFQ / lịch hẹn (chỉ trang Tin nhắn B2B).
 */
export function ChatComposer({
  chat, disabled, reply, onClearReply, placeholder, full = false, chips, chipSends = false, accent = 'bg-primary hover:bg-primary-hover', compact = false, initialDraft = '',
}: {
  chat: BizChat
  disabled: boolean
  reply: WidgetMsg | null
  onClearReply: () => void
  placeholder: string
  full?: boolean
  chips?: [string, string][]
  chipSends?: boolean
  accent?: string
  compact?: boolean
  /** Câu mở đầu điền sẵn khi mở hội thoại (khung soạn gắn key theo hội thoại nên đổi hội thoại là nhận giá trị mới). */
  initialDraft?: string
}) {
  const [draft, setDraft] = useState(initialDraft)
  const [emoji, setEmoji] = useState(false)
  const [rec, setRec] = useState<{ stop: () => void } | null>(null)
  const [dlg, setDlg] = useState<'rfq' | 'appt' | 'product' | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLInputElement>(null)
  const replyRef = reply?.serverId != null ? toReplyRef(reply) : null

  const send = (body: string) => {
    if (!body.trim() || disabled) return
    void chat.send(body, undefined, replyRef)
    setDraft('')
    onClearReply()
  }
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(draft)
    }
  }
  const pickFile = (f?: File | null) => {
    if (f && !disabled) {
      void chat.sendFile(f, f.name, replyRef)
      onClearReply()
    }
  }
  const toggleRecord = async () => {
    if (rec) return rec.stop()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      const parts: Blob[] = []
      mr.ondataavailable = (e) => parts.push(e.data)
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        setRec(null)
        const blob = new Blob(parts, { type: 'audio/webm' })
        if (blob.size > 0) void chat.sendFile(blob, `voice-${Date.now()}.webm`, replyRef)
        onClearReply()
      }
      mr.start()
      setRec({ stop: () => mr.stop() })
    } catch {
      chat.setError(tx('Không truy cập được micro.', 'Could not access the microphone.', '마이크에 접근할 수 없습니다.'))
    }
  }
  const tool = 'grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50'
  const sendRich = (kind: 'RFQ' | 'APPOINTMENT' | 'PRODUCT') => (payload: Record<string, unknown>) => chat.sendRich(kind, payload, undefined, replyRef)

  return (
    <div className={cn('shrink-0 space-y-2 border-t bg-card', compact ? 'p-3' : 'px-5 pb-4 pt-3')}>
      {chips && chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map(([label, text]) => (
            <button key={label} type="button" disabled={disabled} onClick={() => (chipSends ? send(text) : setDraft(text))} className="h-8 rounded-full border bg-muted/50 px-3 text-[13px] font-medium text-foreground/80 transition hover:border-primary hover:text-primary disabled:opacity-50">{label}</button>
          ))}
        </div>
      )}
      {reply && (
        <div className="flex items-center gap-2 rounded-lg border-l-2 border-primary bg-muted px-3 py-1.5 text-xs">
          <span className="min-w-0 flex-1 truncate"><strong>{tx('Trả lời', 'Replying to', '답장')} {reply.senderName ?? ''}</strong> · {reply.text || reply.kind}</span>
          <button type="button" onClick={onClearReply} aria-label={tx('Bỏ trả lời', 'Cancel reply', '답장 취소')}><X className="size-3.5" /></button>
        </div>
      )}
      {rec && <p className="flex items-center gap-2 text-xs text-destructive" role="status"><span className="size-2 animate-pulse rounded-full bg-destructive" /> {tx('Đang ghi âm… bấm nút dừng để gửi', 'Recording… press stop to send', '녹음 중… 정지를 눌러 전송')}</p>}
      <div className="flex items-end gap-1">
        <input ref={fileRef} type="file" hidden onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = '' }} />
        <input ref={imgRef} type="file" accept="image/*" hidden onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = '' }} />
        <button type="button" disabled={disabled} onClick={() => fileRef.current?.click()} className={tool} aria-label={tx('Đính kèm tệp', 'Attach a file', '파일 첨부')}><Paperclip className="size-4" /></button>
        <button type="button" disabled={disabled} onClick={() => imgRef.current?.click()} className={tool} aria-label={tx('Gửi ảnh', 'Send an image', '이미지 보내기')}><ImageIcon className="size-4" /></button>
        {full && (
          <>
            <button type="button" disabled={disabled} onClick={() => setDlg('product')} className={tool} aria-label={tx('Chia sẻ sản phẩm', 'Share a product', '제품 공유')}><Package className="size-4" /></button>
            <button type="button" disabled={disabled} onClick={() => setDlg('rfq')} className={tool} aria-label={tx('Gửi yêu cầu báo giá', 'Send an RFQ', '견적 요청 보내기')}><FileText className="size-4" /></button>
            <button type="button" disabled={disabled} onClick={() => setDlg('appt')} className={tool} aria-label={tx('Đặt lịch hẹn', 'Schedule an appointment', '약속 잡기')}><CalendarClock className="size-4" /></button>
          </>
        )}
        <button type="button" disabled={disabled} onClick={() => void toggleRecord()} className={cn(tool, rec && 'bg-destructive/10 text-destructive')} aria-label={rec ? tx('Dừng và gửi', 'Stop and send', '정지 후 전송') : tx('Ghi âm', 'Record voice', '음성 녹음')}>
          {rec ? <Square className="size-4" /> : <Mic className="size-4" />}
        </button>
        <div className="relative">
          <button type="button" disabled={disabled} onClick={() => setEmoji((v) => !v)} className={tool} aria-label="Emoji" aria-expanded={emoji}><Smile className="size-4" /></button>
          {emoji && (
            <div className="absolute bottom-full right-0 z-20 mb-2 grid w-48 grid-cols-4 gap-1 rounded-xl border bg-popover p-2 shadow-lg">
              {EMOJIS.map((e) => (
                <button key={e} type="button" onClick={() => { setDraft((d) => d + e); setEmoji(false) }} className="grid size-9 place-items-center rounded-full text-lg hover:bg-primary-soft hover:text-primary" aria-label={e}>{e}</button>
              ))}
            </div>
          )}
        </div>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(draft) }} className="flex items-end gap-2 rounded-2xl border border-input py-1.5 pl-3 pr-1.5 focus-within:border-primary">
        <textarea
          rows={1}
          value={draft}
          onChange={(e) => { setDraft(e.target.value); chat.notifyTyping() }}
          onKeyDown={onKey}
          disabled={disabled}
          maxLength={4000}
          placeholder={placeholder}
          aria-label={placeholder}
          className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2.5 text-sm outline-none [field-sizing:content] disabled:opacity-60"
        />
        <button type="submit" disabled={disabled || !draft.trim()} aria-label={tx('Gửi', 'Send', '보내기')} className={cn('grid size-10 shrink-0 place-items-center rounded-full text-white transition-all duration-200 active:scale-95 disabled:opacity-50', accent)}>
          <Send className="size-4" />
        </button>
      </form>
      {full && (
        <>
          <RfqDialog open={dlg === 'rfq'} onOpenChange={(v) => !v && setDlg(null)} onSend={sendRich('RFQ')} />
          <AppointmentDialog open={dlg === 'appt'} onOpenChange={(v) => !v && setDlg(null)} onSend={sendRich('APPOINTMENT')} />
          <ProductDialog open={dlg === 'product'} onOpenChange={(v) => !v && setDlg(null)} onSend={sendRich('PRODUCT')} />
        </>
      )}
    </div>
  )
}
