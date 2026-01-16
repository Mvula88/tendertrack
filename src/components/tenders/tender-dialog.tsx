'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useCreateTender, useUpdateTender } from '@/hooks/use-tenders'
import { useCreateOrganization } from '@/hooks/use-organizations'
import { useCreateCategory } from '@/hooks/use-categories'
import type { TenderCategory, Organization, TenderWithRelations, TenderStatus } from '@/types/database'
import { cn } from '@/lib/utils'

const tenderFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  organization_id: z.string().min(1, 'Organization is required'),
  category_id: z.string().optional(),
  due_date: z.date({ message: 'Due date is required' }),
  document_url: z.string().optional().nullable(),
  status: z.enum([
    'identified',
    'evaluating',
    'preparing',
    'submitted',
    'bid_opening',
    'under_evaluation',
    'won',
    'lost',
    'abandoned',
  ] as const),
  applied: z.boolean(),
  our_bid_amount: z.number().optional().nullable(),
  priority_score: z.number().min(1).max(5).optional().nullable(),
})

type TenderFormData = z.infer<typeof tenderFormSchema>

interface TenderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tender?: TenderWithRelations | null
  categories: TenderCategory[]
  organizations: Organization[]
}

const statusOptions: { value: TenderStatus; label: string }[] = [
  { value: 'identified', label: 'Identified' },
  { value: 'evaluating', label: 'Evaluating' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'bid_opening', label: 'Bid Opening' },
  { value: 'under_evaluation', label: 'Under Evaluation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'abandoned', label: 'Abandoned' },
]

export function TenderDialog({
  open,
  onOpenChange,
  tender,
  categories,
  organizations,
}: TenderDialogProps) {
  const createTender = useCreateTender()
  const updateTender = useUpdateTender()
  const createOrganization = useCreateOrganization()
  const createCategory = useCreateCategory()

  const [showNewOrgInput, setShowNewOrgInput] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const isEditing = !!tender

  const form = useForm<TenderFormData>({
    resolver: zodResolver(tenderFormSchema),
    defaultValues: {
      title: '',
      description: '',
      organization_id: '',
      category_id: '',
      due_date: new Date(),
      document_url: '',
      status: 'identified',
      applied: false,
      our_bid_amount: null,
      priority_score: null,
    },
  })

  useEffect(() => {
    if (tender) {
      form.reset({
        title: tender.title,
        description: tender.description || '',
        organization_id: tender.organization_id,
        category_id: tender.category_id || '',
        due_date: new Date(tender.due_date),
        document_url: tender.document_url || '',
        status: tender.status,
        applied: tender.applied,
        our_bid_amount: tender.our_bid_amount,
        priority_score: tender.priority_score,
      })
    } else {
      form.reset({
        title: '',
        description: '',
        organization_id: '',
        category_id: '',
        due_date: new Date(),
        document_url: '',
        status: 'identified',
        applied: false,
        our_bid_amount: null,
        priority_score: null,
      })
    }
  }, [tender, form])

  const onSubmit = async (data: TenderFormData) => {
    try {
      const tenderData = {
        title: data.title,
        description: data.description || null,
        organization_id: data.organization_id,
        category_id: data.category_id || null,
        due_date: data.due_date.toISOString(),
        document_url: data.document_url || null,
        status: data.status,
        applied: data.applied,
        our_bid_amount: data.our_bid_amount,
        priority_score: data.priority_score,
        applied_date: data.applied ? new Date().toISOString() : null,
      }

      if (isEditing) {
        await updateTender.mutateAsync({
          id: tender.id,
          ...tenderData,
        })
      } else {
        await createTender.mutateAsync(tenderData)
      }

      onOpenChange(false)
    } catch (error) {
      // Error is handled by mutation
    }
  }

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) return

    try {
      const newOrg = await createOrganization.mutateAsync({
        name: newOrgName.trim(),
        type: 'ministry',
        shared: true,
      })
      form.setValue('organization_id', newOrg.id)
      setNewOrgName('')
      setShowNewOrgInput(false)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      const newCategory = await createCategory.mutateAsync(newCategoryName.trim())
      form.setValue('category_id', newCategory.id)
      setNewCategoryName('')
      setShowNewCategoryInput(false)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const isSubmitting = createTender.isPending || updateTender.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Tender' : 'Add New Tender'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the tender information below'
              : 'Fill in the details to add a new tender'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter tender title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter tender description"
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="organization_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization *</FormLabel>
                    {showNewOrgInput ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="New organization name"
                          value={newOrgName}
                          onChange={(e) => setNewOrgName(e.target.value)}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleCreateOrganization}
                          disabled={createOrganization.isPending}
                        >
                          {createOrganization.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Add'
                          )}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setShowNewOrgInput(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select organization" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {organizations.map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                {org.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => setShowNewOrgInput(true)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    {showNewCategoryInput ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="New category name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleCreateCategory}
                          disabled={createCategory.isPending}
                        >
                          {createCategory.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Add'
                          )}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setShowNewCategoryInput(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Select
                          value={field.value || ''}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => setShowNewCategoryInput(true)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
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
            </div>

            <FormField
              control={form.control}
              name="document_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tender Document</FormLabel>
                  <FormControl>
                    <FileUpload
                      value={field.value || undefined}
                      onChange={(url) => field.onChange(url)}
                      bucket="documents"
                      folder="tenders"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      maxSizeMB={10}
                      placeholder="Upload tender document"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority (1-5)</FormLabel>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Button
                          key={star}
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="p-1"
                          onClick={() => {
                            field.onChange(
                              field.value === star ? null : star
                            )
                          }}
                        >
                          <span
                            className={cn(
                              'text-xl',
                              field.value && star <= field.value
                                ? 'text-yellow-500'
                                : 'text-gray-300'
                            )}
                          >
                            ★
                          </span>
                        </Button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="our_bid_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Our Bid Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value
                          field.onChange(value ? parseFloat(value) : null)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="applied"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Mark as Applied</FormLabel>
                    <FormDescription>
                      Check this if you have submitted your bid for this tender
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
                {isEditing ? 'Update Tender' : 'Create Tender'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
