import { useState } from 'react';
import { useEmpresa } from '../../../shared/context';
import { useTitulos, useBaixarTitulo } from '../../../shared/api/hooks';
import type { Titulo } from '../../../shared/types';
import { Card, CardContent } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { SearchInput } from '../../../shared/ui/SearchInput';
import { Pagination } from '../../../shared/ui/Pagination';
import { Select } from '../../../shared/ui/forms/Select';
import { Label } from '../../../shared/ui/forms/Label';
import { FileText, Download, Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

type StatusFilter = 'todos' | 'aberto' | 'baixado' | 'cancelado';
type TipoFilter = 'todos' | 'pagar' | 'receber';

export function TitulosPage() {
  const { empresa } = useEmpresa();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>('todos');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const { data, isLoading, error, refetch } = useTitulos(
    empresa?.empresa_id || '',
    {
      tipo: tipoFilter === 'todos' ? undefined : tipoFilter,
      status: statusFilter === 'todos' ? undefined : statusFilter,
    },
    page,
    pageSize
  );

  const baixarTitulo = useBaixarTitulo();

  const handleBaixar = async (titulo: Titulo) => {
    if (!empresa) return;

    try {
      await baixarTitulo(empresa.empresa_id, titulo.id);
      toast.success('Título baixado com sucesso');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao baixar título');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: Titulo['status']) => {
    switch (status) {
      case 'aberto':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3" />
            Aberto
          </span>
        );
      case 'baixado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Baixado
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Cancelado
          </span>
        );
    }
  };

  const getTipoBadge = (tipo: Titulo['tipo']) => {
    if (tipo === 'pagar') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          Pagar
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        Receber
      </span>
    );
  };

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
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
        <p>Erro ao carregar títulos: {error.message}</p>
      </div>
    );
  }

  const titulos = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Títulos a Pagar/Receber</h3>
          <p className="text-sm text-gray-500">Gerencie os títulos financeiros da empresa</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Buscar títulos..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex gap-2">
          <div>
            <Label htmlFor="tipo-filter" className="sr-only">Filtrar por tipo</Label>
            <Select
              id="tipo-filter"
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value as TipoFilter)}
              className="w-[160px]"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="pagar">A Pagar</option>
              <option value="receber">A Receber</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="status-filter" className="sr-only">Filtrar por status</Label>
            <Select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-[160px]"
            >
              <option value="todos">Todos os Status</option>
              <option value="aberto">Aberto</option>
              <option value="baixado">Baixado</option>
              <option value="cancelado">Cancelado</option>
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {titulos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum título encontrado</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Tipo</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Valor</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Vencimento</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Origem</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {titulos.map((titulo) => (
                      <tr key={titulo.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">{getTipoBadge(titulo.tipo)}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {formatCurrency(titulo.valor)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(titulo.vencimento)}</td>
                        <td className="px-4 py-3">{getStatusBadge(titulo.status)}</td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                          {titulo.pedido_id
                            ? `Pedido: ${titulo.pedido_id.slice(0, 8)}...`
                            : titulo.compra_id
                              ? `Compra: ${titulo.compra_id.slice(0, 8)}...`
                              : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {titulo.status === 'aberto' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBaixar(titulo)}
                              className="gap-1"
                            >
                              <Download className="w-3 h-3" />
                              Baixar
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-200">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}