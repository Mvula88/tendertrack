'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateOrganization, useUpdateOrganization } from '@/hooks/use-organizations'
import type { Organization, OrganizationType } from '@/types/database'

const organizationFormSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  type: z.enum(['ministry', 'parastatal', 'private_company', 'municipality'] as const),
  contact_email: z.string().email('Invalid email').optional().or(z.literal('')),
  contact_phone: z.string().optional().or(z.literal('')),
  shared: z.boolean(),
})

type OrganizationFormData = z.infer<typeof organizationFormSchema>

interface OrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization?: Organization | null
}

const typeOptions: { value: OrganizationType; label: string }[] = [
  { value: 'ministry', label: 'Ministry' },
  { value: 'parastatal', label: 'Parastatal' },
  { value: 'private_company', label: 'Private Company' },
  { value: 'municipality', label: 'Municipality' },
]

export function OrganizationDialog({
  open,
  onOpenChange,
  organization,
}: OrganizationDialogProps) {
  const createOrganization = useCreateOrganization()
  const updateOrganization = useUpdateOrganization()

  const isEditing = !!organization

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: '',
      type: 'ministry',
      contact_email: '',
      contact_phone: '',
      shared: true,
    },
  })

  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name,
        type: organization.type,
        contact_email: organization.contact_email || '',
        contact_phone: organization.contact_phone || '',
        shared: organization.shared,
      })
    } else {
      form.reset({
        name: '',
        type: 'ministry',
        contact_email: '',
        contact_phone: '',
        shared: true,
      })
    }
  }, [organization, form])

  const onSubmit = async (data: OrganizationFormData) => {
    try {
      const orgData = {
        name: data.name,
        type: data.type,
        contact_email: data.contact_email || null,
        contact_phone: data.contact_phone || null,
        shared: data.shared,
      }

      if (isEditing) {
        await updateOrganization.mutateAsync({
          id: organization.id,
          ...orgData,
        })
      } else {
        await createOrganization.mutateAsync(orgData)
      }

      onOpenChange(false)
    } catch (error) {
      // Error is handled by mutation
    }
  }

  const isSubmitting = createOrganization.isPending || updateOrganization.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Organization' : 'Add New Organization'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the organization details below'
              : 'Add a new organization to track tenders from'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Ministry of Health"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {typeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="contact@organization.gov"
                      {...field}
                    />
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
                  <FormLabel>Contact Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+27 12 345 6789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shared"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Share with all companies</FormLabel>
                    <FormDescription>
                      When enabled, this organization will be visible to all
                      your companies
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
