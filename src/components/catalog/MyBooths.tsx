/**
 * "Hội chợ của tôi", decided per show by its format.
 * ONLINE: tick products and consent; they go straight into the show, nothing else to fill in (CR-2026-008 §4.6, DEC-EV8-12).
 * OFFLINE/HYBRID: apply for a booth, fill the booth profile, add products, submit for review and pay the fee. This part only exists while such a show is open or the business already has a booth in one.
 */
import { Plus, Send, Trash2, Undo2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { catalogApi } from '@/api'
import { MyInquiries } from '@/components/catalog/MyInquiries'
import type { BoothInput, MyBooth, MyParticipation, OnlineShow, OpenShow, ParticipationLaunchInput, ShowProductRow } from '@/api/catalogApi'
import { fileSrc, uploadFile } from '@/api/uploads'
import { Dialog, DialogContent, useToast } from '@/components/ui/overlay'
import { Badge, Button, Field, Input, Skeleton, Textarea } from '@/components/ui/primitives'
import { Select } from '@/components/ui/select'
import { categories } from '@/data/mock'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'
import { formatDate } from '@/lib/utils'

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
    catalogApi.myOnSiteBooths().then(setBooths, (e: Error) => { setBooths([]); setError(e.message) })
  }, [])
  useEffect(load, [load])
  useEffect(() => { catalogApi.openShows().then(setShows, () => setShows([])) }, [])

  const act = (p: Promise<unknown>, ok: string) => p.then(() => { toast({ kind: 'success', title: ok }); load() }, (e: Error) => toast({ kind: 'info', title: e.message }))
  const free = shows.filter((s) => !(booths ?? []).some((b) => b.showId === s.id && b.status !== 'WITHDRAWN'))
  const onSite = shows.length > 0 || (booths?.length ?? 0) > 0 || !!error

  return (
    <div className="space-y-10">
      <OnlineShowProducts />
      <ShowParticipations />
      <MyInquiries />
      {onSite && <section>
      <h2 className="mb-4 text-lg font-extrabold">{tx('Gian hàng ở Show trực tiếp', 'Booths at on-site shows', '오프라인 쇼 부스')}</h2>
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
      </section>}
      {form && <BoothDialog show={form.show} booth={form.booth} onClose={(saved) => { setForm(null); if (saved) load() }} />}
      {picker && <ProductPicker taken={new Set(picker.products.map((p) => p.productId))} pickOne={(id) => catalogApi.addBoothProduct(picker.id, id)} onClose={(saved) => { setPicker(null); if (saved) load() }} />}
    </div>
  )
}

/** ONLINE shows a business can join: pick a show, tick products, consent. Withdrawing a product is just as direct. */
function OnlineShowProducts() {
  const toast = useToast()
  const { locale } = useI18n()
  const [shows, setShows] = useState<OnlineShow[] | null>(null)
  const [placed, setPlaced] = useState<Record<string, ShowProductRow[]>>({})
  const [picker, setPicker] = useState<OnlineShow | null>(null)

  const loadPlaced = useCallback(async (list: OnlineShow[]) => {
    const rows = await Promise.all(list.map((s) => catalogApi.myShowProducts(s.id).then((r) => [s.id, r] as const, (e: Error) => { console.warn(`[show] my-products ${s.id}: ${e.message}`); return [s.id, [] as ShowProductRow[]] as const })))
    setPlaced(Object.fromEntries(rows))
  }, [])
  useEffect(() => {
    catalogApi.onlineShows().then((list) => { setShows(list); return loadPlaced(list) }, () => setShows([]))
  }, [loadPlaced])

  const remove = (s: OnlineShow, p: ShowProductRow) => catalogApi.removeShowProduct(s.id, p.productId).then(
    () => { toast({ kind: 'success', title: tx('Đã gỡ sản phẩm khỏi Show', 'Product removed from the show', '쇼에서 제품을 제거했습니다') }); if (shows) void loadPlaced(shows) },
    (e: Error) => toast({ kind: 'info', title: e.message }),
  )
  const status = (s: OnlineShow) => (s.status === 'ONGOING' ? tx('Đang diễn ra', 'Happening now', '진행 중') : tx('Sắp diễn ra', 'Upcoming', '예정'))
  const inShow = (shows ?? []).filter((s) => (placed[s.id] ?? []).length > 0)
  const free = (shows ?? []).filter((s) => !(placed[s.id] ?? []).length)

  return (
    <section>
      {!shows ? <Skeleton className="h-24" /> : shows.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{tx('Hiện chưa có Show trực tuyến nào đang nhận sản phẩm.', 'No online show is taking products right now.', '현재 제품을 받는 온라인 쇼가 없습니다.')}</p>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">{tx('Show đang nhận sản phẩm:', 'Shows taking products:', '제품을 받는 쇼:')} {shows.length}</p>
            {free.map((s) => <Button key={s.id} size="sm" variant="outline" onClick={() => setPicker(s)}><Plus /> {s.name}</Button>)}
          </div>
          {inShow.length === 0 ? (
            <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{tx('Bạn chưa đưa sản phẩm vào Show nào. Chọn một Show ở trên.', 'You have not put products into a show yet. Pick a show above.', '아직 쇼에 제품을 넣지 않았습니다. 위에서 쇼를 선택하세요.')}</p>
          ) : (
            <ul className="space-y-4">
              {inShow.map((s) => (
                <li key={s.id} className="rounded-xl border p-5" data-testid="my-show">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-bold">{s.name}</p>
                    <Badge variant="secondary">{status(s)}</Badge>
                    {s.startDate && <span className="text-xs text-muted-foreground">{formatDate(s.startDate, locale)} – {formatDate(s.endDate || s.startDate, locale)}</span>}
                  </div>
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-semibold">{tx('Sản phẩm trong Show', 'Products in the show', '쇼의 제품')} ({placed[s.id]!.length})</p>
                    <ul className="flex flex-wrap gap-2">
                      {placed[s.id]!.map((p) => (
                        <li key={p.productId} className="flex items-center gap-2 rounded-full border py-1 pl-3 pr-1 text-xs">
                          {p.name} {!p.visible && <Badge variant="outline">{tx('Đang ẩn', 'Hidden', '숨김')}</Badge>}
                          <button aria-label={tx('Gỡ sản phẩm', 'Remove product', '제품 제거')} className="rounded-full p-1 hover:bg-muted" onClick={() => void remove(s, p)}><Trash2 className="size-3" /></button>
                        </li>
                      ))}
                      <Button size="sm" variant="outline" onClick={() => setPicker(s)}><Plus /> {tx('Thêm sản phẩm', 'Add products', '제품 추가')}</Button>
                    </ul>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {picker && <ProductPicker
        title={`${tx('Đưa sản phẩm vào Show', 'Put products into the show', '쇼에 제품 넣기')} - ${picker.name}`}
        taken={new Set((placed[picker.id] ?? []).map((p) => p.productId))}
        pickMany={(ids, consent) => catalogApi.addShowProducts(picker.id, ids, consent)}
        onClose={(saved) => { setPicker(null); if (saved && shows) void loadPlaced(shows) }}
      />}
    </section>
  )
}

/** Đơn đăng ký tham gia hội chợ kèm sản phẩm mới ra mắt (Leader chốt 05/11/2026): một đơn/show, gửi lại được khi PENDING/REJECTED. */
function ShowParticipations() {
  useI18n() // đăng ký đổi ngôn ngữ để tx() tính lại
  const [shows, setShows] = useState<OnlineShow[] | null>(null)
  const [mine, setMine] = useState<Record<string, MyParticipation | null>>({})
  const [form, setForm] = useState<OnlineShow | null>(null)

  const load = useCallback(() => {
    catalogApi.participableShows().then(async (list) => {
      setShows(list)
      const rows = await Promise.all(list.map((s) => catalogApi.myParticipation(s.id).then((r) => [s.id, r] as const, () => [s.id, null] as const)))
      setMine(Object.fromEntries(rows))
    }, () => setShows([]))
  }, [])
  useEffect(load, [load])

  const STATUS = (): Record<string, string> => ({
    PENDING: tx('Chờ duyệt', 'Pending review', '검토 대기'), APPROVED: tx('Đã duyệt', 'Approved', '승인됨'), REJECTED: tx('Bị từ chối', 'Rejected', '거절됨'),
  })

  return (
    <section>
      <h2 className="mb-4 text-lg font-extrabold">{tx('Đăng ký tham gia hội chợ', 'Show participation', '쇼 참가 신청')}</h2>
      {!shows ? <Skeleton className="h-24" /> : shows.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">{tx('Hiện không có hội chợ nào đang nhận đơn.', 'No show is taking applications right now.', '현재 신청을 받는 쇼가 없습니다.')}</p>
      ) : (
        <ul className="space-y-4">
          {shows.map((s) => {
            const p = mine[s.id]
            const editable = !p || p.status !== 'APPROVED'
            return (
              <li key={s.id} className="rounded-xl border p-5" data-testid="my-participation">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-bold">{s.name}</p>
                  {p && <Badge variant="secondary">{STATUS()[p.status] ?? p.status}</Badge>}
                  <div className="ml-auto">
                    {editable && <Button size="sm" variant="outline" onClick={() => setForm(s)}>{p ? tx('Sửa đơn', 'Edit application', '신청서 수정') : tx('Đăng ký tham gia', 'Apply', '참가 신청')}</Button>}
                  </div>
                </div>
                {p?.status === 'REJECTED' && p.rejectReason && <p className="mt-2 text-sm text-red-600">{tx('Lý do từ chối', 'Reason', '거절 사유')}: {p.rejectReason}</p>}
                {!!p?.launches.length && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-semibold">{tx('Sản phẩm mới ra mắt', 'New product launches', '신제품 출시')} ({p.launches.length})</p>
                    <ul className="flex flex-wrap gap-2">
                      {p.launches.map((l) => (
                        <li key={l.productId} className="flex items-center gap-2 rounded-full border py-1 px-3 text-xs">
                          {l.productName} <span className="text-muted-foreground">{l.launchDate} {l.startTime}-{l.endTime}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {form && <ParticipationDialog show={form} existing={mine[form.id] ?? null} onClose={(saved) => { setForm(null); if (saved) void load() }} />}
    </section>
  )
}

type LaunchForm = { productName: string; categoryId: string; shortDescription: string; launchDate: string; startTime: string; endTime: string; image: File | null }
const emptyLaunch = (): LaunchForm => ({ productName: '', categoryId: '', shortDescription: '', launchDate: '', startTime: '', endTime: '', image: null })

function ParticipationDialog({ show, existing, onClose }: { show: OnlineShow; existing: MyParticipation | null; onClose: (saved: boolean) => void }) {
  const { L } = useI18n()
  const toast = useToast()
  const [contactName, setContactName] = useState(existing?.contactName ?? '')
  const [contactPhone, setContactPhone] = useState(existing?.contactPhone ?? '')
  const [note, setNote] = useState(existing?.note ?? '')
  const [launches, setLaunches] = useState<LaunchForm[]>(
    (existing?.launches ?? []).map((l) => ({ productName: l.productName ?? '', categoryId: '', shortDescription: l.shortDescription ?? '', launchDate: l.launchDate, startTime: l.startTime, endTime: l.endTime, image: null }))
  )
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const setLaunch = (i: number, patch: Partial<LaunchForm>) => setLaunches((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  const addLaunch = () => setLaunches((ls) => (ls.length >= 10 ? ls : [...ls, emptyLaunch()]))
  const removeLaunch = (i: number) => setLaunches((ls) => ls.filter((_, idx) => idx !== i))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactName.trim() || !contactPhone.trim()) { setErr(tx('Cần nhập người liên hệ và số điện thoại', 'Contact name and phone are required', '담당자명과 전화번호가 필요합니다')); return }
    if (launches.some((l) => !l.image)) { setErr(tx('Mỗi sản phẩm mới ra mắt cần một ảnh (chụp lại dù đã nộp trước đó)', 'Each new launch product needs one image (re-attach even if submitted before)', '각 신제품에는 이미지가 필요합니다 (이전에 제출했어도 다시 첨부)')); return }
    if (launches.some((l) => !l.productName.trim() || !l.categoryId || !l.launchDate || !l.startTime || !l.endTime)) { setErr(tx('Điền đủ thông tin các sản phẩm mới ra mắt', 'Fill in all new launch product fields', '신제품 정보를 모두 입력하세요')); return }
    setBusy(true)
    setErr('')
    const launchInputs: ParticipationLaunchInput[] = launches.map((l) => ({
      productName: l.productName.trim(), categoryId: Number(l.categoryId), shortDescription: l.shortDescription.trim() || undefined,
      launchDate: l.launchDate, startTime: l.startTime, endTime: l.endTime,
    }))
    catalogApi.submitParticipation(show.id, { contactName: contactName.trim(), contactPhone: contactPhone.trim(), note: note.trim() || undefined, launches: launchInputs }, launches.map((l) => l.image as File)).then(
      () => { toast({ kind: 'success', title: tx('Đã gửi đơn đăng ký', 'Application submitted', '신청서가 제출되었습니다') }); onClose(true) },
      (er: Error) => { setErr(er.message); setBusy(false) },
    )
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(false) }}>
      <DialogContent
        title={`${tx('Đăng ký tham gia', 'Participation application', '참가 신청')} - ${show.name}`}
        description={tx('Có thể kèm tối đa 10 sản phẩm mới ra mắt; mỗi sản phẩm cần một ảnh và một mốc giờ trong thời gian hội chợ.', 'You may include up to 10 new product launches; each needs one image and a time slot within the show dates.', '최대 10개의 신제품을 포함할 수 있으며, 각 제품에는 이미지와 쇼 기간 내 시간대가 필요합니다.')}
      >
        <form onSubmit={submit} className="max-h-[75dvh] space-y-4 overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tx('Người phụ trách', 'Contact name', '담당자')} htmlFor="pt-cn"><Input id="pt-cn" placeholder={tx('VD: Nguyễn Văn An', 'e.g. Nguyen Van An', '예: Nguyen Van An')} value={contactName} maxLength={255} onChange={(e) => setContactName(e.target.value)} /></Field>
            <Field label={tx('Điện thoại', 'Phone', '전화')} htmlFor="pt-cp"><Input id="pt-cp" placeholder={tx('VD: 0912 345 678', 'e.g. +84 912 345 678', '예: +84 912 345 678')} value={contactPhone} maxLength={30} onChange={(e) => setContactPhone(e.target.value)} /></Field>
          </div>
          <Field label={tx('Ghi chú', 'Note', '비고')} htmlFor="pt-note"><Textarea id="pt-note" placeholder={tx('Yêu cầu thêm cho Ban tổ chức: điện, kệ trưng bày, số người trực gian hàng…', 'Extra requests for the organisers: power, shelving, booth staff…', '주최 측 추가 요청: 전기, 진열대, 부스 인원…')} rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">{tx('Sản phẩm mới ra mắt', 'New product launches', '신제품 출시')} ({launches.length}/10)</p>
              {launches.length < 10 && <Button type="button" size="sm" variant="outline" onClick={addLaunch}><Plus /> {tx('Thêm sản phẩm', 'Add product', '제품 추가')}</Button>}
            </div>
            <div className="space-y-4">
              {launches.map((l, i) => (
                <fieldset key={i} className="space-y-3 rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <legend className="px-1 text-xs font-bold uppercase">{tx('Sản phẩm', 'Product', '제품')} {i + 1}</legend>
                    <button type="button" aria-label="remove" className="rounded-full p-1 hover:bg-muted" onClick={() => removeLaunch(i)}><Trash2 className="size-4" /></button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={tx('Tên sản phẩm', 'Product name', '제품명')} htmlFor={`pt-pn-${i}`}><Input id={`pt-pn-${i}`} placeholder={tx('Tên sản phẩm ra mắt', 'Launch product name', '출시 제품명')} value={l.productName} maxLength={500} onChange={(e) => setLaunch(i, { productName: e.target.value })} /></Field>
                    <Field label={tx('Danh mục', 'Category', '카테고리')} htmlFor={`pt-pc-${i}`}>
                      <Select id={`pt-pc-${i}`} value={l.categoryId} onValueChange={(v) => setLaunch(i, { categoryId: v })} placeholder={tx('Chọn danh mục', 'Choose a category', '카테고리 선택')} options={categories.map((c) => ({ value: c.id, label: L(c.categoryName) }))} />
                    </Field>
                  </div>
                  <Field label={tx('Mô tả ngắn', 'Short description', '간단 설명')} htmlFor={`pt-pd-${i}`}><Textarea id={`pt-pd-${i}`} placeholder={tx('Mô tả ngắn: điểm mới, quy cách, thị trường hướng tới', 'Short description: what is new, spec, target market', '간단 설명: 신규 사항, 규격, 목표 시장')} rows={2} maxLength={1000} value={l.shortDescription} onChange={(e) => setLaunch(i, { shortDescription: e.target.value })} /></Field>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label={tx('Ngày ra mắt', 'Launch date', '출시일')} htmlFor={`pt-pld-${i}`}><Input id={`pt-pld-${i}`} type="date" min={show.startDate?.slice(0, 10)} max={show.endDate?.slice(0, 10)} value={l.launchDate} onChange={(e) => setLaunch(i, { launchDate: e.target.value })} /></Field>
                    <Field label={tx('Giờ bắt đầu', 'Start time', '시작 시간')} htmlFor={`pt-pst-${i}`}><Input id={`pt-pst-${i}`} type="time" value={l.startTime} onChange={(e) => setLaunch(i, { startTime: e.target.value })} /></Field>
                    <Field label={tx('Giờ kết thúc', 'End time', '종료 시간')} htmlFor={`pt-pet-${i}`}><Input id={`pt-pet-${i}`} type="time" value={l.endTime} onChange={(e) => setLaunch(i, { endTime: e.target.value })} /></Field>
                  </div>
                  <Field label={tx('Ảnh sản phẩm', 'Product image', '제품 이미지')} htmlFor={`pt-pi-${i}`}>
                    <Input id={`pt-pi-${i}`} type="file" accept="image/*" onChange={(e) => setLaunch(i, { image: e.target.files?.[0] ?? null })} />
                  </Field>
                </fieldset>
              ))}
            </div>
          </div>
          {err && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onClose(false)}>{tx('Huỷ', 'Cancel', '취소')}</Button>
            <Button type="submit" disabled={busy}>{busy ? '…' : tx('Gửi đơn', 'Submit', '제출')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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

/** Picks from the business's visible products. `pickOne` adds on click (booth of an OFFLINE/HYBRID show); `pickMany` ticks several and asks for public consent, never pre-ticked (ONLINE show). */
function ProductPicker({ title, taken, pickOne, pickMany, onClose }: { title?: string; taken: Set<string>; pickOne?: (id: string) => Promise<unknown>; pickMany?: (ids: string[], consentPublic: boolean) => Promise<unknown>; onClose: (saved: boolean) => void }) {
  const toast = useToast()
  const [items, setItems] = useState<{ id: string; name: string }[] | null>(null)
  const [ticked, setTicked] = useState<Set<string>>(new Set())
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => { catalogApi.boothPickableProducts().then(setItems, () => setItems([])) }, [])
  const rows = (items ?? []).filter((i) => !taken.has(i.id))
  const toggle = (id: string) => setTicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const submit = () => {
    if (!pickMany) return
    setBusy(true)
    pickMany([...ticked], consent).then(
      () => { toast({ kind: 'success', title: tx('Đã đưa sản phẩm vào Show', 'Products added to the show', '쇼에 제품을 넣었습니다') }); onClose(true) },
      (e: Error) => { setBusy(false); toast({ kind: 'info', title: e.message }) },
    )
  }
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(false) }}>
      <DialogContent title={title ?? tx('Gắn sản phẩm vào gian', 'Add product to booth', '부스에 제품 추가')} description={pickMany
        ? tx('Chỉ sản phẩm đang hiển thị của bạn. Sản phẩm lên Show ngay, không cần duyệt lại.', 'Only your visible products. They appear in the show at once, with no second review.', '공개 중인 제품만 표시됩니다. 다시 검토 없이 바로 쇼에 표시됩니다.')
        : tx('Chỉ sản phẩm đang hiển thị của bạn. Sản phẩm gắn vào gian không cần duyệt lại.', 'Only your visible products. Products added to a booth need no second review.', '공개 중인 제품만 표시됩니다. 부스에 추가한 제품은 다시 검토할 필요가 없습니다.')}>
        <div className="max-h-[60dvh] space-y-2 overflow-y-auto p-6">
          {!items ? <Skeleton className="h-20" /> : items.length === 0 ? <p className="text-sm text-muted-foreground">{tx('Bạn chưa có sản phẩm đang hiển thị.', 'You have no visible products yet.', '공개 중인 제품이 없습니다.')}</p>
            : rows.length === 0 ? <p className="text-sm text-muted-foreground">{tx('Mọi sản phẩm đang hiển thị của bạn đã được đưa vào.', 'All your visible products are already in.', '공개 중인 제품이 모두 포함되어 있습니다.')}</p>
            : rows.map((i) => pickMany ? (
              <label key={i.id} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm">
                <input type="checkbox" checked={ticked.has(i.id)} onChange={() => toggle(i.id)} />
                <span>{i.name}</span>
              </label>
            ) : (
              <div key={i.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <span>{i.name}</span>
                <Button size="sm" onClick={() => pickOne?.(i.id).then(() => { toast({ kind: 'success', title: tx('Đã gắn sản phẩm', 'Product added', '제품 추가됨') }); onClose(true) }, (e: Error) => toast({ kind: 'info', title: e.message }))}>{tx('Gắn', 'Add', '추가')}</Button>
              </div>
            ))}
        </div>
        {pickMany && rows.length > 0 && (
          <div className="space-y-4 border-t p-6">
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> {tx('Tôi đồng ý công khai các sản phẩm này và tên doanh nghiệp trên trang Show.', 'I agree to show these products and my business name publicly on the show page.', '이 제품과 기업명을 쇼 페이지에 공개하는 데 동의합니다.')}</label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => onClose(false)}>{tx('Huỷ', 'Cancel', '취소')}</Button>
              <Button disabled={!ticked.size || !consent || busy} onClick={submit}><Plus /> {busy ? '…' : tx(`Đưa ${ticked.size || ''} sản phẩm vào Show`, `Add ${ticked.size || ''} products`, `제품 ${ticked.size || ''}개 넣기`)}</Button>
            </div>
          </div>
        )}
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
            <Field label={tx('Khu trưng bày', 'Pavilion', '전시관')} htmlFor="bt-pav"><Select id="bt-pav" placeholder={tx('Chọn khu trưng bày', 'Choose a pavilion', '전시관 선택')} value={f.pavilionId} onValueChange={(v) => set('pavilionId', v)} options={[{ value: '', label: tx('Không chọn', 'None', '선택 안 함') }, ...show.pavilions.map((p) => ({ value: p.id, label: p.name }))]} /></Field>
            <Field label={tx('Giai đoạn', 'Phase', '단계')} htmlFor="bt-phase"><Select id="bt-phase" placeholder={tx('Chọn giai đoạn', 'Choose a phase', '단계 선택')} value={f.phaseId} onValueChange={(v) => set('phaseId', v)} options={[{ value: '', label: tx('Không chọn', 'None', '선택 안 함') }, ...show.phases.map((p) => ({ value: p.id, label: p.name }))]} /></Field>
          </div>
          <Field label={tx('Khẩu hiệu', 'Tagline', '태그라인')} htmlFor="bt-tag"><Input id="bt-tag" placeholder={tx('Một câu giới thiệu gian hàng', 'One line about the booth', '부스 한 줄 소개')} value={f.tagline} maxLength={500} onChange={(e) => set('tagline', e.target.value)} /></Field>
          <Field label={tx('Giới thiệu gian (tiếng Việt, ≥100 ký tự)', 'Introduction (Vietnamese, ≥100 chars)', '소개 (베트남어, 100자 이상)')} htmlFor="bt-intro"><Textarea id="bt-intro" placeholder={tx('Giới thiệu doanh nghiệp, sản phẩm trưng bày và điều khách nên ghé xem', 'About the company, products on show and what visitors should see', '회사, 전시 제품, 볼거리 소개')} rows={5} value={f.intro} onChange={(e) => set('intro', e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={tx('Màu nhấn', 'Accent colour', '강조 색상')} htmlFor="bt-acc"><Input id="bt-acc" value={f.accent} placeholder="#0F766E" maxLength={7} onChange={(e) => set('accent', e.target.value)} /></Field>
            <Field label="Website" htmlFor="bt-web"><Input id="bt-web" value={f.website} placeholder="https://" maxLength={500} onChange={(e) => set('website', e.target.value)} /></Field>
          </div>
          <Field label={tx('Ảnh banner', 'Banner image', '배너 이미지')} htmlFor="bt-ban">
            <Input id="bt-ban" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => upload(e.target.files?.[0])} />
            {f.bannerImage && <img src={fileSrc(f.bannerImage)} alt="" className="mt-2 h-20 rounded-lg object-cover" />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={tx('Người phụ trách', 'Contact name', '담당자')} htmlFor="bt-cn"><Input id="bt-cn" placeholder={tx('VD: Nguyễn Văn An', 'e.g. Nguyen Van An', '예: Nguyen Van An')} value={f.contactName} onChange={(e) => set('contactName', e.target.value)} /></Field>
            <Field label="Email" htmlFor="bt-ce"><Input id="bt-ce" placeholder={'sales@congty.vn'} type="email" value={f.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} /></Field>
            <Field label={tx('Điện thoại', 'Phone', '전화')} htmlFor="bt-cp"><Input id="bt-cp" placeholder={tx('VD: 0912 345 678', 'e.g. +84 912 345 678', '예: +84 912 345 678')} value={f.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} /></Field>
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
