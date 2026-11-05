/** "Already registered?": email + the code from the mail, for a browser that holds no registration yet. The answer never tells whether the email is registered. */
import { Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { liveApi } from '@/api'
import { Button, Input } from '@/components/ui/primitives'
import type { useShowVisitor } from '@/lib/showReg'
import { tx } from '@/lib/tx'

export function RestoreVisitorForm({ showId, visitor, online }: { showId: string; visitor: ReturnType<typeof useShowVisitor>; online: boolean }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const codeLabel = online ? tx('Mã xác nhận', 'Confirmation code', '확인 코드') : tx('Mã thẻ', 'Badge code', '배지 코드')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    liveApi.showRestoreVisitor(showId, email.trim(), code).then(
      (r) => { setBusy(false); visitor.restore(r) },
      (ex: Error) => { setBusy(false); setErr(ex.message) },
    )
  }

  return (
    <form onSubmit={submit} className="mt-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <p className="text-sm font-semibold">{online ? tx('Đã đăng ký? Nhập email và mã xác nhận', 'Already registered? Enter your email and confirmation code', '이미 등록하셨나요? 이메일과 확인 코드를 입력하세요') : tx('Đã đăng ký? Nhập email và mã thẻ', 'Already registered? Enter your email and badge code', '이미 등록하셨나요? 이메일과 배지 코드를 입력하세요')}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Input type="email" required autoComplete="email" placeholder="Email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="text-foreground" />
        <Input required maxLength={12} autoCapitalize="characters" placeholder={codeLabel} aria-label={codeLabel} value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9a-z]/gi, '').toUpperCase())} className="font-mono text-foreground" />
        <Button type="submit" variant="gold" disabled={busy || !email.trim() || code.length !== 12}>{busy ? <Loader2 className="animate-spin" /> : null} {tx('Vào phòng', 'Enter', '입장')}</Button>
      </div>
      {err && <p role="alert" className="mt-2 text-sm font-medium text-red-300">{err}</p>}
    </form>
  )
}
