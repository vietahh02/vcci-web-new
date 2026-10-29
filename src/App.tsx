import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
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
import { Login, Register } from '@/pages/Auth'
import EventDetail from '@/pages/EventDetail'
import EventRegister from '@/pages/EventRegister'
import Events from '@/pages/Events'
import Home from '@/pages/Home'
import LegalAI from '@/pages/LegalAI'
import LiveRoom from '@/pages/LiveRoom'
import NotFound from '@/pages/NotFound'
import ProductDetail from '@/pages/ProductDetail'
import RequestDetail from '@/pages/RequestDetail'
import Requests from '@/pages/Requests'
import SearchPage from '@/pages/Search'
import SupplierProfile from '@/pages/SupplierProfile'
import Suppliers from '@/pages/Suppliers'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

export default function App() {
  const location = useLocation()
  const bare = location.pathname === '/login' || location.pathname === '/register'

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
                    <Route path="/legal-ai" element={<LegalAI />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/account/profile" element={<MyProfile />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </motion.main>
              </AnimatePresence>
              {!bare && <Footer />}
              {!bare && <ChatWidget />}
            </ToastProvider>
          </TooltipProvider>
        </MotionConfig>
      </ProfileProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
