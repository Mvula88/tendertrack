'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, X, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
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
import { useCreateCompetitor, useUpdateCompetitor } from '@/hooks/use-competitors'
import type { Competitor } from '@/types/database'

const competitorFormSchema = z.object({
  name: z.string().min(1, 'Competitor name is required'),
  specialty_areas: z.array(z.string()).optional(),
  notes: z.string().optional(),
  shared: z.boolean(),
})

type CompetitorFormData = z.infer<typeof competitorFormSchema>

interface CompetitorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  competitor?: Competitor | null
}

export function CompetitorDialog({
  open,
  onOpenChange,
  competitor,
}: CompetitorDialogProps) {
  const createCompetitor = useCreateCompetitor()
  const updateCompetitor = useUpdateCompetitor()

  const [newSpecialty, setNewSpecialty] = useState('')

  const isEditing = !!competitor

  const form = useForm<CompetitorFormData>({
    resolver: zodResolver(competitorFormSchema),
    defaultValues: {
      name: '',
      specialty_areas: [],
      notes: '',
      shared: true,
    },
  })

  useEffect(() => {
    if (competitor) {
      form.reset({
        name: competitor.name,
        specialty_areas: competitor.specialty_areas || [],
        notes: competitor.notes || '',
        shared: competitor.user_company_id === null,
      })
    } else {
      form.reset({
        name: '',
        specialty_areas: [],
        notes: '',
        shared: true,
      })
    }
  }, [competitor, form])

  const onSubmit = async (data: CompetitorFormData) => {
    try {
      if (isEditing) {
        await updateCompetitor.mutateAsync({
          id: competitor.id,
          name: data.name,
          specialty_areas: data.specialty_areas,
          notes: data.notes || null,
          shared: data.shared,
        })
      } else {
        await createCompetitor.mutateAsync({
          name: data.name,
          specialty_areas: data.specialty_areas,
          notes: data.notes || null,
          shared: data.shared,
        })
      }

      onOpenChange(false)
    } catch (error) {
      // Error is handled by mutation
    }
  }

  const handleAddSpecialty = () => {
    if (!newSpecialty.trim()) return

    const currentAreas = form.getValues('specialty_areas') || []
    if (!currentAreas.includes(newSpecialty.trim())) {
      form.setValue('specialty_areas', [...currentAreas, newSpecialty.trim()])
    }
    setNewSpecialty('')
  }

  const handleRemoveSpecialty = (area: string) => {
    const currentAreas = form.getValues('specialty_areas') || []
    form.setValue(
      'specialty_areas',
      currentAreas.filter((a) => a !== area)
    )
  }

  const isSubmitting = createCompetitor.isPending || updateCompetitor.isPending
  const specialtyAreas = form.watch('specialty_areas') || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Competitor' : 'Add New Competitor'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the competitor information below'
              : 'Add a competitor to track their bids and analyze their strategy'}
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
                    <Input placeholder="e.g., ABC Company" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialty_areas"
              render={() => (
                <FormItem>
                  <FormLabel>Specialty Areas</FormLabel>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a specialty..."
                        value={newSpecialty}
                        onChange={(e) => setNewSpecialty(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddSpecialty()
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleAddSpecialty}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {specialtyAreas.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {specialtyAreas.map((area, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => handleRemoveSpecialty(area)}
                          >
                            {area}
                            <X className="h-3 w-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <FormDescription>
                    Press Enter or click + to add specialties. Click a tag to
                    remove it.
                  </FormDescription>
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
                      placeholder="Any additional notes about this competitor..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
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
                    <FormLabel>Share across all companies</FormLabel>
                    <FormDescription>
                      When enabled, this competitor will be visible to all your
                      companies
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
                {isEditing ? 'Update' : 'Add Competitor'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
