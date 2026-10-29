import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, Bot, MessageCircle, Send, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type Msg = { id: number; from: 'me' | 'bot'; text: string }

/** Floating business chat (channels PORTAL_BUSINESS_SUPPORT / PORTAL_BUSINESS_B2B in the real portal). */
export function ChatWidget() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [channel, setChannel] = useState<'support' | 'b2b'>('support')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const [showTop, setShowTop] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMsgs([{ id: 0, from: 'bot', text: t.chat.greet }])
  }, [t.chat.greet])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, typing])

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 900)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function send(body: string) {
    if (!body.trim()) return
    setMsgs((m) => [...m, { id: Date.now(), from: 'me', text: body }])
    setText('')
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMsgs((m) => [...m, { id: Date.now() + 1, from: 'bot', text: t.chat.reply }])
    }, 1400)
  }

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ type: 'spring', bounce: 0.22, duration: 0.45 }}
            style={{ transformOrigin: 'bottom right' }}
            className="flex h-[min(560px,calc(100dvh-110px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border bg-popover shadow-2xl shadow-navy/25"
          >
            <div className="relative overflow-hidden bg-navy px-4 pb-3 pt-4 text-white">
              <div className="absolute -right-10 -top-10 size-40 rounded-full bg-primary/50 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20"><Bot className="size-5" /></div>
                <div className="flex-1">
                  <p className="font-bold">{t.chat.title}</p>
                  <p className="flex items-center gap-1.5 text-xs text-white/70"><span className="size-1.5 rounded-full bg-emerald-400" /> {t.chat.online}</p>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-md p-1.5 hover:bg-white/10" aria-label={t.ui.close}><X className="size-4" /></button>
              </div>
              <div className="relative mt-3 inline-flex rounded-lg bg-white/10 p-0.5">
                {(['support', 'b2b'] as const).map((c) => (
                  <button key={c} onClick={() => setChannel(c)} className={cn('relative rounded-md px-3 py-1 text-xs font-semibold', channel === c ? 'text-navy' : 'text-white/75')}>
                    {channel === c && <motion.span layoutId="chat-ch" className="absolute inset-0 rounded-md bg-white" />}
                    <span className="relative">{t.chat.channels[c]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-muted/40 p-4">
              {msgs.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn('max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed', m.from === 'me' ? 'ml-auto rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md border bg-card')}
                >
                  {m.text}
                </motion.div>
              ))}
              {typing && (
                <div className="flex w-16 items-center justify-center gap-1 rounded-2xl rounded-bl-md border bg-card py-3">
                  {[0, 1, 2].map((i) => (
                    <motion.span key={i} className="size-1.5 rounded-full bg-muted-foreground" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                  ))}
                </div>
              )}
              {msgs.length === 1 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {t.chat.quick.map((q) => (
                    <button key={q} onClick={() => send(q)} className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium transition hover:border-primary hover:text-primary">
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                send(text)
              }}
              className="flex items-center gap-2 border-t p-3"
            >
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t.chat.say} aria-label={t.chat.say} className="h-10 flex-1 rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary" />
              <button type="submit" className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary-hover active:scale-95" aria-label={t.ui.send}>
                <Send className="size-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        <AnimatePresence>
          {showTop && !open && (
            <motion.button
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="grid size-11 place-items-center rounded-full border bg-background shadow-lg transition hover:-translate-y-0.5"
              aria-label={t.ui.backToTop}
            >
              <ArrowUp className="size-4" />
            </motion.button>
          )}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setOpen((v) => !v)}
          className="relative grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/40"
          aria-label={t.chat.title}
          aria-expanded={open}
        >
          {!open && <span className="absolute inset-0 animate-ping rounded-full bg-primary/40 [animation-duration:2.4s]" />}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={String(open)} initial={{ rotate: -90, scale: 0.5 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: 90, scale: 0.5 }} transition={{ duration: 0.2 }}>
              {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  )
}
