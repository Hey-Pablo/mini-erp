import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '../shared/auth';
import { EmpresaProvider } from '../shared/context';
import { DashboardLayout } from './DashboardLayout';
import { LoginPage } from '../modules/auth/pages/LoginPage';
import { ClientesPage } from '../modules/cadastros/pages/ClientesPage';
import { FornecedoresPage } from '../modules/cadastros/pages/FornecedoresPage';
import { ProdutosPage } from '../modules/cadastros/pages/ProdutosPage';
import { PedidosPage } from '../modules/vendas/pages/PedidosPage';
import { Dashboard } from './Dashboard';
import { RequireAuth } from './RequireAuth';
import { RequireRole } from './RequireRole';
import { TitulosPage } from '../modules/financeiro/pages/TitulosPage';
import { ComprasPage } from '../modules/compras/pages/ComprasPage';
import { EstoquePage } from '../modules/estoque/pages/EstoquePage';
import { FluxoCaixaPage } from '../modules/financeiro/pages/FluxoCaixaPage';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <EmpresaProvider>
          <Toaster position="top-right" />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              <Route element={<RequireAuth />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={
                    <RequireRole roles={['administrador', 'vendas', 'estoque', 'financeiro']}>
                      <Dashboard />
                    </RequireRole>
                  } />
                  <Route path="/clientes" element={
                    <RequireRole roles={['administrador', 'vendas', 'estoque', 'financeiro']}>
                      <ClientesPage />
                    </RequireRole>
                  } />
                  <Route path="/fornecedores" element={
                    <RequireRole roles={['administrador', 'vendas', 'estoque', 'financeiro']}>
                      <FornecedoresPage />
                    </RequireRole>
                  } />
                  <Route path="/produtos" element={
                    <RequireRole roles={['administrador', 'vendas', 'estoque']}>
                      <ProdutosPage />
                    </RequireRole>
                  } />
                  <Route path="/titulos" element={
                    <RequireRole roles={['administrador', 'financeiro']}>
                      <TitulosPage />
                    </RequireRole>
                  } />
                  <Route path="/fluxo-caixa" element={
                    <RequireRole roles={['administrador', 'financeiro']}>
                      <FluxoCaixaPage />
                    </RequireRole>
                  } />
                  <Route path="/compras" element={
                    <RequireRole roles={['administrador', 'estoque']}>
                      <ComprasPage />
                    </RequireRole>
                  } />
                  <Route path="/estoque" element={
                    <RequireRole roles={['administrador', 'estoque']}>
                      <EstoquePage />
                    </RequireRole>
                  } />
                  <Route path="/pedidos" element={
                    <RequireRole roles={['administrador', 'vendas']}>
                      <PedidosPage />
                    </RequireRole>
                  } />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </EmpresaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}