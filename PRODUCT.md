# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Website phục vụ hai nhóm chính ngang hàng. Không nhóm nào được mặc định ưu tiên; mỗi trang tự chọn theo ngữ cảnh.

- **DN xuất khẩu Việt Nam (nhà cung cấp):** hội viên và doanh nghiệp cần hiển thị hồ sơ năng lực, nhận RFQ, đăng ký sự kiện nhanh mà không khai lại hồ sơ.
- **Nhà nhập khẩu, nhà đầu tư nước ngoài (người mua):** cần tìm nhà cung cấp đáng tin, gửi RFQ, đăng nhu cầu nhập khẩu.

Nhóm khác đã có trong BRD: khách tham quan Show Hub, đơn vị tư vấn/luật/phân phối trong danh bạ, nhà tài trợ. Cán bộ VCCI và BTC làm việc ở CMS, không phải trên website này.

## Product Purpose

VCCI Trade Hub là cổng giao thương B2B công khai của VCCI. Nó số hoá các hoạt động xúc tiến thương mại truyền thống (danh bạ doanh nghiệp, kết nối giao thương, hội chợ) thành một nền tảng, thay cho các chức năng rời rạc của portal cũ.

Thành công nghĩa là: thêm DN có hồ sơ đầy đủ và được xác thực, thêm RFQ và báo giá đi qua nền tảng, đăng ký sự kiện hoàn tất nhanh hơn, và VCCI đo được kết nối thương mại. Các chỉ tiêu số trong BRD (BG-01 đến BG-07) mới là đề xuất, chưa được chốt và chưa có baseline.

## Positioning

Lợi thế đến từ chính VCCI, thứ một sàn B2B khác không thể tự nhận:

- **Xác thực bởi VCCI:** huy hiệu *Xác thực VCCI* do chính VCCI rà soát hồ sơ doanh nghiệp.
- **Mạng lưới xúc tiến của VCCI:** hội chợ, Show Hub, matchmaking, livestream và webinar do VCCI/BTC tổ chức, nằm cùng nền tảng với sàn.
- **Hồ sơ năng lực dùng lại:** DN khai một hồ sơ, đăng ký sự kiện bằng một thao tác xác nhận.
- **Hỗ trợ pháp lý và chính sách:** hỗ trợ về FTA, thủ tục và quy định thị trường. Hiện không được quảng bá như một chatbot AI đang hoạt động (xem Capabilities and Constraints).

## Operating Context

- **Giao thương:** tìm sản phẩm, duyệt danh bạ DN, xem hồ sơ kiểu gian hàng, gửi RFQ, đăng và duyệt yêu cầu nhập khẩu, gửi báo giá qua email.
- **Sự kiện:** duyệt danh sách và lịch, đăng ký miễn phí hoặc trả phí, nhận thẻ tham dự, xem livestream. Thanh toán hiện là chuyển khoản/QR kèm biên lai, BTC đối soát thủ công.
- **Show Hub:** hội chợ/triển lãm chỉ tổ chức trực tuyến, gồm gian ảo, sản phẩm, ra mắt, phiên hội thảo, thẻ tham quan, hỏi giá gian.
- **Vòng duyệt ở CMS:** đăng ký DN, huy hiệu xác thực và sản phẩm đều chờ VCCI duyệt. DN tạo hoặc sửa sản phẩm thì sản phẩm ẩn cho đến khi được duyệt, nên giao diện phải xử lý trạng thái chờ như trạng thái bình thường.

## Capabilities and Constraints

- Ứng dụng React + Vite đang ghép API thật; dữ liệu mẫu chỉ dùng khi API lỗi. Công ty trong dữ liệu mẫu đều là hư cấu.
- Ngôn ngữ vi/en/ko, chế độ sáng/tối.
- Trạng thái sự kiện và Show không lưu tay; nhãn hiển thị được tính tại thời điểm xem.
- Khách chưa đăng nhập không chat được: chat hỗ trợ khoá ô nhập, chat livestream chỉ đọc.
- Chứng từ doanh thu không công khai, chỉ VCCI xem. Dữ liệu cá nhân và DN xử lý theo PDPL, có đồng ý rõ ràng.

Thuật ngữ: *DN*, *RFQ*, *yêu cầu nhập khẩu*, *Show Hub*, *thẻ tham quan*, *Xác thực VCCI*, *hồ sơ năng lực*.

Chưa quyết định:

- Tiêu chí xét duyệt *Xác thực VCCI* và hạng DN chưa được ban hành bằng văn bản.
- Gộp Sự kiện và Show: mới là định hướng, chưa có kế hoạch cụ thể.
- Chatbot AI pháp lý không làm trong đợt này (quyết định 2026-11-02). Trang `LegalAI` vẫn là dữ liệu mẫu, chưa rõ giữ, ẩn hay đổi nội dung khi lên production.
- Phạm vi pháp lý khi chia sẻ hồ sơ DN cho đối tác chưa được pháp chế VCCI xác nhận.

## Brand Commitments

- Tên sản phẩm: **VCCI Trade Hub**.
- Tên tổ chức tiếng Việt trên website: **Liên đoàn Thương mại và Công nghiệp Việt Nam**.
- Nhận diện VCCI là ràng buộc của BRD (xanh, vàng ấn triện, navy, Be Vietnam Pro). Giá trị cụ thể ở `docs/design.md`.
- Logo và favicon: `public/imgs/Logo_vcci.png`, `public/imgs/Favicon.png`.

## Evidence on Hand

Có thật trong repo: logo, ảnh (`public/imgs/`), video (`public/video/car.mp4`, `public/video/product_search.mp4`). Số doanh nghiệp và quốc gia lấy từ API (`useHomeStats`).

Chưa xác minh, không được xem là sự thật cho đến khi VCCI xác nhận:

- "63 tỉnh thành" và "160 sự kiện/năm" đang viết cứng ở `src/pages/About.tsx`.
- "40+ quốc gia" đang viết cứng trong `src/lib/dict.ts`.

Không có: nhận xét khách hàng thật, tình huống điển hình, báo chí, số liệu kết nối thương mại. Không được tự tạo. Mục "Tiếng nói từ hội chợ" cần module CMS mới.

## Product Principles

1. **Hai phía ngang hàng:** mọi luồng chính phải hợp lý cho cả bên cung lẫn bên mua.
2. **Niềm tin phải có thật:** chỉ hiển thị xác thực, số liệu và trạng thái có nguồn từ dữ liệu thật hoặc từ VCCI.
3. **Khai một lần:** không bắt DN nhập lại điều nền tảng đã biết.
4. **Sàn và xúc tiến là một:** sản phẩm, doanh nghiệp và sự kiện dẫn sang nhau, không phải các khu tách rời.
5. **Trung thực về chờ duyệt:** người dùng luôn biết mục nào đang chờ VCCI duyệt và điều gì xảy ra tiếp theo.

## Accessibility & Inclusion

Theo SRS NFR-08 (bản nháp): hỗ trợ bàn phím và nhãn ARIA cho điều khiển chính, tôn trọng `prefers-reduced-motion`. Chưa cam kết mức WCAG cụ thể.

Nội dung công khai phải đọc được ở vi, en và ko, định dạng ngày và tiền theo ngôn ngữ.
