import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../shared/supabase';
import { useEmpresa } from '../../../shared/hooks';
import { Button, Input, Label, Select, Card, CardHeader, CardTitle, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal } from '../../../shared/ui';
import { Plus, Search, Edit, Eye, Truck, FileText, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn, formatCurrency, formatDate, formatDocumento } from '../../../shared/utils';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Pedido, PedidoItem, Cliente, Produto } from '../../../shared/types';

const pedidoSchema = z.object({
  cliente_id: z.string().min(1, 'Cliente é obrigatório'),
  data_emissao: z.string().min(1, 'Data é obrigatória'),
  observacoes: z.string().optional(),
});

type PedidoFormData = z.infer<typeof pedidoSchema>;

const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  emitido: 'Emitido',
  faturado: 'Faturado',
  cancelado: 'Cancelado',
};

const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  rascunho: 'default',
  emitido: 'info',
  faturado: 'success',
  cancelado: 'danger',
};

async function fetchPedidos(empresaId: string, search: string, statusFilter: string) {
  let query = supabase
    .from('pedidos')
    .select(`
      *,
      cliente:clientes(id, nome, documento, tipo_documento),
      itens:pedido_itens(*, produto:produtos(id, nome, codigo, unidade, preco_venda))
    `)
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false });

  if (statusFilter !== 'todos') {
    query = query.eq('status', statusFilter);
  }

  if (search) {
    query = query.or(`numero.ilike.%${search}%,cliente.nome.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as (Pedido & { cliente: Cliente; itens: (PedidoItem & { produto: Produto })[] })[];
}

async function fetchClientes(empresaId: string) {
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nome, documento, tipo_documento')
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
    .order('nome');
  if (error) throw error;
  return data as Cliente[];
}

async function fetchProdutos(empresaId: string) {
  const { data, error } = await supabase
    .from('produtos')
    .select('id, codigo, nome, unidade, preco_venda, estoque_atual')
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
    .order('nome');
  if (error) throw error;
  return data as Produto[];
}

async function createPedido(pedido: Omit<Pedido, 'id' | 'created_at' | 'updated_at' | 'numero' | 'subtotal' | 'desconto' | 'total'> & { itens: Omit<PedidoItem, 'id' | 'pedido_id' | 'created_at'>[] }) {
  const { data: existing } = await supabase
    .from('pedidos')
    .select('numero')
    .eq('empresa_id', pedido.empresa_id)
    .order('numero', { ascending: false })
    .limit(1);

  const nextNumero = (existing?.[0]?.numero || 0) + 1;

  const subtotal = pedido.itens.reduce((sum, item) => sum + item.quantidade * item.preco_unitario, 0);
  const desconto = pedido.itens.reduce((sum, item) => sum + item.desconto, 0);
  const total = subtotal - desconto;

  const { data: novoPedido, error: pedidoError } = await supabase
    .from('pedidos')
    .insert([{
      ...pedido,
      numero: nextNumero,
      subtotal,
      desconto,
      total,
      status: 'rascunho',
    }])
    .select()
    .single();

  if (pedidoError) throw pedidoError;

  const itensComPedidoId = pedido.itens.map(item => ({
    ...item,
    pedido_id: novoPedido.id,
  }));

  const { error: itensError } = await supabase
    .from('pedido_itens')
    .insert(itensComPedidoId);

  if (itensError) throw itensError;

  return novoPedido;
}

async function updatePedido(id: string, pedido: Partial<Pedido>) {
  const { data, error } = await supabase
    .from('pedidos')
    .update({ ...pedido, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deletePedido(id: string) {
  const { error } = await supabase
    .from('pedidos')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

async function faturarPedido(pedidoId: string) {
  const { data, error } = await supabase.rpc('faturar_pedido', { p_pedido_id: pedidoId });
  if (error) throw error;
  return data;
}

export function VendasPedidos() {
  const { empresa, perfil } = useEmpresa();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'rascunho' | 'emitido' | 'faturado' | 'cancelado'>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);
  const [viewPedido, setViewPedido] = useState<Pedido | null>(null);
  const [faturarConfirm, setFaturarConfirm] = useState<Pedido | null>(null);
  const [faturarError, setFaturarError] = useState<string | null>(null);

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ['pedidos', empresa?.id, search, statusFilter],
    queryFn: () => fetchPedidos(empresa!.id, search, statusFilter),
    enabled: !!empresa?.id,
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-select', empresa?.id],
    queryFn: () => fetchClientes(empresa!.id),
    enabled: !!empresa?.id,
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos-select', empresa?.id],
    queryFn: () => fetchProdutos(empresa!.id),
    enabled: !!empresa?.id,
  });

  const createMutation = useMutation({
    mutationFn: createPedido,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      setModalOpen(false);
      setEditingPedido(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pedido> }) => updatePedido(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      setModalOpen(false);
      setEditingPedido(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePedido,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
  });

  const faturarMutation = useMutation({
    mutationFn: faturarPedido,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      setFaturarConfirm(null);
      setFaturarError(null);
    },
    onError: (error: Error) => {
      setFaturarError(error.message);
    },
  });

  const form = useForm<PedidoFormData>({
    resolver: zodResolver(pedidoSchema),
    defaultValues: {
      cliente_id: '',
      data_emissao: new Date().toISOString().split('T')[0],
      observacoes: '',
    },
  });

  const handleOpenModal = (pedido?: Pedido) => {
    if (pedido) {
      setEditingPedido(pedido);
      form.reset({
        cliente_id: pedido.cliente_id,
        data_emissao: pedido.data_emissao.split('T')[0],
        observacoes: pedido.observacoes || '',
      });
    } else {
      setEditingPedido(null);
      form.reset({
        cliente_id: '',
        data_emissao: new Date().toISOString().split('T')[0],
        observacoes: '',
      });
    }
    setModalOpen(true);
  };

  const handleView = (pedido: Pedido) => {
    setViewPedido(pedido);
  };

  const handleFaturar = (pedido: Pedido) => {
    setFaturarConfirm(pedido);
    setFaturarError(null);
  };

  const confirmFaturar = async () => {
    if (faturarConfirm) {
      await faturarMutation.mutateAsync(faturarConfirm.id);
    }
  };

  const canManage = perfil?.papel === 'administrador' || perfil?.papel === 'vendas';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos de Venda</h1>
          <p className="text-gray-500">Gerencie os pedidos de venda da empresa</p>
        </div>
        {canManage && (
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4" />
            Novo Pedido
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative max-w-md flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar por número ou cliente..."
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
            <option value="emitido">Emitido</option>
            <option value="faturado">Faturado</option>
            <option value="cancelado">Cancelado</option>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-2 text-gray-500">Carregando pedidos...</p>
            </div>
          ) : pedidos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Nenhum pedido encontrado</p>
              {canManage && (
                <Button variant="ghost" className="mt-2" onClick={() => handleOpenModal()}>
                  Criar primeiro pedido
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data Emissão</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Desconto</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidos.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell className="font-mono font-medium">#{pedido.numero.toString().padStart(6, '0')}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{pedido.cliente?.nome}</p>
                          <p className="text-xs text-gray-500">{pedido.cliente ? formatDocumento(pedido.cliente.documento, pedido.cliente.tipo_documento) : ''}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(pedido.data_emissao)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(pedido.subtotal)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(pedido.desconto)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(pedido.total)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_COLORS[pedido.status] || 'default'}>
                          {STATUS_LABELS[pedido.status] || pedido.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleView(pedido)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canManage && pedido.status === 'rascunho' && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleOpenModal(pedido)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleFaturar(pedido)}>
                                <Truck className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(pedido.id)}>
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          {canManage && pedido.status === 'emitido' && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleFaturar(pedido)}>
                                <Truck className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleFaturar(pedido)}>
                                <FileText className="w-4 h-4 text-blue-600" title="Gerar PDF" />
                              </Button>
                            </>
                          )}
                          {pedido.status === 'faturado' && (
                            <Button variant="ghost" size="icon">
                              <FileText className="w-4 h-4 text-blue-600" title="Visualizar PDF" />
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
        onClose={() => { setModalOpen(false); setEditingPedido(null); form.reset(); }}
        title={editingPedido ? 'Editar Pedido' : 'Novo Pedido'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setModalOpen(false); setEditingPedido(null); form.reset(); }}>
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
              <Label htmlFor="cliente_id">Cliente *</Label>
              <Select
                id="cliente_id"
                {...form.register('cliente_id')}
              >
                <option value="">Selecione um cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome} - {formatDocumento(cliente.documento, cliente.tipo_documento)}
                  </option>
                ))}
              </Select>
              {form.formState.errors.cliente_id && (
                <p className="text-sm text-red-600">{form.formState.errors.cliente_id.message}</p>
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
                placeholder="Observações do pedido"
              />
            </div>
          </div>

          {editingPedido && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Itens do Pedido</h4>
              <PedidoItensEditor
                pedidoId={editingPedido.id}
                produtos={produtos}
                itens={editingPedido.itens || []}
                onChange={() => queryClient.invalidateQueries({ queryKey: ['pedidos'] })}
              />
            </div>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={!!viewPedido}
        onClose={() => setViewPedido(null)}
        title={`Pedido #${viewPedido?.numero?.toString().padStart(6, '0')}`}
      >
        <PedidoDetalheView pedido={viewPedido!} onClose={() => setViewPedido(null)} />
      </Modal>

      <Modal
        isOpen={!!faturarConfirm}
        onClose={() => { setFaturarConfirm(null); setFaturarError(null); }}
        title="Confirmar Faturamento"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setFaturarConfirm(null); setFaturarError(null); }}>
              Cancelar
            </Button>
            <Button onClick={confirmFaturar} disabled={faturarMutation.isPending}>
              {faturarMutation.isPending ? 'Faturando...' : 'Confirmar Faturamento'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-gray-600">
            Confirma o faturamento do pedido <strong>#{faturarConfirm?.numero?.toString().padStart(6, '0')}</strong>
            do cliente <strong>{faturarConfirm?.cliente?.nome}</strong>?
          </p>
          <p className="text-sm text-gray-500">
            Isso irá: baixar o estoque dos itens, gerar títulos a receber e marcar o pedido como faturado.
          </p>
          {faturarError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {faturarError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function PedidoItensEditor({ pedidoId, produtos, itens, onChange }: {
  pedidoId: string;
  produtos: Produto[];
  itens: (PedidoItem & { produto?: Produto })[];
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
      preco_unitario: novoItem.preco_unitario || produto.preco_venda,
      desconto: novoItem.desconto,
      total: novoItem.quantidade * (novoItem.preco_unitario || produto.preco_venda) - novoItem.desconto,
      produto,
    };

    const { error } = await supabase
      .from('pedido_itens')
      .insert([{ ...item, pedido_id: pedidoId }]);

    if (!error) {
      setNovoItem({ produto_id: '', quantidade: 1, preco_unitario: 0, desconto: 0 });
      onChange();
    }
  };

  const removeItem = async (itemId: string) => {
    const { error } = await supabase
      .from('pedido_itens')
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
                preco_unitario: prod?.preco_venda || 0
              }));
            }}
          >
            <option value="">Selecione um produto</option>
            {produtos.map((prod) => (
              <option key={prod.id} value={prod.id}>
                {prod.codigo} - {prod.nome} ({formatCurrency(prod.preco_venda)}/{prod.unidade}) - Est: {prod.estoque_atual}
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

function PedidoDetalheView({ pedido, onClose }: { pedido: Pedido & { cliente: Cliente; itens: (PedidoItem & { produto: Produto })[] }; onClose: () => void }) {
  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-gray-500">Cliente</p>
          <p className="font-medium">{pedido.cliente?.nome}</p>
          <p className="text-sm text-gray-500">{pedido.cliente ? formatDocumento(pedido.cliente.documento, pedido.cliente.tipo_documento) : ''}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Data de Emissão</p>
          <p className="font-medium">{formatDate(pedido.data_emissao)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Status</p>
          <Badge variant={STATUS_COLORS[pedido.status] || 'default'}>
            {STATUS_LABELS[pedido.status] || pedido.status}
          </Badge>
        </div>
        <div>
          <p className="text-sm text-gray-500">Número</p>
          <p className="font-medium font-mono">#{pedido.numero.toString().padStart(6, '0')}</p>
        </div>
      </div>

      {pedido.observacoes && (
        <div>
          <p className="text-sm text-gray-500">Observações</p>
          <p>{pedido.observacoes}</p>
        </div>
      )}

      <div>
        <h4 className="font-medium mb-3">Itens do Pedido</h4>
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
              {pedido.itens.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.produto?.nome}</TableCell>
                  <TableCell className="text-center">{item.quantidade}</TableCell>
                  <TableCell>{item.produto?.unidade}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.preco_unitario)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.desconto)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex justify-end border-t pt-4">
        <div className="w-64 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatCurrency(pedido.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Desconto</span>
            <span>- {formatCurrency(pedido.desconto)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-bold text-lg">
            <span>Total</span>
            <span>{formatCurrency(pedido.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}