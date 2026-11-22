import { useState } from 'react';
import { Card, CardContent } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { SearchInput } from '../../../shared/ui/SearchInput';
import { Pagination } from '../../../shared/ui/Pagination';
import { formatDocumento } from '../../../shared/lib/utils';
import type { Cliente } from '../../../shared/types';
import { Plus, Edit, Trash2, User } from 'lucide-react';

interface ClientesResponse {
  data: Cliente[];
  total: number;
  page: number;
  pageSize: number;
}

const mockData: Cliente[] = [
  {
    id: '1',
    nome: 'João Silva',
    email: 'joao@email.com',
    documento: '123.456.789-00',
    tipo_documento: 'cpf',
    telefone: '(11) 99999-9999',
    endereco: 'Rua Exemplo, 123 - São Paulo/SP',
    ativo: true,
    criado_em: '2024-01-15T00:00:00Z',
  },
];

async function fetchClientes(
  empresaId: string,
  search: string = '',
  page: number = 1,
  pageSize: number = 10
): Promise<ClientesResponse> {
  // Mock de dados - na implementação real, isso chamaria a API
  const filtered = search
    ? mockData.filter(c =>
        c.nome.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      )
    : mockData;

  return {
    data: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: mockData.length,
    page,
    pageSize,
  };
}

export function ClientesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [data, setData] = useState<ClientesResponse>({ data: [], total: 0, page: 1, pageSize });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulação de carregamento - na implementação real, usaria useQuery
  // useEffect(() => {
  //   fetchClientes(empresaId, search, page, pageSize).then(setData);
  // }, [empresaId, search, page, pageSize]);

  const totalPages = Math.ceil((data.total || 0) / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Clientes</h3>
          <p className="text-sm text-gray-500">Gerencie os clientes da sua empresa</p>
        </div>
        <Button onClick={() => {}}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Buscar clientes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {data.data?.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum cliente encontrado</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Nome</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Documento</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Telefone</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data?.map((cliente) => (
                      <tr key={cliente.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{cliente.nome}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {formatDocumento(cliente.documento, cliente.tipo_documento)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">{cliente.email}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">{cliente.telefone}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
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