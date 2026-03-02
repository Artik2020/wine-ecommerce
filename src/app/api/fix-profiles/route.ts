import { createClient, supabaseAdmin } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    
    // Get all auth users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }
    
    // Get existing profiles
    const { data: existingProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
    
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }
    
    const existingUserIds = new Set(existingProfiles?.map(p => p.user_id) || [])
    const usersNeedingProfiles = authUsers?.users?.filter(u => !existingUserIds.has(u.id)) || []
    
    // Create missing profiles
    const createdProfiles = []
    for (const user of usersNeedingProfiles) {
      const { data: profile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
          role: 'user'
        })
        .select()
        .single()
      
      if (!insertError && profile) {
        createdProfiles.push(profile)
      }
    }
    
    return NextResponse.json({
      message: `Created ${createdProfiles.length} missing profiles`,
      createdProfiles,
      usersNeedingProfiles: usersNeedingProfiles.length
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
