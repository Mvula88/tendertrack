'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Building2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useCompany } from '@/contexts/company-context'

const companySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  registration_number: z.string().optional(),
  vat_number: z.string().optional(),
  contact_email: z.string().email('Please enter a valid email address'),
  contact_phone: z.string().min(1, 'Phone number is required'),
  address: z.string().optional(),
})

type CompanyFormData = z.infer<typeof companySchema>

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { refreshCompanies } = useCompany()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  })

  const onSubmit = async (data: CompanyFormData) => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('You must be logged in to create a company')
        router.push('/login')
        return
      }

      // Create the company
      const { data: company, error: companyError } = await supabase
        .from('user_companies')
        .insert({
          name: data.name,
          registration_number: data.registration_number || null,
          vat_number: data.vat_number || null,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          address: data.address || null,
          created_by: user.id,
        })
        .select()
        .single()

      if (companyError) {
        toast.error(companyError.message)
        return
      }

      // Add user as owner
      const { error: memberError } = await supabase
        .from('user_company_members')
        .insert({
          user_company_id: company.id,
          user_id: user.id,
          role: 'owner',
        })

      if (memberError) {
        toast.error(memberError.message)
        return
      }

      toast.success('Company created successfully!')
      await refreshCompanies()
      router.push('/dashboard')
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Set Up Your Company
          </CardTitle>
          <CardDescription className="text-center">
            Create your first company to start tracking tenders
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Digital Wave Technologies cc"
                {...register('name')}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registration_number">Registration Number</Label>
                <Input
                  id="registration_number"
                  placeholder="Optional"
                  {...register('registration_number')}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vat_number">VAT Number</Label>
                <Input
                  id="vat_number"
                  placeholder="Optional"
                  {...register('vat_number')}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email *</Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="info@company.com"
                {...register('contact_email')}
                disabled={isLoading}
              />
              {errors.contact_email && (
                <p className="text-sm text-destructive">{errors.contact_email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone *</Label>
              <Input
                id="contact_phone"
                placeholder="+27 12 345 6789"
                {...register('contact_phone')}
                disabled={isLoading}
              />
              {errors.contact_phone && (
                <p className="text-sm text-destructive">{errors.contact_phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Company address (optional)"
                {...register('address')}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Company
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
