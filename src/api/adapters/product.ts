import { IMG, type Product } from '@/data/mock'
import { arr, bi, id, num, str, url, type Raw } from './common'

/** ProductListItemResponse | ProductResponse -> FE Product. Fields BE does not expose yet (specs, leadTime) stay empty. */
export function toProduct(r: Raw): Product {
  return {
    id: id(r.id),
    productCode: str(r.productCode),
    productName: bi(r.productName),
    categoryId: id(r.categoryId),
    organizationId: id(r.organizationId),
    organizationName: r.organizationName ? str(r.organizationName) : undefined,
    industry: str(r.industry),
    description: bi(r.description),
    productImages: arr<string>(r.productImages).length ? arr<string>(r.productImages).map((u) => url(u)) : [IMG.warehouse],
    origin: str(r.origin),
    unit: str(r.unit),
    moq: num(r.moq),
    priceFob: num(r.priceFob),
    priceCif: num(r.priceCif),
    paymentTerms: str(r.paymentTerms),
    // certificate labels (ISO 9001...) come from certificateLabels; `certificates` holds uploaded file URLs and is only a fallback for old rows
    certificates: arr<string>(r.certificateLabels).length ? arr<string>(r.certificateLabels) : arr<string>(r.certificates).filter((c) => !/^(https?:)?\//.test(c)),
    viewCount: num(r.viewCount),
    createdDate: str(r.createdDate, new Date().toISOString()),
    leadTime: bi(str(r.leadTime)),
    specs: arr(r.specs).map((s) => ({ label: bi(s.label), value: str(s.value) })),
  }
}
