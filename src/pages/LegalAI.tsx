import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, Bot, BookOpen, Scale, Sparkles, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type Msg = { id: number; role: 'user' | 'ai'; text: string; sources?: string[] }

const ANSWERS = {
  vi: {
    text: 'Theo Hiệp định EVFTA, cà phê rang (HS 0901.21) được xoá bỏ thuế nhập khẩu vào EU ngay khi Hiệp định có hiệu lực. Để hưởng thuế 0%, lô hàng cần: (1) đáp ứng quy tắc xuất xứ — cà phê nhân phải có xuất xứ thuần tuý Việt Nam; (2) có chứng từ tự chứng nhận xuất xứ (REX) hoặc C/O mẫu EUR.1; (3) vận chuyển trực tiếp hoặc chứng minh không bị gia công tại nước thứ ba. Doanh nghiệp nên kiểm tra thêm quy định EUDR về truy xuất nguồn gốc vùng trồng.',
    sources: ['EVFTA – Phụ lục 2-A (Biểu thuế EU)', 'Nghị định 116/2020/NĐ-CP', 'Thông tư 11/2020/TT-BCT về quy tắc xuất xứ'],
  },
  en: {
    text: 'Under EVFTA, roasted coffee (HS 0901.21) enters the EU duty-free from entry into force. To claim 0% duty a shipment must: (1) meet the rules of origin — the green beans must be wholly obtained in Vietnam; (2) carry a REX statement on origin or an EUR.1 certificate; (3) be shipped directly or prove no processing in a third country. Also check EUDR farm-level traceability requirements.',
    sources: ['EVFTA – Annex 2-A (EU tariff schedule)', 'Decree 116/2020/ND-CP', 'Circular 11/2020/TT-BCT on rules of origin'],
  },
  ko: {
    text: 'EVFTA에 따라 볶은 커피(HS 0901.21)는 협정 발효 즉시 EU 수입 관세가 철폐되었습니다. 0% 관세를 적용받으려면 화물이 다음을 충족해야 합니다: (1) 원산지 규정 — 생두가 베트남에서 완전 생산되어야 함; (2) REX 원산지 자율증명 또는 EUR.1 원산지증명서 구비; (3) 직접 운송 또는 제3국에서 가공되지 않았음을 증명. 또한 재배지 단위 추적성에 관한 EUDR 요건도 확인하시기 바랍니다.',
    sources: ['EVFTA – 부속서 2-A (EU 관세 양허표)', '시행령 116/2020/ND-CP', '원산지 규정에 관한 시행규칙 11/2020/TT-BCT'],
  },
}

export default function LegalAI() {
  const { t, lang } = useI18n()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [thinking, setThinking] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [msgs, thinking])

  function ask(q: string) {
    if (!q.trim() || thinking) return
    setMsgs((m) => [...m, { id: Date.now(), role: 'user', text: q }])
    setText('')
    setThinking(true)
    setTimeout(() => {
      setThinking(false)
      const a = ANSWERS[lang]
      const id = Date.now()
      setMsgs((m) => [...m, { id, role: 'ai', text: '', sources: a.sources }])
      // stream the answer word by word
      const words = a.text.split(' ')
      let i = 0
      const timer = setInterval(() => {
        i += 2
        setMsgs((m) => m.map((x) => (x.id === id ? { ...x, text: words.slice(0, i).join(' ') } : x)))
        if (i >= words.length) clearInterval(timer)
      }, 45)
    }, 1300)
  }

  const empty = msgs.length === 0

  return (
    <div className="relative min-h-[calc(100vh-112px)] overflow-hidden">
      <div className="pointer-events-none absolute -left-40 top-0 size-[520px] animate-aurora rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-40 size-[420px] animate-aurora rounded-full bg-gold-bright/15 blur-3xl [animation-delay:-8s]" />
      <div className="container-page relative flex max-w-4xl flex-col py-10">
        <AnimatePresence>
          {empty && (
            <motion.div exit={{ opacity: 0, y: -20, height: 0 }} transition={{ duration: 0.4 }} className="text-center">
              <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.4 }} className="mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-navy text-white shadow-xl shadow-primary/30">
                <Scale className="size-8" />
              </motion.div>
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
              <div className={cn('grid size-9 shrink-0 place-items-center rounded-xl', m.role === 'ai' ? 'bg-gradient-to-br from-primary to-navy text-white' : 'bg-muted')}>
                {m.role === 'ai' ? <Bot className="size-4" /> : <UserRound className="size-4" />}
              </div>
              <div className={cn('max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed', m.role === 'user' ? 'bg-primary text-primary-foreground' : 'border bg-card')}>
                {m.text}
                {m.role === 'ai' && m.text.length < ANSWERS[lang].text.length && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary align-middle" />}
                {m.sources && m.text.length >= ANSWERS[lang].text.length - 2 && (
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
          {thinking && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-navy text-white"><Bot className="size-4" /></div>
              <span className="relative overflow-hidden">
                {t.legal.thinking}
                <span className="absolute inset-0 animate-shine bg-gradient-to-r from-transparent via-background/80 to-transparent" />
              </span>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="sticky bottom-0 z-40 bg-gradient-to-t from-background via-background to-transparent pb-5 pt-10">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            ask(text)
          }}
          className="container-page max-w-4xl"
        >
          <div className="border-spin flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-xl shadow-navy/10">
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
              className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] outline-none focus-visible:outline-none"
            />
            <button type="submit" disabled={!text.trim() || thinking} className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary-hover disabled:opacity-40" aria-label={t.ui.send}>
              <ArrowUp className="size-5" />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">{t.legal.disclaimer}</p>
        </form>
      </div>
    </div>
  )
}
