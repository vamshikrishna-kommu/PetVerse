import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/app/store/auth.store';
import PageLoader from '../feedback/PageLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;

  return <>{children}</>;
}
