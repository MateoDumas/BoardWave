import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';

export const ProtectedRoute = () => {
  const { token } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
