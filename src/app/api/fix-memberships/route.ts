import { createClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    
    // Get all profiles without active memberships
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, email, full_name')
    
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }
    
    // Get existing memberships
    const { data: existingMemberships, error: membershipError } = await supabase
      .from('memberships')
      .select('user_id')
    
    if (membershipError) {
      return NextResponse.json({ error: membershipError.message }, { status: 500 })
    }
    
    const existingUserIds = new Set(existingMemberships?.map(m => m.user_id) || [])
    const usersNeedingMemberships = profiles?.filter(p => !existingUserIds.has(p.user_id)) || []
    
    // Create missing memberships
    const createdMemberships = []
    for (const user of usersNeedingMemberships) {
      const { data: membership, error: insertError } = await supabase
        .from('memberships')
        .insert({
          user_id: user.user_id,
          tier: 'member',
          start_at: new Date().toISOString(),
          end_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          status: 'active'
        })
        .select()
        .single()
      
      if (!insertError && membership) {
        createdMemberships.push(membership)
      }
    }
    
    return NextResponse.json({
      message: `Created ${createdMemberships.length} missing memberships`,
      createdMemberships,
      usersNeedingMemberships: usersNeedingMemberships.length
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
