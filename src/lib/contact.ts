/** One source for VCCI Trade Hub contact details. The email comes from the deploy config so no placeholder ever ships. */
export const CONTACT = {
  hotline: '1900 6 1111',
  hotlineHref: 'tel:19006111',
  email: (import.meta.env.VITE_CONTACT_EMAIL as string | undefined)?.trim() ?? '',
}
