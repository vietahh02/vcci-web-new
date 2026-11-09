/** /account/catalog/products/new and /account/catalog/products/:id - full-page product editor (replaces the old popup). */
import { ArrowLeft, Check, ImagePlus, Languages, Package, Plus, Tag, Wallet, X, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { catalogApi } from '@/api'
import type { MyProduct, MyProductInput } from '@/api/catalogApi'
import { categories } from '@/data/mock'
import { useToast } from '@/components/ui/overlay'
import { Badge, Button, Field, Input, Skeleton, Textarea } from '@/components/ui/primitives'
import { Select } from '@/components/ui/select'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'
import { img } from '@/lib/utils'

const MAX_IMAGES = 10
const MAX_IMAGE_MB = 5
const LIST_PATH = '/account/catalog'

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

/** Page entry: a new product, or an existing one passed in router state (fallback: look it up in the first page of "my products"). */
export default function ProductEditPage() {
  useI18n()
  const { id } = useParams()
  const location = useLocation()
  const fromState = (location.state as { product?: MyProduct } | null)?.product
  const isNew = !id
  const [loaded, setLoaded] = useState<MyProduct | null | undefined>(isNew ? null : fromState)

  useEffect(() => {
    if (isNew || loaded) return
    catalogApi.myProducts('', 'all', 0).then(
      (r) => setLoaded(r.items.find((p) => String(p.id) === id) ?? null),
      () => setLoaded(null),
    )
  }, [id, isNew, loaded])

  if (loaded === undefined) {
    return <div className="container-page space-y-4 py-10"><Skeleton className="h-10 w-72" /><Skeleton className="h-96 w-full rounded-3xl" /></div>
  }
  if (!isNew && loaded === null) {
    return (
      <div className="container-page py-24 text-center">
        <p className="font-semibold">{tx('Không tìm thấy sản phẩm.', 'Product not found.', '제품을 찾을 수 없습니다.')}</p>
        <Link to={LIST_PATH} className="mt-4 inline-block font-semibold text-primary">{tx('Quay lại danh sách', 'Back to list', '목록으로')}</Link>
      </div>
    )
  }
  return <ProductEditor key={id ?? 'new'} product={loaded ?? null} />
}

function ProductEditor({ product }: { product: MyProduct | null }) {
  const toast = useToast()
  const navigate = useNavigate()
  const [d, setD] = useState<Draft>(product ? fromProduct(product) : emptyDraft())
  const [keep, setKeep] = useState<string[]>(product?.productImages ?? [])
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }))
  const back = () => navigate(LIST_PATH)

  const addFiles = (list: FileList | null) => {
    const picked = Array.from(list ?? [])
    const bad = picked.find((f) => !/^image\/(jpeg|png|webp)$/.test(f.type) || f.size > MAX_IMAGE_MB * 1024 * 1024)
    if (bad) { setErr(tx(`Ảnh phải là JPG/PNG/WebP, tối đa ${MAX_IMAGE_MB}MB (${bad.name})`, `Images must be JPG/PNG/WebP up to ${MAX_IMAGE_MB}MB (${bad.name})`, `이미지는 JPG/PNG/WebP, 최대 ${MAX_IMAGE_MB}MB (${bad.name})`)); return }
    if (keep.length + files.length + picked.length > MAX_IMAGES) { setErr(tx(`Tối đa ${MAX_IMAGES} ảnh`, `At most ${MAX_IMAGES} images`, `이미지는 최대 ${MAX_IMAGES}장`)); return }
    setErr('')
    setFiles((f) => [...f, ...picked])
  }

  const submit = (e: FormEvent) => {
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
      () => { toast({ kind: 'success', title: tx('Đã lưu sản phẩm', 'Product saved', '저장되었습니다') }); navigate(LIST_PATH) },
      (er: Error) => { setErr(er.message); setBusy(false) },
    )
  }

  const status = product && (product.moderationStatus === 'PENDING'
    ? <Badge variant="outline">{tx('Chờ duyệt', 'Pending review', '검토 대기')}</Badge>
    : product.moderationStatus === 'REJECTED'
      ? <Badge variant="outline" className="border-red-300 text-red-600">{tx('Bị từ chối', 'Rejected', '거절됨')}</Badge>
      : product.visible ? <Badge>{tx('Đang hiển thị', 'Visible', '공개 중')}</Badge> : <Badge variant="secondary">{tx('Đã ẩn', 'Hidden', '숨김')}</Badge>)

  const actions = (
    <>
      <Button type="button" variant="outline" onClick={back}>{tx('Huỷ', 'Cancel', '취소')}</Button>
      <Button type="submit" form="product-form" disabled={busy} size="lg" className="min-w-36"><Check /> {busy ? '…' : tx('Lưu sản phẩm', 'Save product', '저장')}</Button>
    </>
  )

  return (
    <div className="container-page pb-32 pt-8">
      <Link to={LIST_PATH} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary">
        <ArrowLeft className="size-4" /> {tx('Sản phẩm & gian hàng', 'Products & booths', '제품 및 부스')}
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{product ? tx('Chỉnh sửa sản phẩm', 'Edit product', '제품 수정') : tx('Sản phẩm mới', 'New product', '새 제품')}</p>
          <h1 className="mt-1 truncate text-3xl font-extrabold tracking-tight">{d.productName || tx('Sản phẩm chưa đặt tên', 'Untitled product', '이름 없는 제품')}</h1>
        </div>
        {status}
      </div>

      <form id="product-form" onSubmit={submit} className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <Section icon={Package} title={tx('Thông tin cơ bản', 'Basic info', '기본 정보')} hint={tx('Nội dung gốc bằng tiếng Việt.', 'Original content in Vietnamese.', '베트남어 원문.')}>
            <div className="grid gap-4">
              <Field label={tx('Tên sản phẩm (tiếng Việt)', 'Product name (Vietnamese)', '제품명 (베트남어)')} htmlFor="mp-name">
                <Input id="mp-name" placeholder={tx('VD: Cà phê Robusta nhân xanh S18', 'e.g. Green Robusta coffee beans S18', '예: 로부스타 생두 S18')} value={d.productName} maxLength={500} onChange={(e) => set('productName', e.target.value)} required />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={tx('Danh mục', 'Category', '카테고리')} htmlFor="mp-cat">
                  <Select id="mp-cat" value={d.categoryId} onValueChange={(v) => set('categoryId', v)} required placeholder={tx('Chọn danh mục', 'Choose a category', '카테고리 선택')} options={categories.map((c) => ({ value: c.id, label: c.categoryName.vi }))} />
                </Field>
                <Field label={tx('Xuất xứ', 'Origin', '원산지')} htmlFor="mp-origin"><Input id="mp-origin" placeholder={tx('VD: Đắk Lắk, Việt Nam', 'e.g. Dak Lak, Vietnam', '예: 베트남 닥락')} value={d.origin} onChange={(e) => set('origin', e.target.value)} /></Field>
              </div>
              <Field label={tx('Mô tả (tiếng Việt)', 'Description (Vietnamese)', '설명 (베트남어)')} htmlFor="mp-desc">
                <Textarea id="mp-desc" placeholder={tx('Quy cách, chất lượng, chứng nhận, đóng gói, năng lực cung ứng…', 'Spec, grade, certificates, packing, supply capacity…', '규격, 등급, 인증, 포장, 공급 능력…')} rows={5} maxLength={4000} value={d.description} onChange={(e) => set('description', e.target.value)} />
              </Field>
            </div>
          </Section>

          <Section icon={Wallet} title={tx('Giá & giao hàng', 'Pricing & delivery', '가격 및 배송')} hint={tx('Để trống nếu chưa có giá.', 'Leave empty if not set yet.', '가격이 없으면 비워 두세요.')}>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={tx('Đơn vị', 'Unit', '단위')} htmlFor="mp-unit"><Input id="mp-unit" value={d.unit} placeholder="kg, MT, pcs" onChange={(e) => set('unit', e.target.value)} /></Field>
              <Field label="MOQ" htmlFor="mp-moq"><Input id="mp-moq" placeholder={tx('VD: 100', 'e.g. 100', '예: 100')} type="number" min={1} value={d.moq} onChange={(e) => set('moq', e.target.value)} /></Field>
              <Field label={tx('Thời gian giao hàng', 'Lead time', '리드타임')} htmlFor="mp-lead"><Input id="mp-lead" placeholder={tx('VD: 15–20 ngày sau khi đặt cọc', 'e.g. 15–20 days after deposit', '예: 계약금 후 15–20일')} value={d.leadTime} maxLength={200} onChange={(e) => set('leadTime', e.target.value)} /></Field>
              <Field label="FOB" htmlFor="mp-fob"><Input id="mp-fob" placeholder={tx('VD: 4.50', 'e.g. 4.50', '예: 4.50')} type="number" min={0} step="0.01" value={d.priceFob} onChange={(e) => set('priceFob', e.target.value)} /></Field>
              <Field label="CIF" htmlFor="mp-cif"><Input id="mp-cif" placeholder={tx('VD: 5.20', 'e.g. 5.20', '예: 5.20')} type="number" min={0} step="0.01" value={d.priceCif} onChange={(e) => set('priceCif', e.target.value)} /></Field>
            </div>
          </Section>

          <Section icon={Tag} title={tx('Thông số & chứng nhận', 'Specs & certificates', '사양 및 인증')}>
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-semibold">{tx('Thông số kỹ thuật', 'Specifications', '사양')}</p>
                <div className="space-y-2">
                  {d.specs.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={s.label} placeholder={tx('Tên thông số', 'Label', '항목')} maxLength={100} onChange={(e) => set('specs', d.specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                      <Input value={s.value} placeholder={tx('Giá trị', 'Value', '값')} maxLength={300} onChange={(e) => set('specs', d.specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                      <Button type="button" variant="ghost" size="icon" aria-label="remove spec" onClick={() => set('specs', d.specs.filter((_, j) => j !== i))}><X /></Button>
                    </div>
                  ))}
                </div>
                {d.specs.length < 20 && (
                  <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => set('specs', [...d.specs, { label: '', value: '' }])}><Plus /> {tx('Thêm dòng', 'Add row', '행 추가')}</Button>
                )}
              </div>
              <Field label={tx('Chứng nhận (cách nhau bằng dấu phẩy)', 'Certificates (comma separated)', '인증 (쉼표로 구분)')} htmlFor="mp-certs">
                <Input id="mp-certs" value={d.certs} placeholder="ISO 9001, HACCP" onChange={(e) => set('certs', e.target.value)} />
              </Field>
            </div>
          </Section>

          <Section icon={Languages} title={tx('Bản dịch', 'Translations', '번역')} hint={tx('Ban quản trị duyệt trước khi hiển thị.', 'Reviewed by admin before being shown.', '관리자 검토 후 공개됩니다.')}>
            <div className="grid gap-4 md:grid-cols-2">
              {(['en', 'ko'] as const).map((lng) => (
                <div key={lng} className="space-y-3 rounded-2xl border bg-muted/30 p-4">
                  <p className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <span>{lng === 'en' ? 'English' : '한국어'}</span>
                    {product?.translations[lng]?.state && <span className="font-normal normal-case">{product.translations[lng]!.state}</span>}
                  </p>
                  <Input value={d[lng].productName} placeholder={tx('Tên sản phẩm', 'Product name', '제품명')} maxLength={500} onChange={(e) => set(lng, { ...d[lng], productName: e.target.value })} />
                  <Textarea rows={3} value={d[lng].description} placeholder={tx('Mô tả', 'Description', '설명')} maxLength={4000} onChange={(e) => set(lng, { ...d[lng], description: e.target.value })} />
                </div>
              ))}
            </div>
          </Section>
        </div>

        <aside className="min-w-0 space-y-6 lg:sticky lg:top-32 lg:self-start">
          <Section icon={ImagePlus} title={tx('Ảnh sản phẩm', 'Product images', '제품 이미지')} hint={`${keep.length + files.length}/${MAX_IMAGES}`}>
            <div className="grid grid-cols-3 gap-2">
              {keep.map((u, i) => <Thumb key={u} src={img(u, 240, 240)} first={i === 0} onRemove={() => setKeep(keep.filter((x) => x !== u))} />)}
              {files.map((f, i) => <Thumb key={f.name + i} src={URL.createObjectURL(f)} first={keep.length === 0 && i === 0} onRemove={() => setFiles(files.filter((_, j) => j !== i))} />)}
              <button type="button" onClick={() => fileRef.current?.click()} className="grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-primary/30 text-primary transition-all duration-200 hover:border-primary hover:bg-primary-soft" aria-label="add image">
                <ImagePlus className="size-6" />
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{tx('JPG, PNG hoặc WebP, tối đa 5MB mỗi ảnh. Ảnh đầu tiên là ảnh đại diện.', 'JPG, PNG or WebP, up to 5MB each. The first image is the cover.', 'JPG, PNG, WebP, 장당 최대 5MB. 첫 번째 이미지가 대표 이미지입니다.')}</p>
          </Section>

          {err && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{err}</p>}

          <div className="hidden gap-2 lg:flex lg:justify-end">{actions}</div>
        </aside>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur-xl lg:hidden">
        <div className="container-page flex justify-end gap-2 py-3">{actions}</div>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, hint, children }: { icon: LucideIcon; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border bg-card p-6 shadow-sm md:p-7">
      <header className="mb-5 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary"><Icon className="size-5" /></span>
        <div className="min-w-0">
          <h2 className="font-bold">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}

function Thumb({ src, first, onRemove }: { src: string; first?: boolean; onRemove: () => void }) {
  return (
    <span className="group relative aspect-square overflow-hidden rounded-2xl bg-muted shadow-sm">
      <img src={src} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
      {first && <span className="absolute bottom-1.5 left-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">{tx('Đại diện', 'Cover', '대표')}</span>}
      <button type="button" onClick={onRemove} aria-label="remove image" className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-red-600"><X className="size-3.5" /></button>
    </span>
  )
}
