import { createClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const supabase = createClient()
    
    // Test login
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (authError) {
      return NextResponse.json({
        error: authError.message,
        user: null,
        profile: null,
        membership: null
      })
    }
    
    if (!user) {
      return NextResponse.json({
        error: 'No user returned from auth',
        user: null,
        profile: null,
        membership: null
      })
    }
    
    // Test profile lookup with service role (bypasses RLS)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    // Test membership lookup
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()
    
    return NextResponse.json({
      error: null,
      user: {
        id: user.id,
        email: user.email,
        email_confirmed: user.email_confirmed_at,
        created_at: user.created_at
      },
      profile: profile,
      profileError: profileError?.message,
      membership: membership,
      membershipError: membershipError?.message
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      user: null,
      profile: null,
      membership: null
    }, { status: 500 })
  }
}
