import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, CalendarPlus, Heart, Maximize2, Send, ThumbsUp, Users, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEvent } from '@/api'
import { businesses } from '@/data/mock'
import { mainSponsor, SponsorMark, SponsorVerticalBanner } from '@/components/sponsor'
import { CompanyMark, VerifiedBadge } from '@/components/brand'
import { LiveDot } from '@/components/effects'
import { useToast } from '@/components/ui/overlay'
import { Badge, Button } from '@/components/ui/primitives'
import NotFound from '@/pages/NotFound'
import { useI18n } from '@/lib/i18n'
import { cn, formatNumber, img } from '@/lib/utils'

type ChatMsg = { id: number; name: string; country: string; text: string; me?: boolean }

const SCRIPT: Omit<ChatMsg, 'id'>[] = [
  { name: 'Kim J.', country: 'KR', text: 'What is the MOQ for the roasted Arabica?' },
  { name: 'Trần Hưng', country: 'VN', text: 'MOQ 500 kg ạ, nhận nhãn riêng.' },
  { name: 'Park S.', country: 'KR', text: 'Can you share HACCP certificate?' },
  { name: 'Mekong Pearl', country: 'VN', text: 'Yes — attached in our company profile 👍' },
  { name: 'Lee H.', country: 'KR', text: 'Interested in 26/30 shrimp, 2 containers/month.' },
  { name: 'Nguyễn Lan', country: 'VN', text: 'Chúng tôi có thể giao CIF Busan trong 25 ngày.' },
  { name: 'Choi M.', country: 'KR', text: 'Booking a B2B meeting at 16:00 🙌' },
]

export default function LiveRoom() {
  const { id = '' } = useParams()
  const { t, L, locale } = useI18n()
  const toast = useToast()
  const ev = getEvent(id)
  const exhibitors = businesses.filter((b) => ['c-agri', 'c-sea'].includes(b.categoryId))
  const [viewers, setViewers] = useState(ev?.viewers ?? 1200)
  const [showing, setShowing] = useState(0)
  const [msgs, setMsgs] = useState<ChatMsg[]>([])
  const [text, setText] = useState('')
  const [hearts, setHearts] = useState<number[]>([])
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const v = setInterval(() => setViewers((n) => n + Math.round((Math.random() - 0.35) * 14)), 1800)
    const s = setInterval(() => setShowing((n) => (n + 1) % exhibitors.length), 7000)
    let k = 0
    const c = setInterval(() => {
      const m = SCRIPT[k % SCRIPT.length]!
      k++
      setMsgs((prev) => [...prev.slice(-40), { ...m, id: Date.now() }])
    }, 2600)
    return () => { clearInterval(v); clearInterval(s); clearInterval(c) }
  }, [exhibitors.length])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs])

  if (!ev) return <NotFound />
  const ex = exhibitors[showing]!

  const react = () => {
    const id = Date.now() + Math.random()
    setHearts((h) => [...h, id])
    setTimeout(() => setHearts((h) => h.filter((x) => x !== id)), 2200)
  }

  return (
    <div className="bg-[#05061c] pb-16 pt-5 text-white">
      <div className="container-page">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link to={`/events/${ev.id}`} className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"><ArrowLeft className="size-4" /> {t.live.back}</Link>
          <div className="flex items-center gap-2">
            <Badge variant="live" className="gap-1.5 px-2.5 py-1"><LiveDot /> {t.events.live}</Badge>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold tabular-nums">
              <Users className="size-3.5" /> {formatNumber(viewers, locale)} {t.events.viewers}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* player */}
          <div>
            <div className="group relative aspect-video overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.img
                  key={ex.id}
                  src={img(ex.coverImage, 1400, 790)}
                  alt=""
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1.02 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2 }}
                  className="absolute inset-0 size-full object-cover"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
              <div className="absolute left-4 top-4 flex items-center gap-2">
                <img src="/imgs/lg1.png" alt="VCCI" className="h-5 w-auto rounded bg-white/90 px-1.5 py-0.5" />
                <span className="rounded bg-black/40 px-2 py-0.5 text-[11px] font-semibold backdrop-blur">HLS · 1080p</span>
              </div>

              {/* lower third */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={ex.id}
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute bottom-16 left-4 flex max-w-[80%] items-center gap-3 rounded-xl bg-white/95 p-2.5 pr-4 text-navy shadow-2xl"
                >
                  <CompanyMark name={ex.nameEn} accent={ex.accent} className="size-10" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{t.live.nowShowing}</p>
                    <p className="truncate text-sm font-bold">{ex.name}</p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* reactions */}
              <div className="pointer-events-none absolute bottom-16 right-6 h-64 w-16">
                <AnimatePresence>
                  {hearts.map((h) => (
                    <motion.span
                      key={h}
                      className="absolute bottom-0 left-1/2"
                      initial={{ y: 0, opacity: 1, scale: 0.6, x: 0 }}
                      animate={{ y: -220, opacity: 0, scale: 1.3, x: (Math.random() - 0.5) * 60 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 2, ease: 'easeOut' }}
                    >
                      <Heart className="size-7 fill-live text-live drop-shadow" />
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>

              {/* controls */}
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-4 py-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-live"><LiveDot /> LIVE</span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20"><div className="h-full w-full bg-live" /></div>
                <button className="rounded p-1 text-white/80 hover:text-white" aria-label={t.ui.volume}><Volume2 className="size-4" /></button>
                <button className="rounded p-1 text-white/80 hover:text-white" aria-label={t.ui.fullscreen}><Maximize2 className="size-4" /></button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <h1 className="text-xl font-extrabold leading-snug md:text-2xl">{L(ev.title)}</h1>
                <p className="mt-1 text-sm text-white/60">{L(ev.organizedBy)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="bg-white/10 text-white hover:bg-white/15" onClick={react}><ThumbsUp /> {formatNumber(1284, locale)}</Button>
                <Button variant="gold" onClick={() => toast({ kind: 'success', title: t.live.requestMeeting, description: ex.name })}><CalendarPlus /> {t.live.requestMeeting}</Button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
                <p className="text-sm font-bold">{t.live.agenda}</p>
                <ol className="mt-3 space-y-2">
                  {ev.agendaOptions.map((a, i) => {
                    const now = i === 1
                    return (
                      <li key={i} className={cn('flex gap-3 rounded-lg p-2.5 text-sm', now ? 'bg-live/15 ring-1 ring-live/40' : 'text-white/70')}>
                        <span className="w-24 shrink-0 font-mono text-xs leading-5">{a.agendaStartTime}–{a.agendaEndTime}</span>
                        <span className="flex-1">{L(a.agendaTitle)}</span>
                        {now && <LiveDot className="mt-1.5 text-live" />}
                      </li>
                    )
                  })}
                </ol>
              </div>
              <div className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10">
                <p className="text-sm font-bold">{t.live.exhibitors}</p>
                <ul className="mt-3 space-y-2">
                  {exhibitors.map((b, i) => (
                    <li key={b.id}>
                      <Link to={`/suppliers/${b.id}`} className={cn('flex items-center gap-3 rounded-lg p-2 transition hover:bg-white/5', i === showing && 'bg-white/[0.07]')}>
                        <CompanyMark name={b.nameEn} accent={b.accent} className="size-8 rounded-lg text-[10px]" />
                        <span className="min-w-0 flex-1 truncate text-sm">{b.name}</span>
                        <VerifiedBadge compact />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <SponsorVerticalBanner dark className="md:col-span-2" />
            </div>
          </div>

          {/* chat */}
          <aside className="flex h-[620px] flex-col overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/10 lg:sticky lg:top-32">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-sm font-bold">{t.live.chat}</p>
              <span className="text-xs text-white/50">{msgs.length}</span>
            </div>
            <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto p-4">
              <AnimatePresence initial={false}>
                {msgs.map((m) => (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn('text-[13px] leading-relaxed', m.me && 'rounded-lg bg-primary/20 p-2')}>
                    <span className="mr-1.5 rounded bg-white/10 px-1 font-mono text-[10px] font-bold">{m.country}</span>
                    <span className={cn('mr-1.5 font-semibold', m.country === 'VN' ? 'text-gold-bright' : 'text-sky-300')}>{m.name}</span>
                    <span className="text-white/85">{m.text}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="border-t border-white/10 p-3">
              <div className="mb-2 flex items-center gap-2 rounded-lg px-2 py-1.5" style={{ background: `linear-gradient(90deg, ${mainSponsor.color}, transparent)` }}>
                <SponsorMark mark={mainSponsor.mark} color="#ffffff22" className="size-6 rounded-md text-[9px]" />
                <span className="text-[11px] font-semibold">{t.home.sponsorMain}: {mainSponsor.name}</span>
              </div>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!text.trim()) return
                  setMsgs((p) => [...p, { id: Date.now(), name: t.ui.you, country: 'VN', text, me: true }])
                  setText('')
                }}
              >
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t.live.say} aria-label={t.live.say} className="h-10 min-w-0 flex-1 rounded-lg bg-white/10 px-3 text-sm text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-primary" />
                <button type="button" onClick={react} className="grid size-10 place-items-center rounded-lg bg-white/10 text-live hover:bg-white/15" aria-label={t.ui.react}><Heart className="size-4" /></button>
                <button type="submit" className="grid size-10 place-items-center rounded-lg bg-primary hover:bg-primary-hover" aria-label={t.ui.send}><Send className="size-4" /></button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
