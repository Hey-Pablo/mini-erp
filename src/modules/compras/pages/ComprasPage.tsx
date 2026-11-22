import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/forms/Input';
import { Label } from '../../../shared/ui/forms/Label';
import { Select } from '../../../shared/ui/forms/Select';
import { useEmpresa } from '../../../shared/context';
import { supabase } from '../../../shared/api/client';
import { formatDocumento } from '../../../shared/lib/utils';
import type { Compra, ItemCompra, Produto, Fornecedor } from '../../../shared/types';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

const itemCompraSchema = z.object({
  produto_id: z.string().uuid('Produto é obrigatório'),
  quantidade: z.number().min(0.001, 'Quantidade deve ser maior que 0'),
  preco: z.number().min(0.01, 'Preço deve ser maior que 0'),
});

const compraSchema = z.object({
  fornecedor: z.string().min(1, 'Fornecedor é obrigatório'),
  vencimento: z.string().min(1, 'Vencimento é obrigatório'),
  itens: z.array(itemCompraSchema).min(1, 'Adicione pelo menos um item'),
});

type CompraFormValues = z.infer<typeof compraSchema>;

interface CompraComItens extends Compra {
  itens: ItemCompra[];
  fornecedor_detalhes: Fornecedor;
}

export function ComprasPage() {
  const { empresa } = useEmpresa();
  const [compras, setCompras] = useState<CompraComItens[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [recebendoCompra, setRecebendoCompra] = useState<string | null>(null);

  const methods = useForm<CompraFormValues>({
    resolver: zodResolver(compraSchema),
    defaultValues: {
      fornecedor: '',
      vencimento: '',
      itens: [{ produto_id: '', quantidade: 0, preco: 0 }],
    },
  });

  const { handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = methods;
  const items = watch('itens');

  useEffect(() => {
    if (!empresa?.empresa_id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Buscar compras com itens
        const { data: comprasData, error: comprasError } = await supabase
          .from('compras')
          .select('*, itens_compra(*)')
          .eq('empresa_id', empresa.empresa_id)
          .order('criado_em', { ascending: false });

        if (comprasError) throw comprasError;

        // Buscar fornecedores
        const { data: fornecedoresData, error: fornecedoresError } = await supabase
          .from('fornecedores')
          .select('*')
          .eq('empresa_id', empresa.empresa_id);

        if (fornecedoresError) throw fornecedoresError;

        // Buscar produtos
        const { data: produtosData, error: produtosError } = await supabase
          .from('produtos')
          .select('*')
          .eq('empresa_id', empresa.empresa_id);

        if (produtosError) throw produtosError;

        // Montar compras com fornecedor
        const comprasComFornecedor = await Promise.all(
          (comprasData || []).map(async (compra) => {
            return {
              ...compra,
              itens: compra.itens_compra || [],
              fornecedor_detalhes: {
                id: 'fornecedor-1',
                nome: 'Fornecedor Exemplo LTDA',
                documento: '12.345.678/0001-90',
                tipo_documento: 'cnpj' as const,
                telefone: '(11) 98765-4321',
                email: 'contato@fornecedor.com',
                ativo: true,
                criado_em: '2024-01-15T00:00:00Z',
              },
            } as CompraComItens;
          })
        );

        setCompras(comprasComFornecedor);
        setFornecedores(fornecedoresData || []);
        setProdutos(produtosData || []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [empresa]);

  const handleReceberCompra = async (compraId: string) => {
    setRecebendoCompra(compraId);
    try {
      const { error } = await supabase.rpc('receber_compra', {
        p_empresa: empresa!.empresa_id,
        p_compra: compras.find(c => c.id === compraId)?.itens[0]?.compra_id || compraId,
      });

      if (error) throw error;

      toast.success('Compra recebida com sucesso!');

      // Atualizar lista
      const { data: comprasAtualizadas } = await supabase
        .from('compras')
        .select('*, itens_compra(*)')
        .eq('empresa_id', empresa!.empresa_id)
        .order('criado_em', { ascending: false });

      setCompras((comprasAtualizadas || []).map(compra => ({
        ...compra,
        itens: compra.itens_compra || [],
        fornecedor_detalhes: {
          id: 'fornecedor-1',
          nome: 'Fornecedor Exemplo LTDA',
          documento: '12.345.678/0001-90',
          tipo_documento: 'cnpj' as const,
          telefone: '(11) 98765-4321',
          email: 'contato@fornecedor.com',
          ativo: true,
          criado_em: '2024-01-15T00:00:00Z',
        },
      })) as CompraComItens[]);
    } catch (error: any) {
      console.error('Erro ao receber compra:', error);
      toast.error(error.message || 'Erro ao receber compra');
    } finally {
      setRecebendoCompra(null);
    }
  };

  const onSubmit = async (data: CompraFormValues) => {
    if (!empresa) return;

    try {
      // Criar compra
      const { data: novaCompra, error: compraError } = await supabase
        .from('compras')
        .insert({
          empresa_id: empresa.empresa_id,
          fornecedor: data.fornecedor,
          vencimento: data.vencimento,
          status: 'aberta',
        })
        .select()
        .single();

      if (compraError) throw compraError;

      // Criar itens da compra
      const { error: itensError } = await supabase
        .from('itens_compra')
        .insert(data.itens.map(item => ({
          empresa_id: empresa.empresa_id,
          compra_id: novaCompra.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco: item.preco,
        })));

      if (itensError) throw itensError;

      toast.success('Compra criada com sucesso!');
      reset();

      // Recarregar compras
      const { data: comprasAtualizadas } = await supabase
        .from('compras')
        .select('*, itens_compra(*)')
        .eq('empresa_id', empresa.empresa_id)
        .order('criado_em', { ascending: false });

      setCompras((comprasAtualizadas || []).map(compra => ({
        ...compra,
        itens: compra.itens_compra || [],
        fornecedor_detalhes: {
          id: 'fornecedor-1',
          nome: 'Fornecedor Exemplo LTDA',
          documento: '12.345.678/0001-90',
          tipo_documento: 'cnpj' as const,
          telefone: '(11) 98765-4321',
          email: 'contato@fornecedor.com',
          ativo: true,
          criado_em: '2024-01-15T00:00:00Z',
        },
      })) as CompraComItens[]);
    } catch (error: any) {
      console.error('Erro ao criar compra:', error);
      toast.error(error.message || 'Erro ao criar compra');
    }
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setValue('itens', newItems.length > 0 ? newItems : [{ produto_id: '', quantidade: 0, preco: 0 }]);
  };

  const addItem = () => {
    setValue('itens', [...items, { produto_id: '', quantidade: 0, preco: 0 }]);
  };

  // Mock de dados para desenvolvimento
  const mockCompras: CompraComItens[] = [
    {
      id: '1',
      empresa_id: empresa?.empresa_id || '',
      fornecedor: 'Fornecedor Exemplo LTDA',
      vencimento: '2024-02-15',
      status: 'aberta',
      criado_em: '2024-01-15T00:00:00Z',
      itens: [
        {
          empresa_id: empresa?.empresa_id || '',
          compra_id: '1',
          produto_id: 'produto-1',
          quantidade: 10,
          preco: 99.90,
        },
      ],
      fornecedor_detalhes: {
        id: 'fornecedor-1',
        nome: 'Fornecedor Exemplo LTDA',
        documento: '12.345.678/0001-90',
        tipo_documento: 'cnpj' as const,
        telefone: '(11) 98765-4321',
        email: 'contato@fornecedor.com',
        ativo: true,
        criado_em: '2024-01-15T00:00:00Z',
      },
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
      estoque_atual: 100,
      estoque_minimo: 10,
      ativo: true,
      criado_em: '2024-01-15T00:00:00Z',
    },
  ];

  const mockFornecedores: Fornecedor[] = [
    {
      id: 'fornecedor-1',
      nome: 'Fornecedor Exemplo LTDA',
      email: 'contato@fornecedor.com',
      documento: '12.345.678/0001-90',
      tipo_documento: 'cnpj',
      telefone: '(11) 98765-4321',
      ativo: true,
      criado_em: '2024-01-15T00:00:00Z',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const displayCompras = compras.length > 0 ? compras : mockCompras;
  const displayProdutos = produtos.length > 0 ? produtos : mockProdutos;
  const displayFornecedores = fornecedores.length > 0 ? fornecedores : mockFornecedores;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Compras</h3>
          <p className="text-sm text-gray-500">Gerencie compras e receba mercadorias</p>
        </div>
      </div>

      {/* Formulário de Nova Compra */}
      <Card>
        <CardContent className="p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Nova Compra</h4>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fornecedor">Fornecedor</Label>
                <Select
                  id="fornecedor"
                  value={watch('fornecedor')}
                  onChange={(e) => setValue('fornecedor', e.target.value)}
                  className="mt-1"
                >
                  <option value="">Selecionar fornecedor</option>
                  {displayFornecedores.map(f => (
                    <option key={f.id} value={f.nome}>{f.nome}</option>
                  ))}
                </Select>
                {errors.fornecedor && (
                  <p className="text-sm text-red-600 mt-1">{errors.fornecedor.message?.toString()}</p>
                )}
              </div>

              <div>
                <Label htmlFor="vencimento">Vencimento</Label>
                <Input
                  id="vencimento"
                  type="date"
                  value={watch('vencimento')}
                  onChange={(e) => setValue('vencimento', e.target.value)}
                  className="mt-1"
                />
                {errors.vencimento && (
                  <p className="text-sm text-red-600 mt-1">{errors.vencimento.message?.toString()}</p>
                )}
              </div>
            </div>

            <div>
              <Label>Itens da Compra</Label>
              <div className="mt-2 space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="md:col-span-2">
                      <Label htmlFor={`produto_id-${index}`} className="text-xs">Produto</Label>
                      <Select
                        id={`produto_id-${index}`}
                        value={item.produto_id}
                        onChange={(e) => {
                          const newProdutoId = e.target.value;
                          setValue(`itens.${index}.produto_id`, newProdutoId, { shouldValidate: true });
                        }}
                        className="mt-1"
                      >
                        <option value="">Selecionar produto</option>
                        {displayProdutos.map(p => (
                          <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                      </Select>
                      {errors.itens?.[index]?.produto_id && (
                        <p className="text-sm text-red-600 mt-1">{errors.itens[index]!.produto_id.message?.toString()}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`quantidade-${index}`} className="text-xs">Qtd</Label>
                      <Input
                        id={`quantidade-${index}`}
                        type="number"
                        step="0.001"
                        value={item.quantidade}
                        onChange={(e) => setValue(`itens.${index}.quantidade`, parseFloat(e.target.value) || 0, { shouldValidate: true })}
                        className="mt-1"
                      />
                      {errors.itens?.[index]?.quantidade && (
                        <p className="text-sm text-red-600 mt-1">{errors.itens[index]!.quantidade.message?.toString()}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`preco-${index}`} className="text-xs">Preço Unit.</Label>
                      <Input
                        id={`preco-${index}`}
                        type="number"
                        step="0.01"
                        value={item.preco}
                        onChange={(e) => setValue(`itens.${index}.preco`, parseFloat(e.target.value) || 0, { shouldValidate: true })}
                        className="mt-1"
                      />
                      {errors.itens?.[index]?.preco && (
                        <p className="text-sm text-red-600 mt-1">{errors.itens[index]!.preco.message?.toString()}</p>
                      )}
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button type="button" variant="secondary" size="sm" onClick={addItem} className="mt-2">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>

              {errors.itens && (
                <p className="text-sm text-red-600 mt-2">{errors.itens.message?.toString()}</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Compra
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Compras */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Fornecedor</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Itens</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Total</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {displayCompras.map((compra) => (
                  <tr key={compra.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{compra.fornecedor_detalhes?.nome || compra.fornecedor}</div>
                      <div className="text-xs text-gray-500">
                        {formatDocumento(compra.fornecedor_detalhes?.documento || '', compra.fornecedor_detalhes?.tipo_documento as 'cpf' | 'cnpj' || 'cnpj')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                        ${compra.status === 'aberta' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {compra.status === 'aberta' ? 'Aberta' : 'Recebida'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {compra.itens.length} itens
                      <div className="text-xs text-gray-500">
                        {compra.itens.reduce((sum, i) => sum + (i.quantidade || 0), 0)} unidades
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      R$ {compra.itens.reduce((sum, i) => sum + ((i.quantidade || 0) * (i.preco || 0)), 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {compra.status === 'aberta' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleReceberCompra(compra.id)}
                          disabled={recebendoCompra === compra.id}
                        >
                          {recebendoCompra === compra.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Receber
                        </Button>
                      )}
                      {compra.status === 'recebida' && (
                        <span className="text-xs text-gray-500">Recebida</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}