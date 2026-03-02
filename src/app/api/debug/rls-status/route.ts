import { createClient, getSupabaseAdmin } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const supabaseAdmin = getSupabaseAdmin()
    
    // Test 1: Check if we can access profiles table with service role (bypasses RLS)
    const { data: serviceProfiles, error: serviceError } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .single()
    
    // Test 2: Check if we can access profiles table with regular client (subject to RLS)
    const { data: clientProfiles, error: clientError } = await supabase
      .from('profiles')
      .select('count')
      .single()
    
    // Test 3: Check if RLS is enabled on tables
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .in('tablename', ['profiles', 'applications', 'access_codes', 'memberships', 'audit_log'])
    
    // Test 4: Check existing policies
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('tablename, policyname, permissive, roles, cmd, qual')
      .eq('schemaname', 'public')
    
    return NextResponse.json({
      serviceRoleAccess: {
        success: !serviceError,
        count: serviceProfiles?.count,
        error: serviceError?.message
      },
      clientAccess: {
        success: !clientError,
        count: clientProfiles?.count,
        error: clientError?.message
      },
      rlsStatus: rlsStatus || [],
      policies: policies || [],
      rlsError: rlsError?.message,
      policiesError: policiesError?.message
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
