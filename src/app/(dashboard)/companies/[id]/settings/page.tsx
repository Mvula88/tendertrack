'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Building2,
  Loader2,
  Users,
  Trash2,
  Shield,
  Mail,
  UserPlus,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useCompany } from '@/contexts/company-context'
import { useAuth } from '@/hooks/use-auth'
import type { MemberRole } from '@/types/database'

const companyFormSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  registration_number: z.string().optional(),
  vat_number: z.string().optional(),
  contact_email: z.string().email('Please enter a valid email address'),
  contact_phone: z.string().min(1, 'Phone number is required'),
  address: z.string().optional(),
})

type CompanyFormData = z.infer<typeof companyFormSchema>

interface Member {
  id: string
  user_id: string
  role: MemberRole
  email: string
  created_at: string
}

const roleLabels: Record<MemberRole, { label: string; color: string }> = {
  owner: { label: 'Owner', color: 'bg-purple-100 text-purple-800' },
  admin: { label: 'Admin', color: 'bg-blue-100 text-blue-800' },
  member: { label: 'Member', color: 'bg-green-100 text-green-800' },
  viewer: { label: 'Viewer', color: 'bg-gray-100 text-gray-800' },
}

export default function CompanySettingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const { companies, refreshCompanies, currentCompany } = useCompany()
  const { user } = useAuth()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<MemberRole>('member')
  const [isInviting, setIsInviting] = useState(false)

  const company = companies.find((c) => c.id === id)
  const isOwner = company?.role === 'owner'
  const isAdmin = company?.role === 'admin'
  const canEdit = isOwner || isAdmin

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: '',
      registration_number: '',
      vat_number: '',
      contact_email: '',
      contact_phone: '',
      address: '',
    },
  })

  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name,
        registration_number: company.registration_number || '',
        vat_number: company.vat_number || '',
        contact_email: company.contact_email,
        contact_phone: company.contact_phone,
        address: company.address || '',
      })
      setIsLoading(false)
    }
  }, [company, form])

  useEffect(() => {
    const fetchMembers = async () => {
      if (!id) return

      const { data, error } = await supabase
        .from('user_company_members')
        .select('id, user_id, role, created_at')
        .eq('user_company_id', id)

      if (error) {
        console.error('Error fetching members:', error)
        return
      }

      // Show the current user's email if they're in the list
      // Other users shown with truncated ID (would need profiles table for full emails)
      setMembers(
        data.map((m) => ({
          ...m,
          email: m.user_id === user?.id && user?.email
            ? user.email
            : `User ${m.user_id.slice(0, 8)}...`,
        }))
      )
    }

    fetchMembers()
  }, [id, supabase, user])

  const onSubmit = async (data: CompanyFormData) => {
    if (!canEdit) {
      toast.error('You do not have permission to edit this company')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('user_companies')
        .update({
          name: data.name,
          registration_number: data.registration_number || null,
          vat_number: data.vat_number || null,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          address: data.address || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Company updated successfully')
      await refreshCompanies()
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCompany = async () => {
    if (!isOwner) {
      toast.error('Only the owner can delete this company')
      return
    }

    setIsDeleting(true)
    try {
      // Delete company members first
      const { error: membersError } = await supabase
        .from('user_company_members')
        .delete()
        .eq('user_company_id', id)

      if (membersError) {
        toast.error(membersError.message)
        return
      }

      // Then delete the company
      const { error } = await supabase
        .from('user_companies')
        .delete()
        .eq('id', id)

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Company deleted successfully')
      await refreshCompanies()
      router.push('/companies')
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }

    setIsInviting(true)
    try {
      // Note: This is a placeholder implementation
      // In production, you would:
      // 1. Create an invitations table
      // 2. Send an invitation email via Resend
      // 3. Have the invited user accept the invitation on login/signup

      // For now, we'll just show a toast message
      toast.info(
        `Invitation feature coming soon! Would invite ${inviteEmail} as ${inviteRole}`,
        { duration: 5000 }
      )
      setInviteDialogOpen(false)
      setInviteEmail('')
      setInviteRole('member')
    } catch (error) {
      toast.error('Failed to send invitation')
    } finally {
      setIsInviting(false)
    }
  }

  if (isLoading) {
    return <CompanySettingsSkeleton />
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Building2 className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">Company Not Found</h2>
        <p className="text-muted-foreground">
          The company you&apos;re looking for doesn&apos;t exist or you don&apos;t have
          access.
        </p>
        <Link href="/companies">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Companies
          </Button>
        </Link>
      </div>
    )
  }

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Shield className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground">
          You need to be an owner or admin to access company settings.
        </p>
        <Link href="/companies">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Companies
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <Link href="/companies" className="hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span>Companies</span>
        <span>/</span>
        <span>{company.name}</span>
        <span>/</span>
        <span className="text-foreground">Settings</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
          <p className="text-muted-foreground">
            Manage {company.name}&apos;s settings and team members
          </p>
        </div>
        <Badge className={roleLabels[company.role].color}>
          {roleLabels[company.role].label}
        </Badge>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          {isOwner && <TabsTrigger value="danger">Danger Zone</TabsTrigger>}
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Update your company&apos;s basic information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isSaving} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="registration_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration Number</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isSaving} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="vat_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VAT Number</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={isSaving} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email *</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} disabled={isSaving} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone *</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isSaving} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea
                            className="resize-none"
                            {...field}
                            disabled={isSaving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    People who have access to this company
                  </CardDescription>
                </div>
                {(isOwner || isAdmin) && (
                  <Button onClick={() => setInviteDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No team members found</p>
                  </div>
                ) : (
                  members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{member.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(member.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.user_id === user?.id && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                        <Badge className={roleLabels[member.role].color}>
                          {roleLabels[member.role].label}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Invite Member Dialog */}
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join {company.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={isInviting}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select
                    value={inviteRole}
                    onValueChange={(value) => setInviteRole(value as MemberRole)}
                    disabled={isInviting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {isOwner && <SelectItem value="admin">Admin</SelectItem>}
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {inviteRole === 'admin' && 'Can manage company settings and members'}
                    {inviteRole === 'member' && 'Can create and edit tenders'}
                    {inviteRole === 'viewer' && 'Can only view tenders and data'}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setInviteDialogOpen(false)}
                  disabled={isInviting}
                >
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={isInviting}>
                  {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {isOwner && (
          <TabsContent value="danger">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions that affect this company
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/50">
                  <div>
                    <p className="font-medium">Delete Company</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete this company and all its data
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={isDeleting}>
                        {isDeleting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete Company
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete {company.name}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the company and remove all associated data
                          including tenders, bid results, and team members.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteCompany}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Company
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function CompanySettingsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-5 w-48" />
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-80 mt-2" />
      </div>
      <Skeleton className="h-10 w-64" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
