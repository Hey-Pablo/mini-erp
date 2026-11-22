import { useState } from 'react';
import { Card, CardContent } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { SearchInput } from '../../../shared/ui/SearchInput';
import { Pagination } from '../../../shared/ui/Pagination';
import type { Produto } from '../../../shared/types';
import { Plus, Edit, Trash2, Package } from 'lucide-react';

export function ProdutosPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Mock de dados
  const mockData: Produto[] = [
    {
      id: '1',
      codigo: 'PROD-001',
      nome: 'Produto Exemplo',
      preco_venda: 99.90,
      preco_custo: 50.00,
      unidade: 'Unidade',
      estoque_atual: 100,
      estoque_minimo: 10,
      ativo: true,
      criado_em: '2024-01-15T00:00:00Z',
    },
  ];

  const filteredData = search
    ? mockData.filter(p =>
        p.nome.toLowerCase().includes(search.toLowerCase()) ||
        p.codigo.toLowerCase().includes(search.toLowerCase())
      )
    : mockData;

  const data = filteredData.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredData.length / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Produtos</h3>
          <p className="text-sm text-gray-500">Gerencie os produtos da sua empresa</p>
        </div>
        <Button onClick={() => {}}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Buscar produtos..."
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
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum produto encontrado</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Código</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Nome</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Unidade</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Estoque</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Preço Venda</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((produto) => (
                      <tr key={produto.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-gray-600">{produto.codigo}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{produto.nome}</td>
                        <td className="px-4 py-3 text-gray-600">{produto.unidade}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={produto.estoque_atual < produto.estoque_minimo ? 'text-red-600 font-medium' : 'text-gray-900'}>
                            {produto.estoque_atual}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-green-600">
                          R$ {produto.preco_venda.toFixed(2)}
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