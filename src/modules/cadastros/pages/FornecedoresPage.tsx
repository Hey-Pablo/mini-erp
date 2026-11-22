import { useState } from 'react';
import { Card, CardContent } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { SearchInput } from '../../../shared/ui/SearchInput';
import { Pagination } from '../../../shared/ui/Pagination';
import { formatDocumento } from '../../../shared/lib/utils';
import type { Fornecedor } from '../../../shared/types';
import { Plus, Edit, Trash2, Truck } from 'lucide-react';

export function FornecedoresPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Mock de dados
  const mockData: Fornecedor[] = [
    {
      id: '1',
      nome: 'Fornecedor Exemplo LTDA',
      email: 'contato@fornecedor.com',
      documento: '12.345.678/0001-90',
      tipo_documento: 'cnpj',
      telefone: '(11) 98765-4321',
      ativo: true,
      criado_em: '2024-01-15T00:00:00Z',
    },
  ];

  const filteredData = search
    ? mockData.filter(f =>
        f.nome.toLowerCase().includes(search.toLowerCase()) ||
        f.email.toLowerCase().includes(search.toLowerCase())
      )
    : mockData;

  const data = filteredData.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredData.length / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Fornecedores</h3>
          <p className="text-sm text-gray-500">Gerencie os fornecedores da sua empresa</p>
        </div>
        <Button onClick={() => {}}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Fornecedor
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Buscar fornecedores..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {data.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Truck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum fornecedor encontrado</p>
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
                    {data.map((fornecedor) => (
                      <tr key={fornecedor.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{fornecedor.nome}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {formatDocumento(fornecedor.documento, fornecedor.tipo_documento)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">{fornecedor.email}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">{fornecedor.telefone}</span>
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