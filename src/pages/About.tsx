import { Building2, Globe2, Handshake, Landmark, Package, ShieldCheck } from 'lucide-react'
import { PageHero } from '@/components/PageHero'
import { CountUp, Reveal } from '@/components/effects'
import { useHomeStats } from '@/api'
import { useI18n } from '@/lib/i18n'

export default function About() {
  const { t, L, locale } = useI18n()
  const st = useHomeStats().data
  // only figures with a live source (the same home stats API); unverified hard-coded counts were removed
  const stats = [
    { icon: Building2, to: st?.businesses ?? 0, l: t.home.stats.businesses },
    { icon: Package, to: st?.products ?? 0, l: t.home.stats.products },
    { icon: Globe2, to: st?.countries ?? 0, l: t.home.stats.countries },
  ].filter((s) => s.to > 0)
  const pillars = [
    { icon: ShieldCheck, t: L({ vi: 'Thẩm định & xác thực', en: 'Vetting & verification', ko: '심사 & 인증' }), d: L({ vi: 'Hồ sơ doanh nghiệp, mã số thuế, giấy phép và năng lực được VCCI rà soát trước khi cấp huy hiệu.', en: 'Business records, tax codes, licences and capacity are reviewed before a badge is granted.', ko: '배지 발급 전 기업 정보, 사업자 번호, 인허가 및 역량을 VCCI가 검토합니다.' }) },
    { icon: Handshake, t: L({ vi: 'Xúc tiến thương mại', en: 'Trade promotion', ko: '무역 진흥' }), d: L({ vi: 'Kết nối người mua qua hội chợ, livestream, webinar và mạng lưới thương vụ.', en: 'Buyer matching through fairs, livestreams, webinars and trade offices.', ko: '박람회, 라이브 방송, 웨비나 및 무역관 네트워크를 통해 바이어와 연결합니다.' }) },
    { icon: Landmark, t: L({ vi: 'Hỗ trợ pháp lý & chính sách', en: 'Legal & policy support', ko: '법률 & 정책 지원' }), d: L({ vi: 'Chuyên gia VCCI giúp doanh nghiệp hiểu FTA, thủ tục và quy định thị trường.', en: 'VCCI experts help businesses navigate FTAs, procedures and market rules.', ko: 'VCCI 전문가가 FTA, 절차, 시장 규정 이해를 돕습니다.' }) },
  ]

  return (
    <>
      {/* the figures sit in one card straddling the hero's bottom edge (the same slot the tab bar uses on the list pages) */}
      <PageHero
        tone="pearl"
        crumbs={[{ label: t.common.home, to: '/' }, { label: t.nav.about }]}
        title={t.about.title}
        subtitle={t.about.sub}
        tabs={stats.length > 0 ? (
          <dl className="grid divide-y rounded-2xl bg-card shadow-[0_12px_32px_-14px_rgba(8,8,46,0.4)] ring-1 ring-black/5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:ring-white/10">
            {stats.map((s) => (
              <div key={s.l} className="flex items-center gap-4 p-5 md:p-6">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><s.icon className="size-6" /></span>
                <div className="min-w-0">
                  <dd className="text-3xl font-extrabold leading-none tracking-tight text-primary"><CountUp to={s.to} format={(n) => Math.round(n).toLocaleString(locale) + '+'} /></dd>
                  <dt className="mt-1.5 text-sm text-muted-foreground">{s.l}</dt>
                </div>
              </div>
            ))}
          </dl>
        ) : undefined}
      />

      <div className="container-page mt-6 md:mt-10">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* a soft tilted block behind the photo gives the frame some depth */}
          <div className="relative">
            <div aria-hidden className="absolute -inset-3 -z-10 rotate-2 rounded-[2rem] bg-gradient-to-br from-primary-soft via-[#e6f2f8] to-[#fdf1d6] dark:from-primary-soft dark:via-[#10304a] dark:to-[#2a2418]" />
            {/* a plain image: the scroll-driven parallax made this frame stutter while scrolling, so the only motion left is a CSS hover zoom */}
            <div className="group aspect-[4/3] overflow-hidden rounded-3xl bg-muted shadow-[0_30px_60px_-30px_rgba(8,8,46,0.45)]">
              <img src="/imgs/workship.jpg" alt="VCCI" width={1066} height={600} loading="lazy" decoding="async" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
          </div>
          <Reveal>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">{L({ vi: 'Sứ mệnh', en: 'Our mission', ko: '우리의 사명' })}</h2>
            <span aria-hidden className="mt-2 block h-1 w-14 rounded-full bg-gradient-to-r from-[#1a8cc4] to-gold-bright" />
            <p className="mt-5 text-base leading-relaxed text-foreground/85 md:text-lg">
              {L({ vi: 'VCCI Trade Hub số hoá các hoạt động xúc tiến thương mại truyền thống của VCCI — từ danh bạ doanh nghiệp, kết nối giao thương đến hội chợ — thành một nền tảng B2B tin cậy, minh bạch và đa ngôn ngữ.', en: "VCCI Trade Hub digitises VCCI's traditional trade promotion — from the business directory to matchmaking and trade fairs — into a trusted, transparent, multilingual B2B platform.", ko: 'VCCI Trade Hub는 기업 디렉터리부터 비즈니스 매칭, 박람회까지 VCCI의 전통적인 무역 진흥 활동을 신뢰할 수 있고 투명한 다국어 B2B 플랫폼으로 디지털화합니다.' })}
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {pillars.map((p, i) => (
            <Reveal key={p.t} delay={i * 0.08}>
              <div className="group h-full rounded-3xl border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-28px_rgba(0,102,153,0.5)]">
                <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#1a8cc4] to-primary text-white shadow-md shadow-primary/30"><p.icon className="size-6" /></div>
                <p className="mt-5 text-lg font-bold">{p.t}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-foreground/80">{p.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="h-16" />
    </>
  )
}
