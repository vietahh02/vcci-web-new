/** Portal auth proxy (vcci-sso behind /api/auth/*): captcha, login, refresh (handled in http.ts), logout, session. */
import { apiFetch, tokens } from './http'

export interface Captcha { enabled: boolean; captchaId?: string; image?: string; expiresInSeconds?: number }
export interface SessionInfo { companyName: string; taxCode: string; orgStatus?: string; completion?: number; organizationId?: string; email?: string }

export const getCaptcha = () => apiFetch<Captcha>('/api/auth/captcha', { anon: true })

export async function login(username: string, password: string, captcha?: { captchaId?: string; answer?: string }) {
  const r = await apiFetch<Record<string, unknown>>('/api/auth/login', {
    method: 'POST', anon: true,
    json: { username, password, captchaId: captcha?.captchaId, captchaAnswer: captcha?.answer },
  })
  tokens.set(String(r.access_token ?? ''), String(r.refresh_token ?? ''))
}

export async function logout() {
  const rt = tokens.refresh()
  try {
    await apiFetch('/api/auth/logout', { method: 'POST', json: { refreshToken: rt } })
  } catch {
    /* token may already be dead; local sign-out still proceeds */
  } finally {
    tokens.clear()
  }
}

export const isAuthed = () => !!tokens.access()

/** GET /api/auth/me */
export async function fetchSession(): Promise<SessionInfo> {
  const r = await apiFetch<Record<string, unknown>>('/api/auth/me')
  return {
    companyName: String(r.companyName ?? ''), taxCode: String(r.taxCode ?? ''), orgStatus: r.orgStatus ? String(r.orgStatus) : undefined,
    completion: typeof r.completion === 'number' ? r.completion : undefined, organizationId: r.organizationId ? String(r.organizationId) : undefined,
  }
}

/** POST /api/auth/forgot-password — same answer whether or not the account exists. */
export const forgotPassword = (email: string) =>
  apiFetch('/api/auth/forgot-password', { method: 'POST', anon: true, json: { usernameOrEmail: email } })

/** POST /api/auth/complete-password-reset — token from the reset email link. */
export const completePasswordReset = (token: string, password: string, confirmPassword: string) =>
  apiFetch('/api/auth/complete-password-reset', { method: 'POST', anon: true, json: { token, password, confirmPassword } })
