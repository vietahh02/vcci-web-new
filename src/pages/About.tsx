import { Building2, Globe2, Handshake, Landmark, ShieldCheck, Users } from 'lucide-react'
import { PageHero } from '@/components/brand'
import { CountUp, ParallaxImage, Reveal, Spotlight, Stagger, StaggerItem } from '@/components/effects'
import { useI18n } from '@/lib/i18n'

export default function About() {
  const { t, lang } = useI18n()
  const vi = lang === 'vi'
  const stats = [
    { icon: Building2, to: 12400, l: t.home.stats.businesses },
    { icon: Landmark, to: 63, l: vi ? 'Tỉnh thành có mạng lưới' : 'Provinces covered' },
    { icon: Globe2, to: 40, l: t.home.stats.countries },
    { icon: Users, to: 160, l: vi ? 'Sự kiện xúc tiến / năm' : 'Promotion events / year' },
  ]
  const pillars = [
    { icon: ShieldCheck, t: vi ? 'Thẩm định & xác thực' : 'Vetting & verification', d: vi ? 'Hồ sơ doanh nghiệp, mã số thuế, giấy phép và năng lực được VCCI rà soát trước khi cấp huy hiệu.' : 'Business records, tax codes, licences and capacity are reviewed before a badge is granted.' },
    { icon: Handshake, t: vi ? 'Xúc tiến thương mại' : 'Trade promotion', d: vi ? 'Kết nối người mua qua hội chợ, livestream, webinar và mạng lưới thương vụ.' : 'Buyer matching through fairs, livestreams, webinars and trade offices.' },
    { icon: Landmark, t: vi ? 'Hỗ trợ pháp lý & chính sách' : 'Legal & policy support', d: vi ? 'Trợ lý AI và chuyên gia giúp doanh nghiệp hiểu FTA, thủ tục và quy định thị trường.' : 'AI assistant and experts help businesses navigate FTAs, procedures and market rules.' },
  ]

  return (
    <>
      <PageHero title={t.about.title} sub={t.about.sub} crumbs={[{ to: '/', label: t.common.home }, { label: t.nav.about }]} image="/imgs/card1.jpg" />
      <div className="container-page mt-12">
        <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <StaggerItem key={s.l} className="rounded-2xl border bg-card p-6">
              <s.icon className="size-6 text-gold" />
              <p className="mt-4 text-3xl font-extrabold text-primary"><CountUp to={s.to} format={(n) => Math.round(n).toLocaleString('vi-VN') + '+'} /></p>
              <p className="mt-1 text-sm text-muted-foreground">{s.l}</p>
            </StaggerItem>
          ))}
        </Stagger>
        <div className="mt-16 grid items-center gap-10 lg:grid-cols-2">
          <ParallaxImage src="/imgs/workship.jpg" alt="VCCI" className="aspect-[4/3] rounded-3xl" />
          <Reveal>
            <h2 className="text-3xl font-extrabold tracking-tight">{vi ? 'Sứ mệnh' : 'Our mission'}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {vi
                ? 'VCCI Trade Hub số hoá các hoạt động xúc tiến thương mại truyền thống của VCCI — từ danh bạ doanh nghiệp, kết nối giao thương đến hội chợ — thành một nền tảng B2B tin cậy, minh bạch và đa ngôn ngữ.'
                : "VCCI Trade Hub digitises VCCI's traditional trade promotion — from the business directory to matchmaking and trade fairs — into a trusted, transparent, multilingual B2B platform."}
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
