import type { ImportRequest } from '@/data/mock'
import { arr, bi, id, num, str, type Raw } from './common'

/** ImportRequestListItem/DetailResponse -> FE ImportRequest. `displayStatus` (OPEN|CLOSED) is the FE-facing status. */
export function toImportRequest(r: Raw): ImportRequest {
  const st = str(r.displayStatus || r.status).toUpperCase()
  return {
    id: id(r.id),
    requestCode: str(r.requestCode),
    requestName: bi(r.requestName),
    description: bi(r.description),
    productType: str(r.productType),
    categoryId: id(r.categoryId),
    organizationName: str(r.organizationName),
    organizationEmail: str(r.organizationEmail),
    organizationPhone: str(r.organizationPhone),
    country: str(r.country),
    countryName: bi(r.countryName || r.country),
    address: str(r.address),
    price: num(r.price),
    quantity: num(r.quantity),
    unit: str(r.unit),
    startTime: str(r.startTime),
    endTime: str(r.endTime),
    status: st === 'CLOSED' ? 'CLOSED' : 'OPEN',
    viewCount: num(r.viewCount),
    quoteCount: num(r.quoteCount),
    requirements: arr<string>(r.requirements).map(bi),
  }
}

export interface ImportRequestInput {
  requestName: string; categoryId: string; address: string; quantity: number; unit: string; price: number
  startTime: string; endTime: string; description: string
}
/** FE form -> ImportRequestCreateUpdateRequest (price/quantity are strings on the BE). */
export const fromImportRequestInput = (f: ImportRequestInput) => ({
  requestName: f.requestName, categoryId: f.categoryId, address: f.address, description: f.description,
  quantity: String(f.quantity), price: String(f.price), unit: f.unit,
  startTime: f.startTime.slice(0, 10), endTime: f.endTime.slice(0, 10),
})
