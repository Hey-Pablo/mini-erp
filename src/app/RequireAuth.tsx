import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../shared/auth';
import { LoadingSpinner } from './LoadingSpinner';

export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}