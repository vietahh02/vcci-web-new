import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { ChevronDown, ChevronRight, FilePlus2, LayoutGrid, LogOut, Menu, MessageSquare, Moon, Phone, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { chatApi, chatConfigured } from '@/api/chat'
import { tokens } from '@/api/http'
import { categories } from '@/data/mock'
import { categoryIcons, Logo } from '@/components/brand'
import { LiveDot } from '@/components/effects'
import { LangSwitcher } from '@/components/layout/LangSwitcher'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { SearchBar } from '@/components/layout/SearchBar'
import { SheetContent, Tooltip } from '@/components/ui/overlay'
import { buttonClass } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'
import { useTheme } from '@/lib/theme'
import { completion, useProfile } from '@/lib/profile'
import { tx } from '@/lib/tx'
import { cn, formatNumber, img } from '@/lib/utils'

export function Header() {
  const { t } = useI18n()
  const { theme, toggle } = useTheme()
  const { session, profile, signOut } = useProfile()
  const navigate = useNavigate()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'
  const [chatUnread, setChatUnread] = useState(0)

  // số tin chưa đọc (B2B + hỗ trợ) cho nút Tin nhắn; làm mới khi đổi trang
  useEffect(() => {
    if (!session || !chatConfigured() || !tokens.access()) return
    let alive = true
    chatApi.unreadCount().then((u) => alive && setChatUnread(u.total), () => undefined)
    return () => {
      alive = false
    }
  }, [session, location.pathname])
  const unreadShown = session ? chatUnread : 0

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 40))

  const navItems = [
    { to: '/search', label: t.nav.products },
    { to: '/suppliers', label: t.nav.suppliers },
    { to: '/requests', label: t.nav.requests },
    { to: '/events', label: t.nav.events },
    { to: '/events', label: t.nav.live, live: true },
    { to: '/legal-ai', label: t.nav.legal },
    { to: '/about', label: t.nav.about },
  ]

  return (
    <header className="sticky top-0 z-50">
      {/* utility bar */}
      <motion.div
        initial={false}
        animate={{ height: scrolled ? 0 : 34, opacity: scrolled ? 0 : 1 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden bg-navy text-white/75"
      >
        <div className="container-page flex h-[34px] items-center justify-between gap-6 text-[12px]">
          <p className="min-w-0 truncate">
            <span className="mr-2 inline-block size-1.5 rounded-full bg-gold-bright align-middle" />
            {t.top.official}
          </p>
          <div className="hidden shrink-0 items-center gap-5 whitespace-nowrap lg:flex">
            <Link to="/search" className="hover:text-white">{t.top.buyers}</Link>
            <Link to="/register" className="hover:text-white">{t.top.suppliers}</Link>
            <Link to="/about" className="hover:text-white">{t.top.help}</Link>
            <span className="inline-flex items-center gap-1.5"><Phone className="size-3" /> {t.top.hotline}: 1900 6 1111</span>
          </div>
        </div>
      </motion.div>

      {/* main bar */}
      <div className={cn('border-b transition-[background,box-shadow] duration-300', scrolled ? 'glass shadow-[0_8px_30px_-12px_rgb(8_8_46/0.18)]' : 'bg-background')}>
        <div className="container-page flex h-[68px] items-center gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
          <button className="-ml-2 rounded-full p-2 transition-all duration-200 hover:bg-primary-soft hover:text-primary lg:hidden" onClick={() => setMobileOpen(true)} aria-label={t.ui.menu}>
            <Menu className="size-5" />
          </button>
          <Logo className="shrink-0" />
          <div className={cn('hidden flex-1 transition-all duration-500 md:block', isHome && !scrolled && 'pointer-events-none opacity-0 md:-translate-y-1')}>
            <SearchBar autoFocusKey={!isHome || scrolled} />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Link to="/requests?post=1" className={buttonClass('gold', 'sm', 'mr-1 hidden h-9 xl:inline-flex')}>
              <FilePlus2 /> {t.nav.postRequest}
            </Link>
            <Tooltip content={t.nav.messages}>
              <Link to="/messages" className="relative hidden rounded-full p-2.5 text-muted-foreground transition-all duration-200 hover:bg-primary-soft hover:text-primary hover:shadow-sm sm:block" aria-label={t.nav.messages}>
                <MessageSquare className="size-[18px]" />
                {unreadShown > 0 && <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-live text-[9px] font-bold text-white">{unreadShown > 9 ? '9+' : unreadShown}</span>}
              </Link>
            </Tooltip>
            <NotificationBell />
            <LangSwitcher />
            <button onClick={toggle} className="rounded-full p-2.5 text-muted-foreground transition-all duration-200 hover:bg-primary-soft hover:text-primary hover:shadow-sm" aria-label={t.ui.theme}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }} className="block">
                  {theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
                </motion.span>
              </AnimatePresence>
            </button>
            {session ? (
              <>
              <Link to="/account/catalog" className={buttonClass('ghost', 'sm', 'ml-2 hidden h-9 xl:inline-flex')}>{tx('Sản phẩm & gian hàng', 'Products & booths', '제품 및 부스')}</Link>
              <Link to="/account/profile" className="ml-2 flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-3 transition hover:bg-muted" title={tx('Hồ sơ doanh nghiệp của tôi', 'My company profile')}>
                <span className="relative grid size-9 place-items-center">
                  <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="var(--border)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="16" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeDasharray={100.5} strokeDashoffset={100.5 - (100.5 * completion(profile)) / 100} />
                  </svg>
                  <span className="text-[10px] font-bold">{completion(profile)}%</span>
                </span>
                <span className="hidden max-w-40 truncate text-[13px] font-semibold 2xl:block">{profile.general.nameEn || session.companyName}</span>
              </Link>
              <Tooltip content={tx('Đăng xuất', 'Sign out', '로그아웃')}>
                <button
                  onClick={() => { signOut(); navigate('/') }}
                  className="rounded-full p-2.5 text-muted-foreground transition-all duration-200 hover:bg-primary-soft hover:text-primary hover:shadow-sm"
                  aria-label={tx('Đăng xuất', 'Sign out', '로그아웃')}
                >
                  <LogOut className="size-[18px]" />
                </button>
              </Tooltip>
              </>
            ) : (
              <div className="ml-2 hidden items-center gap-2 lg:flex">
                <Link to="/login" className={buttonClass('ghost', 'sm', 'h-9')}>{t.nav.login}</Link>
                <Link to="/register" className={buttonClass('default', 'sm', 'h-9')}>{t.nav.register}</Link>
              </div>
            )}
          </div>
        </div>

        {/* nav row */}
        <nav className="container-page hidden h-11 items-center gap-1 lg:flex" onMouseLeave={() => setMegaOpen(false)}>
          <button
            onMouseEnter={() => setMegaOpen(true)}
            onClick={() => setMegaOpen((v) => !v)}
            className={cn('mr-1 inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 text-[13px] font-bold transition xl:mr-3', megaOpen ? 'bg-primary text-primary-foreground' : 'bg-primary-soft text-primary hover:bg-primary hover:text-primary-foreground')}
            aria-expanded={megaOpen}
          >
            <LayoutGrid className="size-4" />
            {t.nav.allCategories}
            <ChevronDown className={cn('size-3.5 transition-transform', megaOpen && 'rotate-180')} />
          </button>
          {navItems.map((n) => (
            <NavLink
              key={n.label}
              to={n.to}
              onMouseEnter={() => setMegaOpen(false)}
              className={({ isActive }) =>
                cn('relative inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[13px] font-semibold transition-colors hover:bg-muted xl:px-3 xl:text-[13.5px]', isActive ? 'text-primary' : 'text-foreground/80 hover:text-foreground')
              }
            >
              {({ isActive }) => (
                <>
                  {n.live && <LiveDot className="text-live" />}
                  {n.label}
                  {isActive && <motion.span layoutId="nav-underline" className="absolute inset-x-3 -bottom-[5px] h-0.5 rounded-full bg-primary" />}
                </>
              )}
            </NavLink>
          ))}
          <MegaMenu open={megaOpen} onClose={() => setMegaOpen(false)} />
        </nav>
      </div>

      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} items={navItems} />
    </header>
  )
}

function MegaMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, L, locale } = useI18n()
  const [active, setActive] = useState(categories[0]?.id)
  const cat = categories.find((c) => c.id === active)

  return (
    <AnimatePresence>
      {open && cat && (
        <motion.div
          initial={{ opacity: 0, y: -8, clipPath: 'inset(0 0 100% 0 round 16px)' }}
          animate={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0 round 16px)' }}
          exit={{ opacity: 0, y: -8, clipPath: 'inset(0 0 100% 0 round 16px)' }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-x-0 top-full z-40 pt-2"
        >
          <div className="container-page">
            <div className="grid grid-cols-[280px_1fr_300px] overflow-hidden rounded-3xl border bg-popover shadow-2xl shadow-navy/15">
              <ul className="border-r bg-muted/50 p-2">
                {categories.map((c) => {
                  const Icon = categoryIcons[c.icon]
                  return (
                    <li key={c.id}>
                      <Link
                        to={`/search?category=${c.id}`}
                        onMouseEnter={() => setActive(c.id)}
                        onClick={onClose}
                        className={cn('relative flex items-center gap-3 rounded-full px-3 py-2 text-[13.5px] font-medium transition-colors', active === c.id ? 'text-primary' : 'text-foreground/80')}
                      >
                        {active === c.id && <motion.span layoutId="mega-active" className="absolute inset-0 rounded-full bg-background shadow-sm ring-1 ring-border" transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }} />}
                        <Icon className="relative size-4" />
                        <span className="relative flex-1">{L(c.categoryName)}</span>
                        <ChevronRight className="relative size-3.5 opacity-50" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
              <AnimatePresence mode="wait">
                <motion.div key={cat.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {formatNumber(cat.productCount, locale)} {t.nav.products_count}
                  </p>
                  <h3 className="mt-1 text-xl font-extrabold">{L(cat.categoryName)}</h3>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {cat.sub.map((s) => (
                      <Link
                        key={s.en}
                        to={`/search?category=${cat.id}&q=${encodeURIComponent(L(s))}`}
                        onClick={onClose}
                        className="group flex items-center justify-between rounded-full border px-3 py-2.5 text-sm font-medium transition hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
                      >
                        {L(s)}
                        <ChevronRight className="size-4 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                      </Link>
                    ))}
                  </div>
                  <Link to={`/search?category=${cat.id}`} onClick={onClose} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                    {t.nav.viewAllIn} {L(cat.categoryName)} <ChevronRight className="size-4" />
                  </Link>
                </motion.div>
              </AnimatePresence>
              <div className="relative overflow-hidden">
                <AnimatePresence mode="popLayout">
                  <motion.img
                    key={cat.image}
                    src={img(cat.image, 600, 700)}
                    alt=""
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 size-full object-cover"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="text-xs font-semibold text-gold-bright">{t.common.verified}</p>
                  <p className="mt-1 text-lg font-bold leading-snug">{L(cat.categoryName)}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function MobileNav({ open, onOpenChange, items }: { open: boolean; onOpenChange: (v: boolean) => void; items: { to: string; label: string; live?: boolean }[] }) {
  const { t, L } = useI18n()
  const { session, signOut } = useProfile()
  const navigate = useNavigate()
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" title={t.brand.name} description={t.brand.tagline}>
        <div className="p-4">
          <SearchBar />
          <nav className="mt-4 flex flex-col">
            {items.map((n) => (
              <NavLink
                key={n.label}
                to={n.to}
                onClick={() => onOpenChange(false)}
                className={({ isActive }) => cn('flex items-center gap-2 rounded-lg px-3 py-3 text-[15px] font-semibold', isActive ? 'bg-primary-soft text-primary' : 'hover:bg-muted')}
              >
                {n.live && <LiveDot className="text-live" />}
                {n.label}
              </NavLink>
            ))}
          </nav>
          <p className="mb-2 mt-5 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.nav.allCategories}</p>
          <div className="grid grid-cols-2 gap-1">
            {categories.map((c) => {
              const Icon = categoryIcons[c.icon]
              return (
                <Link key={c.id} to={`/search?category=${c.id}`} onClick={() => onOpenChange(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] hover:bg-muted">
                  <Icon className="size-4 text-primary" /> <span className="truncate">{L(c.categoryName)}</span>
                </Link>
              )
            })}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            {session ? (
              <>
                <Link to="/account/catalog" onClick={() => onOpenChange(false)} className={buttonClass('outline', 'md', 'h-auto min-h-10 whitespace-normal py-2 text-center leading-tight')}>{tx('Sản phẩm & gian hàng', 'Products & booths', '제품 및 부스')}</Link>
                <Link to="/account/profile" onClick={() => onOpenChange(false)} className={buttonClass('default', 'md', 'h-auto min-h-10 whitespace-normal py-2 text-center leading-tight')}>{tx('Hồ sơ doanh nghiệp', 'Company profile', '기업 프로필')}</Link>
                <button
                  onClick={() => { onOpenChange(false); signOut(); navigate('/') }}
                  className={buttonClass('ghost', 'md', 'col-span-2 gap-2 text-muted-foreground')}
                >
                  <LogOut className="size-4" /> {tx('Đăng xuất', 'Sign out', '로그아웃')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => onOpenChange(false)} className={buttonClass('outline')}>{t.nav.login}</Link>
                <Link to="/register" onClick={() => onOpenChange(false)} className={buttonClass('default')}>{t.nav.register}</Link>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </DialogPrimitive.Root>
  )
}
