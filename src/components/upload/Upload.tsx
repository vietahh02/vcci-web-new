/** Upload controls with built-in guidance (format, size, pixel size), validation and previews. */
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, Check, ChevronDown, FileText, ImagePlus, Info, Trash2, UploadCloud, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import type { DocFile, MediaItem } from '@/lib/profile'
import { tx } from '@/lib/tx'
import { checkFile, formatSize, isImage, RULES, ruleSummary, toPreview, type RuleKey } from '@/lib/upload'
import { cn } from '@/lib/utils'

/* ---------------------------------------------------------------- hint line + expandable tips */
export function UploadHint({ rule }: { rule: RuleKey }) {
  const { L } = useI18n()
  const [open, setOpen] = useState(false)
  const r = RULES[rule]
  return (
    <div className="mt-1.5 text-xs text-muted-foreground">
      <button type="button" onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-1 hover:text-foreground">
        <Info className="size-3.5" /> {ruleSummary(r)}
        <ChevronDown className={cn('size-3 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-1.5 space-y-1 overflow-hidden pl-5">
            {r.tips.map((tip) => <li key={tip.en} className="list-disc">{L(tip)}</li>)}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---------------------------------------------------------------- full guide table */
export function UploadGuide({ keys }: { keys: RuleKey[] }) {
  const { L } = useI18n()
  return (
    <div className="overflow-hidden rounded-xl border">
      <p className="flex items-center gap-2 border-b bg-muted/60 px-4 py-2.5 text-sm font-semibold"><Info className="size-4 text-primary" /> {tx('Hướng dẫn chuẩn bị file', 'File preparation guide', '파일 준비 가이드')}</p>
      <div className="divide-y text-[13px]">
        {keys.map((k) => {
          const r = RULES[k]
          return (
            <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-4">
              <div>
                <p className="font-semibold">{L(r.label)}</p>
                <p className="text-xs text-muted-foreground">{ruleSummary(r)}{r.image?.ratio ? ` · ${r.image.ratio}` : ''}</p>
              </div>
              <ul className="space-y-0.5 text-muted-foreground">{r.tips.map((tip) => <li key={tip.en}>• {L(tip)}</li>)}</ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function useValidated(rule: RuleKey) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const accept = async (file: File, maxSide?: number) => {
    setBusy(true)
    const err = await checkFile(file, RULES[rule])
    setError(err)
    const preview = err ? '' : await toPreview(file, maxSide)
    setBusy(false)
    return err ? null : { preview }
  }
  return { error, busy, accept, setError }
}

/* ---------------------------------------------------------------- document / single file */
export function FileUpload({ rule, value, onChange, compact }: { rule: RuleKey; value: DocFile | null; onChange: (v: DocFile | null) => void; compact?: boolean }) {
  const { error, busy, accept } = useValidated(rule)
  const [drag, setDrag] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const pick = async (file?: File) => {
    if (!file) return
    const ok = await accept(file, 800)
    if (ok) onChange({ id: `f${Date.now()}`, name: file.name, kind: rule, size: file.size, preview: ok.preview || undefined })
  }

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border bg-success-soft/40 p-2.5">
          {value.preview ? (
            <img src={value.preview} alt="" className="size-12 shrink-0 rounded-lg border object-cover" />
          ) : (
            <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10"><FileText className="size-5" /></span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{value.name}</p>
            <p className="flex items-center gap-1 text-xs text-success"><Check className="size-3.5" /> {value.size ? `${formatSize(value.size)} · ` : ''}{tx('Hợp lệ', 'Valid', '유효')}</p>
          </div>
          <button type="button" onClick={() => onChange(null)} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label={tx('Xoá', 'Remove', '삭제')}><Trash2 className="size-4" /></button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); void pick(e.dataTransfer.files[0]) }}
          className={cn('flex w-full items-center gap-3 rounded-xl border-2 border-dashed text-left transition', compact ? 'px-3 py-2.5' : 'px-4 py-4', drag ? 'border-primary bg-primary-soft' : error ? 'border-destructive/60' : 'hover:border-primary/50 hover:bg-muted/40')}
        >
          <UploadCloud className={cn('shrink-0 text-primary', compact ? 'size-4' : 'size-6')} />
          <span className="text-sm">
            <span className="font-semibold text-primary">{busy ? tx('Đang kiểm tra…', 'Checking…', '확인 중…') : tx('Chọn file', 'Choose file', '파일 선택')}</span>{' '}
            <span className="text-muted-foreground">{tx('hoặc kéo thả vào đây', 'or drag & drop', '또는 끌어다 놓기')}</span>
          </span>
        </button>
      )}
      <input ref={input} type="file" accept={RULES[rule].accept} className="sr-only" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = '' }} />
      {error && <p className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive"><AlertCircle className="mt-px size-3.5 shrink-0" /> {error}</p>}
      <UploadHint rule={rule} />
    </div>
  )
}

/* ---------------------------------------------------------------- logo / cover */
export function ImageUpload({ rule, value, onChange }: { rule: 'logo' | 'cover'; value: string; onChange: (v: string) => void }) {
  const { error, busy, accept } = useValidated(rule)
  const input = useRef<HTMLInputElement>(null)
  const logo = rule === 'logo'
  const pick = async (file?: File) => {
    if (!file) return
    const ok = await accept(file, logo ? 400 : 1600)
    if (ok) onChange(ok.preview)
  }
  return (
    <div>
      <div className={cn('group relative overflow-hidden rounded-2xl border-2 border-dashed bg-muted/40', logo ? 'size-32' : 'aspect-[16/5] w-full')}>
        {value ? (
          <>
            <img src={value} alt="" className={cn('size-full', logo ? 'object-contain p-2' : 'object-cover')} />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition group-hover:opacity-100">
              <button type="button" onClick={() => input.current?.click()} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-navy">{tx('Đổi ảnh', 'Replace', '변경')}</button>
              <button type="button" onClick={() => onChange('')} className="rounded-lg bg-white/90 p-1.5 text-destructive" aria-label={tx('Xoá', 'Remove', '삭제')}><X className="size-4" /></button>
            </div>
          </>
        ) : (
          <button type="button" onClick={() => input.current?.click()} className="flex size-full flex-col items-center justify-center gap-1.5 text-muted-foreground transition hover:text-primary">
            <ImagePlus className="size-6" />
            <span className="text-xs font-semibold">{busy ? tx('Đang kiểm tra…', 'Checking…', '확인 중…') : logo ? tx('Tải logo', 'Upload logo', '로고 업로드') : tx('Tải ảnh bìa', 'Upload cover', '커버 업로드')}</span>
          </button>
        )}
      </div>
      <input ref={input} type="file" accept={RULES[rule].accept} className="sr-only" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = '' }} />
      {error && <p className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive"><AlertCircle className="mt-px size-3.5 shrink-0" /> {error}</p>}
      <UploadHint rule={rule} />
    </div>
  )
}

/* ---------------------------------------------------------------- factory gallery */
export const GALLERY_KINDS = [
  { value: 'FACTORY', vi: 'Nhà xưởng', en: 'Factory', ko: '공장' },
  { value: 'LINE', vi: 'Dây chuyền sản xuất', en: 'Production line', ko: '생산 라인' },
  { value: 'WAREHOUSE', vi: 'Kho bãi', en: 'Warehouse', ko: '창고' },
  { value: 'QC', vi: 'Phòng QC / Lab', en: 'QC / Lab', ko: 'QC / 연구실' },
  { value: 'OFFICE', vi: 'Văn phòng / Showroom', en: 'Office / Showroom', ko: '사무실 / 쇼룸' },
  { value: 'PRODUCT', vi: 'Sản phẩm', en: 'Products', ko: '제품' },
]

export function GalleryUpload({ value, onChange, max = 12 }: { value: MediaItem[]; onChange: (v: MediaItem[]) => void; max?: number }) {
  const { L } = useI18n()
  const [errors, setErrors] = useState<string[]>([])
  const input = useRef<HTMLInputElement>(null)

  const add = async (files: FileList | null) => {
    if (!files) return
    const errs: string[] = []
    const next = [...value]
    for (const file of Array.from(files).slice(0, max - value.length)) {
      const err = await checkFile(file, RULES.gallery)
      if (err) { errs.push(`${file.name}: ${err}`); continue }
      next.push({ id: `g${Date.now()}${Math.random().toString(36).slice(2, 6)}`, url: await toPreview(file, 1200), caption: '', kind: 'FACTORY' })
    }
    setErrors(errs)
    onChange(next)
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <AnimatePresence initial={false}>
          {value.map((m, i) => (
            <motion.div key={m.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="overflow-hidden rounded-xl border bg-card">
              <div className="group relative aspect-[4/3]">
                <img src={m.url} alt={m.caption} className="size-full object-cover" />
                <button type="button" onClick={() => onChange(value.filter((x) => x.id !== m.id))} className="absolute right-2 top-2 rounded-md bg-black/55 p-1.5 text-white opacity-0 transition group-hover:opacity-100" aria-label={tx('Xoá', 'Remove', '삭제')}><Trash2 className="size-3.5" /></button>
                {i === 0 && <span className="absolute left-2 top-2 rounded bg-gold-bright px-1.5 py-0.5 text-[10px] font-bold text-navy">{tx('Ảnh chính', 'Main', '대표')}</span>}
              </div>
              <div className="space-y-1.5 p-2">
                <select value={m.kind} onChange={(e) => onChange(value.map((x) => (x.id === m.id ? { ...x, kind: e.target.value } : x)))} className="w-full rounded-md border bg-background px-2 py-1 text-xs" aria-label={tx('Loại ảnh', 'Photo type', '사진 유형')}>
                  {GALLERY_KINDS.map((k) => <option key={k.value} value={k.value}>{L(k)}</option>)}
                </select>
                <input value={m.caption} onChange={(e) => onChange(value.map((x) => (x.id === m.id ? { ...x, caption: e.target.value } : x)))} placeholder={tx('Chú thích ảnh…', 'Caption…', '사진 설명…')} className="w-full rounded-md border bg-background px-2 py-1 text-xs outline-none focus:border-primary" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {value.length < max && (
          <button type="button" onClick={() => input.current?.click()} className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-muted-foreground transition hover:border-primary hover:text-primary">
            <ImagePlus className="size-6" />
            <span className="text-xs font-semibold">{tx('Thêm ảnh', 'Add photos', '사진 추가')}</span>
            <span className="text-[11px]">{value.length}/{max}</span>
          </button>
        )}
      </div>
      <input ref={input} type="file" multiple accept={RULES.gallery.accept} className="sr-only" onChange={(e) => { void add(e.target.files); e.target.value = '' }} />
      {errors.map((er) => <p key={er} className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive"><AlertCircle className="mt-px size-3.5 shrink-0" /> {er}</p>)}
      <UploadHint rule="gallery" />
    </div>
  )
}

export const docIsImage = (d: DocFile) => !!d.preview || isImage(d.name)
