'use client';

import { useState } from 'react';

interface CodeAccessProps {
  onAuthenticated: () => void;
}

interface RegistrationData {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
}

export default function CodeAccess({ onAuthenticated }: CodeAccessProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  const [registrationError, setRegistrationError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // In production, access codes would be generated and sent after registration approval
  const ACCESS_CODES: string[] = [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if this is an approved registration code
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    const approvedRegistration = registrations.find((reg: any) => 
      reg.status === 'approved' && reg.accessCode === code.toUpperCase()
    );

    if (approvedRegistration) {
      // Store authentication in localStorage
      localStorage.setItem('champagne-access', 'true');
      localStorage.setItem('access-code', code.toUpperCase());
      onAuthenticated();
    } else {
      setError('Access codes are provided only after registration approval. Please request access below.');
      setCode('');
    }

    setIsLoading(false);
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setRegistrationError('');

    // Validate required fields
    if (!registrationData.name || !registrationData.email) {
      setRegistrationError('Name and email are required.');
      setIsLoading(false);
      return;
    }

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Store registration data (in production, this would go to a backend)
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    registrations.push({
      ...registrationData,
      id: Date.now(),
      submittedAt: new Date().toISOString(),
      status: 'pending'
    });
    localStorage.setItem('registrations', JSON.stringify(registrations));

    setRegistrationSuccess(true);
    setIsLoading(false);
    
    // Reset form
    setRegistrationData({
      name: '',
      email: '',
      phone: '',
      company: '',
      message: ''
    });
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Registration Received!</h1>
            <p className="text-amber-100 text-lg mb-8 leading-relaxed">
              Thank you for your interest in Champagne House. Our team will review your application and contact you shortly with your access code.
            </p>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-6">
              <p className="text-amber-200 text-sm">
                <span className="font-semibold">Next Steps:</span> You will receive an email with your personal access code within 24-48 hours.
              </p>
            </div>
            <button
              onClick={() => setShowRegister(false)}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-4 px-6 rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showRegister) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-4xl">🍾</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Request Access</h1>
            <p className="text-amber-100 text-lg">Apply for exclusive access to Champagne House</p>
          </div>

          <form onSubmit={handleRegistration} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-amber-100">
                Full Name *
              </label>
              <input
                type="text"
                value={registrationData.name}
                onChange={(e) => setRegistrationData({...registrationData, name: e.target.value})}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-white placeholder-amber-200/50"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-amber-100">
                Email Address *
              </label>
              <input
                type="email"
                value={registrationData.email}
                onChange={(e) => setRegistrationData({...registrationData, email: e.target.value})}
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-white placeholder-amber-200/50"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-amber-100">
                Phone Number
              </label>
              <input
                type="tel"
                value={registrationData.phone}
                onChange={(e) => setRegistrationData({...registrationData, phone: e.target.value})}
                placeholder="Enter your phone number"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-white placeholder-amber-200/50"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-amber-100">
                Company/Organization
              </label>
              <input
                type="text"
                value={registrationData.company}
                onChange={(e) => setRegistrationData({...registrationData, company: e.target.value})}
                placeholder="Enter your company name"
                className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-white placeholder-amber-200/50"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-amber-100">
                Tell us about your interest
              </label>
              <textarea
                value={registrationData.message}
                onChange={(e) => setRegistrationData({...registrationData, message: e.target.value})}
                placeholder="Share your passion for premium champagnes..."
                rows={3}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-white placeholder-amber-200/50 resize-none"
                disabled={isLoading}
              />
            </div>

            {registrationError && (
              <div className="bg-red-500/20 backdrop-blur border border-red-400/30 text-red-100 px-4 py-3 rounded-xl text-sm">
                {registrationError}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowRegister(false)}
                disabled={isLoading}
                className="flex-1 bg-white/10 backdrop-blur border border-white/20 text-amber-100 py-3 px-6 rounded-xl hover:bg-white/20 transition-all duration-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 px-6 rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-5xl">🍾</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">Champagne House</h1>
          <p className="text-amber-100 text-lg">Exclusive Access Required</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-amber-100">
              Access Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your exclusive access code"
              className="w-full px-4 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-center text-xl font-mono uppercase text-white placeholder-amber-200/50"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-500/20 backdrop-blur border border-red-400/30 text-red-100 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !code}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-4 px-6 rounded-2xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 disabled:opacity-50 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : 'Enter Platform'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-amber-100 text-sm mb-4">
            Don't have an access code?
          </p>
          <button
            onClick={() => setShowRegister(true)}
            className="text-amber-300 hover:text-amber-200 font-semibold text-lg transition-colors hover:underline"
          >
            Request Exclusive Access →
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-amber-200/70 text-xs">
            Access codes are provided exclusively to our premium clients
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="text-amber-200/50 hover:text-amber-200 text-xs mt-2 underline transition-colors"
          >
            Clear all data (testing)
          </button>
        </div>
      </div>
    </div>
  );
}
