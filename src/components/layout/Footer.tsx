import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/brand'
import { useToast } from '@/components/ui/overlay'
import { useI18n } from '@/lib/i18n'

const footerRoutes = {
  buyers: ['/search', '/suppliers', '/requests?post=1', '/events'],
  suppliers: ['/register', '/requests', '/register', '/live/e-krfood'],
  vcci: ['/about', '/legal-ai', '/about', '/about'],
} as const

export function Footer() {
  const { t } = useI18n()
  const toast = useToast()
  const [email, setEmail] = useState('')

  return (
    <footer className="relative mt-24 overflow-hidden border-t bg-muted/40">
      <div className="pointer-events-none absolute -left-40 top-0 size-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="container-page relative grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.4fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{t.footer.about}</p>
          <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><MapPin className="size-4 text-primary" /> {t.footer.address}</li>
            <li className="flex items-center gap-2"><Phone className="size-4 text-primary" /> 1900 6 1111</li>
            <li className="flex items-center gap-2"><Mail className="size-4 text-primary" /> tradehub@vcci.example.vn</li>
          </ul>
        </div>
        {(Object.keys(t.footer.cols) as (keyof typeof t.footer.cols)[]).map((k) => (
          <div key={k}>
            <h4 className="text-sm font-bold">{t.footer.cols[k]}</h4>
            <ul className="mt-4 space-y-2.5">
              {t.footer.links[k].map((label, i) => (
                <li key={label}>
                  <Link to={footerRoutes[k][i]!} className="text-sm text-muted-foreground transition hover:text-primary">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h4 className="text-sm font-bold">{t.footer.newsletter}</h4>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!email.includes('@')) return
              toast({ kind: 'success', title: t.footer.subscribe, description: email })
              setEmail('')
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@company.com"
              aria-label="Email"
              className="h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/12"
            />
            <button type="submit" className="inline-flex h-10 items-center gap-1 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover" aria-label={t.footer.subscribe}>
              <ArrowRight className="size-4" />
            </button>
          </form>
          <div className="mt-6 flex items-center gap-3">
            <img src="/imgs/Logo_vcci.png" alt="VCCI" className="h-10 w-auto rounded bg-white p-1" />
            <p className="text-xs leading-relaxed text-muted-foreground">{t.top.official}</p>
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="container-page flex flex-wrap items-center justify-between gap-2 py-5 text-xs text-muted-foreground">
          <p>{t.footer.rights}</p>
          <p>Tiếng Việt · English · 한국어</p>
        </div>
      </div>
    </footer>
  )
}
