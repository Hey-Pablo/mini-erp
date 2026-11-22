import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useClientes, useCreateCliente } from '@/shared/api/hooks';
import { SearchInput } from '@/shared/ui/SearchInput';
import { Pagination } from '@/shared/ui/Pagination';
import { Button } from '@/shared/ui/Button';
import { Trash2, Edit, Plus } from 'lucide-react';
import { validarDocumento } from '@/shared/validators';
import type { Cliente } from '@/shared/api/types';

const clienteSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  tipo_pessoa: z.enum(['F', 'J']),
  cpf_cnpj: z.string().min(14, 'Documento inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional().or(z.literal('')),
  ativo: z.boolean().default(true),
}).superRefine((data, ctx) => {
  const { valido, tipo } = validarDocumento(data.cpf_cnpj);

  if (!valido) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: tipo === 'invalido' ? 'Documento inválido' : `CNPJ ${tipo.toUpperCase()}` + (tipo === 'cpf' ? ' inválido' : ' inválido'),
      path: ['cpf_cnpj'],
    });
  } else if (tipo === 'cpf' && data.tipo_pessoa !== 'F') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'CPF deve ser usado para pessoa física',
      path: ['tipo_pessoa'],
    });
  } else if (tipo === 'cnpj' && data.tipo_pessoa !== 'J') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'CNPJ deve ser usado para pessoa jurídica',
      path: ['tipo_pessoa'],
    });
  }
});

type ClienteFormData = z.infer<typeof clienteSchema>;

export function ClientesPage() {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [termoBusca, setTermoBusca] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const { data, isLoading, error } = useClientes({
    pagina: paginaAtual,
    por_pagina: 10,
    termo: termoBusca || undefined,
  });

  const { mutate: createCliente, isPending } = useCreateCliente();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      tipo_pessoa: 'F',
      ativo: true,
    },
  });

  const tipoPessoa = watch('tipo_pessoa');

  const onSubmit = async (dados: ClienteFormData) => {
    try {
      await createCliente(dados);
      setMostrarFormulario(false);
      reset();
    } catch (e) {
      console.error('Erro ao criar cliente:', e);
    }
  };

  const handleExcluir = async (id: string) => {
    if (confirm('Deseja realmente excluir este cliente?')) {
      // TODO: Implementar exclusão
      console.log('Excluir cliente:', id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-8">Carregando...</div>
      </div>
    );
  }

  const clientes = data?.data || [];
  const paginacao = data
    ? {
        total: data.total,
        totalPaginas: data.total_paginas,
        paginaAtual,
      }
    : { total: 0, totalPaginas: 0, paginaAtual: 1 };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <Button
          onClick={() => setMostrarFormulario(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
          Erro ao carregar clientes: {String(error)}
        </div>
      )}

      <div className="mb-4">
        <SearchInput
          value={termoBusca}
          onSearch={setTermoBusca}
          placeholder="Buscar por nome ou CPF/CNPJ..."
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CPF/CNPJ
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ativo
              </th>
              <th className="relative px-4 py-3">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-3 text-center text-gray-500">
                  Nenhum cliente encontrado
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {cliente.nome}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {cliente.tipo_pessoa === 'F' ? 'Física' : 'Jurídica'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono text-xs">
                    {cliente.cpf_cnpj}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {cliente.email || '-'}
                  </td>
                  <td className="px-4 py-3">
                    {cliente.ativo ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => console.log('Editar cliente:', cliente.id)}
                        className="rounded-full p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleExcluir(cliente.id)}
                        className="rounded-full p-1 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        paginaAtual={paginacao.paginaAtual}
        totalPaginas={paginacao.totalPaginas}
        totalItens={paginacao.total}
        itensPorPagina={10}
        onMudarPagina={setPaginaAtual}
      />

      {/* Modal de Novo Cliente */}
      {mostrarFormulario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Novo Cliente</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  {...register('tipo_pessoa')}
                  className="w-full rounded-md border-gray-300 focus:ring-primary-500"
                >
                  <option value="F">Pessoa Física</option>
                  <option value="J">Pessoa Jurídica</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome/Razão Social
                </label>
                <input
                  {...register('nome')}
                  type="text"
                  placeholder={tipoPessoa === 'F' ? 'Nome completo' : 'Razão social'}
                  className="w-full rounded-md border-gray-300 focus:ring-primary-500"
                />
                {errors.nome && (
                  <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tipoPessoa === 'F' ? 'CPF' : 'CNPJ'}
                </label>
                <input
                  {...register('cpf_cnpj')}
                  type="text"
                  placeholder={tipoPessoa === 'F' ? '000.000.000-00' : '00.000.000/0001-00'}
                  className="w-full rounded-md border-gray-300 focus:ring-primary-500"
                />
                {errors.cpf_cnpj && (
                  <p className="mt-1 text-sm text-red-600">{errors.cpf_cnpj.message}</p>
                )}
              </div>

              <Button type="submit" loading={isPending} className="w-full">
                Salvar
              </Button>
            </form>

            <Button
              variant="ghost"
              onClick={() => setMostrarFormulario(false)}
              className="mt-2 w-full"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}