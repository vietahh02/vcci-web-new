/** The gear menu at the right end of the header: favourite products, light/dark theme and (when signed in) sign out. */
import { Heart, LogOut, Moon, Settings, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { USE_MOCK } from '@/api'
import { useFavoriteCount } from '@/lib/favorites'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useProfile } from '@/lib/profile'
import { useTheme } from '@/lib/theme'
import { tx } from '@/lib/tx'

export function HeaderMenu() {
  const { theme, toggle } = useTheme()
  const { session, signOut } = useProfile()
  const navigate = useNavigate()
  const dark = theme === 'dark'
  const favCount = useFavoriteCount(USE_MOCK || !!session)

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-primary-soft hover:text-primary data-[state=open]:bg-muted data-[state=open]:text-foreground"
        aria-label={tx('Cài đặt', 'Settings', '설정')}
      >
        <Settings className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuItem onSelect={() => navigate('/account/favorites')}>
          <Heart className={favCount ? 'fill-red-500 text-red-500' : undefined} />
          {tx('Sản phẩm yêu thích', 'Favourite products', '즐겨찾는 제품')}
          {!!favCount && <span className="ml-auto rounded-full bg-primary px-1.5 text-[11px] font-bold leading-[18px] text-primary-foreground">{favCount > 99 ? '99+' : favCount}</span>}
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
