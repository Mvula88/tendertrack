'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { CalendarIcon, Loader2, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useCreateBidOpeningResult } from '@/hooks/use-bid-results'
import { cn } from '@/lib/utils'

const bidItemSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
})

const bidOpeningFormSchema = z.object({
  opening_date: z.date({ message: 'Opening date is required' }),
  our_bid_amount: z.number().min(0.01, 'Amount must be greater than 0'),
  lowest_bid_amount: z.number().min(0.01, 'Amount must be greater than 0'),
  is_lowest_bidder: z.boolean(),
  winner_company_name: z.string().optional(),
  total_bidders: z.number().min(1, 'Must have at least 1 bidder'),
  all_bids: z.array(bidItemSchema).optional(),
  notes: z.string().optional(),
})

type BidOpeningFormData = z.infer<typeof bidOpeningFormSchema>

interface BidOpeningResultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenderId: string
  defaultOurBidAmount?: number | null
}

export function BidOpeningResultDialog({
  open,
  onOpenChange,
  tenderId,
  defaultOurBidAmount,
}: BidOpeningResultDialogProps) {
  const createBidResult = useCreateBidOpeningResult()

  const form = useForm<BidOpeningFormData>({
    resolver: zodResolver(bidOpeningFormSchema),
    defaultValues: {
      opening_date: new Date(),
      our_bid_amount: defaultOurBidAmount || 0,
      lowest_bid_amount: 0,
      is_lowest_bidder: false,
      winner_company_name: '',
      total_bidders: 1,
      all_bids: [],
      notes: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'all_bids',
  })

  const onSubmit = async (data: BidOpeningFormData) => {
    try {
      await createBidResult.mutateAsync({
        tender_id: tenderId,
        opening_date: data.opening_date.toISOString(),
        our_bid_amount: data.our_bid_amount,
        lowest_bid_amount: data.lowest_bid_amount,
        is_lowest_bidder: data.is_lowest_bidder,
        winner_company_name: data.winner_company_name || null,
        total_bidders: data.total_bidders,
        all_bids_data: data.all_bids && data.all_bids.length > 0 ? data.all_bids : null,
        notes: data.notes || null,
      })

      form.reset()
      onOpenChange(false)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const isLowestBidder = form.watch('is_lowest_bidder')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Bid Opening Result</DialogTitle>
          <DialogDescription>
            Record the results from the bid opening session
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="opening_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Opening Date *</FormLabel>
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
                name="total_bidders"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Bidders *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="our_bid_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Our Bid Amount *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lowest_bid_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lowest Bid Amount *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_lowest_bidder"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>We are the lowest bidder</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {!isLowestBidder && (
              <FormField
                control={form.control}
                name="winner_company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Winner Company Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Name of the winning company"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* All Bids Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>All Bids (Optional)</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ company: '', amount: 0 })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Bid
                </Button>
              </div>

              {fields.length > 0 && (
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start">
                      <FormField
                        control={form.control}
                        name={`all_bids.${index}.company`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Company name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`all_bids.${index}.amount`}
                        render={({ field }) => (
                          <FormItem className="w-40">
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Amount"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about the bid opening..."
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
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createBidResult.isPending}>
                {createBidResult.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Result
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
