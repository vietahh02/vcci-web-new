import { motion } from 'motion/react'
import { Check, CheckCheck, Clock, CornerUpLeft, Pin, RotateCw, ShieldCheck, SmilePlus } from 'lucide-react'
import { Fragment } from 'react'
import { REACTIONS } from '@/api/chat'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'
import { cn } from '@/lib/utils'
import { chatText } from '@/components/layout/chatWidgetText'
import type { WidgetMsg, useBizChat } from '@/components/layout/useBizChat'
import { clock, dayKey, dayLabel, initials } from './chatFormat'
import { MessageCard } from './MessageCards'

type Chat = ReturnType<typeof useBizChat>

const TONES = ['bg-primary', 'bg-success', 'bg-[#8A3FD1]', 'bg-[#B54708]', 'bg-[#475467]']

/** Ô chữ đại diện DN (màu cố định theo id); `vcci` = ô của VCCI. */
export function ChatAvatar({ id, name, size = 44, vcci = false, className }: { id?: string; name?: string | null; size?: number; vcci?: boolean; className?: string }) {
  const tone = vcci ? 'bg-navy' : TONES[[...(id ?? '')].reduce((s, c) => s + c.charCodeAt(0), 0) % TONES.length]
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, borderRadius: Math.round(size / 3.2), fontSize: Math.round(size / (vcci ? 4 : 2.8)) }}
      className={cn('grid shrink-0 place-items-center font-bold text-white', tone, className)}
    >
      {vcci ? 'VCCI' : initials(name)}
    </span>
  )
}

/**
 * Luồng tin của một hội thoại (widget + trang Tin nhắn): vạch ngày, tin hệ thống, bong bóng của mình / bên kia,
 * trạng thái gửi (đang gửi / lỗi - bấm gửi lại / đã gửi / đã xem), đang nhập. `partner` = DN đối tác (B2B), null = VCCI.
 */
export function ChatMessages({ chat, partner, compact = false, onReply, onPin }: { chat: Chat; partner: { id: string; name?: string | null } | null; compact?: boolean; onReply?: (m: WidgetMsg) => void; onPin?: (m: WidgetMsg) => void }) {
  const { lang } = useI18n()
  const t = chatText(lang)
  const lastMineSeq = [...chat.messages].reverse().find((m) => m.mine && m.seq != null)?.seq
  const sysText = (code?: string | null, fallback?: string) =>
    code === 'CLOSED' ? t.sysCLOSED : code === 'REOPENED' ? t.sysREOPENED : code === 'BLOCKED' ? t.sysBLOCKED : fallback
  const avatar = compact ? 28 : 32
  const myIds = chat.me?.principalIds ?? []

  return (
    <>
      {chat.hasOlder && (
        <button onClick={() => void chat.loadOlder()} className="mx-auto block text-xs font-medium text-primary hover:underline">{t.loadOlder}</button>
      )}
      {chat.loading && <div className="mx-auto size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      {chat.messages.map((m, i) => {
        const newDay = i === 0 || dayKey(chat.messages[i - 1].at) !== dayKey(m.at)
        const operator = m.senderKind === 'CMS_OPERATOR'
        const rich = m.kind !== 'TEXT' && m.kind !== 'SYSTEM_NOTICE' && m.kind !== 'INTERNAL_NOTE' && m.kind !== 'CALL'
        return (
          <Fragment key={m.key}>
            {newDay && (
              <div className="my-1 flex items-center gap-3 text-xs font-medium text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                {dayLabel(m.at)}
                <span className="h-px flex-1 bg-border" />
              </div>
            )}
            {m.system ? (
              <p className="mx-auto flex w-fit items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-xs text-foreground/80">
                <ShieldCheck className="size-3.5" /> {clock(m.at)} · {sysText(m.system, m.text)}
              </p>
            ) : (
              <div data-mid={m.serverId} className={cn('flex items-end gap-2', m.mine && 'justify-end')}>
                {!m.mine && <ChatAvatar id={partner?.id} name={operator ? m.senderName : partner?.name} vcci={operator} size={avatar} className={operator ? 'rounded-full' : undefined} />}
                <div className={cn('flex max-w-[78%] flex-col gap-1', m.mine ? 'items-end' : 'items-start')}>
                  {!m.mine && operator && (
                    <span className="flex items-center gap-1.5 text-xs text-foreground/80">
                      <strong>{m.senderName ?? t.staff}</strong>
                      <span className="rounded bg-gold-soft px-1.5 text-[10px] font-bold uppercase text-gold">{tx('Cán bộ VCCI', 'VCCI officer', 'VCCI 담당자')}</span>
                    </span>
                  )}
                  <div className={cn('group relative flex flex-col gap-1', m.mine ? 'items-end' : 'items-start')}>
                    {m.replyTo && (
                      <p className="max-w-full truncate rounded-lg border-l-2 border-primary bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                        <strong>{m.replyTo.senderName ?? ''}</strong> {m.replyTo.body ?? m.replyTo.messageKind}
                      </p>
                    )}
                    {rich ? (
                      <MessageCard chat={chat} m={m} onReply={onReply} />
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        onClick={m.state === 'failed' ? () => void chat.send(m.text, m.clientId) : undefined}
                        className={cn(
                          'whitespace-pre-wrap break-words px-3.5 py-2.5 text-[13.5px] leading-relaxed',
                          m.mine ? 'rounded-[16px_16px_4px_16px] bg-primary text-primary-foreground' : 'rounded-[16px_16px_16px_4px] border bg-card',
                          m.state === 'pending' && 'opacity-70',
                          m.state === 'failed' && 'cursor-pointer ring-2 ring-destructive/60',
                        )}
                      >
                        {m.text}
                      </motion.div>
                    )}
                    {rich && m.text && <p className="whitespace-pre-wrap break-words text-[13px]">{m.text}</p>}
                    {!!m.reactions?.length && (
                      <div className="flex flex-wrap gap-1">
                        {m.reactions.map((r) => (
                          <button
                            key={r.emoji}
                            type="button"
                            aria-pressed={r.principalIds.some((id) => myIds.includes(id))}
                            aria-label={`${r.emoji} ${r.principalIds.length}`}
                            onClick={() => m.serverId != null && void chat.react(m.serverId, r.emoji)}
                            className={cn('rounded-full border bg-card px-2 py-0.5 text-xs', r.principalIds.some((id) => myIds.includes(id)) && 'border-primary bg-primary-soft')}
                          >
                            {r.emoji} {r.principalIds.length}
                          </button>
                        ))}
                      </div>
                    )}
                    {m.serverId != null && (
                      <div className={cn('absolute -top-3 z-10 hidden items-center gap-0.5 rounded-full border bg-popover px-1 py-0.5 shadow group-focus-within:flex group-hover:flex', m.mine ? 'right-0' : 'left-0')}>
                        <span className="group/r relative">
                          <button type="button" aria-label={tx('Thả cảm xúc', 'React', '반응')} className="grid size-6 place-items-center rounded-full hover:bg-muted"><SmilePlus className="size-3.5" /></button>
                          <span className="absolute bottom-full left-1/2 hidden -translate-x-1/2 grid-cols-6 gap-0.5 rounded-xl border bg-popover p-1 shadow group-focus-within/r:grid group-hover/r:grid">
                            {REACTIONS.map((e) => (
                              <button key={e} type="button" aria-label={e} onClick={() => void chat.react(m.serverId!, e)} className="grid size-7 place-items-center rounded-full text-base transition-transform hover:scale-125 hover:bg-muted">{e}</button>
                            ))}
                          </span>
                        </span>
                        {onReply && <button type="button" aria-label={tx('Trả lời', 'Reply', '답장')} onClick={() => onReply(m)} className="grid size-6 place-items-center rounded-full hover:bg-muted"><CornerUpLeft className="size-3.5" /></button>}
                        {onPin && <button type="button" aria-label={tx('Ghim tin', 'Pin message', '메시지 고정')} onClick={() => onPin(m)} className="grid size-6 place-items-center rounded-full hover:bg-muted"><Pin className="size-3.5" /></button>}
                      </div>
                    )}
                  </div>
                  <span className={cn('flex items-center gap-1 text-[11px]', m.state === 'failed' ? 'text-destructive' : 'text-muted-foreground')}>
                    {clock(m.at)}
                    {m.mine && m.state === 'pending' && (<><Clock className="size-3" /> {t.sending}</>)}
                    {m.mine && m.state === 'failed' && (<><RotateCw className="size-3" /> {t.failed}</>)}
                    {m.mine && m.state === 'sent' && m.seq === lastMineSeq && (m.seq != null && chat.otherReadSeq >= m.seq
                      ? (<><CheckCheck className="size-3 text-primary" /> {t.seen}</>)
                      : (<><Check className="size-3" /> {t.sent}</>))}
                  </span>
                </div>
              </div>
            )}
          </Fragment>
        )
      })}
      {chat.typing && (
        <div className="flex items-end gap-2">
          <ChatAvatar id={partner?.id} name={partner?.name} vcci={!partner} size={avatar} />
          <div className="flex gap-1 rounded-[16px_16px_16px_4px] border bg-card px-3.5 py-3" aria-label={`${chat.typing} ${t.typing}`}>
            {[0, 1, 2].map((i) => (
              <motion.span key={i} className="size-1.5 rounded-full bg-muted-foreground" animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15 }} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
