import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ParsedTenderOpportunity } from '@/lib/pdf-parser'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const organizationId = formData.get('organizationId') as string
    const fiscalYear = formData.get('fiscalYear') as string

    if (!file || !organizationId || !fiscalYear) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // 1. Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 2. Parse PDF using dynamic import
    const { parseProcurementPDF } = await import('@/lib/pdf-parser')
    const parsedOpportunities = await parseProcurementPDF(buffer)

    // 3. Upload original file to Supabase Storage
    const fileName = `${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`procurement-plans/${user.id}/${fileName}`, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(uploadData.path)

    // 4. Save to Database
    const { data: plan, error: dbError } = await supabase
      .from('procurement_plans')
      .insert({
        user_company_id: (await supabase.from('user_company_members').select('user_company_id').eq('user_id', user.id).single()).data?.user_company_id,
        organization_id: organizationId,
        fiscal_year: fiscalYear,
        file_url: publicUrl,
        created_by: user.id,
        notes: `Parsed ${parsedOpportunities.length} opportunities from PDF.`
      })
      .select()
      .single()

    if (dbError) throw dbError

    // 5. Save parsed opportunities to database
    if (parsedOpportunities.length > 0) {
      const opportunities = parsedOpportunities.map(opp => ({
        plan_id: plan.id,
        title: opp.title,
        description: opp.description,
        estimated_value: opp.estimatedValue,
        closing_date: opp.closingDate,
        category: opp.category
      }))

      await supabase
        .from('procurement_opportunities')
        .insert(opportunities)
    }

    return NextResponse.json({ 
      success: true, 
      planId: plan.id,
      opportunitiesCount: parsedOpportunities.length 
    })

  } catch (error: any) {
    console.error('Error parsing procurement plan:', error)
    return new NextResponse(error.message, { status: 500 })
  }
}
