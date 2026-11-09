/**
 * Help, privacy and terms. Every answer restates how the platform already works (PRODUCT.md, the flows in this app);
 * nothing here invents a policy. The two legal pages say plainly that the official text is still with VCCI legal.
 */
import { Phone } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { buttonClass } from '@/components/ui/primitives'
import { CONTACT } from '@/lib/contact'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'

type Qa = { q: string; a: ReactNode }
type Topic = { id: string; title: string; items: Qa[] }

function DocPage({ title, lead, topics, note }: { title: string; lead: string; topics: Topic[]; note?: string }) {
  const { t } = useI18n()
  return (
    <div className="container-page pb-8 pt-8 md:pt-12">
      <nav aria-label={t.ui.breadcrumb} className="text-[13px] text-muted-foreground">
        <Link to="/" className="hover:text-foreground">{t.common.home}</Link> / {title}
      </nav>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-end">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">{title}</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-foreground/85">{lead}</p>
      </div>
      {note && <p className="mt-8 rounded-2xl bg-gold-soft px-5 py-4 text-[15px] leading-relaxed text-foreground">{note}</p>}

      <div className="mt-12 grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-16">
        <nav aria-label={title} className="lg:sticky lg:top-36 lg:self-start">
          <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:block lg:space-y-1 lg:px-0">
            {topics.map((tp) => (
              <li key={tp.id} className="shrink-0">
                <a href={`#${tp.id}`} className="flex min-h-11 items-center rounded-full bg-muted px-4 text-sm font-semibold transition hover:bg-primary-soft hover:text-primary lg:rounded-xl lg:bg-transparent">{tp.title}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-16">
          {topics.map((tp) => (
            <section key={tp.id} id={tp.id} className="scroll-mt-36">
              <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">{tp.title}</h2>
              <div className="mt-5 space-y-2">
                {tp.items.map((it) => (
                  <details key={it.q} className="group rounded-2xl bg-muted/60 open:bg-muted">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-[17px] font-bold [&::-webkit-details-marker]:hidden">
                      {it.q}
                      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-background text-lg leading-none transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <div className="max-w-3xl px-5 pb-5 text-base leading-relaxed text-foreground/90 [&_a]:font-semibold [&_a]:text-primary [&_a:hover]:underline [&_li]:ml-5 [&_li]:list-disc [&_ul]:mt-2 [&_ul]:space-y-1">{it.a}</div>
                  </details>
                ))}
              </div>
            </section>
          ))}
          <ContactBlock />
        </div>
      </div>
    </div>
  )
}

function ContactBlock() {
  return (
    <section id="contact" className="scroll-mt-36 rounded-3xl bg-navy p-8 text-white md:p-10">
      <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">{tx('Vẫn cần người hỗ trợ?', 'Still need a person?', '도움이 더 필요하신가요?')}</h2>
      <p className="mt-3 max-w-xl text-white/85">{tx('Chuyên viên VCCI Trade Hub trả lời qua hotline trong giờ hành chính. Khi đã đăng nhập, bạn có thể nhắn qua khung chat Hỗ trợ VCCI ở góc màn hình.', 'VCCI Trade Hub staff answer the hotline during office hours. Once signed in, you can also write to VCCI Support from the chat in the corner of the screen.', '근무 시간에는 핫라인으로 상담할 수 있으며, 로그인 후 화면 모서리의 VCCI 지원 채팅도 이용할 수 있습니다.')}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={CONTACT.hotlineHref} className={buttonClass('gold', 'lg')}><Phone /> Hotline {CONTACT.hotline}</a>
        {CONTACT.email && <a href={`mailto:${CONTACT.email}`} className={buttonClass('ghost', 'lg', 'text-white hover:bg-white/10 hover:text-white')}>{CONTACT.email}</a>}
      </div>
    </section>
  )
}

export function Help() {
  const topics: Topic[] = [
    {
      id: 'account', title: tx('Tài khoản', 'Account', '계정'), items: [
        { q: tx('Đăng ký doanh nghiệp mất bao lâu?', 'How long does company registration take?', '기업 등록은 얼마나 걸리나요?'), a: <p>{tx('Bạn khai hồ sơ trong 4 bước. Hồ sơ chuyển sang trạng thái Chờ duyệt; VCCI thẩm định trong 1–2 ngày làm việc và gửi email kích hoạt tài khoản khi hồ sơ được phê duyệt.', 'You fill in the profile in 4 steps. It moves to Pending review; VCCI checks it within 1–2 working days and emails you an activation link once it is approved.', '4단계로 프로필을 작성하면 심사 대기 상태가 되며, VCCI가 1–2 영업일 내 심사 후 승인 시 활성화 메일을 보냅니다.')} <Link to="/register">{tx('Bắt đầu đăng ký', 'Start registering', '등록 시작')}</Link></p> },
        { q: tx('Tôi quên mật khẩu', 'I forgot my password', '비밀번호를 잊었어요'), a: <p>{tx('Mở trang Đặt lại mật khẩu, nhập email đăng nhập và làm theo liên kết VCCI gửi tới hộp thư. Nếu không nhận được email, gọi hotline để được hỗ trợ khôi phục.', 'Open Reset password, enter your login email and follow the link VCCI sends you. If no email arrives, call the hotline for help recovering the account.', '비밀번호 재설정 페이지에서 로그인 이메일을 입력하고 메일의 링크를 따르세요. 메일이 오지 않으면 핫라인으로 문의하세요.')} <Link to="/forgot-password">{tx('Đặt lại mật khẩu', 'Reset password', '비밀번호 재설정')}</Link></p> },
        { q: tx('Việc gì cần đăng nhập?', 'What needs a signed-in account?', '로그인이 필요한 기능은?'), a: <p>{tx('Xem sản phẩm, doanh nghiệp, yêu cầu nhập khẩu và sự kiện không cần đăng nhập. Gửi yêu cầu báo giá, gửi báo giá, nhắn tin và đăng ký sự kiện thì cần. Khi chưa đăng nhập, khung chat livestream chỉ đọc.', 'Browsing products, companies, import requests and events needs no account. Sending an RFQ or a quote, messaging and registering for events do. Signed out, livestream chat is read-only.', '상품·기업·수입 요청·행사 열람은 로그인이 필요 없지만, 견적 요청·견적 발송·메시지·행사 신청은 로그인이 필요합니다.')}</p> },
      ],
    },
    {
      id: 'buying', title: tx('Tìm nguồn hàng', 'Sourcing', '소싱'), items: [
        { q: tx('Gửi yêu cầu báo giá (RFQ) thế nào?', 'How do I send an RFQ?', '견적 요청은 어떻게 보내나요?'), a: <p>{tx('Trên trang sản phẩm, bấm Gửi yêu cầu báo giá, nhập số lượng, cảng nhận hàng và quy cách. Yêu cầu được gửi tới email của nhà cung cấp. Nếu bạn chưa đăng nhập, nội dung đã nhập được giữ lại và mở lại sau khi đăng nhập.', 'On a product page, press Send RFQ and enter quantity, destination port and specs. The request goes to the supplier by email. If you are not signed in, what you typed is kept and reopened after you sign in.', '상품 페이지에서 견적 요청을 누르고 수량·도착 항구·사양을 입력하면 공급업체 이메일로 전달됩니다. 로그인 전 입력한 내용은 로그인 후 다시 열립니다.')}</p> },
        { q: tx('Đăng nhu cầu nhập khẩu', 'Posting an import request', '수입 요청 등록'), a: <p>{tx('Mô tả hàng cần mua, số lượng và thị trường. Nhà cung cấp xác thực xem yêu cầu và gửi báo giá qua email.', 'Describe the goods, quantity and market. Verified suppliers see the request and send quotes by email.', '필요한 상품·수량·시장을 적으면 인증 공급업체가 이메일로 견적을 보냅니다.')} <Link to="/requests?post=1">{tx('Đăng yêu cầu', 'Post a request', '요청 등록')}</Link></p> },
        { q: tx('Huy hiệu Xác thực VCCI nghĩa là gì?', 'What does VCCI Verified mean?', 'VCCI 인증은 무엇을 의미하나요?'), a: <><p>{tx('Huy hiệu do chính VCCI cấp sau khi rà soát hồ sơ doanh nghiệp, gồm:', 'VCCI itself grants the badge after reviewing the company file, including:', 'VCCI가 기업 서류를 심사한 후 직접 부여하며, 다음을 확인합니다:')}</p><ul><li>{tx('Mã số thuế khớp Giấy chứng nhận đăng ký doanh nghiệp', 'Tax code matches the business registration certificate', '사업자 번호와 등록증 일치')}</li><li>{tx('Tên, địa chỉ trụ sở và người đại diện theo pháp luật', 'Name, registered address and legal representative', '상호·본사 주소·법정 대표자')}</li><li>{tx('Ngành nghề kinh doanh và tình trạng hoạt động', 'Business lines and operating status', '업종 및 영업 상태')}</li></ul><p className="mt-2">{tx('Huy hiệu không bảo đảm chất lượng từng lô hàng; điều kiện mua bán do hai bên thoả thuận.', 'The badge does not guarantee any single shipment; trade terms are agreed between the two parties.', '배지는 개별 선적의 품질을 보증하지 않으며 거래 조건은 당사자 간에 합의합니다.')}</p></> },
      ],
    },
    {
      id: 'selling', title: tx('Bán hàng', 'Selling', '판매'), items: [
        { q: tx('Vì sao sản phẩm tôi vừa đăng chưa hiện?', 'Why is my new product not visible yet?', '등록한 상품이 왜 보이지 않나요?'), a: <p>{tx('Sản phẩm mới hoặc vừa sửa được ẩn cho đến khi VCCI duyệt. Trạng thái Chờ duyệt hiện trong mục Quản lý sản phẩm của bạn.', 'New or edited products stay hidden until VCCI approves them. You can see the Pending status in your product catalogue.', '새로 등록하거나 수정한 상품은 VCCI 승인 전까지 숨겨지며, 상품 관리에서 대기 상태를 볼 수 있습니다.')}</p> },
        { q: tx('Gửi báo giá cho yêu cầu nhập khẩu', 'Quoting on an import request', '수입 요청에 견적 보내기'), a: <p>{tx('Mở yêu cầu, bấm Gửi báo giá và ghi giá FOB, thời gian giao, điều kiện thanh toán, hiệu lực báo giá. Báo giá được gửi tới người mua qua email.', 'Open the request, press Send quote and give the FOB price, lead time, payment terms and validity. The quote reaches the buyer by email.', '요청을 열고 견적 보내기를 눌러 FOB 가격·납기·결제 조건·유효기간을 입력하면 이메일로 전달됩니다.')} <Link to="/requests">{tx('Xem yêu cầu nhập khẩu', 'See import requests', '수입 요청 보기')}</Link></p> },
      ],
    },
    {
      id: 'events', title: tx('Sự kiện', 'Events', '행사'), items: [
        { q: tx('Thanh toán phí tham dự thế nào?', 'How do I pay an event fee?', '참가비는 어떻게 결제하나요?'), a: <p>{tx('Sự kiện có phí thanh toán bằng chuyển khoản hoặc mã QR, kèm ảnh biên lai. Ban tổ chức đối soát và xác nhận; thẻ tham dự được cấp sau khi xác nhận.', 'Paid events are paid by bank transfer or QR code with a photo of the receipt. The organisers reconcile and confirm it; your pass is issued after confirmation.', '유료 행사는 계좌이체 또는 QR로 결제하고 영수증을 첨부합니다. 주최 측이 확인한 후 참가증이 발급됩니다.')}</p> },
        { q: tx('Khi nào nút Xem trực tiếp xuất hiện?', 'When does the Watch live button appear?', '라이브 시청 버튼은 언제 나타나나요?'), a: <p>{tx('Trạng thái sự kiện tính theo giờ GMT+7 tại lúc bạn xem. Nút Xem trực tiếp hiện khi phiên đang diễn ra.', 'Event status is worked out in GMT+7 at the moment you look. The Watch live button appears while the session is on.', '행사 상태는 조회 시점의 GMT+7 기준으로 계산되며, 진행 중일 때 라이브 시청 버튼이 나타납니다.')} <Link to="/events">{tx('Lịch sự kiện', 'Event calendar', '행사 일정')}</Link></p> },
      ],
    },
    {
      id: 'terms', title: tx('Thuật ngữ', 'Glossary', '용어'), items: [
        { q: 'MOQ', a: <p>{tx('Số lượng đặt hàng tối thiểu nhà cung cấp nhận cho một đơn.', 'Minimum order quantity: the smallest order the supplier accepts.', '최소 주문 수량.')}</p> },
        { q: tx('Giá FOB và CIF', 'FOB and CIF prices', 'FOB·CIF 가격'), a: <p>{tx('FOB: giá giao hàng lên tàu tại cảng xuất, người mua lo cước và bảo hiểm. CIF: giá đã gồm cước vận chuyển và bảo hiểm tới cảng đích. Giá trên trang là giá tham khảo.', 'FOB: price with goods loaded at the port of export; the buyer pays freight and insurance. CIF: price including freight and insurance to the destination port. Prices shown are indicative.', 'FOB: 수출항 본선 인도 가격(운임·보험은 구매자 부담). CIF: 도착항까지 운임·보험 포함 가격. 표시 가격은 참고용입니다.')}</p> },
        { q: tx('T/T 30/70', 'T/T 30/70', 'T/T 30/70'), a: <p>{tx('Cách ghi điều kiện thanh toán bằng chuyển khoản theo tỉ lệ đặt cọc/phần còn lại. Điều khoản cụ thể do nhà cung cấp xác nhận trong báo giá.', 'A way of writing bank-transfer payment terms as deposit/balance shares. The exact terms are confirmed by the supplier in the quote.', '선금/잔금 비율로 표기한 송금 결제 조건입니다. 정확한 조건은 견적에서 공급업체가 확인합니다.')}</p> },
      ],
    },
  ]
  return <DocPage title={tx('Trợ giúp', 'Help', '도움말')} lead={tx('Câu trả lời theo việc bạn đang làm: tài khoản, tìm nguồn hàng, bán hàng và sự kiện.', 'Answers sorted by what you are doing: your account, sourcing, selling and events.', '계정·소싱·판매·행사 등 하려는 일별로 정리한 답변입니다.')} topics={topics} />
}

const DRAFT_NOTE = () => tx('Đây là bản tóm tắt cách nền tảng đang xử lý thông tin. Văn bản chính thức đang được bộ phận pháp chế VCCI hoàn thiện và sẽ thay thế trang này khi ban hành.', 'This is a summary of how the platform handles information today. The official text is being finalised by VCCI legal and will replace this page once issued.', '현재 플랫폼의 정보 처리 방식을 요약한 것입니다. 공식 문서는 VCCI 법무팀이 마련 중이며 발행 시 이 페이지를 대체합니다.')

export function Privacy() {
  const topics: Topic[] = [
    {
      id: 'collect', title: tx('Thông tin được thu thập', 'What is collected', '수집하는 정보'), items: [
        { q: tx('Hồ sơ doanh nghiệp', 'Company profile', '기업 프로필'), a: <p>{tx('Thông tin bạn khai khi đăng ký và hoàn thiện hồ sơ năng lực: tên, mã số thuế, địa chỉ, người liên hệ, lãnh đạo chủ chốt, sản phẩm và giấy tờ pháp lý.', 'What you enter when registering and completing your capability profile: name, tax code, address, contacts, key leaders, products and legal documents.', '등록 및 역량 프로필 작성 시 입력한 상호·사업자번호·주소·담당자·주요 경영진·상품·법적 서류.')}</p> },
        { q: tx('Hoạt động trên nền tảng', 'Activity on the platform', '플랫폼 활동'), a: <p>{tx('Yêu cầu báo giá, báo giá, tin nhắn và đăng ký sự kiện bạn gửi qua nền tảng.', 'The RFQs, quotes, messages and event registrations you send through the platform.', '플랫폼을 통해 보낸 견적 요청·견적·메시지·행사 신청.')}</p> },
      ],
    },
    {
      id: 'use', title: tx('Cách sử dụng và chia sẻ', 'How it is used and shared', '이용 및 공유'), items: [
        { q: tx('Ai thấy thông tin của tôi?', 'Who sees my information?', '누가 내 정보를 보나요?'), a: <ul><li>{tx('Hồ sơ công khai và sản phẩm đã duyệt: mọi người truy cập.', 'Public profile and approved products: every visitor.', '공개 프로필과 승인된 상품: 모든 방문자.')}</li><li>{tx('Chứng từ doanh thu: chỉ VCCI xem, không công khai.', 'Revenue evidence: VCCI only, never public.', '매출 증빙: VCCI만 열람, 비공개.')}</li><li>{tx('Yêu cầu báo giá và tin nhắn: bạn và doanh nghiệp nhận.', 'RFQs and messages: you and the receiving company.', '견적 요청·메시지: 본인과 수신 기업.')}</li></ul> },
        { q: tx('Căn cứ xử lý', 'Legal basis', '처리 근거'), a: <p>{tx('Dữ liệu cá nhân và dữ liệu doanh nghiệp được xử lý theo Luật Bảo vệ dữ liệu cá nhân, với sự đồng ý rõ ràng của bạn khi đăng ký.', 'Personal and company data are processed under Vietnam’s Personal Data Protection Law, with your explicit consent at registration.', '개인 및 기업 데이터는 베트남 개인정보보호법에 따라 등록 시 명시적 동의를 받아 처리됩니다.')}</p> },
      ],
    },
    {
      id: 'rights', title: tx('Quyền của bạn', 'Your rights', '이용자 권리'), items: [
        { q: tx('Sửa hoặc yêu cầu xoá thông tin', 'Correcting or deleting information', '정보 수정·삭제 요청'), a: <p>{tx('Bạn sửa hồ sơ trong mục Hồ sơ doanh nghiệp. Để rút lại đồng ý hoặc yêu cầu xoá dữ liệu, liên hệ VCCI qua hotline.', 'Edit your profile under Company profile. To withdraw consent or ask for deletion, contact VCCI on the hotline.', '기업 프로필에서 수정할 수 있으며, 동의 철회나 삭제는 핫라인으로 요청하세요.')}</p> },
      ],
    },
  ]
  return <DocPage title={tx('Chính sách bảo mật', 'Privacy policy', '개인정보처리방침')} lead={tx('VCCI Trade Hub thu thập gì, ai được xem và bạn kiểm soát thông tin của mình ra sao.', 'What VCCI Trade Hub collects, who can see it and how you stay in control.', 'VCCI Trade Hub가 무엇을 수집하고 누가 보며 어떻게 통제할 수 있는지 안내합니다.')} note={DRAFT_NOTE()} topics={topics} />
}

export function Terms() {
  const topics: Topic[] = [
    {
      id: 'platform', title: tx('Về nền tảng', 'About the platform', '플랫폼 소개'), items: [
        { q: tx('VCCI Trade Hub làm gì?', 'What does VCCI Trade Hub do?', 'VCCI Trade Hub는 무엇을 하나요?'), a: <p>{tx('Kết nối doanh nghiệp: danh bạ, sản phẩm, yêu cầu báo giá, yêu cầu nhập khẩu và sự kiện xúc tiến. Nền tảng không có giỏ hàng hay thanh toán đơn hàng; giao dịch mua bán do hai doanh nghiệp thoả thuận trực tiếp.', 'It connects companies: directory, products, RFQs, import requests and promotion events. There is no cart or order payment; trade deals are agreed directly between the two companies.', '디렉터리·상품·견적 요청·수입 요청·행사를 통해 기업을 연결합니다. 장바구니나 주문 결제는 없으며 거래는 당사자 간에 직접 합의합니다.')}</p> },
        { q: tx('Giá trên trang', 'Prices on the site', '표시 가격'), a: <p>{tx('Giá FOB/CIF là giá tham khảo, thay đổi theo số lượng và điều kiện giao hàng. Giá chính thức là giá trong báo giá của nhà cung cấp.', 'FOB/CIF prices are indicative and vary with quantity and delivery terms. The binding price is the one in the supplier’s quote.', 'FOB/CIF는 참고 가격이며 수량과 인도 조건에 따라 달라집니다. 확정 가격은 공급업체 견적을 따릅니다.')}</p> },
      ],
    },
    {
      id: 'content', title: tx('Nội dung và kiểm duyệt', 'Content and review', '콘텐츠 심사'), items: [
        { q: tx('Nội dung nào được VCCI duyệt?', 'What does VCCI review?', 'VCCI는 무엇을 심사하나요?'), a: <p>{tx('Đăng ký doanh nghiệp, huy hiệu Xác thực VCCI và sản phẩm đều được VCCI duyệt trước khi hiển thị. Doanh nghiệp chịu trách nhiệm về tính chính xác của thông tin mình khai.', 'Company registrations, the VCCI Verified badge and products are all reviewed by VCCI before they appear. Each company is responsible for the accuracy of what it declares.', '기업 등록·VCCI 인증 배지·상품은 게시 전 VCCI가 심사합니다. 입력 정보의 정확성은 각 기업의 책임입니다.')}</p> },
        { q: tx('Sự kiện có phí', 'Paid events', '유료 행사'), a: <p>{tx('Phí tham dự thanh toán bằng chuyển khoản hoặc QR kèm biên lai; Ban tổ chức đối soát trước khi cấp thẻ tham dự.', 'Event fees are paid by transfer or QR with a receipt; the organisers reconcile before issuing the pass.', '참가비는 영수증과 함께 이체 또는 QR로 결제하며, 주최 측 확인 후 참가증이 발급됩니다.')}</p> },
      ],
    },
  ]
  return <DocPage title={tx('Điều khoản sử dụng', 'Terms of use', '이용약관')} lead={tx('Nền tảng làm gì, nội dung nào được VCCI duyệt và trách nhiệm của mỗi bên.', 'What the platform does, what VCCI reviews and who is responsible for what.', '플랫폼의 역할, VCCI 심사 범위, 각 당사자의 책임을 안내합니다.')} note={DRAFT_NOTE()} topics={topics} />
}
