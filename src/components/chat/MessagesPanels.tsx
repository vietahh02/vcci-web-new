import { BadgeCheck, BellOff, Ban, CalendarClock, FileText, Flag, Headset, Star, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { AppointmentView, AttachmentView, ChatConversation, ChatConversationDetail, SupportStatus } from '@/api/chat'
import { Button, Field, Input, Textarea } from '@/components/ui/primitives'
import { Select } from '@/components/ui/select'
import { tx } from '@/lib/tx'
import { cn } from '@/lib/utils'
import { fmtSize, listTime } from './chatFormat'
import { ChatAvatar } from './ChatMessages'

export function VerifiedChip({ label }: { label?: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold-soft px-2 py-0.5 text-xs font-semibold text-gold">
      <BadgeCheck className="size-3.5" /> {label ?? tx('VCCI xác thực', 'VCCI verified', 'VCCI 인증')}
    </span>
  )
}

export function StatusPill({ status }: { status?: string | null }) {
  const [label, cls] =
    status === 'CLOSED' ? [tx('Đã đóng', 'Closed', '종료'), 'bg-muted text-foreground/80']
      : status === 'BLOCKED' ? [tx('Tạm khoá', 'Blocked', '차단됨'), 'bg-destructive/10 text-destructive']
        : [tx('Đang mở', 'Open', '진행 중'), 'bg-gold-soft text-gold']
  return <span className={cn('shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold', cls)}>{label}</span>
}

const sideBtn = 'flex w-full items-center gap-2 rounded-[10px] border px-3 py-2 text-left text-[13px] font-medium transition hover:bg-muted disabled:opacity-50'

export function PartnerPanel({
  conv, biz, files, appts, myOrgId, followed, onFollow, onMute, onReport, onBlock,
}: {
  conv: ChatConversation
  biz?: ChatConversationDetail['business']
  files: AttachmentView[]
  appts: AppointmentView[]
  myOrgId?: string | null
  followed: boolean
  onFollow: () => void
  onMute: () => void
  onReport: () => void
  onBlock: () => void
}) {
  const facts: [string, string | null | undefined][] = [
    [tx('Mã số thuế', 'Tax code', '사업자번호'), biz?.taxCode],
    [tx('Loại hình', 'Business type', '기업 유형'), biz?.businessType],
    [tx('Địa chỉ', 'Address', '주소'), [biz?.address, biz?.province].filter(Boolean).join(', ')],
    [tx('Người liên hệ', 'Contact', '담당자'), [biz?.contactName, biz?.contactPhone].filter(Boolean).join(' · ')],
    [tx('Website', 'Website', '웹사이트'), biz?.website],
  ]
  const blockedByOther = !!conv.blockedByBusinessId && conv.blockedByBusinessId !== myOrgId
  return (
    <>
      <div className="flex flex-col items-center gap-2 border-b px-5 pb-5 pt-6 text-center">
        <ChatAvatar id={conv.businessId} name={conv.businessName} size={72} />
        <strong className="text-base">{conv.businessName ?? conv.businessId}</strong>
        {biz?.vcciVerified && <VerifiedChip label={tx('Hội viên VCCI đã xác thực', 'VCCI-verified member', 'VCCI 인증 회원')} />}
        <Link to={`/suppliers/${conv.businessId}`} className="mt-2 w-full rounded-[10px] bg-primary p-2.5 text-[13px] font-semibold text-primary-foreground hover:bg-primary-hover">{tx('Xem hồ sơ', 'View profile', '프로필 보기')}</Link>
      </div>
      <dl className="space-y-3 px-5 py-4">
        {facts.filter(([, v]) => v).map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="break-words font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <section className="space-y-2 border-t px-5 py-4">
        <h3 className="text-[13px] font-semibold">{tx('Tệp đã chia sẻ', 'Shared files', '공유한 파일')} ({files.length})</h3>
        {files.length === 0 && <p className="text-xs text-muted-foreground">{tx('Chưa có tệp nào.', 'No files yet.', '파일이 없습니다.')}</p>}
        {files.slice(0, 5).map((f) => (
          <p key={f.messageId} className="flex items-center gap-2 text-xs"><FileText className="size-3.5 shrink-0 text-primary" /><span className="min-w-0 flex-1 truncate">{f.name}</span><span className="text-muted-foreground">{fmtSize(f.size)}</span></p>
        ))}
      </section>
      <section className="space-y-2 border-t px-5 py-4">
        <h3 className="text-[13px] font-semibold">{tx('Lịch hẹn sắp tới', 'Upcoming appointments', '예정된 약속')} ({appts.length})</h3>
        {appts.length === 0 && <p className="text-xs text-muted-foreground">{tx('Chưa có lịch hẹn.', 'No appointments.', '약속이 없습니다.')}</p>}
        {appts.slice(0, 4).map((a) => (
          <p key={a.messageId} className="flex items-start gap-2 text-xs"><CalendarClock className="mt-0.5 size-3.5 shrink-0 text-primary" /><span><strong className="block">{a.title}</strong><span className="text-muted-foreground">{new Date(a.startAt).toLocaleString()}</span></span></p>
        ))}
      </section>
      <section className="space-y-2 border-t px-5 py-4">
        <button type="button" onClick={onFollow} className={sideBtn}><UserPlus className="size-4" /> {followed ? tx('Đã lưu đối tác', 'Partner saved', '저장됨') : tx('Lưu đối tác', 'Save partner', '파트너 저장')}</button>
        <button type="button" onClick={onMute} className={sideBtn}><BellOff className="size-4" /> {conv.muted ? tx('Bật thông báo', 'Unmute', '알림 켜기') : tx('Tắt thông báo', 'Mute', '알림 끄기')}</button>
        <button type="button" onClick={onReport} className={cn(sideBtn, 'text-destructive')}><Flag className="size-4" /> {tx('Báo cáo vi phạm', 'Report a violation', '위반 신고')}</button>
        <button type="button" onClick={onBlock} disabled={blockedByOther} className={cn(sideBtn, 'text-destructive')}><Ban className="size-4" /> {conv.blockedByBusinessId ? tx('Bỏ chặn', 'Unblock', '차단 해제') : tx('Chặn', 'Block', '차단')}</button>
      </section>
    </>
  )
}

/** Tiến trình hỗ trợ suy ra từ trạng thái thật + thông tin phiếu + đánh giá khi đã đóng. */
export function SupportPanel({ conv, onRate }: { conv: ChatConversation | null; onRate: (score: number, comment: string) => Promise<void> }) {
  const closed = conv?.status === 'CLOSED' || conv?.status === 'ARCHIVED'
  const [score, setScore] = useState(0)
  const [comment, setComment] = useState('')
  const steps: [string, string | null, boolean][] = [
    [tx('Tiếp nhận', 'Received', '접수'), conv?.createdAt ? listTime(conv.createdAt) : null, !!conv],
    [tx('Phân công cán bộ', 'Officer assigned', '담당자 배정'), conv?.assigneeName ?? null, !!conv?.assigneeName],
    [tx('Đang xử lý', 'In progress', '처리 중'), null, !!conv?.firstResponseAt || !!conv?.assigneeName],
    [tx('Hoàn tất', 'Resolved', '완료'), conv?.closedAt ? listTime(conv.closedAt) : null, closed],
  ]
  const current = closed ? -1 : steps.findIndex(([, , done]) => !done)
  const fields: [string, string | null | undefined][] = [
    [tx('Mã phiếu', 'Ticket', '티켓'), conv?.ticketCode],
    [tx('Lĩnh vực', 'Category', '분야'), conv?.categoryLabel],
    [tx('Bộ phận', 'Department', '부서'), conv?.department],
    [tx('Ưu tiên', 'Priority', '우선순위'), conv?.priority],
    [tx('Hạn xử lý', 'Due', '처리 기한'), conv?.dueAt ? new Date(conv.dueAt).toLocaleString() : null],
  ]
  return (
    <>
      <div className="space-y-4 border-b p-5">
        <h3 className="text-[15px] font-semibold">{tx('Tiến trình xử lý', 'Progress', '진행 상황')}</h3>
        <ol>
          {steps.map(([label, sub, done], i) => (
            <li key={label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={cn('grid size-[22px] place-items-center rounded-full', done ? 'bg-success text-white' : i === current ? 'border-[6px] border-primary bg-card' : 'border-2 border-input')}>
                  {done && <svg viewBox="0 0 24 24" className="size-3.5 fill-none stroke-current stroke-[2.5]" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>}
                </span>
                {i < steps.length - 1 && <span className={cn('h-[26px] w-0.5', done ? 'bg-success' : 'bg-border')} />}
              </div>
              <div className="flex flex-col">
                <strong className={cn('text-[13px]', i === current && 'text-primary', !done && i !== current && 'text-muted-foreground')}>{label}</strong>
                {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
              </div>
            </li>
          ))}
        </ol>
        {!conv && <p className="text-sm text-muted-foreground"><Headset className="mr-1 inline size-4" />{tx('Chọn hoặc tạo một yêu cầu hỗ trợ.', 'Select or create a support request.', '지원 요청을 선택하거나 만드세요.')}</p>}
      </div>
      {conv && (
        <dl className="space-y-3 border-b px-5 py-4">
          {fields.filter(([, v]) => v).map(([k, v]) => (
            <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
          ))}
        </dl>
      )}
      {conv && closed && (
        <div className="space-y-2 px-5 py-4">
          <h3 className="text-[13px] font-semibold">{tx('Đánh giá hỗ trợ', 'Rate this support', '지원 평가')}</h3>
          {conv.rating ? (
            <>
              <Stars value={conv.rating} />
              {conv.ratingComment && <p className="text-xs text-muted-foreground">{conv.ratingComment}</p>}
            </>
          ) : (
            <>
              <Stars value={score} onChange={setScore} />
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} aria-label={tx('Nhận xét', 'Comment', '의견')} className="min-h-16" />
              <Button size="sm" disabled={!score} onClick={() => void onRate(score, comment)}>{tx('Gửi đánh giá', 'Submit rating', '평가 보내기')}</Button>
            </>
          )}
        </div>
      )}
    </>
  )
}

function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-1" role={onChange ? 'radiogroup' : 'img'} aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const star = <Star className={cn('size-5', n <= value ? 'fill-gold text-gold' : 'text-muted-foreground')} />
        return onChange ? (
          <button key={n} type="button" role="radio" aria-checked={n === value} aria-label={`${n}`} onClick={() => onChange(n)}>{star}</button>
        ) : (
          <span key={n}>{star}</span>
        )
      })}
    </div>
  )
}

/** Form "Gửi yêu cầu hỗ trợ mới": tiêu đề + lĩnh vực (từ supportStatus) + nội dung. */
export function NewTicketForm({ status, onCreate }: { status: SupportStatus | null; onCreate: (r: { subject: string; category?: string; body?: string }) => Promise<unknown> }) {
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        await onCreate({ subject: subject.trim(), category: category || undefined, body: body.trim() || undefined })
        setBusy(false)
      }}
      className="mx-auto w-full max-w-lg space-y-3 rounded-2xl border bg-card p-6"
    >
      <h2 className="text-lg font-bold">{tx('Gửi yêu cầu hỗ trợ mới', 'New support request', '새 지원 요청')}</h2>
      <Field label={tx('Tiêu đề', 'Subject', '제목')} htmlFor="tk-subject"><Input id="tk-subject" required maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} /></Field>
      {!!status?.categories.length && (
        <Field label={tx('Lĩnh vực', 'Category', '분야')} htmlFor="tk-cat">
          <Select id="tk-cat" value={category} onValueChange={setCategory} placeholder={tx('Chọn lĩnh vực', 'Select a category', '분야 선택')} options={status.categories.map((c) => ({ value: c.code, label: c.label }))} />
        </Field>
      )}
      <Field label={tx('Nội dung', 'Details', '내용')} htmlFor="tk-body"><Textarea id="tk-body" maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} /></Field>
      <Button type="submit" disabled={busy || !subject.trim()} className="w-full">{tx('Gửi yêu cầu', 'Submit request', '요청 보내기')}</Button>
    </form>
  )
}
