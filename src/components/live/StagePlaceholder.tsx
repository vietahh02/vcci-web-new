import { Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/** Trạng thái không có hình trong khung player: đang tải, chưa bắt đầu, đã kết thúc, lỗi, form vào phòng. */
export function StagePlaceholder({ poster, icon: Icon, busy, title, hint, alert, children }: { poster?: string; icon?: LucideIcon; busy?: boolean; title: string; hint?: string; alert?: boolean; children?: ReactNode }) {
  return (
    <div className="absolute inset-0 overflow-y-auto">
      {poster && <img src={poster} alt="" className="absolute inset-0 size-full object-cover opacity-25" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/60" />
      <div role={alert ? 'alert' : 'status'} className="relative flex min-h-full flex-col items-center justify-center gap-2 p-5 text-center">
        {busy ? <Loader2 className="size-8 animate-spin text-white/70" /> : Icon && <Icon className="size-9 text-white/70" />}
        <p className="text-base font-bold md:text-lg">{title}</p>
        {hint && <p className="max-w-md text-sm text-white/65">{hint}</p>}
        {children}
      </div>
    </div>
  )
}
