import { Building2, Globe2, Handshake, Landmark, ShieldCheck, Users } from 'lucide-react'
import { PageHero } from '@/components/brand'
import { CountUp, ParallaxImage, Reveal, Spotlight, Stagger, StaggerItem } from '@/components/effects'
import { useI18n } from '@/lib/i18n'

export default function About() {
  const { t, L, locale } = useI18n()
  const stats = [
    { icon: Building2, to: 12400, l: t.home.stats.businesses },
    { icon: Landmark, to: 63, l: L({ vi: 'Tỉnh thành có mạng lưới', en: 'Provinces covered', ko: '네트워크를 갖춘 성·시' }) },
    { icon: Globe2, to: 40, l: t.home.stats.countries },
    { icon: Users, to: 160, l: L({ vi: 'Sự kiện xúc tiến / năm', en: 'Promotion events / year', ko: '연간 무역 진흥 행사' }) },
  ]
  const pillars = [
    { icon: ShieldCheck, t: L({ vi: 'Thẩm định & xác thực', en: 'Vetting & verification', ko: '심사 & 인증' }), d: L({ vi: 'Hồ sơ doanh nghiệp, mã số thuế, giấy phép và năng lực được VCCI rà soát trước khi cấp huy hiệu.', en: 'Business records, tax codes, licences and capacity are reviewed before a badge is granted.', ko: '배지 발급 전 기업 정보, 사업자 번호, 인허가 및 역량을 VCCI가 검토합니다.' }) },
    { icon: Handshake, t: L({ vi: 'Xúc tiến thương mại', en: 'Trade promotion', ko: '무역 진흥' }), d: L({ vi: 'Kết nối người mua qua hội chợ, livestream, webinar và mạng lưới thương vụ.', en: 'Buyer matching through fairs, livestreams, webinars and trade offices.', ko: '박람회, 라이브 방송, 웨비나 및 무역관 네트워크를 통해 바이어와 연결합니다.' }) },
    { icon: Landmark, t: L({ vi: 'Hỗ trợ pháp lý & chính sách', en: 'Legal & policy support', ko: '법률 & 정책 지원' }), d: L({ vi: 'Trợ lý AI và chuyên gia giúp doanh nghiệp hiểu FTA, thủ tục và quy định thị trường.', en: 'AI assistant and experts help businesses navigate FTAs, procedures and market rules.', ko: 'AI 도우미와 전문가가 FTA, 절차, 시장 규정 이해를 돕습니다.' }) },
  ]

  return (
    <>
      <PageHero title={t.about.title} sub={t.about.sub} crumbs={[{ to: '/', label: t.common.home }, { label: t.nav.about }]} image="/imgs/card1.jpg" />
      <div className="container-page mt-12">
        <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <StaggerItem key={s.l} className="rounded-2xl border bg-card p-6">
              <s.icon className="size-6 text-gold" />
              <p className="mt-4 text-3xl font-extrabold text-primary"><CountUp to={s.to} format={(n) => Math.round(n).toLocaleString(locale) + '+'} /></p>
              <p className="mt-1 text-sm text-muted-foreground">{s.l}</p>
            </StaggerItem>
          ))}
        </Stagger>
        <div className="mt-16 grid items-center gap-10 lg:grid-cols-2">
          <ParallaxImage src="/imgs/workship.jpg" alt="VCCI" className="aspect-[4/3] rounded-3xl" />
          <Reveal>
            <h2 className="text-3xl font-extrabold tracking-tight">{L({ vi: 'Sứ mệnh', en: 'Our mission', ko: '우리의 사명' })}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {L({ vi: 'VCCI Trade Hub số hoá các hoạt động xúc tiến thương mại truyền thống của VCCI — từ danh bạ doanh nghiệp, kết nối giao thương đến hội chợ — thành một nền tảng B2B tin cậy, minh bạch và đa ngôn ngữ.', en: "VCCI Trade Hub digitises VCCI's traditional trade promotion — from the business directory to matchmaking and trade fairs — into a trusted, transparent, multilingual B2B platform.", ko: 'VCCI Trade Hub는 기업 디렉터리부터 비즈니스 매칭, 박람회까지 VCCI의 전통적인 무역 진흥 활동을 신뢰할 수 있고 투명한 다국어 B2B 플랫폼으로 디지털화합니다.' })}
            </p>
            <div className="mt-8 space-y-4">
              {pillars.map((p) => (
                <Spotlight key={p.t} className="rounded-2xl border p-5">
                  <div className="relative flex gap-4">
                    <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><p.icon className="size-5" /></div>
                    <div>
                      <p className="font-bold">{p.t}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{p.d}</p>
                    </div>
                  </div>
                </Spotlight>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </>
  )
}
