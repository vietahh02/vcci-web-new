import { Navigate, useLocation, useParams } from 'react-router-dom'

/** Link cũ trong email và CMS (`/webinar-room/{id}`, `/livestream-room/{id}?session=`) trỏ về phòng xem mới. */
export function LegacyRoomRedirect({ prefix }: { prefix: 'w' | 'l' }) {
  const { id = '' } = useParams()
  const { search } = useLocation()
  return <Navigate to={`/live/${prefix}-${id}${search}`} replace />
}
