import { createClient, getSupabaseAdmin } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const supabaseAdmin = getSupabaseAdmin()
    
    // Get all auth users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    // Get all profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
    
    return NextResponse.json({
      authUsers: authUsers?.users?.map((u: any) => ({
        id: u.id,
        email: u.email,
        email_confirmed: u.email_confirmed_at,
        created_at: u.created_at
      })) || [],
      profiles: profiles || [],
      authError: authError?.message,
      profileError: profileError?.message
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
