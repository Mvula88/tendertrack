'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Loader2, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCompany } from '@/contexts/company-context'
import { useTenderStats } from '@/hooks/use-tenders'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function WelcomeBanner() {
  const { currentCompany, refreshCompanies } = useCompany()
  const { data: stats } = useTenderStats()
  const [isSeeding, setIsSeeding] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  if (!currentCompany || !isVisible) return null

  // Only show if company has no tenders and hasn't loaded sample data yet
  const showSampleDataButton = !currentCompany.has_sample_data && (stats?.total ?? 0) === 0

  if (!showSampleDataButton && currentCompany.has_sample_data) return null

  const handleLoadSampleData = async () => {
    setIsSeeding(true)
    try {
      const response = await fetch('/api/companies/sample-data', {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to load sample data')

      toast.success('Sample data loaded successfully!')
      await refreshCompanies()
    } catch (error) {
      console.error(error)
      toast.error('Failed to load sample data. Please try again.')
    } finally {
      setIsSeeding(false)
    }
  }

  const steps = [
    { title: 'Create Company', completed: true },
    { title: 'Add your first Tender', completed: (stats?.total ?? 0) > 0 },
    { title: 'Upload a Procurement Plan', completed: false },
    { title: 'Invite a team member', completed: false },
  ]

  return (
    <Card className="relative overflow-hidden border-blue-200 dark:border-blue-800/30 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
        onClick={() => setIsVisible(false)}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Welcome to TenderTrack!</h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Get started by completing these steps to set up your workspace.
            </p>
            
            <div className="flex flex-wrap gap-3 pt-1">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  {step.completed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground/50" />
                  )}
                  <span className={cn(
                    "font-medium",
                    step.completed ? "text-muted-foreground/70" : "text-foreground"
                  )}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {showSampleDataButton && (
            <div className="flex flex-col gap-2 min-w-[180px]">
              <Button 
                onClick={handleLoadSampleData} 
                disabled={isSeeding}
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Load Sample Data
                  </>
                )}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center leading-tight">
                See how it works with demo data
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
