import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Building2, CalendarDays, Check, Clock, Copy, FileUp, MapPin, PlayCircle, Radio, Ticket, Users, Video } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEvent } from '@/api'
import { events, type EventItem } from '@/data/mock'
import { SectionHeader } from '@/components/brand'
import { SponsorVerticalBanner } from '@/components/sponsor'
import { ProfileRegistration } from '@/components/event/ProfileRegistration'
import { EventCard } from '@/components/cards'
import { Countdown, LiveDot, Reveal } from '@/components/effects'
import { Dialog, DialogContent, useToast } from '@/components/ui/overlay'
import { Badge, Button, buttonClass, Progress } from '@/components/ui/primitives'
import NotFound from '@/pages/NotFound'
import { useI18n } from '@/lib/i18n'
import { cn, formatDate, formatMoney, formatNumber, img } from '@/lib/utils'

export default function EventDetail() {
  const { id = '' } = useParams()
  const { t, L, locale } = useI18n()
  const ev = getEvent(id)
  const [regOpen, setRegOpen] = useState(false)
  if (!ev) return <NotFound />
  const pct = (ev.registeredSlots / ev.maxSlots) * 100
  const others = events.filter((e) => e.id !== ev.id && e.eventStatus !== 'ENDED').slice(0, 3)

  return (
    <>
      <section className="relative isolate overflow-hidden bg-navy text-white">
        <img src={img(ev.coverImage, 1800, 800)} alt="" className="absolute inset-0 -z-20 size-full animate-kenburns object-cover opacity-40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/85 to-navy/40" />
        <div className="container-page grid gap-10 py-12 md:py-20 lg:grid-cols-[1fr_380px]">
          <Reveal>
            <nav className="mb-5 text-[13px] text-white/60"><Link to="/events" className="hover:text-white">{t.nav.events}</Link> / {t.events.type[ev.eventType]}</nav>
            <div className="flex flex-wrap gap-2">
              {ev.eventStatus === 'ONGOING' ? (
                <Badge variant="live" className="gap-1.5"><LiveDot /> {t.events.live}</Badge>
              ) : (
                <Badge variant="outline" className="border-white/30 text-white">{t.events.status[ev.eventStatus]}</Badge>
              )}
              <Badge variant="outline" className="border-white/30 text-white">{ev.eventType === 'LIVESTREAM' ? <Radio /> : <Video />} {t.events.type[ev.eventType]}</Badge>
              {ev.industry.map((i) => <Badge key={i} variant="outline" className="border-white/20 text-white/80">{i}</Badge>)}
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-balance md:text-5xl">{L(ev.title)}</h1>
            <p className="mt-4 max-w-2xl text-white/75 md:text-lg">{L(ev.introduction)}</p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
              <span className="inline-flex items-center gap-2"><CalendarDays className="size-4 text-gold-bright" /> {formatDate(ev.startDate, locale, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span>
              <span className="inline-flex items-center gap-2"><Clock className="size-4 text-gold-bright" /> {ev.startTime} – {ev.endTime} (GMT+7)</span>
              <span className="inline-flex items-center gap-2"><MapPin className="size-4 text-gold-bright" /> {L(ev.location)}</span>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="glass-dark h-fit rounded-2xl p-6">
            {ev.eventStatus === 'UPCOMING' && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/60">{t.events.startsIn}</p>
                <Countdown target={ev.startDate} labels={t.common.countdown} dark className="mt-2" />
              </>
            )}
            <div className="mt-5 flex items-baseline justify-between">
              <span className="text-sm text-white/65">{t.events.fee}</span>
              <span className="text-2xl font-extrabold">{ev.participationFee ? formatMoney(ev.participationFee, ev.participationFeeCurrency, locale) : t.common.free}</span>
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs text-white/70">
                <span className="inline-flex items-center gap-1.5"><Users className="size-3.5" /> {formatNumber(ev.registeredSlots, locale)}/{formatNumber(ev.maxSlots, locale)} {t.events.slots}</span>
                <span>{Math.round(pct)}%</span>
              </div>
              <Progress value={pct} className="bg-white/15" barClassName="bg-gradient-to-r from-gold-bright to-amber-400" />
            </div>
            {ev.eventStatus === 'ONGOING' ? (
              <Link to={`/live/${ev.id}`} className={buttonClass('default', 'lg', 'mt-6 w-full bg-live hover:bg-live/90')}><LiveDot /> {t.events.watchNow}</Link>
            ) : ev.eventStatus === 'ENDED' ? (
              <Button variant="white" size="lg" className="mt-6 w-full"><PlayCircle /> {t.events.watchRecording}</Button>
            ) : (
              <Button variant="gold" size="lg" className="mt-6 w-full" onClick={() => setRegOpen(true)}><Ticket /> {t.events.register}</Button>
            )}
            <p className="mt-4 flex items-center gap-2 text-xs text-white/60"><Building2 className="size-3.5" /> {t.events.organizer}: {L(ev.organizedBy)}</p>
          </Reveal>
        </div>
      </section>

      <div className="container-page mt-12 grid gap-10 lg:grid-cols-[1fr_380px]">
        <section>
          <ProgramInfo ev={ev} />
          <h2 className="text-xl font-extrabold">{t.events.agenda}</h2>
          <ol className="relative mt-6 space-y-4 border-l-2 border-dashed border-border pl-6">
            {ev.agendaOptions.map((a, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative rounded-xl border bg-card p-4"
              >
                <span className="absolute -left-[33px] top-5 grid size-4 place-items-center rounded-full bg-background ring-2 ring-primary">
                  <span className="size-1.5 rounded-full bg-primary" />
                </span>
                <p className="font-mono text-xs font-semibold text-primary">{a.agendaStartTime}{a.agendaEndTime && ` – ${a.agendaEndTime}`}</p>
                <p className="mt-1 font-semibold">{L(a.agendaTitle)}</p>
                {a.speaker && <p className="mt-1 text-sm text-muted-foreground">{a.speaker}</p>}
              </motion.li>
            ))}
          </ol>
        </section>
        <aside className="space-y-4">
          <SponsorVerticalBanner className="lg:sticky lg:top-32" />
        </aside>
      </div>

      {others.length > 0 && (
        <section className="container-page mt-16">
          <SectionHeader title={t.home.eventsTitle} action={{ to: '/events', label: t.common.viewAll }} />
          <div className="grid gap-5 md:grid-cols-3">{others.map((e) => <EventCard key={e.id} event={e} />)}</div>
        </section>
      )}

      <RegisterDialog ev={ev} open={regOpen} onOpenChange={setRegOpen} />
    </>
  )
}

/** B2B programme details sourced from VCCI event forms: series, partner, market, eligibility, deadline, speakers, contact. */
function ProgramInfo({ ev }: { ev: EventItem }) {
  const { L, lang, locale } = useI18n()
  const vi = lang === 'vi'
  const facts = [
    ev.series && { k: vi ? 'Chuỗi chương trình' : 'Series', v: L(ev.series) },
    ev.partner && { k: vi ? 'Đơn vị phối hợp' : 'In partnership with', v: L(ev.partner) },
    ev.targetMarket && { k: vi ? 'Thị trường mục tiêu' : 'Target market', v: L(ev.targetMarket) },
    ev.registrationDeadline && { k: vi ? 'Hạn đăng ký' : 'Registration deadline', v: `${formatDate(ev.registrationDeadline, locale)}${vi ? ' (đóng sớm khi đủ chỉ tiêu)' : ' (may close early)'}` },
    ev.quota && { k: vi ? 'Chỉ tiêu' : 'Quota', v: `${formatNumber(ev.quota, locale)} ${vi ? 'doanh nghiệp' : 'companies'}` },
  ].filter(Boolean) as { k: string; v: string }[]
  if (!facts.length && !ev.speakers && !ev.eligibility && !ev.topics && !ev.contact) return null

  return (
    <div className="mb-12 space-y-10">
      {facts.length > 0 && (
        <dl className="grid gap-x-8 gap-y-5 border-y py-6 sm:grid-cols-2">
          {facts.map((f) => (
            <div key={f.k}>
              <dt className="text-xs text-muted-foreground">{f.k}</dt>
              <dd className="mt-1 font-semibold">{f.v}</dd>
            </div>
          ))}
        </dl>
      )}
      {ev.eligibility && (
        <div>
          <h2 className="text-xl font-extrabold">{vi ? 'Đối tượng & tiêu chí tham gia' : 'Who should apply'}</h2>
          <ul className="mt-4 space-y-2.5">
            {ev.eligibility.map((e) => <li key={e.en} className="flex gap-2.5 text-[15px]"><Check className="mt-0.5 size-4 shrink-0 text-success" /> {L(e)}</li>)}
          </ul>
        </div>
      )}
      {ev.topics && (
        <div>
          <h2 className="text-xl font-extrabold">{vi ? 'Nội dung chính' : 'Key topics'}</h2>
          <ul className="mt-4 space-y-2.5">
            {ev.topics.map((e) => <li key={e.en} className="flex gap-2.5 text-[15px]"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" /> {L(e)}</li>)}
          </ul>
        </div>
      )}
      {ev.speakers && (
        <div>
          <h2 className="text-xl font-extrabold">{vi ? 'Diễn giả' : 'Speakers'}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {ev.speakers.map((s) => (
              <div key={s.name} className="flex gap-4 rounded-2xl border p-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-navy text-base font-bold text-white">{s.name.split(' ').slice(-2).map((w) => w[0]).join('')}</span>
                <div className="min-w-0">
                  <p className="font-bold">{s.name}</p>
                  <p className="text-sm text-primary">{L(s.title)}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{L(s.org)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {ev.contact && (
        <div className="rounded-2xl bg-muted/60 p-5 text-sm">
          <p className="font-semibold">{vi ? 'Thông tin liên hệ' : 'Contact'}</p>
          <p className="mt-1.5 text-muted-foreground">{ev.contact.name} · {vi ? 'ĐT/Zalo' : 'Phone/Zalo'}: {ev.contact.phone} · {ev.contact.email}</p>
        </div>
      )}
    </div>
  )
}

/** POST /api/event/registrations → POST /api/event/registrations/payment (multipart proof) */
function RegisterDialog({ ev, open, onOpenChange }: { ev: EventItem; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t, L, locale } = useI18n()
  const toast = useToast()
  const paid = ev.participationFee > 0
  const steps = paid ? t.events.regSteps : [t.events.regSteps[0]!, t.events.regSteps[2]!]
  const [step, setStep] = useState(0)
  const [proof, setProof] = useState<string | null>(null)
  const memo = `VCCI ${ev.id.toUpperCase()} 0315220774`
  const last = steps.length - 1

  const close = (v: boolean) => {
    onOpenChange(v)
    if (!v) setTimeout(() => { setStep(0); setProof(null) }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent title={t.events.regTitle} description={L(ev.title)} className="max-w-xl">
        <div className="px-6 pt-5">
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <motion.span
                  animate={{ backgroundColor: i <= step ? 'var(--primary)' : 'var(--muted)', color: i <= step ? 'var(--primary-foreground)' : 'var(--muted-foreground)' }}
                  className="grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold"
                >
                  {i < step ? <Check className="size-3.5" /> : i + 1}
                </motion.span>
                <span className={cn('hidden text-xs font-semibold sm:block', i <= step ? 'text-foreground' : 'text-muted-foreground')}>{s}</span>
                {i < steps.length - 1 && (
                  <div className="h-0.5 flex-1 overflow-hidden rounded bg-muted">
                    <motion.div className="h-full bg-primary" animate={{ width: i < step ? '100%' : '0%' }} transition={{ duration: 0.4 }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
            {step === 0 && (
              <ProfileRegistration ev={ev} onDone={() => { setStep(1); if (!paid) toast({ kind: 'success', title: t.events.doneTitle }) }} />
            )}
            {paid && step === 1 && (
              <div className="p-6">
                <p className="font-bold">{t.events.payTitle}</p>
                <p className="text-sm text-muted-foreground">{t.events.payDesc}</p>
                <div className="mt-4 grid gap-5 sm:grid-cols-[170px_1fr]">
                  <div className="relative grid aspect-square place-items-center rounded-xl border bg-white p-3">
                    <FakeQr seed={memo} />
                    <motion.span className="absolute inset-x-3 h-0.5 bg-primary/70 shadow-[0_0_12px_var(--primary)]" animate={{ top: ['12%', '88%', '12%'] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} />
                  </div>
                  <dl className="space-y-2.5 text-sm">
                    {[
                      [t.events.bank, 'Sao Viet Bank – CN Hà Nội'],
                      [t.events.account, '1903 6688 2026'],
                      [t.events.amount, formatMoney(ev.participationFee, ev.participationFeeCurrency, locale)],
                      [t.events.memo, memo],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2">
                        <dt className="text-xs text-muted-foreground">{k}</dt>
                        <dd className="flex items-center gap-1.5 text-right font-semibold">
                          {v}
                          <button type="button" onClick={() => { void navigator.clipboard?.writeText(v!).catch(() => {}); toast({ kind: 'info', title: 'Copied', description: v }) }} className="text-muted-foreground hover:text-primary" aria-label="Copy"><Copy className="size-3.5" /></button>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <label className={cn('mt-5 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-4 transition', proof ? 'border-success bg-success-soft' : 'hover:border-primary/50')}>
                  {proof ? <Check className="size-5 text-success" /> : <FileUp className="size-5 text-primary" />}
                  <span className="text-sm font-medium">{proof ?? t.events.uploadProof}</span>
                  <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => setProof(e.target.files?.[0]?.name ?? null)} />
                </label>
                <div className="mt-5 flex justify-between">
                  <Button variant="ghost" onClick={() => setStep(0)}>{t.common.back}</Button>
                  <Button disabled={!proof} onClick={() => { setStep(2); toast({ kind: 'success', title: t.events.doneTitle }) }}>{t.common.submit} <ArrowRight /></Button>
                </div>
              </div>
            )}
            {step === last && step > 0 && (
              <div className="relative flex flex-col items-center px-6 py-10 text-center">
                <Confetti />
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="grid size-16 place-items-center rounded-full bg-success text-white">
                  <Check className="size-8" />
                </motion.div>
                <p className="mt-5 text-lg font-bold">{t.events.doneTitle}</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t.events.doneDesc}</p>
                <Button className="mt-6" onClick={() => close(false)}>{t.common.done}</Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}


/** Decorative QR-like grid (real QR comes from VietQR in production). */
function FakeQr({ seed }: { seed: string }) {
  const n = 25
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const cells: boolean[] = []
  for (let i = 0; i < n * n; i++) {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5; h >>>= 0
    cells.push(h % 2 === 0)
  }
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7)
  return (
    <svg viewBox={`0 0 ${n} ${n}`} className="size-full" shapeRendering="crispEdges" aria-label="QR">
      {cells.map((on, i) => {
        const x = i % n, y = Math.floor(i / n)
        if (finder(x, y)) return null
        return on ? <rect key={i} x={x} y={y} width={1} height={1} fill="#08082e" /> : null
      })}
      {[[0, 0], [n - 7, 0], [0, n - 7]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x! + 0.5} y={y! + 0.5} width={6} height={6} fill="none" stroke="#08082e" strokeWidth={1} />
          <rect x={x! + 2} y={y! + 2} width={3} height={3} fill="#006699" />
        </g>
      ))}
    </svg>
  )
}

function Confetti() {
  const colors = ['#006699', '#d4af37', '#00a560', '#e11d48', '#38a8de']
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-0">
      {Array.from({ length: 28 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-24 block size-2 rounded-[2px]"
          style={{ background: colors[i % colors.length] }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: (Math.random() - 0.5) * 420, y: Math.random() * 260 - 60, opacity: 0, rotate: Math.random() * 540 }}
          transition={{ duration: 1.4 + Math.random() * 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  )
}
