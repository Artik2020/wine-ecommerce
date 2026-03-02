import { createClient } from '@supabase/supabase-js'

// Browser-safe client - lazy init to avoid build-time crashes when env vars are missing
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowserClient() {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    return null
  }

  supabaseClient = createClient(supabaseUrl, anonKey)
  return supabaseClient
}

// Helper types for auth
export interface AuthUser {
  id: string
  email?: string
  full_name?: string
  role?: 'user' | 'admin'
}

// Helper function to get current user
export async function getCurrentUser() {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Helper function to get user profile
export async function getUserProfile(userId: string) {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return { data: null, error: new Error('Supabase is not configured') }
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  return { data, error }
}
