import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../../shared/ui';
import { Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { cn, formatCurrency } from '../../shared/utils';

export function FinanceiroFluxoCaixa() {
  const stats = [
    { label: 'Receita Hoje', value: formatCurrency(12500.00), change: '+12%', icon: TrendingUp, positive: true },
    { label: 'Despesa Hoje', value: formatCurrency(8200.50), change: '-5%', icon: TrendingDown, positive: false },
    { label: 'Lucro Líquido', value: formatCurrency(4300.00), change: '+18%', icon: DollarSign, positive: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fluxo de Caixa</h1>
        <p className="text-gray-500">Visão geral das entradas e saídas</p>
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
                <stat.icon className={cn("w-6 h-6", stat.positive ? "text-green-500" : "text-red-500")} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center">
            <p className="text-gray-500">Gráfico será implementado em breve</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
