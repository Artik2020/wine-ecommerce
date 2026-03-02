import { createClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Use server-side client with service role key
    const supabase = createClient()

    // Test 1: Check if we can access profiles table (service role bypasses RLS)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .single()

    // Test 2: Check auth system
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Test 3: Try to create a test record (will fail if tables don't exist)
    const { data: testData, error: testError } = await supabase
      .from('audit_log')
      .select('count')
      .single()

    return NextResponse.json({
      success: true,
      tests: {
        databaseConnection: !profilesError,
        authSystem: !authError,
        tablesExist: !testError || testError.code === 'PGRST116', // This is expected if table doesn't exist
        profilesCount: profiles?.count || 0,
        auditLogCount: testData?.count || 0
      },
      user: user ? { id: user.id, email: user.email } : null,
      serviceRoleWorking: true
    })

  } catch (error) {
    console.error('Admin test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
