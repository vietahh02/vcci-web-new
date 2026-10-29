# VCCI Trade Hub — Redesign prototype (design.md)

Status: **DRAFT — chờ duyệt (GATE-3)**. Đây là bản prototype giao diện độc lập, không đụng vào `vcci_new_base/vcci-web-portal-angular`.

## 1. Định hướng

- **Cấu trúc thông tin**: theo mô hình chợ B2B kiểu Global Sources. Gồm header có ô tìm kiếm chọn phạm vi, mega-menu danh mục, cụm 3 cột (danh mục | banner sự kiện | tài khoản + RFQ nhanh), lưới sản phẩm, showcase nhà cung cấp xác thực, sàn RFQ, hội chợ/livestream.
- **Nhận diện**: giữ của VCCI. Xanh `#006699`, vàng ấn triện, navy `#08082e`, font Be Vietnam Pro, logo từ `origin/uat`.
- **Component style**: shadcn (tham chiếu `ui-references/flutter-shadcn-ui`, `ui-references/forui`). Dùng semantic token, viền mảnh, radius 12px, trạng thái muted.

### Bố cục riêng từng trang

| Trang | Bố cục |
|---|---|
| Trang chủ | Hero video `car.mp4` (video banner mặc định của portal cũ, nén còn 6 MB) |
| Sản phẩm | Dải video `product_search.mp4` + thanh danh mục icon dính đầu trang + bộ lọc + lưới |
| Doanh nghiệp | Header sáng, tab theo `businessType`, danh sách dạng hàng ngang |
| Hồ sơ doanh nghiệp | Kiểu gian hàng: định danh trên ảnh bìa + thanh tab riêng của công ty |
| Yêu cầu nhập khẩu | Đầu trang chia đôi, form đăng ngay trên trang + danh sách dạng bảng |
| Sự kiện | Đếm ngược toàn màn hình + dải LIVE + lịch theo tháng + mục xem lại |

**Nguyên tắc thẻ:** chỉ hiển thị trường có trong DTO thật (`ProductResult`, `Business`, `EventItem`, `PortalImportRequestListItem`). Không thêm số liệu tự suy diễn.

## 2. Design tokens (`src/index.css`)

| Token | Light | Dark | Dùng cho |
|---|---|---|---|
| `--primary` | #006699 | #2a9fd8 | CTA, link, trạng thái active |
| `--gold-bright` / `--gold` | #d4af37 / #a87a08 | #f0cd62 / #e0b84a | Huy hiệu Xác thực VCCI, CTA phụ |
| `--navy` | #08082e | #08082e | Hero, khối nhấn |
| `--success` | #00875a | #22c582 | Trạng thái mở, tỉ lệ phản hồi |
| `--live` | #e11d48 | #e11d48 | LIVE, sắp hết hạn |
| `--radius` | 0.75rem | | Card, input |

Typography: Be Vietnam Pro 400–800. H1 hero 64px/1.08, H2 section 32px.

## 3. Hiệu ứng

| Hiệu ứng | Nơi dùng |
|---|---|
| Ken Burns + parallax + aurora blur | Hero, page hero |
| Word-by-word reveal + chữ vàng shimmer | Tiêu đề hero |
| Placeholder xoay vòng, pill phạm vi dùng layoutId | Ô tìm kiếm |
| Feed hoạt động trực tiếp (AnimatePresence) | Hero |
| Count-up số liệu | Hero, hồ sơ DN, giới thiệu |
| Mega-menu mở bằng clip-path, highlight trượt | Header |
| Thẻ nghiêng 3D + glare | Thẻ nhà cung cấp |
| Spotlight theo con trỏ | Khối "Vì sao chọn" |
| Huy hiệu xác thực có ánh sáng lướt | Mọi nơi có huy hiệu |
| Đổi ảnh khi hover, nút yêu thích nảy | Thẻ sản phẩm |
| Đếm ngược, chấm LIVE nhấp nháy | Sự kiện, yêu cầu nhập khẩu |
| Danh sách yêu cầu tự cuộn | Trang chủ |
| Marquee nhà tài trợ | Trang chủ |
| Viền xoay conic | CTA, ô hỏi AI |
| Zoom ảnh theo con trỏ | Chi tiết sản phẩm |
| Stepper + QR quét + confetti | Đăng ký sự kiện |
| Lower-third, chat chạy, tim bay | Phòng livestream |
| Câu trả lời AI hiện dần (streaming) | Trợ lý pháp lý |
| Chuyển trang, thanh tiến độ cuộn, skeleton shimmer | Toàn site |

Các hiệu ứng tôn trọng `prefers-reduced-motion`, qua `MotionConfig reducedMotion="user"` và CSS.

## 4. Ma trận màn hình → chức năng VCCI → API thật

| Route | Chức năng VCCI giữ lại | API (portal-apis) |
|---|---|---|
| `/` | Banner, đối tác nổi bật, sự kiện, nhà tài trợ, chat widget | `/api/business/featured`, `/api/event/search`, `/api/public/sponsors` |
| `/` · Doanh nghiệp tiêu biểu | Spotlight doanh nghiệp nổi bật, tự xoay vòng | `/api/business/featured` |
| `/` · Nhà tài trợ | Nhà tài trợ chính → Vàng → Đối tác; banner dọc ở trang sự kiện/livestream (UC-EAM-06) | `/api/public/sponsors` (thêm `tier`, `tagline`) |
| `/` · Tiếng nói từ hội chợ | Nhận xét của người tham dự (cần module CMS mới) | — |
| `/search` | Tìm sản phẩm + lọc | `/api/products/search`, `/api/categories/options` |
| `/products/:id` | Chi tiết sản phẩm, gửi RFQ | `/api/products/{id}`, `POST /api/products/{id}/rfq` |
| `/suppliers` | Tìm nhà phân phối / danh bạ DN | `/api/business/search` |
| `/suppliers/:id` | Hồ sơ công ty, tài liệu, gửi yêu cầu báo giá email | `/api/business/{id}`, `POST /api/business/{id}/rfq/email` |
| `/requests` | Duyệt + đăng yêu cầu nhập khẩu | `/api/portal/import-requests/browse`, `POST /api/portal/import-requests` |
| `/requests/:id` | Gửi báo giá email (cc/bcc/đính kèm) | `POST /api/portal/import-requests/{id}/quotes/email` |
| `/events`, `/events/:id` | Hội chợ, webinar/livestream, đăng ký + thanh toán QR + chứng từ | `/api/event/*`, `/api/event/registrations`, `/payment` |
| `/live/:id` | Xem livestream, số người xem, chat | `/api/event/livestream-session/{id}`, `/api/public/livestream-chat/*` |
| `/legal-ai` | Trợ lý AI Đầu tư & Pháp lý | Socket.IO `vcci_chat_ai` |
| `/login`, `/register` | Đăng nhập captcha, đăng ký DN (chờ duyệt) | `/api/auth/*`, `POST /api/business/register` |
| Header | Thông báo, tin nhắn, đổi ngôn ngữ | `/api/notifications/my`, `/api/public/content-languages` |

## 5. Chưa có trong prototype

- Trang quản lý "Công ty của tôi" (logo, ảnh bìa, tài liệu, nhân sự), danh sách đăng ký của tôi, trang danh sách thông báo.
- Phòng webinar Jitsi.
- Tiếng Hàn (`kr`). Hiện mới có vi/en.
- Kết nối API thật. Lớp `src/api` đang trả dữ liệu mẫu cùng cấu trúc DTO.
