import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../shared/supabase';
import { useEmpresa } from '../../../shared/hooks';
import { Button, Input, Label, Select, Card, CardHeader, CardTitle, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal } from '../../../shared/ui';
import { Plus, Search, Edit, Trash2, Eye, AlertTriangle, Package } from 'lucide-react';
import { cn, formatCurrency, formatDocumento } from '../../../shared/utils';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Produto } from '../../../shared/types';

const produtoSchema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório'),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().optional(),
  ncm: z.string().length(8, 'NCM deve ter 8 dígitos').optional().or(z.literal('')),
  cfop_padrao: z.string().optional(),
  unidade: z.string().min(1, 'Unidade é obrigatória'),
  preco_custo: z.coerce.number().min(0, 'Preço de custo deve ser positivo'),
  preco_venda: z.coerce.number().min(0, 'Preço de venda deve ser positivo'),
  estoque_minimo: z.coerce.number().min(0, 'Estoque mínimo deve ser positivo'),
  ativo: z.boolean().default(true),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

const UNIDADES = ['UN', 'KG', 'M', 'M2', 'M3', 'L', 'CX', 'PC', 'DZ', 'PAR'];

async function fetchProdutos(empresaId: string, search: string) {
  let query = supabase
    .from('produtos')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('nome');

  if (search) {
    query = query.or(`nome.ilike.%${search}%,codigo.ilike.%${search}%,descricao.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Produto[];
}

async function createProduto(produto: Omit<Produto, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('produtos')
    .insert([{ ...produto, estoque_atual: 0 }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateProduto(id: string, produto: Partial<Produto>) {
  const { data, error } = await supabase
    .from('produtos')
    .update({ ...produto, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteProduto(id: string) {
  const { error } = await supabase
    .from('produtos')
    .update({ ativo: false, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export function CadastrosProdutos() {
  const { empresa, perfil } = useEmpresa();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Produto | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ['produtos', empresa?.id, search, showLowStock],
    queryFn: () => fetchProdutos(empresa!.id, search),
    enabled: !!empresa?.id,
  });

  const filteredProdutos = showLowStock
    ? produtos.filter(p => p.estoque_atual <= p.estoque_minimo)
    : produtos;

  const createMutation = useMutation({
    mutationFn: createProduto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      setModalOpen(false);
      setEditingProduto(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Produto> }) => updateProduto(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      setModalOpen(false);
      setEditingProduto(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      setDeleteConfirm(null);
    },
  });

  const form = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      codigo: '',
      nome: '',
      descricao: '',
      ncm: '',
      cfop_padrao: '',
      unidade: 'UN',
      preco_custo: 0,
      preco_venda: 0,
      estoque_minimo: 0,
      ativo: true,
    },
  });

  const handleOpenModal = (produto?: Produto) => {
    if (produto) {
      setEditingProduto(produto);
      form.reset({
        codigo: produto.codigo,
        nome: produto.nome,
        descricao: produto.descricao || '',
        ncm: produto.ncm || '',
        cfop_padrao: produto.cfop_padrao || '',
        unidade: produto.unidade,
        preco_custo: produto.preco_custo,
        preco_venda: produto.preco_venda,
        estoque_minimo: produto.estoque_minimo,
        ativo: produto.ativo,
      });
    } else {
      setEditingProduto(null);
      form.reset({
        codigo: '',
        nome: '',
        descricao: '',
        ncm: '',
        cfop_padrao: '',
        unidade: 'UN',
        preco_custo: 0,
        preco_venda: 0,
        estoque_minimo: 0,
        ativo: true,
      });
    }
    setModalOpen(true);
  };

  const onSubmit = async (data: ProdutoFormData) => {
    const produtoData = {
      ...data,
      empresa_id: empresa!.id,
    };

    if (editingProduto) {
      updateMutation.mutate({ id: editingProduto.id, data: produtoData });
    } else {
      createMutation.mutate(produtoData);
    }
  };

  const handleDelete = (produto: Produto) => {
    setDeleteConfirm(produto);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id);
    }
  };

  const canManage = perfil?.papel === 'administrador' || perfil?.papel === 'estoque';

  const lowStockCount = produtos.filter(p => p.estoque_atual <= p.estoque_minimo && p.ativo).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-500">Gerencie os produtos e estoque da empresa</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage && (
            <Button onClick={() => handleOpenModal()}>
              <Plus className="w-4 h-4" />
              Novo Produto
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowLowStock(!showLowStock)}>
            <AlertTriangle className={cn('w-4 h-4 mr-2', showLowStock ? 'text-yellow-600' : 'text-gray-400')} />
            {showLowStock ? 'Todos' : `Estoque Baixo (${lowStockCount})`}
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Buscar por código, nome ou descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-2 text-gray-500">Carregando produtos...</p>
            </div>
          ) : filteredProdutos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p>{showLowStock ? 'Nenhum produto com estoque baixo' : 'Nenhum produto encontrado'}</p>
              {canManage && !showLowStock && (
                <Button variant="ghost" className="mt-2" onClick={() => handleOpenModal()}>
                  Cadastrar primeiro produto
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Venda</TableHead>
                    <TableHead className="text-center">Estoque</TableHead>
                    <TableHead className="text-center">Mínimo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProdutos.map((produto) => {
                    const isLowStock = produto.estoque_atual <= produto.estoque_minimo && produto.ativo;
                    return (
                      <TableRow key={produto.id} className={isLowStock ? 'bg-yellow-50' : ''}>
                        <TableCell className="font-mono text-sm">{produto.codigo}</TableCell>
                        <TableCell className="font-medium">{produto.nome}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{produto.unidade}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(produto.preco_custo)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(produto.preco_venda)}</TableCell>
                        <TableCell className={cn('text-center font-medium', isLowStock ? 'text-red-600' : 'text-gray-900')}>
                          {produto.estoque_atual}
                        </TableCell>
                        <TableCell className="text-center text-sm text-gray-500">{produto.estoque_minimo}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenModal(produto)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {canManage && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => handleOpenModal(produto)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(produto)}>
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingProduto(null); form.reset(); }}
        title={editingProduto ? 'Editar Produto' : 'Novo Produto'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setModalOpen(false); setEditingProduto(null); form.reset(); }}>
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
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                {...form.register('codigo')}
                placeholder="Ex: PROD-001"
              />
              {form.formState.errors.codigo && (
                <p className="text-sm text-red-600">{form.formState.errors.codigo.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                {...form.register('nome')}
                placeholder="Nome do produto"
              />
              {form.formState.errors.nome && (
                <p className="text-sm text-red-600">{form.formState.errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                {...form.register('descricao')}
                placeholder="Descrição do produto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ncm">NCM</Label>
              <Input
                id="ncm"
                {...form.register('ncm')}
                placeholder="00000000"
                maxLength={8}
              />
              {form.formState.errors.ncm && (
                <p className="text-sm text-red-600">{form.formState.errors.ncm.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cfop_padrao">CFOP Padrão</Label>
              <Input
                id="cfop_padrao"
                {...form.register('cfop_padrao')}
                placeholder="Ex: 5102"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade *</Label>
              <Select
                id="unidade"
                {...form.register('unidade')}
              >
                {UNIDADES.map((un) => (
                  <option key={un} value={un}>{un}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco_custo">Preço de Custo *</Label>
              <Input
                id="preco_custo"
                type="number"
                step="0.01"
                min="0"
                {...form.register('preco_custo', { valueAsNumber: true })}
                placeholder="0,00"
              />
              {form.formState.errors.preco_custo && (
                <p className="text-sm text-red-600">{form.formState.errors.preco_custo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco_venda">Preço de Venda *</Label>
              <Input
                id="preco_venda"
                type="number"
                step="0.01"
                min="0"
                {...form.register('preco_venda', { valueAsNumber: true })}
                placeholder="0,00"
              />
              {form.formState.errors.preco_venda && (
                <p className="text-sm text-red-600">{form.formState.errors.preco_venda.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estoque_minimo">Estoque Mínimo *</Label>
              <Input
                id="estoque_minimo"
                type="number"
                step="1"
                min="0"
                {...form.register('estoque_minimo', { valueAsNumber: true })}
                placeholder="0"
              />
              {form.formState.errors.estoque_minimo && (
                <p className="text-sm text-red-600">{form.formState.errors.estoque_minimo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...form.register('ativo')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Ativo
              </Label>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar Exclusão"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        }
      >
        <p className="text-gray-600">
          Tem certeza que deseja excluir o produto <strong>{deleteConfirm?.nome}</strong>?
          Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </div>
  );
}