import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../shared/supabase';
import { useEmpresa } from '../../../shared/hooks';
import { Button, Input, Label, Select, Card, CardHeader, CardTitle, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal } from '../../../shared/ui';
import { Plus, Search, Edit, Trash2, Eye, Building } from 'lucide-react';
import { cn, formatDocumento, isValidCpf, isValidCnpj } from '../../../shared/utils';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Fornecedor } from '../../../shared/types';

const fornecedorSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  documento: z.string().min(11, 'CPF/CNPJ inválido'),
  tipo_documento: z.enum(['cpf', 'cnpj']),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().length(2, 'UF deve ter 2 caracteres').optional().or(z.literal('')),
  cep: z.string().optional(),
});

type FornecedorFormData = z.infer<typeof fornecedorSchema>;

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

async function fetchFornecedores(empresaId: string, search: string) {
  let query = supabase
    .from('fornecedores')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
    .order('nome');

  if (search) {
    query = query.or(`nome.ilike.%${search}%,documento.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Fornecedor[];
}

async function createFornecedor(fornecedor: Omit<Fornecedor, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('fornecedores')
    .insert([{ ...fornecedor, ativo: true }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateFornecedor(id: string, fornecedor: Partial<Fornecedor>) {
  const { data, error } = await supabase
    .from('fornecedores')
    .update({ ...fornecedor, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteFornecedor(id: string) {
  const { error } = await supabase
    .from('fornecedores')
    .update({ ativo: false, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export function CadastrosFornecedores() {
  const { empresa, perfil } = useEmpresa();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Fornecedor | null>(null);

  const { data: fornecedores = [], isLoading } = useQuery({
    queryKey: ['fornecedores', empresa?.id, search],
    queryFn: () => fetchFornecedores(empresa!.id, search),
    enabled: !!empresa?.id,
  });

  const createMutation = useMutation({
    mutationFn: createFornecedor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      setModalOpen(false);
      setEditingFornecedor(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Fornecedor> }) => updateFornecedor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      setModalOpen(false);
      setEditingFornecedor(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFornecedor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      setDeleteConfirm(null);
    },
  });

  const form = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: {
      nome: '',
      documento: '',
      tipo_documento: 'cnpj',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      uf: '',
      cep: '',
    },
  });

  const handleOpenModal = (fornecedor?: Fornecedor) => {
    if (fornecedor) {
      setEditingFornecedor(fornecedor);
      form.reset({
        nome: fornecedor.nome,
        documento: fornecedor.documento,
        tipo_documento: fornecedor.tipo_documento,
        email: fornecedor.email || '',
        telefone: fornecedor.telefone || '',
        endereco: fornecedor.endereco || '',
        cidade: fornecedor.cidade || '',
        uf: fornecedor.uf || '',
        cep: fornecedor.cep || '',
      });
    } else {
      setEditingFornecedor(null);
      form.reset({
        nome: '',
        documento: '',
        tipo_documento: 'cnpj',
        email: '',
        telefone: '',
        endereco: '',
        cidade: '',
        uf: '',
        cep: '',
      });
    }
    setModalOpen(true);
  };

  const onSubmit = async (data: FornecedorFormData) => {
    const cleanedDoc = data.documento.replace(/\D/g, '');

    if (data.tipo_documento === 'cpf' && !isValidCpf(cleanedDoc)) {
      form.setError('documento', { message: 'CPF inválido' });
      return;
    }
    if (data.tipo_documento === 'cnpj' && !isValidCnpj(cleanedDoc)) {
      form.setError('documento', { message: 'CNPJ inválido' });
      return;
    }

    const fornecedorData = {
      ...data,
      documento: cleanedDoc,
      empresa_id: empresa!.id,
    };

    if (editingFornecedor) {
      updateMutation.mutate({ id: editingFornecedor.id, data: fornecedorData });
    } else {
      createMutation.mutate(fornecedorData);
    }
  };

  const handleDelete = (fornecedor: Fornecedor) => {
    setDeleteConfirm(fornecedor);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id);
    }
  };

  const canManage = perfil?.papel === 'administrador' || perfil?.papel === 'estoque';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
          <p className="text-gray-500">Gerencie os fornecedores da empresa</p>
        </div>
        {canManage && (
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4" />
            Novo Fornecedor
          </Button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Buscar por nome ou documento..."
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
              <p className="mt-2 text-gray-500">Carregando fornecedores...</p>
            </div>
          ) : fornecedores.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Nenhum fornecedor encontrado</p>
              {canManage && (
                <Button variant="ghost" className="mt-2" onClick={() => handleOpenModal()}>
                  Cadastrar primeiro fornecedor
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Cidade/UF</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fornecedores.map((fornecedor) => (
                    <TableRow key={fornecedor.id}>
                      <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                      <TableCell>
                        {formatDocumento(fornecedor.documento, fornecedor.tipo_documento)}
                        <Badge variant="info" className="ml-2 text-xs">
                          {fornecedor.tipo_documento.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{fornecedor.email || '-'}</TableCell>
                      <TableCell>{fornecedor.telefone || '-'}</TableCell>
                      <TableCell>
                        {fornecedor.cidade && fornecedor.uf
                          ? `${fornecedor.cidade}/${fornecedor.uf}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenModal(fornecedor)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canManage && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleOpenModal(fornecedor)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(fornecedor)}>
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </>
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
        onClose={() => { setModalOpen(false); setEditingFornecedor(null); form.reset(); }}
        title={editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setModalOpen(false); setEditingFornecedor(null); form.reset(); }}>
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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                {...form.register('nome')}
                placeholder="Nome completo ou razão social"
              />
              {form.formState.errors.nome && (
                <p className="text-sm text-red-600">{form.formState.errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_documento">Tipo *</Label>
              <Select
                id="tipo_documento"
                {...form.register('tipo_documento')}
                onValueChange={(value) => form.setValue('tipo_documento', value as 'cpf' | 'cnpj')}
              >
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documento">CPF/CNPJ *</Label>
              <Input
                id="documento"
                {...form.register('documento')}
                placeholder={form.watch('tipo_documento') === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
              />
              {form.formState.errors.documento && (
                <p className="text-sm text-red-600">{form.formState.errors.documento.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                placeholder="fornecedor@email.com"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                {...form.register('telefone')}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                {...form.register('endereco')}
                placeholder="Rua, número, complemento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                {...form.register('cidade')}
                placeholder="Cidade"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uf">UF</Label>
              <Select
                id="uf"
                {...form.register('uf')}
              >
                <option value="">Selecione</option>
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                {...form.register('cep')}
                placeholder="00000-000"
              />
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
          Tem certeza que deseja excluir o fornecedor <strong>{deleteConfirm?.nome}</strong>?
          Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </div>
  );
}