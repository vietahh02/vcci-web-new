import { IMG, type Business, type BusinessType, type DocumentItem } from '@/data/mock'
import type { PublicProfile } from '@/data/capability'
import { arr, bi, id, num, str, url, type Raw } from './common'

/** BusinessListItem / BusinessDetailResponse -> FE Business. */
export function toBusiness(r: Raw): Business {
  const mins = num(r.responseTimeMinutes)
  return {
    id: id(r.id),
    name: str(r.name),
    nameEn: str(r.nameEn || r.name),
    industry: arr<string>(r.industry),
    categoryId: id(r.categoryId),
    taxCode: str(r.taxCode),
    address: str(r.address),
    province: str(r.province),
    country: str(r.country, 'VN'),
    reputationScore: num(r.reputationScore),
    website: str(r.website),
    email: str(r.email),
    phone: str(r.phone),
    employees: str(r.employees),
    founded: num(r.founded),
    businessType: str(r.businessType, 'VN_EXPORTER') as BusinessType,
    verified: Boolean(r.verified),
    coverImage: url(r.coverImage ?? r.coverUrl ?? r.logoUrl, IMG.warehouse),
    accent: str(r.accent, '#0b4f8a'),
    description: bi(r.description),
    capabilities: arr<string>(r.capabilities).map(bi),
    markets: arr<string>(r.markets),
    responseRate: num(r.responseRate),
    responseTime: bi(mins ? (mins >= 60 ? `${Math.round(mins / 60)}h` : `${mins}m`) : ''),
    documents: arr(r.documents).map((d): DocumentItem => ({ id: id(d.id), type: str(d.type), name: str(d.name || d.fileName), url: url(d.url, '#'), uploadedAt: str(d.uploadedAt || d.createdDate) })),
  }
}

const empty: PublicProfile = {
  own: false, nameEn: '',
  facts: { legalForm: '', businessType: '', founded: '', charterCapital: '', employees: '', website: '', fax: '', representative: { name: '', title: '' }, contact: { name: '', title: '', phone: '', email: '' }, legalVerified: [] },
  capability: { factoryArea: '', productionLines: '', monthlyCapacity: '', exportPct: '', moq: '', oem: '', supply: '', mainProducts: [], qcProcess: '', highlights: [] },
  exports: { share: '', markets: [], modes: [], traceability: '' },
  certificates: [], gallery: [], documents: [], video: '', needs: { partnerTypes: [], opportunities: [] },
}

/** The flat PublicProfile fields of GET /api/business/{id} -> FE PublicProfile (defensive: any missing block falls back to empty). */
export function toPublicProfile(r: Raw, biz: Business): PublicProfile {
  const f = (r.facts ?? {}) as Raw
  const c = (r.capability ?? {}) as Raw
  const e = (r.exports ?? {}) as Raw
  return {
    own: Boolean(r.own),
    nameEn: str(r.nameEn || biz.nameEn),
    logo: r.logoUrl ? url(r.logoUrl) : undefined,
    cover: r.coverUrl ? url(r.coverUrl) : undefined,
    facts: {
      ...empty.facts, ...f,
      founded: str(f.founded ?? biz.founded),
      employees: str(f.employees ?? biz.employees),
      website: str(f.website ?? biz.website),
      representative: { ...empty.facts.representative, ...(f.representative ?? {}) },
      contact: { phone: biz.phone, email: biz.email, name: '', title: '', ...(f.contact ?? {}) },
      legalVerified: arr<string>(f.legalVerified),
    },
    capability: { ...empty.capability, ...c, mainProducts: arr<string>(c.mainProducts), highlights: arr<string>(c.highlights).map(bi) },
    exports: { ...empty.exports, ...e, markets: arr<string>(e.markets).length ? arr<string>(e.markets) : biz.markets, modes: arr<string>(e.modes) },
    certificates: arr(r.certificates).map((x) => ({ name: str(x.name), issuer: str(x.issuer), expiry: str(x.expiry), preview: x.preview ? url(x.preview) : undefined })),
    gallery: arr(r.gallery).map((g) => ({ id: id(g.id), url: url(g.url), caption: str(g.caption), kind: str(g.kind) })),
    documents: arr(r.profileDocuments ?? r.documents).filter((d) => 'size' in d || 'kind' in d).map((d) => ({ id: id(d.id), name: str(d.name), kind: str(d.kind), size: num(d.size), preview: d.preview ? url(d.preview) : undefined, url: d.url ? url(d.url) : undefined })),
    video: str(r.video),
    needs: { partnerTypes: arr<string>(r.needs?.partnerTypes), opportunities: arr<string>(r.needs?.opportunities) },
  }
}

/** Minimal Business used while the supplier record is loading or unavailable (e.g. product detail only knows id + name). */
export const businessStub = (bid: string, name = ''): Business => toBusiness({ id: bid, name })
