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
  Calendar,
  Layers,
  TrendingUp,
  Globe,
  ShieldCheck,
  MessageSquare,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'

export default function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 selection:bg-primary/30">
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none" />

      {/* Header */}
      <header className="border-b bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50 transition-all">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="TenderTrack"
              width={140}
              height={36}
              className="h-8 w-auto dark:invert opacity-90"
              priority
            />
          </Link>
          <nav className="hidden md:flex items-center gap-10 text-sm font-semibold text-slate-600 dark:text-slate-400">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
            <Link href="#how-it-works" className="hover:text-primary transition-colors">How it Works</Link>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild size="sm" className="rounded-full px-6 shadow-md">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild size="sm" className="hidden sm:inline-flex rounded-full px-6">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full px-6 shadow-md shadow-primary/20">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative">
        {/* Hero Section - Restored from previous design */}
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
                <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg" asChild>
                  <Link href="/signup">
                    Start Your Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full" asChild>
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

        {/* Product Preview Section */}
        <section className="pb-24 md:pb-32 container relative z-10 -mt-12 md:-mt-20">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent blur-[120px] rounded-full -z-10 opacity-50" />
            <div className="relative mx-auto max-w-6xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm p-2 shadow-2xl animate-float overflow-hidden">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
                <Image
                  src="/dashboard.png"
                  alt="TenderTrack Dashboard"
                  width={1200}
                  height={675}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof / Trust Section */}
        <section className="py-24 border-y border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950">
          <div className="container">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="max-w-xs text-center md:text-left">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Trusted Nationwide</h3>
                <p className="text-sm text-slate-500 dark:text-slate-500 font-medium">
                  Helping tender hunters across Southern Africa win billions in contracts.
                </p>
              </div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-8 items-center opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                <div className="flex items-center justify-center gap-2 font-bold text-lg dark:text-white">
                  <Building2 className="h-5 w-5 text-primary" /> Construction
                </div>
                <div className="flex items-center justify-center gap-2 font-bold text-lg dark:text-white">
                  <Users className="h-5 w-5 text-blue-500" /> Consulting
                </div>
                <div className="flex items-center justify-center gap-2 font-bold text-lg dark:text-white">
                  <Zap className="h-5 w-5 text-yellow-500" /> Energy
                </div>
                <div className="flex items-center justify-center gap-2 font-bold text-lg dark:text-white">
                  <Shield className="h-5 w-5 text-red-500" /> Security
                </div>
                <div className="flex items-center justify-center gap-2 font-bold text-lg dark:text-white">
                  <Globe className="h-5 w-5 text-green-500" /> Logistics
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid Features Section */}
        <section id="features" className="py-32 bg-slate-50 dark:bg-slate-900/30">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center mb-20 space-y-4">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white">Everything You Need to Scale Your Bidding</h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                TenderTrack provides the tools to manage your entire tender lifecycle from discovery to bid opening.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[250px] md:auto-rows-[300px]">
              {/* Feature 1: Main */}
              <div className="md:col-span-8 md:row-span-2 group relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 md:p-12 hover:border-primary/50 transition-colors">
                <div className="relative z-10 h-full flex flex-col">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 shadow-sm">
                    <Search className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">Intelligent Tender Discovery</h3>
                  <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                    Track annual procurement plans from government departments and private organizations. Find opportunities before they are even advertised.
                  </p>
                  <div className="mt-auto pt-8">
                     <div className="flex gap-3">
                        <div className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-900 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Government</div>
                        <div className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-900 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Parastatals</div>
                        <div className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-900 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Private</div>
                     </div>
                  </div>
                </div>
                {/* Abstract Visual Decoration */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent -z-0" />
                <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-0" />
              </div>

              {/* Feature 2: AI Compliance */}
              <div className="md:col-span-4 md:row-span-1 group relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">AI Compliance Officer</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Scan tender PDFs to identify mandatory SBD forms and missing documents instantly.
                </p>
              </div>

              {/* Feature 3: WhatsApp */}
              <div className="md:col-span-4 md:row-span-1 group relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 hover:border-green-500/50 transition-colors">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6">
                  <MessageSquare className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">WhatsApp Alerts</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Receive urgent deadline reminders directly to your phone. Never miss a submission.
                </p>
              </div>

              {/* Feature 4: Competitor */}
              <div className="md:col-span-4 group relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 hover:border-yellow-500/50 transition-colors">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-6">
                  <BarChart3 className="h-6 w-6 text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Market Intelligence</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Analyze bid opening results and rival pricing to stay ahead of the competition.
                </p>
              </div>

              {/* Feature 5: Analytics */}
              <div className="md:col-span-4 group relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 hover:border-red-500/50 transition-colors">
                 <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-6">
                  <TrendingUp className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Win Rate Insights</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Visualize your performance with powerful dashboards and track your pipeline.
                </p>
              </div>

              {/* Feature 6: Collaboration */}
              <div className="md:col-span-4 group relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 hover:border-purple-500/50 transition-colors">
                 <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Team Collaboration</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Assign tenders to team members and track progress together in real-time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-32 bg-white dark:bg-slate-950">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center mb-24 space-y-4">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white">Simplicity by Design</h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                Get up and running in minutes and start managing your tenders like a pro.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-16 relative">
               {/* Connector Line */}
               <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent -z-0" />
               
              <div className="relative text-center group">
                <div className="w-24 h-24 bg-white dark:bg-slate-900 border-2 border-primary rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-8 relative z-10 shadow-xl shadow-primary/10 group-hover:scale-110 transition-transform">1</div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Create Profile</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Sign up for free and set up your company profile in seconds. No credit card required to start.</p>
              </div>
              
              <div className="relative text-center group">
                <div className="w-24 h-24 bg-white dark:bg-slate-900 border-2 border-primary rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-8 relative z-10 shadow-xl shadow-primary/10 group-hover:scale-110 transition-transform">2</div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Add Tenders</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Import existing tenders or add new opportunities. Set deadlines, categories, and organizations.</p>
              </div>
              
              <div className="text-center group">
                <div className="w-24 h-24 bg-primary text-white border-2 border-primary rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-8 relative z-10 shadow-xl shadow-primary/40 group-hover:scale-110 transition-transform">3</div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Track & Win</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Receive reminders, track competitor bids, and use our analytics to improve your bidding strategy.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 md:py-32">
          <div className="container">
            <div className="bg-slate-900 dark:bg-slate-900 rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-primary/20">
              <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                <h2 className="text-4xl md:text-7xl font-black tracking-tight leading-[0.9]">Ready to Transform <br /> Your Success?</h2>
                <p className="text-lg md:text-xl opacity-70 font-medium">
                  Join hundreds of companies that use TenderTrack to manage billions in contract value. Start your free trial today.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Button size="lg" variant="secondary" className="h-14 px-12 text-lg rounded-full shadow-lg group" asChild>
                    <Link href="/signup">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 px-12 text-lg rounded-full bg-transparent text-white border-white/20 hover:bg-white/10" asChild>
                    <Link href="/pricing">View Pricing</Link>
                  </Button>
                </div>
              </div>
              
              {/* Background Glows */}
              <div className="absolute top-0 left-0 w-full h-full -z-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-1/2 -left-1/4 w-[100%] h-[150%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-1/2 -right-1/4 w-[100%] h-[150%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
            <div className="md:col-span-5 space-y-8">
          <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="TenderTrack"
                  width={140}
                  height={36}
                  className="h-9 w-auto dark:invert opacity-90"
                />
              </Link>
              <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed max-w-sm font-medium">
                The most comprehensive tender management platform for businesses seeking to win government and private sector contracts.
              </p>
              <div className="flex gap-5">
                <Link href="#" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-all"><FileText className="h-5 w-5" /></Link>
                <Link href="#" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-all"><Users className="h-5 w-5" /></Link>
                <Link href="#" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white transition-all"><Calendar className="h-5 w-5" /></Link>
              </div>
            </div>
            
            <div className="md:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-12">
              <div className="space-y-6">
                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-900 dark:text-white">Product</h4>
                <ul className="space-y-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                  <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
                  <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                  <li><Link href="#how-it-works" className="hover:text-primary transition-colors">How it Works</Link></li>
                  <li><Link href="/signup" className="hover:text-primary transition-colors font-black text-slate-900 dark:text-white">Sign Up</Link></li>
                </ul>
              </div>
              
              <div className="space-y-6">
                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-900 dark:text-white">Company</h4>
                <ul className="space-y-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                  <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors">Contact</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                </ul>
              </div>

               <div className="space-y-6">
                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-900 dark:text-white">Support</h4>
                <ul className="space-y-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                  <li><Link href="#" className="hover:text-primary transition-colors">Help Center</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors">Guides</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors">Status</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors">API Docs</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="pt-10 border-t border-slate-200 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            <p>© {new Date().getFullYear()} TenderTrack. Built for winners.</p>
            <div className="flex gap-10">
              <Link href="#" className="hover:text-primary transition-colors">Twitter</Link>
              <Link href="#" className="hover:text-primary transition-colors">LinkedIn</Link>
              <Link href="#" className="hover:text-primary transition-colors">Instagram</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
