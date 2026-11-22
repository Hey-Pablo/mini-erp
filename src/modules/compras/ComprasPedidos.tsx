import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../shared/supabase';
import { useEmpresa } from '../../../shared/hooks';
import { Button, Input, Label, Select, Card, CardHeader, CardTitle, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal } from '../../../shared/ui';
import { Plus, Search, Edit, Eye, Truck, Box, Filter } from 'lucide-react';
import { cn, formatCurrency, formatDate, formatDocumento } from '../../../shared/utils';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Compra, CompraItem, Fornecedor, Produto } from '../../../shared/types';

const compraSchema = z.object({
  fornecedor_id: z.string().min(1, 'Fornecedor é obrigatório'),
  data_emissao: z.string().min(1, 'Data é obrigatória'),
  observacoes: z.string().optional(),
});

type CompraFormData = z.infer<typeof compraSchema>;

const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  emitida: 'Emitida',
  recebida: 'Recebida',
  cancelada: 'Cancelada',
};

const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  rascunho: 'default',
  emitida: 'info',
  recebida: 'success',
  cancelada: 'danger',
};

async function fetchCompras(empresaId: string, search: string, statusFilter: string) {
  let query = supabase
    .from('compras')
    .select(`
      *,
      fornecedor:fornecedores(id, nome, documento, tipo_documento),
      itens:compra_itens(*, produto:produtos(id, nome, codigo, unidade, preco_custo))
    `)
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false });

  if (statusFilter !== 'todos') {
    query = query.eq('status', statusFilter);
  }

  if (search) {
    query = query.or(`numero.ilike.%${search}%,fornecedor.nome.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as (Compra & { fornecedor: Fornecedor; itens: (CompraItem & { produto: Produto })[] })[];
}

async function fetchFornecedores(empresaId: string) {
  const { data, error } = await supabase
    .from('fornecedores')
    .select('id, nome, documento, tipo_documento')
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
    .order('nome');
  if (error) throw error;
  return data as Fornecedor[];
}

async function fetchProdutos(empresaId: string) {
  const { data, error } = await supabase
    .from('produtos')
    .select('id, codigo, nome, unidade, preco_custo, estoque_atual')
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
    .order('nome');
  if (error) throw error;
  return data as Produto[];
}

async function createCompra(compra: Omit<Compra, 'id' | 'created_at' | 'updated_at' | 'numero' | 'subtotal' | 'desconto' | 'total'> & { itens: Omit<CompraItem, 'id' | 'compra_id' | 'created_at'>[] }) {
  const { data: existing } = await supabase
    .from('compras')
    .select('numero')
    .eq('empresa_id', compra.empresa_id)
    .order('numero', { ascending: false })
    .limit(1);

  const nextNumero = (existing?.[0]?.numero || 0) + 1;

  const subtotal = compra.itens.reduce((sum, item) => sum + item.quantidade * item.preco_unitario, 0);
  const desconto = compra.itens.reduce((sum, item) => sum + item.desconto, 0);
  const total = subtotal - desconto;

  const { data: novaCompra, error: compraError } = await supabase
    .from('compras')
    .insert([{
      ...compra,
      numero: nextNumero,
      subtotal,
      desconto,
      total,
      status: 'rascunho',
    }])
    .select()
    .single();

  if (compraError) throw compraError;

  const itensComCompraId = compra.itens.map(item => ({
    ...item,
    compra_id: novaCompra.id,
  }));

  const { error: itensError } = await supabase
    .from('compra_itens')
    .insert(itensComCompraId);

  if (itensError) throw itensError;

  return novaCompra;
}

async function updateCompra(id: string, compra: Partial<Compra>) {
  const { data, error } = await supabase
    .from('compras')
    .update({ ...compra, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteCompra(id: string) {
  const { error } = await supabase
    .from('compras')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

async function receberCompra(compraId: string) {
  const { data, error } = await supabase.rpc('receber_compra', { p_compra_id: compraId });
  if (error) throw error;
  return data;
}

export function ComprasPedidos() {
  const { empresa, perfil } = useEmpresa();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'rascunho' | 'emitida' | 'recebida' | 'cancelada'>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompra, setEditingCompra] = useState<Compra | null>(null);
  const [viewCompra, setViewCompra] = useState<Compra | null>(null);
  const [receberConfirm, setReceberConfirm] = useState<Compra | null>(null);
  const [receberError, setReceberError] = useState<string | null>(null);

  const { data: compras = [], isLoading } = useQuery({
    queryKey: ['compras', empresa?.id, search, statusFilter],
    queryFn: () => fetchCompras(empresa!.id, search, statusFilter),
    enabled: !!empresa?.id,
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores-select', empresa?.id],
    queryFn: () => fetchFornecedores(empresa!.id),
    enabled: !!empresa?.id,
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos-select-compra', empresa?.id],
    queryFn: () => fetchProdutos(empresa!.id),
    enabled: !!empresa?.id,
  });

  const createMutation = useMutation({
    mutationFn: createCompra,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      setModalOpen(false);
      setEditingCompra(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Compra> }) => updateCompra(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      setModalOpen(false);
      setEditingCompra(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCompra,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] });
    },
  });

  const receberMutation = useMutation({
    mutationFn: receberCompra,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      setReceberConfirm(null);
      setReceberError(null);
    },
    onError: (error: Error) => {
      setReceberError(error.message);
    },
  });

  const form = useForm<CompraFormData>({
    resolver: zodResolver(compraSchema),
    defaultValues: {
      fornecedor_id: '',
      data_emissao: new Date().toISOString().split('T')[0],
      observacoes: '',
    },
  });

  const handleOpenModal = (compra?: Compra) => {
    if (compra) {
      setEditingCompra(compra);
      form.reset({
        fornecedor_id: compra.fornecedor_id,
        data_emissao: compra.data_emissao.split('T')[0],
        observacoes: compra.observacoes || '',
      });
    } else {
      setEditingCompra(null);
      form.reset({
        fornecedor_id: '',
        data_emissao: new Date().toISOString().split('T')[0],
        observacoes: '',
      });
    }
    setModalOpen(true);
  };

  const handleView = (compra: Compra) => {
    setViewCompra(compra);
  };

  const handleReceber = (compra: Compra) => {
    setReceberConfirm(compra);
    setReceberError(null);
  };

  const confirmReceber = async () => {
    if (receberConfirm) {
      await receberMutation.mutateAsync(receberConfirm.id);
    }
  };

  const canManage = perfil?.papel === 'administrador' || perfil?.papel === 'estoque';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos de Compra</h1>
          <p className="text-gray-500">Gerencie os pedidos de compra da empresa</p>
        </div>
        {canManage && (
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4" />
            Nova Compra
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative max-w-md flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar por número ou fornecedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
            className="pl-10 w-[180px]"
          >
            <option value="todos">Todos os status</option>
            <option value="rascunho">Rascunho</option>
            <option value="emitida">Emitida</option>
            <option value="recebida">Recebida</option>
            <option value="cancelada">Cancelada</option>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-2 text-gray-500">Carregando compras...</p>
            </div>
          ) : compras.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Nenhuma compra encontrada</p>
              {canManage && (
                <Button variant="ghost" className="mt-2" onClick={() => handleOpenModal()}>
                  Criar primeira compra
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Data Emissão</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Desconto</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compras.map((compra) => (
                    <TableRow key={compra.id}>
                      <TableCell className="font-mono font-medium">#{compra.numero.toString().padStart(6, '0')}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{compra.fornecedor?.nome}</p>
                          <p className="text-xs text-gray-500">{compra.fornecedor ? formatDocumento(compra.fornecedor.documento, compra.fornecedor.tipo_documento) : ''}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(compra.data_emissao)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(compra.subtotal)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(compra.desconto)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(compra.total)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_COLORS[compra.status] || 'default'}>
                          {STATUS_LABELS[compra.status] || compra.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleView(compra)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canManage && compra.status === 'rascunho' && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleOpenModal(compra)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleReceber(compra)}>
                                <Truck className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(compra.id)}>
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          {canManage && compra.status === 'emitida' && (
                            <Button variant="ghost" size="icon" onClick={() => handleReceber(compra)}>
                              <Truck className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingCompra(null); form.reset(); }}
        title={editingCompra ? 'Editar Compra' : 'Nova Compra'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setModalOpen(false); setEditingCompra(null); form.reset(); }}>
              Cancelar
            </Button>
            <Button onClick={() => form.handleSubmit(onSubmit)()} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        }
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fornecedor_id">Fornecedor *</Label>
              <Select
                id="fornecedor_id"
                {...form.register('fornecedor_id')}
              >
                <option value="">Selecione um fornecedor</option>
                {fornecedores.map((forn) => (
                  <option key={forn.id} value={forn.id}>
                    {forn.nome} - {formatDocumento(forn.documento, forn.tipo_documento)}
                  </option>
                ))}
              </Select>
              {form.formState.errors.fornecedor_id && (
                <p className="text-sm text-red-600">{form.formState.errors.fornecedor_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_emissao">Data de Emissão *</Label>
              <Input
                id="data_emissao"
                type="date"
                {...form.register('data_emissao')}
              />
              {form.formState.errors.data_emissao && (
                <p className="text-sm text-red-600">{form.formState.errors.data_emissao.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Input
                id="observacoes"
                {...form.register('observacoes')}
                placeholder="Observações da compra"
              />
            </div>
          </div>

          {editingCompra && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Itens da Compra</h4>
              <CompraItensEditor
                compraId={editingCompra.id}
                produtos={produtos}
                itens={editingCompra.itens || []}
                onChange={() => queryClient.invalidateQueries({ queryKey: ['compras'] })}
              />
            </div>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={!!viewCompra}
        onClose={() => setViewCompra(null)}
        title={`Compra #${viewCompra?.numero?.toString().padStart(6, '0')}`}
      >
        <CompraDetalheView compra={viewCompra!} onClose={() => setViewCompra(null)} />
      </Modal>

      <Modal
        isOpen={!!receberConfirm}
        onClose={() => { setReceberConfirm(null); setReceberError(null); }}
        title="Confirmar Recebimento"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setReceberConfirm(null); setReceberError(null); }}>
              Cancelar
            </Button>
            <Button onClick={confirmReceber} disabled={receberMutation.isPending}>
              {receberMutation.isPending ? 'Recebendo...' : 'Confirmar Recebimento'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-gray-600">
            Confirma o recebimento da compra <strong>#{receberConfirm?.numero?.toString().padStart(6, '0')}</strong>
            do fornecedor <strong>{receberConfirm?.fornecedor?.nome}</strong>?
          </p>
          <p className="text-sm text-gray-500">
            Isso irá: aumentar o estoque dos itens e gerar título a pagar.
          </p>
          {receberError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {receberError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function CompraItensEditor({ compraId, produtos, itens, onChange }: {
  compraId: string;
  produtos: Produto[];
  itens: (CompraItem & { produto?: Produto })[];
  onChange: () => void;
}) {
  const [itensLocais, setItensLocais] = useState(itens);
  const [novoItem, setNovoItem] = useState({ produto_id: '', quantidade: 1, preco_unitario: 0, desconto: 0 });

  const addItem = async () => {
    if (!novoItem.produto_id || novoItem.quantidade <= 0) return;

    const produto = produtos.find(p => p.id === novoItem.produto_id);
    if (!produto) return;

    const item = {
      produto_id: novoItem.produto_id,
      quantidade: novoItem.quantidade,
      preco_unitario: novoItem.preco_unitario || produto.preco_custo,
      desconto: novoItem.desconto,
      total: novoItem.quantidade * (novoItem.preco_unitario || produto.preco_custo) - novoItem.desconto,
      produto,
    };

    const { error } = await supabase
      .from('compra_itens')
      .insert([{ ...item, compra_id: compraId }]);

    if (!error) {
      setNovoItem({ produto_id: '', quantidade: 1, preco_unitario: 0, desconto: 0 });
      onChange();
    }
  };

  const removeItem = async (itemId: string) => {
    const { error } = await supabase
      .from('compra_itens')
      .delete()
      .eq('id', itemId);
    if (!error) onChange();
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-5">
        <div className="space-y-2 sm:col-span-2">
          <Label>Produto</Label>
          <Select
            value={novoItem.produto_id}
            onValueChange={(value) => {
              const prod = produtos.find(p => p.id === value);
              setNovoItem(prev => ({
                ...prev,
                produto_id: value,
                preco_unitario: prod?.preco_custo || 0
              }));
            }}
          >
            <option value="">Selecione um produto</option>
            {produtos.map((prod) => (
              <option key={prod.id} value={prod.id}>
                {prod.codigo} - {prod.nome} ({formatCurrency(prod.preco_custo)}/{prod.unidade}) - Est: {prod.estoque_atual}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Quantidade</Label>
          <Input
            type="number"
            step="1"
            min="1"
            value={novoItem.quantidade}
            onChange={(e) => setNovoItem(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 1 }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Preço Unit.</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={novoItem.preco_unitario}
            onChange={(e) => setNovoItem(prev => ({ ...prev, preco_unitario: parseFloat(e.target.value) || 0 }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Desconto</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={novoItem.desconto}
            onChange={(e) => setNovoItem(prev => ({ ...prev, desconto: parseFloat(e.target.value) || 0 }))}
          />
        </div>
        <div className="space-y-2 flex items-end">
          <Button onClick={addItem} disabled={!novoItem.produto_id}>
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>
      </div>

      {itensLocais.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead className="text-right">Preço Unit.</TableHead>
                <TableHead className="text-right">Desconto</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itensLocais.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.produto?.nome || item.produto?.codigo || 'Produto'}</TableCell>
                  <TableCell className="text-center">{item.quantidade}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.preco_unitario)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.desconto)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function CompraDetalheView({ compra, onClose }: { compra: Compra & { fornecedor: Fornecedor; itens: (CompraItem & { produto: Produto })[] }; onClose: () => void }) {
  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-gray-500">Fornecedor</p>
          <p className="font-medium">{compra.fornecedor?.nome}</p>
          <p className="text-sm text-gray-500">{compra.fornecedor ? formatDocumento(compra.fornecedor.documento, compra.fornecedor.tipo_documento) : ''}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Data de Emissão</p>
          <p className="font-medium">{formatDate(compra.data_emissao)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Status</p>
          <Badge variant={STATUS_COLORS[compra.status] || 'default'}>
            {STATUS_LABELS[compra.status] || compra.status}
          </Badge>
        </div>
        <div>
          <p className="text-sm text-gray-500">Número</p>
          <p className="font-medium font-mono">#{compra.numero.toString().padStart(6, '0')}</p>
        </div>
      </div>

      {compra.observacoes && (
        <div>
          <p className="text-sm text-gray-500">Observações</p>
          <p>{compra.observacoes}</p>
        </div>
      )}

      <div>
        <h4 className="font-medium mb-3">Itens da Compra</h4>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Preço Unit.</TableHead>
                <TableHead className="text-right">Desconto</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compra.itens.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.produto?.nome}</TableCell>
                  <TableCell className="text-center">{item.quantidade}</TableCell>
                  <TableCell>{item.produto?.unidade}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.preco_unitario)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.desconto)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody          </Table>
        </div>
      </div>

      <div className="flex justify-end border-t pt-4">
        <div className="w-64 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatCurrency(compra.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Desconto</span>
            <span className="text-red-600">- {formatCurrency(compra.desconto)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-bold text-lg">
            <span>Total</span>
            <span>{formatCurrency(compra.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Import Trash2 for the editor components
import { Trash2 } from 'lucide-react';