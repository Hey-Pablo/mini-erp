import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { Cliente, Fornecedor, Produto, BuscaParametros } from './types';

// Clientes
export function useClientes(params: BuscaParametros = {}) {
  return useQuery({
    queryKey: ['clientes', params],
    queryFn: () => apiClient.getClientes(params),
  });
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: () => apiClient.getCliente(id),
    enabled: !!id,
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cliente: Omit<Cliente, 'id' | 'criado_em' | 'atualizado_em'>) =>
      apiClient.createCliente(cliente),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, cliente }: { id: string; cliente: Partial<Cliente> }) =>
      apiClient.updateCliente(id, cliente),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['cliente', variables.id] });
    },
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteCliente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

// Fornecedores
export function useFornecedores(params: BuscaParametros = {}) {
  return useQuery({
    queryKey: ['fornecedores', params],
    queryFn: () => apiClient.getFornecedores(params),
  });
}

// Produtos
export function useProdutos(params: BuscaParametros = {}) {
  return useQuery({
    queryKey: ['produtos', params],
    queryFn: () => apiClient.getProdutos(params),
  });
}