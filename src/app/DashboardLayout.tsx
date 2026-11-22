import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Users, Package,Truck,ShoppingCart,BarChart3,Settings, FileText } from 'lucide-react';
import { useAuth } from '@/shared/auth';

const navigation = [
  { name: 'Dashboard', path: '/', icon: BarChart3, roles: ['admin', 'vendas', 'estoque', 'financeiro'] },
  { name: 'Clientes', path: 'clientes', icon: Users, roles: ['admin', 'vendas'] },
  { name: 'Fornecedores', path: 'fornecedores', icon: Truck, roles: ['admin', 'compras'] },
  { name: 'Produtos', path: 'produtos', icon: Package, roles: ['admin', 'vendas', 'estoque'] },
  { name: 'Vendas', path: 'vendas', icon: ShoppingCart, roles: ['admin', 'vendas'] },
  { name: 'Estoque', path: 'estoque', icon: Package, roles: ['admin', 'estoque'] },
  { name: 'Financeiro', path: 'financeiro', icon: FileText, roles: ['admin', 'financeiro'] },
  { name: 'Admin', path: 'admin', icon: Settings, roles: ['admin'] },
];

export function DashboardLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Filtrar navegação baseado no papel do usuário
  const userRole = user?.role || 'admin';
  const visibleNav = navigation.filter((item) => item.roles.includes(userRole));

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-lg font-semibold text-gray-900">Mini ERP</h1>
          <p className="text-xs text-gray-500">Multiempresa</p>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {visibleNav.map(({ name, path, icon: Icon }) => (
            <NavLink
              key={name}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="mb-2 text-xs text-gray-500">Logado como:</div>
          <div className="font-medium text-gray-900">{user?.email || 'Usuário'}</div>
          <div className="text-xs text-gray-400 capitalize">{userRole}</div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}