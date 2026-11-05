/**
 * UI strings for the Show Hub event type (vi/en/ko). Kept next to the feature, not in the global dict.
 * The base wording is for OFFLINE/HYBRID shows. An ONLINE show has no visit, ticket, booth or venue, so its overlay replaces those words;
 * which one applies is decided per show from its format (ShowFormatContext inside a show page).
 */
import { createContext, useContext } from 'react'
import { isOnlineFormat } from '@/lib/eventStatus'
import { useI18n } from '@/lib/i18n'

const vi = {
  online: 'Chỉ tổ chức trực tuyến',
  onlineFirst: 'Ưu tiên trực tuyến', physicalVenue: 'Địa điểm phụ',
  label: { LIVE: 'Đang phát trực tiếp', ONGOING: 'Đang diễn ra', CANCELED: 'Đã huỷ', REPLAY: 'Có xem lại', ENDED: 'Đã kết thúc', FULL: 'Hết chỗ', REG_OPEN: 'Đang mở đăng ký', REG_NOT_OPEN: 'Chưa mở đăng ký', REG_CLOSED: 'Đã đóng đăng ký', UPCOMING: 'Sắp diễn ra' },
  direction: { EXPORT: 'Show xuất khẩu · mời bên bán trong nước', IMPORT: 'Show nhập khẩu · dành cho người mua nước ngoài' },
  tabs: { overview: 'Tổng quan', booths: 'Gian ảo', products: 'Sản phẩm', launches: 'Ra mắt sản phẩm', agenda: 'Chương trình', speakers: 'Diễn giả' },
  stats: { booths: 'Gian ảo', products: 'Sản phẩm', sessions: 'Phiên', badges: 'Thẻ đã cấp' },
  badgeLabel: 'E-badge', registerVisit: 'Đăng ký tham quan', myBadge: 'Thẻ tham dự của tôi', badgeIssued: 'Đã cấp thẻ', badgePendingPay: 'Chờ xác nhận biên lai', badgePendingApprove: 'Chờ BTC duyệt',
  closedReg: 'Đăng ký tham quan đã đóng', canceledReg: 'Show đã huỷ',
  fee: 'Vé tham quan', regDeadline: 'Hạn đăng ký', virtualVenue: 'Địa điểm (không gian ảo)', organizer: 'Đơn vị tổ chức', contact: 'Liên hệ BTC',
  needApproval: 'BTC duyệt khách trước khi cấp thẻ', ticketFree: 'Miễn phí',
  rulesTitle: 'Quy định tham quan', phasesTitle: 'Các kỳ của show', pavTitle: 'Khu trưng bày ảo', markets: 'Thị trường mục tiêu', industries: 'Ngành hàng',
  sellerSide: 'Bên bán', supportSide: 'Dịch vụ hỗ trợ', buyerHint: 'Bên mua tham quan, hỏi giá và đặt chỗ phiên.',
  filterPhase: 'Kỳ', filterPav: 'Khu', all: 'Tất cả', search: 'Tìm gian, doanh nghiệp, sản phẩm…',
  visitBooth: 'Vào gian', booth: 'Gian', products: 'Sản phẩm trưng bày', featured: 'Nổi bật', moq: 'MOQ', priceOnRequest: 'Giá theo yêu cầu', askPrice: 'Hỏi giá', viewProduct: 'Xem trang sản phẩm', viewCompany: 'Hồ sơ doanh nghiệp',
  inquiryTitle: 'Hỏi giá gian', inquiryNeedBadge: 'Cần thẻ tham dự hợp lệ để hỏi giá.', inquiryProduct: 'Sản phẩm quan tâm', inquiryQty: 'Số lượng dự kiến', inquiryMsg: 'Nội dung', inquiryMsgPh: 'Yêu cầu chất lượng, điều khoản giao hàng, thị trường đích…', inquirySend: 'Gửi yêu cầu', inquirySent: 'Đã gửi yêu cầu hỏi giá', inquirySentDesc: 'Nhà trưng bày sẽ phản hồi qua email của bạn.', inquiryDaily: 'Tối đa 20 yêu cầu mỗi ngày.',
  launchTitle: 'Lịch ra mắt sản phẩm trên sân khấu ảo', launchSub: 'Chỉ hiển thị khung giờ đã được BTC xác nhận. Mỗi sân khấu một khung giờ, không trùng lịch.', follow: 'Theo dõi', following: 'Đang theo dõi', followDesc: 'Bạn sẽ nhận nhắc lịch 15 phút trước giờ ra mắt.', followers: 'người theo dõi', stage: 'Sân khấu',
  sessionsTitle: 'Chương trình hội thảo trực tuyến', room: 'Phòng ảo', seats: 'chỗ', left: 'còn', waitlist: 'Hàng chờ',
  kind: { SEMINAR: 'Hội thảo', LAUNCH: 'Ra mắt SP', MATCHMAKING: 'Kết nối 1-1' },
  sessionStatus: { PUBLISHED: 'Sắp diễn ra', LIVE: 'Đang phát', ENDED: 'Đã kết thúc', CANCELED: 'Đã huỷ' },
  book: 'Đặt chỗ', joinWaitlist: 'Vào hàng chờ', cancelBooking: 'Huỷ đặt chỗ', booked: 'Đã đặt chỗ', onWaitlist: 'Trong hàng chờ', joinLive: 'Vào phiên trực tiếp', watchReplay: 'Xem lại', needBadgeBook: 'Đăng ký tham quan để đặt chỗ',
  bookedToast: 'Đặt chỗ thành công', waitlistToast: 'Phiên đã hết chỗ — bạn đã vào hàng chờ', cancelToast: 'Đã huỷ đặt chỗ',
  speakerAt: 'Tham gia phiên', noSessions: 'Chưa có phiên nào được xuất bản.', noLaunch: 'Chưa có khung ra mắt nào được xác nhận.', noBooth: 'Không có gian phù hợp.',
  playerTitle: 'Phòng phát trực tiếp', verifying: 'Đang xác thực thẻ…', verified: 'Thẻ hợp lệ — chào mừng', notStarted: 'Phiên chưa bắt đầu', replayLabel: 'Bản ghi phiên', demoPlayer: 'Khung phát minh hoạ — kết nối hạ tầng livestream / webinar khi triển khai.',
  reg: {
    title: 'Đăng ký tham quan trực tuyến', steps: ['Thông tin', 'Xác thực email', 'Thẻ tham dự'],
    name: 'Họ và tên', email: 'Email', phone: 'Số điện thoại', company: 'Doanh nghiệp / tổ chức', country: 'Quốc gia', visitorType: 'Bạn tham quan với vai trò', businessType: 'Loại hình doanh nghiệp', interests: 'Ngành quan tâm',
    visitorTypes: { BUYER: 'Người mua', INVESTOR: 'Nhà đầu tư', DISTRIBUTOR: 'Nhà phân phối', PARTNER: 'Đối tác', OBSERVER: 'Quan sát' },
    businessTypes: { MANUFACTURER: 'Nhà sản xuất', TRADER: 'Thương mại', DISTRIBUTOR: 'Phân phối', RETAIL_ECOMMERCE: 'Bán lẻ / TMĐT', INVESTOR: 'Đầu tư', OTHER: 'Khác' },
    shareContact: 'Tôi đồng ý chia sẻ thông tin liên hệ với nhà trưng bày khi hỏi giá',
    consent: 'Tôi đồng ý để VCCI xử lý dữ liệu cá nhân theo PDPL cho mục đích tổ chức show',
    ageConfirm: 'Tôi xác nhận đã đủ {n} tuổi',
    sendOtp: 'Gửi mã OTP', otpSent: 'Đã gửi mã 6 số tới', otpHint: 'Bản mẫu: nhập 123456.', otpHintLive: 'Kiểm tra hộp thư (kể cả thư rác); thời hạn của mã ghi trong email.', registeredHint: 'Nếu đã đăng ký trước đó thì nhập mã thẻ trong mail.', codeInput: 'Mã OTP hoặc mã thẻ', verify: 'Xác thực', resend: 'Gửi lại mã', resendIn: 'Gửi lại sau', wrong: 'Mã không đúng', attemptsLeft: 'lần thử còn lại', locked: 'Đã sai 5 lần. Vui lòng thử lại sau 15 phút.',
    payTitle: 'Thanh toán vé tham quan', payDesc: 'Chuyển khoản và tải biên lai. Kế toán xác nhận xong, thẻ sẽ được cấp.', uploadReceipt: 'Tải biên lai', receiptPicked: 'Đã chọn tệp', submitReceipt: 'Gửi biên lai',
    pendingApprovalTitle: 'Đã nhận đăng ký', pendingApprovalDesc: 'Show này duyệt khách trước khi cấp thẻ. Bạn sẽ nhận email khi có kết quả.', pendingPayTitle: 'Đã nhận biên lai', pendingPayDesc: 'Kế toán sẽ xác nhận biên lai và cấp thẻ qua email.',
    doneTitle: 'Thẻ tham dự điện tử của bạn', doneDesc: 'Dùng mã thẻ để vào phiên trực tiếp. Thẻ đã được gửi tới email của bạn.', code: 'Mã thẻ', cancelReg: 'Huỷ đăng ký', cancelled: 'Đã huỷ đăng ký tham quan', one: 'Mỗi email chỉ đăng ký một lần cho mỗi show.',
    required: 'Vui lòng điền đầy đủ thông tin bắt buộc', invalidEmail: 'Email không hợp lệ',
  },
}

type Widen<T> = T extends string ? string : T extends readonly (infer U)[] ? Widen<U>[] : T extends object ? { [K in keyof T]: Widen<T[K]> } : T

const en: Widen<typeof vi> = {
  online: 'Online-only event',
  onlineFirst: 'Online-first event', physicalVenue: 'Also on site',
  label: { LIVE: 'Live now', ONGOING: 'Happening now', CANCELED: 'Cancelled', REPLAY: 'Replay available', ENDED: 'Ended', FULL: 'Full', REG_OPEN: 'Registration open', REG_NOT_OPEN: 'Registration not open yet', REG_CLOSED: 'Registration closed', UPCOMING: 'Upcoming' },
  direction: { EXPORT: 'Export show · invites domestic sellers', IMPORT: 'Import show · for overseas buyers' },
  tabs: { overview: 'Overview', booths: 'Virtual booths', products: 'Products', launches: 'Product launches', agenda: 'Programme', speakers: 'Speakers' },
  stats: { booths: 'Booths', products: 'Products', sessions: 'Sessions', badges: 'Badges issued' },
  badgeLabel: 'E-badge', registerVisit: 'Register to visit', myBadge: 'My e-badge', badgeIssued: 'Badge issued', badgePendingPay: 'Receipt under review', badgePendingApprove: 'Awaiting approval',
  closedReg: 'Visitor registration closed', canceledReg: 'Show cancelled',
  fee: 'Visitor ticket', regDeadline: 'Registration deadline', virtualVenue: 'Venue (virtual space)', organizer: 'Organizer', contact: 'Organizer contact',
  needApproval: 'Organizers approve visitors before issuing badges', ticketFree: 'Free',
  rulesTitle: 'Visitor rules', phasesTitle: 'Show phases', pavTitle: 'Virtual pavilions', markets: 'Target markets', industries: 'Industries',
  sellerSide: 'Seller', supportSide: 'Support service', buyerHint: 'Buyers visit, ask for quotes and book sessions.',
  filterPhase: 'Phase', filterPav: 'Pavilion', all: 'All', search: 'Search booths, companies, products…',
  visitBooth: 'Enter booth', booth: 'Booth', products: 'Showcased products', featured: 'Featured', moq: 'MOQ', priceOnRequest: 'Price on request', askPrice: 'Ask for quote', viewProduct: 'View product page', viewCompany: 'Company profile',
  inquiryTitle: 'Booth inquiry', inquiryNeedBadge: 'A valid e-badge is required to send an inquiry.', inquiryProduct: 'Product of interest', inquiryQty: 'Expected quantity', inquiryMsg: 'Message', inquiryMsgPh: 'Quality requirements, delivery terms, target market…', inquirySend: 'Send inquiry', inquirySent: 'Inquiry sent', inquirySentDesc: 'The exhibitor will reply to your email.', inquiryDaily: 'Up to 20 inquiries per day.',
  launchTitle: 'Product launch schedule on virtual stages', launchSub: 'Only organizer-confirmed slots are shown. One slot per stage — no overlaps.', follow: 'Follow', following: 'Following', followDesc: 'You will get a reminder 15 minutes before the launch.', followers: 'followers', stage: 'Stage',
  sessionsTitle: 'Online seminar programme', room: 'Virtual room', seats: 'seats', left: 'left', waitlist: 'Waitlist',
  kind: { SEMINAR: 'Seminar', LAUNCH: 'Launch', MATCHMAKING: '1-on-1' },
  sessionStatus: { PUBLISHED: 'Upcoming', LIVE: 'Live', ENDED: 'Ended', CANCELED: 'Cancelled' },
  book: 'Book seat', joinWaitlist: 'Join waitlist', cancelBooking: 'Cancel booking', booked: 'Booked', onWaitlist: 'On waitlist', joinLive: 'Join live session', watchReplay: 'Watch replay', needBadgeBook: 'Register to book a seat',
  bookedToast: 'Seat booked', waitlistToast: 'Session is full — you joined the waitlist', cancelToast: 'Booking cancelled',
  speakerAt: 'Appears in', noSessions: 'No sessions published yet.', noLaunch: 'No confirmed launch slots yet.', noBooth: 'No matching booths.',
  playerTitle: 'Live room', verifying: 'Verifying badge…', verified: 'Badge valid — welcome', notStarted: 'Session has not started', replayLabel: 'Session recording', demoPlayer: 'Demo player — connects to the livestream / webinar infrastructure on deployment.',
  reg: {
    title: 'Online visitor registration', steps: ['Details', 'Verify email', 'E-badge'],
    name: 'Full name', email: 'Email', phone: 'Phone', company: 'Company / organization', country: 'Country', visitorType: 'You visit as', businessType: 'Business type', interests: 'Industries of interest',
    visitorTypes: { BUYER: 'Buyer', INVESTOR: 'Investor', DISTRIBUTOR: 'Distributor', PARTNER: 'Partner', OBSERVER: 'Observer' },
    businessTypes: { MANUFACTURER: 'Manufacturer', TRADER: 'Trader', DISTRIBUTOR: 'Distributor', RETAIL_ECOMMERCE: 'Retail / e-commerce', INVESTOR: 'Investor', OTHER: 'Other' },
    shareContact: 'I agree to share my contact details with exhibitors when I send an inquiry',
    consent: 'I agree VCCI processes my personal data under PDPL for running this show',
    ageConfirm: 'I confirm I am at least {n} years old',
    sendOtp: 'Send OTP', otpSent: '6-digit code sent to', otpHint: 'Demo: enter 123456.', otpHintLive: 'Check your inbox (and spam folder); the code expiry is stated in the email.', registeredHint: 'If you registered before, enter the badge code from the mail.', codeInput: 'OTP or badge code', verify: 'Verify', resend: 'Resend code', resendIn: 'Resend in', wrong: 'Wrong code', attemptsLeft: 'attempts left', locked: 'Too many wrong codes. Try again in 15 minutes.',
    payTitle: 'Pay visitor ticket', payDesc: 'Pay by bank transfer and upload the receipt. Accounting confirms, then your badge is issued.', uploadReceipt: 'Upload receipt', receiptPicked: 'File selected', submitReceipt: 'Submit receipt',
    pendingApprovalTitle: 'Registration received', pendingApprovalDesc: 'This show approves visitors before issuing badges. You will be emailed the result.', pendingPayTitle: 'Receipt received', pendingPayDesc: 'Accounting will confirm the receipt and issue your badge by email.',
    doneTitle: 'Your e-badge', doneDesc: 'Use the badge code to enter live sessions. The badge was sent to your email.', code: 'Badge code', cancelReg: 'Cancel registration', cancelled: 'Visitor registration cancelled', one: 'One registration per email per show.',
    required: 'Please fill in all required fields', invalidEmail: 'Invalid email',
  },
}

const ko: Widen<typeof vi> = {
  online: '온라인 전용 행사',
  onlineFirst: '온라인 우선 행사', physicalVenue: '오프라인 장소',
  label: { LIVE: '생중계 중', ONGOING: '진행 중', CANCELED: '취소됨', REPLAY: '다시보기 가능', ENDED: '종료', FULL: '마감', REG_OPEN: '등록 중', REG_NOT_OPEN: '등록 오픈 전', REG_CLOSED: '등록 마감', UPCOMING: '예정' },
  direction: { EXPORT: '수출 쇼 · 국내 판매 기업 초청', IMPORT: '수입 쇼 · 해외 바이어 대상' },
  tabs: { overview: '개요', booths: '가상 부스', products: '제품', launches: '제품 출시', agenda: '프로그램', speakers: '연사' },
  stats: { booths: '부스', products: '제품', sessions: '세션', badges: '발급된 배지' },
  badgeLabel: 'E-badge', registerVisit: '참관 등록', myBadge: '내 참가 배지', badgeIssued: '배지 발급됨', badgePendingPay: '영수증 확인 대기', badgePendingApprove: '주최측 승인 대기',
  closedReg: '참관 등록 마감', canceledReg: '쇼 취소됨',
  fee: '참관료', regDeadline: '등록 마감일', virtualVenue: '장소 (가상 공간)', organizer: '주최', contact: '주최측 연락처',
  needApproval: '주최측 승인 후 배지가 발급됩니다', ticketFree: '무료',
  rulesTitle: '참관 규정', phasesTitle: '쇼 일정', pavTitle: '가상 전시관', markets: '목표 시장', industries: '업종',
  sellerSide: '판매', supportSide: '지원 서비스', buyerHint: '바이어는 참관, 견적 요청, 세션 예약을 할 수 있습니다.',
  filterPhase: '회차', filterPav: '전시관', all: '전체', search: '부스, 기업, 제품 검색…',
  visitBooth: '부스 입장', booth: '부스', products: '전시 제품', featured: '추천', moq: 'MOQ', priceOnRequest: '가격 문의', askPrice: '견적 요청', viewProduct: '제품 페이지 보기', viewCompany: '기업 프로필',
  inquiryTitle: '부스 문의', inquiryNeedBadge: '문의하려면 유효한 배지가 필요합니다.', inquiryProduct: '관심 제품', inquiryQty: '예상 수량', inquiryMsg: '내용', inquiryMsgPh: '품질 요건, 납품 조건, 목표 시장…', inquirySend: '문의 보내기', inquirySent: '문의를 보냈습니다', inquirySentDesc: '참가 기업이 이메일로 답변합니다.', inquiryDaily: '하루 최대 20건까지 보낼 수 있습니다.',
  launchTitle: '가상 무대 제품 출시 일정', launchSub: '주최측이 확정한 시간만 표시됩니다. 무대별로 시간이 겹치지 않습니다.', follow: '팔로우', following: '팔로우 중', followDesc: '출시 15분 전에 알림을 받습니다.', followers: '명 팔로우', stage: '무대',
  sessionsTitle: '온라인 세미나 프로그램', room: '가상 룸', seats: '석', left: '잔여', waitlist: '대기',
  kind: { SEMINAR: '세미나', LAUNCH: '출시', MATCHMAKING: '1:1 미팅' },
  sessionStatus: { PUBLISHED: '예정', LIVE: '생중계', ENDED: '종료', CANCELED: '취소됨' },
  book: '좌석 예약', joinWaitlist: '대기 등록', cancelBooking: '예약 취소', booked: '예약됨', onWaitlist: '대기 중', joinLive: '생중계 세션 입장', watchReplay: '다시보기', needBadgeBook: '참관 등록 후 좌석을 예약하세요',
  bookedToast: '좌석을 예약했습니다', waitlistToast: '세션이 마감되어 대기자로 등록되었습니다', cancelToast: '예약을 취소했습니다',
  speakerAt: '참여 세션', noSessions: '공개된 세션이 없습니다.', noLaunch: '확정된 출시 일정이 없습니다.', noBooth: '조건에 맞는 부스가 없습니다.',
  playerTitle: '라이브 룸', verifying: '배지 확인 중…', verified: '유효한 배지입니다. 환영합니다', notStarted: '세션이 아직 시작되지 않았습니다', replayLabel: '세션 녹화본', demoPlayer: '데모 플레이어입니다. 배포 시 라이브/웨비나 인프라에 연결됩니다.',
  reg: {
    title: '온라인 참관 등록', steps: ['정보', '이메일 인증', '참가 배지'],
    name: '성명', email: '이메일', phone: '전화번호', company: '기업 / 기관', country: '국가', visitorType: '참관 역할', businessType: '사업 유형', interests: '관심 업종',
    visitorTypes: { BUYER: '바이어', INVESTOR: '투자자', DISTRIBUTOR: '유통업체', PARTNER: '파트너', OBSERVER: '참관객' },
    businessTypes: { MANUFACTURER: '제조사', TRADER: '무역', DISTRIBUTOR: '유통', RETAIL_ECOMMERCE: '소매 / 전자상거래', INVESTOR: '투자', OTHER: '기타' },
    shareContact: '견적 요청 시 참가 기업에 연락처를 공유하는 데 동의합니다',
    consent: '쇼 운영을 위해 VCCI가 개인정보보호법(PDPL)에 따라 개인정보를 처리하는 데 동의합니다',
    ageConfirm: '만 {n}세 이상임을 확인합니다',
    sendOtp: 'OTP 보내기', otpSent: '6자리 코드를 보냈습니다:', otpHint: '데모: 123456 입력.', otpHintLive: '받은편지함(스팸함 포함)을 확인하세요. 코드 유효 시간은 이메일에 안내되어 있습니다.', registeredHint: '이전에 등록하셨다면 메일의 배지 코드를 입력하세요.', codeInput: 'OTP 또는 배지 코드', verify: '인증', resend: '코드 다시 보내기', resendIn: '다시 보내기', wrong: '코드가 올바르지 않습니다', attemptsLeft: '회 남음', locked: '5회 틀렸습니다. 15분 후 다시 시도하세요.',
    payTitle: '참관료 결제', payDesc: '계좌이체 후 영수증을 올려주세요. 회계 확인 후 배지가 발급됩니다.', uploadReceipt: '영수증 업로드', receiptPicked: '선택한 파일', submitReceipt: '영수증 제출',
    pendingApprovalTitle: '등록이 접수되었습니다', pendingApprovalDesc: '이 쇼는 승인 후 배지를 발급합니다. 결과는 이메일로 안내합니다.', pendingPayTitle: '영수증이 접수되었습니다', pendingPayDesc: '회계 확인 후 이메일로 배지를 발급합니다.',
    doneTitle: '전자 참가 배지', doneDesc: '배지 코드로 생중계 세션에 입장하세요. 배지는 이메일로도 보냈습니다.', code: '배지 코드', cancelReg: '등록 취소', cancelled: '참관 등록을 취소했습니다', one: '쇼마다 이메일 하나로 한 번만 등록할 수 있습니다.',
    required: '필수 항목을 모두 입력하세요', invalidEmail: '이메일이 올바르지 않습니다',
  },
}

type Dict = Widen<typeof vi>
type Overlay = { [K in Exclude<keyof Dict, 'reg' | 'stats'>]?: Dict[K] } & { stats?: Partial<Dict['stats']>; reg?: Partial<Dict['reg']> }
const withOverlay = (d: Dict, o: Overlay): Dict => ({ ...d, ...o, stats: { ...d.stats, ...o.stats }, reg: { ...d.reg, ...o.reg } })

/** ONLINE show: "Đăng ký tham gia", "Xác nhận tham gia"; no tham quan, thẻ tham quan, vé, cổng, check-in, địa điểm, hội trường, khu, kỳ, gian. */
const onlineVi = withOverlay(vi, {
  stats: { badges: 'Người đăng ký' },
  badgeLabel: 'Xác nhận tham gia', registerVisit: 'Đăng ký tham gia', myBadge: 'Xác nhận tham gia của tôi', badgeIssued: 'Đã xác nhận tham gia',
  closedReg: 'Đã đóng đăng ký tham gia', fee: 'Phí tham gia', virtualVenue: 'Hình thức', needApproval: 'BTC duyệt trước khi xác nhận tham gia',
  rulesTitle: 'Quy định tham gia', buyerHint: 'Người tham gia xem sản phẩm, hỏi giá và đặt chỗ phiên.', needBadgeBook: 'Đăng ký tham gia để đặt chỗ',
  verifying: 'Đang kiểm tra xác nhận tham gia…', verified: 'Đã xác nhận tham gia — chào mừng',
  reg: {
    title: 'Đăng ký tham gia', steps: ['Thông tin', 'Xác thực email', 'Xác nhận tham gia'], visitorType: 'Bạn tham gia với vai trò',
    shareContact: 'Tôi đồng ý chia sẻ thông tin liên hệ với doanh nghiệp tham gia Show khi hỏi giá',
    payTitle: 'Thanh toán phí tham gia', payDesc: 'Chuyển khoản và tải biên lai. Kế toán xác nhận xong, bạn sẽ nhận xác nhận tham gia.',
    pendingApprovalDesc: 'Show này duyệt người đăng ký trước khi xác nhận tham gia. Bạn sẽ nhận email khi có kết quả.', pendingPayDesc: 'Kế toán sẽ xác nhận biên lai và gửi xác nhận tham gia qua email.',
    registeredHint: 'Nếu đã đăng ký trước đó thì nhập mã xác nhận trong mail.', codeInput: 'Mã OTP hoặc mã xác nhận',
    doneTitle: 'Xác nhận tham gia của bạn', doneDesc: 'Dùng mã tham gia để vào phiên trực tiếp. Xác nhận đã được gửi tới email của bạn.', code: 'Mã tham gia', cancelled: 'Đã huỷ đăng ký tham gia',
  },
})
const onlineEn = withOverlay(en, {
  stats: { badges: 'Registered' },
  badgeLabel: 'Participation confirmed', registerVisit: 'Register to join', myBadge: 'My participation', badgeIssued: 'Participation confirmed',
  closedReg: 'Registration closed', fee: 'Participation fee', virtualVenue: 'Format', needApproval: 'Organizers approve registrations before confirming participation',
  rulesTitle: 'Participation rules', buyerHint: 'Participants view products, ask for quotes and book sessions.',
  verifying: 'Checking your registration…', verified: 'Participation confirmed — welcome',
  reg: {
    title: 'Register to join', steps: ['Details', 'Verify email', 'Confirmation'], visitorType: 'You join as',
    shareContact: 'I agree to share my contact details with participating businesses when I ask for a quote',
    payTitle: 'Pay participation fee', payDesc: 'Pay by bank transfer and upload the receipt. Once accounting confirms, you receive your confirmation.',
    pendingApprovalDesc: 'This show approves registrations before confirming participation. You will be emailed the result.', pendingPayDesc: 'Accounting will confirm the receipt and email your confirmation.',
    registeredHint: 'If you registered before, enter the confirmation code from the mail.', codeInput: 'OTP or confirmation code',
    doneTitle: 'Your participation is confirmed', doneDesc: 'Use your participation code to enter live sessions. The confirmation was sent to your email.', code: 'Participation code', cancelled: 'Registration cancelled',
  },
})
const onlineKo = withOverlay(ko, {
  stats: { badges: '등록자' },
  badgeLabel: '참가 확정', registerVisit: '참가 등록', myBadge: '내 참가 확인', badgeIssued: '참가 확정',
  closedReg: '참가 등록 마감', fee: '참가비', virtualVenue: '형식', needApproval: '주최측 승인 후 참가가 확정됩니다',
  rulesTitle: '참가 규정', buyerHint: '참가자는 제품 확인, 견적 요청, 세션 예약을 할 수 있습니다.', needBadgeBook: '참가 등록 후 좌석을 예약하세요',
  verifying: '참가 확인 중…', verified: '참가가 확인되었습니다. 환영합니다',
  reg: {
    title: '참가 등록', steps: ['정보', '이메일 인증', '참가 확정'], visitorType: '참가 역할',
    visitorTypes: { ...ko.reg.visitorTypes, OBSERVER: '옵서버' },
    payTitle: '참가비 결제', payDesc: '계좌이체 후 영수증을 올려주세요. 회계 확인 후 참가가 확정됩니다.',
    pendingApprovalDesc: '이 쇼는 승인 후 참가가 확정됩니다. 결과는 이메일로 안내합니다.', pendingPayDesc: '회계 확인 후 참가 확정 안내를 이메일로 보냅니다.',
    registeredHint: '이전에 등록하셨다면 메일의 확인 코드를 입력하세요.', codeInput: 'OTP 또는 확인 코드',
    doneTitle: '참가가 확정되었습니다', doneDesc: '참가 코드로 생중계 세션에 입장하세요. 확정 안내는 이메일로도 보냈습니다.', code: '참가 코드', cancelled: '참가 등록을 취소했습니다',
  },
})

/** Format of the show being rendered. A show page provides it, so everything inside (dialogs too) reads the right wording. */
export const ShowFormatContext = createContext<string | undefined>(undefined)

/** `show` for the component that provides the context itself; everything below it calls this with no argument. */
export function useShowT(show?: { format?: string }) {
  const { lang } = useI18n()
  const fromPage = useContext(ShowFormatContext)
  const online = isOnlineFormat(show ? show.format : fromPage)
  if (lang === 'vi') return online ? onlineVi : vi
  if (lang === 'ko') return online ? onlineKo : ko
  return online ? onlineEn : en
}
