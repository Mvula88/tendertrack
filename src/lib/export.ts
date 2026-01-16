import { format } from 'date-fns'
import type { TenderWithRelations } from '@/types/database'

/**
 * Escapes a value for CSV format
 */
function escapeCSVValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return ''

  const stringValue = String(value)

  // If value contains comma, newline, or quote, wrap in quotes and escape existing quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Converts an array of objects to CSV string
 */
function arrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T | string; header: string; formatter?: (row: T) => string }[]
): string {
  // Create header row
  const headers = columns.map(col => escapeCSVValue(col.header)).join(',')

  // Create data rows
  const rows = data.map(row => {
    return columns.map(col => {
      if (col.formatter) {
        return escapeCSVValue(col.formatter(row))
      }
      const value = (col.key as string).split('.').reduce((obj: unknown, key) => {
        return obj && typeof obj === 'object' ? (obj as Record<string, unknown>)[key] : undefined
      }, row)
      return escapeCSVValue(value as string | number | boolean | null | undefined)
    }).join(',')
  })

  return [headers, ...rows].join('\n')
}

/**
 * Downloads a string as a file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Status labels for display
 */
const statusLabels: Record<string, string> = {
  identified: 'Identified',
  evaluating: 'Evaluating',
  preparing: 'Preparing',
  submitted: 'Submitted',
  bid_opening: 'Bid Opening',
  under_evaluation: 'Under Evaluation',
  won: 'Won',
  lost: 'Lost',
  abandoned: 'Abandoned',
}

/**
 * Export tenders to CSV
 */
export function exportTendersToCSV(tenders: TenderWithRelations[]): void {
  const columns = [
    { key: 'title', header: 'Title' },
    {
      key: 'organization.name',
      header: 'Organization',
      formatter: (row: TenderWithRelations) => row.organization?.name ?? ''
    },
    {
      key: 'category.name',
      header: 'Category',
      formatter: (row: TenderWithRelations) => row.category?.name ?? ''
    },
    { key: 'description', header: 'Description' },
    {
      key: 'status',
      header: 'Status',
      formatter: (row: TenderWithRelations) => statusLabels[row.status] ?? row.status
    },
    {
      key: 'due_date',
      header: 'Due Date',
      formatter: (row: TenderWithRelations) => format(new Date(row.due_date), 'yyyy-MM-dd')
    },
    {
      key: 'applied',
      header: 'Applied',
      formatter: (row: TenderWithRelations) => row.applied ? 'Yes' : 'No'
    },
    {
      key: 'applied_date',
      header: 'Applied Date',
      formatter: (row: TenderWithRelations) =>
        row.applied_date ? format(new Date(row.applied_date), 'yyyy-MM-dd') : ''
    },
    {
      key: 'our_bid_amount',
      header: 'Our Bid Amount',
      formatter: (row: TenderWithRelations) =>
        row.our_bid_amount ? row.our_bid_amount.toFixed(2) : ''
    },
    { key: 'priority_score', header: 'Priority Score' },
    { key: 'document_url', header: 'Document URL' },
    {
      key: 'created_at',
      header: 'Created Date',
      formatter: (row: TenderWithRelations) => format(new Date(row.created_at), 'yyyy-MM-dd')
    },
  ]

  const csv = arrayToCSV(tenders, columns)
  const filename = `tenders-export-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`

  downloadFile(csv, filename, 'text/csv;charset=utf-8;')
}

/**
 * Export tenders to Excel-compatible CSV (with BOM for proper UTF-8 encoding in Excel)
 */
export function exportTendersToExcel(tenders: TenderWithRelations[]): void {
  const columns = [
    { key: 'title', header: 'Title' },
    {
      key: 'organization.name',
      header: 'Organization',
      formatter: (row: TenderWithRelations) => row.organization?.name ?? ''
    },
    {
      key: 'category.name',
      header: 'Category',
      formatter: (row: TenderWithRelations) => row.category?.name ?? ''
    },
    { key: 'description', header: 'Description' },
    {
      key: 'status',
      header: 'Status',
      formatter: (row: TenderWithRelations) => statusLabels[row.status] ?? row.status
    },
    {
      key: 'due_date',
      header: 'Due Date',
      formatter: (row: TenderWithRelations) => format(new Date(row.due_date), 'yyyy-MM-dd')
    },
    {
      key: 'applied',
      header: 'Applied',
      formatter: (row: TenderWithRelations) => row.applied ? 'Yes' : 'No'
    },
    {
      key: 'applied_date',
      header: 'Applied Date',
      formatter: (row: TenderWithRelations) =>
        row.applied_date ? format(new Date(row.applied_date), 'yyyy-MM-dd') : ''
    },
    {
      key: 'our_bid_amount',
      header: 'Our Bid Amount',
      formatter: (row: TenderWithRelations) =>
        row.our_bid_amount ? row.our_bid_amount.toFixed(2) : ''
    },
    { key: 'priority_score', header: 'Priority Score' },
    { key: 'document_url', header: 'Document URL' },
    {
      key: 'created_at',
      header: 'Created Date',
      formatter: (row: TenderWithRelations) => format(new Date(row.created_at), 'yyyy-MM-dd')
    },
  ]

  const csv = arrayToCSV(tenders, columns)
  // Add BOM (Byte Order Mark) for proper UTF-8 encoding in Excel
  const csvWithBOM = '\ufeff' + csv
  const filename = `tenders-export-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`

  downloadFile(csvWithBOM, filename, 'text/csv;charset=utf-8;')
}
