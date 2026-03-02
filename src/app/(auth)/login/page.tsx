'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    console.log('🚀 Starting login for:', email)

    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        setError('Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel Environment Variables and redeploy.')
        setLoading(false)
        return
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      console.log('📥 Login result:', { 
        user: data?.user?.id, 
        session: data?.session ? 'exists' : 'null',
        error: error?.message 
      })

      if (error) {
        console.error('❌ Login error:', error)
        setError(error.message)
        setLoading(false)
        return
      }

      if (data?.user && data?.session) {
        console.log('✅ Login successful!')
        setSuccess(true)
        setLoading(false)
        
        // Store login success and redirect to homepage
        localStorage.setItem('loginSuccess', 'true')
        if (data.user.email) {
          localStorage.setItem('userEmail', data.user.email)
        }
        
        // Redirect to homepage with members area
        setTimeout(() => {
          window.location.href = '/'
        }, 1000)
      } else {
        console.error('❌ No user or session returned')
        setError('Login failed. Please check your credentials and try again.')
        setLoading(false)
      }

    } catch (err: any) {
      console.error('❌ Login exception:', err)
      setError(err.message || 'An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-4xl">🍾</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-amber-100">Sign in to your Champagne House account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-amber-100">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-white placeholder-amber-200/50"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-amber-100">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-white placeholder-amber-200/50"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-500/20 backdrop-blur border border-red-400/30 text-red-100 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 backdrop-blur border border-green-400/30 text-green-100 px-4 py-3 rounded-xl text-sm">
              Login successful! Redirecting to Members Area...
              <br />
              <Link href="/members-area" className="underline text-green-200 hover:text-white">
                Click here if not redirected automatically
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-4 px-6 rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 disabled:opacity-50 font-semibold text-lg shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing In...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-amber-100 text-sm">
            Don't have an account?{' '}
            <Link href="/signup" className="text-amber-300 hover:text-amber-200 font-semibold hover:underline">
              Apply for Membership
            </Link>
          </p>
        </div>

        {/* Test credentials info */}
        <div className="mt-6 p-4 bg-amber-800/30 rounded-xl">
          <p className="text-amber-200 text-xs text-center">
            Test Credentials:<br/>
            Email: test@champagnehouse.com<br/>
            Password: test123456
          </p>
        </div>

        {/* Debug button */}
        <div className="mt-4">
          <button
            onClick={() => {
              localStorage.setItem('loginSuccess', 'true');
              window.location.href = '/?test=true';
            }}
            className="w-full text-amber-200 hover:text-white text-xs py-2 border border-amber-600 rounded-lg transition-colors"
          >
            Debug: Show Members Area Directly
          </button>
        </div>
      </div>
    </div>
  )
}
