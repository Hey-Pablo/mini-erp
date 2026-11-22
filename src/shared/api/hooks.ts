import { useQuery } from '@tanstack/react-query';
import { supabase } from './client';
import type { Cliente, Fornecedor, Produto } from '../types';

// Cliente hooks
export function useClientes(empresaId: string, search?: string, page?: number, pageSize?: number) {
  return useQuery({
    queryKey: ['clientes', empresaId, search, page, pageSize],
    queryFn: async (): Promise<{data: Cliente[], total: number}> => {
      let query = supabase.from('clientes');

      if (search) {
        query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query.select('*');
      if (error) throw error;
      return { data: data || [], total: (data || []).length };
    },
    enabled: !!empresaId,
  });
}

export function useCreateCliente(empresaId: string) {
  // Implementação placeholder - usar mutation quando tivermos a tabela criada
  return { mutate: async () => {} };
}

// Fornecedor hooks
export function useFornecedores(empresaId: string) {
  return useQuery({
    queryKey: ['fornecedores', empresaId],
    queryFn: async () => {
      const { data, error } = await supabase.from('fornecedores').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });
}

// Produto hooks
export function useProdutos(empresaId: string, search?: string) {
  return useQuery({
    queryKey: ['produtos', empresaId, search],
    queryFn: async () => {
      let query = supabase.from('produtos');

      if (search) {
        query = query.or(`nome.ilike.%${search}%,codigo.ilike.%${search}%`);
      }

      const { data, error } = await query.select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });
}