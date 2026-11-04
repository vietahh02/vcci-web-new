/** /account/catalog - a business's own products and what it takes to trade shows (live mode, signed-in only). The second tab holds products in ONLINE shows, and booths when an OFFLINE/HYBRID show exists. */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { USE_MOCK, tokens } from '@/api'
import { MyBooths } from '@/components/catalog/MyBooths'
import { MyProducts } from '@/components/catalog/MyProducts'
import { buttonClass } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { tx } from '@/lib/tx'
import { cn } from '@/lib/utils'

export default function MyCatalog() {
  useI18n()
  const [tab, setTab] = useState<'products' | 'booths'>('products')
  const tabs = [
    { k: 'products' as const, label: tx('Sản phẩm của tôi', 'My products', '내 제품') },
    { k: 'booths' as const, label: tx('Hội chợ của tôi', 'My trade shows', '내 박람회') },
  ]
  if (USE_MOCK || !tokens.access()) {
    return (
      <div className="container-page py-24 text-center">
        <p className="font-semibold">{tx('Vui lòng đăng nhập bằng tài khoản doanh nghiệp để quản lý sản phẩm và hội chợ.', 'Sign in with a business account to manage products and trade shows.', '제품과 박람회를 관리하려면 기업 계정으로 로그인하세요.')}</p>
        <Link to="/login?return=/account/catalog" className={buttonClass('default', 'md', 'mt-6')}>{tx('Đăng nhập', 'Sign in', '로그인')}</Link>
      </div>
    )
  }
  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-extrabold tracking-tight">{tx('Quản lý sản phẩm & hội chợ', 'Products & trade shows', '제품 및 박람회 관리')}</h1>
      <div className="mt-6 flex gap-1 border-b">
        {tabs.map((x) => (
          <button key={x.k} onClick={() => setTab(x.k)} className={cn('-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold', tab === x.k ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>{x.label}</button>
        ))}
      </div>
      <div className="mt-6">{tab === 'products' ? <MyProducts /> : <MyBooths />}</div>
    </div>
  )
}
