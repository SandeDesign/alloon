import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    window.location.replace('/login');
    return null;
  }
  
  // Redirect employees to their dashboard
  if (userRole === 'employee') {
    useEffect(() => {
      if (window.location.pathname !== '/employee-dashboard') {
        window.location.replace('/employee-dashboard');
      }
    }, []);
    return null;
  }

  return <>{children}</>;
};