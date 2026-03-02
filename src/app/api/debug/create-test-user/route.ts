import { createClient, supabaseAdmin } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    
    // Create a test user with known credentials
    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'test@champagnehouse.com',
      password: 'test123456',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test User'
      }
    })
    
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }
    
    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        email: user.email,
        full_name: 'Test User',
        role: 'user'
      })
      .select()
      .single()
    
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }
    
    // Create membership
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .insert({
        user_id: user.id,
        tier: 'member',
        start_at: new Date().toISOString(),
        end_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      })
      .select()
      .single()
    
    if (membershipError) {
      return NextResponse.json({ error: membershipError.message }, { status: 500 })
    }
    
    return NextResponse.json({
      message: 'Test user created successfully',
      user: {
        id: user.id,
        email: user.email,
        email_confirmed: user.email_confirmed_at
      },
      profile,
      membership,
      loginCredentials: {
        email: 'test@champagnehouse.com',
        password: 'test123456'
      }
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
