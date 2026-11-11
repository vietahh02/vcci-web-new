/** The gear menu at the right end of the header: light/dark theme and (when signed in) sign out. */
import { LogOut, Moon, Settings, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useProfile } from '@/lib/profile'
import { useTheme } from '@/lib/theme'
import { tx } from '@/lib/tx'

export function HeaderMenu() {
  const { theme, toggle } = useTheme()
  const { session, signOut } = useProfile()
  const navigate = useNavigate()
  const dark = theme === 'dark'

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-primary-soft hover:text-primary data-[state=open]:bg-muted data-[state=open]:text-foreground"
        aria-label={tx('Cài đặt', 'Settings', '설정')}
      >
        <Settings className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
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
