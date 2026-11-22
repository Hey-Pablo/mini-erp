import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { SearchInput } from '../../../shared/ui/SearchInput';
import { useEmpresa } from '../../../shared/context';
import { supabase } from '../../../shared/api/client';
import type { Produto, MovimentoEstoque, SaldoEstoque } from '../../../shared/types';
import { Plus, Edit, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface MovimentoEstoqueWithProdutos extends MovimentoEstoque {
  produtos: { nome: string } | null;
}

export function EstoquePage() {
  const { empresa } = useEmpresa();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [saldoEstoque, setSaldoEstoque] = useState<SaldoEstoque[]>([]);
  const [movimentos, setMovimentos] = useState<MovimentoEstoqueWithProdutos[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!empresa?.empresa_id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Buscar saldo de estoque usando a view
        const { data: saldoData, error: saldoError } = await supabase
          .from('saldo_estoque')
          .select('*')
          .eq('empresa_id', empresa.empresa_id);

        if (saldoError) throw saldoError;

        // Buscar produtos
        const { data: produtosData, error: produtosError } = await supabase
          .from('produtos')
          .select('*')
          .eq('empresa_id', empresa.empresa_id);

        if (produtosError) throw produtosError;

        // Buscar movimentos de estoque
        const { data: movimentosData, error: movimentosError } = await supabase
          .from('movimentos_estoque')
          .select('*, produtos(nome)')
          .eq('empresa_id', empresa.empresa_id)
          .order('criado_em', { ascending: false })
          .limit(50);

        if (movimentosError) throw movimentosError;

        setSaldoEstoque(saldoData || []);
        setProdutos(produtosData || []);
        setMovimentos((movimentosData || []).map(m => ({
          ...m,
          produtos: m.produtos as { nome: string } | null,
        })));
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados de estoque');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [empresa]);

  // Mock de dados para desenvolvimento
  const mockSaldoEstoque: SaldoEstoque[] = [
    {
      empresa_id: empresa?.empresa_id || '',
      produto_id: 'produto-1',
      nome: 'Produto Exemplo A',
      estoque_minimo: 10,
      saldo: 15,
      estoque_baixo: false,
    },
    {
      empresa_id: empresa?.empresa_id || '',
      produto_id: 'produto-2',
      nome: 'Produto Exemplo B',
      estoque_minimo: 20,
      saldo: 5,
      estoque_baixo: true,
    },
  ];

  const mockProdutos: Produto[] = [
    {
      id: 'produto-1',
      codigo: 'PROD-001',
      nome: 'Produto Exemplo A',
      preco_venda: 99.90,
      preco_custo: 50.00,
      unidade: 'Unidade',
      estoque_atual: 15,
      estoque_minimo: 10,
      ativo: true,
      criado_em: '2024-01-15T00:00:00Z',
    },
    {
      id: 'produto-2',
      codigo: 'PROD-002',
      nome: 'Produto Exemplo B',
      preco_venda: 149.90,
      preco_custo: 75.00,
      unidade: 'Unidade',
      estoque_atual: 5,
      estoque_minimo: 20,
      ativo: true,
      criado_em: '2024-01-15T00:00:00Z',
    },
  ];

  const mockMovimentos: MovimentoEstoqueWithProdutos[] = [
    {
      empresa_id: empresa?.empresa_id || '',
      id: 'mov-1',
      produto_id: 'produto-1',
      quantidade: 50,
      pedido_id: null,
      compra_id: 'compra-1',
      criado_em: '2024-01-15T00:00:00Z',
      produtos: { nome: 'Produto Exemplo A' },
    },
    {
      empresa_id: empresa?.empresa_id || '',
      id: 'mov-2',
      produto_id: 'produto-1',
      quantidade: -10,
      pedido_id: 'pedido-1',
      compra_id: null,
      criado_em: '2024-01-16T00:00:00Z',
      produtos: { nome: 'Produto Exemplo A' },
    },
  ];

  const displaySaldoEstoque = saldoEstoque.length > 0 ? saldoEstoque : mockSaldoEstoque;
  const displayProdutos = produtos.length > 0 ? produtos : mockProdutos;
  const displayMovimentos = movimentos.length > 0 ? movimentos : mockMovimentos;

  const estoqueBaixo = displaySaldoEstoque.filter(s => s.estoque_baixo);

  const filteredMovimentos = search
    ? displayMovimentos.filter(m =>
        (m.produtos?.nome || '').toLowerCase().includes(search.toLowerCase())
      )
    : displayMovimentos;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alertas de Estoque Baixo */}
      {estoqueBaixo.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Avisos de Estoque Baixo</h4>
                <p className="text-sm text-yellow-700">
                  {estoqueBaixo.length} produto(s) estão abaixo do estoque mínimo:
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saldo de Estoque */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h4 className="text-md font-semibold text-gray-900">Saldo de Estoque</h4>
              <p className="text-sm text-gray-500">Visão geral de produtos e saldos</p>
            </div>
            <div className="flex items-center gap-2">
              <SearchInput
                placeholder="Buscar produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Produto</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Código</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Estoque Mínimo</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Saldo Atual</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {displaySaldoEstoque.map((item) => (
                  <tr key={item.produto_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.nome}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono">
                      {displayProdutos.find(p => p.id === item.produto_id)?.codigo || '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{item.estoque_minimo}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={item.estoque_baixo ? 'text-red-600 font-medium' : 'text-gray-900'}>
                        {item.saldo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.estoque_baixo ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Baixo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ÀQUIA
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Movimentos de Estoque */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h4 className="text-md font-semibold text-gray-900">Movimentos de Estoque</h4>
              <p className="text-sm text-gray-500">Histórico de entradas e saídas</p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Registrar Movimento
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Produto</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Quantidade</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Origem</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Data</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovimentos.map((movimento) => {
                  const produto = displayProdutos.find(p => p.id === movimento.produto_id);
                  const entry = movimento.quantidade > 0;

                  return (
                    <tr key={movimento.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {movimento.produtos?.nome || produto?.nome || '-'}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${entry ? 'text-green-600' : 'text-red-600'}`}>
                        {entry ? '+' : ''}{movimento.quantidade}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                          ${entry ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {entry ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">
                        {movimento.compra_id ? 'Compra' : movimento.pedido_id ? 'Pedido' : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">
                        {movimento.criado_em ? format(new Date(movimento.criado_em), 'dd/MM/yyyy') : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}