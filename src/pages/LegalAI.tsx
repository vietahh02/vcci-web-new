import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, BookOpen, Sparkles, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChatError, chatConfigured, legalAiApi } from '@/api/chat'
import { tokens } from '@/api/http'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type Msg = { id: number; role: 'user' | 'ai'; text: string; sources?: string[]; error?: boolean }

const MSG = {
  vi: { login: 'Vui lòng đăng nhập để hỏi trợ lý pháp lý.', loginBtn: 'Đăng nhập', notConfigured: 'Chưa cấu hình dịch vụ chat.', tooFast: 'Bạn hỏi quá nhanh, vui lòng thử lại sau ít phút.', off: 'Trợ lý pháp lý đang tạm tắt. Vui lòng quay lại sau.', fail: 'Xin lỗi, hiện chưa thể trả lời. Vui lòng thử lại sau.' },
  en: { login: 'Please sign in to ask the legal assistant.', loginBtn: 'Sign in', notConfigured: 'Chat service is not configured.', tooFast: 'You are asking too fast, please try again in a few minutes.', off: 'The legal assistant is temporarily off. Please come back later.', fail: 'Sorry, I cannot answer right now. Please try again later.' },
  ko: { login: '법률 도우미에게 질문하려면 로그인하세요.', loginBtn: '로그인', notConfigured: '채팅 서비스가 구성되지 않았습니다.', tooFast: '질문이 너무 빠릅니다. 잠시 후 다시 시도하세요.', off: '법률 도우미가 일시 중지되었습니다. 나중에 다시 오세요.', fail: '죄송합니다. 지금은 답변할 수 없습니다. 나중에 다시 시도하세요.' },
}

const sourceLabel = (s: { title?: string | null; sectionTitle?: string | null; fileName?: string | null }) =>
  [s.title ?? s.fileName, s.sectionTitle].filter(Boolean).join(' › ')

export default function LegalAI() {
  const { t, lang } = useI18n()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [thinking, setThinking] = useState(false)
  const [needLogin, setNeedLogin] = useState(false)
  const navigate = useNavigate()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [msgs, thinking])

  async function ask(q: string) {
    if (!q.trim() || thinking) return
    const m = MSG[lang]
    setMsgs((x) => [...x, { id: Date.now(), role: 'user', text: q }])
    setText('')
    if (!chatConfigured()) {
      setMsgs((x) => [...x, { id: Date.now() + 1, role: 'ai', text: m.notConfigured, error: true }])
      return
    }
    if (!tokens.access()) {
      setNeedLogin(true)
      return
    }
    setThinking(true)
    try {
      const r = await legalAiApi.ask(q.trim(), lang)
      const sources = (r.sources ?? []).map(sourceLabel).filter(Boolean)
      setMsgs((x) => [...x, { id: Date.now() + 1, role: 'ai', text: r.answer, sources: sources.length ? Array.from(new Set(sources)) : undefined }])
    } catch (e) {
      const status = e instanceof ChatError ? e.status : 0
      const text = status === 401 ? m.login : status === 429 ? m.tooFast : status === 503 ? m.off : m.fail
      if (status === 401) setNeedLogin(true)
      setMsgs((x) => [...x, { id: Date.now() + 1, role: 'ai', text, error: true }])
    } finally {
      setThinking(false)
    }
  }

  const empty = msgs.length === 0

  return (
    <div className="relative flex h-[calc(100dvh-112px)] min-h-[560px] flex-col">
      {/* decorative backdrop: clipped here so the page itself never scrolls sideways */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-dots absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_top,#000,transparent_70%)]" />
        <div className="absolute -left-40 top-0 size-[520px] animate-aurora rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -right-40 top-40 size-[420px] animate-aurora rounded-full bg-gold-bright/15 blur-3xl [animation-delay:-8s]" />
      </div>

      {/* conversation: the only scrolling part */}
      <div className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="container-page mx-auto flex max-w-4xl flex-col py-10">
        <AnimatePresence>
          {empty && (
            <motion.div exit={{ opacity: 0, y: -20, height: 0 }} transition={{ duration: 0.4 }} className="text-center">
              <motion.img src="/imgs/vcci-seal.png" alt="" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.4 }} className="mx-auto size-[72px]" />
              <h1 className="mt-6 text-3xl font-extrabold tracking-tight md:text-4xl">{t.legal.title}</h1>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t.legal.sub}</p>
              <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
                {t.legal.suggestions.map((s, i) => (
                  <motion.button
                    key={s}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.07 }}
                    whileHover={{ y: -3 }}
                    onClick={() => ask(s)}
                    className="group flex items-start gap-3 rounded-xl border bg-card p-4 text-left text-sm font-medium transition hover:border-primary/40 hover:shadow-lg"
                  >
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-gold transition group-hover:rotate-12" />
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 space-y-5 pb-6">
          {msgs.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={cn('flex gap-3', m.role === 'user' && 'flex-row-reverse')}>
              {m.role === 'ai'
                ? <img src="/imgs/vcci-seal.png" alt="" className="size-9 shrink-0" />
                : <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted"><UserRound className="size-4" /></div>}
              <div className={cn('max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed', m.role === 'user' ? 'bg-primary text-primary-foreground' : 'border bg-card')}>
                <span className="whitespace-pre-wrap">{m.text}</span>
                {m.sources && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 border-t pt-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.legal.sources}</p>
                    <div className="flex flex-wrap gap-2">
                      {m.sources.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium"><BookOpen className="size-3.5 text-primary" /> {s}</span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
          {needLogin && (
            <div className="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm">
              <span className="flex-1">{MSG[lang].login}</span>
              <button type="button" className="rounded-lg bg-primary px-3 py-1.5 font-semibold text-primary-foreground" onClick={() => navigate(`/login?return=${encodeURIComponent('/legal-ai')}`)}>{MSG[lang].loginBtn}</button>
            </div>
          )}
          {thinking && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <img src="/imgs/vcci-seal.png" alt="" className="size-9 shrink-0" />
              <span className="relative overflow-hidden">
                {t.legal.thinking}
                <span className="absolute inset-0 animate-shine bg-gradient-to-r from-transparent via-background/80 to-transparent" />
              </span>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      </div>
      {/* input: pinned to the bottom of the screen, never scrolls away */}
      <div className="relative shrink-0 bg-gradient-to-t from-background via-background/95 to-transparent pb-5 pt-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            ask(text)
          }}
          className="container-page mx-auto max-w-4xl max-sm:pr-[84px] sm:max-xl:pr-[96px]"
        >
          <div className="flex items-end gap-2 rounded-full border-2 border-primary/25 bg-card p-1.5 shadow-xl shadow-navy/10 transition-[border,box-shadow] duration-300 focus-within:border-primary focus-within:shadow-[0_0_0_5px_color-mix(in_oklab,var(--primary)_14%,transparent)]">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  ask(text)
                }
              }}
              rows={1}
              placeholder={t.legal.placeholder}
              aria-label={t.legal.placeholder}
              className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-4 py-2.5 text-[15px] outline-none focus-visible:outline-none"
            />
            <button type="submit" disabled={!text.trim() || thinking} className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#1a8cc4] to-primary text-primary-foreground shadow-md shadow-primary/30 transition-all duration-200 hover:shadow-lg hover:shadow-primary/40 hover:-translate-y-px disabled:opacity-40 disabled:shadow-none" aria-label={t.ui.send}>
              <ArrowUp className="size-5" />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">{t.legal.disclaimer}</p>
        </form>
      </div>
    </div>
  )
}
