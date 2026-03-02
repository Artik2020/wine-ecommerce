'use client';

import { useState, useEffect } from 'react';

interface Registration {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  accessCode?: string;
}

export default function AdminPanel() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('registrations') || '[]';
    setRegistrations(JSON.parse(stored));
  }, []);

  const generateAccessCode = (name: string): string => {
    const cleanName = name.toUpperCase().replace(/[^A-Z]/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${cleanName.slice(0, 4)}${random}`;
  };

  const handleAdminLogin = () => {
    if (adminCode === 'ADMIN2024') {
      setIsAuthenticated(true);
    } else {
      alert('Invalid admin code');
    }
  };

  const approveRegistration = (id: number) => {
    setIsLoading(true);
    const updatedRegistrations = registrations.map(reg => {
      if (reg.id === id) {
        return {
          ...reg,
          status: 'approved' as const,
          accessCode: generateAccessCode(reg.name)
        };
      }
      return reg;
    });
    
    setRegistrations(updatedRegistrations);
    localStorage.setItem('registrations', JSON.stringify(updatedRegistrations));
    setIsLoading(false);
    
    const approved = updatedRegistrations.find(reg => reg.id === id);
    alert(`Registration approved! Access code: ${approved?.accessCode}`);
  };

  const rejectRegistration = (id: number) => {
    setIsLoading(true);
    const updatedRegistrations = registrations.map(reg => {
      if (reg.id === id) {
        return { ...reg, status: 'rejected' as const };
      }
      return reg;
    });
    
    setRegistrations(updatedRegistrations);
    localStorage.setItem('registrations', JSON.stringify(updatedRegistrations));
    setIsLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full">
          <h2 className="text-xl font-bold mb-4">Admin Access</h2>
          <input
            type="password"
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value)}
            placeholder="Enter admin code"
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
          />
          <button
            onClick={handleAdminLogin}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  const pendingRegistrations = registrations.filter(reg => reg.status === 'pending');
  const approvedRegistrations = registrations.filter(reg => reg.status === 'approved');
  const rejectedRegistrations = registrations.filter(reg => reg.status === 'rejected');

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Registration Admin Panel</h1>
        
        {/* Pending Registrations */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Pending Registrations ({pendingRegistrations.length})</h2>
          {pendingRegistrations.length === 0 ? (
            <p className="text-gray-600">No pending registrations</p>
          ) : (
            <div className="space-y-4">
              {pendingRegistrations.map((reg) => (
                <div key={reg.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold">{reg.name}</h3>
                      <p className="text-gray-600">{reg.email}</p>
                      {reg.phone && <p className="text-gray-600">{reg.phone}</p>}
                      {reg.company && <p className="text-gray-600">{reg.company}</p>}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Submitted: {new Date(reg.submittedAt).toLocaleDateString()}</p>
                      {reg.message && <p className="text-sm text-gray-700 mt-2">{reg.message}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveRegistration(reg.id)}
                      disabled={isLoading}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectRegistration(reg.id)}
                      disabled={isLoading}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approved Registrations */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Approved Registrations ({approvedRegistrations.length})</h2>
          {approvedRegistrations.length === 0 ? (
            <p className="text-gray-600">No approved registrations</p>
          ) : (
            <div className="space-y-4">
              {approvedRegistrations.map((reg) => (
                <div key={reg.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{reg.name}</h3>
                      <p className="text-gray-600">{reg.email}</p>
                      <p className="text-sm font-mono bg-green-100 text-green-800 px-2 py-1 rounded mt-2">
                        Access Code: {reg.accessCode}
                      </p>
                    </div>
                    <span className="text-green-600 font-semibold">Approved</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rejected Registrations */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Rejected Registrations ({rejectedRegistrations.length})</h2>
          {rejectedRegistrations.length === 0 ? (
            <p className="text-gray-600">No rejected registrations</p>
          ) : (
            <div className="space-y-4">
              {rejectedRegistrations.map((reg) => (
                <div key={reg.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500 opacity-75">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{reg.name}</h3>
                      <p className="text-gray-600">{reg.email}</p>
                    </div>
                    <span className="text-red-600 font-semibold">Rejected</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
