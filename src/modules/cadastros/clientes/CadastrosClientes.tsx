import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../shared/supabase';
import { useEmpresa } from '../../../shared/hooks';
import { Button, Input, Label, Select, Card, CardHeader, CardTitle, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Modal } from '../../../shared/ui';
import { Plus, Search, Edit, Trash2, Eye, Filter, X } from 'lucide-react';
import { cn, formatDocumento, isValidCpf, isValidCnpj } from '../../../shared/utils';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Cliente } from '../../../shared/types';

const clienteSchema = z.object({
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

type ClienteFormData = z.infer<typeof clienteSchema>;

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

async function fetchClientes(empresaId: string, search: string) {
  let query = supabase
    .from('clientes')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
    .order('nome');

  if (search) {
    query = query.or(`nome.ilike.%${search}%,documento.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Cliente[];
}

async function createCliente(cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('clientes')
    .insert([{ ...cliente, ativo: true }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateCliente(id: string, cliente: Partial<Cliente>) {
  const { data, error } = await supabase
    .from('clientes')
    .update({ ...cliente, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteCliente(id: string) {
  const { error } = await supabase
    .from('clientes')
    .update({ ativo: false, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export function CadastrosClientes() {
  const { empresa, perfil } = useEmpresa();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Cliente | null>(null);

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ['clientes', empresa?.id, search],
    queryFn: () => fetchClientes(empresa!.id, search),
    enabled: !!empresa?.id,
  });

  const createMutation = useMutation({
    mutationFn: createCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setModalOpen(false);
      setEditingCliente(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Cliente> }) => updateCliente(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setModalOpen(false);
      setEditingCliente(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setDeleteConfirm(null);
    },
  });

  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: '',
      documento: '',
      tipo_documento: 'cpf',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      uf: '',
      cep: '',
    },
  });

  const handleOpenModal = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente);
      form.reset({
        nome: cliente.nome,
        documento: cliente.documento,
        tipo_documento: cliente.tipo_documento,
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        endereco: cliente.endereco || '',
        cidade: cliente.cidade || '',
        uf: cliente.uf || '',
        cep: cliente.cep || '',
      });
    } else {
      setEditingCliente(null);
      form.reset({
        nome: '',
        documento: '',
        tipo_documento: 'cpf',
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

  const onSubmit = async (data: ClienteFormData) => {
    const cleanedDoc = data.documento.replace(/\D/g, '');

    if (data.tipo_documento === 'cpf' && !isValidCpf(cleanedDoc)) {
      form.setError('documento', { message: 'CPF inválido' });
      return;
    }
    if (data.tipo_documento === 'cnpj' && !isValidCnpj(cleanedDoc)) {
      form.setError('documento', { message: 'CNPJ inválido' });
      return;
    }

    const clienteData = {
      ...data,
      documento: cleanedDoc,
      empresa_id: empresa!.id,
    };

    if (editingCliente) {
      updateMutation.mutate({ id: editingCliente.id, data: clienteData });
    } else {
      createMutation.mutate(clienteData);
    }
  };

  const handleDelete = (cliente: Cliente) => {
    setDeleteConfirm(cliente);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id);
    }
  };

  const canManage = perfil?.papel === 'administrador' || perfil?.papel === 'vendas';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500">Gerencie os clientes da empresa</p>
        </div>
        {canManage && (
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4" />
            Novo Cliente
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Buscar por nome ou documento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-2 text-gray-500">Carregando clientes...</p>
            </div>
          ) : clientes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Nenhum cliente encontrado</p>
              {canManage && (
                <Button variant="ghost" className="mt-2" onClick={() => handleOpenModal()}>
                  Cadastrar primeiro cliente
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
                  {clientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>
                        {formatDocumento(cliente.documento, cliente.tipo_documento)}
                        <Badge variant="info" className="ml-2 text-xs">
                          {cliente.tipo_documento.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{cliente.email || '-'}</TableCell>
                      <TableCell>{cliente.telefone || '-'}</TableCell>
                      <TableCell>
                        {cliente.cidade && cliente.uf
                          ? `${cliente.cidade}/${cliente.uf}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenModal(cliente)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canManage && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleOpenModal(cliente)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(cliente)}>
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

      {/* Modal Form */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingCliente(null); form.reset(); }}
        title={editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setModalOpen(false); setEditingCliente(null); form.reset(); }}>
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
                placeholder="cliente@email.com"
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

      {/* Delete Confirm Modal */}
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
          Tem certeza que deseja excluir o cliente <strong>{deleteConfirm?.nome}</strong>?
          Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </div>
  );
}