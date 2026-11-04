/**
 * Nút nhắn tin doanh nghiệp dùng chung: mở hội thoại B2B trên widget chat (doanh nghiệp của chính mình thì widget báo không tự nhắn được).
 * Chỉ hiện khi đăng nhập và có `organizationId`. `showName` điền sẵn câu mở đầu "Từ hội chợ X" vào ô soạn; người dùng tự gửi.
 * `onOpen`: gọi trước khi mở widget, dùng để đóng hộp thoại modal đang chứa nút (modal chặn thao tác với widget ở ngoài).
 */
import { MessageSquare } from 'lucide-react'
import { openBusinessChat } from '@/api/chat'
import { USE_MOCK } from '@/api/config'
import { tokens } from '@/api/http'
import { useI18n } from '@/lib/i18n'
import { useProfile } from '@/lib/profile'
import { tx } from '@/lib/tx'
import { cn } from '@/lib/utils'

const fromShow = (name: string) => tx(`Từ hội chợ ${name}: `, `From the trade fair ${name}: `, `${name} 박람회에서 연락드립니다: `)

export function BusinessChatButton({ organizationId, showName, label, onOpen, className }: { organizationId?: string; showName?: string; label?: string; onOpen?: () => void; className?: string }) {
  useI18n()
  const { session } = useProfile()
  if (USE_MOCK || !organizationId || !session || !tokens.access()) return null
  return (
    <button
      type="button"
      className={cn('inline-flex items-center gap-1.5 font-semibold text-primary hover:underline', className ?? 'text-sm')}
      onClick={() => {
        onOpen?.()
        openBusinessChat(organizationId, showName ? fromShow(showName) : undefined)
      }}
    >
      <MessageSquare className="size-3.5" /> {label ?? tx('Nhắn tin doanh nghiệp', 'Message this company', '기업에 메시지 보내기')}
    </button>
  )
}
