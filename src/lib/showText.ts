/** UI strings for the Show Hub event type (vi/en). Kept next to the feature, not in the global dict. */
import { useI18n } from '@/lib/i18n'

const vi = {
  online: 'Chỉ tổ chức trực tuyến',
  onlineFirst: 'Ưu tiên trực tuyến', physicalVenue: 'Địa điểm phụ',
  label: { LIVE: 'Đang phát trực tiếp', ONGOING: 'Đang diễn ra', CANCELED: 'Đã huỷ', REPLAY: 'Có xem lại', ENDED: 'Đã kết thúc', FULL: 'Hết chỗ', REG_OPEN: 'Đang mở đăng ký', REG_NOT_OPEN: 'Chưa mở đăng ký', REG_CLOSED: 'Đã đóng đăng ký', UPCOMING: 'Sắp diễn ra' },
  direction: { EXPORT: 'Show xuất khẩu · mời bên bán trong nước', IMPORT: 'Show nhập khẩu · dành cho người mua nước ngoài' },
  tabs: { overview: 'Tổng quan', booths: 'Gian ảo', products: 'Sản phẩm', launches: 'Ra mắt sản phẩm', agenda: 'Chương trình', speakers: 'Diễn giả' },
  stats: { booths: 'Gian ảo', products: 'Sản phẩm', sessions: 'Phiên', badges: 'Thẻ đã cấp' },
  registerVisit: 'Đăng ký tham quan', myBadge: 'Thẻ tham dự của tôi', badgeIssued: 'Đã cấp thẻ', badgePendingPay: 'Chờ xác nhận biên lai', badgePendingApprove: 'Chờ BTC duyệt',
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
    sendOtp: 'Gửi mã OTP', otpSent: 'Đã gửi mã 6 số tới', otpHint: 'Mã có hiệu lực 5 phút. Bản mẫu: nhập 123456.', otpHintLive: 'Kiểm tra hộp thư (kể cả thư rác); thời hạn của mã ghi trong email.', verify: 'Xác thực', resend: 'Gửi lại mã', resendIn: 'Gửi lại sau', wrong: 'Mã không đúng', attemptsLeft: 'lần thử còn lại', locked: 'Đã sai 5 lần. Vui lòng thử lại sau 15 phút.',
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
  registerVisit: 'Register to visit', myBadge: 'My e-badge', badgeIssued: 'Badge issued', badgePendingPay: 'Receipt under review', badgePendingApprove: 'Awaiting approval',
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
    sendOtp: 'Send OTP', otpSent: '6-digit code sent to', otpHint: 'Valid for 5 minutes. Demo: enter 123456.', otpHintLive: 'Check your inbox (and spam folder); the code expiry is stated in the email.', verify: 'Verify', resend: 'Resend code', resendIn: 'Resend in', wrong: 'Wrong code', attemptsLeft: 'attempts left', locked: 'Too many wrong codes. Try again in 15 minutes.',
    payTitle: 'Pay visitor ticket', payDesc: 'Pay by bank transfer and upload the receipt. Accounting confirms, then your badge is issued.', uploadReceipt: 'Upload receipt', receiptPicked: 'File selected', submitReceipt: 'Submit receipt',
    pendingApprovalTitle: 'Registration received', pendingApprovalDesc: 'This show approves visitors before issuing badges. You will be emailed the result.', pendingPayTitle: 'Receipt received', pendingPayDesc: 'Accounting will confirm the receipt and issue your badge by email.',
    doneTitle: 'Your e-badge', doneDesc: 'Use the badge code to enter live sessions. The badge was sent to your email.', code: 'Badge code', cancelReg: 'Cancel registration', cancelled: 'Visitor registration cancelled', one: 'One registration per email per show.',
    required: 'Please fill in all required fields', invalidEmail: 'Invalid email',
  },
}

export function useShowT() {
  const { lang } = useI18n()
  return lang === 'vi' ? vi : en
}
