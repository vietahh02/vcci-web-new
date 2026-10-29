import { motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonClass } from '@/components/ui/primitives'
import { useI18n } from '@/lib/i18n'

export default function NotFound() {
  const { t, lang } = useI18n()
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <motion.p initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.4 }} className="text-gold-gradient text-8xl font-extrabold tracking-tighter">
          404
        </motion.p>
        <p className="mt-4 text-lg font-bold">{lang === 'vi' ? 'Không tìm thấy trang' : 'Page not found'}</p>
        <Link to="/" className={buttonClass('default', 'md', 'mt-6')}><ArrowLeft /> {t.common.home}</Link>
      </div>
    </div>
  )
}
