/** "Sản phẩm của tôi": a signed-in business creates, edits, hides/shows and deletes its own products (vi source + en/ko translations). */
import { EyeOff, Pencil, Plus, Trash2, Eye } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { catalogApi } from '@/api'
import type { MyProduct } from '@/api/catalogApi'
import { useToast } from '@/components/ui/overlay'
import { Badge, Button, Input, Skeleton } from '@/components/ui/primitives'
import { Select } from '@/components/ui/select'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'
import { formatNumber, img } from '@/lib/utils'



export function MyProducts() {
  const toast = useToast()
  const { locale } = useI18n()
  const [state, setState] = useState<'all' | 'visible' | 'hidden'>('all')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState<{ items: MyProduct[]; total: number } | null>(null)
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const openEditor = (p: MyProduct) => navigate(`/account/catalog/products/${p.id}`, { state: { product: p } })

  const load = useCallback(() => {
    setError('')
    catalogApi.myProducts(keyword, state, page).then((r) => setData({ items: r.items, total: r.total }), (e: Error) => { setData({ items: [], total: 0 }); setError(e.message) })
  }, [keyword, state, page])
  useEffect(load, [load])

  const act = (p: Promise<unknown>, ok: string) => p.then(() => { toast({ kind: 'success', title: ok }); load() }, (e: Error) => toast({ kind: 'info', title: e.message }))

  const badge = (p: MyProduct) => p.moderationStatus === 'PENDING' ? <Badge variant="outline">{tx('Chờ duyệt', 'Pending review', '검토 대기')}</Badge>
    : p.moderationStatus === 'REJECTED' ? <Badge variant="outline" className="border-red-300 text-red-600">{tx('Bị từ chối', 'Rejected', '거절됨')}</Badge>
    : p.visible ? <Badge>{tx('Đang hiển thị', 'Visible', '공개 중')}</Badge> : <Badge variant="secondary">{tx('Đã ẩn', 'Hidden', '숨김')}</Badge>

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(0) }} placeholder={tx('Tìm sản phẩm của tôi…', 'Search my products…', '내 제품 검색…')} className="sm:max-w-xs" />
        <Select value={state} onValueChange={(v) => { setState(v); setPage(0) }} className="w-auto min-w-40" aria-label={tx('Trạng thái hiển thị', 'Visibility', '공개 상태')} options={[
          { value: 'all', label: tx('Tất cả', 'All', '전체') },
          { value: 'visible', label: tx('Đang hiển thị', 'Visible', '공개') },
          { value: 'hidden', label: tx('Đã ẩn', 'Hidden', '숨김') },
        ]} />
        <Button className="ml-auto" onClick={() => navigate('/account/catalog/products/new')}><Plus /> {tx('Thêm sản phẩm', 'Add product', '제품 추가')}</Button>
      </div>
      {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!data ? <Skeleton className="h-40" /> : data.items.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{tx('Chưa có sản phẩm nào.', 'No products yet.', '제품이 없습니다.')}</p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {data.items.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-4 p-4" data-testid="my-product-row">
              <img src={img(p.productImages[0] ?? '', 120, 120)} alt="" className="size-14 rounded-lg bg-muted object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.productName}</p>
                <p className="text-xs text-muted-foreground">{p.productCode} · {p.categoryName} · MOQ {p.moq == null ? '-' : formatNumber(p.moq, locale)} · FOB {p.priceFob ?? '-'}</p>
                {p.moderationStatus === 'REJECTED' && (
                  <p className="mt-1 text-xs text-red-600">
                    {p.moderationNote ? <>{tx('Lý do từ chối', 'Rejection reason', '거절 사유')}: {p.moderationNote} · </> : null}
                    <button type="button" className="font-semibold underline" onClick={() => openEditor(p)}>{tx('Sửa và gửi duyệt lại', 'Edit and resubmit', '수정 후 재제출')}</button>
                  </p>
                )}
                {p.moderationStatus === 'PENDING' && <p className="mt-1 text-xs text-muted-foreground">{tx('VCCI đang kiểm duyệt; sản phẩm sẽ hiển thị khi được duyệt.', 'Under VCCI review; it becomes visible once approved.', 'VCCI 검토 중이며 승인 후 공개됩니다.')}</p>}
              </div>
              {badge(p)}
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" aria-label="edit" onClick={() => openEditor(p)}><Pencil /></Button>
                <Button size="icon" variant="ghost" aria-label={p.visible ? 'hide' : 'show'} disabled={!p.visible && p.moderationStatus !== 'APPROVED'}
                  onClick={() => act(catalogApi.setMyProductVisible(p.id, !p.visible), p.visible ? tx('Đã ẩn sản phẩm', 'Product hidden', '제품을 숨겼습니다') : tx('Đã hiển thị sản phẩm', 'Product visible', '제품을 공개했습니다'))}>
                  {p.visible ? <EyeOff /> : <Eye />}
                </Button>
                <Button size="icon" variant="ghost" aria-label="delete" onClick={() => { if (window.confirm(tx('Xoá sản phẩm này? Sản phẩm cũng bị gỡ khỏi các hội chợ đang tham gia.', 'Delete this product? It is also removed from the trade shows it is in.', '이 제품을 삭제할까요? 참가 중인 박람회에서도 제거됩니다.'))) act(catalogApi.deleteMyProduct(p.id), tx('Đã xoá', 'Deleted', '삭제됨')) }}><Trash2 /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {data && data.total > 20 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>‹</Button>
          <span>{page + 1} / {Math.ceil(data.total / 20)}</span>
          <Button variant="outline" size="sm" disabled={(page + 1) * 20 >= data.total} onClick={() => setPage(page + 1)}>›</Button>
        </div>
      )}
          </div>
  )
}
