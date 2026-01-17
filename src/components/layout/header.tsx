'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Menu,
  Bell,
  Settings,
  LogOut,
  User,
  Moon,
  Sun,
  X,
  LayoutDashboard,
  FileText,
  Building2,
  Users,
  ClipboardList,
  BarChart3,
  Sparkles,
  Zap,
  ChevronDown,
  CreditCard,
  ArrowUpCircle,
} from 'lucide-react'
import { useTheme } from 'next-themes'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { CompanySwitcher } from './company-switcher'
import { useAuth } from '@/hooks/use-auth'
import { usePendingReminders } from '@/hooks/use-reminders'
import { useSubscription } from '@/hooks/use-subscription'
import { useCompany } from '@/contexts/company-context'
import { PLANS } from '@/lib/stripe'
import { Badge } from '@/components/ui/badge'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tenders', href: '/tenders', icon: FileText },
  { name: 'Organizations', href: '/organizations', icon: Building2 },
  { name: 'Competitors', href: '/competitors', icon: Users },
  { name: 'Plans', href: '/procurement-plans', icon: ClipboardList },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
]

export function Header() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Get pending reminders for notification badge
  const { data: pendingReminders } = usePendingReminders()
  const notificationCount = pendingReminders?.length || 0

  // Get subscription and AI credits data
  const { data: subscription } = useSubscription()
  const { currentCompany } = useCompany()
  const currentPlan = subscription?.plan || 'free'
  const planDetails = PLANS[currentPlan]
  const aiCredits = currentCompany?.ai_credits || 0

  const getInitials = (email: string) => {
    return email?.substring(0, 2).toUpperCase() || 'U'
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-slate-900/80">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="mr-6 flex items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="TenderTrack"
              width={140}
              height={36}
              className="h-7 w-auto dark:invert"
              priority
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-2 rounded-md transition-colors',
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'text-foreground bg-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right side items */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          <div className="hidden sm:block">
            <CompanySwitcher />
          </div>

          {/* Plan Badge */}
          <Link href="/settings?tab=billing" className="hidden lg:block">
            <Badge
              variant={currentPlan === 'free' ? 'secondary' : currentPlan === 'pro' ? 'default' : 'destructive'}
              className="cursor-pointer hover:opacity-80 transition-opacity px-3 py-1.5"
            >
              {planDetails.name}
            </Badge>
          </Link>

          {/* AI Credits Indicator */}
          <div className="hidden lg:flex items-center gap-2">
            <Link href="/settings?tab=billing" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-accent transition-colors">
              <Zap className={`h-4 w-4 ${
                aiCredits === 0 ? 'text-destructive' : 
                aiCredits < 5 ? 'text-amber-500' : 
                'text-primary'
              }`} />
              <span className="text-sm font-medium">
                {aiCredits} {aiCredits === 1 ? 'Credit' : 'Credits'}
              </span>
            </Link>
            {aiCredits < 5 && (
              <Button asChild size="sm" variant="outline" className="h-8">
                <Link href="/settings?tab=billing">
                  <ArrowUpCircle className="h-3.5 w-3.5 mr-1" />
                  Top Up
                </Link>
              </Button>
            )}
          </div>

          {/* AI Quick Access Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Sparkles className="h-5 w-5 text-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Features
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/tenders" className="cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Proposal
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/procurement-plans" className="cursor-pointer">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Upload Procurement Plan
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/tenders" className="cursor-pointer">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  AI Compliance Checker
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings?tab=profile" className="cursor-pointer">
                  <Building2 className="mr-2 h-4 w-4" />
                  Company AI Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between mb-1">
                  <span>AI Credits:</span>
                  <span className="font-medium text-foreground">{aiCredits}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Plan:</span>
                  <Badge variant="outline" className="text-xs">{planDetails.name}</Badge>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings?tab=billing" className="cursor-pointer text-primary">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Billing & Credits
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notificationCount === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No pending notifications
                </div>
              ) : (
                <>
                  {pendingReminders?.slice(0, 5).map((reminder) => (
                    <DropdownMenuItem key={reminder.id} asChild>
                      <Link href={`/tenders/${reminder.tender_id}`} className="flex flex-col items-start gap-1">
                        <span className="font-medium text-sm truncate w-full">
                          {reminder.tender?.title || 'Tender Reminder'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {reminder.reminder_type.replace(/_/g, ' ')}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  {notificationCount > 5 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/tenders" className="text-center w-full text-primary">
                          View all ({notificationCount})
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {getInitials(user?.email || '')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">My Account</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/companies" className="cursor-pointer">
                  <Building2 className="mr-2 h-4 w-4" />
                  Companies
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut()}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4">
                <div className="sm:hidden">
                  <CompanySwitcher />
                </div>
                <Separator />
                {/* Mobile Plan & Credits Info */}
                <div className="flex flex-col gap-3 px-3 py-3 bg-accent/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Plan:</span>
                    <Badge variant={currentPlan === 'free' ? 'secondary' : currentPlan === 'pro' ? 'default' : 'destructive'}>
                      {planDetails.name}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">AI Credits:</span>
                    <div className="flex items-center gap-1.5">
                      <Zap className={`h-4 w-4 ${
                        aiCredits === 0 ? 'text-destructive' : 
                        aiCredits < 5 ? 'text-amber-500' : 
                        'text-primary'
                      }`} />
                      <span className="text-sm font-medium">{aiCredits}</span>
                    </div>
                  </div>
                  {(currentPlan === 'free' || aiCredits < 5) && (
                    <Button asChild size="sm" variant="default" className="w-full mt-1">
                      <Link href="/settings?tab=billing" onClick={closeMobileMenu}>
                        <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                        {currentPlan === 'free' ? 'Upgrade Plan' : 'Top Up Credits'}
                      </Link>
                    </Button>
                  )}
                </div>
                <Separator />
                {/* AI Features Quick Access */}
                <div className="flex flex-col gap-1">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    AI FEATURES
                  </div>
                  <Link
                    href="/tenders"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <FileText className="h-5 w-5" />
                    Generate Proposal
                  </Link>
                  <Link
                    href="/procurement-plans"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <ClipboardList className="h-5 w-5" />
                    Upload Procurement Plan
                  </Link>
                  <Link
                    href="/settings?tab=profile"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Building2 className="h-5 w-5" />
                    Company AI Profile
                  </Link>
                </div>
                <Separator />
                <nav className="flex flex-col gap-2">
                  {navigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMobileMenu}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                          pathname === item.href || pathname.startsWith(item.href + '/')
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                    )
                  })}
                </nav>
                <Separator />
                <div className="flex flex-col gap-2">
                  <Link
                    href="/settings"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Settings className="h-5 w-5" />
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      closeMobileMenu()
                      signOut()
                    }}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
