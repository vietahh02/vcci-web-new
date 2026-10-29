# VCCI Trade Hub — redesign prototype

Prototype giao diện mới cho cổng giao thương VCCI. Cấu trúc theo mô hình chợ B2B (kiểu Global Sources), giữ toàn bộ chức năng của portal hiện tại. Project tách riêng hoàn toàn khỏi `vcci_new_base`.

```bash
npm install
npm run dev      # http://localhost:5180
npm run build
```

- **Stack**: Vite + React 19 + TypeScript, Tailwind CSS v4, Motion, Radix UI, lucide-react.
- **Design**: xem [docs/design.md](docs/design.md), gồm token, hiệu ứng và bảng màn hình → chức năng → API.
- **Dữ liệu**: dữ liệu mẫu ở `src/data/mock.ts`, các công ty trong đó đều là hư cấu. Lớp truy cập `src/api/index.ts` ghi rõ endpoint thật tương ứng ở mỗi hàm.
- **Ngôn ngữ**: vi (mặc định) / en. Chế độ sáng/tối.
