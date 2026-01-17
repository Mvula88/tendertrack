import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // 1. Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: tenderId } = await params

    // 2. Fetch tender details with organization
    const { data: tender, error: tenderError } = await supabase
      .from('tenders')
      .select(`
        *,
        organization:organizations(*),
        category:tender_categories(*)
      `)
      .eq('id', tenderId)
      .single()

    if (tenderError || !tender) {
      return NextResponse.json({ error: 'Tender not found' }, { status: 404 })
    }

    // 3. Fetch company profile (for AI context)
    const { data: company, error: companyError } = await supabase
      .from('user_companies')
      .select('id, name, company_history, core_services, bee_level, ai_credits')
      .eq('id', tender.user_company_id)
      .single()

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // 4. Check AI credits
    if (company.ai_credits < 1) {
      return NextResponse.json(
        { error: 'Insufficient AI credits. Please top up to generate proposals.' },
        { status: 402 }
      )
    }

    // 5. Check for Replicate token
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      )
    }

    // 6. Build AI prompt with company context
    const prompt = buildProposalPrompt(tender, company)

    // 7. Generate proposal via Replicate GPT-4o
    const response = await fetch('https://api.replicate.com/v1/models/openai/gpt-4o/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        input: {
          prompt: prompt,
          max_tokens: 3000,
          temperature: 0.7,
          top_p: 0.9
        }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Replicate API error: ${error.detail || response.statusText}`)
    }

    const result = await response.json()
    const proposalText = result.output?.join('') || ''

    // 8. Deduct AI credit
    await supabase
      .from('user_companies')
      .update({ ai_credits: company.ai_credits - 1 })
      .eq('id', company.id)

    // 9. Return generated proposal
    return NextResponse.json({
      success: true,
      proposal: proposalText,
      creditsRemaining: company.ai_credits - 1
    })

  } catch (error: any) {
    console.error('[Generate Proposal] Error:', error.message)
    return NextResponse.json(
      { error: 'Failed to generate proposal' },
      { status: 500 }
    )
  }
}

function buildProposalPrompt(tender: any, company: any) {
  const companyContext = `
Company Name: ${company.name}
Company Background: ${company.company_history || 'Not provided'}
Core Services: ${company.core_services?.join(', ') || 'Not specified'}
B-BBEE Level: ${company.bee_level ? `Level ${company.bee_level}` : 'Not specified'}
`

  const tenderContext = `
Tender Title: ${tender.title}
Issuing Organization: ${tender.organization.name}
Organization Type: ${tender.organization.type}
Category: ${tender.category?.name || 'General'}
Description: ${tender.description || 'No detailed description provided'}
Closing Date: ${new Date(tender.due_date).toLocaleDateString('en-ZA', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}
`

  return `You are a professional South African tender proposal writer. Write a compelling bid proposal for the following tender opportunity.

${companyContext}

${tenderContext}

Write a professional tender proposal following this structure:

1. EXECUTIVE SUMMARY
   - Brief company introduction
   - Understanding of the tender requirements
   - Value proposition (why we should be selected)

2. COMPANY PROFILE & EXPERIENCE
   - Company background and history
   - Relevant experience and past projects
   - Core competencies aligned to this tender

3. TECHNICAL APPROACH & METHODOLOGY
   - Understanding of scope of work
   - Proposed approach and methodology
   - Project timeline and milestones
   - Quality assurance measures

4. B-BBEE COMPLIANCE
   - Our B-BBEE status and commitment
   - How this supports the organization's transformation goals

5. VALUE PROPOSITION
   - Key differentiators
   - Benefits to the organization
   - Cost-effectiveness

6. CONCLUSION
   - Reaffirm commitment
   - Thank the organization
   - Express availability for clarifications

IMPORTANT:
- Use professional, formal South African government tender language
- Be specific and detailed where company information is provided
- Use placeholders like "[SPECIFIC EXPERIENCE]" where detail is missing
- Keep the tone confident but not arrogant
- Length: Approximately 800-1200 words
- Format in clean paragraphs with clear section headers

Write the proposal now:`
}
