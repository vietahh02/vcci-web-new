/**
 * Nhúng phòng Jitsi bằng external_api.js của chính domain Jitsi (cách nạp như useJitsi của CMS; cấu hình vai như webinar-room của Portal cũ).
 * Khác CMS: phải truyền `parentNode`, không phải `parent`; thiếu thì iframe rơi xuống cuối document.body.
 */
import { Loader2 } from 'lucide-react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { JITSI_DOMAIN, type JitsiRole } from '@/api/liveApi'
import { currentLang, useI18n } from '@/lib/i18n'
import { liveText } from './liveText'

interface JitsiApi {
  dispose: () => void
  addListener: (event: string, fn: () => void) => void
}
type JitsiCtor = new (domain: string, options: Record<string, unknown>) => JitsiApi

declare global {
  interface Window {
    JitsiMeetExternalAPI?: JitsiCtor
  }
}

let scriptPromise: Promise<void> | null = null
function loadScript(domain: string) {
  if (window.JitsiMeetExternalAPI) return Promise.resolve()
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = `https://${domain}/external_api.js`
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => {
      scriptPromise = null
      s.remove()
      reject(new Error('Cannot load Jitsi external_api.js'))
    }
    document.head.appendChild(s)
  })
  return scriptPromise
}

const roleConfig = (role: JitsiRole) =>
  role === 'OBSERVER'
    ? { startWithAudioMuted: true, startWithVideoMuted: true, disableInitialGUM: true, disableScreensharing: true, iAmVisitor: true, toolbarButtons: ['fullscreen', 'tileview', 'hangup'] }
    : { startWithAudioMuted: true, startWithVideoMuted: false, toolbarButtons: ['microphone', 'camera', 'chat', 'fullscreen', 'tileview'] }

export function JitsiRoom({ roomName, jwt, role, displayName, onLoadError }: { roomName: string; jwt: string; role: JitsiRole; displayName?: string; onLoadError: () => void }) {
  useI18n()
  const lt = liveText()
  const container = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const fail = useEffectEvent(onLoadError)
  const currentName = useEffectEvent(() => displayName)

  useEffect(() => {
    let cancelled = false
    let api: JitsiApi | null = null
    loadScript(JITSI_DOMAIN).then(
      () => {
        if (cancelled || !container.current || !window.JitsiMeetExternalAPI) return
        api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName,
          jwt,
          parentNode: container.current,
          width: '100%',
          height: '100%',
          lang: currentLang(),
          userInfo: { displayName: currentName() },
          onload: () => { if (!cancelled) setLoaded(true) },
          configOverwrite: { prejoinConfig: { enabled: false }, prejoinPageEnabled: false, disableDeepLinking: true, enableClosePage: false, ...roleConfig(role) },
          interfaceConfigOverwrite: { SHOW_JITSI_WATERMARK: false, SHOW_WATERMARK_FOR_GUESTS: false, TOOLBAR_ALWAYS_VISIBLE: true, HIDE_INVITE_MORE_HEADER: true },
        })
      },
      () => { if (!cancelled) fail() },
    )
    return () => {
      cancelled = true
      try {
        api?.dispose()
      } catch {
        /* iframe đã mất thì thôi */
      }
    }
  }, [roomName, jwt, role])

  return (
    <div className="absolute inset-0 bg-black">
      <div ref={container} className="size-full" />
      {!loaded && (
        <div role="status" className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-white/70">
          <span className="inline-flex items-center gap-2"><Loader2 className="size-5 animate-spin" /> {lt.jitsiConnecting}</span>
        </div>
      )}
    </div>
  )
}
