import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/app/store/auth.store';
import PageLoader from '../feedback/PageLoader';

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (!user || !['admin', 'superadmin'].includes(user.role)) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
