'use client';

import { useState, useEffect } from 'react';
import { WINERIES } from '@/data/wineries';
import WineCard from '@/components/WineCard';
import BasketDrawer from '@/components/BasketDrawer';
import BasketButton from '@/components/BasketButton';
import { supabase, getCurrentUser } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showMembersArea, setShowMembersArea] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      console.log('🔍 Checking user and login success...');
      
      // Check for login success flag
      const loginSuccess = localStorage.getItem('loginSuccess');
      console.log('📝 Login success flag:', loginSuccess);
      
      // TEMPORARY: Auto-show members area for testing
      if (loginSuccess === 'true' || window.location.search.includes('test=true')) {
        console.log('🎉 Login success detected, showing members area');
        setShowMembersArea(true);
        if (loginSuccess === 'true') {
          localStorage.removeItem('loginSuccess');
          localStorage.removeItem('userEmail');
        }
      }

      const currentUser = await getCurrentUser();
      console.log('👤 Current user:', currentUser?.id || 'null');
      setUser(currentUser);
      setLoading(false);
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.id || 'null');
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (showMembersArea) {
    // Show members area content
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
                <BasketButton onClick={() => setIsBasketOpen(true)} />
                <button
                  onClick={() => {
                    supabase.auth.signOut();
                    setShowMembersArea(false);
                  }}
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

            {/* Success Message */}
            <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl">
              <h3 className="text-lg font-semibold text-green-800 mb-2">🎉 Login Successful!</h3>
              <p className="text-green-600">
                You have successfully logged into the Champagne House Members Area. Here's your exclusive champagne collection:
              </p>
            </div>

            {/* Wineries Overview Section */}
            <section className="mb-16">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Exclusive Champagne Collection</h3>
                <p className="text-gray-600">Browse our complete collection of prestigious Champagne houses</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {WINERIES.map((winery) => (
                  <div 
                    key={winery.slug}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-amber-100"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 text-lg">{winery.name}</h4>
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                        {winery.wines.length}
                      </span>
                    </div>
                    {winery.desc && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{winery.desc}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        €{Math.min(...winery.wines.map(w => w.priceEUR))} - €{Math.max(...winery.wines.map(w => w.priceEUR))}
                      </span>
                      <button 
                        onClick={() => {
                          const element = document.getElementById(`winery-${winery.slug}`);
                          element?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-amber-600 hover:text-amber-700 text-sm font-medium transition-colors"
                      >
                        View Wines →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Detailed Winery Sections */}
            {WINERIES.map((winery, index: number) => (
              <section key={winery.slug} id={`winery-${winery.slug}`} className={`mb-16 ${index % 2 === 1 ? 'bg-white rounded-2xl shadow-lg p-8' : ''}`}>
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-3xl font-bold text-gray-900">{winery.name}</h2>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                        {winery.wines.length} Cuvées
                      </span>
                    </div>
                  </div>
                  {winery.desc && (
                    <p className="text-lg text-gray-700 italic">{winery.desc}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {winery.wines.map((wine) => (
                    <WineCard 
                      key={wine.id} 
                      wine={wine} 
                      onAddToBasket={() => {
                        console.log('🛒 Adding to basket:', wine.name);
                        window.dispatchEvent(new Event('basket-updated'));
                      }}
                    />
                  ))}
                </div>
              </section>
            ))}

            <div className="text-center mt-12">
              <button
                onClick={() => setShowMembersArea(false)}
                className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
              >
                Back to Public View
              </button>
            </div>
          </div>
        </div>

        <BasketDrawer 
          isOpen={isBasketOpen} 
          onClose={() => setIsBasketOpen(false)} 
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50">
      {/* Hero Section */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-900 to-amber-700 text-white shadow-lg">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-amber-700 font-bold text-xl">🍾</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold">Champagne House</h1>
                <p className="text-amber-100 text-sm">Premium Collection</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <button
                    onClick={() => setShowMembersArea(true)}
                    className="text-amber-100 hover:text-white px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    Members Area
                  </button>
                  <BasketButton onClick={() => setIsBasketOpen(true)} />
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="text-amber-100 hover:text-white px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-white text-amber-700 hover:bg-amber-50 px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Apply
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Add padding to account for fixed header */}
      <div className="h-20"></div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Exquisite Champagne Collection</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our curated selection of 33 prestigious Champagne houses, 
            each offering their finest cuvées crafted with centuries of tradition.
          </p>
          {!user && (
            <div className="mt-6">
              <Link
                href="/signup"
                className="inline-flex items-center bg-gradient-to-r from-amber-600 to-amber-700 text-white px-8 py-3 rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-300 font-semibold"
              >
                Apply for Membership →
              </Link>
            </div>
          )}
        </div>

        {/* Wineries Overview Section */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">All Wineries</h3>
            <p className="text-gray-600">Browse our complete collection of prestigious Champagne houses</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {WINERIES.map((winery) => (
              <div 
                key={winery.slug}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 border border-amber-100"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 text-lg">{winery.name}</h4>
                  <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                    {winery.wines.length}
                  </span>
                </div>
                {winery.desc && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{winery.desc}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    €{Math.min(...winery.wines.map(w => w.priceEUR))} - €{Math.max(...winery.wines.map(w => w.priceEUR))}
                  </span>
                  <button 
                    onClick={() => {
                      const element = document.getElementById(`winery-${winery.slug}`);
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-amber-600 hover:text-amber-700 text-sm font-medium transition-colors"
                  >
                    View Wines →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Detailed Winery Sections */}
        {WINERIES.map((winery, index: number) => (
          <section key={winery.slug} id={`winery-${winery.slug}`} className={`mb-16 ${index % 2 === 1 ? 'bg-white rounded-2xl shadow-lg p-8' : ''}`}>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold text-gray-900">{winery.name}</h2>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                    {winery.wines.length} Cuvées
                  </span>
                </div>
              </div>
              {winery.desc && (
                <p className="text-lg text-gray-700 italic">{winery.desc}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {winery.wines.map((wine) => (
                <WineCard 
                  key={wine.id} 
                  wine={wine} 
                  onAddToBasket={() => {
                    console.log('🛒 Adding to basket:', wine.name);
                    window.dispatchEvent(new Event('basket-updated'));
                  }}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">© 2024 Champagne House. Premium Champagne Collection.</p>
          <p className="text-gray-500 text-sm mt-2">Private Access Platform</p>
        </div>
      </footer>

      <BasketDrawer 
        isOpen={isBasketOpen} 
        onClose={() => setIsBasketOpen(false)} 
      />
    </div>
  );
}
