import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../shared/supabase';
import { useEmpresa } from '../../../shared/hooks';
import { Button, Input, Label, Select, Card, CardHeader, CardTitle, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal } from '../../../shared/ui';
import { Plus, Search, Filter, DollarSign, CreditCard, Calendar, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn, formatCurrency, formatDate, formatDocumento } from '../../../shared/utils';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Titulo, Cliente, Fornecedor } from '../../../shared/types';

const tituloSchema = z.object({
  tipo: z.enum(['pagar', 'receber']),
  documento_tipo: z.enum(['pedido', 'compra', 'avulso']),
  documento_id: z.string().optional(),
  cliente_fornecedor_id: z.string().optional(),
  parcela: z.coerce.number().min(1, 'Parcela deve ser maior que zero'),
  valor: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),
  data_emissao: z.string().min(1, 'Data de emissão é obrigatória'),
  data_vencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  observacoes: z.string().optional(),
});

type TituloFormData = z.infer<typeof tituloSchema>;

const TIPO_LABELS: Record<string, string> = {
  pagar: 'A Pagar',
  receber: 'A Receber',
};

const TIPO_COLORS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  pagar: 'danger',
  receber: 'success',
};

const STATUS_LABELS: Record<string, string> = {
  aberto: 'Aberto',
  parcial: 'Parcial',
  quitado: 'Quitado',
  cancelado: 'Cancelado',
  vencido: 'Vencido',
};

const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  aberto: 'default',
  parcial: 'warning',
  quitado: 'success',
  cancelado: 'danger',
  vencido: 'danger',
};

const FORMA_PAGAMENTO = ['dinheiro', 'pix', 'boleto', 'cartao', 'transferencia'];

async function fetchTitulos(empresaId: string, search: string, tipoFilter: string, statusFilter: string, vencimentoFilter: string) {
  let query = supabase
    .from('titulos')
    .select(`
      *,
      cliente:clientes(id, nome, documento, tipo_documento),
      fornecedor:fornecedores(id, nome, documento, tipo_documento),
      baixas:baixas_titulos(*)
    `)
    .eq('empresa_id', empresaId)
    .order('data_vencimento', { ascending: true });

  if (tipoFilter !== 'todos') {
    query = query.eq('tipo', tipoFilter);
  }

  if (statusFilter !== 'todos') {
    query = query.eq('status', statusFilter);
  }

  const today = new Date().toISOString().split('T')[0];
  if (vencimentoFilter === 'vencidos') {
    query = query.lt('data_vencimento', today).neq('status', 'quitado');
  } else if (vencimentoFilter === 'a_vencer') {
    query = query.gte('data_vencimento', today).neq('status', 'quitado');
  }

  if (search) {
    query = query.or(`cliente.nome.ilike.%${search}%,fornecedor.nome.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as (Titulo & { cliente: Cliente; fornecedor: Fornecedor; baixas: any[] })[];
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

async function createTitulo(titulo: Omit<Titulo, 'id' | 'created_at' | 'updated_at' | 'valor_aberto' | 'status'>) {
  const { data, error } = await supabase
    .from('titulos')
    .insert([{
      ...titulo,
      valor_aberto: titulo.valor,
      status: 'aberto',
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateTitulo(id: string, titulo: Partial<Titulo>) {
  const { data, error } = await supabase
    .from('titulos')
    .update({ ...titulo, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteTitulo(id: string) {
  const { error } = await supabase
    .from('titulos')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

async function baixarTitulo(tituloId: string, valor: number, data: string, forma_pagamento: string, observacoes?: string) {
  const { data: titulo, error: tituloError } = await supabase
    .from('titulos')
    .select('valor_aberto')
    .eq('id', tituloId)
    .single();

  if (tituloError) throw tituloError;
  if (valor > titulo.valor_aberto) throw new Error('Valor da baixa maior que o valor em aberto');

  const novoValorAberto = titulo.valor_aberto - valor;
  let novoStatus = 'parcial';
  if (novoValorAberto <= 0) novoStatus = 'quitado';

  const { error: baixaError } = await supabase
    .from('baixas_titulos')
    .insert([{
      titulo_id: tituloId,
      valor,
      data,
      forma_pagamento,
      observacoes,
    }]);

  if (baixaError) throw baixaError;

  const { error: updateError } = await supabase
    .from('titulos')
    .update({
      valor_aberto: Math.max(0, novoValorAberto),
      status: novoStatus,
      data_baixa: novoStatus === 'quitado' ? data : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tituloId);

  if (updateError) throw updateError;
}

export function FinanceiroTitulos() {
  const { empresa, perfil } = useEmpresa();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'pagar' | 'receber'>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'aberto' | 'parcial' | 'quitado' | 'cancelado' | 'vencido'>('todos');
  const [vencimentoFilter, setVencimentoFilter] = useState<'todos' | 'vencidos' | 'a_vencer'>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTitulo, setEditingTitulo] = useState<Titulo | null>(null);
  const [viewTitulo, setViewTitulo] = useState<Titulo | null>(null);
  const [baixaModalOpen, setBaixaModalOpen] = useState(false);
  const [baixaTitulo, setBaixaTitulo] = useState<Titulo | null>(null);
  const [baixaError, setBaixaError] = useState<string | null>(null);

  const { data: titulos = [], isLoading } = useQuery({
    queryKey: ['titulos', empresa?.id, search, tipoFilter, statusFilter, vencimentoFilter],
    queryFn: () => fetchTitulos(empresa!.id, search, tipoFilter, statusFilter, vencimentoFilter),
    enabled: !!empresa?.id,
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-select-fin', empresa?.id],
    queryFn: () => fetchClientes(empresa!.id),
    enabled: !!empresa?.id,
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['fornecedores-select-fin', empresa?.id],
    queryFn: () => fetchFornecedores(empresa!.id),
    enabled: !!empresa?.id,
  });

  const createMutation = useMutation({
    mutationFn: createTitulo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['titulos'] });
      setModalOpen(false);
      setEditingTitulo(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Titulo> }) => updateTitulo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['titulos'] });
      setModalOpen(false);
      setEditingTitulo(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTitulo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['titulos'] });
    },
  });

  const baixaMutation = useMutation({
    mutationFn: ({ tituloId, valor, data, forma_pagamento, observacoes }: {
      tituloId: string;
      valor: number;
      data: string;
      forma_pagamento: string;
      observacoes?: string;
    }) => baixarTitulo(tituloId, valor, data, forma_pagamento, observacoes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['titulos'] });
      setBaixaModalOpen(false);
      setBaixaTitulo(null);
      setBaixaError(null);
    },
    onError: (error: Error) => {
      setBaixaError(error.message);
    },
  });

  const form = useForm<TituloFormData>({
    resolver: zodResolver(tituloSchema),
    defaultValues: {
      tipo: 'receber',
      documento_tipo: 'avulso',
      documento_id: '',
      cliente_fornecedor_id: '',
      parcela: 1,
      valor: 0,
      data_emissao: new Date().toISOString().split('T')[0],
      data_vencimento: new Date().toISOString().split('T')[0],
      observacoes: '',
    },
  });

  const baixaForm = useForm<{ valor: number; data: string; forma_pagamento: string; observacoes: string }>({
    defaultValues: {
      valor: 0,
      data: new Date().toISOString().split('T')[0],
      forma_pagamento: 'pix',
      observacoes: '',
    },
  });

  const handleOpenModal = (titulo?: Titulo) => {
    if (titulo) {
      setEditingTitulo(titulo);
      form.reset({
        tipo: titulo.tipo,
        documento_tipo: titulo.documento_tipo,
        documento_id: titulo.documento_id || '',
        cliente_fornecedor_id: titulo.tipo === 'receber' ? titulo.cliente?.id || '' : titulo.fornecedor?.id || '',
        parcela: titulo.parcela,
        valor: titulo.valor,
        data_emissao: titulo.data_emissao.split('T')[0],
        data_vencimento: titulo.data_vencimento.split('T')[0],
        observacoes: titulo.observacoes || '',
      });
    } else {
      setEditingTitulo(null);
      form.reset({
        tipo: 'receber',
        documento_tipo: 'avulso',
        documento_id: '',
        cliente_fornecedor_id: '',
        parcela: 1,
        valor: 0,
        data_emissao: new Date().toISOString().split('T')[0],
        data_vencimento: new Date().toISOString().split('T')[0],
        observacoes: '',
      });
    }
    setModalOpen(true);
  };

  const handleView = (titulo: Titulo) => {
    setViewTitulo(titulo);
  };

  const handleBaixa = (titulo: Titulo) => {
    setBaixaTitulo(titulo);
    baixaForm.reset({
      valor: titulo.valor_aberto,
      data: new Date().toISOString().split('T')[0],
      forma_pagamento: 'pix',
      observacoes: '',
    });
    setBaixaModalOpen(true);
    setBaixaError(null);
  };

  const onSubmit = async (data: TituloFormData) => {
    const tituloData = {
      ...data,
      empresa_id: empresa!.id,
    };
    if (editingTitulo) {
      updateMutation.mutate({ id: editingTitulo.id, data: tituloData });
    } else {
      createMutation.mutate(tituloData);
    }
  };

  const onBaixaSubmit = async (data: { valor: number; data: string; forma_pagamento: string; observacoes: string }) => {
    if (baixaTitulo) {
      baixaMutation.mutate({
        tituloId: baixaTitulo.id,
        valor: data.valor,
        data: data.data,
        forma_pagamento: data.forma_pagamento,
        observacoes: data.observacoes,
      });
    }
  };

  const canManage = perfil?.papel === 'administrador' || perfil?.papel === 'financeiro';

  const totalReceber = titulos
    .filter(t => t.tipo === 'receber' && t.status !== 'quitado' && t.status !== 'cancelado')
    .reduce((sum, t) => sum + t.valor_aberto, 0);

  const totalPagar = titulos
    .filter(t => t.tipo === 'pagar' && t.status !== 'quitado' && t.status !== 'cancelado')
    .reduce((sum, t) => sum + t.valor_aberto, 0);

  const vencidos = titulos.filter(t =>
    t.status !== 'quitado' && t.status !== 'cancelado' &&
    new Date(t.data_vencimento) < new Date() &&
    new Date(t.data_vencimento).toISOString().split('T')[0] !== new Date().toISOString().split('T')[0]
  );

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Títulos a Pagar e Receber</h1>
            <p className="text-gray-500">Gerencie as contas da empresa</p>
          </div>
          {canManage && (
            <Button onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4" />
              Novo Título
            </Button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Total a Receber</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(totalReceber)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">Total a Pagar</p>
                  <p className="text-2xl font-bold text-red-900">{formatCurrency(totalPagar)}</p>
                </div>
                <CreditCard className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700">Títulos Vencidos</p>
                  <p className="text-2xl font-bold text-yellow-900">{vencidos.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative max-w-md flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar por cliente/fornecedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Select
            value={tipoFilter}
            onValueChange={(value) => setTipoFilter(value as typeof tipoFilter)}
            className="pl-10 w-[160px]"
          >
            <option value="todos">Todos</option>
            <option value="receber">A Receber</option>
            <option value="pagar">A Pagar</option>
          </Select>
        </div>
        <div className="relative">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
            className="w-[160px]"
          >
            <option value="todos">Todos os status</option>
            <option value="aberto">Aberto</option>
            <option value="parcial">Parcial</option>
            <option value="quitado">Quitado</option>
            <option value="vencido">Vencido</option>
            <option value="cancelado">Cancelado</option>
          </Select>
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Select
            value={vencimentoFilter}
            onValueChange={(value) => setVencimentoFilter(value as typeof vencimentoFilter)}
            className="pl-10 w-[160px]"
          >
            <option value="todos">Todos os vencimentos</option>
            <option value="vencidos">Vencidos</option>
            <option value="a_vencer">A vencer</option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-2 text-gray-500">Carregando títulos...</p>
            </div>
          ) : titulos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p>Nenhum título encontrado</p>
              {canManage && (
                <Button variant="ghost" className="mt-2" onClick={() => handleOpenModal()}>
                  Criar primeiro título
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cliente/Fornecedor</TableHead>
                    <TableHead>Parcela</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Em Aberto</TableHead>
                    <TableHead>Emissão</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {titulos.map((titulo) => {
                    const isVencido = titulo.status !== 'quitado' && titulo.status !== 'cancelado' &&
                      new Date(titulo.data_vencimento) < new Date() &&
                      new Date(titulo.data_vencimento).toISOString().split('T')[0] !== new Date().toISOString().split('T')[0];
                    const displayStatus = isVencido ? 'vencido' : titulo.status;

                    return (
                      <TableRow key={titulo.id} className={isVencido ? 'bg-red-50' : ''}>
                        <TableCell>
                          <Badge variant={TIPO_COLORS[titulo.tipo]}>
                            {TIPO_LABELS[titulo.tipo]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {titulo.tipo === 'receber' ? titulo.cliente?.nome : titulo.fornecedor?.nome}
                            </p>
                            <p className="text-xs text-gray-500">
                              {titulo.tipo === 'receber' && titulo.cliente
                                ? formatDocumento(titulo.cliente.documento, titulo.cliente.tipo_documento)
                                : titulo.fornecedor
                                ? formatDocumento(titulo.fornecedor.documento, titulo.fornecedor.tipo_documento)
                                : ''}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{titulo.parcela}</TableCell>
                        <TableCell className="text-right">{formatCurrency(titulo.valor)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(titulo.valor_aberto)}
                        </TableCell>
                        <TableCell>{formatDate(titulo.data_emissao)}</TableCell>
                        <TableCell className={isVencido ? 'text-red-600 font-medium' : ''}>
                          {formatDate(titulo.data_vencimento)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_COLORS[displayStatus] || 'default'}>
                            {STATUS_LABELS[displayStatus] || displayStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleView(titulo)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {canManage && titulo.status !== 'quitado' && titulo.status !== 'cancelado' && (
                              <Button variant="ghost" size="icon" onClick={() => handleBaixa(titulo)}>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </Button>
                            )}
                            {canManage && titulo.status === 'aberto' && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => handleOpenModal(titulo)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(titulo.id)}>
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Form */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTitulo(null); form.reset(); }}
        title={editingTitulo ? 'Editar Título' : 'Novo Título'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setModalOpen(false); setEditingTitulo(null); form.reset(); }}>
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
              <Label htmlFor="tipo">Tipo *</Label>
              <Select
                id="tipo"
                {...form.register('tipo')}
                onValueChange={(value) => form.setValue('tipo', value as 'pagar' | 'receber')}
              >
                <option value="receber">A Receber</option>
                <option value="pagar">A Pagar</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documento_tipo">Origem</Label>
              <Select
                id="documento_tipo"
                {...form.register('documento_tipo')}
              >
                <option value="avulso">Avulso</option>
                <option value="pedido">Pedido de Venda</option>
                <option value="compra">Pedido de Compra</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente_fornecedor_id">
                {form.watch('tipo') === 'receber' ? 'Cliente' : 'Fornecedor'}
              </Label>
              <Select
                id="cliente_fornecedor_id"
                {...form.register('cliente_fornecedor_id')}
              >
                <option value="">Selecione</option>
                {form.watch('tipo') === 'receber'
                  ? clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} - {formatDocumento(c.documento, c.tipo_documento)}
                      </option>
                    ))
                  : fornecedores.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome} - {formatDocumento(f.documento, f.tipo_documento)}
                      </option>
                    ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parcela">Parcela *</Label>
              <Input
                id="parcela"
                type="number"
                min="1"
                {...form.register('parcela', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0.01"
                {...form.register('valor', { valueAsNumber: true })}
              />
              {form.formState.errors.valor && (
                <p className="text-sm text-red-600">{form.formState.errors.valor.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_emissao">Data de Emissão *</Label>
              <Input
                id="data_emissao"
                type="date"
                {...form.register('data_emissao')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
              <Input
                id="data_vencimento"
                type="date"
                {...form.register('data_vencimento')}
              />
              {form.formState.errors.data_vencimento && (
                <p className="text-sm text-red-600">{form.formState.errors.data_vencimento.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Input
                id="observacoes"
                {...form.register('observacoes')}
                placeholder="Observações do título"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={!!viewTitulo}
        onClose={() => setViewTitulo(null)}
        title={`Título ${viewTitulo?.tipo === 'receber' ? 'a Receber' : 'a Pagar'}`}
      >
        <TituloDetalheView titulo={viewTitulo!} onClose={() => setViewTitulo(null)} />
      </Modal>

      {/* Baixa Modal */}
      <Modal
        isOpen={baixaModalOpen}
        onClose={() => { setBaixaModalOpen(false); setBaixaTitulo(null); setBaixaError(null); }}
        title={`Baixa de Título - ${baixaTitulo?.tipo === 'receber' ? 'Recebimento' : 'Pagamento'}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setBaixaModalOpen(false); setBaixaTitulo(null); setBaixaError(null); }}>
              Cancelar
            </Button>
            <Button onClick={() => baixaForm.handleSubmit(onBaixaSubmit)()} disabled={baixaMutation.isPending}>
              {baixaMutation.isPending ? 'Processando...' : 'Confirmar Baixa'}
            </Button>
          </div>
        }
      >
        <form onSubmit={baixaForm.handleSubmit(onBaixaSubmit)} className="space-y-4">
          {baixaTitulo && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>{baixaTitulo.tipo === 'receber' ? baixaTitulo.cliente?.nome : baixaTitulo.fornecedor?.nome}</strong> -
                Parcela {baixaTitulo.parcela} -
                Valor total: {formatCurrency(baixaTitulo.valor)} -
                Em aberto: <strong className="text-green-600">{formatCurrency(baixaTitulo.valor_aberto)}</strong>
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="baixa_valor">Valor da Baixa *</Label>
              <Input
                id="baixa_valor"
                type="number"
                step="0.01"
                min="0.01"
                max={baixaTitulo?.valor_aberto}
                {...baixaForm.register('valor', { valueAsNumber: true })}
              />
              {baixaForm.formState.errors.valor && (
                <p className="text-sm text-red-600">{baixaForm.formState.errors.valor.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="baixa_data">Data *</Label>
              <Input
                id="baixa_data"
                type="date"
                {...baixaForm.register('data')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baixa_forma">Forma de Pagamento *</Label>
              <Select
                id="baixa_forma"
                {...baixaForm.register('forma_pagamento')}
              >
                {FORMA_PAGAMENTO.map((f) => (
                  <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="baixa_obs">Observações</Label>
              <Input
                id="baixa_obs"
                {...baixaForm.register('observacoes')}
                placeholder="Observações da baixa"
              />
            </div>
          </div>

          {baixaError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md flex items-start gap-2">
              <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{baixaError}</span>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}

function TituloDetalheView({ titulo, onClose }: { titulo: Titulo & { cliente: Cliente; fornecedor: Fornecedor; baixas: any[] }; onClose: () => void }) {
  const isVencido = titulo.status !== 'quitado' && titulo.status !== 'cancelado' &&
    new Date(titulo.data_vencimento) < new Date();
  const displayStatus = isVencido ? 'vencido' : titulo.status;

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-gray-500">Tipo</p>
          <Badge variant={TIPO_COLORS[titulo.tipo]}>{TIPO_LABELS[titulo.tipo]}</Badge>
        </div>
        <div>
          <p className="text-sm text-gray-500">Status</p>
          <Badge variant={STATUS_COLORS[displayStatus] || 'default'}>{STATUS_LABELS[displayStatus] || displayStatus}</Badge>
        </div>
        <div>
          <p className="text-sm text-gray-500">{titulo.tipo === 'receber' ? 'Cliente' : 'Fornecedor'}</p>
          <p className="font-medium">{titulo.tipo === 'receber' ? titulo.cliente?.nome : titulo.fornecedor?.nome}</p>
          <p className="text-sm text-gray-500">
            {titulo.tipo === 'receber' && titulo.cliente
              ? formatDocumento(titulo.cliente.documento, titulo.cliente.tipo_documento)
              : titulo.fornecedor
              ? formatDocumento(titulo.fornecedor.documento, titulo.fornecedor.tipo_documento)
              : ''}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Parcela</p>
          <p className="font-medium">{titulo.parcela}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Valor Total</p>
          <p className="font-medium">{formatCurrency(titulo.valor)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Valor em Aberto</p>
          <p className="font-medium text-green-600">{formatCurrency(titulo.valor_aberto)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Data de Emissão</p>
          <p className="font-medium">{formatDate(titulo.data_emissao)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Data de Vencimento</p>
          <p className={isVencido ? 'font-medium text-red-600' : 'font-medium'}>{formatDate(titulo.data_vencimento)}</p>
        </div>
      </div>

      {titulo.observacoes && (
        <div>
          <p className="text-sm text-gray-500">Observações</p>
          <p>{titulo.observacoes}</p>
        </div>
      )}

      {titulo.baixas && titulo.baixas.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Histórico de Baixas</h4>
          <div className="space-y-2">
            {titulo.baixas.map((baixa) => (
              <div key={baixa.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{formatCurrency(baixa.valor)}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(baixa.data)} - {baixa.forma_pagamento}
                  </p>
                </div>
                {baixa.observacoes && <p className="text-sm text-gray-500">{baixa.observacoes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { Eye, Edit, Trash2, CheckCircle, XCircle, Calendar, DollarSign, CreditCard, Search, Filter, Plus } from 'lucide-react';