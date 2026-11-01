/** GET/PUT /api/me/profile: BE returns the CompanyProfile in FE shape; merge over emptyProfile so partial payloads never crash forms. */
import { emptyProfile, type CompanyProfile } from '@/lib/profile'
import { str, type Raw } from './common'

export interface RemoteProfile {
  organizationId: string
  orgStatus: string
  statusReason: string
  verified: boolean
  profile: CompanyProfile
  completion: number
}

export function toCompanyProfile(r: Raw | null | undefined): CompanyProfile {
  const e = emptyProfile()
  const p = (r ?? {}) as Raw
  return {
    ...e, ...p,
    general: { ...e.general, ...p.general },
    capability: { ...e.capability, ...p.capability, mainProducts: p.capability?.mainProducts?.length ? p.capability.mainProducts : e.capability.mainProducts },
    exports: { ...e.exports, ...p.exports },
    finance: { ...e.finance, ...p.finance, revenues: p.finance?.revenues?.length ? p.finance.revenues : e.finance.revenues },
    needs: { ...e.needs, ...p.needs },
    attendees: p.attendees ?? e.attendees,
    registration: { ...e.registration, ...p.registration, legalDocs: { ...e.registration.legalDocs, ...p.registration?.legalDocs } },
    media: { ...e.media, ...p.media },
    consent: { ...e.consent, ...p.consent },
  }
}

export function toRemoteProfile(r: Raw): RemoteProfile {
  const c = r.completion
  return {
    organizationId: str(r.organizationId), orgStatus: str(r.orgStatus), statusReason: str(r.statusReason), verified: Boolean(r.verified),
    profile: toCompanyProfile(r.profile),
    completion: typeof c === 'number' ? c : Number(c?.percent ?? 0),
  }
}
