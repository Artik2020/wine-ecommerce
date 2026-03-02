'use client';

import { useState, useEffect } from 'react';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on mount
    const access = localStorage.getItem('champagne-access');
    const accessCode = localStorage.getItem('access-code');
    
    // Verify the access code is still valid (approved registration)
    if (access === 'true' && accessCode) {
      const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
      const approvedRegistration = registrations.find((reg: any) => 
        reg.status === 'approved' && reg.accessCode === accessCode
      );
      
      if (approvedRegistration) {
        setIsAuthenticated(true);
      } else {
        // Clear invalid authentication
        localStorage.removeItem('champagne-access');
        localStorage.removeItem('access-code');
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
    
    setIsLoading(false);
  }, []);

  const login = (code: string) => {
    localStorage.setItem('champagne-access', 'true');
    localStorage.setItem('access-code', code);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('champagne-access');
    localStorage.removeItem('access-code');
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    isLoading,
    login,
    logout
  };
}
