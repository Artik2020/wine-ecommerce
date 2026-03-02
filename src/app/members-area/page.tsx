'use client'

import { useState, useEffect } from 'react'
import { getSupabaseBrowserClient, getCurrentUser } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MembersArea() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [configError, setConfigError] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      console.log('Members area: Checking auth...')
      const currentUser = await getCurrentUser()
      
      console.log('Members area: Current user:', currentUser?.id)
      
      if (!currentUser) {
        console.log('Members area: No user, redirecting to login')
        router.push('/login')
        return
      }

      setUser(currentUser)
      setLoading(false)
    }

    checkAuth()

    // Listen for auth changes
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setConfigError('Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel Environment Variables, then redeploy.');
      setLoading(false)
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.push('/login')
        } else if (event === 'SIGNED_IN') {
          setUser(session?.user || null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setConfigError('Missing Supabase configuration.');
      return
    }
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (configError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-lg shadow p-6">
          <h1 className="text-xl font-semibold text-gray-900">Configuration required</h1>
          <p className="mt-2 text-sm text-gray-700">{configError}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-900 to-amber-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-amber-700 font-bold text-xl">🍾</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold">Champagne House</h1>
                <p className="text-amber-100 text-sm">Members Area</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-amber-100">Welcome, {user?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Members Area</h2>
            <p className="text-xl text-gray-600">
              Exclusive access to premium champagne collection and member benefits
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-amber-100">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🍾</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Browse Collection</h3>
              <p className="text-gray-600 mb-4">
                Access our curated selection of premium champagnes from world-renowned houses
              </p>
              <Link
                href="/"
                className="inline-flex items-center text-amber-600 hover:text-amber-700 font-semibold"
              >
                Explore Collection →
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-amber-100">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">My Applications</h3>
              <p className="text-gray-600 mb-4">
                View and manage your membership applications and status
              </p>
              <Link
                href="/apply/status"
                className="inline-flex items-center text-amber-600 hover:text-amber-700 font-semibold"
              >
                View Applications →
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-amber-100">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">⚙️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Account Settings</h3>
              <p className="text-gray-600 mb-4">
                Manage your profile, preferences, and membership details
              </p>
              <button className="inline-flex items-center text-amber-600 hover:text-amber-700 font-semibold">
                Manage Account →
              </button>
            </div>
          </div>

          {/* User Info Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-amber-100">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Your Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Email</h4>
                <p className="text-lg text-gray-900">{user?.email}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">User ID</h4>
                <p className="text-lg text-gray-900">{user?.id}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Email Confirmed</h4>
                <p className="text-lg text-gray-900">
                  {user?.email_confirmed_at ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Member Since</h4>
                <p className="text-lg text-gray-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl">
            <h3 className="text-lg font-semibold text-green-800 mb-2">🎉 Login Successful!</h3>
            <p className="text-green-600">
              You have successfully logged into the Champagne House Members Area. Your authentication is working properly.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
