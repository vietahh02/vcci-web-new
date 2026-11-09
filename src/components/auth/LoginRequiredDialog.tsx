/** "Sign in to post" dialog: a small copy of the sign-in page (same harbour photo on navy) so the step to /login feels continuous. */
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { motion } from 'motion/react'
import { Check, LogIn, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonClass } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'

/** Defaults are the "post an import request" wording; other places pass their own title, sentence and points. */
export function LoginRequiredDialog({ open, onOpenChange, onLogin, title, description, points }: {
  open: boolean; onOpenChange: (v: boolean) => void; onLogin: () => void; title?: string; description?: string; points?: string[]
}) {
  const { t } = useI18n()
  points ??= [
    tx('Nhà cung cấp Việt Nam đã được VCCI xác thực gửi báo giá thẳng qua email', 'VCCI-verified Vietnamese suppliers send quotes straight to your email', 'VCCI 인증 베트남 공급업체가 이메일로 바로 견적을 보냅니다'),
    tx('Theo dõi lượt xem và số báo giá của từng yêu cầu', 'Follow the views and quotes on each request', '요청별 조회수와 견적 수를 확인'),
  ]
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-navy/60 backdrop-blur-[3px] data-[state=open]:animate-[fade-in_.2s_ease-out]" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[81] w-[calc(100vw-32px)] max-w-[460px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-popover text-popover-foreground shadow-2xl shadow-navy/40 outline-none data-[state=open]:animate-[dialog-in_.28s_cubic-bezier(.16,1,.3,1)]">
          {/* photo band: the harbour from the sign-in page, under a flat navy scrim so the title reads */}
          <div className="relative h-44 overflow-hidden bg-navy text-white sm:h-48">
            <img src="/imgs/cang-bien.jpg" alt="" className="absolute inset-0 size-full scale-110 animate-kenburns object-cover opacity-70" />
            <div className="absolute inset-0 bg-navy/55" />
            <DialogPrimitive.Close
              className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
              aria-label={t.ui.close}
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
            <div className="absolute inset-x-6 bottom-5">
              <DialogPrimitive.Title asChild>
                <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }} className="text-2xl font-extrabold leading-tight tracking-tight text-balance">
                  {title ?? tx('Đăng nhập để đăng yêu cầu nhập khẩu', 'Sign in to post an import request', '로그인하고 수입 요청 등록하기')}
                </motion.h2>
              </DialogPrimitive.Title>
            </div>
          </div>

          <div className="px-6 pb-6 pt-5">
            <DialogPrimitive.Description className="text-[15px] leading-relaxed text-foreground">
              {description ?? tx('Yêu cầu nhập khẩu được đăng bằng tài khoản doanh nghiệp nhập khẩu nước ngoài.', 'Import requests are posted from a foreign importer business account.', '수입 요청은 해외 수입 기업 계정으로 등록합니다.')}
            </DialogPrimitive.Description>
            <ul className="mt-4 space-y-2.5">
              {points.map((p, i) => (
                <motion.li key={p} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 + i * 0.07 }} className="flex gap-2.5 text-[15px] leading-snug">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-gold-soft text-gold"><Check className="size-3.5" strokeWidth={3} /></span>
                  {p}
                </motion.li>
              ))}
            </ul>

            <button type="button" onClick={onLogin} className={buttonClass('gold', 'lg', 'mt-6 w-full')}>
              <LogIn /> {tx('Đăng nhập', 'Sign in', '로그인')}
            </button>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {tx('Chưa có tài khoản?', 'No account yet?', '계정이 없으신가요?')}{' '}
              <Link to="/register" onClick={() => onOpenChange(false)} className="font-semibold text-primary underline-offset-4 hover:underline">
                {tx('Đăng ký doanh nghiệp', 'Register your company', '기업 회원가입')}
              </Link>
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
