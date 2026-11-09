/** "Lãnh đạo chủ chốt" + chi nhánh: dùng chung cho form đăng ký và hồ sơ doanh nghiệp. */
import { Plus, Trash2 } from 'lucide-react'
import type { Branch, KeyLeaders, LeaderPerson } from '@/api/realApi'
import { Button, Field, Input } from '@/components/ui/primitives'
import { Select } from '@/components/ui/select'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'

const GENDERS = [
  { value: 'MALE', vi: 'Nam', en: 'Male', ko: '남' },
  { value: 'FEMALE', vi: 'Nữ', en: 'Female', ko: '여' },
  { value: 'OTHER', vi: 'Khác', en: 'Other', ko: '기타' },
]
export type PersonField = keyof LeaderPerson
/** Which fields each role asks for; `required` marks the mandatory role (Người liên hệ #1). */
const LEADER_ROLES: { key: keyof KeyLeaders; label: Parameters<typeof tx>; fields: PersonField[]; required?: boolean }[] = [
  { key: 'contact1', label: ['Người liên hệ #1', 'Contact person #1', '담당자 #1'], fields: ['fullName', 'mobile', 'email'], required: true },
  { key: 'chairman', label: ['Chủ tịch', 'Chairperson', '회장'], fields: ['fullName', 'gender', 'landline', 'mobile'] },
  { key: 'ceo', label: ['Tổng Giám đốc / Giám đốc', 'CEO / Director', '대표이사 / 사장'], fields: ['fullName', 'gender', 'landline', 'mobile', 'email'] },
  { key: 'chiefOfOffice', label: ['Chánh Văn phòng', 'Chief of office', '비서실장'], fields: ['fullName', 'landline', 'mobile', 'email'] },
  { key: 'contact2', label: ['Người liên hệ #2', 'Contact person #2', '담당자 #2'], fields: ['fullName', 'mobile', 'email'] },
]
const PERSON_LABEL: Record<PersonField, Parameters<typeof tx>> = {
  fullName: ['Họ tên', 'Full name', '성명'],
  gender: ['Giới tính', 'Gender', '성별'],
  landline: ['Điện thoại cố định', 'Landline', '유선 전화'],
  mobile: ['Di động', 'Mobile', '휴대전화'],
  email: ['Email', 'Email', '이메일'],
}
const PERSON_PLACEHOLDER: Record<Exclude<PersonField, 'gender'>, Parameters<typeof tx>> = {
  fullName: ['VD: Nguyễn Văn A', 'e.g. Nguyen Van A', '예: Nguyen Van A'],
  landline: ['VD: 024 3825 0000', 'e.g. 024 3825 0000', '예: 024 3825 0000'],
  mobile: ['VD: 0912 345 678', 'e.g. 0912 345 678', '예: 0912 345 678'],
  email: ['VD: ten@company.vn', 'e.g. name@company.vn', '예: name@company.vn'],
}

export function LeadersFields({ value, onChange, omit }: { value: KeyLeaders; onChange: (role: keyof KeyLeaders, f: PersonField, v: string) => void; omit?: keyof KeyLeaders }) {
  const { L } = useI18n()
  return (
    <>
      {LEADER_ROLES.filter((role) => role.key !== omit).map((role) => (
        <fieldset key={role.key} className="grid gap-3 rounded-xl border p-4 sm:col-span-2 sm:grid-cols-2">
          <legend className="px-1 text-[13px] font-semibold">{tx(...role.label)}{role.required && ' *'}</legend>
          {role.fields.map((f) => {
            const id = `${role.key}-${f}`
            const label = tx(...PERSON_LABEL[f]) + (role.required ? ' *' : '')
            const v = value[role.key][f]
            return f === 'gender' ? (
              <Field key={f} label={label} htmlFor={id}>
                <Select id={id} placeholder={tx('Chọn giới tính', 'Choose gender', '성별 선택')} value={v} onValueChange={(x) => onChange(role.key, f, x)} options={[{ value: '', label: tx('Không chọn', 'None', '선택 안 함') }, ...GENDERS.map((g) => ({ value: g.value, label: L(g) }))]} />
              </Field>
            ) : (
              <Field key={f} label={label} htmlFor={id} className={f === 'fullName' && role.fields.length % 2 === 1 ? 'sm:col-span-2' : undefined}>
                <Input id={id} placeholder={tx(...PERSON_PLACEHOLDER[f])} required={role.required} type={f === 'email' ? 'email' : f === 'fullName' ? 'text' : 'tel'} maxLength={f === 'fullName' || f === 'email' ? 255 : 20} value={v} onChange={(e) => onChange(role.key, f, e.target.value)} />
              </Field>
            )
          })}
        </fieldset>
      ))}
    </>
  )
}

export function BranchesFields({ value, onChange }: { value: Branch[]; onChange: (v: Branch[]) => void }) {
  const setBranch = (i: number, b: Partial<Branch>) => onChange(value.map((x, j) => (j === i ? { ...x, ...b } : x)))
  return (
    <div className="sm:col-span-2">
      <p className="mb-2 text-[13px] font-semibold">{tx('Chi nhánh / văn phòng đại diện trong và ngoài nước', 'Branches / representative offices (domestic & overseas)', '국내외 지사 / 대표 사무소')}</p>
      <div className="space-y-2">
        {value.map((b, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1.6fr_auto]">
            <Input aria-label={tx('Tên chi nhánh', 'Branch name', '지사명')} placeholder={tx('Tên chi nhánh / VPĐD', 'Branch / office name', '지사 / 사무소명')} required maxLength={255} value={b.name} onChange={(e) => setBranch(i, { name: e.target.value })} />
            <Input aria-label={tx('Địa chỉ chi nhánh', 'Branch address', '지사 주소')} placeholder={tx('Địa chỉ (trong hoặc ngoài nước)', 'Address (domestic or overseas)', '주소 (국내 또는 해외)')} maxLength={1000} value={b.address} onChange={(e) => setBranch(i, { address: e.target.value })} />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label={tx('Xoá chi nhánh', 'Remove branch', '지사 삭제')}><Trash2 className="size-4" /></button>
          </div>
        ))}
      </div>
      {value.length < 20 && (
        <Button variant="ghost" className="mt-2" onClick={() => onChange([...value, { name: '', address: '' }])}><Plus /> {tx('Thêm chi nhánh', 'Add branch', '지사 추가')}</Button>
      )}
    </div>
  )
}
