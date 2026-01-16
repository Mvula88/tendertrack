import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { tenderId, documentUrl } = await request.json()

  if (!tenderId || !documentUrl) {
    return new NextResponse('Missing tenderId or documentUrl', { status: 400 })
  }

  try {
    // 1. Get the user's active company and check credits
    const { data: membership } = await supabase
      .from('user_company_members')
      .select('user_company_id, user_companies(ai_credits)')
      .eq('user_id', user.id)
      .single()

    const company = (membership as any)?.user_companies
    const companyId = membership?.user_company_id

    if (!companyId) {
      return new NextResponse('No company found', { status: 404 })
    }

    if (company.ai_credits < 1) {
      return NextResponse.json(
        { error: 'Insufficient AI credits. Please top up in Settings.' },
        { status: 402 }
      )
    }

    // 2. MOCK AI ANALYSIS LOGIC
    // In a production environment, you would use an AI model (e.g., GPT-4o) 
    // to read the document from documentUrl and extract this data.
    
    // Simulating processing time
    await new Promise(resolve => setTimeout(resolve, 3000))

    const mockAnalysis = {
      requirements: [
        "Company Profile and Experience",
        "Valid Original Tax Clearance Certificate",
        "B-BBEE Verification Certificate (Level 4 or better)",
        "Certified ID copies of all Directors",
        "Proof of Central Supplier Database (CSD) registration",
        "Joint Venture Agreement (if applicable)"
      ],
      missing_documents: [
        "Valid Original Tax Clearance Certificate",
        "Joint Venture Agreement (if applicable)"
      ],
      mandatory_checklist: [
        { item: "Form SBD 1 - Invitation to Bid", status: "pending" },
        { item: "Form SBD 4 - Declaration of Interest", status: "pending" },
        { item: "Form SBD 6.1 - Preference Points Claim", status: "pending" },
        { item: "Form SBD 8 - Past Supply Chain Practices", status: "pending" },
        { item: "Form SBD 9 - Certificate of Independent Bid Determination", status: "pending" }
      ]
    }

    // 3. Save the report to the database
    const { data: report, error: reportError } = await supabase
      .from('tender_compliance_reports')
      .insert({
        tender_id: tenderId,
        requirements: mockAnalysis.requirements,
        missing_documents: mockAnalysis.missing_documents,
        mandatory_checklist: mockAnalysis.mandatory_checklist,
      })
      .select()
      .single()

    if (reportError) throw reportError

    // 4. Deduct 1 credit
    await supabase
      .from('user_companies')
      .update({ ai_credits: company.ai_credits - 1 })
      .eq('id', companyId)

    return NextResponse.json({
      success: true,
      report,
      remainingCredits: company.ai_credits - 1
    })
  } catch (error: any) {
    console.error('Error analyzing tender:', error)
    return new NextResponse(error.message, { status: 500 })
  }
}
