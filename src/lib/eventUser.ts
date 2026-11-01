/** Per-browser demo state for a signed-in or guest participant: registration marker, prep progress, messages. Real data is server-side. */
import { useCallback, useEffect, useState } from 'react'

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
const write = (key: string, v: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(v))
  } catch {
    /* storage unavailable: state stays in memory */
  }
}

const REG = (id: string) => `vcci.evreg.${id}`

/** Called by the registration flows when a registration is submitted. */
export const markRegistered = (eventId: string) => write(REG(eventId), { at: new Date().toISOString() })
/** Called after the registration is cancelled so the local marker no longer shows the event as registered. */
export const unmarkRegistered = (eventId: string) => {
  try {
    localStorage.removeItem(REG(eventId))
  } catch {
    /* storage unavailable */
  }
}
export const registeredAt = (eventId: string): string | null => read<{ at: string } | null>(REG(eventId), null)?.at ?? null
export const isRegistered = (eventId: string) => registeredAt(eventId) !== null

export function useStoredState<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => read(key, initial))
  useEffect(() => setV(read(key, initial)), [key]) // eslint-disable-line
  const set = useCallback((next: T | ((p: T) => T)) => {
    setV((prev) => {
      const val = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
      write(key, val)
      return val
    })
  }, [key])
  return [v, set] as const
}

export interface ThreadMsg { id: number; from: 'me' | 'organizer'; text: string; at: string }
export const useThread = (eventId: string) => useStoredState<ThreadMsg[]>(`vcci.evmsg.${eventId}`, [])
export const usePrepDone = (eventId: string) => useStoredState<string[]>(`vcci.evprep.${eventId}`, [])
export const useSpeakerQuestions = (eventId: string) => useStoredState<string[]>(`vcci.evq.${eventId}`, [])

/** Non-hook readers for list pages that need many events at once. */
export const readPrepDone = (eventId: string): string[] => read<string[]>(`vcci.evprep.${eventId}`, [])
