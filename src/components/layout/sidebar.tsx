'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Building2,
  Users,
  ClipboardList,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tenders', href: '/tenders', icon: FileText },
  { name: 'Organizations', href: '/organizations', icon: Building2 },
  { name: 'Competitors', href: '/competitors', icon: Users },
  { name: 'Plans', href: '/procurement-plans', icon: ClipboardList },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) {
      setIsCollapsed(saved === 'true')
    }
  }, [])

  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('sidebar-toggle'))
  }

  return (
    <aside
      className={cn(
        'hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:flex-col transition-all duration-300',
        isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'
      )}
    >
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-white dark:bg-slate-900 px-4 py-4">
        {/* Logo and Collapse Button */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center transition-all duration-300',
              isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
            )}
          >
            <Image
              src="/logo.png"
              alt="TenderTrack"
              width={120}
              height={30}
              className="h-6 w-auto dark:invert"
              priority
            />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className={cn(
              'h-8 w-8 rounded-md transition-all',
              isCollapsed && 'mx-auto'
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-1">
            <TooltipProvider delayDuration={0}>
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                const navLink = (
                  <Link
                    href={item.href}
                    className={cn(
                      'group flex gap-x-3 rounded-md p-2.5 text-sm font-medium leading-6 transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                      isCollapsed && 'justify-center'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 shrink-0',
                        isActive
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    />
                    <span
                      className={cn(
                        'transition-all duration-300',
                        isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                      )}
                    >
                      {item.name}
                    </span>
                  </Link>
                )

                return (
                  <li key={item.name}>
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      navLink
                    )}
                  </li>
                )
              })}
            </TooltipProvider>
          </ul>
        </nav>
      </div>
    </aside>
  )
}
