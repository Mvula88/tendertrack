'use client'

import { useState } from 'react'
import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  User,
  Bell,
  Tag,
  Settings,
  Loader2,
  LogOut,
  Building,
  CreditCard,
  Crown,
  Zap,
  Plus,
  Sparkles,
  ExternalLink,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/use-categories'
import { useCompany } from '@/contexts/company-context'
import { useNotificationPreferences } from '@/hooks/use-preferences'
import { useSubscription, SubscriptionData } from '@/hooks/use-subscription'
import { PLANS } from '@/lib/stripe'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function SettingsPage() {
  const { user, signOut, isLoading: authLoading } = useAuth()
  const { currentCompany } = useCompany()
  const { data: categories, isLoading: categoriesLoading } = useCategories()
  const createCategory = useCreateCategory()
  const deleteCategory = useDeleteCategory()
  const router = useRouter()
  const { preferences, setPreference, isLoaded: preferencesLoaded } = useNotificationPreferences()
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription()

  const [newCategoryName, setNewCategoryName] = useState('')
  const [billingLoading, setBillingLoading] = useState(false)
  const [topupLoading, setTopupLoading] = useState(false)
  const [companyHistory, setCompanyHistory] = useState('')
  const [coreServices, setCoreServices] = useState('')
  const [beeLevel, setBeeLevel] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  // Load current company profile data
  useEffect(() => {
    const loadCompanyProfile = async () => {
      if (!currentCompany) return

      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data, error } = await supabase
        .from('user_companies')
        .select('company_history, core_services, bee_level')
        .eq('id', currentCompany.id)
        .single()

      if (data && !error) {
        setCompanyHistory(data.company_history || '')
        setCoreServices(data.core_services?.join(', ') || '')
        setBeeLevel(data.bee_level?.toString() || '')
      }
    }

    loadCompanyProfile()
  }, [currentCompany])

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    await createCategory.mutateAsync(newCategoryName.trim())
    setNewCategoryName('')
  }

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory.mutateAsync(id)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  const handleManageBilling = async () => {
    setBillingLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })
      const { url, error } = await response.json()

      if (error) {
        toast.error(error)
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      toast.error('Failed to open billing portal')
    } finally {
      setBillingLoading(false)
    }
  }

  const handleTopUp = async () => {
    setTopupLoading(true)
    try {
      const response = await fetch('/api/stripe/top-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 10 }),
      })
      const { url, error } = await response.json()

      if (error) {
        toast.error(error)
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      toast.error('Failed to initiate top-up')
    } finally {
      setTopupLoading(false)
    }
  }

  const handleSaveCompanyProfile = async () => {
    if (!currentCompany) return
    setProfileSaving(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error } = await supabase
        .from('user_companies')
        .update({
          company_history: companyHistory,
          core_services: coreServices.split(',').map(s => s.trim()),
          bee_level: beeLevel ? parseInt(beeLevel) : null
        })
        .eq('id', currentCompany.id)

      if (error) throw error

      toast.success('Company profile updated successfully')
    } catch (error) {
      toast.error('Failed to update company profile')
    } finally {
      setProfileSaving(false)
    }
  }

  const currentPlan = subscription?.plan || 'free'
  const planDetails = PLANS[currentPlan]

  if (authLoading) {
    return <SettingsSkeleton />
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="categories">
            <Tag className="h-4 w-4 mr-2" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="company">
            <Building className="h-4 w-4 mr-2" />
            Company Profile
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Your account details and authentication info
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="text-sm font-medium">User ID</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {user?.id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">Account Created</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Company</CardTitle>
                <CardDescription>
                  The company you&apos;re currently working with
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentCompany ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{currentCompany.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {currentCompany.role}
                        </p>
                      </div>
                    </div>
                    <Link href="/companies">
                      <Button variant="outline" size="sm">
                        Manage Companies
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-2">
                      No company selected
                    </p>
                    <Link href="/onboarding">
                      <Button>Create Company</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sign Out</CardTitle>
                <CardDescription>
                  Sign out of your account on this device
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Configure when you receive email notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!preferencesLoaded ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Deadline Reminders</p>
                      <p className="text-sm text-muted-foreground">
                        Receive reminders 7, 3, and 1 day before tender deadlines
                      </p>
                    </div>
                    <Switch
                      checked={preferences.deadlineReminders}
                      onCheckedChange={(checked) => setPreference('deadlineReminders', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Bid Opening Reminders</p>
                      <p className="text-sm text-muted-foreground">
                        Remind me to check bid opening results
                      </p>
                    </div>
                    <Switch
                      checked={preferences.bidOpeningReminders}
                      onCheckedChange={(checked) => setPreference('bidOpeningReminders', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Weekly Summary</p>
                      <p className="text-sm text-muted-foreground">
                        Receive a weekly summary of your tender activities
                      </p>
                    </div>
                    <Switch
                      checked={preferences.weeklySummary}
                      onCheckedChange={(checked) => setPreference('weeklySummary', checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">New Tender Alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when new tenders match your categories
                      </p>
                    </div>
                    <Switch
                      checked={preferences.newTenderAlerts}
                      onCheckedChange={(checked) => setPreference('newTenderAlerts', checked)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                WhatsApp Notifications
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none">Beta</Badge>
              </CardTitle>
              <CardDescription>
                Receive urgent tender deadlines directly to your WhatsApp via Clickatell
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Enable WhatsApp Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      We&apos;ll send you a message 24 hours before any bid is due
                    </p>
                  </div>
                  <Switch
                    checked={false}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel>WhatsApp Number</FormLabel>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="+27 82 123 4567" 
                      className="max-w-xs"
                      disabled
                    />
                    <Button variant="outline" disabled>Verify Number</Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                    WhatsApp integration requires a Pro or Team plan.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Tender Categories</CardTitle>
              <CardDescription>
                Manage categories for organizing your tenders
                {currentCompany && (
                  <span className="block mt-1">
                    Categories for{' '}
                    <span className="font-medium">{currentCompany.name}</span>
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Category */}
              <div className="flex gap-2">
                <Input
                  placeholder="New category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleCreateCategory()
                    }
                  }}
                />
                <Button
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim() || createCategory.isPending}
                >
                  {createCategory.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Add'
                  )}
                </Button>
              </div>

              <Separator />

              {/* Categories List */}
              {categoriesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : categories && categories.length > 0 ? (
                <div className="space-y-2">
                  {categories.map((category) => {
                    const isSystemCategory = category.user_company_id === null
                    return (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span>{category.name}</span>
                          {isSystemCategory && (
                            <Badge variant="secondary" className="text-xs">
                              System
                            </Badge>
                          )}
                        </div>
                        {!isSystemCategory && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                              >
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Category
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete &quot;
                                  {category.name}&quot;? Tenders using this
                                  category will become uncategorized.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteCategory(category.id)
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No categories yet</p>
                  <p className="text-sm">Create your first category above</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Current Plan
                  {currentPlan !== 'free' && (
                    <Crown className="h-5 w-5 text-yellow-500" />
                  )}
                </CardTitle>
                <CardDescription>
                  Manage your subscription and billing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptionLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${
                          currentPlan === 'free'
                            ? 'bg-slate-100 dark:bg-slate-800'
                            : currentPlan === 'pro'
                            ? 'bg-primary/10'
                            : 'bg-yellow-100 dark:bg-yellow-900/20'
                        }`}>
                          {currentPlan === 'free' ? (
                            <User className="h-6 w-6" />
                          ) : currentPlan === 'pro' ? (
                            <Zap className="h-6 w-6 text-primary" />
                          ) : (
                            <Crown className="h-6 w-6 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg capitalize">
                              {planDetails.name} Plan
                            </h3>
                            {subscription?.status === 'active' && currentPlan !== 'free' && (
                              <Badge variant="default" className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            )}
                            {subscription?.status === 'past_due' && (
                              <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Past Due
                              </Badge>
                            )}
                            {subscription?.cancel_at_period_end && (
                              <Badge variant="secondary">Canceling</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {planDetails.description}
                          </p>
                        </div>
                      </div>
                      {currentPlan === 'free' ? (
                        <Link href="/pricing">
                          <Button>
                            <Zap className="h-4 w-4 mr-2" />
                            Upgrade
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={handleManageBilling}
                          disabled={billingLoading}
                        >
                          {billingLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <ExternalLink className="h-4 w-4 mr-2" />
                          )}
                          Manage Billing
                        </Button>
                      )}
                    </div>

                    {subscription?.current_period_end && currentPlan !== 'free' && (
                      <div className="text-sm text-muted-foreground">
                        {subscription.cancel_at_period_end ? (
                          <p>
                            Your subscription will end on{' '}
                            <span className="font-medium text-foreground">
                              {new Date(subscription.current_period_end).toLocaleDateString()}
                            </span>
                          </p>
                        ) : (
                          <p>
                            Next billing date:{' '}
                            <span className="font-medium text-foreground">
                              {new Date(subscription.current_period_end).toLocaleDateString()}
                            </span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Credits
                </CardTitle>
                <CardDescription>
                  Purchase additional credits for AI tender analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg border bg-primary/5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{currentCompany?.ai_credits ?? 0}</span>
                      <span className="text-sm text-muted-foreground">Available Credits</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      One credit is used for each AI compliance scan.
                    </p>
                  </div>
                  <Button 
                    onClick={handleTopUp} 
                    disabled={topupLoading}
                    variant="default"
                  >
                    {topupLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Buy 10 Credits (R250)
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan Features</CardTitle>
                <CardDescription>
                  What&apos;s included in your {planDetails.name} plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">Active Tenders</span>
                    <Badge variant="secondary">
                      {planDetails.features.maxTenders === -1
                        ? 'Unlimited'
                        : planDetails.features.maxTenders}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">Team Members</span>
                    <Badge variant="secondary">{planDetails.features.maxUsers}</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">Export to CSV/Excel</span>
                    <Badge variant={planDetails.features.export ? 'default' : 'secondary'}>
                      {planDetails.features.export ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">Analytics</span>
                    <Badge variant={planDetails.features.analytics ? 'default' : 'secondary'}>
                      {planDetails.features.analytics ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">Competitor Tracking</span>
                    <Badge variant={planDetails.features.competitorTracking ? 'default' : 'secondary'}>
                      {planDetails.features.competitorTracking ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">Procurement Plans</span>
                    <Badge variant={planDetails.features.procurementPlans ? 'default' : 'secondary'}>
                      {planDetails.features.procurementPlans ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">Monthly AI Credits</span>
                    <Badge variant="secondary">
                      {(planDetails.features as any).aiCredits ?? 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {currentPlan === 'free' && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Upgrade to Pro
                  </CardTitle>
                  <CardDescription>
                    Unlock unlimited tenders and advanced features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">R149<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                      <p className="text-sm text-muted-foreground">or R1,199/year (save 33%)</p>
                    </div>
                    <Link href="/pricing">
                      <Button size="lg">
                        View Plans
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Company Profile Tab */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Ghost Writer Profile
              </CardTitle>
              <CardDescription>
                Help our AI write better tender submissions by telling it about your company
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <FormLabel>Company History & Experience</FormLabel>
                <Textarea
                  placeholder="Describe your company's background, years in business, major achievements, and areas of expertise..."
                  value={companyHistory}
                  onChange={(e) => setCompanyHistory(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  This helps the AI understand your company's story and credibility.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <FormLabel>Core Services/Products</FormLabel>
                <Input
                  placeholder="e.g., IT Consulting, Web Development, Infrastructure"
                  value={coreServices}
                  onChange={(e) => setCoreServices(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of services your company provides.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <FormLabel>BEE Level</FormLabel>
                <Input
                  type="number"
                  min="1"
                  max="8"
                  placeholder="1-8"
                  value={beeLevel}
                  onChange={(e) => setBeeLevel(e.target.value)}
                  className="max-w-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  Your company's B-BBEE contributor level (1 is highest).
                </p>
              </div>

              <Separator />

              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <AlertCircle className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">
                  This information is stored securely and only used to generate tender proposals. The more detail you provide, the better the AI can write on your behalf.
                </p>
              </div>

              <Button onClick={handleSaveCompanyProfile} disabled={profileSaving}>
                {profileSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Save Company Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-5 w-64 mt-2" />
      </div>
      <Skeleton className="h-10 w-80" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
