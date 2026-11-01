/**
 * Event detail data access (programme, products, participants, materials, recap, my registrations, prep, messages,
 * speaker questions, feedback, connections). Kept apart from realApi.ts so the business module can edit that file freely.
 * Live mode calls the portal BE; an endpoint that is missing (404/405/network) falls back to the in-repo sample data with a console log.
 * Mock mode (VITE_USE_MOCK=true) never touches the network.
 */
import { eventParticipants, type Participant } from '@/data/eventParticipants'
import { materials as sampleMaterials, type Material } from '@/data/eventExtras'
import { eventProducts, type TradedProduct } from '@/data/eventProducts'
import { getRecap, type Recap } from '@/data/eventRecap'
import { getProgramme, type EventProgramme } from '@/data/schedules'
import type { EventItem } from '@/data/mock'
import { arr, type Raw } from './adapters/common'
import { toMaterial, toParticipant, toPrep, toProgramme, toRecap, toRegistrationFull, toThreadMsg, toTradedProduct, type LivePrep, type LiveThreadMsg, type RegistrationFull } from './adapters/eventExtra'
import { USE_MOCK, mockFallback } from './config'
import { useRemote, type Remote } from './hooks'
import { ApiError, apiFetch, toPage } from './http'

const enc = encodeURIComponent
const missing = (e: unknown) => e instanceof ApiError && (e.status === 404 || e.status === 405 || e.status === 0)

async function orSample<T>(endpoint: string, live: () => Promise<T>, sample: () => T): Promise<T> {
  try {
    return await live()
  } catch (e) {
    if (!missing(e)) throw e
    mockFallback(endpoint, e instanceof Error ? e.message : 'unavailable')
    return sample()
  }
}

/* ------------------------------------------------------------------ reads */
export const fetchProgramme = (ev: EventItem): Promise<EventProgramme | null> =>
  orSample('GET /api/event/{id}/programme', async () => toProgramme(await apiFetch<Raw>(`/api/event/${enc(ev.id)}/programme`)), () => getProgramme(ev.id))

export const fetchEventProducts = (ev: EventItem): Promise<TradedProduct[]> =>
  orSample('GET /api/event/{id}/products', async () => arr<Raw>(await apiFetch(`/api/event/${enc(ev.id)}/products`)).map(toTradedProduct), () => eventProducts(ev))

/** All sides, first 100 (the tab shows 3 featured per column and expands locally). */
export const fetchParticipants = (ev: EventItem): Promise<Participant[]> =>
  orSample('GET /api/event/{id}/participants', async () => toPage<Raw>(await apiFetch(`/api/event/${enc(ev.id)}/participants`, { query: { page: 0, size: 100 } }), 100).items.map(toParticipant), () => eventParticipants(ev))

export const fetchMaterials = (ev: EventItem): Promise<Material[]> =>
  orSample('GET /api/event/{id}/materials', async () => arr<Raw>(await apiFetch(`/api/event/${enc(ev.id)}/materials`)).map(toMaterial), () => sampleMaterials(ev))

export const fetchRecap = (ev: EventItem): Promise<Recap> =>
  orSample('GET /api/event/{id}/recap', async () => toRecap(await apiFetch<Raw>(`/api/event/${enc(ev.id)}/recap`)), () => getRecap(ev))

export const fetchMyRegistrations = async (): Promise<RegistrationFull[]> =>
  toPage<Raw>(await apiFetch('/api/event/registrations/my', { query: { page: 0, size: 100 } }), 100).items.map(toRegistrationFull)

export const fetchRegistration = async (rid: string): Promise<RegistrationFull> => toRegistrationFull(await apiFetch<Raw>(`/api/event/registrations/${enc(rid)}`))
export const cancelMyRegistration = (rid: string) => apiFetch(`/api/event/registrations/${enc(rid)}/cancel`, { method: 'POST' })

/* ------------------------------------------------------- journey (writes) */
export const getPrep = async (rid: string): Promise<LivePrep> => toPrep(await apiFetch<Raw>(`/api/event/registrations/${enc(rid)}/prep`))
export const savePrep = async (rid: string, doneTaskIds: string[]): Promise<LivePrep> => toPrep(await apiFetch<Raw>(`/api/event/registrations/${enc(rid)}/prep`, { method: 'PUT', json: { doneTaskIds } }))
export const listMessages = async (eid: string): Promise<LiveThreadMsg[]> => arr<Raw>(await apiFetch(`/api/event/${enc(eid)}/messages`)).map(toThreadMsg)
export const sendMessage = async (eid: string, text: string): Promise<LiveThreadMsg> => toThreadMsg(await apiFetch<Raw>(`/api/event/${enc(eid)}/messages`, { method: 'POST', json: { text } }))
export const askSpeaker = (eid: string, text: string) => apiFetch(`/api/event/${enc(eid)}/speaker-questions`, { method: 'POST', json: { text } })
export const sendFeedback = (eid: string, rating: number, comment: string) => apiFetch(`/api/event/${enc(eid)}/feedback`, { method: 'POST', json: { rating, comment: comment || undefined } })
export type ConnectionType = 'MEET_NOW' | 'PRE_MEETING' | 'CONNECT'
export const connectParticipant = (eid: string, targetParticipantId: string, type: ConnectionType, message?: string) =>
  apiFetch(`/api/event/${enc(eid)}/connections`, { method: 'POST', json: { targetParticipantId, type, message } })

/* ------------------------------------------------------- catalog options */
/**
 * GET /api/event/options. Leader 01/11/2026 (OPEN-QUESTIONS Q19, option B): events are online-first like Show.
 * The format filter (ALL/OFFLINE/HYBRID) only exists when the BE flag `app.event.offline-formats-enabled` is on.
 * Any failure (older BE without the endpoint, network) falls back to online-first.
 */
export interface EventOptions { offlineFormatsEnabled: boolean }
const ONLINE_FIRST: EventOptions = { offlineFormatsEnabled: false }
export async function fetchEventOptions(): Promise<EventOptions> {
  try {
    const r = await apiFetch<Raw>('/api/event/options')
    return { offlineFormatsEnabled: r?.offlineFormatsEnabled === true }
  } catch (e) {
    if (missing(e)) mockFallback('GET /api/event/options', 'online-first default')
    return ONLINE_FIRST
  }
}

/* ------------------------------------------------------------------ hooks */
function useBoth<T>(key: string | null, sync: () => T, fetcher: () => Promise<T>): Remote<T> {
  const r = useRemote<T>(USE_MOCK ? null : key, fetcher)
  if (USE_MOCK) return { data: sync(), loading: false, error: undefined, reload: () => {} }
  return r
}
export const useEventProgramme = (ev: EventItem) => useBoth('evprog:' + ev.id, () => getProgramme(ev.id), () => fetchProgramme(ev))
export const useEventProducts = (ev: EventItem) => useBoth('evprod:' + ev.id, () => eventProducts(ev), () => fetchEventProducts(ev))
export const useEventParticipants = (ev: EventItem) => useBoth('evpart:' + ev.id, () => eventParticipants(ev), () => fetchParticipants(ev))
export const useEventRecap = (ev: EventItem) => useBoth('evrecap:' + ev.id, () => getRecap(ev), () => fetchRecap(ev))
export const useEventMaterials = (ev: EventItem, enabled = true) => useBoth(enabled ? 'evmat:' + ev.id : null, () => sampleMaterials(ev), () => fetchMaterials(ev))
/** Mock mode has no BE flag: online-first (the Leader's default). */
export const useEventOptions = (): EventOptions => useBoth('evopts', () => ONLINE_FIRST, fetchEventOptions).data ?? ONLINE_FIRST
/** The signed-in organisation's registrations (live only; empty in mock mode, which tracks them locally). */
export const useMyRegistrations = (enabled: boolean) => useRemote<RegistrationFull[]>(!USE_MOCK && enabled ? 'myreg' : null, fetchMyRegistrations)
