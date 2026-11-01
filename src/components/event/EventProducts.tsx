/** "Products traded through this event" — catalogue products linked to the event, with sample quote counts once it is running. */
import { PackageCheck } from 'lucide-react'
import { USE_MOCK } from '@/api'
import { Link } from 'react-router-dom'
import { ProductCard } from '@/components/cards'
import { Badge } from '@/components/ui/primitives'
import { businesses, type EventItem } from '@/data/mock'
import { useEventProducts } from '@/api/eventApi'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'

export function EventProducts({ ev }: { ev: EventItem }) {
  const { L } = useI18n()
  const { data } = useEventProducts(ev)
  const list = data ?? []
  if (!list.length) return null
  const ended = ev.eventStatus === 'ENDED'
  const live = ev.eventStatus === 'ONGOING'
  const title = ended ? tx('Sản phẩm đã giao thương qua sự kiện', 'Products traded through this event', '행사를 통해 거래된 제품')
    : live ? tx('Sản phẩm đang giao thương tại sự kiện', 'Products being traded now', '현재 거래 중인 제품')
    : tx('Sản phẩm sẽ giới thiệu tại sự kiện', 'Products to be presented at this event', '행사에서 소개될 제품')
  return (
    <section className="container-page mt-14" aria-label="products">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight"><PackageCheck className="size-6 text-primary" /> {title}</h2>
        <p className="text-sm text-muted-foreground">{tx('Báo giá và đặt hàng trực tiếp với nhà cung cấp trên hệ thống.', 'Request quotes and order directly with suppliers on the platform.', '플랫폼에서 공급업체에 직접 견적을 요청하세요.')}</p>
      </div>
      <div className="mt-6 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
        {list.map(({ product, quotes }) => {
          const org = businesses.find((b) => b.id === product.organizationId)
          const orgName = org ? L({ vi: org.name, en: org.nameEn }) : product.organizationName
          return (
            <div key={product.id}>
              <ProductCard product={product} />
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {orgName && <Link to={`/suppliers/${product.organizationId}`} className="truncate text-xs font-medium text-primary hover:underline">{orgName}</Link>}
                {(live || ended) && <Badge variant="secondary">{quotes} {tx('yêu cầu báo giá', 'quote requests', '견적 요청')}</Badge>}
              </div>
            </div>
          )
        })}
      </div>
      {(live || ended) && USE_MOCK && <p className="mt-3 text-[11px] text-muted-foreground">{tx('Số yêu cầu báo giá là số liệu minh hoạ trong bản mẫu.', 'Quote counts are sample figures in this prototype.', '견적 수는 프로토타입 샘플입니다.')}</p>}
    </section>
  )
}
