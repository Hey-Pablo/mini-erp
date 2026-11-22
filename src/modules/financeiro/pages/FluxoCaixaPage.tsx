import { useEmpresa } from '../../../shared/context';
import { useFluxoCaixa } from '../../../shared/api/hooks';
import { Card, CardContent } from '../../../shared/ui/Card';
import { Loader2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export function FluxoCaixaPage() {
  const { empresa } = useEmpresa();
  const { data: fluxoCaixa, isLoading, error } = useFluxoCaixa(empresa?.empresa_id || '');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  // Calcular totais
  const totalPagar = fluxoCaixa?.reduce((sum, item) => sum + item.total_pagar, 0) || 0;
  const totalReceber = fluxoCaixa?.reduce((sum, item) => sum + item.total_receber, 0) || 0;
  const saldoFinal = totalReceber - totalPagar;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        <p>Erro ao carregar fluxo de caixa: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Fluxo de Caixa</h3>
          <p className="text-sm text-gray-500">Projeção de entradas e saídas por vencimento</p>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total a Pagar</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalPagar)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total a Receber</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceber)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                saldoFinal >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <DollarSign className={`w-6 h-6 ${saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Saldo Projetado</p>
                <p className={`text-2xl font-bold ${saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(saldoFinal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de fluxo de caixa */}
      <Card>
        <CardContent className="p-0">
          {(!fluxoCaixa || fluxoCaixa.length === 0) ? (
            <div className="p-8 text-center text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum título para compor o fluxo de caixa</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Vencimento</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">A Pagar</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">A Receber</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Saldo do Dia</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Saldo Acumulado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fluxoCaixa.map((item, index) => {
                      const saldoAcumulado = fluxoCaixa.slice(0, index + 1).reduce(
                        (sum, i) => sum + i.saldo,
                        0
                      );
                      const saldoDoDia = item.saldo;

                      return (
                        <tr key={item.vencimento} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {formatDate(item.vencimento)}
                          </td>
                          <td className="px-4 py-3 text-right text-red-600 font-medium">
                            {formatCurrency(item.total_pagar)}
                          </td>
                          <td className="px-4 py-3 text-right text-green-600 font-medium">
                            {formatCurrency(item.total_receber)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            <span className={saldoDoDia >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(saldoDoDia)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold">
                            <span className={saldoAcumulado >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(saldoAcumulado)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td className="px-4 py-3 font-bold text-gray-900">Total</td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">
                        {formatCurrency(totalPagar)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">
                        {formatCurrency(totalReceber)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        {formatCurrency(totalReceber - totalPagar)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        {formatCurrency(saldoFinal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}