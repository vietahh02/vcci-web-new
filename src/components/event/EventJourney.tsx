/**
 * What a participant needs around an event (CR-2026-002 EV-07/08/09/12):
 * journey steps, "My preparation" (checklist, organizer contact, speaker question, private messages, FAQ)
 * before the event, and recordings / materials / feedback after it.
 */
import { Check, CircleDot, Download, FileText, Image as ImageIcon, MessageSquare, Phone, PlayCircle, Send, Star, Video } from 'lucide-react'
import { useState } from 'react'
import { USE_MOCK, invalidate, useRemote } from '@/api'
import { askSpeaker, getPrep, listMessages, savePrep, sendFeedback, sendMessage, useEventMaterials } from '@/api/eventApi'
import type { LivePrep, LiveThreadMsg } from '@/api/adapters/eventExtra'
import { Link } from 'react-router-dom'
import { AddToCalendar } from '@/components/event/AddToCalendar'
import { EventRecap } from '@/components/event/EventRecap'
import { useToast } from '@/components/ui/overlay'
import { Badge, Button, buttonClass, Progress, Textarea } from '@/components/ui/primitives'
import { faqs, prepTasks, type Material } from '@/data/eventExtras'
import type { EventItem } from '@/data/mock'
import { registrationState } from '@/lib/eventStatus'
import { isRegistered, registeredAt, usePrepDone, useSpeakerQuestions, useStoredState, useThread } from '@/lib/eventUser'
import { useI18n, type Bilingual } from '@/lib/i18n'
import { useProfile } from '@/lib/profile'
import { tx } from '@/lib/tx'
import { cn, formatDate } from '@/lib/utils'

const matIcon: Record<Material['kind'], typeof Video> = { RECORDING: Video, SLIDES: FileText, REPORT: FileText, PHOTOS: ImageIcon }

export function EventJourney({ ev }: { ev: EventItem }) {
  const { registrations } = useProfile()
  const registered = USE_MOCK ? isRegistered(ev.id) || registrations.some((r) => r.eventId === ev.id) : !!ev.myRegistration
  const ended = ev.eventStatus === 'ENDED'
  return (
    <div className="container-page mt-10 space-y-10">
      {!ended && <Steps ev={ev} registered={registered} />}
      {!ended && registered && <Prep ev={ev} />}
      {!ended && !registered && <BeforeRegister ev={ev} />}
      {ended && <EventRecap ev={ev} />}
      {ended && <PostEvent ev={ev} registered={registered} />}
    </div>
  )
}

/* ---------------------------------------------------------------- steps */
function Steps({ ev, registered }: { ev: EventItem; registered: boolean }) {
  const { locale } = useI18n()
  const reg = registrationState(ev)
  const live = ev.eventStatus === 'ONGOING'
  const current = live ? 3 : registered ? 2 : 0
  const steps = [
    { t: tx('Đăng ký', 'Register', '등록'), d: ev.registrationDeadline ? `${tx('Hạn', 'By', '마감')} ${formatDate(ev.registrationDeadline, locale)}` : tx('Điền form online', 'Fill the online form', '온라인 양식') },
    { t: tx('Xác nhận / duyệt', 'Confirmation', '승인'), d: tx('Email xác nhận kèm đường dẫn', 'Email with access details', '확인 이메일') },
    { t: tx('Chuẩn bị', 'Prepare', '준비'), d: tx('Checklist, câu hỏi, tài liệu', 'Checklist, questions, documents', '체크리스트, 질문, 자료') },
    { t: tx('Tham dự', 'Attend', '참석'), d: `${formatDate(ev.startDate, locale)} · ${ev.startTime}` },
    { t: tx('Sau sự kiện', 'After', '행사 후'), d: tx('Bản ghi, tài liệu, đánh giá', 'Recording, materials, feedback', '녹화, 자료, 평가') },
  ]
  return (
    <section aria-label="journey">
      <ol className="grid gap-3 sm:grid-cols-5">
        {steps.map((s, i) => {
          const done = i < current
          const now = i === current
          return (
            <li key={s.t} className={cn('rounded-xl border p-3', now && 'border-primary bg-primary-soft', done && 'bg-success-soft/50')}>
              <span className={cn('grid size-6 place-items-center rounded-full text-xs font-bold', done ? 'bg-success text-white' : now ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>{done ? <Check className="size-3.5" /> : i + 1}</span>
              <p className="mt-2 text-sm font-bold">{s.t}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.d}</p>
            </li>
          )
        })}
      </ol>
      {!registered && reg.state === 'CLOSING' && <p className="mt-3 text-sm font-medium text-gold">{tx(`Sắp hết hạn đăng ký — còn ${Math.max(reg.daysLeft, 0)} ngày.`, `Registration closes soon — ${Math.max(reg.daysLeft, 0)} days left.`, `등록 마감 임박 — ${Math.max(reg.daysLeft, 0)}일 남음.`)}</p>}
    </section>
  )
}

/* ---------------------------------------------------------------- before registering */
function BeforeRegister({ ev }: { ev: EventItem }) {
  const items = prepTasks(ev)
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-extrabold">{tx('Bạn sẽ cần chuẩn bị', 'What you will need to prepare', '준비할 사항')}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {items.map((x) => <TaskText key={x.id} id={x.id} ev={ev} />)}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">{tx('Sau khi đăng ký, danh sách này trở thành checklist có nhắc hạn.', 'After registering, this becomes a checklist with deadline reminders.', '등록 후 마감 알림이 있는 체크리스트가 됩니다.')}</p>
      </div>
      <div className="rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-extrabold">{tx('Câu hỏi thường gặp', 'Frequently asked questions', '자주 묻는 질문')}</h2>
        <Faq />
      </div>
    </section>
  )
}

function TaskText({ id, ev }: { id: string; ev: EventItem }) {
  const { L } = useI18n()
  const t = prepTasks(ev).find((x) => x.id === id)
  return t ? <li className="flex gap-2"><CircleDot className="mt-0.5 size-4 shrink-0 text-primary" /> {L(t.title)}</li> : null
}

function Faq() {
  const { L } = useI18n()
  return (
    <div className="mt-3 divide-y">
      {faqs().map((f, i) => (
        <details key={i} className="group py-2.5">
          <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden group-open:text-primary">{L(f.q)}</summary>
          <p className="mt-1.5 text-sm text-muted-foreground">{L(f.a)}</p>
        </details>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- my preparation */
interface PrepRow { id: string; title: Bilingual; hint?: Bilingual; dl: Date | null }
interface ChatRow { id: string | number; from: 'me' | 'organizer'; text: string }

function Prep({ ev }: { ev: EventItem }) {
  const { L, locale } = useI18n()
  const toast = useToast()
  const regId = ev.myRegistration?.id
  const liveOn = !USE_MOCK && !!regId
  // live: tasks/progress/messages come from the BE; if an endpoint is unavailable the local sample behaviour is used
  const prepR = useRemote<LivePrep>(liveOn ? 'prep:' + regId : null, () => getPrep(regId!))
  const msgR = useRemote<LiveThreadMsg[]>(liveOn ? 'evmsg:' + ev.id : null, () => listMessages(ev.id))
  const [prepOverride, setPrepOverride] = useState<LivePrep | null>(null)
  const [sentMsgs, setSentMsgs] = useState<LiveThreadMsg[]>([])
  const lp = prepOverride ?? (liveOn && !prepR.error ? prepR.data ?? null : null)
  const liveMsgs = liveOn && !msgR.error ? msgR.data ?? null : null
  const [localDone, setLocalDone] = usePrepDone(ev.id)
  const [qs, setQs] = useSpeakerQuestions(ev.id)
  const [localThread, setLocalThread] = useThread(ev.id)
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState('')
  const askSpeakerEnabled = !!ev.speakers?.length || ev.eventType === 'WEBINAR' || ev.eventType === 'CONFERENCE'
  // sample mode: deadline = N days before start, never earlier than a day after registering and never after the start
  const regAt = registeredAt(ev.id)
  const due = (days: number) => {
    const start = new Date(ev.startDate)
    const base = new Date(start); base.setDate(base.getDate() - days)
    const floor = new Date(regAt ?? start); floor.setDate(floor.getDate() + 1)
    return new Date(Math.min(Math.max(base.getTime(), floor.getTime()), start.getTime()))
  }
  const tasks: PrepRow[] = lp
    ? lp.tasks.map((t) => ({ id: t.id, title: t.title, hint: t.hint, dl: t.deadline ? new Date(t.deadline) : null }))
    : USE_MOCK || prepR.error ? prepTasks(ev).map((t) => ({ id: t.id, title: t.title, hint: t.hint, dl: due(t.due) })) : []
  const done = lp ? lp.doneTaskIds : localDone
  const pct = lp ? lp.percent : tasks.length ? Math.round((done.filter((d) => tasks.some((t) => t.id === d)).length / tasks.length) * 100) : 0
  const fail = (e: Error) => toast({ kind: 'info', title: e.message })

  const toggle = (tid: string) => {
    const next = done.includes(tid) ? done.filter((x) => x !== tid) : [...done, tid]
    if (!lp || !regId) return setLocalDone(next)
    savePrep(regId, next).then((r) => { setPrepOverride(r); invalidate('myreg') }, fail)
  }
  const thread: ChatRow[] = USE_MOCK
    ? localThread
    : [...(liveMsgs ?? []), ...sentMsgs.filter((m) => !liveMsgs?.some((x) => x.id === m.id))]
  const send = () => {
    const text = msg.trim()
    if (!text) return
    if (!USE_MOCK) {
      sendMessage(ev.id, text).then((m) => { setSentMsgs((p) => [...p, m]); setMsg(''); toast({ kind: 'success', title: tx('Đã gửi tin nhắn', 'Message sent', '메시지 전송됨') }) }, fail)
      return
    }
    const now = new Date().toISOString()
    setLocalThread((p) => [...p, { id: Date.now(), from: 'me', text, at: now }, { id: Date.now() + 1, from: 'organizer', text: tx('Ban Tổ chức đã nhận tin nhắn và sẽ phản hồi trong 2 ngày làm việc.', 'The organizers received your message and will reply within 2 business days.', '주최 측이 메시지를 받았으며 영업일 2일 이내 답변드립니다.'), at: now }])
    setMsg('')
    toast({ kind: 'success', title: tx('Đã gửi tin nhắn', 'Message sent', '메시지 전송됨') })
  }
  const submitQuestion = () => {
    const text = q.trim()
    if (!text) return
    const ok = () => { setQs((p) => [...p, text]); setQ(''); toast({ kind: 'success', title: tx('Đã gửi câu hỏi', 'Question submitted', '질문 제출됨') }) }
    if (USE_MOCK) return ok()
    askSpeaker(ev.id, text).then(ok, fail)
  }

  return (
    <section id="prep" className="rounded-3xl border bg-card p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">{tx('Chuẩn bị của tôi', 'My preparation', '내 준비 현황')}</h2>
          <p className="text-sm text-muted-foreground">{tx('Bạn đã đăng ký sự kiện này.', 'You are registered for this event.', '이 행사에 등록되었습니다.')}</p>
        </div>
        <AddToCalendar ev={ev} tone="light" />
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-1.5 flex justify-between text-sm font-semibold"><span>{tx('Tiến độ chuẩn bị', 'Preparation progress', '준비 진행률')}</span><span>{pct}%</span></div>
          <Progress value={pct} />
          <ul className="mt-4 space-y-2">
            {tasks.map((t) => {
              const on = done.includes(t.id)
              const dl = t.dl
              const overdue = !on && !!dl && dl < new Date()
              return (
                <li key={t.id}>
                  <label className={cn('flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition hover:bg-muted/50', on && 'bg-success-soft/40')}>
                    <input type="checkbox" className="mt-1" checked={on} onChange={() => toggle(t.id)} />
                    <span className="min-w-0 flex-1">
                      <span className={cn('block text-sm font-semibold', on && 'text-muted-foreground line-through')}>{L(t.title)}</span>
                      {t.hint && <span className="block text-xs text-muted-foreground">{L(t.hint)}</span>}
                      {dl && <span className={cn('mt-0.5 block text-xs', overdue ? 'font-semibold text-destructive' : 'text-muted-foreground')}>{tx('Hạn', 'Due', '기한')}: {formatDate(dl.toISOString(), locale)}{overdue ? ` · ${tx('quá hạn', 'overdue', '기한 초과')}` : ''}</span>}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
          {ev.contact && (
            <div className="mt-4 rounded-xl bg-muted/60 p-4 text-sm">
              <p className="flex items-center gap-2 font-semibold"><Phone className="size-4 text-primary" /> {tx('Đầu mối hỗ trợ', 'Your support contact', '지원 담당')}</p>
              <p className="mt-1 text-muted-foreground">{ev.contact.name} · {ev.contact.phone} · {ev.contact.email}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {askSpeakerEnabled && (
            <div>
              <h3 className="font-bold">{tx('Câu hỏi cho diễn giả', 'Question for the speakers', '연사에게 질문')}</h3>
              <ul className="mt-2 space-y-1.5">{qs.map((x, i) => <li key={i} className="rounded-lg bg-primary-soft px-3 py-2 text-sm">{x}</li>)}</ul>
              <div className="mt-2 flex gap-2">
                <Textarea className="min-h-16" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx('Bạn muốn diễn giả trả lời điều gì?', 'What would you like the speakers to answer?', '연사에게 묻고 싶은 내용')} />
                <Button className="self-end" disabled={!q.trim()} onClick={submitQuestion}><Send /></Button>
              </div>
            </div>
          )}
          <div>
            <h3 className="flex items-center gap-2 font-bold"><MessageSquare className="size-4 text-primary" /> {tx('Trao đổi với Ban Tổ chức', 'Message the organizers', '주최 측과 대화')}</h3>
            <div className="mt-2 max-h-56 space-y-2 overflow-y-auto rounded-xl border bg-background p-3">
              {thread.length === 0 && <p className="text-sm text-muted-foreground">{tx('Chỉ bạn và Ban Tổ chức xem được cuộc trao đổi này.', 'Only you and the organizers can see this thread.', '본인과 주최 측만 볼 수 있습니다.')}</p>}
              {thread.map((m) => (
                <div key={m.id} className={cn('max-w-[85%] rounded-xl px-3 py-2 text-sm', m.from === 'me' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted')}>{m.text}</div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Textarea className="min-h-12" value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send() }} placeholder={tx('Nhập tin nhắn…', 'Write a message…', '메시지 입력…')} />
              <Button className="self-end" disabled={!msg.trim()} onClick={send}><Send /></Button>
            </div>
          </div>
          <div>
            <h3 className="font-bold">{tx('Câu hỏi thường gặp', 'FAQ', '자주 묻는 질문')}</h3>
            <Faq />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- after the event */
function PostEvent({ ev, registered }: { ev: EventItem; registered: boolean }) {
  const { L } = useI18n()
  const toast = useToast()
  const matR = useEventMaterials(ev, registered || USE_MOCK)
  const mats = matR.data ?? []
  const [rating, setRating] = useStoredState<number>(`vcci.evrate.${ev.id}`, 0)
  const [note, setNote] = useStoredState<string>(`vcci.evnote.${ev.id}`, '')
  const [sent, setSent] = useStoredState<boolean>(`vcci.evfb.${ev.id}`, false)
  return (
    <section id="materials" className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-extrabold">{tx('Bản ghi & tài liệu', 'Recording & materials', '녹화 및 자료')}</h2>
          <Badge variant="muted">{tx('Sự kiện đã kết thúc', 'Event ended', '종료된 행사')}</Badge>
          {registered && <Badge variant="success">{tx('Bạn đã tham dự', 'You attended', '참석함')}</Badge>}
        </div>
        <ul className="mt-4 divide-y">
          {!USE_MOCK && !registered && <li className="py-3 text-sm text-muted-foreground">{tx('Đăng ký sự kiện để xem tài liệu và bản ghi.', 'Register for the event to access recordings and materials.', '녹화와 자료는 행사 등록자에게만 제공됩니다.')}</li>}
          {!USE_MOCK && registered && matR.error && <li className="py-3 text-sm text-muted-foreground">{matR.error.message}</li>}
          {!USE_MOCK && registered && !matR.error && !matR.loading && mats.length === 0 && <li className="py-3 text-sm text-muted-foreground">{tx('Chưa có tài liệu.', 'No materials yet.', '아직 자료가 없습니다.')}</li>}
          {mats.map((m) => {
            const Icon = matIcon[m.kind]
            return (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary"><Icon className="size-5" /></span>
                <div className="min-w-0 flex-1"><p className="font-semibold">{L(m.title)}</p><p className="text-xs text-muted-foreground">{m.meta}</p></div>
                {m.url ? <Button size="sm" variant={m.kind === 'RECORDING' ? 'default' : 'outline'} onClick={() => window.open(m.url, '_blank', 'noopener,noreferrer')}>{m.kind === 'RECORDING' ? <><PlayCircle /> {tx('Xem lại', 'Watch', '다시보기')}</> : <><Download /> {tx('Tải', 'Download', '다운로드')}</>}</Button>
                  : !USE_MOCK && !m.sample ? null : m.kind === 'RECORDING' ? <Button size="sm" onClick={() => toast({ kind: 'info', title: tx('Bản mẫu', 'Prototype', '프로토타입'), description: tx('Trình phát bản ghi sẽ nối với hạ tầng webinar/livestream.', 'The recording player connects to the webinar/livestream infrastructure.', '녹화 플레이어는 웨비나/라이브 인프라와 연동됩니다.') })}><PlayCircle /> {tx('Xem lại', 'Watch', '다시보기')}</Button>
                  : <Button size="sm" variant="outline" onClick={() => toast({ kind: 'info', title: tx('Bản mẫu — chưa có tệp thật', 'Prototype — no real file yet') })}><Download /> {tx('Tải', 'Download', '다운로드')}</Button>}
              </li>
            )
          })}
        </ul>
        <div className="mt-4 text-sm text-muted-foreground">{tx('Tài liệu chỉ hiển thị cho người đã đăng ký (cấu hình theo từng sự kiện).', 'Materials are visible to registered participants (set per event).', '자료는 등록자에게만 표시됩니다 (행사별 설정).')}</div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-bold">{tx('Đánh giá sự kiện', 'Rate this event', '행사 평가')}</h3>
          {sent ? <p className="mt-2 text-sm text-success">{tx('Cảm ơn bạn đã đánh giá!', 'Thanks for your feedback!', '평가해 주셔서 감사합니다!')}</p> : (
            <>
              <div className="mt-2 flex gap-1" role="radiogroup" aria-label="rating">
                {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={rating === n} onClick={() => setRating(n)}><Star className={cn('size-7', n <= rating ? 'fill-gold-bright text-gold-bright' : 'text-muted-foreground')} /></button>)}
              </div>
              <Textarea className="mt-3" value={note} onChange={(e) => setNote(e.target.value)} placeholder={tx('Điều bạn thấy hữu ích / cần cải thiện…', 'What was useful or could be better…', '유익했던 점 / 개선점…')} />
              <Button className="mt-3 w-full" disabled={!rating || (!USE_MOCK && !registered)} onClick={() => {
                const ok = () => { setSent(true); toast({ kind: 'success', title: tx('Đã gửi đánh giá', 'Feedback sent', '평가 전송됨') }) }
                if (USE_MOCK) return ok()
                sendFeedback(ev.id, rating, note.trim()).then(ok, (e: Error) => toast({ kind: 'info', title: e.message }))
              }}>{tx('Gửi đánh giá', 'Send feedback', '평가 보내기')}</Button>
            </>
          )}
        </div>
        <Link to="/events#explorer" className={buttonClass('outline', 'md', 'w-full')}>{tx('Xem sự kiện sắp tới', 'See upcoming events', '다가오는 행사 보기')}</Link>
      </div>
    </section>
  )
}
