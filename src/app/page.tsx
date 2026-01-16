'use client'

import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowRight, 
  CheckCircle2, 
  BarChart3, 
  Bell, 
  Users, 
  Shield, 
  Zap, 
  Building2, 
  Search,
  FileText,
  MousePointer2,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'

export default function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="TenderTrack"
              width={140}
              height={36}
              className="h-9 w-auto dark:invert"
              priority
            />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
            <Link href="#how-it-works" className="hover:text-primary transition-colors">How it Works</Link>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="container relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
                <Zap className="mr-2 h-4 w-4 text-primary fill-primary" />
                The #1 Tender Management Platform in Southern Africa
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                Win More Contracts with Intelligent Tender Tracking
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Stop missing deadlines and losing track of bids. TenderTrack helps you find, track, and win government and private sector tenders with ease.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="h-14 px-8 text-lg" asChild>
                  <Link href="/signup">
                    Start Your Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg" asChild>
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
              <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Cancel anytime
                </div>
              </div>
            </div>
          </div>
          
          {/* Background Decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none opacity-30">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />
          </div>
        </section>

        {/* Logo Cloud / Trust Section */}
        <section className="py-12 border-y bg-slate-50/50 dark:bg-slate-900/50">
          <div className="container">
            <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-8">
              Empowering Businesses Across All Sectors
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center opacity-60 grayscale">
              <div className="flex items-center justify-center gap-2 font-bold text-xl">
                <Building2 className="h-6 w-6" /> Construction
              </div>
              <div className="flex items-center justify-center gap-2 font-bold text-xl">
                <Users className="h-6 w-6" /> Consulting
              </div>
              <div className="flex items-center justify-center gap-2 font-bold text-xl">
                <Zap className="h-6 w-6" /> Energy
              </div>
              <div className="flex items-center justify-center gap-2 font-bold text-xl">
                <Shield className="h-6 w-6" /> Security
              </div>
              <div className="flex items-center justify-center gap-2 font-bold text-xl">
                <MousePointer2 className="h-6 w-6" /> IT Services
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-white dark:bg-slate-950">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything You Need to Scale Your Bidding</h2>
              <p className="text-lg text-muted-foreground">
                TenderTrack provides the tools to manage your entire tender lifecycle from discovery to bid opening.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-none shadow-none bg-slate-50 dark:bg-slate-900">
                <CardContent className="pt-8">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Tender Discovery</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Track annual procurement plans from government departments and private organizations. Find opportunities before they are even advertised.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-none bg-slate-50 dark:bg-slate-900">
                <CardContent className="pt-8">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                    <Bell className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Smart Reminders</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Automated email and in-app notifications for submission deadlines, site visits, and bid openings. Never miss a critical date again.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-none bg-slate-50 dark:bg-slate-900">
                <CardContent className="pt-8">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Competitor Intelligence</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Record and analyze bid opening results. Track your rivals' pricing and win rates to stay ahead of the competition.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-none bg-slate-50 dark:bg-slate-900">
                <CardContent className="pt-8">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Document Management</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Store tender documents, bid submissions, and award letters in one central, secure location for easy access by your entire team.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-none bg-slate-50 dark:bg-slate-900">
                <CardContent className="pt-8">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Team Collaboration</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Assign tenders to team members, set roles and permissions, and track progress together. Collaboration made simple.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-none bg-slate-50 dark:bg-slate-900">
                <CardContent className="pt-8">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Data Analytics</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Visualize your performance with powerful dashboards. Track your win rate, pipeline value, and sector performance.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-slate-900">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
              <p className="text-lg text-muted-foreground">
                Get up and running in minutes and start managing your tenders like a pro.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12">
              <div className="relative text-center">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 relative z-10">1</div>
                <h3 className="text-xl font-bold mb-3">Create Your Account</h3>
                <p className="text-muted-foreground">Sign up for free and set up your company profile in seconds. No credit card required to start.</p>
                <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-slate-300 dark:bg-slate-700 -z-0" />
              </div>
              
              <div className="relative text-center">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 relative z-10">2</div>
                <h3 className="text-xl font-bold mb-3">Add Your Tenders</h3>
                <p className="text-muted-foreground">Import existing tenders or add new opportunities. Set deadlines, categories, and organizations.</p>
                <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-slate-300 dark:bg-slate-700 -z-0" />
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6 relative z-10">3</div>
                <h3 className="text-xl font-bold mb-3">Track & Win</h3>
                <p className="text-muted-foreground">Receive reminders, track competitor bids, and use our analytics to improve your bidding strategy.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24">
          <div className="container">
            <div className="bg-primary rounded-3xl p-8 md:p-16 text-center text-primary-foreground relative overflow-hidden">
              <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Transform Your Tender Success?</h2>
                <p className="text-xl opacity-90 mb-10">
                  Join hundreds of companies that use TenderTrack to manage billions in contract value. Start your free trial today.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button size="lg" variant="secondary" className="h-14 px-8 text-lg" asChild>
                    <Link href="/signup">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                    <Link href="/pricing">View Pricing</Link>
                  </Button>
                </div>
              </div>
              
              {/* Background Shapes */}
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl" />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t bg-slate-50 dark:bg-slate-900">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2">
              <Link href="/" className="inline-block mb-6">
                <Image
                  src="/logo.png"
                  alt="TenderTrack"
                  width={140}
                  height={36}
                  className="h-9 w-auto dark:invert"
                />
              </Link>
              <p className="text-muted-foreground max-w-xs mb-6">
                The most comprehensive tender management platform for businesses seeking to win government and private sector contracts.
              </p>
              <div className="flex gap-4">
                <Link href="#" className="text-muted-foreground hover:text-primary"><FileText className="h-5 w-5" /></Link>
                <Link href="#" className="text-muted-foreground hover:text-primary"><Users className="h-5 w-5" /></Link>
                <Link href="#" className="text-muted-foreground hover:text-primary"><Calendar className="h-5 w-5" /></Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-muted-foreground">Product</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><Link href="#features" className="text-muted-foreground hover:text-primary">Features</Link></li>
                <li><Link href="/pricing" className="text-muted-foreground hover:text-primary">Pricing</Link></li>
                <li><Link href="#how-it-works" className="text-muted-foreground hover:text-primary">How it Works</Link></li>
                <li><Link href="/signup" className="text-muted-foreground hover:text-primary">Sign Up</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-muted-foreground">Company</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><Link href="#" className="text-muted-foreground hover:text-primary">About Us</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Contact</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} TenderTrack. All rights reserved.</p>
            <div className="flex gap-8">
              <Link href="#" className="hover:text-primary transition-colors">Twitter</Link>
              <Link href="#" className="hover:text-primary transition-colors">LinkedIn</Link>
              <Link href="#" className="hover:text-primary transition-colors">Facebook</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
