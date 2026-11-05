import { useCallback, useEffect, useState } from 'react'
import { authApi, USE_MOCK } from '@/api'
import type { Captcha as CaptchaChallenge } from '@/api/auth'

/** Live: GET /api/auth/captcha (image data-URI + captchaId). `enabled=false` means the form needs no captcha. */
export function useLiveCaptcha() {
  const [cap, setCap] = useState<CaptchaChallenge | null>(null)
  const refresh = useCallback(() => {
    if (USE_MOCK) return
    authApi.getCaptcha().then(setCap, () => setCap({ enabled: false }))
  }, [])
  useEffect(() => { refresh() }, [refresh])
  return { cap, refresh }
}
