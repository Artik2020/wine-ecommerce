import { createClient, getSupabaseAdmin } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const supabaseAdmin = getSupabaseAdmin()
    
    // Test with service role (should always work)
    const { data: serviceData, error: serviceError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(1)
    
    // Test with regular client (affected by RLS)
    const { data: clientData, error: clientError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    // Try to disable RLS directly
    try {
      const { error: disableError } = await supabaseAdmin.rpc('exec', {
        sql: 'ALTER TABLE profiles DISABLE ROW LEVEL SECURITY'
      })
      console.log('Disable RLS error:', disableError)
    } catch (err) {
      console.log('Disable RLS failed:', err)
    }
    
    return NextResponse.json({
      serviceAccess: {
        success: !serviceError,
        error: serviceError?.message,
        dataCount: serviceData?.length || 0
      },
      clientAccess: {
        success: !clientError,
        error: clientError?.message,
        dataCount: clientData?.length || 0
      },
      recommendation: clientError ? 'RLS is still enabled and blocking access' : 'RLS appears to be disabled'
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
