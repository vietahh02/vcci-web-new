/** Nhắn tin doanh nghiệp: cùng luồng B2B với trang nhà cung cấp (doanh nghiệp của chính mình thì widget báo không tự nhắn được). Chỉ hiện khi đăng nhập và có businessId. */
import { MessageSquare } from 'lucide-react'
import { openBusinessChat } from '@/api/chat'
import { USE_MOCK } from '@/api/config'
import { tokens } from '@/api/http'
import { useI18n } from '@/lib/i18n'
import { useProfile } from '@/lib/profile'
import { cn } from '@/lib/utils'
import { liveText } from './liveText'

export function BusinessChatButton({ businessId, onOpen, className }: { businessId?: string; onOpen?: () => void; className?: string }) {
  useI18n()
  const { session } = useProfile()
  if (USE_MOCK || !businessId || !session || !tokens.access()) return null
  return (
    <button
      type="button"
      className={cn('inline-flex items-center gap-1.5 font-semibold text-primary hover:underline', className ?? 'text-sm')}
      onClick={() => {
        // Trong hộp thoại modal: phải đóng trước, modal chặn thao tác với widget chat ở ngoài
        onOpen?.()
        openBusinessChat(businessId)
      }}
    >
      <MessageSquare className="size-3.5" /> {liveText().messageBusiness}
    </button>
  )
}
