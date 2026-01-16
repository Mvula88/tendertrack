'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FileUpload } from '@/components/ui/file-upload'
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
import { useOrganizations } from '@/hooks/use-organizations'
import { useCreateProcurementPlan } from '@/hooks/use-procurement-plans'

const procurementPlanFormSchema = z.object({
  organization_id: z.string().min(1, 'Organization is required'),
  fiscal_year: z.string().min(1, 'Fiscal year is required'),
  revision_number: z.number().min(0).max(10),
  file_url: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

const revisionOptions = [
  { value: 0, label: 'Original' },
  { value: 1, label: 'Revision 1' },
  { value: 2, label: 'Revision 2' },
  { value: 3, label: 'Revision 3' },
  { value: 4, label: 'Revision 4' },
  { value: 5, label: 'Revision 5' },
]

type ProcurementPlanFormData = z.infer<typeof procurementPlanFormSchema>

interface ProcurementPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Generate fiscal years from current year back 5 years and forward 2 years
const generateFiscalYears = () => {
  const currentYear = new Date().getFullYear()
  const years: string[] = []

  for (let i = currentYear + 2; i >= currentYear - 5; i--) {
    years.push(`${i}/${i + 1}`)
  }

  return years
}

const fiscalYears = generateFiscalYears()

export function ProcurementPlanDialog({
  open,
  onOpenChange,
}: ProcurementPlanDialogProps) {
  const { data: organizations, isLoading: orgsLoading } = useOrganizations()
  const createPlan = useCreateProcurementPlan()

  const form = useForm<ProcurementPlanFormData>({
    resolver: zodResolver(procurementPlanFormSchema),
    defaultValues: {
      organization_id: '',
      fiscal_year: '',
      revision_number: 0,
      file_url: '',
      notes: '',
    },
  })

  const onSubmit = async (data: ProcurementPlanFormData) => {
    try {
      await createPlan.mutateAsync({
        organization_id: data.organization_id,
        fiscal_year: data.fiscal_year,
        revision_number: data.revision_number,
        file_url: data.file_url || null,
        notes: data.notes || null,
      })

      form.reset()
      onOpenChange(false)
    } catch (error) {
      // Error is handled by mutation
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Procurement Plan</DialogTitle>
          <DialogDescription>
            Record a procurement plan document from an organization
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="organization_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization *</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={orgsLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {organizations?.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fiscal_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fiscal Year *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fiscal year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fiscalYears.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
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
                name="revision_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Version</FormLabel>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(val) => field.onChange(parseInt(val))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select version" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {revisionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="file_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Procurement Plan Document</FormLabel>
                  <FormControl>
                    <FileUpload
                      value={field.value || undefined}
                      onChange={(url) => field.onChange(url)}
                      bucket="documents"
                      folder="procurement-plans"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      maxSizeMB={10}
                      placeholder="Upload procurement plan"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about this procurement plan..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createPlan.isPending}>
                {createPlan.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Plan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
