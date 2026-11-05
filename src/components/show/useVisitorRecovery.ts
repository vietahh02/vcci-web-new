/** Brings a registration made elsewhere into this browser: the signed-in account's registration, or the email + code of a mail link (M-02, M-10). */
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { liveApi, USE_MOCK } from '@/api'
import { useMyShowVisits, visitBadgeStatus } from '@/api/eventApi'
import { useToast } from '@/components/ui/overlay'
import { useProfile } from '@/lib/profile'
import type { useShowVisitor } from '@/lib/showReg'

type Visitor = ReturnType<typeof useShowVisitor>

/** @returns checking: the account's registrations are still loading, so "needs a registration" cannot be concluded yet */
export function useAccountVisit(showId: string, visitor: Visitor, enabled = true) {
  const { session: account } = useProfile()
  const visits = useMyShowVisits(enabled && !!account)
  const myVisit = visits.data?.find((v) => v.showId === showId && visitBadgeStatus(v.status))
  const { badge: held, saveBadge } = visitor
  useEffect(() => {
    const status = myVisit && visitBadgeStatus(myVisit.status)
    if (!myVisit || !status || held?.status === status) return
    saveBadge({ visitorId: myVisit.visitorId, code: myVisit.badgeCode, name: myVisit.fullName, email: myVisit.email, company: account?.companyName ?? '', visitorType: myVisit.visitorType, status, issuedAt: new Date().toISOString() })
  }, [myVisit?.visitorId, myVisit?.status, held?.status])
  return { checking: visits.loading && held?.status !== 'ISSUED' }
}

/** `?email=&code=` from a mail: restore once, and take the code out of the address bar and history as soon as it is read. M-13 carries `feedback=1` and belongs to ShowFeedbackDialog. */
export function useMailLinkRestore(showId: string, visitor: Visitor) {
  const [params, setParams] = useSearchParams()
  const toast = useToast()
  const [link] = useState(() => {
    const email = params.get('email')
    const code = params.get('code')
    return !params.has('feedback') && email && code ? { email, code } : null
  })
  useEffect(() => {
    if (!link || !params.has('code')) return
    setParams((p) => { p.delete('email'); p.delete('code'); return p }, { replace: true })
  }, [link, params, setParams])
  const sent = useRef(false)
  useEffect(() => {
    if (!link || USE_MOCK || sent.current) return
    sent.current = true
    liveApi.showRestoreVisitor(showId, link.email, link.code).then(visitor.restore, (e: Error) => toast({ title: e.message, kind: 'info' }))
  }, [link, showId])
}
