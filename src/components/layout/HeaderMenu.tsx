/** The gear menu at the right end of the header: notifications, favourite products, followed businesses, light/dark theme and (when signed in) sign out. */
import { Bell, Heart, LogOut, Moon, Settings, Sun, UsersRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { USE_MOCK } from '@/api'
import { useFavoriteCount } from '@/lib/favorites'
import { useFollowingCount } from '@/lib/follows'
import { useUnreadNotifications } from '@/lib/notifications'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useProfile } from '@/lib/profile'
import { useTheme } from '@/lib/theme'
import { tx } from '@/lib/tx'

const count = (n: number | null) => !!n && (
  <span className="ml-auto rounded-full bg-primary px-1.5 text-[11px] font-bold leading-[18px] text-primary-foreground">{n > 99 ? '99+' : n}</span>
)

export function HeaderMenu() {
  const { theme, toggle } = useTheme()
  const { session, signOut } = useProfile()
  const navigate = useNavigate()
  const dark = theme === 'dark'
  const personal = USE_MOCK || !!session
  const favCount = useFavoriteCount(personal)
  const followCount = useFollowingCount(personal)
  const unread = useUnreadNotifications(!USE_MOCK && !!session)

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className="relative grid size-11 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-primary-soft hover:text-primary data-[state=open]:bg-muted data-[state=open]:text-foreground"
        aria-label={unread ? `${tx('Cài đặt', 'Settings', '설정')} (${tx('có thông báo mới', 'new notifications', '새 알림')})` : tx('Cài đặt', 'Settings', '설정')}
      >
        <Settings className="size-5" />
        {unread > 0 && <span className="absolute right-2.5 top-2.5 size-2.5 rounded-full bg-primary ring-2 ring-background" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-64">
        {!USE_MOCK && session && (
          <>
            <DropdownMenuItem onSelect={() => navigate('/account/notifications')}>
              <Bell className={unread ? 'text-primary' : undefined} />
              {tx('Thông báo', 'Notifications', '알림')}
              {count(unread)}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onSelect={() => navigate('/account/favorites')}>
          <Heart className={favCount ? 'fill-red-500 text-red-500' : undefined} />
          {tx('Sản phẩm yêu thích', 'Favourite products', '즐겨찾는 제품')}
          {count(favCount)}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/account/following')}>
          <UsersRound className={followCount ? 'text-primary' : undefined} />
          {tx('Doanh nghiệp đang theo dõi', 'Businesses you follow', '팔로우 중인 기업')}
          {count(followCount)}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={toggle}>
          {dark ? <Sun /> : <Moon />}
          {dark ? tx('Chế độ sáng', 'Light mode', '라이트 모드') : tx('Chế độ tối', 'Dark mode', '다크 모드')}
        </DropdownMenuItem>
        {session && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => { signOut(); navigate('/') }} className="text-destructive focus:text-destructive">
              <LogOut /> {tx('Đăng xuất', 'Sign out', '로그아웃')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
