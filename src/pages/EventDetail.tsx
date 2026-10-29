import { motion } from 'motion/react'
import { Building2, CalendarDays, Check, Clock, MapPin, PlayCircle, Radio, Rocket, Ticket, Users, Video } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getEvent } from '@/api'
import { events, type EventItem } from '@/data/mock'
import { getProgramme } from '@/data/schedules'
import { SectionHeader } from '@/components/brand'
import { SponsorVerticalBanner } from '@/components/sponsor'
import { ScheduleGrid } from '@/components/event/ScheduleGrid'
import { EventCard } from '@/components/cards'
import { Countdown, LiveDot, Reveal } from '@/components/effects'
import { Badge, Button, buttonClass, Progress } from '@/components/ui/primitives'
import NotFound from '@/pages/NotFound'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'
import { formatDate, formatMoney, formatNumber, img } from '@/lib/utils'

export default function EventDetail() {
  const { id = '' } = useParams()
  const { t, L, locale } = useI18n()
  const ev = getEvent(id)
  if (!ev) return <NotFound />
  const programme = getProgramme(ev.id)
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
              {programme?.phases.map((p) => <Badge key={p.id} variant="outline" className="border-gold-bright/40 text-gold-bright">{L(p.name)} · {L(p.theme)}</Badge>)}
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-balance md:text-5xl">{L(ev.title)}</h1>
            <p className="mt-4 max-w-2xl text-white/75 md:text-lg">{L(ev.introduction)}</p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-4 text-gold-bright" />
                {formatDate(ev.startDate, locale, { day: '2-digit', month: 'long', year: 'numeric' })}
                {ev.endDate.slice(0, 10) !== ev.startDate.slice(0, 10) && ` – ${formatDate(ev.endDate, locale, { day: '2-digit', month: 'long', year: 'numeric' })}`}
              </span>
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
              <Link to={`/events/${ev.id}/register`} className={buttonClass('gold', 'lg', 'mt-6 w-full')}><Ticket /> {t.events.register}</Link>
            )}
            <p className="mt-4 flex items-center gap-2 text-xs text-white/60"><Building2 className="size-3.5" /> {t.events.organizer}: {L(ev.organizedBy)}</p>
          </Reveal>
        </div>
      </section>

      {programme && (
        <>
          <div className="border-b bg-gold-soft/50">
            <div className="container-page flex flex-wrap items-center justify-between gap-3 py-4">
              <p className="flex items-center gap-2.5 text-sm">
                <Rocket className="size-5 text-gold" />
                <span className="font-semibold">{tx('Ra mắt sản phẩm mới', 'New Product Launch', '신제품 런칭')}</span>
                <span className="text-muted-foreground">· {L(programme.launchZone)}</span>
              </p>
              {ev.eventStatus === 'UPCOMING' && (
                <Link to={`/events/${ev.id}/register`} className={buttonClass('default', 'sm')}>{tx('Đăng ký tham quan', 'Register to visit', '참관 등록')}</Link>
              )}
            </div>
          </div>
          <div className="container-page mt-12">
            <ScheduleGrid programme={programme} />
          </div>
        </>
      )}

      {(!programme || hasProgramInfo(ev)) && (
      <div className="container-page mt-14 grid gap-10 lg:grid-cols-[1fr_380px]">
        <section>
          <ProgramInfo ev={ev} />
          {!programme && (
            <>
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
                    {a.speaker && <p className="mt-1 text-sm text-muted-foreground">{L(a.speaker)}</p>}
                  </motion.li>
                ))}
              </ol>
            </>
          )}
        </section>
        <aside className="space-y-4">
          <SponsorVerticalBanner className="lg:sticky lg:top-32" />
        </aside>
      </div>
      )}

      {others.length > 0 && (
        <section className="container-page mt-16">
          <SectionHeader title={t.home.eventsTitle} action={{ to: '/events', label: t.common.viewAll }} />
          <div className="grid gap-5 md:grid-cols-3">{others.map((e) => <EventCard key={e.id} event={e} />)}</div>
        </section>
      )}
    </>
  )
}

const hasProgramInfo = (ev: EventItem) => !!(ev.series || ev.partner || ev.targetMarket || ev.registrationDeadline || ev.quota || ev.speakers || ev.eligibility || ev.topics || ev.contact)

/** B2B programme details sourced from VCCI event forms: series, partner, market, eligibility, deadline, speakers, contact. */
function ProgramInfo({ ev }: { ev: EventItem }) {
  const { L, locale } = useI18n()
  const facts = [
    ev.series && { k: tx('Chuỗi chương trình', 'Series', '프로그램 시리즈'), v: L(ev.series) },
    ev.partner && { k: tx('Đơn vị phối hợp', 'In partnership with', '협력 기관'), v: L(ev.partner) },
    ev.targetMarket && { k: tx('Thị trường mục tiêu', 'Target market', '목표 시장'), v: L(ev.targetMarket) },
    ev.registrationDeadline && { k: tx('Hạn đăng ký', 'Registration deadline', '신청 마감'), v: `${formatDate(ev.registrationDeadline, locale)} ${tx('(đóng sớm khi đủ chỉ tiêu)', '(may close early)', '(정원 마감 시 조기 종료)')}` },
    ev.quota && { k: tx('Chỉ tiêu', 'Quota', '모집 정원'), v: `${formatNumber(ev.quota, locale)} ${tx('doanh nghiệp', 'companies', '개사')}` },
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
          <h2 className="text-xl font-extrabold">{tx('Đối tượng & tiêu chí tham gia', 'Who should apply', '참가 대상 및 기준')}</h2>
          <ul className="mt-4 space-y-2.5">
            {ev.eligibility.map((e) => <li key={e.en} className="flex gap-2.5 text-[15px]"><Check className="mt-0.5 size-4 shrink-0 text-success" /> {L(e)}</li>)}
          </ul>
        </div>
      )}
      {ev.topics && (
        <div>
          <h2 className="text-xl font-extrabold">{tx('Nội dung chính', 'Key topics', '주요 내용')}</h2>
          <ul className="mt-4 space-y-2.5">
            {ev.topics.map((e) => <li key={e.en} className="flex gap-2.5 text-[15px]"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" /> {L(e)}</li>)}
          </ul>
        </div>
      )}
      {ev.speakers && (
        <div>
          <h2 className="text-xl font-extrabold">{tx('Diễn giả', 'Speakers', '연사')}</h2>
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
          <p className="font-semibold">{tx('Thông tin liên hệ', 'Contact', '문의처')}</p>
          <p className="mt-1.5 text-muted-foreground">{ev.contact.name} · {tx('ĐT/Zalo', 'Phone/Zalo', '전화/Zalo')}: {ev.contact.phone} · {ev.contact.email}</p>
        </div>
      )}
    </div>
  )
}
