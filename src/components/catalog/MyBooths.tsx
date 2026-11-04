/** "Gian hàng của tôi": a signed-in business applies for a booth in an open Show, fills the booth profile, adds its products, submits for review and pays the fee. */
import { Plus, Send, Trash2, Undo2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { catalogApi } from '@/api'
import type { BoothInput, MyBooth, OpenShow } from '@/api/catalogApi'
import { fileSrc, uploadFile } from '@/api/uploads'
import { Dialog, DialogContent, useToast } from '@/components/ui/overlay'
import { Badge, Button, Field, Input, Skeleton, Textarea } from '@/components/ui/primitives'
import { Select } from '@/components/ui/select'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'

const GOALS = ['SELL', 'EXPORT', 'SEEK_DISTRIBUTOR', 'SEEK_INVESTOR', 'SEEK_PARTNER'] as const
// Nhãn tính lúc render (không phải lúc nạp module) để đổi ngôn ngữ không bị kẹt ở ngôn ngữ lúc tải trang.
const GOAL_LABEL = (): Record<(typeof GOALS)[number], string> => ({
  SELL: tx('Bán hàng', 'Sell', '판매'), EXPORT: tx('Xuất khẩu', 'Export', '수출'), SEEK_DISTRIBUTOR: tx('Tìm nhà phân phối', 'Find distributors', '유통업체 찾기'),
  SEEK_INVESTOR: tx('Tìm nhà đầu tư', 'Find investors', '투자자 찾기'), SEEK_PARTNER: tx('Tìm đối tác', 'Find partners', '파트너 찾기'),
})
const STATUS = (): Record<string, string> => ({
  DRAFT: tx('Nháp', 'Draft', '초안'), PENDING: tx('Chờ duyệt', 'Pending review', '검토 대기'), REJECTED: tx('Bị từ chối', 'Rejected', '거절됨'),
  APPROVED_AWAITING_PAYMENT: tx('Đã duyệt - chờ thanh toán', 'Approved - awaiting payment', '승인됨 - 결제 대기'), APPROVED: tx('Đã duyệt', 'Approved', '승인됨'), WITHDRAWN: tx('Đã rút', 'Withdrawn', '철회됨'),
})
const FIELD_LABEL = (): Record<string, string> => ({
  description: tx('Giới thiệu gian (≥100 ký tự)', 'Booth introduction (≥100 chars)', '부스 소개 (100자 이상)'), bannerImage: tx('Ảnh banner', 'Banner image', '배너 이미지'),
  product: tx('≥1 sản phẩm', '≥1 product', '제품 1개 이상'), contactName: tx('Người phụ trách', 'Contact name', '담당자'), contactEmail: 'Email', contactPhone: tx('Điện thoại', 'Phone', '전화'),
  goals: tx('Mục tiêu', 'Goals', '목표'), consentExhibitorTerms: tx('Đồng ý điều khoản', 'Accept terms', '약관 동의'),
})

export function MyBooths() {
  useI18n() // đăng ký đổi ngôn ngữ để tx() tính lại
  const toast = useToast()
  const [booths, setBooths] = useState<MyBooth[] | null>(null)
  const [error, setError] = useState('')
  const [shows, setShows] = useState<OpenShow[]>([])
  const [form, setForm] = useState<{ show: OpenShow; booth: MyBooth | null } | null>(null)
  const [picker, setPicker] = useState<MyBooth | null>(null)

  const load = useCallback(() => {
    catalogApi.myBooths().then(setBooths, (e: Error) => { setBooths([]); setError(e.message) })
  }, [])
  useEffect(load, [load])
  useEffect(() => { catalogApi.openShows().then(setShows, () => setShows([])) }, [])

  const act = (p: Promise<unknown>, ok: string) => p.then(() => { toast({ kind: 'success', title: ok }); load() }, (e: Error) => toast({ kind: 'info', title: e.message }))
  const free = shows.filter((s) => !(booths ?? []).some((b) => b.showId === s.id && b.status !== 'WITHDRAWN'))

  return (
    <div>
      {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">{tx('Show đang nhận đăng ký gian:', 'Shows open for booth applications:', '부스 신청 가능한 쇼:')} {shows.length}</p>
        {free.map((s) => <Button key={s.id} size="sm" variant="outline" onClick={() => setForm({ show: s, booth: null })}><Plus /> {s.name}</Button>)}
      </div>
      {!booths ? <Skeleton className="h-40" /> : booths.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{tx('Chưa có gian hàng nào. Chọn một Show ở trên để đăng ký.', 'No booths yet. Pick a Show above to apply.', '부스가 없습니다. 위에서 쇼를 선택해 신청하세요.')}</p>
      ) : (
        <ul className="space-y-4">
          {booths.map((b) => {
            const editable = b.status === 'DRAFT' || b.status === 'REJECTED'
            const show = shows.find((s) => s.id === b.showId)
            return (
              <li key={b.id} className="rounded-xl border p-5" data-testid="my-booth">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-bold">{b.showName}</p>
                  <Badge variant="secondary">{STATUS()[b.status] ?? b.status}</Badge>
                  <span className="text-xs text-muted-foreground">{b.pavilionName ?? ''} · {b.percent}%</span>
                  <div className="ml-auto flex gap-2">
                    {editable && show && <Button size="sm" variant="outline" onClick={() => setForm({ show, booth: b })}>{tx('Sửa hồ sơ', 'Edit', '수정')}</Button>}
                    {editable && <Button size="sm" disabled={b.missing.length > 0} title={b.missing.length ? tx('Hồ sơ chưa đủ', 'Profile incomplete', '프로필 미완성') : ''}
                      onClick={() => act(catalogApi.submitBooth(b.id), tx('Đã gửi duyệt', 'Submitted for review', '검토 요청됨'))}><Send /> {tx('Gửi duyệt', 'Submit', '제출')}</Button>}
                    {b.status !== 'WITHDRAWN' && b.status !== 'APPROVED' && <Button size="sm" variant="ghost" onClick={() => { if (window.confirm(tx('Rút gian hàng này?', 'Withdraw this booth?', '이 부스를 철회할까요?'))) act(catalogApi.withdrawBooth(b.id), tx('Đã rút gian', 'Booth withdrawn', '철회됨')) }}><Undo2 /> {tx('Rút', 'Withdraw', '철회')}</Button>}
                  </div>
                </div>
                {b.status === 'REJECTED' && b.rejectReason && <p className="mt-2 text-sm text-red-600">{tx('Lý do từ chối', 'Reason', '거절 사유')}: {b.rejectReason}</p>}
                {editable && b.missing.length > 0 && <p className="mt-2 text-xs text-muted-foreground">{tx('Còn thiếu', 'Missing', '누락')}: {b.missing.map((m) => FIELD_LABEL()[m] ?? m).join(', ')}</p>}
                {b.status === 'APPROVED_AWAITING_PAYMENT' && <PaymentBox booth={b} onDone={load} />}
                <div className="mt-4">
                  <p className="mb-2 text-sm font-semibold">{tx('Sản phẩm trên gian', 'Booth products', '부스 제품')} ({b.products.length})</p>
                  <ul className="flex flex-wrap gap-2">
                    {b.products.map((p) => (
                      <li key={p.id} className="flex items-center gap-2 rounded-full border py-1 pl-3 pr-1 text-xs">
                        {p.name} <Badge variant="outline" className={p.status === 'REJECTED' ? 'border-red-300 text-red-600' : undefined}>{PRODUCT_STATUS()[p.status] ?? p.status}</Badge>
                        <button aria-label="remove" className="rounded-full p-1 hover:bg-muted" onClick={() => act(catalogApi.removeBoothProduct(p.id), tx('Đã gỡ sản phẩm', 'Product removed', '제품 제거됨'))}><Trash2 className="size-3" /></button>
                      </li>
                    ))}
                    {b.status !== 'WITHDRAWN' && <Button size="sm" variant="outline" onClick={() => setPicker(b)}><Plus /> {tx('Gắn sản phẩm', 'Add product', '제품 추가')}</Button>}
                  </ul>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {form && <BoothDialog show={form.show} booth={form.booth} onClose={(saved) => { setForm(null); if (saved) load() }} />}
      {picker && <ProductPicker booth={picker} onClose={(saved) => { setPicker(null); if (saved) load() }} />}
    </div>
  )
}

/** Sản phẩm công khai gắn vào gian là APPROVED ngay (CR-2026-008); PENDING và REJECTED còn ở dữ liệu trước đó nên vẫn phải hiện đúng. */
const PRODUCT_STATUS = (): Record<string, string> => ({
  PENDING: tx('Chờ duyệt', 'Pending review', '검토 대기'),
  APPROVED: tx('Đã duyệt', 'Approved', '승인됨'),
  REJECTED: tx('Bị từ chối', 'Rejected', '거절됨'),
})

function PaymentBox({ booth, onDone }: { booth: MyBooth; onDone: () => void }) {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [code, setCode] = useState('')
  const p = booth.payment
  const submitted = p?.status === 'SUBMITTED'
  return (
    <div className="mt-3 rounded-lg bg-muted/50 p-4 text-sm">
      <p className="font-semibold">{tx('Phí gian', 'Booth fee', '부스 비용')}: {p?.amount ?? '-'} {p?.currency ?? ''} {p?.dueAt && <span className="font-normal text-muted-foreground">· {tx('hạn', 'due', '기한')} {new Date(p.dueAt).toLocaleString()}</span>}</p>
      {p?.status === 'REJECTED' && <p className="mt-1 text-red-600">{tx('Biên lai bị từ chối', 'Receipt rejected', '영수증 거절됨')}{p.rejectReason ? `: ${p.rejectReason}` : ''} — {tx('vui lòng nộp lại', 'please resubmit', '다시 제출하세요')}</p>}
      {submitted ? <p className="mt-1 text-muted-foreground">{tx('Đã nộp biên lai, chờ xác nhận.', 'Receipt submitted, awaiting confirmation.', '영수증 제출됨, 확인 대기 중.')}</p> : (
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="max-w-xs" aria-label="receipt" />
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={tx('Mã giao dịch', 'Transaction code', '거래 코드')} className="max-w-48" maxLength={100} />
          <Button size="sm" disabled={!file} onClick={() => file && catalogApi.payBooth(booth.id, file, code).then(() => { toast({ kind: 'success', title: tx('Đã nộp biên lai', 'Receipt submitted', '영수증 제출됨') }); onDone() }, (e: Error) => toast({ kind: 'info', title: e.message }))}>{tx('Nộp biên lai', 'Submit receipt', '영수증 제출')}</Button>
        </div>
      )}
    </div>
  )
}

function ProductPicker({ booth, onClose }: { booth: MyBooth; onClose: (saved: boolean) => void }) {
  const toast = useToast()
  const [items, setItems] = useState<{ id: string; name: string }[] | null>(null)
  useEffect(() => { catalogApi.boothPickableProducts().then(setItems, () => setItems([])) }, [])
  const on = new Set(booth.products.map((p) => p.productId))
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(false) }}>
      <DialogContent title={tx('Gắn sản phẩm vào gian', 'Add product to booth', '부스에 제품 추가')} description={tx('Chỉ sản phẩm đang hiển thị của bạn. Sản phẩm gắn vào gian không cần duyệt lại.', 'Only your visible products. Products added to a booth need no second review.', '공개 중인 제품만 표시됩니다. 부스에 추가한 제품은 다시 검토할 필요가 없습니다.')}>
        <div className="max-h-[60dvh] space-y-2 overflow-y-auto p-6">
          {!items ? <Skeleton className="h-20" /> : items.length === 0 ? <p className="text-sm text-muted-foreground">{tx('Bạn chưa có sản phẩm đang hiển thị.', 'You have no visible products yet.', '공개 중인 제품이 없습니다.')}</p> : items.filter((i) => !on.has(i.id)).map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <span>{i.name}</span>
              <Button size="sm" onClick={() => catalogApi.addBoothProduct(booth.id, i.id).then(() => { toast({ kind: 'success', title: tx('Đã gắn sản phẩm', 'Product added', '제품 추가됨') }); onClose(true) }, (e: Error) => toast({ kind: 'info', title: e.message }))}>{tx('Gắn', 'Add', '추가')}</Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function BoothDialog({ show, booth, onClose }: { show: OpenShow; booth: MyBooth | null; onClose: (saved: boolean) => void }) {
  const toast = useToast()
  const [f, setF] = useState({
    pavilionId: booth?.pavilionId ?? '', phaseId: booth?.phaseId ?? '', intro: booth?.intro ?? '', bannerImage: booth?.bannerImage ?? '', tagline: booth?.tagline ?? '',
    accent: booth?.accent ?? '', website: booth?.website ?? '', contactName: booth?.contactName ?? '', contactEmail: booth?.contactEmail ?? '', contactPhone: booth?.contactPhone ?? '',
    goals: booth?.goals ?? [], consent: booth?.consent ?? false,
    enTagline: booth?.translations.en?.tagline ?? '', enIntro: booth?.translations.en?.intro ?? '', koTagline: booth?.translations.ko?.tagline ?? '', koIntro: booth?.translations.ko?.intro ?? '',
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const set = (k: keyof typeof f, v: string | boolean | string[]) => setF((p) => ({ ...p, [k]: v }))

  const body = (): BoothInput => ({
    pavilionId: f.pavilionId ? Number(f.pavilionId) : undefined, phaseId: f.phaseId ? Number(f.phaseId) : undefined, intro: f.intro, bannerImage: f.bannerImage,
    tagline: f.tagline, accent: f.accent, website: f.website, contactName: f.contactName, contactEmail: f.contactEmail, contactPhone: f.contactPhone,
    goals: f.goals, consentExhibitorTerms: f.consent,
    translations: { en: { tagline: f.enTagline, intro: f.enIntro }, ko: { tagline: f.koTagline, intro: f.koIntro } },
  })
  const save = (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const call = booth ? catalogApi.updateBooth(booth.id, body()) : catalogApi.createBooth(show.id, body())
    call.then(() => { toast({ kind: 'success', title: tx('Đã lưu hồ sơ gian', 'Booth saved', '부스가 저장되었습니다') }); onClose(true) }, (er: Error) => { setErr(er.message); setBusy(false) })
  }
  const upload = (file?: File) => {
    if (!file) return
    uploadFile('cover', file).then((u) => { set('bannerImage', u.url ?? ''); setErr('') }, (er: Error) => setErr(er.message))
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(false) }}>
      <DialogContent title={`${booth ? tx('Sửa gian', 'Edit booth', '부스 수정') : tx('Đăng ký gian', 'Apply for a booth', '부스 신청')} - ${show.name}`} description={show.closeAt ? `${tx('Hạn nhận đăng ký', 'Applications close', '신청 마감')}: ${new Date(show.closeAt).toLocaleString()}` : ''}>
        <form onSubmit={save} className="max-h-[75dvh] space-y-4 overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tx('Khu trưng bày', 'Pavilion', '전시관')} htmlFor="bt-pav"><Select id="bt-pav" value={f.pavilionId} onValueChange={(v) => set('pavilionId', v)} options={[{ value: '', label: '—' }, ...show.pavilions.map((p) => ({ value: p.id, label: p.name }))]} /></Field>
            <Field label={tx('Giai đoạn', 'Phase', '단계')} htmlFor="bt-phase"><Select id="bt-phase" value={f.phaseId} onValueChange={(v) => set('phaseId', v)} options={[{ value: '', label: '—' }, ...show.phases.map((p) => ({ value: p.id, label: p.name }))]} /></Field>
          </div>
          <Field label={tx('Khẩu hiệu', 'Tagline', '태그라인')} htmlFor="bt-tag"><Input id="bt-tag" value={f.tagline} maxLength={500} onChange={(e) => set('tagline', e.target.value)} /></Field>
          <Field label={tx('Giới thiệu gian (tiếng Việt, ≥100 ký tự)', 'Introduction (Vietnamese, ≥100 chars)', '소개 (베트남어, 100자 이상)')} htmlFor="bt-intro"><Textarea id="bt-intro" rows={5} value={f.intro} onChange={(e) => set('intro', e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tx('Màu nhấn', 'Accent colour', '강조 색상')} htmlFor="bt-acc"><Input id="bt-acc" value={f.accent} placeholder="#0F766E" maxLength={7} onChange={(e) => set('accent', e.target.value)} /></Field>
            <Field label="Website" htmlFor="bt-web"><Input id="bt-web" value={f.website} placeholder="https://" maxLength={500} onChange={(e) => set('website', e.target.value)} /></Field>
          </div>
          <Field label={tx('Ảnh banner', 'Banner image', '배너 이미지')} htmlFor="bt-ban">
            <Input id="bt-ban" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => upload(e.target.files?.[0])} />
            {f.bannerImage && <img src={fileSrc(f.bannerImage)} alt="" className="mt-2 h-20 rounded-lg object-cover" />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={tx('Người phụ trách', 'Contact name', '담당자')} htmlFor="bt-cn"><Input id="bt-cn" value={f.contactName} onChange={(e) => set('contactName', e.target.value)} /></Field>
            <Field label="Email" htmlFor="bt-ce"><Input id="bt-ce" type="email" value={f.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} /></Field>
            <Field label={tx('Điện thoại', 'Phone', '전화')} htmlFor="bt-cp"><Input id="bt-cp" value={f.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} /></Field>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">{tx('Mục tiêu tham gia', 'Goals', '참가 목표')}</p>
            <div className="flex flex-wrap gap-3">
              {GOALS.map((g) => <label key={g} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={f.goals.includes(g)} onChange={(e) => set('goals', e.target.checked ? [...f.goals, g] : f.goals.filter((x) => x !== g))} /> {GOAL_LABEL()[g]}</label>)}
            </div>
          </div>
          {(['en', 'ko'] as const).map((lng) => (
            <fieldset key={lng} className="space-y-3 rounded-xl border p-4">
              <legend className="px-1 text-xs font-bold uppercase">{lng === 'en' ? 'English' : '한국어'}</legend>
              <Input value={lng === 'en' ? f.enTagline : f.koTagline} placeholder="Tagline" maxLength={500} onChange={(e) => set(lng === 'en' ? 'enTagline' : 'koTagline', e.target.value)} />
              <Textarea rows={3} value={lng === 'en' ? f.enIntro : f.koIntro} placeholder="Introduction" onChange={(e) => set(lng === 'en' ? 'enIntro' : 'koIntro', e.target.value)} />
            </fieldset>
          ))}
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={f.consent} onChange={(e) => set('consent', e.target.checked)} /> {tx('Tôi đồng ý với điều khoản dành cho doanh nghiệp trưng bày.', 'I accept the exhibitor terms.', '참가 기업 약관에 동의합니다.')}</label>
          {err && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onClose(false)}>{tx('Huỷ', 'Cancel', '취소')}</Button>
            <Button type="submit" disabled={busy}>{busy ? '…' : tx('Lưu nháp', 'Save draft', '임시 저장')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
