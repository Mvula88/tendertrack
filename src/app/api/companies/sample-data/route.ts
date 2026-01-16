import { createClient } from '@/lib/supabase/server'
import { OrganizationType, TenderStatus } from '@/types/database'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Get the user's active company
  const { data: membership } = await supabase
    .from('user_company_members')
    .select('user_company_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return new NextResponse('No company found', { status: 404 })
  }

  const companyId = membership.user_company_id

  try {
    // 1. Create Sample Organizations
    const organizations = [
      { name: 'Eskom Holdings SOC Ltd', type: 'parastatal' as OrganizationType },
      { name: 'City of Johannesburg', type: 'municipality' as OrganizationType },
      { name: 'Department of Health', type: 'ministry' as OrganizationType },
      { name: 'Transnet SOC Ltd', type: 'parastatal' as OrganizationType },
    ]

    const { data: createdOrgs } = await supabase
      .from('organizations')
      .insert(organizations.map(org => ({
        ...org,
        created_by_company_id: companyId,
        shared: false
      })))
      .select()

    if (!createdOrgs) throw new Error('Failed to create organizations')

    // 2. Create Sample Categories
    const categories = [
      { name: 'IT Infrastructure', user_company_id: companyId, created_by: user.id },
      { name: 'Medical Supplies', user_company_id: companyId, created_by: user.id },
      { name: 'Construction', user_company_id: companyId, created_by: user.id },
    ]

    const { data: createdCats } = await supabase
      .from('tender_categories')
      .insert(categories)
      .select()

    if (!createdCats) throw new Error('Failed to create categories')

    // 3. Create Sample Tenders
    const now = new Date()
    const tenders = [
      {
        title: 'Provision of Cloud Hosting Services',
        organization_id: createdOrgs[0].id,
        category_id: createdCats[0].id,
        status: 'under_evaluation' as TenderStatus,
        due_date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        applied: true,
        our_bid_amount: 1250000,
      },
      {
        title: 'Supply and Delivery of Vaccines',
        organization_id: createdOrgs[2].id,
        category_id: createdCats[1].id,
        status: 'bid_opening' as TenderStatus,
        due_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        applied: true,
        our_bid_amount: 850000,
      },
      {
        title: 'Network Security Upgrade',
        organization_id: createdOrgs[1].id,
        category_id: createdCats[0].id,
        status: 'preparing' as TenderStatus,
        due_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        applied: false,
      },
    ]

    await supabase.from('tenders').insert(tenders.map(t => ({
      ...t,
      user_company_id: companyId,
      created_by: user.id,
    })))

    // 4. Update company to mark sample data as loaded
    await supabase
      .from('user_companies')
      .update({ has_sample_data: true })
      .eq('id', companyId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error seeding sample data:', error)
    return new NextResponse(error.message, { status: 500 })
  }
}
