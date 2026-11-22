import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuth } from '@/shared/auth';
import { LoginPage } from '@/modules/auth/pages/LoginPage';
import { DashboardLayout } from './DashboardLayout';
import { ClientesPage } from '@/modules/cadastros/pages/ClientesPage';
import { LoadingSpinner } from './LoadingSpinner';

const queryClient = new QueryClient();

export function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
          <Route element={user ? <DashboardLayout /> : <Navigate to="/login" replace />}>
            <Route index element={<div className="p-8">Bem-vindo ao Mini ERP</div>} />
            <Route path="clientes" element={<ClientesPage />} />
          </Route>
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}