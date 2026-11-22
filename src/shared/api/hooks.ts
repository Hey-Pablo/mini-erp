import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './client';
import type { Cliente, Pedido, ItemPedido, PedidoComItens } from '../types';

// Cliente hooks
export function useClientes(empresaId: string, search?: string, page?: number, pageSize?: number) {
  return useQuery({
    queryKey: ['clientes', empresaId, search, page, pageSize],
    queryFn: async (): Promise<{data: Cliente[], total: number}> => {
      let query = supabase.from('clientes');

      if (search) {
        // @ts-expect-error - Postgrest types don't include .or() but it exists at runtime
        query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query.select('*');
      if (error) throw error;
      return { data: data || [], total: (data || []).length };
    },
    enabled: !!empresaId,
  });
}

export function useCreateCliente() {
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
        // @ts-expect-error - Postgrest types don't include .or() but it exists at runtime
        query = query.or(`nome.ilike.%${search}%,codigo.ilike.%${search}%`);
      }

      const { data, error } = await query.select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });
}

// Pedido hooks
export function usePedidos(empresaId: string, search?: string, page?: number, pageSize?: number) {
  return useQuery({
    queryKey: ['pedidos', empresaId, search, page, pageSize],
    queryFn: async (): Promise<{data: PedidoComItens[], total: number}> => {
      let query = supabase
        .from('pedidos')
        .select(`
          *,
          itens_pedido (
            *,
            produtos (id, nome, codigo, preco_venda, unidade)
          )
        `)
        .order('criado_em', { ascending: false });

      if (search) {
        query = query.or(`cliente.ilike.%${search}%,id.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data: (data || []) as unknown as PedidoComItens[], total: (data || []).length };
    },
    enabled: !!empresaId,
  });
}

export function usePedido(empresaId: string, pedidoId: string) {
  return useQuery({
    queryKey: ['pedido', empresaId, pedidoId],
    queryFn: async (): Promise<PedidoComItens | null> => {
      const { data, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          itens_pedido (
            *,
            produtos (id, nome, codigo, preco_venda, unidade)
          )
        `)
        .eq('id', pedidoId)
        .eq('empresa_id', empresaId)
        .single();
      if (error) throw error;
      return data as unknown as PedidoComItens;
    },
    enabled: !!empresaId && !!pedidoId,
  });
}

export function useCreatePedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ empresaId, pedido, itens }: { empresaId: string; pedido: Omit<Pedido, 'empresa_id' | 'id' | 'status' | 'criado_em'>; itens: Omit<ItemPedido, 'empresa_id' | 'pedido_id'>[] }) => {
      // Inserir pedido
      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({ ...pedido, empresa_id: empresaId, status: 'aberto' })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // Inserir itens
      const itensComPedido = itens.map(item => ({
        ...item,
        empresa_id: empresaId,
        pedido_id: pedidoData.id,
      }));

      const { error: itensError } = await supabase.from('itens_pedido').insert(itensComPedido);
      if (itensError) throw itensError;

      return pedidoData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
  });
}

export function useFaturarPedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ empresaId, pedidoId }: { empresaId: string; pedidoId: string }) => {
      const { error } = await supabase.rpc('faturar_pedido', {
        p_empresa: empresaId,
        p_pedido: pedidoId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
  });
}

export function useCancelarPedido() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ empresaId, pedidoId }: { empresaId: string; pedidoId: string }) => {
      const { error } = await supabase.rpc('cancelar_pedido', {
        p_empresa: empresaId,
        p_pedido: pedidoId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    },
  });
}