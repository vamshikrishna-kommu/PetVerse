import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/app/store/auth.store';
import type { UserRole } from '@petverse/shared-types';

interface RoleRouteProps {
  role: UserRole | UserRole[];
  children: React.ReactNode;
}

export default function RoleRoute({ role, children }: RoleRouteProps) {
  const user = useAuthStore((s) => s.user);

  const allowed = Array.isArray(role) ? role : [role];

  if (!user || !allowed.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
