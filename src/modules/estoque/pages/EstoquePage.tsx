import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useEmpresa } from '../../../shared/context';
import { useProdutosEstoque, useMovimentosEstoque } from '../../../shared/api/hooks';
import { Card, CardContent } from '../../../shared/ui/Card';
import { calcularSaldos } from '../saldo';

export function EstoquePage() {
  const { empresa } = useEmpresa();
  const empresaId = empresa?.empresa_id || '';
  const produtos = useProdutosEstoque(empresaId);
  const movimentos = useMovimentosEstoque(empresaId);

  const saldos = useMemo(
    () => calcularSaldos(produtos.data || [], movimentos.data || []),
    [produtos.data, movimentos.data]
  );
  const nomes = useMemo(
    () => new Map((produtos.data || []).map((p) => [p.id, p.nome])),
    [produtos.data]
  );
  const alertas = saldos.filter((s) => s.abaixo_do_minimo);

  if (produtos.isLoading || movimentos.isLoading) {
    return <p className="p-8 text-center text-gray-500">Carregando estoque...</p>;
  }
  const erro = produtos.error || movimentos.error;
  if (erro) {
    return <p className="p-8 text-center text-red-600">Erro ao carregar estoque: {erro.message}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Estoque</h3>
        <p className="text-sm text-gray-500">Saldo por produto e movimentos</p>
      </div>

      {alertas.length > 0 && (
        <div role="alert" className="flex items-start gap-2 p-4 rounded-md bg-red-50 text-red-800 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5" />
          <span>
            {alertas.length} produto(s) abaixo do estoque mínimo: {alertas.map((a) => a.nome).join(', ')}
          </span>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm" aria-label="Saldo por produto">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Produto</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">Saldo</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">Mínimo</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Situação</th>
              </tr>
            </thead>
            <tbody>
              {saldos.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-gray-500">Nenhum produto cadastrado</td></tr>
              )}
              {saldos.map((s) => (
                <tr key={s.produto_id} className="border-b border-gray-100">
                  <td className="px-4 py-3">{s.nome}</td>
                  <td className="px-4 py-3 text-right font-medium">{s.saldo}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{s.estoque_minimo}</td>
                  <td className="px-4 py-3">
                    {s.abaixo_do_minimo ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Abaixo do mínimo</span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm" aria-label="Movimentos de estoque">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Data</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Produto</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">Quantidade</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Origem</th>
              </tr>
            </thead>
            <tbody>
              {(movimentos.data || []).length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-gray-500">Nenhum movimento</td></tr>
              )}
              {(movimentos.data || []).map((m) => (
                <tr key={m.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 text-gray-600">{new Date(m.criado_em).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3">{nomes.get(m.produto_id) ?? m.produto_id}</td>
                  <td className={`px-4 py-3 text-right font-medium ${m.quantidade < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {m.quantidade > 0 ? `+${m.quantidade}` : m.quantidade}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.compra_id ? 'Compra' : m.pedido_id ? 'Pedido' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
