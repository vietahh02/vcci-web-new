/** Per-browser demo state for Show Hub visitors: e-badge, session bookings, inquiries. Real data lives server-side. */
import { useCallback, useEffect, useState } from 'react'

export type BadgeStatus = 'ISSUED' | 'PENDING_PAYMENT' | 'PENDING_APPROVAL'
export interface VisitorBadge { visitorId?: string; code: string; name: string; email: string; company: string; visitorType: string; status: BadgeStatus; issuedAt: string }
export type BookingState = 'BOOKED' | 'WAITLIST'
/** What happened to the post-show feedback invitation in this browser. */
export type FeedbackState = 'SENT' | 'SKIPPED'
interface Stored { badge?: VisitorBadge; bookings: Record<string, BookingState>; inquiries: { boothId: string; at: string }[]; feedback?: FeedbackState }

const key = (showId: string) => `vcci.show.${showId}`
const empty: Stored = { bookings: {}, inquiries: [] }

function read(showId: string): Stored {
  try {
    const raw = localStorage.getItem(key(showId))
    return raw ? { ...empty, ...JSON.parse(raw) } : empty
  } catch {
    return empty
  }
}

export function useShowVisitor(showId: string) {
  const [state, setState] = useState<Stored>(() => read(showId))
  useEffect(() => setState(read(showId)), [showId])

  const update = useCallback((fn: (s: Stored) => Stored) => {
    setState((prev) => {
      const next = fn(prev)
      try {
        localStorage.setItem(key(showId), JSON.stringify(next))
      } catch {
        /* storage unavailable: state stays in memory */
      }
      return next
    })
  }, [showId])

  return {
    badge: state.badge,
    bookings: state.bookings,
    inquiries: state.inquiries,
    feedback: state.feedback,
    saveBadge: (badge: VisitorBadge) => update((s) => ({ ...s, badge })),
    setFeedback: (feedback: FeedbackState) => update((s) => ({ ...s, feedback })),
    cancelBadge: () => update(() => empty),
    setBooking: (sessionId: string, v: BookingState | null) =>
      update((s) => {
        const bookings = { ...s.bookings }
        if (v) bookings[sessionId] = v
        else delete bookings[sessionId]
        return { ...s, bookings }
      }),
    addInquiry: (boothId: string) => update((s) => ({ ...s, inquiries: [...s.inquiries, { boothId, at: new Date().toISOString() }] })),
  }
}

export function newBadgeCode(showId: string) {
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `${showId.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase()}-${rnd}`
}
