import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Route, Routes, useLocation, useNavigationType } from 'react-router-dom'
import { ScrollProgress } from '@/components/effects'
import { ChatWidget } from '@/components/layout/ChatWidget'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { ToastProvider, TooltipProvider } from '@/components/ui/overlay'
import { I18nProvider } from '@/lib/i18n'
import { ThemeProvider } from '@/lib/theme'
import { ProfileProvider } from '@/lib/profile'
import MyProfile from '@/pages/MyProfile'
import About from '@/pages/About'
import { ForgotPassword, Login, Register, ResetPassword } from '@/pages/Auth'
import { Help, Privacy, Terms } from '@/pages/Help'
import EventDetail from '@/pages/EventDetail'
import Favorites from '@/pages/Favorites'
import Following from '@/pages/Following'
import EventRegister from '@/pages/EventRegister'
import Events from '@/pages/Events'
import Home from '@/pages/Home'
import LegalAI from '@/pages/LegalAI'
import LiveRoom from '@/pages/LiveRoom'
import { LegacyRoomRedirect } from '@/components/live/LegacyRoomRedirect'
import Messages from '@/pages/Messages'
import MyCatalog from '@/pages/MyCatalog'
import Notifications from '@/pages/Notifications'
import ProductEditPage from '@/pages/ProductEdit'
import NotFound from '@/pages/NotFound'
import ProductDetail from '@/pages/ProductDetail'
import RequestDetail from '@/pages/RequestDetail'
import Requests from '@/pages/Requests'
import SearchPage from '@/pages/Search'
import SupplierProfile from '@/pages/SupplierProfile'
import Suppliers from '@/pages/Suppliers'

/** Vị trí cuộn theo từng lần điều hướng (location.key); khôi phục khi bấm Back/Forward. */
const scrollPositions = new Map<string, number>()

/**
 * Đổi đường dẫn mới → về đầu trang. Back/Forward → khôi phục đúng vị trí đã rời.
 * Không dùng khôi phục mặc định của trình duyệt: lúc đó trang chi tiết (dài) còn hiện trong hiệu ứng thoát nên vị trí bị
 * kẹp xuống cuối khi trang danh sách (ngắn, đang tải) thay vào. Ở đây ta chờ nội dung đủ dài rồi mới cuộn.
 */
function ScrollToTop() {
  const { pathname, key } = useLocation()
  const navType = useNavigationType()
  const prevPath = useRef(pathname)

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
  }, [])

  // ghi nhớ vị trí cuộn của trang hiện tại cho tới khi rời đi
  useEffect(() => {
    const save = () => scrollPositions.set(key, window.scrollY)
    window.addEventListener('scroll', save, { passive: true })
    return () => window.removeEventListener('scroll', save)
  }, [key])

  useEffect(() => {
    const samePath = prevPath.current === pathname
    prevPath.current = pathname
    const target = navType === 'POP' ? scrollPositions.get(key) : undefined
    if (target == null || target <= 0) {
      // trang mới (hoặc Back về vị trí đầu): chỉ cuộn lên đầu khi đổi đường dẫn, đổi ?query (phân trang, lọc) giữ nguyên
      if (!samePath || navType === 'POP') window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
      return
    }
    let frame = 0
    let tries = 0
    const attempt = () => {
      const reachable = document.documentElement.scrollHeight - window.innerHeight
      if (reachable >= target - 2 || tries > 120) {
        window.scrollTo({ top: Math.min(target, Math.max(reachable, 0)), behavior: 'instant' as ScrollBehavior })
        return
      }
      tries += 1
      frame = requestAnimationFrame(attempt)
    }
    // chờ hiệu ứng thoát của trang cũ (AnimatePresence, ~0.35s) xong để đo chiều cao của trang MỚI, rồi mới khôi phục
    const timer = window.setTimeout(() => { frame = requestAnimationFrame(attempt) }, 450)
    return () => { window.clearTimeout(timer); cancelAnimationFrame(frame) }
  }, [pathname, key, navType])
  return null
}

export default function App() {
  const location = useLocation()
  const bare = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname)

  return (
    <ThemeProvider>
      <I18nProvider>
      <ProfileProvider>
        <MotionConfig reducedMotion="user">
          <TooltipProvider>
            <ToastProvider>
              <ScrollToTop />
              <ScrollProgress />
              {!bare && <Header />}
              <AnimatePresence mode="wait">
                <motion.main
                  key={location.pathname}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="min-h-[60vh]"
                >
                  <Routes location={location}>
                    <Route path="/" element={<Home />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/suppliers" element={<Suppliers />} />
                    <Route path="/suppliers/:id" element={<SupplierProfile />} />
                    <Route path="/requests" element={<Requests />} />
                    <Route path="/requests/:id" element={<RequestDetail />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/events/:id" element={<EventDetail />} />
                    <Route path="/events/:id/register" element={<EventRegister />} />
                    <Route path="/live/:id" element={<LiveRoom />} />
                    <Route path="/webinar-room/:id" element={<LegacyRoomRedirect prefix="w" />} />
                    <Route path="/livestream-room/:id" element={<LegacyRoomRedirect prefix="l" />} />
                    <Route path="/legal-ai" element={<LegalAI />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/account/profile" element={<MyProfile />} />
                    <Route path="/account/favorites" element={<Favorites />} />
                    <Route path="/account/following" element={<Following />} />
                    <Route path="/account/notifications" element={<Notifications />} />
                    <Route path="/account/catalog" element={<MyCatalog />} />
                    <Route path="/account/catalog/products/new" element={<ProductEditPage />} />
                    <Route path="/account/catalog/products/:id" element={<ProductEditPage />} />
                    <Route path="/messages" element={<Messages />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </motion.main>
              </AnimatePresence>
              {!bare && <Footer />}
              {/* trang Tin nhắn đã có khung chat đầy đủ: ẩn widget để không mở hai kết nối chat */}
              {!bare && location.pathname !== '/messages' && <ChatWidget />}
            </ToastProvider>
          </TooltipProvider>
        </MotionConfig>
      </ProfileProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
