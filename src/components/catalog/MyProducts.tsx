/** "Sản phẩm của tôi": a signed-in business creates, edits, hides/shows and deletes its own products (vi source + en/ko translations). */
import { EyeOff, ImagePlus, Pencil, Plus, Trash2, Eye, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { catalogApi } from '@/api'
import type { MyProduct, MyProductInput } from '@/api/catalogApi'
import { categories } from '@/data/mock'
import { Dialog, DialogContent, useToast } from '@/components/ui/overlay'
import { Badge, Button, Field, Input, Skeleton, Textarea } from '@/components/ui/primitives'
import { Select } from '@/components/ui/select'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'
import { formatNumber, img } from '@/lib/utils'

const MAX_IMAGES = 10
const MAX_IMAGE_MB = 5

interface Draft {
  productName: string; categoryId: string; description: string; origin: string; unit: string; moq: string; priceFob: string; priceCif: string
  leadTime: string; specs: { label: string; value: string }[]; certs: string
  en: { productName: string; description: string }; ko: { productName: string; description: string }
}
const emptyDraft = (): Draft => ({
  productName: '', categoryId: '', description: '', origin: '', unit: '', moq: '', priceFob: '', priceCif: '', leadTime: '',
  specs: [{ label: '', value: '' }], certs: '', en: { productName: '', description: '' }, ko: { productName: '', description: '' },
})
const fromProduct = (p: MyProduct): Draft => ({
  productName: p.productName, categoryId: p.categoryId, description: p.description, origin: p.origin, unit: p.unit, moq: p.moq == null ? '' : String(p.moq),
  priceFob: p.priceFob == null ? '' : String(p.priceFob), priceCif: p.priceCif == null ? '' : String(p.priceCif), leadTime: p.leadTime,
  specs: p.specs.length ? p.specs : [{ label: '', value: '' }], certs: p.certificateLabels.join(', '),
  en: { productName: p.translations.en?.productName ?? '', description: p.translations.en?.description ?? '' },
  ko: { productName: p.translations.ko?.productName ?? '', description: p.translations.ko?.description ?? '' },
})

export function MyProducts() {
  const toast = useToast()
  const { locale } = useI18n()
  const [state, setState] = useState<'all' | 'visible' | 'hidden'>('all')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState<{ items: MyProduct[]; total: number } | null>(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<MyProduct | 'new' | null>(null)

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
        <Button className="ml-auto" onClick={() => setEditing('new')}><Plus /> {tx('Thêm sản phẩm', 'Add product', '제품 추가')}</Button>
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
                    <button type="button" className="font-semibold underline" onClick={() => setEditing(p)}>{tx('Sửa và gửi duyệt lại', 'Edit and resubmit', '수정 후 재제출')}</button>
                  </p>
                )}
                {p.moderationStatus === 'PENDING' && <p className="mt-1 text-xs text-muted-foreground">{tx('VCCI đang kiểm duyệt; sản phẩm sẽ hiển thị khi được duyệt.', 'Under VCCI review; it becomes visible once approved.', 'VCCI 검토 중이며 승인 후 공개됩니다.')}</p>}
              </div>
              {badge(p)}
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" aria-label="edit" onClick={() => setEditing(p)}><Pencil /></Button>
                <Button size="icon" variant="ghost" aria-label={p.visible ? 'hide' : 'show'} disabled={!p.visible && p.moderationStatus !== 'APPROVED'}
                  onClick={() => act(catalogApi.setMyProductVisible(p.id, !p.visible), p.visible ? tx('Đã ẩn sản phẩm', 'Product hidden', '제품을 숨겼습니다') : tx('Đã hiển thị sản phẩm', 'Product visible', '제품을 공개했습니다'))}>
                  {p.visible ? <EyeOff /> : <Eye />}
                </Button>
                <Button size="icon" variant="ghost" aria-label="delete" onClick={() => { if (window.confirm(tx('Xoá sản phẩm này? Sản phẩm cũng bị gỡ khỏi các gian hàng.', 'Delete this product? It is also removed from your booths.', '이 제품을 삭제할까요? 부스에서도 제거됩니다.'))) act(catalogApi.deleteMyProduct(p.id), tx('Đã xoá', 'Deleted', '삭제됨')) }}><Trash2 /></Button>
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
      {editing && <ProductDialog product={editing === 'new' ? null : editing} onClose={(saved) => { setEditing(null); if (saved) load() }} />}
    </div>
  )
}

function ProductDialog({ product, onClose }: { product: MyProduct | null; onClose: (saved: boolean) => void }) {
  const toast = useToast()
  const [d, setD] = useState<Draft>(product ? fromProduct(product) : emptyDraft())
  const [keep, setKeep] = useState<string[]>(product?.productImages ?? [])
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }))

  const addFiles = (list: FileList | null) => {
    const picked = Array.from(list ?? [])
    const bad = picked.find((f) => !/^image\/(jpeg|png|webp)$/.test(f.type) || f.size > MAX_IMAGE_MB * 1024 * 1024)
    if (bad) { setErr(tx(`Ảnh phải là JPG/PNG/WebP, tối đa ${MAX_IMAGE_MB}MB (${bad.name})`, `Images must be JPG/PNG/WebP up to ${MAX_IMAGE_MB}MB (${bad.name})`, `이미지는 JPG/PNG/WebP, 최대 ${MAX_IMAGE_MB}MB (${bad.name})`)); return }
    if (keep.length + files.length + picked.length > MAX_IMAGES) { setErr(tx(`Tối đa ${MAX_IMAGES} ảnh`, `At most ${MAX_IMAGES} images`, `이미지는 최대 ${MAX_IMAGES}장`)); return }
    setErr('')
    setFiles((f) => [...f, ...picked])
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!d.productName.trim() || !d.categoryId) { setErr(tx('Cần tên sản phẩm và danh mục', 'Name and category are required', '제품명과 카테고리가 필요합니다')); return }
    const body: MyProductInput = {
      productName: d.productName.trim(), categoryId: Number(d.categoryId), description: d.description, origin: d.origin, unit: d.unit,
      moq: d.moq ? Number(d.moq) : undefined, priceFob: d.priceFob ? Number(d.priceFob) : undefined, priceCif: d.priceCif ? Number(d.priceCif) : undefined,
      leadTime: d.leadTime, specs: d.specs.filter((s) => s.label.trim() || s.value.trim()),
      certificateLabels: d.certs.split(',').map((c) => c.trim()).filter(Boolean), keepImageUrls: keep,
      translations: { en: { productName: d.en.productName, description: d.en.description }, ko: { productName: d.ko.productName, description: d.ko.description } },
    }
    setBusy(true)
    setErr('')
    catalogApi.saveMyProduct(product?.id ?? null, body, files).then(
      () => { toast({ kind: 'success', title: tx('Đã lưu sản phẩm', 'Product saved', '저장되었습니다') }); onClose(true) },
      (er: Error) => { setErr(er.message); setBusy(false) },
    )
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(false) }}>
      <DialogContent title={product ? tx('Sửa sản phẩm', 'Edit product', '제품 수정') : tx('Thêm sản phẩm', 'Add product', '제품 추가')} description={tx('Nội dung gốc bằng tiếng Việt; bản dịch EN/KO được ban quản trị duyệt trước khi hiển thị.', 'Source content is Vietnamese; EN/KO translations are reviewed before they show.', '원문은 베트남어이며 EN/KO 번역은 검토 후 표시됩니다.')}>
        <form onSubmit={submit} className="max-h-[75dvh] space-y-4 overflow-y-auto p-6">
          <Field label={tx('Tên sản phẩm (tiếng Việt)', 'Product name (Vietnamese)', '제품명 (베트남어)')} htmlFor="mp-name"><Input id="mp-name" value={d.productName} maxLength={500} onChange={(e) => set('productName', e.target.value)} required /></Field>
          <Field label={tx('Danh mục', 'Category', '카테고리')} htmlFor="mp-cat">
            <Select id="mp-cat" value={d.categoryId} onValueChange={(v) => set('categoryId', v)} required placeholder="—" options={categories.map((c) => ({ value: c.id, label: c.categoryName.vi }))} />
          </Field>
          <Field label={tx('Mô tả (tiếng Việt)', 'Description (Vietnamese)', '설명 (베트남어)')} htmlFor="mp-desc"><Textarea id="mp-desc" rows={4} maxLength={4000} value={d.description} onChange={(e) => set('description', e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={tx('Xuất xứ', 'Origin', '원산지')} htmlFor="mp-origin"><Input id="mp-origin" value={d.origin} onChange={(e) => set('origin', e.target.value)} /></Field>
            <Field label={tx('Đơn vị', 'Unit', '단위')} htmlFor="mp-unit"><Input id="mp-unit" value={d.unit} placeholder="kg, MT, pcs" onChange={(e) => set('unit', e.target.value)} /></Field>
            <Field label="MOQ" htmlFor="mp-moq"><Input id="mp-moq" type="number" min={1} value={d.moq} onChange={(e) => set('moq', e.target.value)} /></Field>
            <Field label="FOB" htmlFor="mp-fob"><Input id="mp-fob" type="number" min={0} step="0.01" value={d.priceFob} onChange={(e) => set('priceFob', e.target.value)} /></Field>
            <Field label="CIF" htmlFor="mp-cif"><Input id="mp-cif" type="number" min={0} step="0.01" value={d.priceCif} onChange={(e) => set('priceCif', e.target.value)} /></Field>
            <Field label={tx('Thời gian giao hàng', 'Lead time', '리드타임')} htmlFor="mp-lead"><Input id="mp-lead" value={d.leadTime} maxLength={200} onChange={(e) => set('leadTime', e.target.value)} /></Field>
          </div>
          <Field label={tx('Chứng nhận (cách nhau bằng dấu phẩy)', 'Certificates (comma separated)', '인증 (쉼표로 구분)')} htmlFor="mp-certs"><Input id="mp-certs" value={d.certs} placeholder="ISO 9001, HACCP" onChange={(e) => set('certs', e.target.value)} /></Field>
          <div>
            <p className="mb-2 text-sm font-semibold">{tx('Thông số kỹ thuật', 'Specifications', '사양')}</p>
            {d.specs.map((s, i) => (
              <div key={i} className="mb-2 flex gap-2">
                <Input value={s.label} placeholder={tx('Tên thông số', 'Label', '항목')} maxLength={100} onChange={(e) => set('specs', d.specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                <Input value={s.value} placeholder={tx('Giá trị', 'Value', '값')} maxLength={300} onChange={(e) => set('specs', d.specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                <Button type="button" variant="ghost" size="icon" aria-label="remove spec" onClick={() => set('specs', d.specs.filter((_, j) => j !== i))}><X /></Button>
              </div>
            ))}
            {d.specs.length < 20 && <Button type="button" variant="outline" size="sm" onClick={() => set('specs', [...d.specs, { label: '', value: '' }])}><Plus /> {tx('Thêm dòng', 'Add row', '행 추가')}</Button>}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">{tx('Ảnh sản phẩm', 'Product images', '제품 이미지')} ({keep.length + files.length}/{MAX_IMAGES})</p>
            <div className="flex flex-wrap gap-2">
              {keep.map((u) => <Thumb key={u} src={img(u, 160, 160)} onRemove={() => setKeep(keep.filter((x) => x !== u))} />)}
              {files.map((f, i) => <Thumb key={f.name + i} src={URL.createObjectURL(f)} onRemove={() => setFiles(files.filter((_, j) => j !== i))} />)}
              <button type="button" onClick={() => fileRef.current?.click()} className="grid size-20 place-items-center rounded-lg border border-dashed text-muted-foreground hover:text-foreground" aria-label="add image"><ImagePlus /></button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
            </div>
          </div>
          {(['en', 'ko'] as const).map((lng) => (
            <fieldset key={lng} className="space-y-3 rounded-xl border p-4">
              <legend className="px-1 text-xs font-bold uppercase">{lng === 'en' ? 'English' : '한국어'} {product?.translations[lng]?.state && <span className="ml-1 font-normal normal-case text-muted-foreground">({product.translations[lng]!.state})</span>}</legend>
              <Input value={d[lng].productName} placeholder={tx('Tên sản phẩm', 'Product name', '제품명')} maxLength={500} onChange={(e) => set(lng, { ...d[lng], productName: e.target.value })} />
              <Textarea rows={3} value={d[lng].description} placeholder={tx('Mô tả', 'Description', '설명')} maxLength={4000} onChange={(e) => set(lng, { ...d[lng], description: e.target.value })} />
            </fieldset>
          ))}
          {err && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onClose(false)}>{tx('Huỷ', 'Cancel', '취소')}</Button>
            <Button type="submit" disabled={busy}>{busy ? '…' : tx('Lưu', 'Save', '저장')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Thumb({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <span className="relative size-20 overflow-hidden rounded-lg bg-muted">
      <img src={src} alt="" className="size-full object-cover" />
      <button type="button" onClick={onRemove} aria-label="remove image" className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"><X className="size-3" /></button>
    </span>
  )
}
