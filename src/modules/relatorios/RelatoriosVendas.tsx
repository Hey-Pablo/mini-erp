import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../../shared/ui';
import { cn, formatCurrency } from '../../shared/utils';
import { TrendingUp, Calendar, Users, Package, BarChart3 } from 'lucide-react';

export function RelatoriosVendas() {
  const stats = [
    { label: 'Pedidos no Período', value: '42', icon: Package },
    { label: 'Faturado', value: 'R$ 38.500,00', icon: TrendingUp, positive: true },
    { label: 'Em Aberto', value: 'R$ 5.200,00', icon: Calendar, positive: false },
    { label: 'Clientes Únicos', value: '28', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios de Vendas</h1>
        <p className="text-gray-500">Análise detalhada das vendas</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-lg font-bold">{stat.value}</p>
                </div>
                <stat.icon className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
