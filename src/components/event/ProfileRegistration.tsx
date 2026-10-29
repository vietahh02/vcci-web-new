/**
 * Event registration that reuses the company profile instead of a fresh form.
 * The event declares `requiredSections`; anything missing is listed with a deep link to fill it,
 * attendees are ticked from the profile, and only event-specific questions are asked here.
 * Submit stores a snapshot of the profile with the registration.
 */
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, CircleAlert, LogIn, Pencil, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { EventItem } from '@/data/mock'
import { Button, buttonClass, Textarea } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { completion, SECTIONS, sectionDone, useProfile, type SectionKey } from '@/lib/profile'
import { cn, formatDate } from '@/lib/utils'

const DEFAULT_REQUIRED: SectionKey[] = ['general', 'attendees', 'consent']

export function ProfileRegistration({ ev, onDone }: { ev: EventItem; onDone: () => void }) {
  const { L, lang, locale } = useI18n()
  const vi = lang === 'vi'
  const { session, profile, registrations, register } = useProfile()
  const required = ev.requiredSections ?? DEFAULT_REQUIRED
  const missing = required.filter((k) => !sectionDone(profile, k))
  const needsAttendees = ev.eventType !== 'MATCHMAKING'
  const [picked, setPicked] = useState<string[]>(() => profile.attendees.slice(0, 1).map((a) => a.id))
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const existing = registrations.find((r) => r.eventId === ev.id)
  const back = `/events/${ev.id}`

  if (!session) {
    return (
      <div className="p-6 text-center">
        <p className="text-[15px] font-semibold">{vi ? 'Đăng ký sự kiện bằng hồ sơ doanh nghiệp' : 'Register with your company profile'}</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
          {vi ? 'Đăng nhập một lần — thông tin doanh nghiệp được dùng lại cho mọi sự kiện, không phải điền lại.' : 'Sign in once — your company details are reused for every event.'}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Link to={`/login?return=${encodeURIComponent(back)}`} className={buttonClass('default')}><LogIn /> {vi ? 'Đăng nhập' : 'Sign in'}</Link>
          <Link to="/register" className={buttonClass('outline')}><UserPlus /> {vi ? 'Đăng ký doanh nghiệp' : 'Register business'}</Link>
        </div>
      </div>
    )
  }

  const canSubmit = missing.length === 0 && (!needsAttendees || picked.length > 0)

  return (
    <form
      className="space-y-6 p-6"
      onSubmit={(e) => {
        e.preventDefault()
        if (!canSubmit) return
        register({ eventId: ev.id, attendees: profile.attendees.filter((a) => picked.includes(a.id)), answers })
        onDone()
      }}
    >
      {/* company */}
      <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{profile.general.nameVi || session.companyName}</p>
          <p className="text-xs text-muted-foreground">{vi ? 'Hồ sơ hoàn thiện' : 'Profile'} {completion(profile)}%{existing && ` · ${vi ? 'đã đăng ký lúc' : 'registered'} ${formatDate(existing.at, locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`}</p>
        </div>
        <Link to={`/account/profile?return=${encodeURIComponent(back)}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><Pencil className="size-3.5" /> {vi ? 'Sửa hồ sơ' : 'Edit'}</Link>
      </div>

      {/* required profile sections */}
      <div>
        <p className="mb-2 text-sm font-semibold">{vi ? 'Thông tin sự kiện này cần' : 'This event needs'}</p>
        <ul className="divide-y rounded-xl border">
          {required.map((k) => {
            const s = SECTIONS.find((x) => x.key === k)!
            const ok = sectionDone(profile, k)
            return (
              <li key={k} className="flex items-center gap-3 px-3.5 py-2.5 text-sm">
                <span className={cn('grid size-5 shrink-0 place-items-center rounded-full', ok ? 'bg-success text-white' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400')}>
                  {ok ? <Check className="size-3" /> : <CircleAlert className="size-3" />}
                </span>
                <span className={cn('flex-1', !ok && 'font-medium')}>{L(s.title)}</span>
                {ok ? (
                  <span className="text-xs text-muted-foreground">{vi ? 'Lấy từ hồ sơ' : 'From profile'}</span>
                ) : (
                  <Link to={`/account/profile?section=${k}&return=${encodeURIComponent(back)}`} className="text-xs font-semibold text-primary">{vi ? 'Bổ sung' : 'Complete'} →</Link>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {/* attendees */}
      {needsAttendees && (
        <div>
          <p className="mb-2 text-sm font-semibold">{vi ? 'Người tham dự' : 'Attendees'}</p>
          {profile.attendees.length === 0 ? (
            <Link to={`/account/profile?section=attendees&return=${encodeURIComponent(back)}`} className="block rounded-xl border border-dashed p-4 text-center text-sm text-primary">+ {vi ? 'Thêm người tham dự vào hồ sơ' : 'Add attendees to profile'}</Link>
          ) : (
            <div className="space-y-2">
              {profile.attendees.map((a) => {
                const on = picked.includes(a.id)
                return (
                  <label key={a.id} className={cn('flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition', on ? 'border-primary bg-primary-soft/60' : 'hover:border-primary/40')}>
                    <input type="checkbox" className="size-4 accent-[var(--primary)]" checked={on} onChange={() => setPicked((v) => (on ? v.filter((x) => x !== a.id) : [...v, a.id]))} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{a.name || '—'}</span>
                      <span className="block truncate text-xs text-muted-foreground">{a.title} · {a.email}</span>
                    </span>
                  </label>
                )
              })}
              <p className="text-xs text-muted-foreground">{vi ? 'Link tham dự được gửi tới email từng người.' : 'Join links are emailed to each person.'}</p>
            </div>
          )}
        </div>
      )}

      {/* event-specific questions */}
      {ev.questions?.map((q) => (
        <div key={q.id}>
          <p className="mb-2 text-sm font-semibold">{L(q.label)} <span className="font-normal text-muted-foreground">({vi ? 'không bắt buộc' : 'optional'})</span></p>
          {q.options ? (
            <div className="space-y-1.5">
              {q.options.map((opt) => {
                const v = L(opt)
                const on = answers[q.id] === v
                return (
                  <button key={v} type="button" onClick={() => setAnswers((a) => ({ ...a, [q.id]: v }))} className={cn('flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-[13px]', on ? 'border-primary bg-primary-soft font-medium text-primary' : 'hover:border-primary/40')}>
                    <span className={cn('grid size-3.5 place-items-center rounded-full border-2', on ? 'border-primary' : 'border-input')}>{on && <span className="size-1.5 rounded-full bg-primary" />}</span>
                    {v}
                  </button>
                )
              })}
            </div>
          ) : (
            <Textarea className="min-h-20" value={answers[q.id] ?? ''} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} />
          )}
        </div>
      ))}

      <AnimatePresence>
        {missing.length > 0 && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="rounded-lg bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            {vi ? `Còn ${missing.length} mục hồ sơ cần bổ sung. Thông tin đã khai sẽ được giữ nguyên, bạn chỉ cần điền phần thiếu.` : `${missing.length} profile section(s) missing. What you've entered is kept — just fill the gaps.`}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{vi ? 'Hồ sơ tại thời điểm đăng ký sẽ được lưu kèm.' : 'A snapshot of your profile is attached.'}</p>
        {missing.length > 0 ? (
          <Link to={`/account/profile?section=${missing[0]}&return=${encodeURIComponent(back)}`} className={buttonClass('default')}>{vi ? 'Bổ sung hồ sơ' : 'Complete profile'} <ArrowRight /></Link>
        ) : (
          <Button type="submit" disabled={!canSubmit}>{existing ? (vi ? 'Cập nhật đăng ký' : 'Update registration') : vi ? 'Đăng ký bằng hồ sơ' : 'Register with profile'} <ArrowRight /></Button>
        )}
      </div>
    </form>
  )
}
