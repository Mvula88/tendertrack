'use client'

import { useState } from 'react'
import { 
  ShieldCheck, 
  AlertTriangle, 
  FileSearch, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  FileText,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useCompliance } from '@/hooks/use-compliance'
import { useCompany } from '@/contexts/company-context'
import { formatDistanceToNow } from 'date-fns'

interface ComplianceCheckerProps {
  tenderId: string
  documentUrl?: string | null
}

export function ComplianceChecker({ tenderId, documentUrl }: ComplianceCheckerProps) {
  const { currentCompany } = useCompany()
  const { report, isLoading, analyze, isAnalyzing } = useCompliance(tenderId)

  if (isLoading) return <div className="animate-pulse h-48 bg-muted rounded-lg" />

  const handleAnalyze = () => {
    if (!documentUrl) return
    analyze({ documentUrl })
  }

  const requirements = (report?.requirements as string[]) || []
  const missingDocs = (report?.missing_documents as string[]) || []
  const checklist = (report?.mandatory_checklist as { item: string; status: string }[]) || []

  const complianceScore = report 
    ? Math.round(((requirements.length - missingDocs.length) / requirements.length) * 100)
    : 0

  return (
    <Card className="border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            AI Compliance Checker
          </CardTitle>
          <CardDescription>
            AI-powered analysis of your tender documents for responsiveness.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-primary border-primary/20">
            <Sparkles className="h-3 w-3 mr-1" />
            {currentCompany?.ai_credits ?? 0} Credits
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!report ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-xl bg-muted/30">
            <FileSearch className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold">No Compliance Report Yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              Upload the tender document and run our AI to identify all mandatory requirements.
            </p>
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !documentUrl}
              className="min-w-[180px]"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing PDF...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Run AI Analysis
                </>
              )}
            </Button>
            {!documentUrl && (
              <p className="text-xs text-red-500 mt-2">
                Please upload a tender document first.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Compliance Score */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Overall Responsiveness Score</span>
                <span className={complianceScore > 70 ? "text-green-500" : "text-orange-500"}>
                  {complianceScore}%
                </span>
              </div>
              <Progress value={complianceScore} className="h-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mandatory Checklist */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Required Forms (SBD)
                </h4>
                <div className="space-y-2">
                  {checklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50 border">
                      <div className="h-4 w-4 rounded-full border border-primary/30" />
                      <span>{item.item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Documents Alert */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Missing Compliance Docs
                </h4>
                <div className="space-y-2">
                  {missingDocs.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 text-orange-800 dark:text-orange-300">
                      <XCircle className="h-4 w-4 shrink-0" />
                      <span>{doc}</span>
                    </div>
                  ))}
                  {missingDocs.length === 0 && (
                    <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 text-green-800 dark:text-green-300">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>All mandatory docs identified.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Last analyzed {formatDistanceToNow(new Date(report.created_at))} ago
              </span>
              <Button variant="ghost" size="sm" onClick={handleAnalyze} disabled={isAnalyzing}>
                {isAnalyzing ? "Analyzing..." : "Re-run Analysis (1 Credit)"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
