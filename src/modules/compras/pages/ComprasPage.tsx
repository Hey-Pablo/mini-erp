import { useState } from 'react';
import { toast } from 'sonner';
import { useEmpresa } from '../../../shared/context';
import {
  useCompras,
  useCreateCompra,
  useReceberCompra,
  useProdutosEstoque,
} from '../../../shared/api/hooks';
import { Card, CardContent } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/forms/Input';
import { Label } from '../../../shared/ui/forms/Label';
import { Select } from '../../../shared/ui/forms/Select';

export function ComprasPage() {
  const { empresa } = useEmpresa();
  const empresaId = empresa?.empresa_id || '';
  const compras = useCompras(empresaId);
  const produtos = useProdutosEstoque(empresaId);
  const criar = useCreateCompra();
  const receber = useReceberCompra();

  const [fornecedor, setFornecedor] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [produtoId, setProdutoId] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [preco, setPreco] = useState('');

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtd = Number(quantidade);
    const prc = Number(preco);
    if (!fornecedor.trim() || !vencimento || !produtoId || !(qtd > 0) || !(prc > 0)) {
      toast.error('Preencha fornecedor, vencimento e um item com quantidade e preço maiores que zero');
      return;
    }
    try {
      await criar.mutateAsync({
        empresaId,
        compra: { fornecedor: fornecedor.trim(), vencimento },
        itens: [{ produto_id: produtoId, quantidade: qtd, preco: prc }],
      });
      toast.success('Compra criada');
      setFornecedor(''); setVencimento(''); setProdutoId(''); setQuantidade(''); setPreco('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar compra');
    }
  };

  const handleReceber = async (compraId: string) => {
    try {
      await receber.mutateAsync({ empresaId, compraId });
      toast.success('Compra recebida');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao receber compra');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Compras</h3>
        <p className="text-sm text-gray-500">Receber uma compra dá entrada no estoque e gera o título a pagar</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleCriar} className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
            <div>
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Input id="fornecedor" value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="vencimento">Vencimento</Label>
              <Input id="vencimento" type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="produto">Produto</Label>
              <Select id="produto" value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
                <option value="">Selecione</option>
                {(produtos.data || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input id="quantidade" type="number" min="0" step="any" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="preco">Preço</Label>
              <Input id="preco" type="number" min="0" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} />
            </div>
            <div className="sm:col-span-5">
              <Button type="submit" disabled={criar.isPending}>Criar compra</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {compras.error ? (
            <p className="p-6 text-center text-red-600">Erro ao carregar compras: {compras.error.message}</p>
          ) : (
            <table className="w-full text-sm" aria-label="Lista de compras">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Fornecedor</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Vencimento</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {(compras.data || []).length === 0 && (
                  <tr><td colSpan={4} className="p-6 text-center text-gray-500">Nenhuma compra</td></tr>
                )}
                {(compras.data || []).map((c) => (
                  <tr key={c.id} className="border-b border-gray-100">
                    <td className="px-4 py-3">{c.fornecedor}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(c.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3">{c.status === 'aberta' ? 'Aberta' : 'Recebida'}</td>
                    <td className="px-4 py-3 text-right">
                      {c.status === 'aberta' && (
                        <Button variant="outline" size="sm" onClick={() => handleReceber(c.id)} disabled={receber.isPending}>
                          Receber
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
