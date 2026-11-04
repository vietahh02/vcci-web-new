/**
 * Post-show feedback invitation (CR-2026-008 EV8-10, mail M-13).
 * Shown once the show has ended to a badge holder (saved in this browser or arriving from the mail link) or a business with an approved booth.
 * A public quote needs the writer's consent and the organizer's approval; approved ones appear in the "What attendees said" block of EventRecap.
 */
import { Send, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ApiError, catalogApi, liveApi, USE_MOCK } from '@/api'
import { beShowId } from '@/api/adapters/show'
import { Dialog, DialogContent, useToast } from '@/components/ui/overlay'
import { Button, Field, Textarea } from '@/components/ui/primitives'
import type { Show } from '@/data/shows'
import { useI18n } from '@/lib/i18n'
import { useProfile } from '@/lib/profile'
import type { useShowVisitor } from '@/lib/showReg'
import { tx } from '@/lib/tx'
import { cn } from '@/lib/utils'

const COMMENT_MAX = 2000
/** A badge writes through the public endpoint; a signed-in business through its own. */
type Author = { email: string; badgeCode: string } | 'ORG'

export function ShowFeedbackDialog({ show, visitor }: { show: Show; visitor: ReturnType<typeof useShowVisitor> }) {
  const { L } = useI18n()
  const { session } = useProfile()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [link] = useState(() => {
    const email = params.get('email')
    const badgeCode = params.get('code')
    return params.get('feedback') === '1' && email && badgeCode ? { email, badgeCode } : null
  })
  const [author, setAuthor] = useState<Author | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)

  // the badge code came in the URL: take it out of the address bar and history as soon as it is read
  useEffect(() => {
    if (!params.has('feedback')) return
    setParams((p) => { p.delete('feedback'); p.delete('email'); p.delete('code'); return p }, { replace: true })
  }, [params, setParams])

  const saved = visitor.badge?.status === 'ISSUED' ? visitor.badge : null
  const email = link?.email ?? saved?.email
  const badgeCode = link?.badgeCode ?? saved?.code
  const signedIn = !!session
  const settled = !!visitor.feedback

  useEffect(() => {
    if (show.status !== 'ENDED' || settled) return
    let stale = false
    const quiet = (e: unknown) => console.warn(`[show] feedback prompt skipped: ${e instanceof Error ? e.message : 'unavailable'}`)
    if (email && badgeCode) {
      const sent = USE_MOCK ? Promise.resolve(false) : liveApi.showFeedbackSent(show.id, email, badgeCode)
      sent.then((yes) => { if (!stale && !yes) setAuthor({ email, badgeCode }) }, quiet)
    } else if (signedIn && !USE_MOCK) {
      // the BE has no "my feedback" read for businesses: a repeat is refused on submit and remembered then
      catalogApi.myBooths().then((booths) => { if (!stale && booths.some((b) => b.showId === beShowId(show.id) && b.status === 'APPROVED')) setAuthor('ORG') }, quiet)
    }
    return () => { stale = true }
  }, [show.id, show.status, settled, email, badgeCode, signedIn])

  if (!author || settled) return null

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rating) return
    const body = { rating, comment: comment.trim() || undefined, consentPublic: consent }
    const done = () => {
      visitor.setFeedback('SENT')
      toast({ kind: 'success', title: tx('Cảm ơn bạn đã gửi cảm nhận', 'Thanks for your feedback', '후기를 보내주셔서 감사합니다') })
    }
    if (USE_MOCK) return done()
    setBusy(true)
    const call = author === 'ORG' ? liveApi.showOrgFeedback(show.id, body) : liveApi.showVisitorFeedback(show.id, { ...author, ...body })
    call.then(done, (err: Error) => {
      setBusy(false)
      if (err instanceof ApiError && err.status === 409) visitor.setFeedback('SENT')
      toast({ kind: 'info', title: err.message })
    })
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o && !busy) visitor.setFeedback('SKIPPED') }}>
      <DialogContent title={tx('Bạn thấy Show này thế nào?', 'How was this show?', '이 쇼는 어떠셨나요?')} description={L(show.title)}>
        <form className="space-y-4 p-6" onSubmit={submit}>
          <div className="flex gap-1" role="radiogroup" aria-label={tx('Chấm điểm', 'Rating', '평점')}>
            {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n}/5`} onClick={() => setRating(n)}><Star className={cn('size-7', n <= rating ? 'fill-gold-bright text-gold-bright' : 'text-muted-foreground')} /></button>)}
          </div>
          <Field label={tx('Cảm nhận của bạn', 'Your feedback', '후기')} htmlFor="sf-comment">
            <Textarea id="sf-comment" maxLength={COMMENT_MAX} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={tx('Điều bạn thấy hữu ích / cần cải thiện…', 'What was useful or could be better…', '유익했던 점 / 개선점…')} />
          </Field>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            {tx('Tôi đồng ý để cảm nhận này hiển thị công khai trên trang Show, kèm tên và đơn vị của tôi, sau khi Ban tổ chức duyệt.', 'I agree that this feedback may appear publicly on the show page with my name and organisation, after organizer review.', '주최측 검토 후 이 후기가 제 이름 및 소속과 함께 쇼 페이지에 공개되는 것에 동의합니다.')}
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" disabled={busy} onClick={() => visitor.setFeedback('SKIPPED')}>{tx('Bỏ qua', 'Skip', '건너뛰기')}</Button>
            <Button type="submit" disabled={!rating || busy}><Send /> {busy ? '…' : tx('Gửi cảm nhận', 'Send feedback', '후기 보내기')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
