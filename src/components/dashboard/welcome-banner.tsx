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
    <Card className="relative overflow-hidden border-primary/20 bg-primary/5 dark:bg-primary/10">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={() => setIsVisible(false)}
      >
        <X className="h-4 w-4" />
      </Button>
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <h2 className="text-xl font-bold">Welcome to TenderTrack!</h2>
            </div>
            <p className="text-muted-foreground max-w-lg">
              Let&apos;s get you started. Follow these steps to set up your tendering workspace
              and never miss a bid deadline again.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {step.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={cn(step.completed && "text-muted-foreground line-through")}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {showSampleDataButton && (
            <div className="flex flex-col gap-3 min-w-[200px]">
              <div className="text-sm font-medium text-center md:text-left">
                Want to see it in action?
              </div>
              <Button 
                onClick={handleLoadSampleData} 
                disabled={isSeeding}
                className="w-full shadow-lg shadow-primary/20"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Load Sample Data
                  </>
                )}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                Instantly fill your dashboard with realistic data.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
