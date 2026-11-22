import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../shared/supabase';
import { useEmpresa } from '../../../shared/hooks';
import { Button, Input, Label, Select, Card, CardHeader, CardTitle, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal } from '../../../shared/ui';
import { Plus, Search, Filter, AlertTriangle, Warehouse, ArrowUp, ArrowDown, Minus, RotateCcw } from 'lucide-react';
import { cn, formatCurrency, formatDate, formatDateTime } from '../../../shared/utils';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { EstoqueMovimento, Produto } from '../../../shared/types';

const movimentoSchema = z.object({
  produto_id: z.string().min(1, 'Produto é obrigatório'),
  tipo: z.enum(['entrada', 'saida', 'ajuste', 'devolucao']),
  quantidade: z.coerce.number().min(1, 'Quantidade deve ser maior que zero'),
  custo_unitario: z.coerce.number().min(0, 'Custo deve ser positivo'),
  documento_tipo: z.enum(['pedido', 'compra', 'ajuste']).optional(),
  documento_id: z.string().optional(),
  observacoes: z.string().optional(),
});

type MovimentoFormData = z.infer<typeof movimentoSchema>;

const TIPO_LABELS: Record<string, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste: 'Ajuste',
  devolucao: 'Devolução',
};

const TIPO_ICONS: Record<string, React.ReactNode> = {
  entrada: <ArrowUp className="w-4 h-4 text-green-600" />,
  saida: <ArrowDown className="w-4 h-4 text-red-600" />,
  ajuste: <RotateCcw className="w-4 h-4 text-blue-600" />,
  devolucao: <Minus className="w-4 h-4 text-orange-600" />,
};

const TIPO_COLORS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  entrada: 'success',
  saida: 'danger',
  ajuste: 'info',
  devolucao: 'warning',
};

async function fetchMovimentos(empresaId: string, search: string, tipoFilter: string, produtoFilter: string) {
  let query = supabase
    .from('estoque_movimentos')
    .select(`
      *,
      produto:produtos(id, codigo, nome, unidade, estoque_atual, estoque_minimo)
    `)
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false });

  if (tipoFilter !== 'todos') {
    query = query.eq('tipo', tipoFilter);
  }

  if (produtoFilter) {
    query = query.eq('produto_id', produtoFilter);
  }

  if (search) {
    query = query.or(`produto.nome.ilike.%${search}%,produto.codigo.ilike.%${search}%,observacoes.ilike.%${search}%`);
  }

  const { data, error } = await query.limit(100);
  if (error) throw error;
  return data as (EstoqueMovimento & { produto: Produto })[];
}

async function fetchProdutos(empresaId: string) {
  const { data, error } = await supabase
    .from('produtos')
    .select('id, codigo, nome, unidade, estoque_atual, estoque_minimo, preco_custo')
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
    .order('nome');
  if (error) throw error;
  return data as Produto[];
}

async function createMovimento(movimento: Omit<EstoqueMovimento, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('estoque_movimentos')
    .insert([movimento])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function fetchAlertasEstoque(empresaId: string) {
  const { data, error } = await supabase.rpc('alertas_estoque_minimo', { p_empresa_id: empresaId });
  if (error) throw error;
  return data;
}

export function EstoqueMovimentos() {
  const { empresa, perfil } = useEmpresa();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'entrada' | 'saida' | 'ajuste' | 'devolucao'>('todos');
  const [produtoFilter, setProdutoFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMovimento, setEditingMovimento] = useState<EstoqueMovimento | null>(null);
  const [viewAlertas, setViewAlertas] = useState(false);

  const { data: movimentos = [], isLoading } = useQuery({
    queryKey: ['movimentos', empresa?.id, search, tipoFilter, produtoFilter],
    queryFn: () => fetchMovimentos(empresa!.id, search, tipoFilter, produtoFilter),
    enabled: !!empresa?.id,
  });

  const { data: produtos = [] } = useQuery({
    queryKey: ['produtos-select-estoque', empresa?.id],
    queryFn: () => fetchProdutos(empresa!.id),
    enabled: !!empresa?.id,
  });

  const { data: alertas = [] } = useQuery({
    queryKey: ['alertas-estoque', empresa?.id],
    queryFn: () => fetchAlertasEstoque(empresa!.id),
    enabled: !!empresa?.id,
  });

  const createMutation = useMutation({
    mutationFn: createMovimento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimentos'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-estoque'] });
      setModalOpen(false);
    },
  });

  const form = useForm<MovimentoFormData>({
    resolver: zodResolver(movimentoSchema),
    defaultValues: {
      produto_id: '',
      tipo: 'ajuste',
      quantidade: 1,
      custo_unitario: 0,
      documento_tipo: 'ajuste',
      documento_id: '',
      observacoes: '',
    },
  });

  const handleOpenModal = (movimento?: EstoqueMovimento) => {
    if (movimento) {
      setEditingMovimento(movimento);
      form.reset({
        produto_id: movimento.produto_id,
        tipo: movimento.tipo,
        quantidade: movimento.quantidade,
        custo_unitario: movimento.custo_unitario,
        documento_tipo: movimento.documento_tipo || 'ajuste',
        documento_id: movimento.documento_id || '',
        observacoes: movimento.observacoes || '',
      });
    } else {
      setEditingMovimento(null);
      form.reset({
        produto_id: '',
        tipo: 'ajuste',
        quantidade: 1,
        custo_unitario: 0,
        documento_tipo: 'ajuste',
        documento_id: '',
        observacoes: '',
      });
    }
    setModalOpen(true);
  };

  const onSubmit = async (data: MovimentoFormData) => {
    const produto = produtos.find(p => p.id === data.produto_id);
    if (!produto) return;

    const movimentoData = {
      ...data,
      empresa_id: empresa!.id,
      custo_unitario: data.custo_unitario || produto.preco_custo,
    };

    createMutation.mutate(movimentoData);
  };

  const canManage = perfil?.papel === 'administrador' || perfil?.papel === 'estoque';

  const lowStockProducts = produtos.filter(p => p.estoque_atual <= p.estoque_minimo);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movimentação de Estoque</h1>
          <p className="text-gray-500">Gerencie entradas, saídas e ajustes de estoque</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage && (
            <Button onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4" />
              Nova Movimentação
            </Button>
          )}
          {lowStockProducts.length > 0 && (
            <Button variant="outline" onClick={() => setViewAlertas(true)}>
              <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />
              Alertas de Estoque ({lowStockProducts.length})
            </Button>
          )}
        </div>
      </div>

      {/* Alertas de Estoque Baixo */}
      {(lowStockProducts.length > 0 || viewAlertas) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Produtos com Estoque Abaixo do Mínimo
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setViewAlertas(!viewAlertas)}>
              {viewAlertas ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
          </CardHeader>
          {viewAlertas && (
            <CardContent>
              <div className="space-y-2">
                {lowStockProducts.map((produto) => (
                  <div key={produto.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <Warehouse className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium">{produto.nome}</p>
                        <p className="text-sm text-gray-500">Código: {produto.codigo} | Unidade: {produto.unidade}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">Atual: {produto.estoque_atual} {produto.unidade}</p>
                      <p className="text-sm text-gray-500">Mínimo: {produto.estoque_minimo} {produto.unidade}</p>
                    </div>
                  </div>
                ))}
                {lowStockProducts.length === 0 && (
                  <p className="text-center text-gray-500 py-4">Nenhum produto com estoque baixo</p>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative max-w-md flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar por produto, código ou observação..."
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
            <option value="todos">Todos os tipos</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
            <option value="ajuste">Ajuste</option>
            <option value="devolucao">Devolução</option>
          </Select>
        </div>
        <div className="relative">
          <Select
            value={produtoFilter}
            onValueChange={(value) => setProdutoFilter(value)}
            className="w-[200px]"
          >
            <option value="">Todos os produtos</option>
            {produtos.map((prod) => (
              <option key={prod.id} value={prod.id}>
                {prod.codigo} - {prod.nome}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-2 text-gray-500">Carregando movimentos...</p>
            </div>
          ) : movimentos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Warehouse className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p>Nenhuma movimentação encontrada</p>
              {canManage && (
                <Button variant="ghost" className="mt-2" onClick={() => handleOpenModal()}>
                  Criar primeira movimentação
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead>Un.</TableHead>
                    <TableHead className="text-right">Custo Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimentos.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell className="text-sm">{formatDateTime(mov.created_at)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{mov.produto?.nome}</p>
                          <p className="text-xs text-gray-500 font-mono">{mov.produto?.codigo}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={TIPO_COLORS[mov.tipo] || 'default'} className="flex items-center gap-1">
                          {TIPO_ICONS[mov.tipo]}
                          {TIPO_LABELS[mov.tipo]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {mov.tipo === 'saida' || mov.tipo === 'devolucao' ? '-' : '+'}{mov.quantidade}
                      </TableCell>
                      <TableCell>{mov.produto?.unidade}</TableCell>
                      <TableCell className="text-right">{formatCurrency(mov.custo_unitario)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(mov.quantidade * mov.custo_unitario)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {mov.documento_tipo && mov.documento_id && (
                          <span className="font-mono">#{mov.documento_id.slice(-6)}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">
                        {mov.observacoes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Form */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingMovimento(null); form.reset(); }}
        title={editingMovimento ? 'Editar Movimentação' : 'Nova Movimentação'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setModalOpen(false); setEditingMovimento(null); form.reset(); }}>
              Cancelar
            </Button>
            <Button onClick={() => form.handleSubmit(onSubmit)()} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        }
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="produto_id">Produto *</Label>
              <Select
                id="produto_id"
                {...form.register('produto_id')}
                onValueChange={(value) => {
                  const prod = produtos.find(p => p.id === value);
                  if (prod) {
                    form.setValue('custo_unitario', prod.preco_custo);
                  }
                }}
              >
                <option value="">Selecione um produto</option>
                {produtos.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.codigo} - {prod.nome} (Est: {prod.estoque_atual} {prod.unidade})
                  </option>
                ))}
              </Select>
              {form.formState.errors.produto_id && (
                <p className="text-sm text-red-600">{form.formState.errors.produto_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select
                id="tipo"
                {...form.register('tipo')}
              >
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
                <option value="ajuste">Ajuste</option>
                <option value="devolucao">Devolução</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade *</Label>
              <Input
                id="quantidade"
                type="number"
                step="1"
                min="1"
                {...form.register('quantidade', { valueAsNumber: true })}
              />
              {form.formState.errors.quantidade && (
                <p className="text-sm text-red-600">{form.formState.errors.quantidade.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="custo_unitario">Custo Unitário</Label>
              <Input
                id="custo_unitario"
                type="number"
                step="0.01"
                min="0"
                {...form.register('custo_unitario', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documento_tipo">Documento de Origem</Label>
              <Select
                id="documento_tipo"
                {...form.register('documento_tipo')}
              >
                <option value="ajuste">Ajuste Manual</option>
                <option value="pedido">Pedido de Venda</option>
                <option value="compra">Pedido de Compra</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documento_id">ID do Documento</Label>
              <Input
                id="documento_id"
                {...form.register('documento_id')}
                placeholder="ID do documento relacionado"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Input
                id="observacoes"
                {...form.register('observacoes')}
                placeholder="Motivo da movimentação"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Import ChevronUp/Down
import { ChevronUp, ChevronDown } from 'lucide-react';