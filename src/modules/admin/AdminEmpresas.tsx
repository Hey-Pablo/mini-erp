import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../../shared/ui';
import { Building2, Users, Calendar, Activity } from 'lucide-react';
import { cn, formatCurrency } from '../../shared/utils';

export function AdminEmpresas() {
  const stats = [
    { label: 'Empresa Ativa', value: 'Mini ERP Demo', icon: Building2 },
    { label: 'Usuários', value: '5', change: '+2 esta semana', icon: Users },
    { label: 'Clientes', value: '89', change: '+8 este mês', icon: Users },
    { label: 'Produtos', value: '156', change: 'Estoque atualizado', icon: Building2 },
    { label: 'Pedidos Mês', value: '24', change: '+12%', icon: Activity },
    { label: 'Receita Mês', value: formatCurrency(45890.50), change: '+8%', icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administração</h1>
        <p className="text-gray-500">Gerencie empresas e configurações</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-lg font-bold">{stat.value}</p>
                  {stat.change && <p className="text-xs text-gray-400">{stat.change}</p>}
                </div>
                <stat.icon className="w-6 h-6 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Info da Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Nome</p>
              <p className="font-medium">Mini ERP Demo</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge variant="success">Ativa</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
