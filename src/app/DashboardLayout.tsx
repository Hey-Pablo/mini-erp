import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useEmpresa } from '../shared/context';
import {
  Home,
  Users,
  Package,
  Truck,
  BarChart3,
  LogOut,
  User as UserIcon,
  ClipboardList
} from 'lucide-react';
import { Button } from '../shared/ui/Button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['administrador', 'vendas', 'estoque', 'financeiro'] },
  { name: 'Pedidos', href: '/pedidos', icon: ClipboardList, roles: ['administrador', 'vendas'] },
  { name: 'Clientes', href: '/clientes', icon: Users, roles: ['administrador', 'vendas', 'estoque', 'financeiro'] },
  { name: 'Fornecedores', href: '/fornecedores', icon: Truck, roles: ['administrador', 'vendas', 'estoque', 'financeiro'] },
  { name: 'Produtos', href: '/produtos', icon: Package, roles: ['administrador', 'vendas', 'estoque'] },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3, roles: ['administrador', 'vendas', 'estoque', 'financeiro'] },
];

export function DashboardLayout() {
  const { perfil, usuario, signOut } = useEmpresa();
  const location = useLocation();

  // Filtrar navegação baseada no papel do usuário
  const navItems = navigation.filter(item =>
    item.roles.includes(perfil?.papel as any)
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Mini ERP</h1>
          <p className="text-xs text-gray-500 mt-1">
            {perfil?.papel === 'administrador' && 'Administrador'}
            {perfil?.papel === 'vendas' && 'Vendas'}
            {perfil?.papel === 'estoque' && 'Estoque'}
            {perfil?.papel === 'financeiro' && 'Financeiro'}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                   ${isActive
                     ? 'bg-primary-50 text-primary-600'
                     : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                   }`
                }
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900">{usuario?.nome}</p>
            <p className="text-xs text-gray-500">{usuario?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {location.pathname === '/dashboard' && 'Dashboard'}
                {location.pathname === '/pedidos' && 'Pedidos de Venda'}
                {location.pathname === '/clientes' && 'Clientes'}
                {location.pathname === '/fornecedores' && 'Fornecedores'}
                {location.pathname === '/produtos' && 'Produtos'}
              </h2>
            </div>
            <UserIcon className="h-5 w-5 text-gray-400" />
          </div>
        </header>

        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}