/**
 * Mock data for the prototype. Field names mirror the real VCCI portal DTOs
 * (vcci-web-portal-angular/src/app/models/*.model.ts on origin/uat) so the
 * api layer can later be pointed at /api/... without reshaping the UI.
 * All companies and people here are fictional.
 */
import type { Bilingual } from '@/lib/i18n'
import type { SectionKey } from '@/lib/profile'

export const IMG = {
  coffeeBeans: '1447933601403-0c6688de566e',
  latte: '1495474472287-4d71bcdd2085',
  rice: '1586201375761-83865001e31c',
  sofa: '1555041469-a586c61ea9bc',
  tshirts: '1523381210434-271e8be1f52b',
  headphones: '1505740420928-5e560c06d30e',
  phone: '1511707171634-5f897ff02aa9',
  vases: '1565193566173-7a0ee3dbe261',
  shrimp: '1565680018434-b513d5e5fd47',
  spices: '1596040033229-a9821ebd058d',
  tea: '1556679343-c7306c1976bc',
  dragonfruit: '1527325678964-54921661f888',
  interior: '1519710164239-da123dc03ef4',
  solar: '1509391366360-2e959784a276',
  port: '1494412574643-ff11b0a5c1c3',
  audience: '1540575467063-178a50c2df87',
  factory: '1581091226825-a6a2a5aee158',
  warehouse: '1586528116311-ad8dd3c8310d',
  workshop: '1552664730-d307ca884978',
  towers: '1486406146926-c627a92ad1ab',
  handshake: '1521791136064-7986c2920216',
  laptop: '1496181133206-80ce9b88a853',
  watch: '1523275335684-37898b6baf30',
  welding: '1504917595217-d4dc5ebe6122',
  apparel: '1515886657613-9f3515b0c78f',
  clothesRack: '1567401893414-76b7b1e5a7a5',
  tote: '1544816155-12df9643f363',
  restaurant: '1517248135467-4c7edcad34c4',
  coffeeBag: '1559056199-641a0ac8b55e',
  spoonSpices: '1506368249639-73a05d6f6488',
  laptopDark: '1531297484001-80022131f5a1',
  mic: '1475721027785-f74eccf877e2',
  stage: '1505373877841-8d25f7d46678',
  hall: '1511578314322-379afb476865',
  meeting: '1515187029135-18ee286d815b',
  discussion: '1517245386807-bb43f82c33c4',
  corridor: '1497366216548-37526070297c',
  analytics: '1560472354-b33ff0c44a43',
  officeOpen: '1504384308090-c894fdcc538d',
} as const

/* ------------------------------------------------------------ categories */
export type CategoryIcon =
  | 'Wheat' | 'Fish' | 'Shirt' | 'Sofa' | 'Cpu' | 'Gem' | 'Hammer' | 'Zap' | 'Boxes' | 'Truck'

export interface Category {
  id: string
  categoryCode: string
  categoryName: Bilingual
  icon: CategoryIcon
  image: string
  productCount: number
  sub: Bilingual[]
}

export const categories: Category[] = [
  { id: 'c-agri', categoryCode: 'AGRI', icon: 'Wheat', image: IMG.coffeeBeans, productCount: 8420,
    categoryName: { vi: 'Nông sản & Thực phẩm', en: 'Agriculture & Food' },
    sub: [{ vi: 'Cà phê', en: 'Coffee' }, { vi: 'Gạo', en: 'Rice' }, { vi: 'Hồ tiêu & Gia vị', en: 'Pepper & Spices' }, { vi: 'Trái cây tươi', en: 'Fresh fruit' }, { vi: 'Hạt điều', en: 'Cashew' }, { vi: 'Chè', en: 'Tea' }] },
  { id: 'c-sea', categoryCode: 'SEAFOOD', icon: 'Fish', image: IMG.shrimp, productCount: 3150,
    categoryName: { vi: 'Thuỷ hải sản', en: 'Seafood' },
    sub: [{ vi: 'Tôm đông lạnh', en: 'Frozen shrimp' }, { vi: 'Cá tra', en: 'Pangasius' }, { vi: 'Mực & Bạch tuộc', en: 'Squid & Octopus' }, { vi: 'Hải sản chế biến', en: 'Processed seafood' }] },
  { id: 'c-tex', categoryCode: 'TEXTILE', icon: 'Shirt', image: IMG.tshirts, productCount: 11240,
    categoryName: { vi: 'Dệt may & Da giày', en: 'Textiles & Footwear' },
    sub: [{ vi: 'May mặc OEM', en: 'OEM apparel' }, { vi: 'Vải & Sợi', en: 'Fabrics & Yarn' }, { vi: 'Giày dép', en: 'Footwear' }, { vi: 'Túi xách', en: 'Bags' }] },
  { id: 'c-furn', categoryCode: 'FURNITURE', icon: 'Sofa', image: IMG.sofa, productCount: 6930,
    categoryName: { vi: 'Đồ gỗ & Nội thất', en: 'Furniture & Wood' },
    sub: [{ vi: 'Nội thất phòng khách', en: 'Living room' }, { vi: 'Nội thất ngoài trời', en: 'Outdoor' }, { vi: 'Gỗ nguyên liệu', en: 'Timber' }, { vi: 'Nội thất khách sạn', en: 'Hospitality' }] },
  { id: 'c-elec', categoryCode: 'ELECTRONICS', icon: 'Cpu', image: IMG.headphones, productCount: 9580,
    categoryName: { vi: 'Điện tử & Linh kiện', en: 'Electronics & Components' },
    sub: [{ vi: 'Thiết bị âm thanh', en: 'Audio devices' }, { vi: 'Lắp ráp PCB', en: 'PCB assembly' }, { vi: 'Phụ kiện điện thoại', en: 'Mobile accessories' }, { vi: 'Thiết bị đeo', en: 'Wearables' }] },
  { id: 'c-craft', categoryCode: 'HANDICRAFT', icon: 'Gem', image: IMG.vases, productCount: 4210,
    categoryName: { vi: 'Thủ công mỹ nghệ & Gốm sứ', en: 'Handicrafts & Ceramics' },
    sub: [{ vi: 'Gốm sứ', en: 'Ceramics' }, { vi: 'Mây tre đan', en: 'Rattan & Bamboo' }, { vi: 'Sơn mài', en: 'Lacquerware' }, { vi: 'Quà tặng', en: 'Gifts' }] },
  { id: 'c-mech', categoryCode: 'MACHINERY', icon: 'Hammer', image: IMG.welding, productCount: 5320,
    categoryName: { vi: 'Cơ khí & Vật liệu', en: 'Machinery & Materials' },
    sub: [{ vi: 'Kết cấu thép', en: 'Steel structures' }, { vi: 'Gia công chính xác', en: 'Precision machining' }, { vi: 'Vật liệu xây dựng', en: 'Building materials' }] },
  { id: 'c-energy', categoryCode: 'ENERGY', icon: 'Zap', image: IMG.solar, productCount: 1280,
    categoryName: { vi: 'Năng lượng tái tạo', en: 'Renewable Energy' },
    sub: [{ vi: 'Tấm pin mặt trời', en: 'Solar panels' }, { vi: 'Biến tần', en: 'Inverters' }, { vi: 'Lưu trữ năng lượng', en: 'Energy storage' }] },
  { id: 'c-pack', categoryCode: 'PACKAGING', icon: 'Boxes', image: IMG.tote, productCount: 2760,
    categoryName: { vi: 'Bao bì & In ấn', en: 'Packaging & Printing' },
    sub: [{ vi: 'Túi thân thiện môi trường', en: 'Eco bags' }, { vi: 'Bao bì thực phẩm', en: 'Food packaging' }, { vi: 'Thùng carton', en: 'Cartons' }] },
  { id: 'c-logi', categoryCode: 'LOGISTICS', icon: 'Truck', image: IMG.port, productCount: 940,
    categoryName: { vi: 'Logistics & Dịch vụ', en: 'Logistics & Services' },
    sub: [{ vi: 'Vận tải biển', en: 'Ocean freight' }, { vi: 'Kho bãi', en: 'Warehousing' }, { vi: 'Thủ tục hải quan', en: 'Customs brokerage' }] },
]

/* ------------------------------------------------------------ businesses */
export type BusinessType =
  | 'VN_EXPORTER' | 'FOREIGN_IMPORTER' | 'FOREIGN_INVESTOR' | 'DISTRIBUTION_COMPANY' | 'INVESTMENT_CONSULTING' | 'LAW_FIRM'

export interface DocumentItem { id: string; type: string; name: string; url: string; uploadedAt: string }

export interface Business {
  id: string
  name: string
  nameEn: string
  industry: string[]
  categoryId: string
  taxCode: string
  address: string
  province: string
  country: string
  reputationScore: number
  website: string
  email: string
  phone: string
  employees: string
  founded: number
  businessType: BusinessType
  verified: boolean
  coverImage: string
  accent: string
  description: Bilingual
  capabilities: Bilingual[]
  markets: string[]
  responseRate: number
  responseTime: Bilingual
  documents: DocumentItem[]
}

const docs = (prefix: string): DocumentItem[] => [
  { id: `${prefix}-d1`, type: 'BUSINESS_LICENSE', name: 'Giấy chứng nhận ĐKDN.pdf', url: '#', uploadedAt: '2026-03-12' },
  { id: `${prefix}-d2`, type: 'CAPABILITY', name: 'Company_Profile_2026.pdf', url: '#', uploadedAt: '2026-05-02' },
  { id: `${prefix}-d3`, type: 'CERTIFICATE', name: 'ISO_Certificate.pdf', url: '#', uploadedAt: '2026-06-18' },
]

export const businesses: Business[] = [
  {
    id: 'b-caonguyen', name: 'Công ty CP Cà phê Cao Nguyên Xanh', nameEn: 'Highland Green Coffee JSC',
    industry: ['Coffee', 'Agriculture'], categoryId: 'c-agri', taxCode: '6000 412 857', address: 'KCN Hoà Phú, TP. Buôn Ma Thuột',
    province: 'Đắk Lắk', country: 'VN', reputationScore: 4.9, website: 'caonguyenxanh.example.vn', email: 'export@caonguyenxanh.example.vn',
    phone: '+84 262 3 812 456', employees: '500 – 1.000', founded: 2004, businessType: 'VN_EXPORTER', verified: true,
    coverImage: IMG.coffeeBeans, accent: '#7a4a1f', markets: ['DE', 'JP', 'KR', 'US', 'IT'], responseRate: 98,
    responseTime: { vi: '< 6 giờ', en: '< 6 hours' },
    description: {
      vi: 'Nhà sản xuất và xuất khẩu cà phê Robusta, Arabica hàng đầu Tây Nguyên với 3 nhà máy chế biến ướt, vùng nguyên liệu 4.200 ha đạt chứng nhận bền vững.',
      en: 'Leading Central Highlands producer and exporter of Robusta and Arabica, operating 3 wet-processing mills and 4,200 ha of certified sustainable farms.',
    },
    capabilities: [
      { vi: 'Công suất 60.000 tấn/năm', en: '60,000 MT annual capacity' },
      { vi: 'Phòng cupping đạt chuẩn SCA', en: 'SCA-standard cupping lab' },
      { vi: 'Truy xuất nguồn gốc đến từng nông hộ', en: 'Farm-level traceability' },
    ],
    documents: docs('b1'),
  },
  {
    id: 'b-mekong', name: 'Công ty TNHH Thuỷ sản Mekong Pearl', nameEn: 'Mekong Pearl Seafood Co., Ltd',
    industry: ['Seafood'], categoryId: 'c-sea', taxCode: '1800 559 214', address: 'KCN Trà Nóc 2, Q. Ô Môn', province: 'Cần Thơ',
    country: 'VN', reputationScore: 4.8, website: 'mekongpearl.example.vn', email: 'sales@mekongpearl.example.vn', phone: '+84 292 3 742 118',
    employees: '1.000 – 2.000', founded: 2009, businessType: 'VN_EXPORTER', verified: true, coverImage: IMG.shrimp, accent: '#c2410c',
    markets: ['JP', 'KR', 'US', 'AU', 'EU'], responseRate: 96, responseTime: { vi: '< 12 giờ', en: '< 12 hours' },
    description: {
      vi: 'Chuyên tôm sú, tôm thẻ đông lạnh và hải sản giá trị gia tăng cho thị trường Nhật Bản, Hàn Quốc và EU. Nhà máy đạt BRC hạng AA.',
      en: 'Specialist in frozen black tiger and vannamei shrimp plus value-added seafood for Japan, Korea and the EU. BRC grade AA plant.',
    },
    capabilities: [
      { vi: '4 dây chuyền IQF', en: '4 IQF lines' },
      { vi: 'Kho lạnh 8.000 tấn', en: '8,000 MT cold storage' },
      { vi: 'Ao nuôi đạt chuẩn ASC', en: 'ASC-certified farms' },
    ],
    documents: docs('b2'),
  },
  {
    id: 'b-songhong', name: 'Tổng công ty Dệt may Sông Hồng Việt', nameEn: 'Red River Viet Textile Corp.',
    industry: ['Textile', 'Apparel'], categoryId: 'c-tex', taxCode: '0600 118 330', address: 'KCN Hoà Xá, TP. Nam Định', province: 'Nam Định',
    country: 'VN', reputationScore: 4.7, website: 'songhongviet.example.vn', email: 'oem@songhongviet.example.vn', phone: '+84 228 3 649 220',
    employees: '5.000+', founded: 1998, businessType: 'VN_EXPORTER', verified: true, coverImage: IMG.clothesRack, accent: '#1d4ed8',
    markets: ['US', 'EU', 'AU', 'CA'], responseRate: 94, responseTime: { vi: '< 24 giờ', en: '< 24 hours' },
    description: {
      vi: 'Tổ hợp sợi – dệt – nhuộm – may khép kín, nhận OEM/ODM cho các thương hiệu thời trang quốc tế, ưu tiên vật liệu hữu cơ và tái chế.',
      en: 'Vertically integrated spinning, weaving, dyeing and sewing group delivering OEM/ODM for global fashion brands with organic and recycled fibres.',
    },
    capabilities: [
      { vi: '42 chuyền may', en: '42 sewing lines' },
      { vi: '2,4 triệu sản phẩm/tháng', en: '2.4M pieces / month' },
      { vi: 'Đạt chuẩn GOTS, OEKO-TEX', en: 'GOTS & OEKO-TEX certified' },
    ],
    documents: docs('b3'),
  },
  {
    id: 'b-phuongnam', name: 'Công ty CP Nội thất Gỗ Phương Nam', nameEn: 'Southwood Furniture JSC',
    industry: ['Furniture'], categoryId: 'c-furn', taxCode: '3700 884 512', address: 'KCN VSIP II, TP. Thủ Dầu Một', province: 'Bình Dương',
    country: 'VN', reputationScore: 4.8, website: 'southwood.example.vn', email: 'hello@southwood.example.vn', phone: '+84 274 3 635 900',
    employees: '1.000 – 2.000', founded: 2006, businessType: 'VN_EXPORTER', verified: true, coverImage: IMG.interior, accent: '#166534',
    markets: ['US', 'SE', 'DE', 'JP'], responseRate: 97, responseTime: { vi: '< 8 giờ', en: '< 8 hours' },
    description: {
      vi: 'Sản xuất nội thất gỗ keo, sồi và nệm bọc vải cho chuỗi bán lẻ Bắc Âu và Mỹ. 100% gỗ đạt chứng nhận FSC.',
      en: 'Manufacturer of acacia, oak and upholstered furniture for Nordic and US retail chains. 100% FSC-certified timber.',
    },
    capabilities: [
      { vi: 'Nhà xưởng 120.000 m²', en: '120,000 m² factory' },
      { vi: 'Đội thiết kế R&D 35 người', en: '35-person R&D design team' },
      { vi: '180 container/tháng', en: '180 containers / month' },
    ],
    documents: docs('b4'),
  },
  {
    id: 'b-saigontech', name: 'Công ty TNHH Linh kiện Điện tử Saigon Tech', nameEn: 'Saigon Tech Components Co., Ltd',
    industry: ['Electronics'], categoryId: 'c-elec', taxCode: '0315 220 774', address: 'Khu Công nghệ cao, TP. Thủ Đức', province: 'TP. Hồ Chí Minh',
    country: 'VN', reputationScore: 4.6, website: 'saigontech.example.vn', email: 'biz@saigontech.example.vn', phone: '+84 28 3 736 5520',
    employees: '200 – 500', founded: 2014, businessType: 'VN_EXPORTER', verified: true, coverImage: IMG.laptopDark, accent: '#4338ca',
    markets: ['US', 'JP', 'KR', 'SG'], responseRate: 92, responseTime: { vi: '< 24 giờ', en: '< 24 hours' },
    description: {
      vi: 'Lắp ráp PCB (SMT), thiết bị âm thanh không dây và thiết bị đeo thông minh theo đơn đặt hàng OEM/ODM.',
      en: 'SMT PCB assembly, wireless audio devices and smart wearables built to OEM/ODM specifications.',
    },
    capabilities: [
      { vi: '8 dây chuyền SMT', en: '8 SMT lines' },
      { vi: 'Phòng sạch ISO class 7', en: 'ISO class 7 cleanroom' },
      { vi: 'Kiểm thử RF nội bộ', en: 'In-house RF testing' },
    ],
    documents: docs('b5'),
  },
  {
    id: 'b-battrang', name: 'Công ty Gốm sứ Bát Tràng Heritage', nameEn: 'Bat Trang Heritage Ceramics',
    industry: ['Handicraft', 'Ceramics'], categoryId: 'c-craft', taxCode: '0101 772 096', address: 'Xã Bát Tràng, H. Gia Lâm', province: 'Hà Nội',
    country: 'VN', reputationScore: 4.9, website: 'battrangheritage.example.vn', email: 'export@battrangheritage.example.vn', phone: '+84 24 3 874 0215',
    employees: '100 – 200', founded: 1996, businessType: 'VN_EXPORTER', verified: true, coverImage: IMG.vases, accent: '#0e7490',
    markets: ['FR', 'JP', 'CA', 'US'], responseRate: 99, responseTime: { vi: '< 4 giờ', en: '< 4 hours' },
    description: {
      vi: 'Gốm men rạn, men lam thủ công từ làng nghề hơn 500 năm tuổi, phát triển dòng sản phẩm decor hiện đại cho thị trường quốc tế.',
      en: 'Handmade crackle and cobalt-glaze ceramics from a 500-year-old craft village, reimagined as modern decor for global buyers.',
    },
    capabilities: [
      { vi: '60 nghệ nhân', en: '60 master artisans' },
      { vi: 'Men không chì đạt FDA', en: 'FDA lead-free glazes' },
      { vi: 'Nhận thiết kế riêng từ 200 bộ', en: 'Custom designs from 200 sets' },
    ],
    documents: docs('b6'),
  },
  {
    id: 'b-nangvang', name: 'Công ty CP Năng lượng Nắng Vàng', nameEn: 'Golden Sun Energy JSC',
    industry: ['Energy'], categoryId: 'c-energy', taxCode: '4500 662 908', address: 'KCN Du Long, H. Thuận Bắc', province: 'Ninh Thuận',
    country: 'VN', reputationScore: 4.5, website: 'nangvang.example.vn', email: 'sales@nangvang.example.vn', phone: '+84 259 3 921 330',
    employees: '500 – 1.000', founded: 2017, businessType: 'VN_EXPORTER', verified: true, coverImage: IMG.solar, accent: '#b45309',
    markets: ['CL', 'AU', 'DE', 'IN'], responseRate: 90, responseTime: { vi: '< 24 giờ', en: '< 24 hours' },
    description: {
      vi: 'Sản xuất tấm pin mặt trời Mono PERC và TOPCon công suất 1,2 GW/năm, đạt chứng nhận IEC và TÜV.',
      en: '1.2 GW/year manufacturer of Mono PERC and TOPCon solar modules, IEC and TÜV certified.',
    },
    capabilities: [
      { vi: 'Công suất 1,2 GW/năm', en: '1.2 GW annual capacity' },
      { vi: 'Bảo hành hiệu suất 30 năm', en: '30-year performance warranty' },
      { vi: 'Dây chuyền tự động hoá 92%', en: '92% automated lines' },
    ],
    documents: docs('b7'),
  },
  {
    id: 'b-phuquoc', name: 'Công ty TNHH Gia vị & Nông sản Phú Quốc', nameEn: 'Phu Quoc Spice & Agro Co., Ltd',
    industry: ['Spices', 'Agriculture'], categoryId: 'c-agri', taxCode: '1701 993 475', address: 'KCN Thạnh Lộc, H. Châu Thành', province: 'Kiên Giang',
    country: 'VN', reputationScore: 4.7, website: 'phuquocspice.example.vn', email: 'trade@phuquocspice.example.vn', phone: '+84 297 3 866 412',
    employees: '200 – 500', founded: 2011, businessType: 'VN_EXPORTER', verified: true, coverImage: IMG.spoonSpices, accent: '#9f1239',
    markets: ['DE', 'NL', 'AE', 'US'], responseRate: 95, responseTime: { vi: '< 8 giờ', en: '< 8 hours' },
    description: {
      vi: 'Hồ tiêu, gạo thơm và trái cây nhiệt đới từ vùng Đồng bằng sông Cửu Long, xử lý hơi nước đạt chuẩn ASTA cho thị trường EU.',
      en: 'Pepper, fragrant rice and tropical fruit from the Mekong Delta, steam-sterilised to ASTA standards for the EU market.',
    },
    capabilities: [
      { vi: 'Hệ thống tiệt trùng hơi nước', en: 'Steam sterilisation line' },
      { vi: 'Phòng lab kiểm nghiệm dư lượng', en: 'Residue testing lab' },
      { vi: 'Đóng gói theo nhãn riêng', en: 'Private-label packing' },
    ],
    documents: docs('b8'),
  },
  {
    id: 'b-haiphong', name: 'Công ty CP Cơ khí Chính xác Hải Phòng', nameEn: 'Haiphong Precision Engineering JSC',
    industry: ['Machinery', 'Steel'], categoryId: 'c-mech', taxCode: '0200 448 617', address: 'KCN Đình Vũ, Q. Hải An', province: 'Hải Phòng',
    country: 'VN', reputationScore: 4.6, website: 'hpprecision.example.vn', email: 'rfq@hpprecision.example.vn', phone: '+84 225 3 979 660',
    employees: '500 – 1.000', founded: 2002, businessType: 'VN_EXPORTER', verified: true, coverImage: IMG.welding, accent: '#334155',
    markets: ['JP', 'AU', 'KR', 'US'], responseRate: 93, responseTime: { vi: '< 12 giờ', en: '< 12 hours' },
    description: {
      vi: 'Gia công kết cấu thép, chi tiết CNC chính xác cho ngành đóng tàu, năng lượng và công nghiệp nặng.',
      en: 'Steel structure fabrication and precision CNC parts for shipbuilding, energy and heavy industry.',
    },
    capabilities: [
      { vi: 'Hàn đạt chuẩn ISO 3834', en: 'ISO 3834 welding' },
      { vi: '64 máy CNC 5 trục', en: '64 five-axis CNC machines' },
      { vi: 'Cảng chuyên dụng sát nhà máy', en: 'Dedicated quay next to plant' },
    ],
    documents: docs('b9'),
  },
]

/* ------------------------------------------------------------ products */
export interface Product {
  id: string
  productCode: string
  productName: Bilingual
  categoryId: string
  organizationId: string
  industry: string
  description: Bilingual
  productImages: string[]
  origin: string
  unit: string
  moq: number
  priceFob: number
  priceCif: number
  paymentTerms: string
  certificates: string[]
  viewCount: number
  createdDate: string
  leadTime: Bilingual
  specs: { label: Bilingual; value: string }[]
}

const spec = (vi: string, en: string, value: string) => ({ label: { vi, en }, value })

export const products: Product[] = [
  {
    id: 'p-robusta', productCode: 'CNX-RB-S18', organizationId: 'b-caonguyen', categoryId: 'c-agri', industry: 'Coffee',
    productName: { vi: 'Cà phê nhân Robusta S18 sàng ướt', en: 'Robusta Green Coffee Beans S18, wet polished' },
    description: { vi: 'Hạt Robusta sàng 18, độ ẩm tối đa 12,5%, tạp chất dưới 0,1%. Thu hoạch chín trên 95%, phù hợp rang espresso và cà phê hoà tan cao cấp.', en: 'Screen 18 Robusta, max 12.5% moisture, under 0.1% foreign matter. Over 95% ripe-cherry harvest, ideal for espresso blends and premium instant coffee.' },
    productImages: [IMG.coffeeBeans, IMG.coffeeBag, IMG.latte], origin: 'Đắk Lắk, Việt Nam', unit: 'MT', moq: 19,
    priceFob: 4250, priceCif: 4480, paymentTerms: 'L/C at sight, CAD', certificates: ['Rainforest Alliance', 'ISO 22000', '4C'],
    viewCount: 18420, createdDate: '2026-10-21', leadTime: { vi: '15 – 20 ngày', en: '15 – 20 days' },
    specs: [spec('Độ ẩm', 'Moisture', '≤ 12.5%'), spec('Sàng', 'Screen size', 'S18 ≥ 90%'), spec('Đóng gói', 'Packing', 'Jute bag 60 kg / Big bag'), spec('Năng lực cung ứng', 'Supply capacity', '5,000 MT / month')],
  },
  {
    id: 'p-arabica', productCode: 'CNX-AR-CD', organizationId: 'b-caonguyen', categoryId: 'c-agri', industry: 'Coffee',
    productName: { vi: 'Cà phê Arabica Cầu Đất rang mộc specialty', en: 'Cau Dat Specialty Arabica, medium roast' },
    description: { vi: 'Arabica Catimor trồng ở độ cao 1.500 m, sơ chế honey, điểm cupping 84+. Rang mộc, đóng túi van một chiều theo nhãn riêng.', en: 'Catimor Arabica grown at 1,500 m, honey processed, 84+ cupping score. Medium roast, one-way valve bags, private label ready.' },
    productImages: [IMG.coffeeBag, IMG.latte, IMG.coffeeBeans], origin: 'Lâm Đồng, Việt Nam', unit: 'kg', moq: 500,
    priceFob: 18.5, priceCif: 20.2, paymentTerms: 'T/T 30% deposit', certificates: ['SCA 84+', 'HACCP'],
    viewCount: 9310, createdDate: '2026-10-25', leadTime: { vi: '10 ngày', en: '10 days' },
    specs: [spec('Độ cao', 'Altitude', '1,500 m'), spec('Sơ chế', 'Process', 'Honey'), spec('Hương vị', 'Notes', 'Caramel, citrus, cacao')],
  },
  {
    id: 'p-shrimp', productCode: 'MKP-BT-2630', organizationId: 'b-mekong', categoryId: 'c-sea', industry: 'Seafood',
    productName: { vi: 'Tôm sú nguyên con đông lạnh HOSO 26/30', en: 'Frozen Black Tiger Shrimp HOSO 26/30' },
    description: { vi: 'Tôm sú nuôi quảng canh cải tiến, cấp đông block hoặc IQF, mạ băng 10%. Kiểm tra kháng sinh từng lô theo chuẩn Nhật Bản.', en: 'Extensively farmed black tiger shrimp, block or IQF frozen with 10% glazing. Antibiotic-tested per lot to Japanese standards.' },
    productImages: [IMG.shrimp, IMG.warehouse, IMG.port], origin: 'Cà Mau, Việt Nam', unit: 'kg', moq: 2000,
    priceFob: 9.8, priceCif: 10.6, paymentTerms: 'L/C, D/P', certificates: ['HACCP', 'BRC AA', 'ASC'],
    viewCount: 15270, createdDate: '2026-10-19', leadTime: { vi: '20 – 25 ngày', en: '20 – 25 days' },
    specs: [spec('Cỡ', 'Size', '26/30 pcs/lb'), spec('Mạ băng', 'Glazing', '10%'), spec('Đóng gói', 'Packing', '6 × 1.8 kg / carton')],
  },
  {
    id: 'p-dragon', productCode: 'PQS-DF-W', organizationId: 'b-phuquoc', categoryId: 'c-agri', industry: 'Fruit',
    productName: { vi: 'Thanh long ruột trắng tươi xuất khẩu', en: 'Fresh White-flesh Dragon Fruit' },
    description: { vi: 'Thanh long Bình Thuận loại 1, 350 – 500 g/quả, xử lý hơi nước nóng (VHT) đáp ứng yêu cầu kiểm dịch Hàn Quốc, Nhật Bản.', en: 'Grade 1 Binh Thuan dragon fruit, 350 – 500 g each, vapour-heat treated to meet Korean and Japanese quarantine rules.' },
    productImages: [IMG.dragonfruit, IMG.warehouse], origin: 'Bình Thuận, Việt Nam', unit: 'kg', moq: 5000,
    priceFob: 1.1, priceCif: 1.45, paymentTerms: 'T/T', certificates: ['GlobalG.A.P.', 'VHT'],
    viewCount: 7120, createdDate: '2026-10-26', leadTime: { vi: '5 – 7 ngày', en: '5 – 7 days' },
    specs: [spec('Trọng lượng', 'Weight', '350 – 500 g'), spec('Bảo quản', 'Storage', '5 – 8 °C')],
  },
  {
    id: 'p-rice', productCode: 'PQS-RC-ST25', organizationId: 'b-phuquoc', categoryId: 'c-agri', industry: 'Rice',
    productName: { vi: 'Gạo thơm ST25 hạt dài 5% tấm', en: 'ST25 Fragrant Long-grain Rice, 5% broken' },
    description: { vi: 'Gạo thơm đặc sản Sóc Trăng, hạt dài trên 7 mm, cơm mềm dẻo, thơm lá dứa. Đóng bao PP 25 kg hoặc túi nhỏ nhãn riêng.', en: 'Soc Trang speciality fragrant rice, grains over 7 mm, soft texture with pandan aroma. PP 25 kg bags or private-label retail packs.' },
    productImages: [IMG.rice, IMG.warehouse], origin: 'Sóc Trăng, Việt Nam', unit: 'MT', moq: 25,
    priceFob: 720, priceCif: 790, paymentTerms: 'L/C at sight', certificates: ['HACCP', 'ISO 22000'],
    viewCount: 12880, createdDate: '2026-10-12', leadTime: { vi: '15 ngày', en: '15 days' },
    specs: [spec('Tấm', 'Broken', '≤ 5%'), spec('Độ ẩm', 'Moisture', '≤ 14%'), spec('Chiều dài hạt', 'Grain length', '≥ 7.0 mm')],
  },
  {
    id: 'p-pepper', productCode: 'PQS-BP-500', organizationId: 'b-phuquoc', categoryId: 'c-agri', industry: 'Spices',
    productName: { vi: 'Hồ tiêu đen 500 G/L tiệt trùng hơi nước', en: 'Black Pepper 500 G/L, steam sterilised' },
    description: { vi: 'Tiêu đen dung trọng 500 g/l, làm sạch và tiệt trùng hơi nước, đạt tiêu chuẩn ASTA và quy định dư lượng của EU.', en: 'Black pepper 500 g/l density, machine cleaned and steam sterilised, meeting ASTA and EU residue regulations.' },
    productImages: [IMG.spices, IMG.spoonSpices], origin: 'Phú Quốc, Việt Nam', unit: 'MT', moq: 12,
    priceFob: 6100, priceCif: 6350, paymentTerms: 'CAD, L/C', certificates: ['ASTA', 'HACCP', 'Halal'],
    viewCount: 8640, createdDate: '2026-10-08', leadTime: { vi: '12 ngày', en: '12 days' },
    specs: [spec('Dung trọng', 'Density', '500 g/l'), spec('Độ ẩm', 'Moisture', '≤ 12.5%'), spec('Vi sinh', 'Microbiology', 'Salmonella absent')],
  },
  {
    id: 'p-tshirt', productCode: 'SHV-TS-ORG', organizationId: 'b-songhong', categoryId: 'c-tex', industry: 'Apparel',
    productName: { vi: 'Áo thun cotton hữu cơ OEM 180 gsm', en: 'Organic Cotton T-shirt OEM, 180 gsm' },
    description: { vi: 'Cotton hữu cơ 100% chải kỹ, nhuộm hoạt tính, nhận in/ thêu logo và nhãn dệt theo yêu cầu. Bảng màu 40 màu có sẵn.', en: '100% combed organic cotton, reactive dyed, custom print/embroidery and woven labels. 40 stock colours available.' },
    productImages: [IMG.tshirts, IMG.clothesRack], origin: 'Nam Định, Việt Nam', unit: 'pcs', moq: 3000,
    priceFob: 3.2, priceCif: 3.5, paymentTerms: 'T/T 30/70', certificates: ['GOTS', 'OEKO-TEX', 'WRAP'],
    viewCount: 11030, createdDate: '2026-10-23', leadTime: { vi: '30 – 45 ngày', en: '30 – 45 days' },
    specs: [spec('Định lượng', 'Weight', '180 gsm'), spec('Size', 'Sizes', 'XS – 3XL'), spec('Năng lực', 'Capacity', '400,000 pcs / month')],
  },
  {
    id: 'p-athleisure', productCode: 'SHV-AT-SET', organizationId: 'b-songhong', categoryId: 'c-tex', industry: 'Apparel',
    productName: { vi: 'Bộ đồ thể thao nữ vải nỉ tái chế', en: "Women's Athleisure Set, recycled fleece" },
    description: { vi: 'Vải nỉ 320 gsm từ sợi polyester tái chế, phối màu theo mùa, đóng gói không nhựa.', en: '320 gsm fleece from recycled polyester, seasonal colourways, plastic-free packing.' },
    productImages: [IMG.apparel, IMG.clothesRack], origin: 'Nam Định, Việt Nam', unit: 'set', moq: 1000,
    priceFob: 8.9, priceCif: 9.6, paymentTerms: 'T/T 30/70', certificates: ['GRS', 'BSCI'],
    viewCount: 6420, createdDate: '2026-10-27', leadTime: { vi: '35 ngày', en: '35 days' },
    specs: [spec('Chất liệu', 'Fabric', 'Recycled PES fleece 320 gsm'), spec('Màu', 'Colours', '12 seasonal')],
  },
  {
    id: 'p-sofa', productCode: 'SWF-SF-3V', organizationId: 'b-phuongnam', categoryId: 'c-furn', industry: 'Furniture',
    productName: { vi: 'Sofa 3 chỗ bọc nhung khung gỗ sồi', en: '3-seat Velvet Sofa, solid oak frame' },
    description: { vi: 'Khung gỗ sồi FSC, đệm mút D40 bọc nhung chống bám bụi, chân kim loại sơn tĩnh điện. Đóng gói KD tiết kiệm 40% thể tích container.', en: 'FSC oak frame, D40 foam with anti-dust velvet, powder-coated legs. Knock-down packing saves 40% container space.' },
    productImages: [IMG.sofa, IMG.interior], origin: 'Bình Dương, Việt Nam', unit: 'pcs', moq: 50,
    priceFob: 289, priceCif: 335, paymentTerms: 'T/T 30/70, L/C', certificates: ['FSC', 'BSCI'],
    viewCount: 13750, createdDate: '2026-10-17', leadTime: { vi: '45 ngày', en: '45 days' },
    specs: [spec('Kích thước', 'Dimensions', '210 × 88 × 82 cm'), spec('Đóng gói', 'Packing', 'KD, 5-ply carton'), spec('Container 40HQ', '40HQ load', '96 pcs')],
  },
  {
    id: 'p-dining', productCode: 'SWF-DN-AC6', organizationId: 'b-phuongnam', categoryId: 'c-furn', industry: 'Furniture',
    productName: { vi: 'Bộ bàn ăn gỗ keo 6 ghế phong cách Bắc Âu', en: 'Acacia Dining Set for 6, Scandinavian style' },
    description: { vi: 'Gỗ keo rừng trồng, hoàn thiện dầu tự nhiên, phù hợp nhà hàng và hộ gia đình. Có phiên bản ngoài trời chống UV.', en: 'Plantation acacia with natural oil finish for homes and restaurants. UV-resistant outdoor version available.' },
    productImages: [IMG.restaurant, IMG.interior], origin: 'Bình Dương, Việt Nam', unit: 'set', moq: 30,
    priceFob: 410, priceCif: 468, paymentTerms: 'T/T 30/70', certificates: ['FSC'],
    viewCount: 5980, createdDate: '2026-10-24', leadTime: { vi: '40 ngày', en: '40 days' },
    specs: [spec('Mặt bàn', 'Table top', '180 × 90 cm'), spec('Hoàn thiện', 'Finish', 'Natural oil')],
  },
  {
    id: 'p-headphone', productCode: 'SGT-HP-ANC', organizationId: 'b-saigontech', categoryId: 'c-elec', industry: 'Electronics',
    productName: { vi: 'Tai nghe chống ồn chủ động không dây OEM', en: 'Wireless ANC Over-ear Headphones, OEM' },
    description: { vi: 'Bluetooth 5.4, chống ồn chủ động 42 dB, pin 60 giờ. Tuỳ biến vỏ, màu và firmware EQ theo thương hiệu.', en: 'Bluetooth 5.4, 42 dB active noise cancelling, 60-hour battery. Custom shells, colours and branded EQ firmware.' },
    productImages: [IMG.headphones, IMG.factory], origin: 'TP. Hồ Chí Minh, Việt Nam', unit: 'pcs', moq: 1000,
    priceFob: 18.6, priceCif: 19.4, paymentTerms: 'T/T', certificates: ['CE', 'FCC', 'RoHS'],
    viewCount: 16990, createdDate: '2026-10-22', leadTime: { vi: '30 ngày', en: '30 days' },
    specs: [spec('Chống ồn', 'ANC depth', '42 dB'), spec('Pin', 'Battery', '60 h'), spec('Kết nối', 'Connectivity', 'BT 5.4, USB-C')],
  },
  {
    id: 'p-watch', productCode: 'SGT-SW-PCB', organizationId: 'b-saigontech', categoryId: 'c-elec', industry: 'Electronics',
    productName: { vi: 'Đồng hồ thông minh – lắp ráp trọn gói', en: 'Smartwatch Full-turnkey Assembly' },
    description: { vi: 'Dịch vụ EMS trọn gói: thiết kế PCB, SMT, lắp ráp vỏ và kiểm thử chức năng cho đồng hồ thông minh.', en: 'Turnkey EMS: PCB design, SMT, housing assembly and functional testing for smartwatches.' },
    productImages: [IMG.watch, IMG.factory], origin: 'TP. Hồ Chí Minh, Việt Nam', unit: 'pcs', moq: 2000,
    priceFob: 12.4, priceCif: 13.1, paymentTerms: 'T/T 50/50', certificates: ['ISO 9001', 'RoHS'],
    viewCount: 4870, createdDate: '2026-10-11', leadTime: { vi: '40 ngày', en: '40 days' },
    specs: [spec('Màn hình', 'Display', '1.43" AMOLED'), spec('Chống nước', 'Water resistance', 'IP68')],
  },
  {
    id: 'p-vase', productCode: 'BTH-VS-CRK', organizationId: 'b-battrang', categoryId: 'c-craft', industry: 'Ceramics',
    productName: { vi: 'Bộ bình gốm men rạn thủ công 3 chiếc', en: 'Handmade Crackle-glaze Vase Set of 3' },
    description: { vi: 'Gốm Bát Tràng nung 1.250 °C, men rạn màu tro, mỗi chiếc là duy nhất. Nhận đặt màu men và in logo đáy.', en: 'Bat Trang stoneware fired at 1,250 °C with ash crackle glaze, every piece unique. Custom glaze colours and base stamp.' },
    productImages: [IMG.vases, IMG.interior], origin: 'Hà Nội, Việt Nam', unit: 'set', moq: 200,
    priceFob: 14, priceCif: 15.8, paymentTerms: 'T/T 30/70', certificates: ['FDA lead-free'],
    viewCount: 7760, createdDate: '2026-10-20', leadTime: { vi: '30 ngày', en: '30 days' },
    specs: [spec('Chiều cao', 'Heights', '18 / 24 / 32 cm'), spec('Nhiệt độ nung', 'Firing', '1,250 °C')],
  },
  {
    id: 'p-solar', productCode: 'GSE-PV-550', organizationId: 'b-nangvang', categoryId: 'c-energy', industry: 'Energy',
    productName: { vi: 'Tấm pin mặt trời Mono PERC 550W', en: 'Mono PERC Solar Module 550W' },
    description: { vi: 'Hiệu suất 21,3%, cell half-cut 144, khung nhôm anod, chịu tải gió 2.400 Pa. Bảo hành sản phẩm 12 năm.', en: '21.3% efficiency, 144 half-cut cells, anodised frame, 2,400 Pa wind load. 12-year product warranty.' },
    productImages: [IMG.solar, IMG.factory], origin: 'Ninh Thuận, Việt Nam', unit: 'pcs', moq: 200,
    priceFob: 98, priceCif: 110, paymentTerms: 'L/C, T/T', certificates: ['IEC 61215', 'IEC 61730', 'TÜV'],
    viewCount: 10320, createdDate: '2026-10-15', leadTime: { vi: '25 ngày', en: '25 days' },
    specs: [spec('Công suất', 'Power', '550 Wp'), spec('Hiệu suất', 'Efficiency', '21.3%'), spec('Kích thước', 'Dimensions', '2279 × 1134 × 35 mm')],
  },
  {
    id: 'p-tote', productCode: 'SHV-TB-JT', organizationId: 'b-songhong', categoryId: 'c-pack', industry: 'Packaging',
    productName: { vi: 'Túi tote vải canvas tái chế in logo', en: 'Recycled Canvas Tote Bag, custom print' },
    description: { vi: 'Canvas tái chế 12 oz, quai dài 65 cm, in lụa hoặc in chuyển nhiệt theo nhận diện thương hiệu.', en: '12 oz recycled canvas, 65 cm handles, screen or heat-transfer printing to brand guidelines.' },
    productImages: [IMG.tote, IMG.clothesRack], origin: 'Nam Định, Việt Nam', unit: 'pcs', moq: 5000,
    priceFob: 1.35, priceCif: 1.5, paymentTerms: 'T/T', certificates: ['GRS'],
    viewCount: 3940, createdDate: '2026-10-26', leadTime: { vi: '20 ngày', en: '20 days' },
    specs: [spec('Kích thước', 'Size', '38 × 42 cm'), spec('Chất liệu', 'Material', 'Recycled canvas 12 oz')],
  },
  {
    id: 'p-steel', productCode: 'HPE-SS-FAB', organizationId: 'b-haiphong', categoryId: 'c-mech', industry: 'Machinery',
    productName: { vi: 'Gia công kết cấu thép theo bản vẽ', en: 'Custom Steel Structure Fabrication' },
    description: { vi: 'Nhận gia công kết cấu thép nhà xưởng, module ngoài khơi và chi tiết máy theo bản vẽ, sơn phủ theo chuẩn ISO 12944.', en: 'Fabrication of industrial steel structures, offshore modules and machine parts to drawing, coated per ISO 12944.' },
    productImages: [IMG.welding, IMG.factory, IMG.port], origin: 'Hải Phòng, Việt Nam', unit: 'MT', moq: 10,
    priceFob: 1450, priceCif: 1590, paymentTerms: 'L/C, T/T', certificates: ['ISO 3834', 'ISO 9001'],
    viewCount: 4410, createdDate: '2026-10-09', leadTime: { vi: '30 – 60 ngày', en: '30 – 60 days' },
    specs: [spec('Vật liệu', 'Material', 'S355 / SS400'), spec('Sơn phủ', 'Coating', 'ISO 12944 C4-C5')],
  },
]

/* ------------------------------------------------------------ import requests */
export interface ImportRequest {
  id: string
  requestCode: string
  requestName: Bilingual
  description: Bilingual
  productType: string
  categoryId: string
  organizationName: string
  organizationEmail: string
  organizationPhone: string
  country: string
  countryName: Bilingual
  address: string
  price: number
  quantity: number
  unit: string
  startTime: string
  endTime: string
  status: 'OPEN' | 'CLOSED'
  viewCount: number
  quoteCount: number
  requirements: Bilingual[]
}

const day = (offset: number, hour = 9) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export const importRequests: ImportRequest[] = [
  {
    id: 'r-1042', requestCode: 'IR-2026-1042', categoryId: 'c-sea', productType: 'Frozen shrimp',
    requestName: { vi: 'Cần mua tôm sú đông lạnh HOSO 26/30', en: 'Buying frozen black tiger shrimp HOSO 26/30' },
    description: { vi: 'Chuỗi siêu thị tại Seoul cần nhà cung cấp ổn định cho mùa Tết âm lịch 2027, giao hàng chia 4 đợt.', en: 'Seoul supermarket chain seeks a steady supplier for Lunar New Year 2027, delivered in 4 shipments.' },
    organizationName: 'Seoul Fresh Mart Co., Ltd', organizationEmail: 'sourcing@seoulfresh.example.kr', organizationPhone: '+82 2 555 0192',
    country: 'KR', countryName: { vi: 'Hàn Quốc', en: 'South Korea' }, address: 'Busan Port', price: 9.5, quantity: 40000, unit: 'kg',
    startTime: day(-3), endTime: day(18), status: 'OPEN', viewCount: 1284, quoteCount: 14,
    requirements: [{ vi: 'Chứng nhận HACCP, BRC', en: 'HACCP, BRC certified' }, { vi: 'Mạ băng tối đa 10%', en: 'Max 10% glazing' }, { vi: 'Thanh toán L/C', en: 'Payment by L/C' }],
  },
  {
    id: 'r-1041', requestCode: 'IR-2026-1041', categoryId: 'c-furn', productType: 'Outdoor furniture',
    requestName: { vi: 'Tìm nhà sản xuất bàn ghế ngoài trời gỗ keo FSC', en: 'Sourcing FSC acacia outdoor furniture sets' },
    description: { vi: 'Nhà bán lẻ nội thất Bắc Âu tìm đối tác OEM cho bộ sưu tập Xuân – Hè 2027, thiết kế do bên mua cung cấp.', en: 'Nordic furniture retailer seeks OEM partner for Spring–Summer 2027 collection; buyer supplies designs.' },
    organizationName: 'Nordic Home AB', organizationEmail: 'buying@nordichome.example.se', organizationPhone: '+46 31 700 2210',
    country: 'SE', countryName: { vi: 'Thuỵ Điển', en: 'Sweden' }, address: 'Gothenburg', price: 180, quantity: 600, unit: 'set',
    startTime: day(-1), endTime: day(25), status: 'OPEN', viewCount: 942, quoteCount: 9,
    requirements: [{ vi: '100% gỗ FSC', en: '100% FSC timber' }, { vi: 'Đóng gói KD', en: 'Knock-down packing' }, { vi: 'Kiểm định BSCI', en: 'BSCI audit' }],
  },
  {
    id: 'r-1040', requestCode: 'IR-2026-1040', categoryId: 'c-agri', productType: 'Green coffee',
    requestName: { vi: 'Thu mua cà phê nhân Arabica specialty 84+', en: 'Buying specialty Arabica green coffee 84+' },
    description: { vi: 'Nhà rang xay tại Osaka cần 1 container Arabica sơ chế honey hoặc natural, có mẫu cupping trước khi ký hợp đồng.', en: 'Osaka roaster needs one container of honey or natural Arabica; cupping samples required before contract.' },
    organizationName: 'Osaka Trading KK', organizationEmail: 'coffee@osakatrading.example.jp', organizationPhone: '+81 6 6110 4422',
    country: 'JP', countryName: { vi: 'Nhật Bản', en: 'Japan' }, address: 'Osaka Port', price: 6800, quantity: 18, unit: 'MT',
    startTime: day(-6), endTime: day(9), status: 'OPEN', viewCount: 1530, quoteCount: 21,
    requirements: [{ vi: 'Điểm cupping ≥ 84', en: 'Cupping ≥ 84' }, { vi: 'Gửi mẫu 300 g', en: '300 g samples' }],
  },
  {
    id: 'r-1039', requestCode: 'IR-2026-1039', categoryId: 'c-tex', productType: 'Organic apparel',
    requestName: { vi: 'Đặt may áo thun cotton hữu cơ nhãn riêng', en: 'Private-label organic cotton tees' },
    description: { vi: 'Chuỗi bán lẻ tại Úc cần 25.000 áo thun basic, 6 màu, giao FOB Hải Phòng hoặc Cát Lái.', en: 'Australian retail chain needs 25,000 basic tees in 6 colours, FOB Haiphong or Cat Lai.' },
    organizationName: 'Pacific Retail Group', organizationEmail: 'apparel@pacificretail.example.au', organizationPhone: '+61 2 8000 3311',
    country: 'AU', countryName: { vi: 'Úc', en: 'Australia' }, address: 'Sydney', price: 3.0, quantity: 25000, unit: 'pcs',
    startTime: day(-2), endTime: day(30), status: 'OPEN', viewCount: 688, quoteCount: 7,
    requirements: [{ vi: 'GOTS hoặc OCS', en: 'GOTS or OCS' }, { vi: 'Nhà máy đạt WRAP', en: 'WRAP-certified factory' }],
  },
  {
    id: 'r-1038', requestCode: 'IR-2026-1038', categoryId: 'c-agri', productType: 'Spices',
    requestName: { vi: 'Cần nhập hồ tiêu đen 550 G/L chuẩn ASTA', en: 'Importing ASTA black pepper 550 G/L' },
    description: { vi: 'Nhà nhập khẩu gia vị Đức tìm nguồn hồ tiêu tiệt trùng hơi nước, hợp đồng khung 12 tháng.', en: 'German spice importer seeks steam-sterilised pepper on a 12-month frame contract.' },
    organizationName: 'Bavaria Import GmbH', organizationEmail: 'spice@bavariaimport.example.de', organizationPhone: '+49 40 3300 9182',
    country: 'DE', countryName: { vi: 'Đức', en: 'Germany' }, address: 'Hamburg', price: 6200, quantity: 48, unit: 'MT',
    startTime: day(-8), endTime: day(6), status: 'OPEN', viewCount: 1102, quoteCount: 12,
    requirements: [{ vi: 'Đạt quy định dư lượng EU', en: 'EU MRL compliant' }, { vi: 'Hợp đồng khung 12 tháng', en: '12-month frame contract' }],
  },
  {
    id: 'r-1037', requestCode: 'IR-2026-1037', categoryId: 'c-agri', productType: 'Rice',
    requestName: { vi: 'Mua 500 tấn gạo thơm hạt dài', en: 'Buying 500 MT fragrant long-grain rice' },
    description: { vi: 'Nhà phân phối thực phẩm UAE cần gạo thơm 5% tấm đóng bao 25 kg, giao CIF Jebel Ali.', en: 'UAE food distributor needs 5% broken fragrant rice in 25 kg bags, CIF Jebel Ali.' },
    organizationName: 'Gulf Foods LLC', organizationEmail: 'procurement@gulffoods.example.ae', organizationPhone: '+971 4 880 1200',
    country: 'AE', countryName: { vi: 'UAE', en: 'UAE' }, address: 'Jebel Ali', price: 700, quantity: 500, unit: 'MT',
    startTime: day(0), endTime: day(21), status: 'OPEN', viewCount: 412, quoteCount: 3,
    requirements: [{ vi: 'Chứng nhận Halal', en: 'Halal certified' }, { vi: 'Bao PP 25 kg', en: '25 kg PP bags' }],
  },
  {
    id: 'r-1036', requestCode: 'IR-2026-1036', categoryId: 'c-energy', productType: 'Solar modules',
    requestName: { vi: 'Đấu thầu cung cấp 4.000 tấm pin 550W', en: 'Tender: 4,000 × 550W solar modules' },
    description: { vi: 'Nhà phát triển dự án điện mặt trời tại Chile cần tấm pin Mono PERC cho dự án 2,2 MW.', en: 'Chilean solar developer needs Mono PERC modules for a 2.2 MW project.' },
    organizationName: 'Andes Energy SpA', organizationEmail: 'tenders@andesenergy.example.cl', organizationPhone: '+56 2 2900 4410',
    country: 'CL', countryName: { vi: 'Chile', en: 'Chile' }, address: 'Valparaíso', price: 95, quantity: 4000, unit: 'pcs',
    startTime: day(-4), endTime: day(14), status: 'OPEN', viewCount: 865, quoteCount: 6,
    requirements: [{ vi: 'Danh sách Tier 1 hoặc tương đương', en: 'Tier 1 or equivalent' }, { vi: 'IEC 61215 / 61730', en: 'IEC 61215 / 61730' }],
  },
  {
    id: 'r-1035', requestCode: 'IR-2026-1035', categoryId: 'c-craft', productType: 'Ceramics',
    requestName: { vi: 'Tìm xưởng gốm thủ công cho bộ sưu tập decor', en: 'Handmade ceramic studio for decor line' },
    description: { vi: 'Thương hiệu decor Canada cần 1.200 bộ bình gốm men rạn, màu men theo bảng Pantone của bên mua.', en: 'Canadian decor brand needs 1,200 crackle-glaze vase sets in buyer Pantone colours.' },
    organizationName: 'Maple Craft Inc.', organizationEmail: 'studio@maplecraft.example.ca', organizationPhone: '+1 604 555 0148',
    country: 'CA', countryName: { vi: 'Canada', en: 'Canada' }, address: 'Vancouver', price: 15, quantity: 1200, unit: 'set',
    startTime: day(-5), endTime: day(12), status: 'OPEN', viewCount: 534, quoteCount: 5,
    requirements: [{ vi: 'Men không chì (FDA)', en: 'Lead-free glaze (FDA)' }, { vi: 'Đóng gói chống vỡ', en: 'Drop-tested packing' }],
  },
]

/* ------------------------------------------------------------ events */
export type EventType = 'WEBINAR' | 'LIVESTREAM' | 'MATCHMAKING'
export type EventStatus = 'UPCOMING' | 'ONGOING' | 'ENDED'

export interface EventAgendaOption { agendaStartTime: string; agendaEndTime: string; agendaTitle: Bilingual; speaker?: string }

export interface EventItem {
  id: string
  eventType: EventType
  title: Bilingual
  introduction: Bilingual
  coverImage: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  eventStatus: EventStatus
  industry: string[]
  participationFee: number
  participationFeeCurrency: 'VND' | 'USD'
  registeredSlots: number
  maxSlots: number
  organizedBy: Bilingual
  location: Bilingual
  agendaOptions: EventAgendaOption[]
  viewers?: number
  /** B2B extensions (from VCCI event forms) */
  series?: Bilingual
  partner?: Bilingual
  targetMarket?: Bilingual
  eligibility?: Bilingual[]
  requiredSections?: SectionKey[]
  registrationDeadline?: string
  quota?: number
  contact?: { name: string; phone: string; email: string; zalo?: string }
  speakers?: { name: string; title: Bilingual; org: Bilingual }[]
  topics?: Bilingual[]
  questions?: { id: string; label: Bilingual; options?: Bilingual[] }[]
}

export const events: EventItem[] = [
  {
    id: 'e-giz-eu', eventType: 'MATCHMAKING', eventStatus: 'UPCOMING', coverImage: IMG.handshake,
    title: { vi: 'Kết nối giao thương doanh nghiệp Việt Nam – CHLB Đức & châu Âu', en: 'Vietnam – Germany & EU Business Matchmaking' },
    introduction: { vi: 'VCCI xét chọn hồ sơ và chắp mối trực tuyến doanh nghiệp Việt Nam với doanh nghiệp Đức, châu Âu phù hợp. Thực hiện với sự hỗ trợ của Tổ chức Hợp tác Quốc tế Đức (GIZ).', en: 'VCCI screens profiles and arranges online meetings between Vietnamese companies and suitable German and EU partners, supported by GIZ.' },
    startDate: day(34, 9), endDate: day(150, 17), startTime: '09:00', endTime: '17:00', industry: ['Food', 'Packaging', 'Cosmetics', 'Handicraft', 'Machinery', 'Electronics'],
    participationFee: 0, participationFeeCurrency: 'VND', registeredSlots: 64, maxSlots: 100,
    organizedBy: { vi: 'VCCI', en: 'VCCI' }, location: { vi: 'Trực tuyến (chắp mối 1-1)', en: 'Online (1-on-1 meetings)' },
    partner: { vi: 'Tổ chức Hợp tác Quốc tế Đức (GIZ)', en: 'Deutsche Gesellschaft für Internationale Zusammenarbeit (GIZ)' },
    targetMarket: { vi: 'CHLB Đức & châu Âu', en: 'Germany & EU' },
    registrationDeadline: day(32, 23), quota: 100,
    eligibility: [
      { vi: 'Doanh nghiệp Việt Nam có sản phẩm thuộc 6 lĩnh vực ưu tiên', en: 'Vietnamese companies in the 6 priority sectors' },
      { vi: 'Có năng lực cung ứng cho đơn hàng xuất khẩu', en: 'Able to supply export orders' },
      { vi: 'Hồ sơ năng lực và nhu cầu hợp tác đầy đủ trên VCCI Trade Hub', en: 'Complete capability and needs profile on VCCI Trade Hub' },
    ],
    requiredSections: ['general', 'capability', 'exports', 'finance', 'needs', 'consent'],
    contact: { name: 'Chị Thành', phone: '0912 933 834', email: 'thanhltk@vcci.com.vn', zalo: '0912 933 834' },
    agendaOptions: [
      { agendaStartTime: 'B1', agendaEndTime: '', agendaTitle: { vi: 'Đăng ký & hoàn thiện hồ sơ (đến hạn đăng ký)', en: 'Registration & profile completion (until deadline)' } },
      { agendaStartTime: 'B2', agendaEndTime: '', agendaTitle: { vi: 'VCCI & GIZ xét chọn, ghép đối tác phù hợp', en: 'VCCI & GIZ screen and match partners' } },
      { agendaStartTime: 'B3', agendaEndTime: '', agendaTitle: { vi: 'Gặp gỡ trực tuyến 1-1 (12/2026 – 03/2027)', en: 'Online 1-on-1 meetings (Dec 2026 – Mar 2027)' } },
      { agendaStartTime: 'B4', agendaEndTime: '', agendaTitle: { vi: 'Theo dõi kết quả & hỗ trợ sau kết nối', en: 'Follow-up & post-meeting support' } },
    ],
    questions: [
      { id: 'q-expect', label: { vi: 'Đề xuất hoặc nhu cầu cụ thể khi trao đổi với doanh nghiệp Đức, châu Âu', en: 'Specific proposals or needs for German / EU partners' } },
    ],
  },
  {
    id: 'e-eu-talk18', eventType: 'WEBINAR', eventStatus: 'UPCOMING', coverImage: IMG.discussion,
    title: { vi: 'Tiếp cận thị trường châu Âu: Các yêu cầu và khuyến nghị cho doanh nghiệp', en: 'Entering the EU market: requirements and recommendations' },
    introduction: { vi: 'Buổi trò chuyện trực tuyến về cơ hội và yêu cầu của thị trường châu Âu, kinh nghiệm thực tiễn đáp ứng yêu cầu nhà mua hàng, cùng gợi ý cho doanh nghiệp.', en: 'An online talk on EU market opportunities and requirements, practical experience meeting buyer demands, and recommendations.' },
    startDate: day(1, 20), endDate: day(1, 22), startTime: '20:00', endTime: '22:00', industry: ['Multi-industry'],
    participationFee: 0, participationFeeCurrency: 'VND', registeredSlots: 268, maxSlots: 500,
    organizedBy: { vi: 'VCCI', en: 'VCCI' }, location: { vi: 'Trực tuyến qua Zoom', en: 'Online via Zoom' },
    series: { vi: 'Trò chuyện Doanh nghiệp số 18', en: 'Business Talk #18' },
    targetMarket: { vi: 'Liên minh châu Âu', en: 'European Union' },
    requiredSections: ['general', 'attendees', 'consent'],
    contact: { name: 'Ban Tổ chức', phone: '0912 933 834', email: 'thanhltk@vcci.com.vn' },
    topics: [
      { vi: 'Cơ hội và yêu cầu của thị trường châu Âu', en: 'EU market opportunities and requirements' },
      { vi: 'Kinh nghiệm thực tiễn tiếp cận thị trường, đáp ứng yêu cầu nhà mua hàng', en: 'Practical experience meeting buyer requirements' },
      { vi: 'Một số gợi ý cho doanh nghiệp', en: 'Recommendations for businesses' },
    ],
    speakers: [
      { name: 'Nguyễn Thị Hoàng Thúy', title: { vi: 'Tham tán Thương mại', en: 'Trade Counsellor' }, org: { vi: 'Thương vụ Việt Nam tại Thụy Điển (kiêm Đan Mạch, Na Uy, Iceland, Latvia)', en: 'Vietnam Trade Office in Sweden (also DK, NO, IS, LV)' } },
      { name: 'Trần Văn Hiếu', title: { vi: 'Nhà sáng lập kiêm CEO', en: 'Founder & CEO' }, org: { vi: 'Công ty DACE', en: 'DACE' } },
    ],
    agendaOptions: [
      { agendaStartTime: '20:00', agendaEndTime: '20:45', agendaTitle: { vi: 'Cơ hội và yêu cầu của thị trường châu Âu', en: 'EU opportunities and requirements' }, speaker: 'Nguyễn Thị Hoàng Thúy' },
      { agendaStartTime: '20:45', agendaEndTime: '21:30', agendaTitle: { vi: 'Kinh nghiệm thực tiễn đáp ứng nhà mua hàng', en: 'Meeting buyer requirements in practice' }, speaker: 'Trần Văn Hiếu' },
      { agendaStartTime: '21:30', agendaEndTime: '22:00', agendaTitle: { vi: 'Hỏi đáp', en: 'Q&A' } },
    ],
    questions: [
      { id: 'q-expect', label: { vi: 'Kỳ vọng lớn nhất sau buổi trò chuyện', en: 'Your main expectation' }, options: [
        { vi: 'Nắm được quy định, yêu cầu của thị trường châu Âu', en: 'Understand EU rules and requirements' },
        { vi: 'Tìm đầu mối hỗ trợ, cơ hội hợp tác', en: 'Find support contacts and partners' },
        { vi: 'Được diễn giả tư vấn vướng mắc cụ thể', en: 'Get advice on specific issues' },
      ] },
      { id: 'q-speaker', label: { vi: 'Câu hỏi dành cho diễn giả', en: 'Question for the speakers' } },
    ],
  },
  {
    id: 'e-krfood', eventType: 'LIVESTREAM', eventStatus: 'ONGOING', coverImage: IMG.stage,
    title: { vi: 'Livestream kết nối giao thương Việt Nam – Hàn Quốc ngành thực phẩm 2026', en: 'Vietnam – Korea Food Trade Matching Livestream 2026' },
    introduction: { vi: '30 doanh nghiệp xuất khẩu giới thiệu sản phẩm trực tiếp tới 120 nhà nhập khẩu Hàn Quốc, kết hợp phiên B2B 1-1 sau livestream.', en: '30 Vietnamese exporters pitch live to 120 Korean importers, followed by 1-on-1 B2B matching sessions.' },
    startDate: day(0, 9), endDate: day(0, 17), startTime: '09:00', endTime: '17:00', industry: ['Food', 'Seafood'],
    participationFee: 0, participationFeeCurrency: 'VND', registeredSlots: 30, maxSlots: 30,
    organizedBy: { vi: 'VCCI & KOTRA Hà Nội', en: 'VCCI & KOTRA Hanoi' }, location: { vi: 'Trực tuyến', en: 'Online' }, viewers: 2486,
    agendaOptions: [
      { agendaStartTime: '09:00', agendaEndTime: '09:30', agendaTitle: { vi: 'Khai mạc & tổng quan thị trường Hàn Quốc', en: 'Opening & Korean market outlook' }, speaker: 'VCCI' },
      { agendaStartTime: '09:30', agendaEndTime: '12:00', agendaTitle: { vi: 'Showcase: nông sản & cà phê', en: 'Showcase: produce & coffee' } },
      { agendaStartTime: '13:30', agendaEndTime: '16:00', agendaTitle: { vi: 'Showcase: thuỷ sản & thực phẩm chế biến', en: 'Showcase: seafood & processed food' } },
      { agendaStartTime: '16:00', agendaEndTime: '17:00', agendaTitle: { vi: 'Kết nối B2B 1-1', en: '1-on-1 B2B matching' } },
    ],
  },
  {
    id: 'e-evfta', eventType: 'WEBINAR', eventStatus: 'UPCOMING', coverImage: IMG.hall,
    title: { vi: 'Hội thảo: Tận dụng EVFTA cho doanh nghiệp xuất khẩu nông sản', en: 'Webinar: Leveraging EVFTA for agri-food exporters' },
    introduction: { vi: 'Chuyên gia thương mại phân tích quy tắc xuất xứ, lộ trình thuế và các rào cản kỹ thuật mới của EU năm 2027.', en: 'Trade experts unpack rules of origin, tariff schedules and new EU technical barriers for 2027.' },
    startDate: day(6, 14), endDate: day(6, 17), startTime: '14:00', endTime: '17:00', industry: ['Agriculture'],
    participationFee: 0, participationFeeCurrency: 'VND', registeredSlots: 412, maxSlots: 500,
    organizedBy: { vi: 'Trung tâm WTO và Hội nhập – VCCI', en: 'VCCI Center for WTO & Integration' }, location: { vi: 'Zoom/Jitsi trực tuyến', en: 'Online (Jitsi)' },
    agendaOptions: [
      { agendaStartTime: '14:00', agendaEndTime: '14:45', agendaTitle: { vi: 'Quy tắc xuất xứ & C/O mẫu EUR.1', en: 'Rules of origin & EUR.1 certificates' }, speaker: 'TS. Nguyễn Minh An' },
      { agendaStartTime: '14:45', agendaEndTime: '15:30', agendaTitle: { vi: 'Quy định chống phá rừng EUDR', en: 'EU Deforestation Regulation (EUDR)' }, speaker: 'ThS. Lê Hải Yến' },
      { agendaStartTime: '15:45', agendaEndTime: '17:00', agendaTitle: { vi: 'Hỏi đáp cùng doanh nghiệp', en: 'Q&A with businesses' } },
    ],
  },
  {
    id: 'e-furniture', eventType: 'LIVESTREAM', eventStatus: 'UPCOMING', coverImage: IMG.interior,
    title: { vi: 'Vietnam Furniture Sourcing Week – Livestream showroom', en: 'Vietnam Furniture Sourcing Week – Live showroom' },
    introduction: { vi: 'Tham quan trực tuyến 40 showroom nội thất tại Bình Dương và Đồng Nai, đặt lịch gặp nhà máy ngay trên nền tảng.', en: 'Virtual tour of 40 furniture showrooms in Binh Duong and Dong Nai, with on-platform factory meeting booking.' },
    startDate: day(12, 9), endDate: day(14, 17), startTime: '09:00', endTime: '17:00', industry: ['Furniture'],
    participationFee: 1500000, participationFeeCurrency: 'VND', registeredSlots: 31, maxSlots: 40,
    organizedBy: { vi: 'VCCI chi nhánh TP.HCM', en: 'VCCI Ho Chi Minh City Branch' }, location: { vi: 'Trực tuyến + Bình Dương', en: 'Online + Binh Duong' },
    agendaOptions: [
      { agendaStartTime: '09:00', agendaEndTime: '11:30', agendaTitle: { vi: 'Ngày 1: Nội thất phòng khách', en: 'Day 1: Living room' } },
      { agendaStartTime: '09:00', agendaEndTime: '11:30', agendaTitle: { vi: 'Ngày 2: Nội thất ngoài trời', en: 'Day 2: Outdoor' } },
      { agendaStartTime: '09:00', agendaEndTime: '11:30', agendaTitle: { vi: 'Ngày 3: Nội thất khách sạn', en: 'Day 3: Hospitality' } },
    ],
  },
  {
    id: 'e-cbam', eventType: 'WEBINAR', eventStatus: 'UPCOMING', coverImage: IMG.welding,
    title: { vi: 'CBAM của EU: tác động tới ngành thép, nhôm và xi măng', en: 'EU CBAM: impact on steel, aluminium and cement' },
    introduction: { vi: 'Hướng dẫn kê khai phát thải, chuẩn bị dữ liệu carbon và chiến lược giữ thị phần tại EU từ 2026.', en: 'How to report embedded emissions, prepare carbon data and protect EU market share from 2026.' },
    startDate: day(19, 9), endDate: day(19, 11), startTime: '09:00', endTime: '11:30', industry: ['Machinery', 'Steel'],
    participationFee: 500000, participationFeeCurrency: 'VND', registeredSlots: 186, maxSlots: 300,
    organizedBy: { vi: 'VCCI & Hiệp hội Thép Việt Nam', en: 'VCCI & Vietnam Steel Association' }, location: { vi: 'Trực tuyến', en: 'Online' },
    agendaOptions: [
      { agendaStartTime: '09:00', agendaEndTime: '10:00', agendaTitle: { vi: 'Cơ chế CBAM giai đoạn chính thức', en: 'CBAM definitive period' }, speaker: 'Chuyên gia EU' },
      { agendaStartTime: '10:00', agendaEndTime: '11:30', agendaTitle: { vi: 'Thực hành tính phát thải', en: 'Hands-on emissions calculation' } },
    ],
  },
  {
    id: 'e-japan', eventType: 'WEBINAR', eventStatus: 'ENDED', coverImage: IMG.meeting,
    title: { vi: 'Xuất khẩu thuỷ sản sang Nhật Bản: tiêu chuẩn & thủ tục', en: 'Exporting seafood to Japan: standards & procedures' },
    introduction: { vi: 'Bản ghi hội thảo về kiểm dịch, dư lượng kháng sinh và kênh phân phối thuỷ sản tại Nhật Bản.', en: 'Recording on quarantine, antibiotic residues and seafood distribution channels in Japan.' },
    startDate: day(-10, 14), endDate: day(-10, 16), startTime: '14:00', endTime: '16:30', industry: ['Seafood'],
    participationFee: 0, participationFeeCurrency: 'VND', registeredSlots: 380, maxSlots: 400,
    organizedBy: { vi: 'VCCI & JETRO', en: 'VCCI & JETRO' }, location: { vi: 'Trực tuyến', en: 'Online' },
    agendaOptions: [{ agendaStartTime: '14:00', agendaEndTime: '16:30', agendaTitle: { vi: 'Toàn bộ phiên', en: 'Full session' } }],
  },
  {
    id: 'e-asean', eventType: 'LIVESTREAM', eventStatus: 'ENDED', coverImage: IMG.audience,
    title: { vi: 'Ngày hội kết nối nhà phân phối ASEAN 2026', en: 'ASEAN Distributor Connect Day 2026' },
    introduction: { vi: 'Hơn 600 lượt kết nối B2B giữa doanh nghiệp Việt Nam và nhà phân phối từ 9 nước ASEAN.', en: 'Over 600 B2B meetings between Vietnamese firms and distributors from 9 ASEAN countries.' },
    startDate: day(-24, 9), endDate: day(-24, 17), startTime: '09:00', endTime: '17:00', industry: ['Multi-industry'],
    participationFee: 0, participationFeeCurrency: 'VND', registeredSlots: 220, maxSlots: 220,
    organizedBy: { vi: 'VCCI', en: 'VCCI' }, location: { vi: 'Hà Nội + trực tuyến', en: 'Hanoi + online' },
    agendaOptions: [{ agendaStartTime: '09:00', agendaEndTime: '17:00', agendaTitle: { vi: 'Toàn bộ phiên', en: 'Full session' } }],
  },
]

/* ------------------------------------------------------------ sponsors & misc */
export type SponsorTier = 'MAIN' | 'GOLD' | 'PARTNER'

/** GET /api/public/sponsors — tier & tagline come from the CMS advertisement module (UC-EAM). */
export const sponsors: { id: string; name: string; mark: string; tier: SponsorTier; color: string; tagline?: Bilingual; url?: string }[] = [
  { id: 's1', name: 'SaoViet Bank', mark: 'SV', tier: 'MAIN', color: '#0b4f8a', url: '#',
    tagline: { vi: 'Đồng hành tài chính thương mại cho doanh nghiệp xuất khẩu Việt Nam — L/C, bảo lãnh và thanh toán quốc tế trong 24h.', en: 'Trade finance partner for Vietnamese exporters — L/Cs, guarantees and cross-border payments within 24h.' } },
  { id: 's2', name: 'MekongLog', mark: 'ML', tier: 'GOLD', color: '#0f766e', tagline: { vi: 'Logistics đa phương thức', en: 'Multimodal logistics' } },
  { id: 's3', name: 'Lotus Insurance', mark: 'LI', tier: 'GOLD', color: '#be123c', tagline: { vi: 'Bảo hiểm hàng hoá xuất nhập khẩu', en: 'Cargo insurance' } },
  { id: 's4', name: 'AsiaPay Hub', mark: 'AP', tier: 'GOLD', color: '#6d28d9', tagline: { vi: 'Cổng thanh toán B2B', en: 'B2B payment gateway' } },
  { id: 's5', name: 'Delta Freight', mark: 'DF', tier: 'PARTNER', color: '#1d4ed8' },
  { id: 's6', name: 'Hanoi Expo Center', mark: 'HE', tier: 'PARTNER', color: '#b45309' },
  { id: 's7', name: 'GreenPack', mark: 'GP', tier: 'PARTNER', color: '#15803d' },
  { id: 's8', name: 'TechBridge VN', mark: 'TB', tier: 'PARTNER', color: '#334155' },
  { id: 's9', name: 'Viet Trade Law', mark: 'VL', tier: 'PARTNER', color: '#7c2d12' },
  { id: 's10', name: 'Saigon Port Group', mark: 'SP', tier: 'PARTNER', color: '#0e7490' },
]

/* ------------------------------------------------------------ testimonials (from fair / livestream attendees) */
export const testimonials: { id: string; name: string; company: string; country: string; countryName: Bilingual; role: Bilingual; rating: number; event: Bilingual; quote: Bilingual; accent: string }[] = [
  { id: 't1', name: 'Kim Ji-ho', company: 'Seoul Fresh Mart', country: 'KR', countryName: { vi: 'Hàn Quốc', en: 'South Korea' }, role: { vi: 'Trưởng phòng thu mua', en: 'Head of Sourcing' }, rating: 5, accent: '#2563eb',
    event: { vi: 'Livestream Việt Nam – Hàn Quốc 2026', en: 'Vietnam – Korea Livestream 2026' },
    quote: { vi: 'Chỉ trong một buổi livestream, chúng tôi đã chốt được hai nhà cung cấp tôm đạt chuẩn BRC. Huy hiệu xác thực VCCI giúp tiết kiệm hàng tuần kiểm tra hồ sơ.', en: 'In a single livestream we shortlisted two BRC-certified shrimp suppliers. The VCCI Verified badge saved us weeks of due diligence.' } },
  { id: 't2', name: 'Erik Lindqvist', company: 'Nordic Home AB', country: 'SE', countryName: { vi: 'Thuỵ Điển', en: 'Sweden' }, role: { vi: 'Giám đốc sản phẩm', en: 'Product Director' }, rating: 5, accent: '#0f766e',
    event: { vi: 'Vietnam Furniture Sourcing Week', en: 'Vietnam Furniture Sourcing Week' },
    quote: { vi: 'Yêu cầu nhập khẩu của chúng tôi nhận 9 báo giá trong 48 giờ, tất cả đều có chứng nhận FSC đính kèm. Quy trình rõ ràng hơn nhiều so với các sàn khác.', en: 'Our import request got 9 quotes within 48 hours, every one with FSC certificates attached. Far clearer than other marketplaces.' } },
  { id: 't3', name: 'Nguyễn Thị Hạnh', company: 'Cà phê Cao Nguyên Xanh', country: 'VN', countryName: { vi: 'Việt Nam', en: 'Vietnam' }, role: { vi: 'Giám đốc xuất khẩu', en: 'Export Director' }, rating: 5, accent: '#b45309',
    event: { vi: 'Hội thảo EVFTA cho nông sản', en: 'EVFTA webinar for agri-food' },
    quote: { vi: 'Sau hội thảo EVFTA, chúng tôi điều chỉnh hồ sơ xuất xứ và có đơn hàng đầu tiên sang Đức trong ba tháng. Trợ lý pháp lý AI trả lời cả những câu rất cụ thể.', en: 'After the EVFTA webinar we fixed our origin paperwork and landed our first German order within three months. The AI legal assistant even handles very specific questions.' } },
  { id: 't4', name: 'Kenji Watanabe', company: 'Osaka Trading KK', country: 'JP', countryName: { vi: 'Nhật Bản', en: 'Japan' }, role: { vi: 'Chuyên viên nhập khẩu', en: 'Import Specialist' }, rating: 5, accent: '#9f1239',
    event: { vi: 'Ngày hội kết nối ASEAN 2026', en: 'ASEAN Connect Day 2026' },
    quote: { vi: 'Lịch gặp B2B được sắp xếp rất chuyên nghiệp. Chúng tôi gặp 12 nhà rang xay và nông trại chỉ trong một ngày.', en: 'B2B meetings were scheduled very professionally. We met 12 roasters and farms in a single day.' } },
  { id: 't5', name: 'Trần Minh Quân', company: 'Nội thất Gỗ Phương Nam', country: 'VN', countryName: { vi: 'Việt Nam', en: 'Vietnam' }, role: { vi: 'Tổng giám đốc', en: 'CEO' }, rating: 5, accent: '#166534',
    event: { vi: 'Vietnam Furniture Sourcing Week', en: 'Vietnam Furniture Sourcing Week' },
    quote: { vi: 'Showroom livestream giúp người mua Bắc Âu xem nhà máy thực tế mà không cần bay sang. Tỉ lệ phản hồi báo giá của chúng tôi tăng gấp đôi.', en: 'The live showroom let Nordic buyers tour our factory without flying in. Our quote reply rate doubled.' } },
  { id: 't6', name: 'Lucas Ferreira', company: 'Andes Energy SpA', country: 'CL', countryName: { vi: 'Chile', en: 'Chile' }, role: { vi: 'Quản lý dự án', en: 'Project Manager' }, rating: 4, accent: '#4338ca',
    event: { vi: 'Sàn yêu cầu nhập khẩu', en: 'Import request marketplace' },
    quote: { vi: 'Lần đầu tìm nguồn pin mặt trời từ Việt Nam và mọi thứ minh bạch: hồ sơ năng lực, chứng nhận IEC, tất cả trong một trang.', en: 'Our first time sourcing solar modules from Vietnam, and everything was transparent: capability decks, IEC certificates, all on one page.' } },
]

export const activityFeed: { country: string; text: Bilingual; ago: Bilingual }[] = [
  { country: 'KR', text: { vi: 'Seoul Fresh Mart vừa đăng yêu cầu 40 tấn tôm sú', en: 'Seoul Fresh Mart posted a request for 40 MT shrimp' }, ago: { vi: '2 phút trước', en: '2 min ago' } },
  { country: 'SE', text: { vi: 'Nordic Home AB đã nhận 9 báo giá nội thất', en: 'Nordic Home AB received 9 furniture quotes' }, ago: { vi: '6 phút trước', en: '6 min ago' } },
  { country: 'JP', text: { vi: 'Osaka Trading đang xem hồ sơ Cà phê Cao Nguyên Xanh', en: 'Osaka Trading is viewing Highland Green Coffee' }, ago: { vi: '9 phút trước', en: '9 min ago' } },
  { country: 'AE', text: { vi: 'Gulf Foods LLC cần 500 tấn gạo thơm', en: 'Gulf Foods LLC needs 500 MT fragrant rice' }, ago: { vi: '14 phút trước', en: '14 min ago' } },
  { country: 'DE', text: { vi: 'Bavaria Import đã đăng ký hội thảo EVFTA', en: 'Bavaria Import registered for the EVFTA webinar' }, ago: { vi: '21 phút trước', en: '21 min ago' } },
]

export const trendingKeywords: Bilingual[] = [
  { vi: 'Cà phê Robusta', en: 'Robusta coffee' },
  { vi: 'Tôm sú', en: 'Black tiger shrimp' },
  { vi: 'Nội thất gỗ FSC', en: 'FSC furniture' },
  { vi: 'Pin mặt trời', en: 'Solar panels' },
  { vi: 'Áo thun hữu cơ', en: 'Organic tees' },
  { vi: 'Hồ tiêu', en: 'Black pepper' },
]

export const countryName: Record<string, Bilingual> = {
  DE: { vi: 'Đức', en: 'Germany' }, JP: { vi: 'Nhật Bản', en: 'Japan' }, KR: { vi: 'Hàn Quốc', en: 'Korea' },
  US: { vi: 'Hoa Kỳ', en: 'USA' }, IT: { vi: 'Ý', en: 'Italy' }, AU: { vi: 'Úc', en: 'Australia' }, EU: { vi: 'EU', en: 'EU' },
  CA: { vi: 'Canada', en: 'Canada' }, SE: { vi: 'Thuỵ Điển', en: 'Sweden' }, SG: { vi: 'Singapore', en: 'Singapore' },
  FR: { vi: 'Pháp', en: 'France' }, CL: { vi: 'Chile', en: 'Chile' }, IN: { vi: 'Ấn Độ', en: 'India' },
  NL: { vi: 'Hà Lan', en: 'Netherlands' }, AE: { vi: 'UAE', en: 'UAE' },
}

